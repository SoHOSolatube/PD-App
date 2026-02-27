'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import QuestionEditor from '@/components/surveys/QuestionEditor';
import type { SurveyQuestion, QuestionType } from '@/types';
import { Plus, ListChecks } from 'lucide-react';

interface SurveyBuilderProps {
    questions: SurveyQuestion[];
    onChange: (questions: SurveyQuestion[]) => void;
}

let nextId = 1;

export default function SurveyBuilder({ questions, onChange }: SurveyBuilderProps) {
    const addQuestion = (type: QuestionType = 'single-choice') => {
        const newQ: SurveyQuestion = {
            id: `q-${Date.now()}-${nextId++}`,
            type,
            text: '',
            required: false,
            options: ['single-choice', 'multiple-choice', 'dropdown', 'ranking'].includes(type)
                ? ['Option 1', 'Option 2']
                : undefined,
            scaleMin: type === 'number-scale' ? 1 : undefined,
            scaleMax: type === 'number-scale' ? 10 : undefined,
            scaleLabels: type === 'likert-scale'
                ? ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']
                : undefined,
            order: questions.length,
        };
        onChange([...questions, newQ]);
    };

    const updateQuestion = (id: string, updated: SurveyQuestion) => {
        onChange(questions.map((q) => (q.id === id ? updated : q)));
    };

    const deleteQuestion = (id: string) => {
        onChange(
            questions
                .filter((q) => q.id !== id)
                .map((q, i) => ({ ...q, order: i }))
        );
    };

    if (questions.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <ListChecks className="h-10 w-10 text-muted-foreground/40" />
                    <p className="mt-3 text-sm text-muted-foreground">No questions yet.</p>
                    <p className="text-xs text-muted-foreground">Add your first question to get started.</p>
                    <Button onClick={() => addQuestion()} size="sm" className="mt-4 gap-1">
                        <Plus className="h-3.5 w-3.5" />
                        Add Question
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-3">
            {questions.map((q, i) => (
                <QuestionEditor
                    key={q.id}
                    question={q}
                    index={i}
                    onChange={(updated) => updateQuestion(q.id, updated)}
                    onDelete={() => deleteQuestion(q.id)}
                />
            ))}
            <Button
                onClick={() => addQuestion()}
                variant="outline"
                size="sm"
                className="w-full gap-1"
            >
                <Plus className="h-3.5 w-3.5" />
                Add Question
            </Button>
        </div>
    );
}
