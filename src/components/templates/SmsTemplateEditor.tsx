'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import {
    ChevronDown,
    Eye,
    MessageSquare,
    ClipboardList,
    User,
    Phone,
    Mail,
    Building2,
    Calendar,
    Tag,
    Link2,
    Loader2,
} from 'lucide-react';
import { getAllSurveys } from '@/lib/services/surveyService';
import type { Survey } from '@/types';

// ── SMS Constants ──
const SMS_SEGMENT_SIZE = 160;
const SMS_CONCAT_SEGMENT_SIZE = 153; // concatenated segments use 7 chars for UDH

// Organized merge tag groups
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

const ALL_MERGE_TAGS = [...CONTACT_TAGS, ...EVENT_TAGS];

// Quick-insert chips (the most commonly used ones)
const QUICK_CHIPS = [
    { label: 'Name', value: '{{name}}', icon: User },
    { label: 'Phone', value: '{{phone}}', icon: Phone },
    { label: 'Company', value: '{{company}}', icon: Building2 },
    { label: 'Event', value: '{{eventTitle}}', icon: Calendar },
    { label: 'Event Link', value: '{{eventLink}}', icon: Link2 },
];

interface SmsTemplateEditorProps {
    value: string;
    onChange: (value: string) => void;
    readOnly?: boolean;
}

