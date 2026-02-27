import { NextResponse } from 'next/server';

/**
 * Twilio Webhook - Inbound SMS
 *
 * In production, Twilio sends POST requests to this URL when an SMS is received.
 * This stub parses the Twilio payload and would create/update an SMS inbox conversation.
 *
 * Set this URL in your Twilio console: https://yourdomain.com/api/webhooks/twilio
 */
export async function POST(request: Request) {
    try {
        const body = await request.text();
        const params = new URLSearchParams(body);

        const from = params.get('From') || '';
        const messageBody = params.get('Body') || '';
        const messageSid = params.get('MessageSid') || '';

        console.log(`[TWILIO WEBHOOK] From: ${from}, Body: "${messageBody}", SID: ${messageSid}`);

        // Check for opt-out keywords
        const optOutKeywords = ['STOP', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'];
        const isOptOut = optOutKeywords.includes(messageBody.trim().toUpperCase());

        if (isOptOut) {
            console.log(`[TWILIO WEBHOOK] Opt-out detected from ${from}`);
            // In production: call suppressionService.syncFromWebhook(...)
            // await syncFromWebhook({ type: 'twilio-stop', phone: from });
        }

        // In production: create/update smsInbox conversation
        // await createConversation(from, messageBody, 'inbound');

        // Twilio expects TwiML response
        return new NextResponse(
            '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
            {
                status: 200,
                headers: { 'Content-Type': 'text/xml' },
            }
        );
    } catch (error) {
        console.error('[TWILIO WEBHOOK] Error:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}
