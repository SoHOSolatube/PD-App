'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { addRegistration, getEventById } from '@/lib/services/eventService';
import { createContact, searchByPhone } from '@/lib/services/contactService';
import { toast } from 'sonner';
import { CheckCircle2, CalendarDays, ArrowLeft, Phone, User, Loader2 } from 'lucide-react';
import Link from 'next/link';

type Step = 'phone' | 'recognized' | 'new' | 'done';

export default function RegisterPage() {
    const params = useParams();
    const eventId = params.id as string;

    const [step, setStep] = useState<Step>('phone');
    const [phone, setPhone] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [company, setCompany] = useState('');
    const [foundContactId, setFoundContactId] = useState('');
    const [foundName, setFoundName] = useState('');
    const [loading, setLoading] = useState(false);

    const handlePhoneLookup = async () => {
        if (!phone.trim()) return;
        setLoading(true);
        try {
            const event = await getEventById(eventId);
            if (!event) {
                toast.error('Event not found');
                setLoading(false);
                return;
            }

            const contact = await searchByPhone(phone.trim());
            if (contact) {
                setFoundContactId(contact.id);
                setFoundName(contact.name);
                setStep('recognized');
            } else {
                setStep('new');
            }
        } catch (err) {
            console.error(err);
            toast.error('Lookup failed');
        } finally {
            setLoading(false);
        }
    };

    const handleQuickRegister = async () => {
        setLoading(true);
        try {
            await addRegistration(eventId, foundContactId, foundName);
            setStep('done');
            toast.success('Registered successfully!');
        } catch (err) {
            console.error(err);
            toast.error('Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const handleNewRegister = async () => {
        if (!name.trim() || !email.trim()) return;
        setLoading(true);
        try {
            const contactId = await createContact({
                name: name.trim(),
                email: email.trim(),
                phone: phone.trim(),
                company: company.trim(),
                categories: [],
                status: 'active',
                optOutSms: false,
                optOutEmail: false,
            });
            await addRegistration(eventId, contactId, name.trim());
            setStep('done');
            toast.success('Registration submitted!');
        } catch (err) {
            console.error(err);
            toast.error('Registration failed');
        } finally {
            setLoading(false);
        }
    };

    if (step === 'done') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 p-6">
                <Card className="w-full max-w-md text-center">
                    <CardContent className="py-12">
                        <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
                        <h2 className="mt-4 text-2xl font-bold">You&apos;re Registered!</h2>
                        <p className="mt-2 text-muted-foreground">
                            Thank you for registering. We&apos;ll send you updates as the event approaches.
                        </p>
                        <Link href="/events" className="mt-6 inline-flex items-center gap-2 text-sm text-[#0082c4] hover:underline">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Events
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (step === 'recognized') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 p-6">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <CalendarDays className="h-4 w-4" />
                            Event Registration
                        </div>
                        <CardTitle>Welcome Back!</CardTitle>
                        <CardDescription>
                            We found your account. Register with one click.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="rounded-lg border bg-muted/50 p-4 flex items-center gap-3">
                            <User className="h-8 w-8 text-muted-foreground" />
                            <div>
                                <p className="font-medium">{foundName}</p>
                                <p className="text-sm text-muted-foreground">{phone}</p>
                            </div>
                        </div>
                        <Button
                            onClick={handleQuickRegister}
                            className="w-full"
                            style={{ backgroundColor: '#0082c4' }}
                            disabled={loading}
                        >
                            {loading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Registering…</>
                            ) : (
                                'Register Now'
                            )}
                        </Button>
                        <button
                            onClick={() => setStep('phone')}
                            className="w-full text-sm text-muted-foreground hover:underline"
                        >
                            Not you? Go back
                        </button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 p-6">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <CalendarDays className="h-4 w-4" />
                        Event Registration
                    </div>
                    <CardTitle>{step === 'phone' ? 'Enter Your Phone' : 'Complete Registration'}</CardTitle>
                    <CardDescription>
                        {step === 'phone'
                            ? 'Start by entering your phone number so we can look up your account.'
                            : 'Please fill in your details to register for this event.'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {step === 'phone' ? (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="reg-phone">Phone Number *</Label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="reg-phone"
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="+1 555-0100"
                                            className="pl-10"
                                            onKeyDown={(e) => e.key === 'Enter' && handlePhoneLookup()}
                                        />
                                    </div>
                                </div>
                            </div>
                            <Button
                                onClick={handlePhoneLookup}
                                className="w-full"
                                style={{ backgroundColor: '#0082c4' }}
                                disabled={loading || !phone.trim()}
                            >
                                {loading ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Looking up…</>
                                ) : (
                                    'Continue'
                                )}
                            </Button>
                        </div>
                    ) : (
                        <form
                            onSubmit={(e) => { e.preventDefault(); handleNewRegister(); }}
                            className="space-y-4"
                        >
                            <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                                Phone: <strong>{phone}</strong> — no existing account found. Please complete the form below.
                            </p>
                            <div className="space-y-2">
                                <Label htmlFor="reg-name">Name *</Label>
                                <Input id="reg-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="reg-email">Email *</Label>
                                <Input id="reg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="reg-company">Dealership / Company</Label>
                                <Input id="reg-company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Your dealership name" />
                            </div>
                            <Button
                                type="submit"
                                className="w-full"
                                style={{ backgroundColor: '#0082c4' }}
                                disabled={loading || !name.trim() || !email.trim()}
                            >
                                {loading ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting…</>
                                ) : (
                                    'Register'
                                )}
                            </Button>
                            <button
                                type="button"
                                onClick={() => setStep('phone')}
                                className="w-full text-sm text-muted-foreground hover:underline"
                            >
                                ← Back to phone entry
                            </button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
