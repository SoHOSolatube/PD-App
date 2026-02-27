/**
 * Seed Admin Script
 *
 * Creates the first admin user in Firebase Auth + Firestore.
 * Run once: npx tsx scripts/seed-admin.ts
 *
 * Requires Firebase Emulators to be running (or live Firebase project).
 */

import { initializeApp } from 'firebase/app';
import {
    getAuth,
    connectAuthEmulator,
    createUserWithEmailAndPassword,
    updateProfile,
} from 'firebase/auth';
import {
    getFirestore,
    connectFirestoreEmulator,
    doc,
    setDoc,
    serverTimestamp,
} from 'firebase/firestore';

// ── Configuration ──
const ADMIN_EMAIL = 'admin@solatube.com';
const ADMIN_PASSWORD = 'admin123!';
const ADMIN_NAME = 'Admin User';

const firebaseConfig = {
    apiKey: 'demo-key',
    projectId: 'demo-pd-portal',
};

async function seedAdmin() {
    console.log('🌱 Seeding admin user...\n');

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    // Connect to emulators
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);

    try {
        let uid: string;

        try {
            // Try creating auth user
            const credential = await createUserWithEmailAndPassword(
                auth,
                ADMIN_EMAIL,
                ADMIN_PASSWORD
            );
            await updateProfile(credential.user, { displayName: ADMIN_NAME });
            uid = credential.user.uid;
            console.log('✅ Auth user created');
        } catch (error: unknown) {
            const err = error as { code?: string; message: string };
            if (err.code === 'auth/email-already-in-use') {
                // User exists — sign in to get UID
                const { signInWithEmailAndPassword } = await import('firebase/auth');
                const credential = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
                uid = credential.user.uid;
                console.log('ℹ️  Auth user already exists, using existing UID');
            } else {
                throw error;
            }
        }

        // Always ensure Firestore user doc exists
        await setDoc(doc(db, 'users', uid), {
            email: ADMIN_EMAIL,
            displayName: ADMIN_NAME,
            role: 'admin',
            createdAt: serverTimestamp(),
        }, { merge: true });

        console.log('✅ Firestore user doc ensured');
        console.log(`   Email:    ${ADMIN_EMAIL}`);
        console.log(`   Password: ${ADMIN_PASSWORD}`);
        console.log(`   Role:     admin`);
        console.log(`   UID:      ${uid}`);
        console.log('\n📝 You can now log in at /admin/login');
    } catch (error: unknown) {
        const err = error as { message: string };
        console.error('❌ Error creating admin:', err.message);
    }

    process.exit(0);
}

seedAdmin();
