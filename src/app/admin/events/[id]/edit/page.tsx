'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import RegistrationList from '@/components/events/RegistrationList';
import type { PDEvent, RecurrencePattern, NotificationStep, Registration } from '@/types';
import {
    getEventById,
    updateEvent,
    updateNotificationSequence,
    getRegistrations,
    removeRegistration,
} from '@/lib/services/eventService';
import { toast } from 'sonner';
import { ArrowLeft, Save, CalendarDays, Bell, Repeat, Loader2, Users } from 'lucide-react';

export default function EditEventPage() {
    const router = useRouter();
    const params = useParams();
    const eventId = params.id as string;
    const [event, setEvent] = useState<PDEvent | null>(null);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dateTime, setDateTime] = useState('');
    const [recurrence, setRecurrence] = useState<RecurrencePattern>('none');
    const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
    const [notificationSteps, setNotificationSteps] = useState<NotificationStep[]>([]);
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    const loadEvent = useCallback(async () => {
        const ev = await getEventById(eventId);
        if (!ev) {
            toast.error('Event not found');
            router.push('/admin/events');
            return;
        }
        setEvent(ev);
        setTitle(ev.title);
        setDescription(ev.description);
        setDateTime(
            new Date(ev.dateTime.getTime() - ev.dateTime.getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 16)
        );
        setRecurrence(ev.recurrence);
        setRecurrenceEndDate(ev.recurrenceConfig?.endDate
            ? new Date(ev.recurrenceConfig.endDate.getTime() - ev.recurrenceConfig.endDate.getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 10)
            : ''
        );
        setNotificationSteps(ev.notificationSequence || []);

        const regs = await getRegistrations(eventId);
        setRegistrations(regs);
        setLoading(false);
    }, [eventId, router]);

    useEffect(() => { loadEvent(); }, [loadEvent]);

    const handleSave = async () => {
        if (!title.trim() || !dateTime) return;
        setSaving(true);
        try {
            await updateEvent(eventId, {
                title: title.trim(),
                description: description.trim(),
                dateTime: new Date(dateTime),
                recurrence,
                recurrenceConfig: recurrence !== 'none' ? {
                    interval: 1,
                    endDate: recurrenceEndDate ? new Date(recurrenceEndDate) : undefined,
                } : undefined,
            });
            await updateNotificationSequence(eventId, notificationSteps);
            toast.success('Event updated');
            router.push('/admin/events');
        } catch (err) {
            console.error(err);
            toast.error('Failed to update event');
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveReg = async (regId: string) => {
        await removeRegistration(eventId, regId);
        setRegistrations((prev) => prev.filter((r) => r.id !== regId));
        toast.success('Registration removed');
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/admin/events')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Edit Event</h1>
                    <p className="text-muted-foreground">Update event details and notifications.</p>
                </div>
            </div>

            {/* Event Details */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CalendarDays className="h-5 w-5" />
                        Event Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="event-title">Title *</Label>
                        <Input id="event-title" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="event-desc">Description</Label>
                        <Textarea id="event-desc" value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[100px]" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="event-date">Date & Time *</Label>
                            <Input id="event-date" type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} />
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
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Pattern</Label>
                            <Select value={recurrence} onValueChange={(v) => setRecurrence(v as RecurrencePattern)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
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
                                <Input id="recurrence-end" type="date" value={recurrenceEndDate} onChange={(e) => setRecurrenceEndDate(e.target.value)} />
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
                    <CardDescription>Automated messages before and after the event.</CardDescription>
                </CardHeader>
                <CardContent>
                    <NotificationSequenceBuilder steps={notificationSteps} onChange={setNotificationSteps} />
                </CardContent>
            </Card>

            {/* Registrations */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Registrations ({registrations.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <RegistrationList registrations={registrations} onRemove={handleRemoveReg} />
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => router.push('/admin/events')}>Cancel</Button>
                <Button onClick={handleSave} disabled={!title.trim() || !dateTime || saving} className="gap-2">
                    <Save className="h-4 w-4" />
                    {saving ? 'Saving…' : 'Save Changes'}
                </Button>
            </div>
        </div>
    );
}
