import {
    signInWithEmailAndPassword,
    signOut,
    createUserWithEmailAndPassword,
    updateProfile,
    type User,
} from 'firebase/auth';
import { auth } from './config';

/**
 * Sign in with email and password.
 */
export async function loginWithEmail(
    email: string,
    password: string
): Promise<User> {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
}

/**
 * Sign out the current user.
 */
export async function logoutUser(): Promise<void> {
    await signOut(auth);
}

/**
 * Create a new user account (used by admin to invite users).
 * Note: In production, user creation should use Firebase Admin SDK
 * via a server-side API route to avoid signing out the current admin.
 */
export async function createUser(
    email: string,
    password: string,
    displayName: string
): Promise<User> {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName });
    return credential.user;
}
