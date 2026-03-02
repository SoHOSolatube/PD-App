'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import NotificationSequenceBuilder from '@/components/events/NotificationSequenceBuilder';
import type { PDEvent, RecurrencePattern, NotificationStep } from '@/types';
import { createEvent } from '@/lib/services/eventService';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { ArrowLeft, Save, CalendarDays, Bell, Repeat } from 'lucide-react';

export default function NewEventPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dateTime, setDateTime] = useState('');
    const [recurrence, setRecurrence] = useState<RecurrencePattern>('none');
    const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
    const [notificationSteps, setNotificationSteps] = useState<NotificationStep[]>([]);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!title.trim() || !dateTime) return;
        setSaving(true);
        try {
            await createEvent({
                title: title.trim(),
                description: description.trim(),
                dateTime: new Date(dateTime),
                recurrence,
                recurrenceConfig: recurrence !== 'none' ? {
                    interval: 1,
                    endDate: recurrenceEndDate ? new Date(recurrenceEndDate) : undefined,
                } : undefined,
                status: 'draft',
                notificationSequence: notificationSteps,
                createdBy: user?.uid || '',
            });
            toast.success('Event created');
            router.push('/admin/events');
        } catch (err) {
            console.error(err);
            toast.error('Failed to create event');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/admin/events')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">New Event</h1>
                    <p className="text-muted-foreground">Create a new event for your dealers.</p>
                </div>
            </div>

            {/* Event Details */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CalendarDays className="h-5 w-5" />
                        Event Details
                    </CardTitle>
                    <CardDescription>Basic information about the event.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                            className="min-h-[100px]"
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
                    </div>
                </CardContent>
            </Card>

            {/* Recurrence */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Repeat className="h-5 w-5" />
                        Recurrence
                    </CardTitle>
                    <CardDescription>Set the event to repeat on a schedule.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Pattern</Label>
                            <Select value={recurrence} onValueChange={(v) => setRecurrence(v as RecurrencePattern)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">One-time</SelectItem>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="biweekly">Biweekly</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="custom">Custom</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {recurrence !== 'none' && (
                            <div className="space-y-2">
                                <Label htmlFor="recurrence-end">End Date (optional)</Label>
                                <Input
                                    id="recurrence-end"
                                    type="date"
                                    value={recurrenceEndDate}
                                    onChange={(e) => setRecurrenceEndDate(e.target.value)}
                                />
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Notification Sequence */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notification Sequence
                    </CardTitle>
                    <CardDescription>
                        Set up automated messages before and after the event.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <NotificationSequenceBuilder
                        steps={notificationSteps}
                        onChange={setNotificationSteps}
                    />
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => router.push('/admin/events')}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    disabled={!title.trim() || !dateTime || saving}
                    className="gap-2"
                >
                    <Save className="h-4 w-4" />
                    {saving ? 'Creating…' : 'Create Event'}
                </Button>
            </div>
        </div>
    );
}
