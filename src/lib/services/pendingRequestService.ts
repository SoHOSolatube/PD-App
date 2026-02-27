import {
    collection,
    doc,
    getDocs,
    updateDoc,
    serverTimestamp,
    query,
    orderBy,
    where,
    Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { createContact } from './contactService';

const COLLECTION = 'pendingRequests';

export interface PendingRequest {
    id: string;
    name: string;
    email: string;
    phone?: string;
    dealerAffiliation: string;
    eventId?: string;
    status: 'pending' | 'approved' | 'denied';
    submittedAt: Date;
    reviewedAt?: Date;
    reviewedBy?: string;
}

function docToRequest(id: string, data: Record<string, unknown>): PendingRequest {
    return {
        id,
        name: (data.name as string) || '',
        email: (data.email as string) || '',
        phone: (data.phone as string) || '',
        dealerAffiliation: (data.dealerAffiliation as string) || '',
        eventId: data.eventId as string | undefined,
        status: (data.status as 'pending' | 'approved' | 'denied') || 'pending',
        submittedAt: (data.submittedAt as Timestamp)?.toDate?.() || new Date(),
        reviewedAt: (data.reviewedAt as Timestamp)?.toDate?.(),
        reviewedBy: data.reviewedBy as string | undefined,
    };
}

export async function getPendingRequests(
    status?: 'pending' | 'approved' | 'denied'
): Promise<PendingRequest[]> {
    let q = query(collection(db, COLLECTION), orderBy('submittedAt', 'desc'));

    if (status) {
        q = query(
            collection(db, COLLECTION),
            where('status', '==', status),
            orderBy('submittedAt', 'desc')
        );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => docToRequest(d.id, d.data()));
}

export async function approveRequest(
    id: string,
    reviewedBy: string
): Promise<string> {
    // Get the request data
    const requests = await getPendingRequests();
    const request = requests.find((r) => r.id === id);
    if (!request) throw new Error('Request not found');

    // Create a contact from the request
    const contactId = await createContact({
        name: request.name,
        email: request.email,
        phone: request.phone || '',
        company: request.dealerAffiliation,
        status: 'active',
        categories: [],
        optOutEmail: false,
        optOutSms: false,
    });

    // Mark as approved
    await updateDoc(doc(db, COLLECTION, id), {
        status: 'approved',
        reviewedAt: serverTimestamp(),
        reviewedBy,
    });

    return contactId;
}

export async function denyRequest(
    id: string,
    reviewedBy: string
): Promise<void> {
    await updateDoc(doc(db, COLLECTION, id), {
        status: 'denied',
        reviewedAt: serverTimestamp(),
        reviewedBy,
    });
}
