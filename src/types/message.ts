// ── Message Types ──────────────────────────────────────

export type MessageStatus = 'draft' | 'scheduled' | 'sent' | 'failed';
export type MessageChannel = 'sms' | 'email' | 'both';

export interface Message {
    id: string;
    channel: MessageChannel;
    status: MessageStatus;
    subject?: string;           // Email subject
    smsContent?: string;        // SMS body
    emailHtml?: string;         // Email HTML body
    templateId?: string;        // If using a template
    surveyId?: string;          // If a survey is attached
    audience: AudienceTarget;
    scheduledAt?: Date;
    sentAt?: Date;
    sequenceId?: string;        // If part of a sequence
    sequenceOrder?: number;
    analytics?: MessageAnalytics;
    createdAt: Date;
    createdBy: string;
}

export interface AudienceTarget {
    type: 'all' | 'categories' | 'event-registered';
    categoryIds?: string[];
    eventId?: string;
}

export interface MessageAnalytics {
    smsDelivered?: number;
    smsTotal?: number;
    emailDelivered?: number;
    emailTotal?: number;
    emailOpened?: number;
}

export interface MessageSequence {
    id: string;
    name: string;
    messageIds: string[];
    createdAt: Date;
    createdBy: string;
}
