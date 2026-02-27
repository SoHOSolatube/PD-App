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
import type { Prospect, QualificationStatus } from '@/types';

const COLLECTION = 'prospects';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deepClean(val: any): any {
    if (val === undefined) return null;
    if (val === null || typeof val !== 'object' || val instanceof Date) return val;
    if (Array.isArray(val)) return val.map(deepClean);
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val)) {
        if (v === undefined) continue;
        result[k] = deepClean(v);
    }
    return result;
}

function docToProspect(id: string, data: Record<string, unknown>): Prospect {
    return {
        id,
        name: (data.name as string) || '',
        phone: (data.phone as string) || '',
        email: (data.email as string) || '',
        businessType: data.businessType as string | undefined,
        currentPlaybookStep: (data.currentPlaybookStep as number) || 0,
        qualificationStatus: (data.qualificationStatus as QualificationStatus) || 'new',
        conversationMode: (data.conversationMode as 'auto' | 'human') || 'auto',
        tags: (data.tags as string[]) || [],
        collectedData: (data.collectedData as Record<string, unknown>) || {},
        optOutEmail: (data.optOutEmail as boolean) || false,
        optOutSms: (data.optOutSms as boolean) || false,
        createdAt: (data.createdAt as Timestamp)?.toDate?.() || new Date(),
        lastActivityAt: (data.lastActivityAt as Timestamp)?.toDate?.() || new Date(),
    };
}

// ── Filters ──

export interface ProspectFilters {
    search?: string;
    status?: QualificationStatus;
    tags?: string[];
    sortBy?: 'name' | 'createdAt' | 'lastActivityAt';
    sortDir?: 'asc' | 'desc';
}

// ── CRUD ──

export async function getAllProspects(filters?: ProspectFilters): Promise<Prospect[]> {
    let q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));

    if (filters?.status) {
        q = query(
            collection(db, COLLECTION),
            where('qualificationStatus', '==', filters.status),
            orderBy('createdAt', 'desc')
        );
    }

    const snapshot = await getDocs(q);
    let prospects = snapshot.docs.map((d) => docToProspect(d.id, d.data()));

    // Client-side filtering
    if (filters?.search) {
        const term = filters.search.toLowerCase();
        prospects = prospects.filter(
            (p) =>
                p.name.toLowerCase().includes(term) ||
                p.email.toLowerCase().includes(term) ||
                p.phone.includes(term) ||
                p.businessType?.toLowerCase().includes(term)
        );
    }

    if (filters?.tags?.length) {
        prospects = prospects.filter((p) =>
            filters.tags!.some((tag) => p.tags.includes(tag))
        );
    }

    // Client-side sorting
    if (filters?.sortBy) {
        const dir = filters.sortDir === 'asc' ? 1 : -1;
        prospects.sort((a, b) => {
            const aVal = a[filters.sortBy!];
            const bVal = b[filters.sortBy!];
            if (aVal instanceof Date && bVal instanceof Date) {
                return (aVal.getTime() - bVal.getTime()) * dir;
            }
            return String(aVal).localeCompare(String(bVal)) * dir;
        });
    }

    return prospects;
}

export async function getProspectById(id: string): Promise<Prospect | null> {
    const snap = await getDoc(doc(db, COLLECTION, id));
    if (!snap.exists()) return null;
    return docToProspect(snap.id, snap.data());
}

export async function createProspect(
    data: Omit<Prospect, 'id' | 'createdAt' | 'lastActivityAt'>
): Promise<string> {
    const clean = deepClean(data as unknown as Record<string, unknown>);
    const docRef = await addDoc(collection(db, COLLECTION), {
        ...clean,
        createdAt: serverTimestamp(),
        lastActivityAt: serverTimestamp(),
    });
    return docRef.id;
}

export async function updateProspect(
    id: string,
    data: Partial<Omit<Prospect, 'id' | 'createdAt'>>
): Promise<void> {
    const clean = deepClean(data as unknown as Record<string, unknown>);
    await updateDoc(doc(db, COLLECTION, id), {
        ...clean,
        lastActivityAt: serverTimestamp(),
    });
}

export async function deleteProspect(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, id));
}

// ── Specialized ──

export async function updateTags(id: string, tags: string[]): Promise<void> {
    await updateDoc(doc(db, COLLECTION, id), { tags, lastActivityAt: serverTimestamp() });
}

export async function updateQualificationStatus(
    id: string,
    status: QualificationStatus
): Promise<void> {
    await updateDoc(doc(db, COLLECTION, id), {
        qualificationStatus: status,
        lastActivityAt: serverTimestamp(),
    });
}

export async function updatePlaybookStep(id: string, step: number): Promise<void> {
    await updateDoc(doc(db, COLLECTION, id), {
        currentPlaybookStep: step,
        lastActivityAt: serverTimestamp(),
    });
}

export async function addCollectedData(
    id: string,
    key: string,
    value: unknown
): Promise<void> {
    const prospect = await getProspectById(id);
    if (!prospect) return;
    const data = { ...prospect.collectedData, [key]: value };
    await updateDoc(doc(db, COLLECTION, id), {
        collectedData: data,
        lastActivityAt: serverTimestamp(),
    });
}