export default function SmsTemplateEditor({
    value,
    onChange,
    readOnly = false,
}: SmsTemplateEditorProps) {
    const [showPreview, setShowPreview] = useState(false);
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [loadingSurveys, setLoadingSurveys] = useState(false);
    const [surveysLoaded, setSurveysLoaded] = useState(false);

    const charCount = value.length;
    const segmentCount = useMemo(() => {
        if (charCount === 0) return 0;
        if (charCount <= SMS_SEGMENT_SIZE) return 1;
        return Math.ceil(charCount / SMS_CONCAT_SEGMENT_SIZE);
    }, [charCount]);

    const insertTag = useCallback(
        (tag: string) => {
            onChange(value + tag);
        },
        [value, onChange]
    );

    // Load surveys on demand
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

    const insertSurveyLink = useCallback(
        (survey: Survey) => {
            const tag = `{{surveyLink:${survey.id}}}`;
            onChange(value + tag);
        },
        [value, onChange]
    );

    // Preview with sample data
    const previewText = useMemo(() => {
        return value
            .replace(/\{\{name\}\}/g, 'John Doe')
            .replace(/\{\{phone\}\}/g, '(555) 123-4567')
            .replace(/\{\{company\}\}/g, 'ABC Solar')
            .replace(/\{\{email\}\}/g, 'john@example.com')
            .replace(/\{\{categories\}\}/g, 'Premium, West Coast')
            .replace(/\{\{eventTitle\}\}/g, 'Q1 Dealer Summit')
            .replace(/\{\{eventDate\}\}/g, 'Mar 15, 2026')
            .replace(/\{\{eventLink\}\}/g, 'https://pd.solatube.tools/events/abc123/register')
            .replace(/\{\{surveyLink\}\}/g, 'https://pd.solatube.tools/s/abc123')
            .replace(/\{\{surveyLink:[^}]+\}\}/g, 'https://pd.solatube.tools/s/abc123');
    }, [value]);

    return (
        <div className="space-y-3">
            {/* Toolbar */}
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                    {/* Merge Tags Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" disabled={readOnly} className="gap-1">
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
                                const Icon = tag.icon;
                                return (
                                    <DropdownMenuItem
                                        key={tag.value}
                                        onClick={() => insertTag(tag.value)}
                                    >
                                        <Icon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="flex-1">{tag.label}</span>
                                        <code className="text-[10px] text-muted-foreground/60">
                                            {tag.value}
                                        </code>
                                    </DropdownMenuItem>
                                );
                            })}
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                Event Info
                            </DropdownMenuLabel>
                            {EVENT_TAGS.map((tag) => {
                                const Icon = tag.icon;
                                return (
                                    <DropdownMenuItem
                                        key={tag.value}
                                        onClick={() => insertTag(tag.value)}
                                    >
                                        <Icon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="flex-1">{tag.label}</span>
                                        <code className="text-[10px] text-muted-foreground/60">
                                            {tag.value}
                                        </code>
                                    </DropdownMenuItem>
                                );
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Add Survey Button */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={readOnly}
                                className="gap-1"
                                onClick={loadSurveys}
                            >
                                <ClipboardList className="h-3 w-3" />
                                Add Survey
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-72 p-0">
                            <div className="px-3 py-2 border-b">
                                <p className="text-xs font-semibold">Insert Survey Link</p>
                                <p className="text-[10px] text-muted-foreground">
                                    Choose a survey to insert its unique link
                                </p>
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                                {loadingSurveys ? (
                                    <div className="flex items-center justify-center py-6">
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    </div>
                                ) : surveys.length === 0 ? (
                                    <div className="px-3 py-4 text-center">
                                        <ClipboardList className="h-6 w-6 mx-auto text-muted-foreground/40 mb-1" />
                                        <p className="text-xs text-muted-foreground">
                                            No active surveys found
                                        </p>
                                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                                            Create a survey first in the Surveys section
                                        </p>
                                    </div>
                                ) : (
                                    <div className="py-1">
                                        {surveys.map((survey) => (
                                            <button
                                                key={survey.id}
                                                onClick={() => insertSurveyLink(survey)}
                                                className="w-full text-left px-3 py-2 hover:bg-accent transition-colors flex items-start gap-2"
                                            >
                                                <Link2 className="h-3.5 w-3.5 mt-0.5 text-blue-500 flex-shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="text-xs font-medium truncate">
                                                        {survey.title}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground truncate">
                                                        {survey.description || 'No description'}
                                                    </p>
                                                </div>
                                                <Badge variant="outline" className="text-[9px] ml-auto flex-shrink-0">
                                                    {survey.status}
                                                </Badge>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="border-t px-3 py-2">
                                <p className="text-[10px] text-muted-foreground">
                                    Or insert generic: <button
                                        onClick={() => insertTag('{{surveyLink}}')}
                                        className="text-blue-500 hover:underline font-mono"
                                    >
                                        {'{{surveyLink}}'}
                                    </button>
                                </p>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                    className="gap-1.5"
                >
                    <Eye className="h-3.5 w-3.5" />
                    {showPreview ? 'Hide Preview' : 'Preview'}
                </Button>
            </div>

            {/* Quick-Insert Chips */}
            {!readOnly && (
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground mr-0.5">Quick insert:</span>
                    {QUICK_CHIPS.map((chip) => {
                        const Icon = chip.icon;
                        return (
                            <button
                                key={chip.value}
                                onClick={() => insertTag(chip.value)}
                                className="inline-flex items-center gap-1 rounded-full border border-dashed border-muted-foreground/30 bg-muted/40 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground hover:border-foreground/30 transition-colors"
                            >
                                <Icon className="h-2.5 w-2.5" />
                                {chip.label}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Editor */}
            <Textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Type your SMS message… Use merge tags to personalize."
                className="min-h-[120px] font-mono text-sm"
                readOnly={readOnly}
            />

            {/* Char Counter */}
            <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">
                        <span
                            className={
                                charCount > SMS_SEGMENT_SIZE * 3
                                    ? 'text-destructive font-medium'
                                    : ''
                            }
                        >
                            {charCount}
                        </span>{' '}
                        characters
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                        <MessageSquare className="mr-1 h-2.5 w-2.5" />
                        {segmentCount} segment{segmentCount !== 1 ? 's' : ''}
                    </Badge>
                </div>
                <span className="text-muted-foreground">
                    {SMS_SEGMENT_SIZE - (charCount % SMS_SEGMENT_SIZE || SMS_SEGMENT_SIZE)}{' '}
                    chars remaining in segment
                </span>
            </div>

            {/* Merge Tag Legend */}
            <details className="text-[10px]">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                    Available merge tags reference
                </summary>
                <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-0.5 rounded-md border bg-muted/30 p-2">
                    {ALL_MERGE_TAGS.map((tag) => (
                        <div key={tag.value} className="flex items-center justify-between">
                            <span className="text-muted-foreground">{tag.label}</span>
                            <code className="text-muted-foreground/60 font-mono">{tag.value}</code>
                        </div>
                    ))}
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Survey Link</span>
                        <code className="text-muted-foreground/60 font-mono">{'{{surveyLink}}'}</code>
                    </div>
                </div>
            </details>

            {/* Preview */}
            {showPreview && (
                <Card className="border-dashed">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground">
                            Preview (with sample data)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-lg bg-muted/50 p-3">
                            <p className="text-sm whitespace-pre-wrap">
                                {previewText || (
                                    <span className="italic text-muted-foreground">
                                        Empty message…
                                    </span>
                                )}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
