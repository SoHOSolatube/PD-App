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
    Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

const COLLECTION = 'skills';

export interface Skill {
    id: string;
    name: string;
    description: string;
    prompt: string;
    toneOfVoice?: string;
    colorPalette?: string[];
    layoutPreferences?: string;
    referenceImages?: string[];
    createdAt: Date;
    updatedAt: Date;
}

function docToSkill(id: string, data: Record<string, unknown>): Skill {
    return {
        id,
        name: (data.name as string) || '',
        description: (data.description as string) || '',
        prompt: (data.prompt as string) || '',
        toneOfVoice: data.toneOfVoice as string | undefined,
        colorPalette: data.colorPalette as string[] | undefined,
        layoutPreferences: data.layoutPreferences as string | undefined,
        referenceImages: data.referenceImages as string[] | undefined,
        createdAt: (data.createdAt as Timestamp)?.toDate?.() || new Date(),
        updatedAt: (data.updatedAt as Timestamp)?.toDate?.() || new Date(),
    };
}

export async function getAllSkills(): Promise<Skill[]> {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => docToSkill(d.id, d.data()));
}

export async function getSkillById(id: string): Promise<Skill | null> {
    const snap = await getDoc(doc(db, COLLECTION, id));
    if (!snap.exists()) return null;
    return docToSkill(snap.id, snap.data());
}

export async function createSkill(
    data: Omit<Skill, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return docRef.id;
}

export async function updateSkill(
    id: string,
    data: Partial<Omit<Skill, 'id' | 'createdAt'>>
): Promise<void> {
    await updateDoc(doc(db, COLLECTION, id), {
        ...data,
        updatedAt: serverTimestamp(),
    });
}

export async function deleteSkill(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, id));
}
