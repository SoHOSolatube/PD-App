// ── Contact Types ──────────────────────────────────────

export interface Contact {
    id: string;
    name: string;
    phone: string;
    email: string;
    company?: string;
    status: 'active' | 'inactive';
    notes: Note[];
    categories: string[];
    optOutEmail: boolean;
    optOutSms: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Note {
    id: string;
    content: string;
    createdAt: Date;
    createdBy: string;
}
