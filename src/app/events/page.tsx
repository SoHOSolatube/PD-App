'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getPublishedEvents } from '@/lib/services/eventService';
import type { PDEvent } from '@/types';
import { CalendarDays, Clock, ArrowRight, Loader2 } from 'lucide-react';

export default function PublicEventsPage() {
    const [events, setEvents] = useState<PDEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getPublishedEvents()
            .then(setEvents)
            .catch(() => setEvents([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
            {/* Header */}
            <header className="border-b bg-white/80 backdrop-blur dark:bg-slate-950/80">
                <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white"
                            style={{ backgroundColor: '#0082c4' }}
                        >
                            PD
                        </div>
                        <span className="text-lg font-semibold">Solatube Events</span>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="mx-auto max-w-4xl px-6 py-12">
                <h1 className="text-4xl font-bold tracking-tight">Upcoming Events</h1>
                <p className="mt-2 text-lg text-muted-foreground">
                    Join us for dealer training, product launches, and more.
                </p>

                <div className="mt-10 space-y-6">
                    {loading ? (
                        <div className="flex justify-center py-16">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : events.length === 0 ? (
                        <div className="rounded-xl border border-dashed p-16 text-center">
                            <CalendarDays className="mx-auto h-10 w-10 text-muted-foreground/40" />
                            <p className="mt-3 text-muted-foreground">
                                No upcoming events right now. Check back soon!
                            </p>
                        </div>
                    ) : (
                        events.map((event) => (
                            <div
                                key={event.id}
                                className="group relative overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md dark:bg-slate-900"
                            >
                                <div className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-3">
                                            <h2 className="text-xl font-semibold group-hover:text-[#0082c4] transition-colors">
                                                {event.title}
                                            </h2>
                                            {event.description && (
                                                <p className="text-muted-foreground">
                                                    {event.description}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <CalendarDays className="h-4 w-4" />
                                                    {event.dateTime.toLocaleDateString(undefined, {
                                                        weekday: 'long',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                    })}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-4 w-4" />
                                                    {event.dateTime.toLocaleTimeString(undefined, {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                        <Link
                                            href={`/events/${event.id}/register`}
                                            className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-transform group-hover:scale-105"
                                            style={{ backgroundColor: '#0082c4' }}
                                        >
                                            Register
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}
