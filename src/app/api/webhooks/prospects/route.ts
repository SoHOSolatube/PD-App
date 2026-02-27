import { NextResponse } from 'next/server';

/**
 * Prospect Webhook
 *
 * Creates a prospect from an external source (website form, third-party integration).
 * POST /api/webhooks/prospects
 *
 * Expected body: { name, email, phone?, businessType?, message?, source? }
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, phone, businessType, message, source } = body;

        if (!name || !email) {
            return NextResponse.json(
                { error: 'name and email are required' },
                { status: 400 }
            );
        }

        console.log(`[PROSPECT WEBHOOK] New prospect: ${name} (${email}) from ${source || 'unknown'}`);

        // In production: import and call createProspect from prospectService
        // This is a server-side API route, so we'd need Firebase Admin SDK
        // For now, log the data
        const prospectData = {
            name,
            email,
            phone: phone || '',
            businessType: businessType || null,
            currentPlaybookStep: 0,
            qualificationStatus: 'new',
            conversationMode: 'auto',
            tags: [source ? `source:${source}` : 'webhook-lead'],
            collectedData: message ? { initialMessage: message } : {},
            optOutEmail: false,
            optOutSms: false,
        };

        console.log('[PROSPECT WEBHOOK] Data:', JSON.stringify(prospectData));

        return NextResponse.json({
            success: true,
            message: `Prospect "${name}" received`,
        });
    } catch (error) {
        console.error('[PROSPECT WEBHOOK] Error:', error);
        return NextResponse.json({ error: 'Failed to process prospect' }, { status: 500 });
    }
}
