'use client';

import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Eye, MessageSquare } from 'lucide-react';

// ── SMS Constants ──
const SMS_SEGMENT_SIZE = 160;
const SMS_CONCAT_SEGMENT_SIZE = 153; // concatenated segments use 7 chars for UDH

const MERGE_TAGS = [
    { label: 'Name', value: '{{name}}' },
    { label: 'Company', value: '{{company}}' },
    { label: 'Email', value: '{{email}}' },
    { label: 'Event Title', value: '{{eventTitle}}' },
    { label: 'Event Date', value: '{{eventDate}}' },
    { label: 'Survey Link', value: '{{surveyLink}}' },
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

    // Preview with sample data
    const previewText = useMemo(() => {
        return value
            .replace(/\{\{name\}\}/g, 'John Doe')
            .replace(/\{\{company\}\}/g, 'ABC Solar')
            .replace(/\{\{email\}\}/g, 'john@example.com')
            .replace(/\{\{eventTitle\}\}/g, 'Q1 Dealer Summit')
            .replace(/\{\{eventDate\}\}/g, 'Mar 15, 2026')
            .replace(/\{\{surveyLink\}\}/g, 'https://pd.solatube.tools/s/abc123');
    }, [value]);

    return (
        <div className="space-y-3">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" disabled={readOnly}>
                                Insert Merge Tag
                                <ChevronDown className="ml-1 h-3 w-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            {MERGE_TAGS.map((tag) => (
                                <DropdownMenuItem
                                    key={tag.value}
                                    onClick={() => insertTag(tag.value)}
                                >
                                    <code className="mr-2 text-xs text-muted-foreground">
                                        {tag.value}
                                    </code>
                                    {tag.label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
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

            {/* Editor */}
            <Textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Type your SMS message…"
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
