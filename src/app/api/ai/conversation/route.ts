import { NextResponse } from 'next/server';
import { getApiSettings } from '@/lib/services/settingsService';
import { getAllSkills } from '@/lib/services/skillService';

/**
 * AI Conversation API Route
 *
 * Generates an AI response for a prospect conversation based on
 * the current playbook step and conversation history.
 *
 * When an OpenAI API key is configured, calls the Chat Completions API
 * with the recruitment skill prompt + playbook context.
 * Falls back to canned responses when no key is available.
 *
 * POST /api/ai/conversation
 * Body: { prospectId, playbookStep, history, mode?: 'auto' | 'copilot' }
 */
export async function POST(request: Request) {
    try {
        const { playbookStep, history, mode } = await request.json();

        const step = typeof playbookStep === 'number' ? playbookStep : 0;
        const lastMessage = history?.[history.length - 1]?.content || '';
        const isCopilot = mode === 'copilot';

        // Try OpenAI first
        const settings = await getApiSettings();
        if (settings.openai.apiKey) {
            try {
                // Find a matching recruitment skill
                const skills = await getAllSkills();
                const skill = isCopilot
                    ? skills.find((s) => s.name.toLowerCase().includes('copilot'))
                    : skills.find(
                        (s) =>
                            s.name.toLowerCase().includes('recruit') ||
                            s.name.toLowerCase().includes('auto')
                    );

                const systemPrompt = skill?.prompt || getDefaultSystemPrompt(isCopilot);
                const toneNote = skill?.toneOfVoice
                    ? `\nTone: ${skill.toneOfVoice}`
                    : '';

                const messages = [
                    {
                        role: 'system',
                        content: `${systemPrompt}${toneNote}\n\nCurrent playbook step: ${step}\nYou are ${isCopilot ? 'an AI copilot suggesting responses for a human agent' : 'an AI recruitment agent talking directly to the prospect'}.`,
                    },
                    ...(history || []).slice(-8).map((msg: { sender: string; content: string }) => ({
                        role: msg.sender === 'prospect' ? 'user' : 'assistant',
                        content: msg.content,
                    })),
                ];

                if (isCopilot && lastMessage) {
                    messages.push({
                        role: 'user',
                        content: `The prospect just said: "${lastMessage}"\n\nSuggest 2-3 possible responses the human agent could use:`,
                    });
                }

                const res = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${settings.openai.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: settings.openai.model || 'gpt-4o',
                        messages,
                        max_tokens: 500,
                        temperature: 0.7,
                    }),
                });

                if (res.ok) {
                    const data = await res.json();
                    const aiResponse = data.choices?.[0]?.message?.content;
                    if (aiResponse) {
                        return NextResponse.json({ response: aiResponse, step, source: 'openai' });
                    }
                } else {
                    console.error('[AI CONVERSATION] OpenAI error:', res.status, await res.text().catch(() => ''));
                }
            } catch (err) {
                console.error('[AI CONVERSATION] OpenAI call failed:', err);
            }
        }

        // Fallback to canned responses
        const response = getCannedResponse(step, lastMessage, isCopilot);
        return NextResponse.json({ response, step, source: 'fallback' });
    } catch (error) {
        console.error('[AI CONVERSATION] Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate response' },
            { status: 500 }
        );
    }
}

function getDefaultSystemPrompt(isCopilot: boolean): string {
    if (isCopilot) {
        return `You are a helpful AI copilot assisting a human sales agent in a recruitment conversation for the Solatube Premier Dealer Program. 
Provide suggested responses that are professional, friendly, and focused on qualifying the prospect.
The playbook steps are: 0=Initial Contact, 1=Qualification Questions, 2=Product/Territory Discussion, 3=Handoff/Closing.`;
    }
    return `You are an AI recruitment agent for the Solatube International Premier Dealer Program.
Your goal is to qualify prospects through friendly, professional conversation.
Ask about their business type, service area, project volume, and experience.
The playbook steps are: 0=Initial Contact, 1=Qualification Questions, 2=Product/Territory Discussion, 3=Handoff/Closing.
Advance naturally through the steps based on the conversation flow.`;
}

function getCannedResponse(step: number, lastMessage: string, isCopilot: boolean): string {
    if (isCopilot) {
        const suggestions: Record<number, string> = {
            0: '💡 Suggested responses:\n\n1. "Thanks for your interest! Could you tell me a bit about your current contracting business?"\n\n2. "Welcome! What type of projects do you typically handle?"\n\n3. "Great to hear from you! How did you learn about our Premier Dealer Program?"',
            1: '💡 Suggested responses:\n\n1. "How many projects do you complete per month on average?"\n\n2. "What\'s your primary service area? We want to ensure good territory coverage."\n\n3. "Do you currently offer any daylighting or skylight solutions?"',
            2: '💡 Suggested responses:\n\n1. "Our dealers typically see 40-60% margins. Would you like to hear about territory availability in your area?"\n\n2. "We provide comprehensive training and ongoing support. Ready to discuss next steps?"\n\n3. "Based on your experience, I think you\'d be a great fit. Shall I introduce you to our regional manager?"',
            3: '💡 Suggested responses:\n\n1. "I\'ll connect you with our regional manager for a call this week. What times work best?"\n\n2. "You\'ve been pre-qualified! Our team will reach out within 24 hours to finalize details."\n\n3. "Great news — your territory is available. Let\'s set up an onboarding call."',
        };
        return suggestions[step] || suggestions[0];
    }

    const responses: Record<number, string[]> = {
        0: [
            lastMessage
                ? `Thanks for sharing that! I'd love to learn more. What got you interested in the daylighting industry?`
                : `Hi! Thanks for your interest in the Premier Dealer Program. I'd love to learn more about your business. What type of contracting work do you do?`,
        ],
        1: [`That's great to hear! Your experience would be a real asset. Can you tell me about your service area and typical project volume?`],
        2: [`Based on what you've shared, I think you'd be an excellent fit for our program. Our dealers typically see 40-60% margins. Would you like to discuss territory availability?`],
        3: [`Excellent! I'm going to connect you with our regional manager who can discuss territory details and next steps. They'll reach out within 24 hours.`],
    };
    const stepResponses = responses[step] || responses[0];
    return stepResponses[Math.floor(Math.random() * stepResponses.length)];
}
