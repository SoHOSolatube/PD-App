'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Search,
  ArrowUpDown,
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

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [dateSort, setDateSort] = useState<'upcoming' | 'past' | 'all'>('all');

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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | 'published' | 'draft')}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dateSort} onValueChange={(v) => setDateSort(v as 'upcoming' | 'past' | 'all')}>
          <SelectTrigger className="w-[140px]">
            <ArrowUpDown className="mr-2 h-3.5 w-3.5" />
            <SelectValue placeholder="Date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Dates</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="past">Past</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(() => {
        const now = new Date();
        const filtered = events
          .filter((e) => {
            if (searchQuery && !e.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            if (statusFilter !== 'all' && e.status !== statusFilter) return false;
            if (dateSort === 'upcoming' && e.dateTime < now) return false;
            if (dateSort === 'past' && e.dateTime >= now) return false;
            return true;
          })
          .sort((a, b) => dateSort === 'past'
            ? b.dateTime.getTime() - a.dateTime.getTime()
            : a.dateTime.getTime() - b.dateTime.getTime()
          );

        return (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Event List */}
            <div className="lg:col-span-2">
              {loading ? (
                <Card>
                  <CardContent className="flex h-48 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </CardContent>
                </Card>
              ) : filtered.length === 0 ? (
                <Card>
                  <CardContent className="flex h-48 flex-col items-center justify-center gap-2">
                    <CalendarDays className="h-8 w-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      {events.length === 0 ? 'No events yet.' : 'No events match your filters.'}
                    </p>
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
                      {filtered.map((event) => (
                        <TableRow
                          key={event.id}
                          className={`cursor-pointer ${selectedEvent?.id === event.id ? 'bg-muted/50' : ''}`}
                          onClick={() => selectEvent(event)}
                          onDoubleClick={() => router.push(`/admin/events/${event.id}/edit`)}
                        >
                          <TableCell>
                            <div>
                              <p className="font-medium">{event.title}</p>
                              <div className="flex gap-1 mt-1">
                                <RecurrenceBadge pattern={typeof event.recurrence === 'object' && event.recurrence !== null ? (event.recurrence as unknown as { pattern: string }).pattern : event.recurrence || 'none'} />
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
                      <div className="flex items-center gap-3 pt-2">
                        <div className="flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm font-semibold">{registrations.length}</span>
                          <span className="text-xs text-muted-foreground">registered</span>
                        </div>
                        <StatusBadge status={selectedEvent.status} />
                      </div>
                    </CardHeader>
                  </Card>

                  {/* Notification Sequence — timeline with event card */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Bell className="h-4 w-4" />
                        Sequence ({seqSteps.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {seqSteps.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No notification steps configured.</p>
                      ) : (() => {
                        const beforeSteps = seqSteps.filter(s => s.timing === 'before');
                        const afterSteps = seqSteps.filter(s => s.timing === 'after');

                        const StepRow = ({ step, num }: { step: typeof seqSteps[0]; num: number }) => {
                          const icon = step.channel === 'sms' ? '💬' : step.channel === 'email' ? '✉️' : '📡';
                          return (
                            <div className="flex items-center gap-2 rounded-md border px-3 py-1.5">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
                                {num}
                              </span>
                              <span className="text-sm">{icon}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">
                                  {step.channel.toUpperCase()} · {step.timingValue} {step.timingUnit} {step.timing}
                                </p>
                                <p className="text-[10px] text-muted-foreground truncate">
                                  {step.audience === 'all' ? 'All contacts' : 'Registered'}
                                  {step.customContent ? ` — "${step.customContent.slice(0, 35)}…"` : ''}
                                </p>
                              </div>
                            </div>
                          );
                        };

                        let counter = 0;
                        return (
                          <div className="space-y-1.5">
                            {beforeSteps.map((step) => {
                              counter++;
                              return <StepRow key={step.id || counter} step={step} num={counter} />;
                            })}

                            {/* The Event itself */}
                            <div className="flex items-center gap-2 rounded-md border-2 border-blue-400 bg-blue-50 dark:bg-blue-950/30 px-3 py-2 my-1">
                              <CalendarDays className="h-4 w-4 text-blue-600 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 truncate">
                                  📅 {selectedEvent.title}
                                </p>
                                <p className="text-[10px] text-blue-600/70 dark:text-blue-400/70">
                                  {selectedEvent.dateTime.toLocaleDateString(undefined, {
                                    weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                                  })}
                                </p>
                              </div>
                            </div>

                            {afterSteps.map((step) => {
                              counter++;
                              return <StepRow key={step.id || counter} step={step} num={counter} />;
                            })}
                          </div>
                        );
                      })()}
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
        );
      })()}

    </div>
  );
}
