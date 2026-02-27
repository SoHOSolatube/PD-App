'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { createProspect } from '@/lib/services/prospectService';
import { toast } from 'sonner';
import { CheckCircle2, Building2, DollarSign, TrendingUp, Users, Shield, Loader2 } from 'lucide-react';

const BENEFITS = [
    { icon: DollarSign, title: 'High Margins', desc: 'Industry-leading profit margins on every installation' },
    { icon: TrendingUp, title: 'Growing Market', desc: 'Daylighting demand is increasing year over year' },
    { icon: Users, title: 'Training & Support', desc: 'Comprehensive onboarding and ongoing dealer support' },
    { icon: Shield, title: 'Exclusive Territory', desc: 'Protected territory ensures your market share' },
];

export default function BecomeADealerPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [businessType, setBusinessType] = useState('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !email.trim()) return;
        setSubmitting(true);

        try {
            await createProspect({
                name: name.trim(),
                email: email.trim(),
                phone: phone.trim(),
                businessType: businessType.trim() || undefined,
                currentPlaybookStep: 0,
                qualificationStatus: 'new',
                conversationMode: 'auto',
                tags: ['website-lead'],
                collectedData: message ? { initialMessage: message } : {},
                optOutEmail: false,
                optOutSms: false,
            });
            setDone(true);
        } catch {
            toast.error('Submission failed. Please try again.');
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
                        <h2 className="mt-4 text-2xl font-bold">Thank You!</h2>
                        <p className="mt-2 text-muted-foreground">
                            We&apos;ve received your inquiry. Our team will be in touch within 24 hours.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
            {/* Header */}
            <header className="border-b bg-white/80 dark:bg-slate-950/80 backdrop-blur">
                <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-4">
                    <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold text-white"
                        style={{ backgroundColor: '#0082c4' }}
                    >
                        PD
                    </div>
                    <span className="text-lg font-semibold">Solatube Premier Dealer Program</span>
                </div>
            </header>

            {/* Hero */}
            <section className="mx-auto max-w-5xl px-6 py-16 text-center">
                <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
                    Become a <span style={{ color: '#0082c4' }}>Premier Dealer</span>
                </h1>
                <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                    Join our network of trusted daylighting professionals. Access exclusive products,
                    training, and territory protection to grow your business.
                </p>
            </section>

            {/* Benefits */}
            <section className="mx-auto max-w-5xl px-6 pb-16">
                <div className="grid gap-6 md:grid-cols-4">
                    {BENEFITS.map(({ icon: Icon, title, desc }) => (
                        <Card key={title} className="text-center">
                            <CardContent className="pt-6">
                                <div
                                    className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl text-white"
                                    style={{ backgroundColor: '#0082c4' }}
                                >
                                    <Icon className="h-6 w-6" />
                                </div>
                                <h3 className="mt-3 font-semibold">{title}</h3>
                                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Form */}
            <section className="mx-auto max-w-xl px-6 pb-20">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Building2 className="h-5 w-5" style={{ color: '#0082c4' }} />
                            <h2 className="text-xl font-bold">Apply Now</h2>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="dealer-name">Full Name *</Label>
                                <Input id="dealer-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="dealer-email">Email *</Label>
                                    <Input id="dealer-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="dealer-phone">Phone</Label>
                                    <Input id="dealer-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555-0100" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dealer-biz">Business Type</Label>
                                <Input id="dealer-biz" value={businessType} onChange={(e) => setBusinessType(e.target.value)} placeholder="e.g. HVAC Contractor, Home Improvement" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dealer-msg">Tell us about your business</Label>
                                <Textarea id="dealer-msg" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Years in business, service area, why you're interested…" className="min-h-[80px]" />
                            </div>
                            <Button
                                type="submit"
                                className="w-full"
                                style={{ backgroundColor: '#0082c4' }}
                                disabled={submitting || !name.trim() || !email.trim()}
                            >
                                {submitting ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting…</>
                                ) : (
                                    'Submit Application'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
