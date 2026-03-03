'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import type { NotificationStep, NotificationChannel, NotificationTiming, Survey } from '@/types';
import { getAllSurveys } from '@/lib/services/surveyService';
import {
    Plus,
    Trash2,
    Bell,
    Mail,
    MessageSquare,
    GripVertical,
    X,
    Pencil,
    Tag,
    User,
    Phone,
    Building2,
    Calendar,
    ClipboardList,
    Link2,
    Loader2,
    ChevronDown,
} from 'lucide-react';

// ── Merge tag definitions ──
const CONTACT_TAGS = [
    { label: 'Name', value: '{{name}}', icon: User },
    { label: 'Phone', value: '{{phone}}', icon: Phone },
    { label: 'Email', value: '{{email}}', icon: Mail },
    { label: 'Company', value: '{{company}}', icon: Building2 },
    { label: 'Categories', value: '{{categories}}', icon: Tag },
];

const EVENT_TAGS = [
    { label: 'Event Title', value: '{{eventTitle}}', icon: Calendar },
    { label: 'Event Date', value: '{{eventDate}}', icon: Calendar },
    { label: 'Event Link', value: '{{eventLink}}', icon: Link2 },
];

const QUICK_CHIPS = [
    { label: 'Name', value: '{{name}}', icon: User },
    { label: 'Phone', value: '{{phone}}', icon: Phone },
    { label: 'Company', value: '{{company}}', icon: Building2 },
    { label: 'Event', value: '{{eventTitle}}', icon: Calendar },
    { label: 'Event Link', value: '{{eventLink}}', icon: Link2 },
];

// ── Example contact for preview ──
const EXAMPLE_CONTACT = {
    name: 'Sarah Johnson',
    phone: '(555) 867-5309',
    email: 'sarah.johnson@example.com',
    company: 'Sunshine Solar Co.',
    categories: 'Premium, West Coast',
};

interface NotificationSequenceBuilderProps {
    steps: NotificationStep[];
    onChange: (steps: NotificationStep[]) => void;
    eventId?: string;
    eventTitle?: string;
    eventDate?: Date;
}

let nextId = 1;

