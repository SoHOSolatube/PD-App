import { NextResponse } from 'next/server';
import { createConversation } from '@/lib/services/smsInboxService';
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
 * Twilio Webhook - Inbound SMS
 *
 * Twilio sends POST requests to this URL when an SMS is received.
 * Parses the payload, creates/updates SMS inbox conversations, and handles opt-outs.
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

            // Find contact by phone and update optOutSms flag
            const contactsQuery = query(
                collection(db, 'contacts'),
                where('phone', '==', from)
            );
            const contactSnap = await getDocs(contactsQuery);
            for (const contactDoc of contactSnap.docs) {
                await updateDoc(doc(db, 'contacts', contactDoc.id), {
                    optOutSms: true,
                });
            }

            // Find prospect by phone and update optOutSms flag
            const prospectsQuery = query(
                collection(db, 'prospects'),
                where('phone', '==', from)
            );
            const prospectSnap = await getDocs(prospectsQuery);
            for (const prospectDoc of prospectSnap.docs) {
                await updateDoc(doc(db, 'prospects', prospectDoc.id), {
                    optOutSms: true,
                });
            }

            // Add to suppression list
            await addDoc(collection(db, 'suppression'), {
                contactOrProspectId: contactSnap.docs[0]?.id || prospectSnap.docs[0]?.id || '',
                type: contactSnap.docs.length > 0 ? 'contact' : 'prospect',
                channel: 'sms',
                identifier: from,
                optedOutAt: serverTimestamp(),
                source: 'twilio',
            });
        }

        // Create/update SMS inbox conversation
        await createConversation(from, messageBody, 'inbound');

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
