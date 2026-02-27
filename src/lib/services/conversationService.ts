import {
    collection,
    doc,
    getDocs,
    addDoc,
    serverTimestamp,
    query,
    orderBy,
    onSnapshot,
    Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { ProspectConversationMessage } from '@/types';
import { updateProspect } from './prospectService';

const PROSPECTS = 'prospects';
const MESSAGES_SUB = 'conversations';

function docToMessage(id: string, data: Record<string, unknown>): ProspectConversationMessage {
    return {
        id,
        prospectId: (data.prospectId as string) || '',
        sender: (data.sender as 'ai' | 'human' | 'prospect') || 'ai',
        channel: (data.channel as 'sms' | 'email') || 'sms',
        content: (data.content as string) || '',
        timestamp: (data.timestamp as Timestamp)?.toDate?.() || new Date(),
        playbookStep: data.playbookStep as number | undefined,
    };
}

// ── Messages ──

export async function getMessages(prospectId: string): Promise<ProspectConversationMessage[]> {
    const q = query(
        collection(db, PROSPECTS, prospectId, MESSAGES_SUB),
        orderBy('timestamp', 'asc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => docToMessage(d.id, d.data()));
}

export function subscribeToMessages(
    prospectId: string,
    callback: (messages: ProspectConversationMessage[]) => void
): () => void {
    const q = query(
        collection(db, PROSPECTS, prospectId, MESSAGES_SUB),
        orderBy('timestamp', 'asc')
    );
    return onSnapshot(q, (snap) => {
        callback(snap.docs.map((d) => docToMessage(d.id, d.data())));
    });
}

export async function addMessage(
    prospectId: string,
    msg: Omit<ProspectConversationMessage, 'id' | 'timestamp'>
): Promise<string> {
    const docRef = await addDoc(
        collection(db, PROSPECTS, prospectId, MESSAGES_SUB),
        {
            ...msg,
            timestamp: serverTimestamp(),
        }
    );
    // Update last activity
    await updateProspect(prospectId, {});
    return docRef.id;
}

// ── AI Response ──

export async function generateAIResponse(
    prospectId: string,
    playbookStep: number,
    history: ProspectConversationMessage[]
): Promise<string> {
    try {
        const res = await fetch('/api/ai/conversation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prospectId, playbookStep, history: history.slice(-6) }),
        });
        if (res.ok) {
            const data = await res.json();
            return data.response || getFallbackResponse(playbookStep);
        }
    } catch {
        // fall through
    }
    return getFallbackResponse(playbookStep);
}

function getFallbackResponse(step: number): string {
    const responses: Record<number, string[]> = {
        0: [
            "Hi! Thanks for your interest in the Premier Dealer Program. I'd love to learn more about your business. What type of contracting work do you do?",
            "Welcome! We're excited you're considering becoming a Premier Dealer. Could you tell me a bit about your current business?",
        ],
        1: [
            "That's great to hear! How long have you been in the industry? And what's your primary service area?",
            "Excellent background! Can you tell me about your typical project volume? How many jobs do you complete per month?",
        ],
        2: [
            "Your experience sounds impressive. Our dealers typically see 40-60% margins on installations. Would you like to hear about our territory protection program?",
            "Based on what you've shared, I think you'd be a great fit. Let me explain our training and support structure.",
        ],
        3: [
            "I'm going to connect you with our regional manager to discuss next steps. They'll reach out within 24 hours to schedule a call.",
            "You've been pre-qualified! Our team will be in touch shortly to discuss territory availability and onboarding.",
        ],
    };
    const stepResponses = responses[step] || responses[0];
    return stepResponses[Math.floor(Math.random() * stepResponses.length)];
}

// ── Handoff ──

export async function triggerHandoff(prospectId: string): Promise<void> {
    await updateProspect(prospectId, {
        conversationMode: 'human',
        qualificationStatus: 'handed-off',
    });
    await addMessage(prospectId, {
        prospectId,
        sender: 'ai',
        channel: 'sms',
        content: '🔄 This conversation has been handed off to a human agent.',
        playbookStep: undefined,
    });
}

// ── Playbook Advancement ──

export async function advancePlaybookStep(
    prospectId: string,
    currentStep: number
): Promise<void> {
    await updateProspect(prospectId, {
        currentPlaybookStep: currentStep + 1,
        qualificationStatus: currentStep >= 2 ? 'qualified' : 'in-progress',
    });
}

// ── Toggle Mode ──

export async function toggleConversationMode(
    prospectId: string,
    mode: 'auto' | 'human'
): Promise<void> {
    await updateProspect(prospectId, { conversationMode: mode });
}
