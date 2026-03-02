import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    query,
    orderBy,
    where,
    onSnapshot,
    Timestamp,
    limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { sendSms } from '@/lib/services/deliveryService';

// ── Types ──

export interface SmsConversation {
    id: string;
    phone: string;
    contactName?: string;
    contactId?: string;
    lastMessage: string;
    lastMessageAt: Date;
    unreadCount: number;
    direction: 'inbound' | 'outbound';
}

export interface SmsMessage {
    id: string;
    conversationId: string;
    phone: string;
    body: string;
    direction: 'inbound' | 'outbound';
    status: 'sent' | 'delivered' | 'failed' | 'received';
    createdAt: Date;
}

const CONVERSATIONS = 'smsInbox';
const MESSAGES_SUB = 'messages';

// ── Helpers ──

function docToConversation(id: string, data: Record<string, unknown>): SmsConversation {
    return {
        id,
        phone: (data.phone as string) || '',
        contactName: data.contactName as string | undefined,
        contactId: data.contactId as string | undefined,
        lastMessage: (data.lastMessage as string) || '',
        lastMessageAt: (data.lastMessageAt as Timestamp)?.toDate?.() || new Date(),
        unreadCount: (data.unreadCount as number) || 0,
        direction: (data.direction as 'inbound' | 'outbound') || 'inbound',
    };
}

function docToMessage(id: string, data: Record<string, unknown>): SmsMessage {
    return {
        id,
        conversationId: (data.conversationId as string) || '',
        phone: (data.phone as string) || '',
        body: (data.body as string) || '',
        direction: (data.direction as 'inbound' | 'outbound') || 'inbound',
        status: (data.status as SmsMessage['status']) || 'received',
        createdAt: (data.createdAt as Timestamp)?.toDate?.() || new Date(),
    };
}

// ── Conversations ──

export async function getConversations(): Promise<SmsConversation[]> {
    const q = query(collection(db, CONVERSATIONS), orderBy('lastMessageAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => docToConversation(d.id, d.data()));
}

export function subscribeToConversations(
    callback: (conversations: SmsConversation[]) => void
): () => void {
    const q = query(collection(db, CONVERSATIONS), orderBy('lastMessageAt', 'desc'));
    return onSnapshot(q, (snap) => {
        const convos = snap.docs.map((d) => docToConversation(d.id, d.data()));
        callback(convos);
    });
}

// ── Messages ──

export async function getMessages(conversationId: string): Promise<SmsMessage[]> {
    const q = query(
        collection(db, CONVERSATIONS, conversationId, MESSAGES_SUB),
        orderBy('createdAt', 'asc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => docToMessage(d.id, d.data()));
}

export function subscribeToMessages(
    conversationId: string,
    callback: (messages: SmsMessage[]) => void
): () => void {
    const q = query(
        collection(db, CONVERSATIONS, conversationId, MESSAGES_SUB),
        orderBy('createdAt', 'asc')
    );
    return onSnapshot(q, (snap) => {
        const msgs = snap.docs.map((d) => docToMessage(d.id, d.data()));
        callback(msgs);
    });
}

// ── Reply ──

export async function sendReply(conversationId: string, phone: string, text: string): Promise<void> {
    // Add message to subcollection
    await addDoc(collection(db, CONVERSATIONS, conversationId, MESSAGES_SUB), {
        conversationId,
        phone,
        body: text,
        direction: 'outbound',
        status: 'sent',
        createdAt: serverTimestamp(),
    });

    // Update conversation
    await updateDoc(doc(db, CONVERSATIONS, conversationId), {
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
        direction: 'outbound',
    });

    // Actually send the SMS via Twilio (or stub if no keys)
    await sendSms(phone, text);
}

// ── Mark Read ──

export async function markRead(conversationId: string): Promise<void> {
    await updateDoc(doc(db, CONVERSATIONS, conversationId), {
        unreadCount: 0,
    });
}

// ── Create conversation (for webhook/test) ──

export async function createConversation(
    phone: string,
    message: string,
    direction: 'inbound' | 'outbound' = 'inbound',
    contactName?: string,
    contactId?: string,
): Promise<string> {
    // Check if conversation already exists for this phone
    const q = query(collection(db, CONVERSATIONS), where('phone', '==', phone), limit(1));
    const existing = await getDocs(q);

    let convId: string;

    if (!existing.empty) {
        convId = existing.docs[0].id;
        await updateDoc(doc(db, CONVERSATIONS, convId), {
            lastMessage: message,
            lastMessageAt: serverTimestamp(),
            direction,
            unreadCount: direction === 'inbound' ? (existing.docs[0].data().unreadCount || 0) + 1 : 0,
        });
    } else {
        const ref = await addDoc(collection(db, CONVERSATIONS), {
            phone,
            contactName: contactName || null,
            contactId: contactId || null,
            lastMessage: message,
            lastMessageAt: serverTimestamp(),
            unreadCount: direction === 'inbound' ? 1 : 0,
            direction,
        });
        convId = ref.id;
    }

    // Add message
    await addDoc(collection(db, CONVERSATIONS, convId, MESSAGES_SUB), {
        conversationId: convId,
        phone,
        body: message,
        direction,
        status: direction === 'inbound' ? 'received' : 'sent',
        createdAt: serverTimestamp(),
    });

    return convId;
}