export default function NotificationSequenceBuilder({
    steps,
    onChange,
    eventId,
    eventTitle,
    eventDate,
}: NotificationSequenceBuilderProps) {
    const [editingId, setEditingId] = useState<string | null>(null);

    // Resolve merge tags using example contact
    const resolvePreview = useCallback(
        (text: string) => {
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://pd.solatube.tools';
            const regLink = eventId ? `${baseUrl}/events/${eventId}/register` : `${baseUrl}/events/register`;
            const dateStr = eventDate
                ? eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : 'Mar 15, 2026';
            return text
                .replace(/\{\{name\}\}/g, EXAMPLE_CONTACT.name)
                .replace(/\{\{phone\}\}/g, EXAMPLE_CONTACT.phone)
                .replace(/\{\{email\}\}/g, EXAMPLE_CONTACT.email)
                .replace(/\{\{company\}\}/g, EXAMPLE_CONTACT.company)
                .replace(/\{\{categories\}\}/g, EXAMPLE_CONTACT.categories)
                .replace(/\{\{eventTitle\}\}/g, eventTitle || 'Q1 Dealer Summit')
                .replace(/\{\{eventDate\}\}/g, dateStr)
                .replace(/\{\{eventLink\}\}/g, regLink)
                .replace(/\{\{surveyLink\}\}/g, `${baseUrl}/s/abc123`)
                .replace(/\{\{surveyLink:[^}]+\}\}/g, `${baseUrl}/s/abc123`);
        },
        [eventId, eventTitle, eventDate]
    );
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const dragNodeRef = useRef<HTMLDivElement | null>(null);
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [loadingSurveys, setLoadingSurveys] = useState(false);
    const [surveysLoaded, setSurveysLoaded] = useState(false);

    const loadSurveys = useCallback(async () => {
        if (surveysLoaded) return;
        setLoadingSurveys(true);
        try {
            const data = await getAllSurveys('active');
            setSurveys(data);
            setSurveysLoaded(true);
        } catch (error) {
            console.error('Error loading surveys:', error);
        } finally {
            setLoadingSurveys(false);
        }
    }, [surveysLoaded]);

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
        setEditingId(newStep.id);
    };

    const updateStep = (id: string, updates: Partial<NotificationStep>) => {
        onChange(steps.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    };

    const insertTagAtStep = useCallback(
        (stepId: string, tag: string) => {
            const step = steps.find((s) => s.id === stepId);
            if (step) {
                updateStep(stepId, { customContent: (step.customContent || '') + tag });
            }
        },
        [steps, updateStep]
    );

    const removeStep = (id: string) => {
        onChange(
            steps
                .filter((s) => s.id !== id)
                .map((s, i) => ({ ...s, order: i }))
        );
        if (editingId === id) setEditingId(null);
    };

    // ── Drag & Drop ────────────────────────────────
    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDragIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(index));
        // Make the drag image slightly transparent
        if (e.currentTarget instanceof HTMLElement) {
            dragNodeRef.current = e.currentTarget as HTMLDivElement;
            setTimeout(() => {
                if (dragNodeRef.current) {
                    dragNodeRef.current.style.opacity = '0.4';
                }
            }, 0);
        }
    };

    const handleDragEnd = () => {
        if (dragNodeRef.current) {
            dragNodeRef.current.style.opacity = '1';
        }
        setDragIndex(null);
        setDragOverIndex(null);
        dragNodeRef.current = null;
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragIndex !== null && index !== dragIndex) {
            setDragOverIndex(index);
        }
    };

    const handleDragLeave = () => {
        setDragOverIndex(null);
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (dragIndex === null || dragIndex === dropIndex) return;
        const newSteps = [...steps];
        const [moved] = newSteps.splice(dragIndex, 1);
        newSteps.splice(dropIndex, 0, moved);
        onChange(newSteps.map((s, i) => ({ ...s, order: i })));
        setDragIndex(null);
        setDragOverIndex(null);
    };

    // ── Helpers ────────────────────────────────
    const channelIcon = (ch: NotificationChannel) => {
        if (ch === 'sms') return <MessageSquare className="h-3.5 w-3.5" />;
        if (ch === 'email') return <Mail className="h-3.5 w-3.5" />;
        return <Bell className="h-3.5 w-3.5" />;
    };

    const channelLabel = (ch: NotificationChannel) => {
        if (ch === 'sms') return 'SMS';
        if (ch === 'email') return 'Email';
        return 'SMS + Email';
    };

    const timingSummary = (step: NotificationStep) =>
        `${step.timingValue} ${step.timingUnit} ${step.timing} event`;

    const audienceLabel = (audience: string) =>
        audience === 'all' ? 'All Contacts' : audience === 'category' ? 'By Category' : 'Registered';

    // ── Empty state ────────────────────────────────
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
        <div className="space-y-2">
            {steps.map((step, index) => {
                const isEditing = editingId === step.id;
                const isDragOver = dragOverIndex === index && dragIndex !== index;

                return (
                    <div
                        key={step.id}
                        draggable={!isEditing}
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index)}
                        className={`transition-all duration-150 ${isDragOver ? 'border-t-2 border-blue-500 pt-1' : ''}`}
                    >
                        {isEditing ? (
                            /* ── Expanded Edit Card ── */
                            <Card className="border-blue-400 shadow-md">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="h-5 w-5 justify-center text-[10px]">
                                                {index + 1}
                                            </Badge>
                                            <span className="text-sm font-semibold">Edit Step</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-destructive hover:text-destructive"
                                                onClick={() => removeStep(step.id)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={() => setEditingId(null)}
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className={`flex gap-4 ${(step.channel === 'sms' || step.channel === 'both') ? '' : 'flex-col'}`}>
                                        {/* ── Left: Form ── */}
                                        <div className={`space-y-4 ${(step.channel === 'sms' || step.channel === 'both') ? 'flex-[2]' : 'w-full'}`}>
                                            <div className="grid grid-cols-3 gap-3">
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

                                                {/* Timing direction */}
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

                                            {/* Timing value + unit */}
                                            <div className="flex items-center gap-2">
                                                <Label className="text-xs whitespace-nowrap">Send</Label>
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
                                            </div>

                                            {/* Custom content */}
                                            <div className="space-y-2">
                                                <Label className="text-xs">Message Content (optional)</Label>

                                                {/* Merge tag toolbar (SMS/Both only) */}
                                                {(step.channel === 'sms' || step.channel === 'both') && (
                                                    <>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="outline" size="sm" className="h-7 gap-1 text-[11px]">
                                                                        <Tag className="h-3 w-3" />
                                                                        Insert Field
                                                                        <ChevronDown className="h-3 w-3" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="start" className="w-56">
                                                                    <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                                                        Contact Info
                                                                    </DropdownMenuLabel>
                                                                    {CONTACT_TAGS.map((tag) => {
                                                                        const TagIcon = tag.icon;
                                                                        return (
                                                                            <DropdownMenuItem
                                                                                key={tag.value}
                                                                                onClick={() => insertTagAtStep(step.id, tag.value)}
                                                                            >
                                                                                <TagIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                                                                                <span className="flex-1">{tag.label}</span>
                                                                                <code className="text-[10px] text-muted-foreground/60">{tag.value}</code>
                                                                            </DropdownMenuItem>
                                                                        );
                                                                    })}
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                                                        Event Info
                                                                    </DropdownMenuLabel>
                                                                    {EVENT_TAGS.map((tag) => {
                                                                        const TagIcon = tag.icon;
                                                                        return (
                                                                            <DropdownMenuItem
                                                                                key={tag.value}
                                                                                onClick={() => insertTagAtStep(step.id, tag.value)}
                                                                            >
                                                                                <TagIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                                                                                <span className="flex-1">{tag.label}</span>
                                                                                <code className="text-[10px] text-muted-foreground/60">{tag.value}</code>
                                                                            </DropdownMenuItem>
                                                                        );
                                                                    })}
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>

                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="h-7 gap-1 text-[11px]"
                                                                        onClick={loadSurveys}
                                                                    >
                                                                        <ClipboardList className="h-3 w-3" />
                                                                        Add Survey
                                                                    </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent align="start" className="w-72 p-0">
                                                                    <div className="px-3 py-2 border-b">
                                                                        <p className="text-xs font-semibold">Insert Survey Link</p>
                                                                        <p className="text-[10px] text-muted-foreground">Choose a survey to insert its link</p>
                                                                    </div>
                                                                    <div className="max-h-48 overflow-y-auto">
                                                                        {loadingSurveys ? (
                                                                            <div className="flex items-center justify-center py-6">
                                                                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                                            </div>
                                                                        ) : surveys.length === 0 ? (
                                                                            <div className="px-3 py-4 text-center">
                                                                                <ClipboardList className="h-6 w-6 mx-auto text-muted-foreground/40 mb-1" />
                                                                                <p className="text-xs text-muted-foreground">No active surveys</p>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="py-1">
                                                                                {surveys.map((survey) => (
                                                                                    <button
                                                                                        key={survey.id}
                                                                                        onClick={() => insertTagAtStep(step.id, `{{surveyLink:${survey.id}}}`)}
                                                                                        className="w-full text-left px-3 py-2 hover:bg-accent transition-colors flex items-start gap-2"
                                                                                    >
                                                                                        <Link2 className="h-3.5 w-3.5 mt-0.5 text-blue-500 flex-shrink-0" />
                                                                                        <div className="min-w-0">
                                                                                            <p className="text-xs font-medium truncate">{survey.title}</p>
                                                                                            <p className="text-[10px] text-muted-foreground truncate">
                                                                                                {survey.description || 'No description'}
                                                                                            </p>
                                                                                        </div>
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="border-t px-3 py-2">
                                                                        <p className="text-[10px] text-muted-foreground">
                                                                            Or insert generic:{' '}
                                                                            <button
                                                                                onClick={() => insertTagAtStep(step.id, '{{surveyLink}}')}
                                                                                className="text-blue-500 hover:underline font-mono"
                                                                            >
                                                                                {'{{surveyLink}}'}
                                                                            </button>
                                                                        </p>
                                                                    </div>
                                                                </PopoverContent>
                                                            </Popover>
                                                        </div>

                                                        {/* Quick-insert chips */}
                                                        <div className="flex flex-wrap items-center gap-1.5">
                                                            <span className="text-[10px] text-muted-foreground mr-0.5">Quick insert:</span>
                                                            {QUICK_CHIPS.map((chip) => {
                                                                const ChipIcon = chip.icon;
                                                                return (
                                                                    <button
                                                                        key={chip.value}
                                                                        onClick={() => insertTagAtStep(step.id, chip.value)}
                                                                        className="inline-flex items-center gap-1 rounded-full border border-dashed border-muted-foreground/30 bg-muted/40 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground hover:border-foreground/30 transition-colors"
                                                                    >
                                                                        <ChipIcon className="h-2.5 w-2.5" />
                                                                        {chip.label}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </>
                                                )}

                                                <Textarea
                                                    className="text-xs min-h-[80px] resize-none font-mono"
                                                    placeholder="Custom message or leave empty to use template…"
                                                    value={step.customContent || ''}
                                                    onChange={(e) =>
                                                        updateStep(step.id, { customContent: e.target.value })
                                                    }
                                                />
                                            </div>

                                            <Button
                                                size="sm"
                                                className="w-full"
                                                onClick={() => setEditingId(null)}
                                            >
                                                Done
                                            </Button>
                                        </div>

                                        {/* ── Right: Phone Preview (SMS only) ── */}
                                        {(step.channel === 'sms' || step.channel === 'both') && (
                                            <div className="flex-1 flex items-start justify-center pt-2">
                                                <div className="w-[220px]">
                                                    {/* Example Contact Card */}
                                                    <div className="mb-3 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-2.5">
                                                        <p className="text-[10px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Example Contact</p>
                                                        <div className="flex items-center gap-2 mb-1.5">
                                                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                                                                <span className="text-[9px] font-bold text-white">SJ</span>
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-[11px] font-semibold truncate">{EXAMPLE_CONTACT.name}</p>
                                                                <p className="text-[9px] text-muted-foreground truncate">{EXAMPLE_CONTACT.company}</p>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-0.5 ml-9">
                                                            <div className="flex items-center gap-1.5">
                                                                <Phone className="h-2.5 w-2.5 text-muted-foreground/60" />
                                                                <span className="text-[9px] text-muted-foreground">{EXAMPLE_CONTACT.phone}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <Mail className="h-2.5 w-2.5 text-muted-foreground/60" />
                                                                <span className="text-[9px] text-muted-foreground">{EXAMPLE_CONTACT.email}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <p className="text-[10px] text-center text-muted-foreground mb-2 font-medium">SMS Preview</p>
                                                    {/* Phone frame */}
                                                    <div className="rounded-[24px] border-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-900 p-1 shadow-lg">
                                                        {/* Notch */}
                                                        <div className="flex justify-center pt-1 pb-1">
                                                            <div className="w-16 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700" />
                                                        </div>
                                                        {/* Screen */}
                                                        <div className="rounded-[18px] bg-white dark:bg-gray-950 overflow-hidden">
                                                            {/* Status bar */}
                                                            <div className="flex items-center justify-between px-4 py-1.5 bg-gray-50 dark:bg-gray-900">
                                                                <span className="text-[9px] font-semibold text-gray-600 dark:text-gray-400">9:41</span>
                                                                <div className="flex items-center gap-1">
                                                                    <div className="flex gap-[1px]">
                                                                        <div className="w-[3px] h-[4px] bg-gray-400 rounded-sm" />
                                                                        <div className="w-[3px] h-[6px] bg-gray-400 rounded-sm" />
                                                                        <div className="w-[3px] h-[8px] bg-gray-400 rounded-sm" />
                                                                        <div className="w-[3px] h-[10px] bg-gray-400 rounded-sm" />
                                                                    </div>
                                                                    <div className="w-5 h-2.5 rounded-sm border border-gray-400 relative">
                                                                        <div className="absolute inset-[1px] rounded-[1px] bg-green-500" style={{ width: '70%' }} />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {/* Header */}
                                                            <div className="border-b border-gray-200 dark:border-gray-800 px-3 py-2 bg-gray-50 dark:bg-gray-900">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center">
                                                                        <span className="text-[9px] font-bold text-white">PD</span>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[10px] font-semibold text-gray-900 dark:text-gray-100">Premier Dealer</p>
                                                                        <p className="text-[8px] text-gray-500">Text Message</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {/* Messages area */}
                                                            <div className="px-3 py-3 min-h-[180px] flex flex-col justify-end gap-2">
                                                                {/* Timestamp */}
                                                                <p className="text-[8px] text-gray-400 text-center">
                                                                    Today {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </p>
                                                                {/* Message bubble */}
                                                                <div className="flex justify-start">
                                                                    <div className="max-w-[85%] rounded-2xl rounded-tl-sm px-3 py-2 bg-gray-200 dark:bg-gray-800">
                                                                        <p className="text-[11px] leading-relaxed text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
                                                                            {step.customContent
                                                                                ? resolvePreview(step.customContent)
                                                                                : 'Your message will appear here…'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                {/* Delivered status */}
                                                                <p className="text-[7px] text-gray-400 text-right pr-1">Delivered</p>
                                                            </div>
                                                            {/* Input bar */}
                                                            <div className="border-t border-gray-200 dark:border-gray-800 px-3 py-2 flex items-center gap-2">
                                                                <div className="flex-1 h-6 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 flex items-center">
                                                                    <span className="text-[9px] text-gray-400">Text Message</span>
                                                                </div>
                                                                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                                                                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {/* Home indicator */}
                                                        <div className="flex justify-center py-1.5">
                                                            <div className="w-20 h-1 rounded-full bg-gray-400 dark:bg-gray-600" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            /* ── Collapsed Summary Card ── */
                            <Card
                                className={`group cursor-grab hover:shadow-sm transition-shadow active:cursor-grabbing ${dragIndex === index ? 'opacity-40' : ''
                                    }`}
                                onDoubleClick={() => setEditingId(step.id)}
                            >
                                <CardContent className="p-3">
                                    <div className="flex items-center gap-2">
                                        {/* Drag handle */}
                                        <GripVertical className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground flex-shrink-0" />

                                        {/* Step number */}
                                        <Badge variant="outline" className="h-5 w-5 justify-center text-[10px] flex-shrink-0">
                                            {index + 1}
                                        </Badge>

                                        {/* Channel icon + badge */}
                                        <Badge variant="secondary" className="gap-1 text-[10px] flex-shrink-0">
                                            {channelIcon(step.channel)}
                                            {channelLabel(step.channel)}
                                        </Badge>

                                        {/* Timing summary */}
                                        <span className="text-xs text-muted-foreground truncate">
                                            {timingSummary(step)}
                                        </span>

                                        {/* Audience */}
                                        <Badge variant="outline" className="text-[10px] flex-shrink-0 ml-auto">
                                            {audienceLabel(step.audience)}
                                        </Badge>

                                        {/* Quick actions (visible on hover) */}
                                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingId(step.id);
                                                }}
                                            >
                                                <Pencil className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-destructive hover:text-destructive"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeStep(step.id);
                                                }}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Custom content preview */}
                                    {step.customContent && (
                                        <p className="mt-1.5 ml-[52px] text-[11px] text-muted-foreground truncate">
                                            &ldquo;{step.customContent}&rdquo;
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                );
            })}

            <Button onClick={addStep} variant="outline" size="sm" className="w-full gap-1">
                <Plus className="h-3.5 w-3.5" />
                Add Notification Step
            </Button>

            <p className="text-[10px] text-center text-muted-foreground">
                Double-click a step to edit · Drag to reorder
            </p>
        </div>
    );
}
