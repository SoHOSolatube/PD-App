import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProtectedRoute from '@/components/shared/ProtectedRoute';

// Mock the AuthContext
const mockUseAuth = vi.fn();
vi.mock('@/context/AuthContext', () => ({
    useAuth: () => mockUseAuth(),
}));

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
    }),
}));

describe('ProtectedRoute', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows loading spinner when auth is loading', () => {
        mockUseAuth.mockReturnValue({
            user: null,
            role: null,
            loading: true,
            logout: vi.fn(),
        });

        render(
            <ProtectedRoute>
                <div>Protected Content</div>
            </ProtectedRoute>
        );

        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
        // Loading spinner is rendered
        expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('redirects to login when not authenticated', () => {
        mockUseAuth.mockReturnValue({
            user: null,
            role: null,
            loading: false,
            logout: vi.fn(),
        });

        render(
            <ProtectedRoute>
                <div>Protected Content</div>
            </ProtectedRoute>
        );

        expect(mockPush).toHaveBeenCalledWith('/admin/login');
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('renders children when authenticated', () => {
        mockUseAuth.mockReturnValue({
            user: { uid: '123', email: 'test@test.com' },
            role: 'admin',
            loading: false,
            logout: vi.fn(),
        });

        render(
            <ProtectedRoute>
                <div>Protected Content</div>
            </ProtectedRoute>
        );

        expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('shows unauthorized when requiredRole is admin but user is manager', () => {
        mockUseAuth.mockReturnValue({
            user: { uid: '123', email: 'test@test.com' },
            role: 'manager',
            loading: false,
            logout: vi.fn(),
        });

        render(
            <ProtectedRoute requiredRole="admin">
                <div>Admin Only Content</div>
            </ProtectedRoute>
        );

        expect(screen.queryByText('Admin Only Content')).not.toBeInTheDocument();
        expect(screen.getByText('Unauthorized')).toBeInTheDocument();
    });

    it('renders children when requiredRole matches user role', () => {
        mockUseAuth.mockReturnValue({
            user: { uid: '123', email: 'test@test.com' },
            role: 'admin',
            loading: false,
            logout: vi.fn(),
        });

        render(
            <ProtectedRoute requiredRole="admin">
                <div>Admin Only Content</div>
            </ProtectedRoute>
        );

        expect(screen.getByText('Admin Only Content')).toBeInTheDocument();
    });
});
