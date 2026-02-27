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
import type { Playbook, PlaybookStep } from '@/types';

const COLLECTION = 'playbooks';

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

function docToPlaybook(id: string, data: Record<string, unknown>): Playbook {
    return {
        id,
        name: (data.name as string) || '',
        steps: (data.steps as PlaybookStep[]) || [],
        isActive: (data.isActive as boolean) || false,
        createdAt: (data.createdAt as Timestamp)?.toDate?.() || new Date(),
        updatedAt: (data.updatedAt as Timestamp)?.toDate?.() || new Date(),
    };
}

// ── CRUD ──

export async function getAllPlaybooks(): Promise<Playbook[]> {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => docToPlaybook(d.id, d.data()));
}

export async function getActivePlaybook(): Promise<Playbook | null> {
    const q = query(collection(db, COLLECTION), where('isActive', '==', true));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return docToPlaybook(snap.docs[0].id, snap.docs[0].data());
}

export async function getPlaybookById(id: string): Promise<Playbook | null> {
    const snap = await getDoc(doc(db, COLLECTION, id));
    if (!snap.exists()) return null;
    return docToPlaybook(snap.id, snap.data());
}

export async function createPlaybook(
    data: Omit<Playbook, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
    const clean = deepClean(data as unknown as Record<string, unknown>);
    const docRef = await addDoc(collection(db, COLLECTION), {
        ...clean,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return docRef.id;
}

export async function updatePlaybook(
    id: string,
    data: Partial<Omit<Playbook, 'id' | 'createdAt'>>
): Promise<void> {
    const clean = deepClean(data as unknown as Record<string, unknown>);
    await updateDoc(doc(db, COLLECTION, id), {
        ...clean,
        updatedAt: serverTimestamp(),
    });
}

export async function deletePlaybook(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, id));
}

export async function setActivePlaybook(id: string): Promise<void> {
    // Deactivate all others
    const all = await getAllPlaybooks();
    for (const pb of all) {
        if (pb.isActive && pb.id !== id) {
            await updateDoc(doc(db, COLLECTION, pb.id), { isActive: false });
        }
    }
    await updateDoc(doc(db, COLLECTION, id), {
        isActive: true,
        updatedAt: serverTimestamp(),
    });
}
