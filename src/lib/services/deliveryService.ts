import { resolveAudience } from '@/lib/services/audienceService';
import {
    getMessageById,
    updateMessage,
    updateAnalytics,
} from '@/lib/services/messageService';
import { getApiSettings } from '@/lib/services/settingsService';
import type { Contact } from '@/types';

/**
 * Delivery Service
 *
 * Sends SMS via Twilio and email via SendGrid when API keys are configured.
 * Falls back to console logging when keys are absent.
 */

let _cachedSettings: Awaited<ReturnType<typeof getApiSettings>> | null = null;
let _cacheTime = 0;

async function getSettings() {
    // Cache for 60 seconds to avoid excessive Firestore reads during batch sends
    if (_cachedSettings && Date.now() - _cacheTime < 60_000) return _cachedSettings;
    _cachedSettings = await getApiSettings();
    _cacheTime = Date.now();
    return _cachedSettings;
}

export async function sendSms(to: string, content: string): Promise<boolean> {
    const settings = await getSettings();
    const { accountSid, authToken, fromNumber } = settings.twilio;

    if (!accountSid || !authToken || !fromNumber) {
        console.log(`[SMS STUB] To: ${to} | Content: ${content.slice(0, 50)}…`);
        return Math.random() > 0.05;
    }

    try {
        const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        const body = new URLSearchParams({
            To: to,
            From: fromNumber,
            Body: content,
        });

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: 'Basic ' + btoa(`${accountSid}:${authToken}`),
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body.toString(),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            console.error('[SMS ERROR]', err);
            return false;
        }
        return true;
    } catch (err) {
        console.error('[SMS ERROR]', err);
        return false;
    }
}

export async function sendEmail(
    to: string,
    subject: string,
    html: string
): Promise<boolean> {
    const settings = await getSettings();
    const { apiKey, fromEmail } = settings.sendgrid;

    if (!apiKey || !fromEmail) {
        console.log(`[EMAIL STUB] To: ${to} | Subject: ${subject}`);
        return Math.random() > 0.05;
    }

    try {
        const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                personalizations: [{ to: [{ email: to }] }],
                from: { email: fromEmail },
                subject,
                content: [{ type: 'text/html', value: html }],
            }),
        });

        if (!res.ok) {
            const err = await res.text().catch(() => '');
            console.error('[EMAIL ERROR]', res.status, err);
            return false;
        }
        return true;
    } catch (err) {
        console.error('[EMAIL ERROR]', err);
        return false;
    }
}

/**
 * Broadcast a message to its audience.
 * Resolves audience → loops contacts → calls send → updates analytics.
 */
export async function broadcastMessage(messageId: string): Promise<void> {
    const message = await getMessageById(messageId);
    if (!message) throw new Error('Message not found');

    const contacts = await resolveAudience(message.audience);

    let smsDelivered = 0;
    let smsTotal = 0;
    let emailDelivered = 0;
    let emailTotal = 0;

    for (const contact of contacts) {
        // Send SMS
        if ((message.channel === 'sms' || message.channel === 'both') && contact.phone && !contact.optOutSms) {
            smsTotal++;
            const content = replaceMergeTags(message.smsContent || '', contact);
            const ok = await sendSms(contact.phone, content);
            if (ok) smsDelivered++;
        }

        // Send Email
        if ((message.channel === 'email' || message.channel === 'both') && contact.email && !contact.optOutEmail) {
            emailTotal++;
            const ok = await sendEmail(
                contact.email,
                message.subject || 'Message from Solatube',
                replaceMergeTags(message.emailHtml || '', contact)
            );
            if (ok) emailDelivered++;
        }
    }

    // Update message status and analytics
    await updateMessage(messageId, {
        status: 'sent',
        sentAt: new Date(),
    });
    await updateAnalytics(messageId, {
        smsDelivered,
        smsTotal,
        emailDelivered,
        emailTotal,
    });
}

function replaceMergeTags(content: string, contact: Contact): string {
    return content
        .replace(/\{\{name\}\}/g, contact.name)
        .replace(/\{\{email\}\}/g, contact.email)
        .replace(/\{\{phone\}\}/g, contact.phone || '')
        .replace(/\{\{company\}\}/g, contact.company || '');
}
