// ── Prospect Types ─────────────────────────────────────

export type QualificationStatus =
    | 'new'
    | 'in-progress'
    | 'qualified'
    | 'not-a-fit'
    | 'handed-off'
    | 'converted';

export type ConversationMode = 'auto' | 'human';

export interface Prospect {
    id: string;
    name: string;
    phone: string;
    email: string;
    businessType?: string;
    currentPlaybookStep: number;
    qualificationStatus: QualificationStatus;
    conversationMode: ConversationMode;
    tags: string[];
    collectedData: Record<string, unknown>;  // Data points gathered by AI
    optOutEmail: boolean;
    optOutSms: boolean;
    createdAt: Date;
    lastActivityAt: Date;
}

export interface ProspectConversationMessage {
    id: string;
    prospectId: string;
    sender: 'ai' | 'human' | 'prospect';
    channel: 'sms' | 'email';
    content: string;
    timestamp: Date;
    playbookStep?: number;
}
