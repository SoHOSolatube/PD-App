'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: 'admin' | 'manager';
}

/**
 * Wraps admin pages. Redirects to login if not authenticated,
 * or shows "Unauthorized" if the user doesn't have the required role.
 */
export default function ProtectedRoute({
    children,
    requiredRole,
}: ProtectedRouteProps) {
    const { user, role, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/admin/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    if (requiredRole === 'admin' && role !== 'admin') {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-foreground">Unauthorized</h2>
                    <p className="mt-2 text-muted-foreground">
                        You need admin access to view this page.
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
