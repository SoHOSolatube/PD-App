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
import type { PDEvent, EventStatus, NotificationStep, Registration } from '@/types';

const COLLECTION = 'events';

function stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
        if (v === undefined) continue;
        if (v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) {
            result[k] = stripUndefined(v as Record<string, unknown>);
        } else {
            result[k] = v;
        }
    }
    return result;
}

function docToEvent(id: string, data: Record<string, unknown>): PDEvent {
    return {
        id,
        title: (data.title as string) || '',
        description: (data.description as string) || '',
        dateTime: (data.dateTime as Timestamp)?.toDate?.() || new Date(),
        recurrence: (data.recurrence as PDEvent['recurrence']) || 'none',
        recurrenceConfig: data.recurrenceConfig as PDEvent['recurrenceConfig'],
        status: (data.status as EventStatus) || 'draft',
        notificationSequence: (data.notificationSequence as NotificationStep[]) || [],
        createdAt: (data.createdAt as Timestamp)?.toDate?.() || new Date(),
        updatedAt: (data.updatedAt as Timestamp)?.toDate?.() || new Date(),
        createdBy: (data.createdBy as string) || '',
    };
}

export async function getAllEvents(status?: EventStatus): Promise<PDEvent[]> {
    let q = query(collection(db, COLLECTION), orderBy('dateTime', 'desc'));
    if (status) {
        q = query(
            collection(db, COLLECTION),
            where('status', '==', status),
            orderBy('dateTime', 'desc')
        );
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => docToEvent(d.id, d.data()));
}

export async function getPublishedEvents(): Promise<PDEvent[]> {
    return getAllEvents('published');
}

export async function getEventById(id: string): Promise<PDEvent | null> {
    const snap = await getDoc(doc(db, COLLECTION, id));
    if (!snap.exists()) return null;
    return docToEvent(snap.id, snap.data());
}

export async function createEvent(
    data: Omit<PDEvent, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
    const clean = stripUndefined(data as unknown as Record<string, unknown>);
    const docRef = await addDoc(collection(db, COLLECTION), {
        ...clean,
        notificationSequence: data.notificationSequence || [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return docRef.id;
}

export async function updateEvent(
    id: string,
    data: Partial<Omit<PDEvent, 'id' | 'createdAt'>>
): Promise<void> {
    const clean = stripUndefined(data as unknown as Record<string, unknown>);
    await updateDoc(doc(db, COLLECTION, id), {
        ...clean,
        updatedAt: serverTimestamp(),
    });
}

export async function deleteEvent(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, id));
}

export async function publishEvent(id: string): Promise<void> {
    await updateDoc(doc(db, COLLECTION, id), {
        status: 'published',
        updatedAt: serverTimestamp(),
    });
}

export async function unpublishEvent(id: string): Promise<void> {
    await updateDoc(doc(db, COLLECTION, id), {
        status: 'draft',
        updatedAt: serverTimestamp(),
    });
}

// ── Registrations (subcollection) ──

export async function getRegistrations(eventId: string): Promise<Registration[]> {
    const q = query(
        collection(db, COLLECTION, eventId, 'registrations'),
        orderBy('registeredAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
        id: d.id,
        contactId: (d.data().contactId as string) || '',
        contactName: (d.data().contactName as string) || '',
        registeredAt: (d.data().registeredAt as Timestamp)?.toDate?.() || new Date(),
    }));
}

export async function addRegistration(
    eventId: string,
    contactId: string,
    contactName: string
): Promise<string> {
    const docRef = await addDoc(
        collection(db, COLLECTION, eventId, 'registrations'),
        {
            contactId,
            contactName,
            registeredAt: serverTimestamp(),
        }
    );
    return docRef.id;
}

export async function removeRegistration(
    eventId: string,
    registrationId: string
): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, eventId, 'registrations', registrationId));
}

// ── Notification Sequence ──

export async function updateNotificationSequence(
    eventId: string,
    steps: NotificationStep[]
): Promise<void> {
    await updateDoc(doc(db, COLLECTION, eventId), {
        notificationSequence: steps,
        updatedAt: serverTimestamp(),
    });
}
