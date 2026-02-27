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
import type { Template, TemplateType } from '@/types';

const COLLECTION = 'templates';

function docToTemplate(id: string, data: Record<string, unknown>): Template {
    return {
        id,
        name: (data.name as string) || '',
        type: (data.type as TemplateType) || 'email',
        subject: data.subject as string | undefined,
        smsContent: data.smsContent as string | undefined,
        emailHtml: data.emailHtml as string | undefined,
        emailJson: data.emailJson as string | undefined,
        skillId: data.skillId as string | undefined,
        createdAt: (data.createdAt as Timestamp)?.toDate?.() || new Date(),
        updatedAt: (data.updatedAt as Timestamp)?.toDate?.() || new Date(),
        createdBy: (data.createdBy as string) || '',
    };
}

export async function getAllTemplates(type?: TemplateType): Promise<Template[]> {
    let q = query(collection(db, COLLECTION), orderBy('updatedAt', 'desc'));

    if (type) {
        q = query(
            collection(db, COLLECTION),
            where('type', '==', type),
            orderBy('updatedAt', 'desc')
        );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => docToTemplate(d.id, d.data()));
}

export async function getTemplateById(id: string): Promise<Template | null> {
    const snap = await getDoc(doc(db, COLLECTION, id));
    if (!snap.exists()) return null;
    return docToTemplate(snap.id, snap.data());
}

export async function createTemplate(
    data: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return docRef.id;
}

export async function updateTemplate(
    id: string,
    data: Partial<Omit<Template, 'id' | 'createdAt'>>
): Promise<void> {
    await updateDoc(doc(db, COLLECTION, id), {
        ...data,
        updatedAt: serverTimestamp(),
    });
}

export async function deleteTemplate(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, id));
}

export async function duplicateTemplate(id: string): Promise<string> {
    const original = await getTemplateById(id);
    if (!original) throw new Error('Template not found');

    const { id: _id, createdAt: _ca, updatedAt: _ua, ...rest } = original;
    return createTemplate({
        ...rest,
        name: `${rest.name} (Copy)`,
    });
}
