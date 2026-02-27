'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { getSurveyById, submitResponse, checkDuplicate } from '@/lib/services/surveyService';
import type { Survey, SurveyQuestion } from '@/types';
import { CheckCircle2, Loader2, ListChecks, Lock } from 'lucide-react';

export default function PublicSurveyPage() {
    const params = useParams();
    const surveyId = params.id as string;
    const [survey, setSurvey] = useState<Survey | null>(null);
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState<Record<string, unknown>>({});
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const [alreadySubmitted, setAlreadySubmitted] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const s = await getSurveyById(surveyId);
                setSurvey(s);

                // Check for duplicate submission
                const token = localStorage.getItem(`survey-${surveyId}`);
                if (token) {
                    const isDup = await checkDuplicate(surveyId, token);
                    if (isDup) setAlreadySubmitted(true);
                }
            } catch {
                setError('Survey not found');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [surveyId]);

    const setAnswer = (questionId: string, value: unknown) => {
        setAnswers((prev) => ({ ...prev, [questionId]: value }));
    };

    const toggleMultiChoice = (questionId: string, option: string) => {
        const current = (answers[questionId] as string[]) || [];
        const updated = current.includes(option)
            ? current.filter((o) => o !== option)
            : [...current, option];
        setAnswer(questionId, updated);
    };

    const handleSubmit = async () => {
        if (!survey) return;

        // Validate required
        for (const q of survey.questions) {
            if (q.required && !answers[q.id]) {
                setError(`Please answer: "${q.text}"`);
                return;
            }
        }

        setSubmitting(true);
        setError('');

        try {
            const trackingToken = `${surveyId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            await submitResponse(surveyId, {
                surveyId,
                answers,
                trackingToken,
            });
            localStorage.setItem(`survey-${surveyId}`, trackingToken);
            setDone(true);
        } catch {
            setError('Failed to submit. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const renderQuestion = (q: SurveyQuestion, index: number) => {
        switch (q.type) {
            case 'single-choice':
                return (
                    <RadioGroup
                        value={(answers[q.id] as string) || ''}
                        onValueChange={(v) => setAnswer(q.id, v)}
                    >
                        {(q.options || []).map((opt) => (
                            <div key={opt} className="flex items-center gap-2">
                                <RadioGroupItem value={opt} id={`${q.id}-${opt}`} />
                                <Label htmlFor={`${q.id}-${opt}`} className="text-sm">{opt}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                );

            case 'multiple-choice':
                return (
                    <div className="space-y-2">
                        {(q.options || []).map((opt) => (
                            <div key={opt} className="flex items-center gap-2">
                                <Checkbox
                                    checked={((answers[q.id] as string[]) || []).includes(opt)}
                                    onCheckedChange={() => toggleMultiChoice(q.id, opt)}
                                    id={`${q.id}-${opt}`}
                                />
                                <Label htmlFor={`${q.id}-${opt}`} className="text-sm">{opt}</Label>
                            </div>
                        ))}
                    </div>
                );

            case 'true-false':
                return (
                    <RadioGroup
                        value={(answers[q.id] as string) || ''}
                        onValueChange={(v) => setAnswer(q.id, v)}
                    >
                        <div className="flex items-center gap-2">
                            <RadioGroupItem value="True" id={`${q.id}-true`} />
                            <Label htmlFor={`${q.id}-true`}>True</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <RadioGroupItem value="False" id={`${q.id}-false`} />
                            <Label htmlFor={`${q.id}-false`}>False</Label>
                        </div>
                    </RadioGroup>
                );

            case 'short-answer':
                return (
                    <Input
                        value={(answers[q.id] as string) || ''}
                        onChange={(e) => setAnswer(q.id, e.target.value)}
                        placeholder="Your answer…"
                    />
                );

            case 'long-answer':
                return (
                    <Textarea
                        value={(answers[q.id] as string) || ''}
                        onChange={(e) => setAnswer(q.id, e.target.value)}
                        placeholder="Your answer…"
                        className="min-h-[100px]"
                    />
                );

            case 'star-rating':
                return (
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onClick={() => setAnswer(q.id, star)}
                                className={`text-2xl transition-colors ${(answers[q.id] as number) >= star
                                        ? 'text-amber-400'
                                        : 'text-muted-foreground/30'
                                    }`}
                            >
                                ★
                            </button>
                        ))}
                    </div>
                );

            case 'number-scale':
                return (
                    <div className="flex items-center gap-1">
                        {Array.from(
                            { length: (q.scaleMax || 10) - (q.scaleMin || 1) + 1 },
                            (_, i) => (q.scaleMin || 1) + i
                        ).map((num) => (
                            <button
                                key={num}
                                onClick={() => setAnswer(q.id, num)}
                                className={`h-9 w-9 rounded-lg text-xs font-medium transition-colors ${answers[q.id] === num
                                        ? 'bg-[#0082c4] text-white'
                                        : 'border bg-background hover:bg-muted'
                                    }`}
                            >
                                {num}
                            </button>
                        ))}
                    </div>
                );

            case 'likert-scale':
                return (
                    <RadioGroup
                        value={String(answers[q.id] || '')}
                        onValueChange={(v) => setAnswer(q.id, parseInt(v))}
                    >
                        {(q.scaleLabels || []).map((label, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <RadioGroupItem value={String(i + 1)} id={`${q.id}-${i}`} />
                                <Label htmlFor={`${q.id}-${i}`} className="text-sm">{label}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                );

            case 'dropdown':
                return (
                    <Select
                        value={(answers[q.id] as string) || ''}
                        onValueChange={(v) => setAnswer(q.id, v)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select…" />
                        </SelectTrigger>
                        <SelectContent>
                            {(q.options || []).map((opt) => (
                                <SelectItem key={opt} value={opt}>
                                    {opt}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );

            case 'ranking':
                return (
                    <div className="space-y-1 text-sm text-muted-foreground">
                        {(q.options || []).map((opt, i) => (
                            <div key={opt} className="flex items-center gap-2 rounded border px-3 py-2">
                                <span className="text-xs font-medium">{i + 1}.</span> {opt}
                            </div>
                        ))}
                        <p className="text-xs italic">Ranking is display-only in this version.</p>
                    </div>
                );

            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!survey || survey.status !== 'active') {
        return (
            <div className="flex min-h-screen items-center justify-center p-6">
                <Card className="w-full max-w-md text-center">
                    <CardContent className="py-12">
                        <Lock className="mx-auto h-12 w-12 text-muted-foreground/40" />
                        <h2 className="mt-4 text-xl font-bold">Survey Unavailable</h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            This survey is no longer accepting responses.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (alreadySubmitted || done) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 p-6">
                <Card className="w-full max-w-md text-center">
                    <CardContent className="py-12">
                        <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
                        <h2 className="mt-4 text-2xl font-bold">Thank You!</h2>
                        <p className="mt-2 text-muted-foreground">
                            Your response has been recorded.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
            <header className="border-b bg-white/80 backdrop-blur dark:bg-slate-950/80">
                <div className="mx-auto flex max-w-2xl items-center gap-3 px-6 py-4">
                    <div
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white"
                        style={{ backgroundColor: '#0082c4' }}
                    >
                        PD
                    </div>
                    <span className="text-lg font-semibold">Solatube Survey</span>
                </div>
            </header>

            <main className="mx-auto max-w-2xl px-6 py-10">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold">{survey.title}</h1>
                    {survey.description && (
                        <p className="mt-2 text-muted-foreground">{survey.description}</p>
                    )}
                </div>

                <div className="space-y-6">
                    {survey.questions.map((q, i) => (
                        <Card key={q.id}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">
                                    {q.text || `Question ${i + 1}`}
                                    {q.required && <span className="ml-1 text-destructive">*</span>}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>{renderQuestion(q, i)}</CardContent>
                        </Card>
                    ))}
                </div>

                {error && (
                    <p className="mt-4 text-sm text-destructive">{error}</p>
                )}

                <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="mt-8 w-full"
                    style={{ backgroundColor: '#0082c4' }}
                >
                    {submitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting…
                        </>
                    ) : (
                        'Submit Survey'
                    )}
                </Button>
            </main>
        </div>
    );
}
