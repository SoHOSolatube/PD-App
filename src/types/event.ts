// ── Event Types ────────────────────────────────────────

export type EventStatus = 'draft' | 'published';

export type RecurrencePattern =
    | 'none'
    | 'weekly'
    | 'biweekly'
    | 'monthly'
    | 'custom';

export interface PDEvent {
    id: string;
    title: string;
    description: string;
    dateTime: Date;
    recurrence: RecurrencePattern;
    recurrenceConfig?: RecurrenceConfig;
    status: EventStatus;
    notificationSequence: NotificationStep[];
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
}

export interface RecurrenceConfig {
    interval: number;
    dayOfWeek?: number;    // 0-6 (Sun-Sat)
    weekOfMonth?: number;  // 1-5
    endDate?: Date;
}

export interface Registration {
    id: string;
    contactId: string;
    contactName: string;
    registeredAt: Date;
}

export type NotificationChannel = 'sms' | 'email' | 'both';
export type NotificationTiming = 'before' | 'after';
export type AudienceType = 'registered' | 'all' | 'category';

export interface NotificationStep {
    id: string;
    order: number;
    channel: NotificationChannel;
    templateId?: string;
    customContent?: string;
    surveyId?: string;
    timing: NotificationTiming;
    timingValue: number;      // e.g., 3
    timingUnit: 'minutes' | 'hours' | 'days' | 'weeks';
    audience: AudienceType;
    audienceCategoryId?: string;
}
