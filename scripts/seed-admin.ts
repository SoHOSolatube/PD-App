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
        // Create auth user
        const credential = await createUserWithEmailAndPassword(
            auth,
            ADMIN_EMAIL,
            ADMIN_PASSWORD
        );
        await updateProfile(credential.user, { displayName: ADMIN_NAME });

        // Create Firestore user doc with admin role
        await setDoc(doc(db, 'users', credential.user.uid), {
            email: ADMIN_EMAIL,
            displayName: ADMIN_NAME,
            role: 'admin',
            createdAt: serverTimestamp(),
        });

        console.log('✅ Admin user created successfully!');
        console.log(`   Email:    ${ADMIN_EMAIL}`);
        console.log(`   Password: ${ADMIN_PASSWORD}`);
        console.log(`   Role:     admin`);
        console.log(`   UID:      ${credential.user.uid}`);
        console.log('\n📝 You can now log in at /admin/login');
    } catch (error: unknown) {
        const err = error as { code?: string; message: string };
        if (err.code === 'auth/email-already-in-use') {
            console.log('ℹ️  Admin user already exists. Skipping.');
        } else {
            console.error('❌ Error creating admin:', err.message);
        }
    }

    process.exit(0);
}

seedAdmin();
