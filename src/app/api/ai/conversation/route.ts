import { NextResponse } from 'next/server';

/**
 * AI Conversation API Route
 *
 * Generates an AI response for a prospect conversation based on
 * the current playbook step and conversation history.
 *
 * In production, this would call OpenAI / GPT-4 with the playbook
 * context as system instructions. Currently returns contextual
 * canned responses.
 *
 * POST /api/ai/conversation
 * Body: { prospectId, playbookStep, history }
 */
export async function POST(request: Request) {
    try {
        const { playbookStep, history } = await request.json();

        const step = typeof playbookStep === 'number' ? playbookStep : 0;
        const lastMessage = history?.[history.length - 1]?.content || '';

        // Contextual response based on step and last message
        let response = '';

        switch (step) {
            case 0:
                response = lastMessage
                    ? `Thanks for sharing that! I'd love to learn more. What got you interested in the daylighting industry?`
                    : `Hi! Thanks for your interest in the Premier Dealer Program. I'd love to learn more about your business. What type of contracting work do you do?`;
                break;
            case 1:
                response = `That's great to hear! Your experience would be a real asset. Can you tell me about your service area and typical project volume?`;
                break;
            case 2:
                response = `Based on what you've shared, I think you'd be an excellent fit for our program. Our dealers typically see 40-60% margins. Would you like to discuss territory availability?`;
                break;
            case 3:
                response = `Excellent! I'm going to connect you with our regional manager who can discuss territory details and next steps. They'll reach out within 24 hours.`;
                break;
            default:
                response = `Thanks for your message. Let me review your information and get back to you shortly.`;
        }

        return NextResponse.json({ response, step });
    } catch (error) {
        console.error('[AI CONVERSATION] Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate response' },
            { status: 500 }
        );
    }
}
