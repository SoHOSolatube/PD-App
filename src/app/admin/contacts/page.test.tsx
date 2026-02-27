import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock services
const mockGetAllContacts = vi.fn();
const mockGetCategories = vi.fn();
const mockCreateContact = vi.fn();
const mockUpdateContact = vi.fn();
const mockDeleteContact = vi.fn();

vi.mock('@/lib/services/contactService', () => ({
    getAllContacts: (...args: unknown[]) => mockGetAllContacts(...args),
    createContact: (...args: unknown[]) => mockCreateContact(...args),
    updateContact: (...args: unknown[]) => mockUpdateContact(...args),
    deleteContact: (...args: unknown[]) => mockDeleteContact(...args),
    addNote: vi.fn(),
}));

vi.mock('@/lib/services/settingsService', () => ({
    getCategories: () => mockGetCategories(),
}));

vi.mock('@/lib/services/pendingRequestService', () => ({
    getPendingRequests: vi.fn().mockResolvedValue([]),
    approveRequest: vi.fn(),
    denyRequest: vi.fn(),
}));

vi.mock('@/context/AuthContext', () => ({
    useAuth: () => ({
        user: { uid: '123', email: 'admin@test.com', displayName: 'Admin' },
        role: 'admin',
        loading: false,
        logout: vi.fn(),
    }),
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn() }),
    usePathname: () => '/admin/contacts',
}));

const { default: ContactsPage } = await import(
    '@/app/admin/contacts/page'
);

describe('ContactsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetCategories.mockResolvedValue([
            { id: 'cat-1', name: 'Gold', color: '#fdb927' },
        ]);
    });

    it('renders empty state when no contacts', async () => {
        mockGetAllContacts.mockResolvedValue([]);

        render(<ContactsPage />);

        await waitFor(() => {
            expect(screen.getByText('Contacts')).toBeInTheDocument();
            expect(
                screen.getByText('No contacts yet. Add your first one!')
            ).toBeInTheDocument();
        });
    });

    it('renders contacts in table', async () => {
        mockGetAllContacts.mockResolvedValue([
            {
                id: '1',
                name: 'John Doe',
                email: 'john@test.com',
                phone: '+15550100',
                company: 'ABC Solar',
                status: 'active',
                notes: [],
                categories: ['cat-1'],
                optOutEmail: false,
                optOutSms: false,
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01'),
            },
        ]);

        render(<ContactsPage />);

        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
            expect(screen.getByText('john@test.com')).toBeInTheDocument();
            expect(screen.getByText('+15550100')).toBeInTheDocument();
            expect(screen.getByText('ABC Solar')).toBeInTheDocument();
            expect(screen.getByText('Gold')).toBeInTheDocument();
        });
    });

    it('opens add contact dialog', async () => {
        mockGetAllContacts.mockResolvedValue([]);

        render(<ContactsPage />);

        await waitFor(() => {
            expect(screen.getByText('Add Contact')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Add Contact'));

        await waitFor(() => {
            expect(screen.getByText('New Contact')).toBeInTheDocument();
            expect(screen.getByLabelText('Name *')).toBeInTheDocument();
            expect(screen.getByLabelText('Email *')).toBeInTheDocument();
        });
    });

    it('shows contact count', async () => {
        mockGetAllContacts.mockResolvedValue([
            {
                id: '1',
                name: 'Jane',
                email: 'j@t.com',
                phone: '',
                company: '',
                status: 'active',
                notes: [],
                categories: [],
                optOutEmail: false,
                optOutSms: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: '2',
                name: 'Bob',
                email: 'b@t.com',
                phone: '',
                company: '',
                status: 'active',
                notes: [],
                categories: [],
                optOutEmail: false,
                optOutSms: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]);

        render(<ContactsPage />);

        await waitFor(() => {
            expect(screen.getByText('2 premier dealer contacts')).toBeInTheDocument();
        });
    });
});
