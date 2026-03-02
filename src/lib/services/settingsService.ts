import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

const SETTINGS_DOC = 'settings';

// ── Category Types ──

export interface Category {
    id: string;
    name: string;
    color: string;
}

// ── Categories ──

export async function getCategories(): Promise<Category[]> {
    const snap = await getDoc(doc(db, SETTINGS_DOC, 'categories'));
    if (!snap.exists()) return [];
    return (snap.data().items as Category[]) || [];
}

export async function setCategories(categories: Category[]): Promise<void> {
    await setDoc(doc(db, SETTINGS_DOC, 'categories'), { items: categories });
}

// ── Prospect Tags ──

export interface ProspectTag {
    id: string;
    name: string;
    color: string;
}

export async function getProspectTags(): Promise<ProspectTag[]> {
    const snap = await getDoc(doc(db, SETTINGS_DOC, 'prospectTags'));
    if (!snap.exists()) return [];
    return (snap.data().items as ProspectTag[]) || [];
}

export async function setProspectTags(tags: ProspectTag[]): Promise<void> {
    await setDoc(doc(db, SETTINGS_DOC, 'prospectTags'), { items: tags });
}

// ── API Settings ──

export interface ApiSettings {
    twilio: {
        accountSid: string;
        authToken: string;
        fromNumber: string;
    };
    sendgrid: {
        apiKey: string;
        fromEmail: string;
    };
    openai: {
        apiKey: string;
        model: string;
    };
}

const DEFAULT_API_SETTINGS: ApiSettings = {
    twilio: { accountSid: '', authToken: '', fromNumber: '' },
    sendgrid: { apiKey: '', fromEmail: '' },
    openai: { apiKey: '', model: 'gpt-4o' },
};

export async function getApiSettings(): Promise<ApiSettings> {
    const snap = await getDoc(doc(db, SETTINGS_DOC, 'api'));
    if (!snap.exists()) return DEFAULT_API_SETTINGS;
    const data = snap.data();
    return {
        twilio: {
            accountSid: (data.twilio?.accountSid as string) || '',
            authToken: (data.twilio?.authToken as string) || '',
            fromNumber: (data.twilio?.fromNumber as string) || '',
        },
        sendgrid: {
            apiKey: (data.sendgrid?.apiKey as string) || '',
            fromEmail: (data.sendgrid?.fromEmail as string) || '',
        },
        openai: {
            apiKey: (data.openai?.apiKey as string) || '',
            model: (data.openai?.model as string) || 'gpt-4o',
        },
    };
}

export async function setApiSettings(settings: ApiSettings): Promise<void> {
    await setDoc(doc(db, SETTINGS_DOC, 'api'), settings);
}

// ── Event Settings ──

export interface EventSettings {
    timeZone?: string;
}

export async function getEventSettings(): Promise<EventSettings> {
    const snap = await getDoc(doc(db, SETTINGS_DOC, 'event'));
    if (!snap.exists()) return {};
    return snap.data() as EventSettings;
}

export async function setEventSettings(settings: EventSettings): Promise<void> {
    await setDoc(doc(db, SETTINGS_DOC, 'event'), settings, { merge: true });
}
