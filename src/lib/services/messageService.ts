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
    Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Message, MessageStatus, AudienceTarget, MessageAnalytics } from '@/types';

const COLLECTION = 'messages';

function docToMessage(id: string, data: Record<string, unknown>): Message {
    const audience = (data.audience as Record<string, unknown>) || {};
    return {
        id,
        channel: (data.channel as Message['channel']) || 'sms',
        status: (data.status as MessageStatus) || 'draft',
        subject: data.subject as string | undefined,
        smsContent: data.smsContent as string | undefined,
        emailHtml: data.emailHtml as string | undefined,
        templateId: data.templateId as string | undefined,
        surveyId: data.surveyId as string | undefined,
        audience: {
            type: (audience.type as AudienceTarget['type']) || 'all',
            categoryIds: audience.categoryIds as string[] | undefined,
            eventId: audience.eventId as string | undefined,
        },
        scheduledAt: (data.scheduledAt as Timestamp)?.toDate?.() || undefined,
        sentAt: (data.sentAt as Timestamp)?.toDate?.() || undefined,
        sequenceId: data.sequenceId as string | undefined,
        sequenceOrder: data.sequenceOrder as number | undefined,
        analytics: data.analytics as MessageAnalytics | undefined,
        createdAt: (data.createdAt as Timestamp)?.toDate?.() || new Date(),
        createdBy: (data.createdBy as string) || '',
    };
}

export async function getAllMessages(status?: MessageStatus): Promise<Message[]> {
    let q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
    if (status) {
        q = query(
            collection(db, COLLECTION),
            where('status', '==', status),
            orderBy('createdAt', 'desc')
        );
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => docToMessage(d.id, d.data()));
}

export async function getMessageById(id: string): Promise<Message | null> {
    const snap = await getDoc(doc(db, COLLECTION, id));
    if (!snap.exists()) return null;
    return docToMessage(snap.id, snap.data());
}

// Recursively strip undefined values — Firestore rejects them
function deepStrip(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
        if (v === undefined) continue;
        if (v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) {
            result[k] = deepStrip(v as Record<string, unknown>);
        } else {
            result[k] = v;
        }
    }
    return result;
}

export async function createMessage(
    data: Omit<Message, 'id' | 'createdAt' | 'analytics'>
): Promise<string> {
    const clean = deepStrip(data as unknown as Record<string, unknown>);
    const docRef = await addDoc(collection(db, COLLECTION), {
        ...clean,
        scheduledAt: data.scheduledAt || null,
        sentAt: data.sentAt || null,
        analytics: { smsDelivered: 0, smsTotal: 0, emailDelivered: 0, emailTotal: 0, emailOpened: 0 },
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

export async function updateMessage(
    id: string,
    data: Partial<Omit<Message, 'id' | 'createdAt'>>
): Promise<void> {
    const clean = deepStrip(data as unknown as Record<string, unknown>);
    await updateDoc(doc(db, COLLECTION, id), { ...clean });
}

export async function deleteMessage(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, id));
}

export async function getScheduledMessages(): Promise<Message[]> {
    return getAllMessages('scheduled');
}

export async function getSentMessages(): Promise<Message[]> {
    return getAllMessages('sent');
}

export async function cancelMessage(id: string): Promise<void> {
    await updateDoc(doc(db, COLLECTION, id), { status: 'draft', scheduledAt: null });
}

export async function updateAnalytics(
    id: string,
    analytics: Partial<MessageAnalytics>
): Promise<void> {
    const msg = await getMessageById(id);
    if (!msg) return;
    const merged = { ...msg.analytics, ...analytics };
    await updateDoc(doc(db, COLLECTION, id), { analytics: merged });
}
