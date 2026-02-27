'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
import type { PDEvent, RecurrencePattern } from '@/types';

interface EventDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    event?: PDEvent | null;
    onSave: (data: {
        title: string;
        description: string;
        dateTime: Date;
        recurrence: RecurrencePattern;
    }) => Promise<void>;
}

export default function EventDialog({
    open,
    onOpenChange,
    event,
    onSave,
}: EventDialogProps) {
    const [title, setTitle] = useState(event?.title || '');
    const [description, setDescription] = useState(event?.description || '');
    const [dateTime, setDateTime] = useState(
        event?.dateTime
            ? new Date(event.dateTime.getTime() - event.dateTime.getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 16)
            : ''
    );
    const [recurrence, setRecurrence] = useState<RecurrencePattern>(
        event?.recurrence || 'none'
    );
    const [saving, setSaving] = useState(false);

    const handleSubmit = async () => {
        if (!title.trim() || !dateTime) return;
        setSaving(true);
        try {
            await onSave({
                title: title.trim(),
                description: description.trim(),
                dateTime: new Date(dateTime),
                recurrence,
            });
            onOpenChange(false);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{event ? 'Edit Event' : 'New Event'}</DialogTitle>
                    <DialogDescription>
                        {event ? 'Update event details.' : 'Create a new event for your dealers.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="event-title">Title *</Label>
                        <Input
                            id="event-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Q2 Dealer Summit"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="event-desc">Description</Label>
                        <Textarea
                            id="event-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Event details…"
                            className="min-h-[80px]"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="event-date">Date & Time *</Label>
                            <Input
                                id="event-date"
                                type="datetime-local"
                                value={dateTime}
                                onChange={(e) => setDateTime(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Recurrence</Label>
                            <Select value={recurrence} onValueChange={(v) => setRecurrence(v as RecurrencePattern)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">One-time</SelectItem>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="biweekly">Biweekly</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={!title.trim() || !dateTime || saving}
                        >
                            {saving ? 'Saving…' : event ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
