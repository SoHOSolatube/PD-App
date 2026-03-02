import { NextResponse } from 'next/server';
import {
    collection,
    getDocs,
    query,
    where,
    updateDoc,
    doc,
    addDoc,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

/**
 * SendGrid Webhook - Email Events
 *
 * SendGrid sends POST requests when email events occur (unsubscribe, bounce, spam report).
 * Processes suppression events and updates contact records.
 *
 * Set this URL in SendGrid Event Webhook: https://yourdomain.com/api/webhooks/sendgrid
 */
export async function POST(request: Request) {
    try {
        const events = await request.json();

        if (!Array.isArray(events)) {
            return NextResponse.json({ error: 'Expected array of events' }, { status: 400 });
        }

        const suppressionEvents = ['unsubscribe', 'group_unsubscribe', 'spamreport', 'bounce'];
        let processed = 0;

        for (const event of events) {
            const eventType = event.event || '';
            const email = event.email || '';

            if (!suppressionEvents.includes(eventType) || !email) continue;

            console.log(`[SENDGRID WEBHOOK] ${eventType} for ${email}`);
            processed++;

            // Find contact by email and update optOutEmail flag
            const contactsQuery = query(
                collection(db, 'contacts'),
                where('email', '==', email)
            );
            const contactSnap = await getDocs(contactsQuery);
            for (const contactDoc of contactSnap.docs) {
                await updateDoc(doc(db, 'contacts', contactDoc.id), {
                    optOutEmail: true,
                });
            }

            // Find prospect by email and update optOutEmail flag
            const prospectsQuery = query(
                collection(db, 'prospects'),
                where('email', '==', email)
            );
            const prospectSnap = await getDocs(prospectsQuery);
            for (const prospectDoc of prospectSnap.docs) {
                await updateDoc(doc(db, 'prospects', prospectDoc.id), {
                    optOutEmail: true,
                });
            }

            // Add to suppression list
            await addDoc(collection(db, 'suppression'), {
                contactOrProspectId: contactSnap.docs[0]?.id || prospectSnap.docs[0]?.id || '',
                type: contactSnap.docs.length > 0 ? 'contact' : 'prospect',
                channel: 'email',
                identifier: email,
                optedOutAt: serverTimestamp(),
                source: 'sendgrid',
            });
        }

        return NextResponse.json({ processed });
    } catch (error) {
        console.error('[SENDGRID WEBHOOK] Error:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}
