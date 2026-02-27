// ── User Types ─────────────────────────────────────────

export type UserRole = 'admin' | 'manager';

export interface AppUser {
    id: string;
    email: string;
    displayName: string;
    role: UserRole;
    createdAt: Date;
    lastLoginAt?: Date;
}

// ── Skill Types ────────────────────────────────────────

export interface Skill {
    id: string;
    name: string;
    description: string;
    colorPalette?: string[];
    toneOfVoice?: string;
    layoutPreferences?: string;
    referenceImages?: string[];
    prompt: string;
    createdAt: Date;
    updatedAt: Date;
}

// ── Log Types ──────────────────────────────────────────

export type LogAction =
    | 'message_sent'
    | 'event_created'
    | 'event_edited'
    | 'event_deleted'
    | 'contact_created'
    | 'contact_edited'
    | 'contact_deleted'
    | 'prospect_created'
    | 'prospect_updated'
    | 'user_action';

export interface LogEntry {
    id: string;
    action: LogAction;
    description: string;
    userId: string;
    userName: string;
    metadata?: Record<string, unknown>;
    createdAt: Date;
}
