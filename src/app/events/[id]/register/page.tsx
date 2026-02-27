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
import { CheckCircle2, CalendarDays, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
    const params = useParams();
    const eventId = params.id as string;
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [company, setCompany] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !email.trim()) return;
        setSubmitting(true);

        try {
            const event = await getEventById(eventId);
            if (!event) {
                toast.error('Event not found');
                return;
            }

            let contactId: string;
            const existing = phone ? await searchByPhone(phone) : null;
            if (existing) {
                contactId = existing.id;
            } else {
                contactId = await createContact({
                    name: name.trim(),
                    email: email.trim(),
                    phone: phone.trim() || '',
                    company: company.trim() || '',
                    categories: [],
                    status: 'active',
                    optOutSms: false,
                    optOutEmail: false,
                });
            }

            // Add registration
            await addRegistration(eventId, contactId, name.trim());
            setDone(true);
            toast.success('Registered successfully!');
        } catch (error) {
            console.error('Registration error:', error);
            toast.error('Registration failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (done) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 p-6">
                <Card className="w-full max-w-md text-center">
                    <CardContent className="py-12">
                        <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
                        <h2 className="mt-4 text-2xl font-bold">You&apos;re Registered!</h2>
                        <p className="mt-2 text-muted-foreground">
                            Thank you for registering. We&apos;ll send you updates as the event approaches.
                        </p>
                        <Link
                            href="/events"
                            className="mt-6 inline-flex items-center gap-2 text-sm text-[#0082c4] hover:underline"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Events
                        </Link>
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
                    <CardTitle>Register Now</CardTitle>
                    <CardDescription>
                        Fill out the form below to register for this event.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="reg-name">Name *</Label>
                            <Input
                                id="reg-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your full name"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="reg-email">Email *</Label>
                            <Input
                                id="reg-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@company.com"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="reg-phone">Phone</Label>
                            <Input
                                id="reg-phone"
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+1 555-0100"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="reg-company">Company</Label>
                            <Input
                                id="reg-company"
                                value={company}
                                onChange={(e) => setCompany(e.target.value)}
                                placeholder="Your dealership name"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full"
                            style={{ backgroundColor: '#0082c4' }}
                            disabled={submitting || !name.trim() || !email.trim()}
                        >
                            {submitting ? 'Registering…' : 'Register'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
