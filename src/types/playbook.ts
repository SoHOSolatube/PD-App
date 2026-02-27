// ── Playbook Types ─────────────────────────────────────

export interface PlaybookStep {
    id: string;
    order: number;
    name: string;
    goal: string;
    infoToCollect: string[];
    aiInstructions: string;
    advancementCriteria: string;
    disqualificationCriteria?: string;
}

export interface Playbook {
    id: string;
    name: string;
    steps: PlaybookStep[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
