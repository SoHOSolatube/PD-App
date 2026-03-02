import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

/**
 * Scheduled function that runs every minute to process scheduled messages.
 * Queries messages with status 'scheduled' and scheduledAt <= now,
 * then triggers delivery for each.
 */
export const processScheduledMessages = functions.pubsub
    .schedule('every 1 minutes')
    .onRun(async () => {
        const now = admin.firestore.Timestamp.now();

        const snapshot = await db
            .collection('messages')
            .where('status', '==', 'scheduled')
            .where('scheduledAt', '<=', now)
            .get();

        if (snapshot.empty) return null;

        console.log(`[SCHEDULER] Found ${snapshot.size} message(s) to send`);

        const batch = db.batch();
        for (const doc of snapshot.docs) {
            batch.update(doc.ref, { status: 'sending' });
        }
        await batch.commit();

        // Process each message
        for (const msgDoc of snapshot.docs) {
            try {
                const data = msgDoc.data();
                const audience = data.audience || {};
                let contacts: { phone?: string; email?: string; name?: string; optOutSms?: boolean; optOutEmail?: boolean }[] = [];

                // Resolve audience
                if (audience.type === 'all') {
                    const contactSnap = await db.collection('contacts').get();
                    contacts = contactSnap.docs.map((d: admin.firestore.QueryDocumentSnapshot) => d.data());
                } else if (audience.type === 'categories' && audience.categories?.length) {
                    const contactSnap = await db.collection('contacts')
                        .where('categories', 'array-contains-any', audience.categories)
                        .get();
                    contacts = contactSnap.docs.map((d: admin.firestore.QueryDocumentSnapshot) => d.data());
                }

                let smsDelivered = 0, smsTotal = 0, emailDelivered = 0, emailTotal = 0;

                // Get API settings
                const settingsDoc = await db.doc('settings/api').get();
                const settings = settingsDoc.exists ? settingsDoc.data() : null;
                const twilio = settings?.twilio || {};
                const sendgrid = settings?.sendgrid || {};

                for (const contact of contacts) {
                    // SMS
                    if ((data.channel === 'sms' || data.channel === 'both') && contact.phone && !contact.optOutSms) {
                        smsTotal++;
                        if (twilio.accountSid && twilio.authToken && twilio.fromNumber) {
                            try {
                                const url = `https://api.twilio.com/2010-04-01/Accounts/${twilio.accountSid}/Messages.json`;
                                const body = new URLSearchParams({
                                    To: contact.phone,
                                    From: twilio.fromNumber,
                                    Body: replaceMergeTags(data.smsContent || '', contact),
                                });
                                const res = await fetch(url, {
                                    method: 'POST',
                                    headers: {
                                        Authorization: 'Basic ' + Buffer.from(`${twilio.accountSid}:${twilio.authToken}`).toString('base64'),
                                        'Content-Type': 'application/x-www-form-urlencoded',
                                    },
                                    body: body.toString(),
                                });
                                if (res.ok) smsDelivered++;
                            } catch (err) {
                                console.error('[SCHEDULER SMS]', err);
                            }
                        } else {
                            console.log(`[SCHEDULER SMS STUB] To: ${contact.phone}`);
                            smsDelivered++;
                        }
                    }

                    // Email
                    if ((data.channel === 'email' || data.channel === 'both') && contact.email && !contact.optOutEmail) {
                        emailTotal++;
                        if (sendgrid.apiKey && sendgrid.fromEmail) {
                            try {
                                const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
                                    method: 'POST',
                                    headers: {
                                        Authorization: `Bearer ${sendgrid.apiKey}`,
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        personalizations: [{ to: [{ email: contact.email }] }],
                                        from: { email: sendgrid.fromEmail },
                                        subject: data.subject || 'Message',
                                        content: [{ type: 'text/html', value: replaceMergeTags(data.emailHtml || '', contact) }],
                                    }),
                                });
                                if (res.ok) emailDelivered++;
                            } catch (err) {
                                console.error('[SCHEDULER EMAIL]', err);
                            }
                        } else {
                            console.log(`[SCHEDULER EMAIL STUB] To: ${contact.email}`);
                            emailDelivered++;
                        }
                    }
                }

                // Update message with final status and analytics
                await msgDoc.ref.update({
                    status: 'sent',
                    sentAt: admin.firestore.FieldValue.serverTimestamp(),
                    analytics: { smsDelivered, smsTotal, emailDelivered, emailTotal },
                });

                console.log(`[SCHEDULER] Message ${msgDoc.id} sent: SMS ${smsDelivered}/${smsTotal}, Email ${emailDelivered}/${emailTotal}`);
            } catch (err) {
                console.error(`[SCHEDULER] Failed for message ${msgDoc.id}:`, err);
                await msgDoc.ref.update({ status: 'failed' });
            }
        }

        return null;
    });

/**
 * Scheduled function that runs every 5 minutes to process event notification sequences.
 * For each published event, checks if any notification step should fire based on timing.
 */
