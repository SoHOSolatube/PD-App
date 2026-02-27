import {
    collection,
    doc,
    getDocs,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    addDoc,
    serverTimestamp,
    query,
    orderBy,
    limit,
    where,
    Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { AppUser, LogEntry, LogAction } from '@/types';

const USERS_COLLECTION = 'users';
const LOGS_COLLECTION = 'logs';

// ── User CRUD ──

export async function getAllUsers(): Promise<AppUser[]> {
    const snapshot = await getDocs(
        query(collection(db, USERS_COLLECTION), orderBy('createdAt', 'desc'))
    );
    return snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: (d.data().createdAt as Timestamp)?.toDate(),
        lastLoginAt: (d.data().lastLoginAt as Timestamp)?.toDate(),
    })) as AppUser[];
}

export async function getUserById(uid: string): Promise<AppUser | null> {
    const snap = await getDoc(doc(db, USERS_COLLECTION, uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
        id: snap.id,
        ...data,
        createdAt: (data.createdAt as Timestamp)?.toDate(),
        lastLoginAt: (data.lastLoginAt as Timestamp)?.toDate(),
    } as AppUser;
}

export async function createUserDoc(
    uid: string,
    data: { email: string; displayName: string; role: 'admin' | 'manager' }
): Promise<void> {
    await setDoc(doc(db, USERS_COLLECTION, uid), {
        ...data,
        createdAt: serverTimestamp(),
    });
}

export async function updateUserRole(
    uid: string,
    role: 'admin' | 'manager'
): Promise<void> {
    await updateDoc(doc(db, USERS_COLLECTION, uid), { role });
}

export async function deleteUserDoc(uid: string): Promise<void> {
    await deleteDoc(doc(db, USERS_COLLECTION, uid));
}

// ── Activity Logging ──

export async function createLog(entry: Omit<LogEntry, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, LOGS_COLLECTION), {
        ...entry,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

export async function getLogs(
    filters?: { action?: LogAction; userId?: string; limit?: number }
): Promise<LogEntry[]> {
    let q = query(collection(db, LOGS_COLLECTION), orderBy('createdAt', 'desc'));

    if (filters?.action) {
        q = query(q, where('action', '==', filters.action));
    }
    if (filters?.userId) {
        q = query(q, where('userId', '==', filters.userId));
    }
    if (filters?.limit) {
        q = query(q, limit(filters.limit));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: (d.data().createdAt as Timestamp)?.toDate(),
    })) as LogEntry[];
}
