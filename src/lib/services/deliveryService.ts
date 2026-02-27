import { resolveAudience } from '@/lib/services/audienceService';
import {
    getMessageById,
    updateMessage,
    updateAnalytics,
} from '@/lib/services/messageService';
import type { Contact } from '@/types';

/**
 * Delivery Service (Stubbed)
 *
 * Currently logs to console instead of calling Twilio/SendGrid.
 * When API keys are configured in Settings, these stubs will be
 * replaced with actual API calls.
 */

export async function sendSms(to: string, content: string): Promise<boolean> {
    // TODO: Replace with Twilio API call when configured
    console.log(`[SMS STUB] To: ${to} | Content: ${content.slice(0, 50)}…`);
    // Simulate 95% success rate
    return Math.random() > 0.05;
}

export async function sendEmail(
    to: string,
    subject: string,
    html: string
): Promise<boolean> {
    // TODO: Replace with SendGrid API call when configured
    console.log(`[EMAIL STUB] To: ${to} | Subject: ${subject}`);
    return Math.random() > 0.05;
}

/**
 * Broadcast a message to its audience.
 * Resolves audience → loops contacts → calls send stubs → updates analytics.
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
                message.emailHtml || ''
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
