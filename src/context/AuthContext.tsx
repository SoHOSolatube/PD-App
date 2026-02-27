'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { logoutUser } from '@/lib/firebase/auth';

type UserRole = 'admin' | 'manager' | null;

interface AuthContextType {
    user: User | null;
    role: UserRole;
    loading: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    role: null,
    loading: true,
    logout: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<UserRole>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                    if (userDoc.exists()) {
                        setRole(userDoc.data().role as UserRole);
                    } else {
                        setRole(null);
                    }
                } catch (error) {
                    console.error('Error fetching user role:', error);
                    setRole(null);
                }
            } else {
                setRole(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const logout = async () => {
        await logoutUser();
    };

    return (
        <AuthContext.Provider value={{ user, role, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
