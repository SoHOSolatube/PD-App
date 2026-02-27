'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { getAllSkills, type Skill } from '@/lib/services/skillService';
import { Sparkles, AlertCircle, Loader2 } from 'lucide-react';

interface AiGenerateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onGenerated: (html: string) => void;
}

export default function AiGenerateDialog({
    open,
    onOpenChange,
    onGenerated,
}: AiGenerateDialogProps) {
    const [skills, setSkills] = useState<Skill[]>([]);
    const [selectedSkill, setSelectedSkill] = useState('');
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [apiConfigured, setApiConfigured] = useState(false);

    useEffect(() => {
        if (open) {
            getAllSkills().then(setSkills);
            // TODO: Check if OpenAI key is configured in settings
            setApiConfigured(false);
        }
    }, [open]);

    const handleGenerate = async () => {
        if (!selectedSkill || !prompt.trim()) return;
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/ai/generate-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ skillId: selectedSkill, prompt }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Generation failed');
            }

            const { html } = await res.json();
            onGenerated(html);
            onOpenChange(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-amber-500" />
                        AI Email Generator
                    </DialogTitle>
                    <DialogDescription>
                        Generate an email template using AI with your configured skills.
                    </DialogDescription>
                </DialogHeader>

                {!apiConfigured ? (
                    <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50/50 p-6 text-center dark:bg-amber-950/20">
                        <AlertCircle className="mx-auto mb-2 h-8 w-8 text-amber-500" />
                        <p className="text-sm font-medium">OpenAI Not Configured</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Add your OpenAI API key in{' '}
                            <span className="font-medium">Settings → API Connections</span>{' '}
                            to enable AI-powered email generation.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>AI Skill</Label>
                            <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a skill…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {skills.map((skill) => (
                                        <SelectItem key={skill.id} value={skill.id}>
                                            {skill.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>What should the email be about?</Label>
                            <Textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="e.g. Monthly newsletter announcing our new Solar Daylight system…"
                                className="min-h-[100px]"
                            />
                        </div>

                        {error && (
                            <Badge variant="destructive" className="w-full justify-center">
                                {error}
                            </Badge>
                        )}

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleGenerate}
                                disabled={!selectedSkill || !prompt.trim() || loading}
                                className="gap-1.5"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Generating…
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-4 w-4" />
                                        Generate
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
