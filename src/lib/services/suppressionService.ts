import {
    collection,
    doc,
    getDocs,
    addDoc,
    deleteDoc,
    serverTimestamp,
    query,
    orderBy,
    where,
    Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// ── Types ──

export type SuppressionChannel = 'sms' | 'email' | 'both';
export type SuppressionReason = 'user-request' | 'twilio-stop' | 'sendgrid-unsubscribe' | 'manual' | 'bounce';

export interface SuppressionEntry {
    id: string;
    phone?: string;
    email?: string;
    channel: SuppressionChannel;
    reason: SuppressionReason;
    source?: string;
    createdAt: Date;
}

const COLLECTION = 'suppressionList';

// ── Helpers ──

function docToEntry(id: string, data: Record<string, unknown>): SuppressionEntry {
    return {
        id,
        phone: data.phone as string | undefined,
        email: data.email as string | undefined,
        channel: (data.channel as SuppressionChannel) || 'both',
        reason: (data.reason as SuppressionReason) || 'manual',
        source: data.source as string | undefined,
        createdAt: (data.createdAt as Timestamp)?.toDate?.() || new Date(),
    };
}

// ── CRUD ──

export async function getAllSuppressions(): Promise<SuppressionEntry[]> {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => docToEntry(d.id, d.data()));
}

export async function addOptOut(
    data: {
        phone?: string;
        email?: string;
        channel: SuppressionChannel;
        reason: SuppressionReason;
        source?: string;
    }
): Promise<string> {
    const clean: Record<string, unknown> = {
        channel: data.channel,
        reason: data.reason,
        createdAt: serverTimestamp(),
    };
    if (data.phone) clean.phone = data.phone;
    if (data.email) clean.email = data.email;
    if (data.source) clean.source = data.source;

    const docRef = await addDoc(collection(db, COLLECTION), clean);
    return docRef.id;
}

export async function removeOptOut(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, id));
}

// ── Lookup ──

export async function isOptedOut(phone: string): Promise<boolean> {
    const q = query(
        collection(db, COLLECTION),
        where('phone', '==', phone)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
}

export async function isOptedOutEmail(email: string): Promise<boolean> {
    const q = query(
        collection(db, COLLECTION),
        where('email', '==', email)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
}

// ── Webhook sync ──

export async function syncFromWebhook(event: {
    type: 'twilio-stop' | 'sendgrid-unsubscribe';
    phone?: string;
    email?: string;
}): Promise<string> {
    return addOptOut({
        phone: event.phone,
        email: event.email,
        channel: event.phone ? 'sms' : 'email',
        reason: event.type === 'twilio-stop' ? 'twilio-stop' : 'sendgrid-unsubscribe',
        source: 'webhook',
    });
}
