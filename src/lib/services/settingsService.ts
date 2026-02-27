import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

const SETTINGS_DOC = 'settings';

// ── Category Types ──

export interface Category {
    id: string;
    name: string;
    color: string;
}

// ── Categories ──

export async function getCategories(): Promise<Category[]> {
    const snap = await getDoc(doc(db, SETTINGS_DOC, 'categories'));
    if (!snap.exists()) return [];
    return (snap.data().items as Category[]) || [];
}

export async function setCategories(categories: Category[]): Promise<void> {
    await setDoc(doc(db, SETTINGS_DOC, 'categories'), { items: categories });
}

// ── Prospect Tags ──

export interface ProspectTag {
    id: string;
    name: string;
    color: string;
}

export async function getProspectTags(): Promise<ProspectTag[]> {
    const snap = await getDoc(doc(db, SETTINGS_DOC, 'prospectTags'));
    if (!snap.exists()) return [];
    return (snap.data().items as ProspectTag[]) || [];
}

export async function setProspectTags(tags: ProspectTag[]): Promise<void> {
    await setDoc(doc(db, SETTINGS_DOC, 'prospectTags'), { items: tags });
}
