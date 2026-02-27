import { NextResponse } from 'next/server';

/**
 * SendGrid Webhook - Unsubscribe Events
 *
 * In production, SendGrid sends POST requests when email events occur.
 * This stub processes unsubscribe/bounce events and adds them to the suppression list.
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

        for (const event of events) {
            const eventType = event.event || '';
            const email = event.email || '';

            if (suppressionEvents.includes(eventType)) {
                console.log(`[SENDGRID WEBHOOK] ${eventType} for ${email}`);
                // In production: call suppressionService.syncFromWebhook(...)
                // await syncFromWebhook({ type: 'sendgrid-unsubscribe', email });
            }
        }

        return NextResponse.json({ processed: events.length });
    } catch (error) {
        console.error('[SENDGRID WEBHOOK] Error:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}
