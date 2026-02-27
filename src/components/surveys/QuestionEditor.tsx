'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { SurveyQuestion, QuestionType } from '@/types';
import { Plus, Trash2, GripVertical } from 'lucide-react';

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
    { value: 'single-choice', label: 'Single Choice' },
    { value: 'multiple-choice', label: 'Multiple Choice' },
    { value: 'true-false', label: 'True / False' },
    { value: 'short-answer', label: 'Short Answer' },
    { value: 'long-answer', label: 'Long Answer' },
    { value: 'star-rating', label: 'Star Rating' },
    { value: 'number-scale', label: 'Number Scale' },
    { value: 'likert-scale', label: 'Likert Scale' },
    { value: 'dropdown', label: 'Dropdown' },
    { value: 'ranking', label: 'Ranking' },
];

const CHOICE_TYPES: QuestionType[] = [
    'single-choice',
    'multiple-choice',
    'dropdown',
    'ranking',
];

interface QuestionEditorProps {
    question: SurveyQuestion;
    onChange: (updated: SurveyQuestion) => void;
    onDelete: () => void;
    index: number;
}

export default function QuestionEditor({
    question,
    onChange,
    onDelete,
    index,
}: QuestionEditorProps) {
    const needsOptions = CHOICE_TYPES.includes(question.type);
    const needsScale = question.type === 'number-scale';
    const needsLikert = question.type === 'likert-scale';

    const addOption = () => {
        const opts = [...(question.options || []), `Option ${(question.options?.length || 0) + 1}`];
        onChange({ ...question, options: opts });
    };

    const updateOption = (i: number, value: string) => {
        const opts = [...(question.options || [])];
        opts[i] = value;
        onChange({ ...question, options: opts });
    };

    const removeOption = (i: number) => {
        const opts = (question.options || []).filter((_, idx) => idx !== i);
        onChange({ ...question, options: opts });
    };

    return (
        <div className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-start gap-2">
                <GripVertical className="mt-2 h-4 w-4 text-muted-foreground/50" />
                <Badge variant="outline" className="mt-1.5 text-[10px]">Q{index + 1}</Badge>
                <div className="flex-1 space-y-3">
                    {/* Question text + type */}
                    <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                            <Input
                                value={question.text}
                                onChange={(e) => onChange({ ...question, text: e.target.value })}
                                placeholder="Question text…"
                                className="text-sm"
                            />
                        </div>
                        <Select
                            value={question.type}
                            onValueChange={(v) => {
                                const newQ = { ...question, type: v as QuestionType };
                                if (CHOICE_TYPES.includes(v as QuestionType) && !newQ.options?.length) {
                                    newQ.options = ['Option 1', 'Option 2'];
                                }
                                if (v === 'number-scale') {
                                    newQ.scaleMin = newQ.scaleMin || 1;
                                    newQ.scaleMax = newQ.scaleMax || 10;
                                }
                                if (v === 'likert-scale') {
                                    newQ.scaleLabels = newQ.scaleLabels || [
                                        'Strongly Disagree',
                                        'Disagree',
                                        'Neutral',
                                        'Agree',
                                        'Strongly Agree',
                                    ];
                                }
                                onChange(newQ);
                            }}
                        >
                            <SelectTrigger className="text-xs h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {QUESTION_TYPES.map((t) => (
                                    <SelectItem key={t.value} value={t.value}>
                                        {t.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Options for choice types */}
                    {needsOptions && (
                        <div className="space-y-1.5 pl-2">
                            {(question.options || []).map((opt, i) => (
                                <div key={i} className="flex items-center gap-1.5">
                                    <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                                    <Input
                                        value={opt}
                                        onChange={(e) => updateOption(i, e.target.value)}
                                        className="h-7 text-xs flex-1"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => removeOption(i)}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                            <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={addOption}>
                                <Plus className="h-3 w-3" />
                                Add Option
                            </Button>
                        </div>
                    )}

                    {/* Scale config */}
                    {needsScale && (
                        <div className="flex items-center gap-2 pl-2">
                            <Label className="text-xs">Min</Label>
                            <Input
                                type="number"
                                value={question.scaleMin || 1}
                                onChange={(e) => onChange({ ...question, scaleMin: parseInt(e.target.value) })}
                                className="h-7 w-16 text-xs"
                            />
                            <Label className="text-xs">Max</Label>
                            <Input
                                type="number"
                                value={question.scaleMax || 10}
                                onChange={(e) => onChange({ ...question, scaleMax: parseInt(e.target.value) })}
                                className="h-7 w-16 text-xs"
                            />
                        </div>
                    )}

                    {/* Likert labels */}
                    {needsLikert && (
                        <div className="space-y-1 pl-2">
                            <Label className="text-xs">Scale Labels</Label>
                            {(question.scaleLabels || []).map((label, i) => (
                                <Input
                                    key={i}
                                    value={label}
                                    onChange={(e) => {
                                        const labels = [...(question.scaleLabels || [])];
                                        labels[i] = e.target.value;
                                        onChange({ ...question, scaleLabels: labels });
                                    }}
                                    className="h-7 text-xs"
                                />
                            ))}
                        </div>
                    )}

                    {/* Required toggle */}
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={question.required}
                            onCheckedChange={(v) => onChange({ ...question, required: v })}
                        />
                        <Label className="text-xs text-muted-foreground">Required</Label>
                    </div>
                </div>

                {/* Delete */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={onDelete}
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    );
}
