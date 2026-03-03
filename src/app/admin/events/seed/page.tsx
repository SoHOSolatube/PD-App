'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createEvent } from '@/lib/services/eventService';
import { toast } from 'sonner';
import { Loader2, Sprout, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

function daysFromNow(days: number, hour: number, minute: number): Date {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(hour, minute, 0, 0);
    return d;
}

const SEED_EVENTS = [
    {
        title: 'Solatube Premier Dealer Onboarding Webinar',
        description:
            'Join us for a comprehensive onboarding session covering product lines, installation best practices, and territory-exclusive marketing resources. All new and prospective dealers welcome.',
        location: 'Zoom — link sent after registration',
        dateTime: daysFromNow(7, 10, 0),
        endTime: daysFromNow(7, 12, 0),
        status: 'published' as const,
        capacity: 50,
        recurrence: { pattern: 'monthly' as const, endDate: daysFromNow(90, 10, 0) },
        notificationSequence: [
            { id: 'n1', channel: 'email', timing: 'before', timingValue: 3, timingUnit: 'days', audience: 'registered', customContent: 'Your Solatube onboarding webinar is in 3 days! Prepare any questions about the dealer program.', fired: false },
            { id: 'n2', channel: 'sms', timing: 'before', timingValue: 1, timingUnit: 'hours', audience: 'registered', customContent: 'Reminder: Solatube Onboarding Webinar starts in 1 hour. Check your email for the Zoom link!', fired: false },
            { id: 'n3', channel: 'email', timing: 'after', timingValue: 1, timingUnit: 'days', audience: 'registered', customContent: 'Thanks for attending! Here are links to the resources discussed. Reach out with any questions.', fired: false },
        ],
    },
    {
        title: 'Daylighting Innovation Showcase — San Diego',
        description:
            'Experience the latest Solatube daylighting products firsthand at our San Diego headquarters. Live product demonstrations, hands-on installation training, and networking with top-performing dealers.',
        location: '2210 Oak Ridge Way, Vista, CA 92081',
        dateTime: daysFromNow(14, 9, 0),
        endTime: daysFromNow(14, 17, 0),
        status: 'published' as const,
        capacity: 30,
        recurrence: { pattern: 'none' as const },
        notificationSequence: [
            { id: 'n1', channel: 'both', timing: 'before', timingValue: 7, timingUnit: 'days', audience: 'all', customContent: 'The Daylighting Innovation Showcase is next week in San Diego! Register now — space is limited to 30 attendees.', fired: false },
            { id: 'n2', channel: 'email', timing: 'before', timingValue: 1, timingUnit: 'days', audience: 'registered', customContent: "See you tomorrow! Here's what to expect: product demos, installation training, and lunch on us. Dress comfortably.", fired: false },
            { id: 'n3', channel: 'sms', timing: 'before', timingValue: 2, timingUnit: 'hours', audience: 'registered', customContent: 'The Showcase starts at 9 AM today. Parking is available in the front lot. See you soon!', fired: false },
            { id: 'n4', channel: 'email', timing: 'after', timingValue: 2, timingUnit: 'days', audience: 'registered', customContent: 'Thank you for joining the Showcase! Attached are the spec sheets and pricing guides discussed. Your territory rep will follow up this week.', fired: false },
        ],
    },
    {
        title: 'Dealer Quarterly Business Review — Q2 2026',
        description:
            'Review Q1 performance metrics, territory updates, new product launches for Q2, and marketing co-op program changes. Required for all active Premier Dealers.',
        location: 'Microsoft Teams — invite sent to registered attendees',
        dateTime: daysFromNow(21, 14, 0),
        endTime: daysFromNow(21, 15, 30),
        status: 'published' as const,
        capacity: 100,
        recurrence: { pattern: 'none' as const },
        notificationSequence: [
            { id: 'n1', channel: 'email', timing: 'before', timingValue: 5, timingUnit: 'days', audience: 'registered', customContent: 'The Q2 Business Review is coming up. Please have your Q1 sales numbers ready for discussion.', fired: false },
            { id: 'n2', channel: 'sms', timing: 'before', timingValue: 30, timingUnit: 'minutes', audience: 'registered', customContent: 'QBR starts in 30 min. Teams link: check your email. Have your Q1 numbers handy!', fired: false },
        ],
    },
    {
        title: 'Solatube Installation Certification Workshop',
        description:
            'Hands-on 2-day workshop to earn your Solatube Certified Installer credential. Covers residential and commercial daylighting systems, flashing techniques, and troubleshooting.',
        location: 'Solatube Training Center, Vista, CA',
        dateTime: daysFromNow(30, 8, 0),
        endTime: daysFromNow(31, 16, 0),
        status: 'published' as const,
        capacity: 15,
        recurrence: { pattern: 'none' as const },
        notificationSequence: [
            { id: 'n1', channel: 'email', timing: 'before', timingValue: 14, timingUnit: 'days', audience: 'all', customContent: 'Certification Workshop spots filling up! Only 15 seats available. Register now to earn your Solatube Certified Installer credential.', fired: false },
            { id: 'n2', channel: 'both', timing: 'before', timingValue: 3, timingUnit: 'days', audience: 'registered', customContent: "Workshop prep checklist: bring steel-toe boots, safety glasses, and a tape measure. All other tools provided. See you at 8 AM sharp!", fired: false },
        ],
    },
    {
        title: 'Territory Expansion Info Session — Northeast Region',
        description:
            'Exclusive info session for contractors interested in becoming Premier Dealers in CT, MA, NY, NJ, and PA. Learn about available territories, expected margins, and support programs.',
        location: 'Virtual — Google Meet',
        dateTime: daysFromNow(10, 11, 0),
        endTime: daysFromNow(10, 12, 0),
        status: 'draft' as const,
        capacity: 40,
        recurrence: { pattern: 'weekly' as const, endDate: daysFromNow(42, 11, 0) },
        notificationSequence: [],
    },
    {
        title: 'Summer Dealer Appreciation BBQ',
        description:
            "You've earned it! Join us for a laid-back BBQ celebrating our top-performing dealers. Bring your team — food, drinks, and prizes on us.",
        location: 'Solatube HQ Courtyard, Vista, CA',
        dateTime: daysFromNow(60, 16, 0),
        endTime: daysFromNow(60, 20, 0),
        status: 'published' as const,
        capacity: 80,
        recurrence: { pattern: 'none' as const },
        notificationSequence: [
            { id: 'n1', channel: 'both', timing: 'before', timingValue: 14, timingUnit: 'days', audience: 'all', customContent: "You're invited to the Summer Dealer Appreciation BBQ! Food, drinks, and prizes. RSVP so we know how many steaks to grill 🥩", fired: false },
            { id: 'n2', channel: 'sms', timing: 'before', timingValue: 1, timingUnit: 'days', audience: 'registered', customContent: 'See you tomorrow at the BBQ! 4 PM at Solatube HQ Courtyard. Parking in the main lot.', fired: false },
        ],
    },
];

export default function SeedEventsPage() {
    const [seeding, setSeeding] = useState(false);
    const [seeded, setSeeded] = useState<string[]>([]);
    const [done, setDone] = useState(false);

    const handleSeed = async () => {
        setSeeding(true);
        setSeeded([]);
        try {
            for (const event of SEED_EVENTS) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await createEvent(event as any);
                setSeeded((prev) => [...prev, event.title]);
            }
            setDone(true);
            toast.success(`Seeded ${SEED_EVENTS.length} events!`);
        } catch (error) {
            console.error('Seed error:', error);
            toast.error('Failed to seed events');
        } finally {
            setSeeding(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/events">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Seed Events</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Create {SEED_EVENTS.length} sample events with notification sequences
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sprout className="h-5 w-5 text-green-600" />
                        Sample Events
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        {SEED_EVENTS.map((event, i) => (
                            <div
                                key={i}
                                className={`flex items-center justify-between rounded-lg border px-4 py-3 transition-all ${seeded.includes(event.title) ? 'bg-green-50 dark:bg-green-950/20 border-green-200' : ''
                                    }`}
                            >
                                <div>
                                    <p className="font-medium text-sm">{event.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {event.status === 'published' ? '🟢' : '⚪'} {event.status} · Capacity: {event.capacity} · {event.location}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {event.notificationSequence.length} notification steps · Recurrence: {event.recurrence.pattern}
                                    </p>
                                </div>
                                {seeded.includes(event.title) && (
                                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                                )}
                            </div>
                        ))}
                    </div>

                    <Button
                        onClick={handleSeed}
                        disabled={seeding || done}
                        className="w-full gap-2"
                        style={{ backgroundColor: done ? '#16a34a' : 'var(--solatube-blue)' }}
                    >
                        {seeding ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Seeding ({seeded.length}/{SEED_EVENTS.length})…
                            </>
                        ) : done ? (
                            <>
                                <CheckCircle2 className="h-4 w-4" />
                                Done! {SEED_EVENTS.length} events created
                            </>
                        ) : (
                            <>
                                <Sprout className="h-4 w-4" />
                                Seed {SEED_EVENTS.length} Events
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
