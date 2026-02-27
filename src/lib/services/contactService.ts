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
    arrayUnion,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Contact, Note } from '@/types';

const COLLECTION = 'contacts';

// ── Helpers ──

function docToContact(id: string, data: Record<string, unknown>): Contact {
    return {
        id,
        name: (data.name as string) || '',
        phone: (data.phone as string) || '',
        email: (data.email as string) || '',
        company: (data.company as string) || '',
        status: (data.status as 'active' | 'inactive') || 'active',
        notes: ((data.notes as Note[]) || []).map((n) => ({
            ...n,
            createdAt: n.createdAt instanceof Timestamp
                ? (n.createdAt as Timestamp).toDate()
                : new Date(n.createdAt),
        })),
        categories: (data.categories as string[]) || [],
        optOutEmail: (data.optOutEmail as boolean) || false,
        optOutSms: (data.optOutSms as boolean) || false,
        createdAt: (data.createdAt as Timestamp)?.toDate?.() || new Date(),
        updatedAt: (data.updatedAt as Timestamp)?.toDate?.() || new Date(),
    };
}

// ── CRUD ──

export interface ContactFilters {
    search?: string;
    categories?: string[];
    status?: 'active' | 'inactive';
    sortBy?: 'name' | 'email' | 'createdAt';
    sortDir?: 'asc' | 'desc';
}

export async function getAllContacts(filters?: ContactFilters): Promise<Contact[]> {
    let q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));

    if (filters?.status) {
        q = query(collection(db, COLLECTION), where('status', '==', filters.status), orderBy('createdAt', 'desc'));
    }

    const snapshot = await getDocs(q);
    let contacts = snapshot.docs.map((d) => docToContact(d.id, d.data()));

    // Client-side filtering (Firestore can't do text search natively)
    if (filters?.search) {
        const term = filters.search.toLowerCase();
        contacts = contacts.filter(
            (c) =>
                c.name.toLowerCase().includes(term) ||
                c.email.toLowerCase().includes(term) ||
                c.phone.includes(term) ||
                c.company?.toLowerCase().includes(term)
        );
    }

    if (filters?.categories?.length) {
        contacts = contacts.filter((c) =>
            filters.categories!.some((cat) => c.categories.includes(cat))
        );
    }

    // Client-side sorting
    if (filters?.sortBy) {
        const dir = filters.sortDir === 'asc' ? 1 : -1;
        contacts.sort((a, b) => {
            const aVal = a[filters.sortBy!];
            const bVal = b[filters.sortBy!];
            if (aVal instanceof Date && bVal instanceof Date) {
                return (aVal.getTime() - bVal.getTime()) * dir;
            }
            return String(aVal).localeCompare(String(bVal)) * dir;
        });
    }

    return contacts;
}

export async function getContactById(id: string): Promise<Contact | null> {
    const snap = await getDoc(doc(db, COLLECTION, id));
    if (!snap.exists()) return null;
    return docToContact(snap.id, snap.data());
}

export async function createContact(
    data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt' | 'notes'>
): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION), {
        ...data,
        notes: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return docRef.id;
}

export async function updateContact(
    id: string,
    data: Partial<Omit<Contact, 'id' | 'createdAt'>>
): Promise<void> {
    await updateDoc(doc(db, COLLECTION, id), {
        ...data,
        updatedAt: serverTimestamp(),
    });
}

export async function deleteContact(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, id));
}

// ── Notes ──

export async function addNote(
    contactId: string,
    note: Omit<Note, 'createdAt'>
): Promise<void> {
    await updateDoc(doc(db, COLLECTION, contactId), {
        notes: arrayUnion({
            ...note,
            createdAt: new Date().toISOString(),
        }),
        updatedAt: serverTimestamp(),
    });
}

// ── Search ──

export async function searchByPhone(phone: string): Promise<Contact | null> {
    const q = query(collection(db, COLLECTION), where('phone', '==', phone));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const d = snapshot.docs[0];
    return docToContact(d.id, d.data());
}