export const processEventNotifications = functions.pubsub
    .schedule('every 5 minutes')
    .onRun(async () => {
        const now = new Date();

        const eventsSnap = await db
            .collection('events')
            .where('status', '==', 'published')
            .get();

        if (eventsSnap.empty) return null;

        for (const eventDoc of eventsSnap.docs) {
            const event = eventDoc.data();
            const eventDate = event.dateTime?.toDate?.() || null;
            if (!eventDate) continue;

            const steps: Array<{
                id: string;
                channel: string;
                timing: string;
                timingValue: number;
                timingUnit: string;
                audience: string;
                customContent?: string;
                fired?: boolean;
            }> = event.notificationSequence || [];

            for (const step of steps) {
                if (step.fired) continue;

                const offset = getOffsetMs(step.timingValue, step.timingUnit);
                const sendTime = step.timing === 'before'
                    ? new Date(eventDate.getTime() - offset)
                    : new Date(eventDate.getTime() + offset);

                if (now >= sendTime) {
                    console.log(`[EVENT NOTIF] Firing step ${step.id} for event ${eventDoc.id}`);

                    // Get contacts based on audience
                    let contacts: { phone?: string; email?: string; name?: string; optOutSms?: boolean; optOutEmail?: boolean }[] = [];

                    if (step.audience === 'registered') {
                        const regSnap = await db.collection('events').doc(eventDoc.id).collection('registrations').get();
                        const contactIds = regSnap.docs.map((d: FirebaseFirestore.QueryDocumentSnapshot) => d.data().contactId).filter(Boolean);
                        for (const cid of contactIds) {
                            const cDoc = await db.doc(`contacts/${cid}`).get();
                            if (cDoc.exists) contacts.push(cDoc.data()!);
                        }
                    } else {
                        const allContacts = await db.collection('contacts').get();
                        contacts = allContacts.docs.map((d: FirebaseFirestore.QueryDocumentSnapshot) => d.data());
                    }

                    const content = step.customContent || `Reminder: ${event.title} is ${step.timing === 'before' ? 'coming up' : 'happening now'}!`;

                    // Get API settings
                    const settingsDoc = await db.doc('settings/api').get();
                    const settings = settingsDoc.exists ? settingsDoc.data() : null;

                    // Send notifications (simplified — reuses same pattern as scheduled messages)
                    for (const contact of contacts) {
                        if ((step.channel === 'sms' || step.channel === 'both') && contact.phone && !contact.optOutSms) {
                            const twilio = settings?.twilio || {};
                            if (twilio.accountSid && twilio.authToken && twilio.fromNumber) {
                                try {
                                    await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilio.accountSid}/Messages.json`, {
                                        method: 'POST',
                                        headers: {
                                            Authorization: 'Basic ' + Buffer.from(`${twilio.accountSid}:${twilio.authToken}`).toString('base64'),
                                            'Content-Type': 'application/x-www-form-urlencoded',
                                        },
                                        body: new URLSearchParams({
                                            To: contact.phone,
                                            From: twilio.fromNumber,
                                            Body: replaceMergeTags(content, contact),
                                        }).toString(),
                                    });
                                } catch (err) {
                                    console.error('[EVENT NOTIF SMS]', err);
                                }
                            }
                        }
                        if ((step.channel === 'email' || step.channel === 'both') && contact.email && !contact.optOutEmail) {
                            const sendgrid = settings?.sendgrid || {};
                            if (sendgrid.apiKey && sendgrid.fromEmail) {
                                try {
                                    await fetch('https://api.sendgrid.com/v3/mail/send', {
                                        method: 'POST',
                                        headers: {
                                            Authorization: `Bearer ${sendgrid.apiKey}`,
                                            'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({
                                            personalizations: [{ to: [{ email: contact.email }] }],
                                            from: { email: sendgrid.fromEmail },
                                            subject: `Event: ${event.title}`,
                                            content: [{ type: 'text/html', value: `<p>${replaceMergeTags(content, contact)}</p>` }],
                                        }),
                                    });
                                } catch (err) {
                                    console.error('[EVENT NOTIF EMAIL]', err);
                                }
                            }
                        }
                    }

                    // Mark step as fired
                    const updatedSteps = steps.map((s) =>
                        s.id === step.id ? { ...s, fired: true } : s
                    );
                    await eventDoc.ref.update({ notificationSequence: updatedSteps });
                }
            }
        }

        return null;
    });

function getOffsetMs(value: number, unit: string): number {
    switch (unit) {
        case 'minutes': return value * 60 * 1000;
        case 'hours': return value * 60 * 60 * 1000;
        case 'days': return value * 24 * 60 * 60 * 1000;
        case 'weeks': return value * 7 * 24 * 60 * 60 * 1000;
        default: return value * 24 * 60 * 60 * 1000;
    }
}

function replaceMergeTags(content: string, contact: Record<string, unknown>): string {
    return content
        .replace(/\{\{name\}\}/g, (contact.name as string) || '')
        .replace(/\{\{email\}\}/g, (contact.email as string) || '')
        .replace(/\{\{phone\}\}/g, (contact.phone as string) || '')
        .replace(/\{\{company\}\}/g, (contact.company as string) || '');
}
