// ── Survey Types ───────────────────────────────────────

export type QuestionType =
    | 'single-choice'
    | 'multiple-choice'
    | 'true-false'
    | 'short-answer'
    | 'long-answer'
    | 'star-rating'
    | 'number-scale'
    | 'likert-scale'
    | 'dropdown'
    | 'ranking';

export type SurveyStatus = 'draft' | 'active' | 'closed';

export interface SurveyQuestion {
    id: string;
    type: QuestionType;
    text: string;
    required: boolean;
    options?: string[];        // For choice-based questions
    scaleMin?: number;         // For number scale
    scaleMax?: number;
    scaleLabels?: string[];    // For likert scale
    order: number;
}

export interface Survey {
    id: string;
    title: string;
    description: string;
    status: SurveyStatus;
    questions: SurveyQuestion[];
    eventId?: string;          // If tied to an event
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
}

export interface SurveyResponse {
    id: string;
    surveyId: string;
    trackingToken?: string;    // For duplicate prevention
    answers: Record<string, unknown>;     // questionId → answer value
    submittedAt: Date;
    contactId?: string;        // If tracked
}

export interface SurveyAttachment {
    surveyId: string;
    surveyTitle: string;
}
