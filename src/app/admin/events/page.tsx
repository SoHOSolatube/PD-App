'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import EventDialog from '@/components/events/EventDialog';
import RegistrationList from '@/components/events/RegistrationList';
import NotificationSequenceBuilder from '@/components/events/NotificationSequenceBuilder';
import {
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  publishEvent,
  unpublishEvent,
  getRegistrations,
  removeRegistration,
  updateNotificationSequence,
} from '@/lib/services/eventService';
import { useAuth } from '@/context/AuthContext';
import type { PDEvent, Registration, NotificationStep, RecurrencePattern } from '@/types';
import { toast } from 'sonner';
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Globe,
  GlobeLock,
  CalendarDays,
  Users,
  Bell,
  Loader2,
  Calendar,
  Repeat,
  ExternalLink,
} from 'lucide-react';

export default function EventsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [events, setEvents] = useState<PDEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<PDEvent | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [seqSteps, setSeqSteps] = useState<NotificationStep[]>([]);
  const [savingSeq, setSavingSeq] = useState(false);

  const loadEvents = useCallback(async () => {
    try {
      const data = await getAllEvents();
      setEvents(data);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const selectEvent = async (event: PDEvent) => {
    setSelectedEvent(event);
    setSeqSteps(event.notificationSequence || []);
    try {
      const regs = await getRegistrations(event.id);
      setRegistrations(regs);
    } catch {
      setRegistrations([]);
    }
  };



  const handlePublish = async (event: PDEvent) => {
    if (event.status === 'published') {
      await unpublishEvent(event.id);
      toast.success('Event unpublished');
    } else {
      await publishEvent(event.id);
      toast.success('Event published');
    }
    loadEvents();
  };

  const handleDelete = async (event: PDEvent) => {
    if (!confirm(`Delete "${event.title}"?`)) return;
    await deleteEvent(event.id);
    toast.success('Event deleted');
    if (selectedEvent?.id === event.id) setSelectedEvent(null);
    loadEvents();
  };

  const handleRemoveReg = async (regId: string) => {
    if (!selectedEvent) return;
    await removeRegistration(selectedEvent.id, regId);
    toast.success('Registration removed');
    const regs = await getRegistrations(selectedEvent.id);
    setRegistrations(regs);
  };

  const handleSaveSequence = async () => {
    if (!selectedEvent) return;
    setSavingSeq(true);
    try {
      await updateNotificationSequence(selectedEvent.id, seqSteps);
      toast.success('Notification sequence saved');
    } finally {
      setSavingSeq(false);
    }
  };

  const StatusBadge = ({ status }: { status: string }) => (
    <Badge
      variant={status === 'published' ? 'default' : 'outline'}
      className={status === 'published' ? 'bg-green-600' : ''}
    >
      {status === 'published' ? (
        <Globe className="mr-1 h-3 w-3" />
      ) : (
        <GlobeLock className="mr-1 h-3 w-3" />
      )}
      {status}
    </Badge>
  );

  const RecurrenceBadge = ({ pattern }: { pattern: string }) => {
    if (pattern === 'none') return null;
    return (
      <Badge variant="outline" className="text-[10px] gap-1">
        <Repeat className="h-2.5 w-2.5" />
        {pattern}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          <p className="mt-1 text-muted-foreground">
            Create and manage events, registrations, and notifications.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => window.open('/events', '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
            View Events Live
          </Button>
          <Button
            onClick={() => router.push('/admin/events/new')}
            style={{ backgroundColor: 'var(--solatube-blue)' }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            New Event
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Event List */}
        <div className="lg:col-span-2">
          {loading ? (
            <Card>
              <CardContent className="flex h-48 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
              </CardContent>
            </Card>
          ) : events.length === 0 ? (
            <Card>
              <CardContent className="flex h-48 flex-col items-center justify-center gap-2">
                <CalendarDays className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No events yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow
                      key={event.id}
                      className={`cursor-pointer ${selectedEvent?.id === event.id ? 'bg-muted/50' : ''}`}
                      onClick={() => selectEvent(event)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <div className="flex gap-1 mt-1">
                            <RecurrenceBadge pattern={event.recurrence} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {event.dateTime.toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={event.status} />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/admin/events/${event.id}/edit`);
                              }}
                            >
                              <Pencil className="mr-2 h-3.5 w-3.5" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePublish(event);
                              }}
                            >
                              {event.status === 'published' ? (
                                <>
                                  <GlobeLock className="mr-2 h-3.5 w-3.5" />
                                  Unpublish
                                </>
                              ) : (
                                <>
                                  <Globe className="mr-2 h-3.5 w-3.5" />
                                  Publish
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(event);
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div className="space-y-4">
          {selectedEvent ? (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{selectedEvent.title}</CardTitle>
                  <CardDescription>
                    {selectedEvent.description || 'No description'}
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Registrations */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4" />
                    Registrations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RegistrationList
                    registrations={registrations}
                    onRemove={handleRemoveReg}
                  />
                </CardContent>
              </Card>

              {/* Notification Sequence */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Bell className="h-4 w-4" />
                      Notifications
                    </CardTitle>
                    {seqSteps.length > 0 && (
                      <Button
                        size="sm"
                        onClick={handleSaveSequence}
                        disabled={savingSeq}
                      >
                        {savingSeq ? 'Saving…' : 'Save Sequence'}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <NotificationSequenceBuilder
                    steps={seqSteps}
                    onChange={setSeqSteps}
                  />
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex h-48 flex-col items-center justify-center gap-2">
                <CalendarDays className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  Select an event to view details
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

    </div>
  );
}
