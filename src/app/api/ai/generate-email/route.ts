import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { skillId, prompt } = await request.json();

        if (!skillId || !prompt) {
            return NextResponse.json(
                { error: 'skillId and prompt are required' },
                { status: 400 }
            );
        }

        // TODO: Fetch OpenAI API key from Firestore settings
        // TODO: Fetch skill prompt from Firestore skills collection
        // TODO: Call OpenAI API to generate email HTML

        // For now, return a stub response
        return NextResponse.json(
            {
                error:
                    'OpenAI integration not yet configured. Add your API key in Settings → API Connections.',
            },
            { status: 501 }
        );
    } catch {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
