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
import type { Survey, SurveyStatus, SurveyResponse } from '@/types';

const COLLECTION = 'surveys';

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

function docToSurvey(id: string, data: Record<string, unknown>): Survey {
    return {
        id,
        title: (data.title as string) || '',
        description: (data.description as string) || '',
        status: (data.status as SurveyStatus) || 'draft',
        questions: (data.questions as Survey['questions']) || [],
        eventId: data.eventId as string | undefined,
        createdAt: (data.createdAt as Timestamp)?.toDate?.() || new Date(),
        updatedAt: (data.updatedAt as Timestamp)?.toDate?.() || new Date(),
        createdBy: (data.createdBy as string) || '',
    };
}

// ── CRUD ──

export async function getAllSurveys(status?: SurveyStatus): Promise<Survey[]> {
    let q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
    if (status) {
        q = query(
            collection(db, COLLECTION),
            where('status', '==', status),
            orderBy('createdAt', 'desc')
        );
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => docToSurvey(d.id, d.data()));
}

export async function getSurveyById(id: string): Promise<Survey | null> {
    const snap = await getDoc(doc(db, COLLECTION, id));
    if (!snap.exists()) return null;
    return docToSurvey(snap.id, snap.data());
}

export async function createSurvey(
    data: Omit<Survey, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
    const clean = deepClean(data as unknown as Record<string, unknown>);
    const docRef = await addDoc(collection(db, COLLECTION), {
        ...clean,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return docRef.id;
}

export async function updateSurvey(
    id: string,
    data: Partial<Omit<Survey, 'id' | 'createdAt'>>
): Promise<void> {
    const clean = deepClean(data as unknown as Record<string, unknown>);
    await updateDoc(doc(db, COLLECTION, id), {
        ...clean,
        updatedAt: serverTimestamp(),
    });
}

export async function deleteSurvey(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, id));
}

export async function activateSurvey(id: string): Promise<void> {
    await updateDoc(doc(db, COLLECTION, id), {
        status: 'active',
        updatedAt: serverTimestamp(),
    });
}

export async function closeSurvey(id: string): Promise<void> {
    await updateDoc(doc(db, COLLECTION, id), {
        status: 'closed',
        updatedAt: serverTimestamp(),
    });
}

// ── Responses (subcollection) ──

export async function submitResponse(
    surveyId: string,
    data: Omit<SurveyResponse, 'id' | 'submittedAt'>
): Promise<string> {
    const clean = deepClean(data as unknown as Record<string, unknown>);
    const docRef = await addDoc(
        collection(db, COLLECTION, surveyId, 'responses'),
        {
            ...clean,
            submittedAt: serverTimestamp(),
        }
    );
    return docRef.id;
}

export async function getResponses(surveyId: string): Promise<SurveyResponse[]> {
    const q = query(
        collection(db, COLLECTION, surveyId, 'responses'),
        orderBy('submittedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
        id: d.id,
        surveyId: (d.data().surveyId as string) || surveyId,
        trackingToken: d.data().trackingToken as string | undefined,
        answers: (d.data().answers as Record<string, unknown>) || {},
        submittedAt: (d.data().submittedAt as Timestamp)?.toDate?.() || new Date(),
        contactId: d.data().contactId as string | undefined,
    }));
}

export async function checkDuplicate(
    surveyId: string,
    trackingToken: string
): Promise<boolean> {
    const q = query(
        collection(db, COLLECTION, surveyId, 'responses'),
        where('trackingToken', '==', trackingToken)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
}
