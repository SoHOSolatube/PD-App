/**
 * Seed Events Script
 *
 * Creates sample events in Firestore with realistic data.
 * Run: npx tsx scripts/seed-events.ts
 *
 * Connects to emulators by default. Set SEED_LIVE=1 to seed live project.
 */

import { initializeApp } from 'firebase/app';
import {
    getFirestore,
    connectFirestoreEmulator,
    collection,
    addDoc,
    Timestamp,
} from 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-key',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-pd-portal',
};

const EVENTS = [
    {
        title: 'Solatube Premier Dealer Onboarding Webinar',
        description:
            'Join us for a comprehensive onboarding session covering product lines, installation best practices, and territory-exclusive marketing resources. All new and prospective dealers welcome.',
        location: 'Zoom — link sent after registration',
        dateTime: daysFromNow(7, 10, 0),
        endTime: daysFromNow(7, 12, 0),
        status: 'published',
        capacity: 50,
        registrationCount: 12,
        recurrence: { pattern: 'monthly', endDate: daysFromNow(90, 10, 0) },
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
        status: 'published',
        capacity: 30,
        registrationCount: 8,
        recurrence: { pattern: 'none' },
        notificationSequence: [
            { id: 'n1', channel: 'both', timing: 'before', timingValue: 7, timingUnit: 'days', audience: 'all', customContent: 'The Daylighting Innovation Showcase is next week in San Diego! Register now — space is limited to 30 attendees.', fired: false },
            { id: 'n2', channel: 'email', timing: 'before', timingValue: 1, timingUnit: 'days', audience: 'registered', customContent: 'See you tomorrow! Here\'s what to expect: product demos, installation training, and lunch on us. Dress comfortably.', fired: false },
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
        status: 'published',
        capacity: 100,
        registrationCount: 34,
        recurrence: { pattern: 'none' },
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
        status: 'published',
        capacity: 15,
        registrationCount: 6,
        recurrence: { pattern: 'none' },
        notificationSequence: [
            { id: 'n1', channel: 'email', timing: 'before', timingValue: 14, timingUnit: 'days', audience: 'all', customContent: 'Certification Workshop spots filling up! Only 15 seats available. Register now to earn your Solatube Certified Installer credential.', fired: false },
            { id: 'n2', channel: 'both', timing: 'before', timingValue: 3, timingUnit: 'days', audience: 'registered', customContent: 'Workshop prep checklist: bring steel-toe boots, safety glasses, and a tape measure. All other tools provided. See you at 8 AM sharp!', fired: false },
        ],
    },
    {
        title: 'Territory Expansion Info Session — Northeast Region',
        description:
            'Exclusive info session for contractors interested in becoming Premier Dealers in CT, MA, NY, NJ, and PA. Learn about available territories, expected margins, and support programs.',
        location: 'Virtual — Google Meet',
        dateTime: daysFromNow(10, 11, 0),
        endTime: daysFromNow(10, 12, 0),
        status: 'draft',
        capacity: 40,
        registrationCount: 0,
        recurrence: { pattern: 'weekly', endDate: daysFromNow(42, 11, 0) },
        notificationSequence: [],
    },
    {
        title: 'Summer Dealer Appreciation BBQ',
        description:
            'You\'ve earned it! Join us for a laid-back BBQ celebrating our top-performing dealers. Bring your team — food, drinks, and prizes on us.',
        location: 'Solatube HQ Courtyard, Vista, CA',
        dateTime: daysFromNow(60, 16, 0),
        endTime: daysFromNow(60, 20, 0),
        status: 'published',
        capacity: 80,
        registrationCount: 22,
        recurrence: { pattern: 'none' },
        notificationSequence: [
            { id: 'n1', channel: 'both', timing: 'before', timingValue: 14, timingUnit: 'days', audience: 'all', customContent: 'You\'re invited to the Summer Dealer Appreciation BBQ! Food, drinks, and prizes. RSVP so we know how many steaks to grill 🥩', fired: false },
            { id: 'n2', channel: 'sms', timing: 'before', timingValue: 1, timingUnit: 'days', audience: 'registered', customContent: 'See you tomorrow at the BBQ! 4 PM at Solatube HQ Courtyard. Parking in the main lot.', fired: false },
        ],
    },
];

function daysFromNow(days: number, hour: number, minute: number): Date {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(hour, minute, 0, 0);
    return d;
}

async function seedEvents() {
    console.log('🌱 Seeding events...\n');

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    if (!process.env.SEED_LIVE) {
        connectFirestoreEmulator(db, '127.0.0.1', 8080);
        console.log('📡 Connected to Firestore emulator');
    } else {
        console.log('⚡ Seeding LIVE Firestore project');
    }

    const eventsCol = collection(db, 'events');

    for (const event of EVENTS) {
        const docData = {
            ...event,
            dateTime: Timestamp.fromDate(event.dateTime),
            endTime: Timestamp.fromDate(event.endTime),
            recurrence: event.recurrence.pattern !== 'none'
                ? {
                    ...event.recurrence,
                    endDate: 'endDate' in event.recurrence && event.recurrence.endDate
                        ? Timestamp.fromDate(event.recurrence.endDate as Date)
                        : null,
                }
                : { pattern: 'none' },
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            createdBy: 'seed-script',
        };

        const ref = await addDoc(eventsCol, docData);
        const statusIcon = event.status === 'published' ? '🟢' : '⚪';
        console.log(`${statusIcon} ${event.title} (${ref.id}) — ${event.status}, capacity ${event.capacity}`);
    }

    console.log(`\n✅ Seeded ${EVENTS.length} events`);
    process.exit(0);
}

seedEvents();
