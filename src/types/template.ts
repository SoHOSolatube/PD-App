// ── Template Types ─────────────────────────────────────

export type TemplateType = 'email' | 'sms';

export interface Template {
    id: string;
    name: string;
    type: TemplateType;
    subject?: string;        // Email subject
    smsContent?: string;     // SMS body text
    emailHtml?: string;      // Email HTML (from GrapesJS)
    emailJson?: string;      // GrapesJS project JSON (for re-editing)
    skillId?: string;        // AI skill used to generate
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
}
