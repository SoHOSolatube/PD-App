import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock firebase auth
const mockSignIn = vi.fn();
vi.mock('@/lib/firebase/auth', () => ({
    loginWithEmail: (...args: unknown[]) => mockSignIn(...args),
}));

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
    }),
}));

// Need to import after mocks
const { default: LoginPage } = await import('@/app/admin/login/page');

describe('LoginPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders login form', () => {
        render(<LoginPage />);

        expect(screen.getByText('Premier Dealer Portal')).toBeInTheDocument();
        expect(screen.getByLabelText('Email')).toBeInTheDocument();
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    });

    it('submits credentials and redirects on success', async () => {
        mockSignIn.mockResolvedValueOnce({ uid: '123' });

        render(<LoginPage />);

        fireEvent.change(screen.getByLabelText('Email'), {
            target: { value: 'admin@solatube.com' },
        });
        fireEvent.change(screen.getByLabelText('Password'), {
            target: { value: 'admin123!' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

        await waitFor(() => {
            expect(mockSignIn).toHaveBeenCalledWith('admin@solatube.com', 'admin123!');
            expect(mockPush).toHaveBeenCalledWith('/admin/dashboard');
        });
    });

    it('displays error on invalid credentials', async () => {
        mockSignIn.mockRejectedValueOnce(new Error('auth/invalid-credential'));

        render(<LoginPage />);

        fireEvent.change(screen.getByLabelText('Email'), {
            target: { value: 'bad@test.com' },
        });
        fireEvent.change(screen.getByLabelText('Password'), {
            target: { value: 'wrong' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

        await waitFor(() => {
            expect(screen.getByText('Invalid email or password.')).toBeInTheDocument();
        });
    });
});
