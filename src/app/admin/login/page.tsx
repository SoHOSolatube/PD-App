'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginWithEmail } from '@/lib/firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await loginWithEmail(email, password);
            router.push('/admin/dashboard');
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Login failed';
            if (errorMessage.includes('invalid-credential') || errorMessage.includes('wrong-password')) {
                setError('Invalid email or password.');
            } else if (errorMessage.includes('user-not-found')) {
                setError('No account found with this email.');
            } else if (errorMessage.includes('too-many-requests')) {
                setError('Too many attempts. Please try again later.');
            } else {
                setError('Login failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader className="space-y-2 text-center">
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl"
                        style={{ backgroundColor: 'var(--solatube-blue)' }}>
                        <span className="text-xl font-bold text-white">PD</span>
                    </div>
                    <CardTitle className="text-2xl font-bold">Premier Dealer Portal</CardTitle>
                    <CardDescription>Sign in to access the admin dashboard</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@solatube.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                            style={{ backgroundColor: 'var(--solatube-blue)' }}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Signing in…
                                </span>
                            ) : (
                                'Sign In'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
