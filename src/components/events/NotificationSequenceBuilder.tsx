'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { NotificationStep, NotificationChannel, NotificationTiming } from '@/types';
import { Plus, Trash2, ChevronUp, ChevronDown, Bell, Mail, MessageSquare } from 'lucide-react';

interface NotificationSequenceBuilderProps {
    steps: NotificationStep[];
    onChange: (steps: NotificationStep[]) => void;
}

let nextId = 1;

export default function NotificationSequenceBuilder({
    steps,
    onChange,
}: NotificationSequenceBuilderProps) {
    const addStep = () => {
        const newStep: NotificationStep = {
            id: `step-${Date.now()}-${nextId++}`,
            order: steps.length,
            channel: 'sms',
            timing: 'before',
            timingValue: 1,
            timingUnit: 'days',
            audience: 'registered',
        };
        onChange([...steps, newStep]);
    };

    const updateStep = (id: string, updates: Partial<NotificationStep>) => {
        onChange(steps.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    };

    const removeStep = (id: string) => {
        onChange(
            steps
                .filter((s) => s.id !== id)
                .map((s, i) => ({ ...s, order: i }))
        );
    };

    const moveStep = (index: number, direction: -1 | 1) => {
        const newSteps = [...steps];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= newSteps.length) return;
        [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
        onChange(newSteps.map((s, i) => ({ ...s, order: i })));
    };

    const channelIcon = (ch: NotificationChannel) => {
        if (ch === 'sms') return <MessageSquare className="h-3 w-3" />;
        if (ch === 'email') return <Mail className="h-3 w-3" />;
        return <Bell className="h-3 w-3" />;
    };

    if (steps.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-6 text-center">
                <Bell className="h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">No notification steps yet.</p>
                <Button onClick={addStep} size="sm" className="mt-3 gap-1">
                    <Plus className="h-3.5 w-3.5" />
                    Add Step
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {steps.map((step, index) => (
                <Card key={step.id} className="relative">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            {/* Order controls */}
                            <div className="flex flex-col gap-0.5 pt-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5"
                                    disabled={index === 0}
                                    onClick={() => moveStep(index, -1)}
                                >
                                    <ChevronUp className="h-3 w-3" />
                                </Button>
                                <Badge variant="outline" className="h-5 w-5 justify-center text-[10px]">
                                    {index + 1}
                                </Badge>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5"
                                    disabled={index === steps.length - 1}
                                    onClick={() => moveStep(index, 1)}
                                >
                                    <ChevronDown className="h-3 w-3" />
                                </Button>
                            </div>

                            {/* Step config */}
                            <div className="flex-1 space-y-3">
                                <div className="grid grid-cols-3 gap-2">
                                    {/* Channel */}
                                    <div className="space-y-1">
                                        <Label className="text-xs">Channel</Label>
                                        <Select
                                            value={step.channel}
                                            onValueChange={(v) =>
                                                updateStep(step.id, { channel: v as NotificationChannel })
                                            }
                                        >
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="sms">SMS</SelectItem>
                                                <SelectItem value="email">Email</SelectItem>
                                                <SelectItem value="both">Both</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Timing */}
                                    <div className="space-y-1">
                                        <Label className="text-xs">When</Label>
                                        <Select
                                            value={step.timing}
                                            onValueChange={(v) =>
                                                updateStep(step.id, { timing: v as NotificationTiming })
                                            }
                                        >
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="before">Before</SelectItem>
                                                <SelectItem value="after">After</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Audience */}
                                    <div className="space-y-1">
                                        <Label className="text-xs">Audience</Label>
                                        <Select
                                            value={step.audience}
                                            onValueChange={(v) =>
                                                updateStep(step.id, { audience: v as NotificationStep['audience'] })
                                            }
                                        >
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="registered">Registered</SelectItem>
                                                <SelectItem value="all">All Contacts</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Timing value */}
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        min={1}
                                        className="h-8 w-16 text-xs"
                                        value={step.timingValue}
                                        onChange={(e) =>
                                            updateStep(step.id, { timingValue: parseInt(e.target.value) || 1 })
                                        }
                                    />
                                    <Select
                                        value={step.timingUnit}
                                        onValueChange={(v) =>
                                            updateStep(step.id, { timingUnit: v as NotificationStep['timingUnit'] })
                                        }
                                    >
                                        <SelectTrigger className="h-8 w-24 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="minutes">Minutes</SelectItem>
                                            <SelectItem value="hours">Hours</SelectItem>
                                            <SelectItem value="days">Days</SelectItem>
                                            <SelectItem value="weeks">Weeks</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <span className="text-xs text-muted-foreground">
                                        {step.timing} event
                                    </span>
                                    <Badge variant="outline" className="ml-auto gap-1 text-[10px]">
                                        {channelIcon(step.channel)}
                                        {step.channel.toUpperCase()}
                                    </Badge>
                                </div>

                                {/* Custom content */}
                                <Input
                                    className="h-8 text-xs"
                                    placeholder="Custom message (optional) or leave empty to use template"
                                    value={step.customContent || ''}
                                    onChange={(e) =>
                                        updateStep(step.id, { customContent: e.target.value })
                                    }
                                />
                            </div>

                            {/* Delete */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => removeStep(step.id)}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}

            <Button onClick={addStep} variant="outline" size="sm" className="w-full gap-1">
                <Plus className="h-3.5 w-3.5" />
                Add Notification Step
            </Button>
        </div>
    );
}
