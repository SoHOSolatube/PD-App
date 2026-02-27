'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Settings, Plug, Tags, UserSearch, Sparkles } from 'lucide-react';

export default function SettingsPage() {
    const { role } = useAuth();

    if (role !== 'admin') {
        return (
            <div className="flex h-64 items-center justify-center">
                <p className="text-muted-foreground">
                    Only administrators can access settings.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="mt-1 text-muted-foreground">
                    Configure API connections, categories, tags, and AI skills.
                </p>
            </div>

            <Tabs defaultValue="api" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="api" className="gap-2">
                        <Plug className="h-4 w-4" />
                        API Connections
                    </TabsTrigger>
                    <TabsTrigger value="categories" className="gap-2">
                        <Tags className="h-4 w-4" />
                        Categories
                    </TabsTrigger>
                    <TabsTrigger value="prospect-tags" className="gap-2">
                        <UserSearch className="h-4 w-4" />
                        Prospect Tags
                    </TabsTrigger>
                    <TabsTrigger value="skills" className="gap-2">
                        <Sparkles className="h-4 w-4" />
                        AI Skills
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="api">
                    <ApiConnectionsTab />
                </TabsContent>

                <TabsContent value="categories">
                    <PlaceholderTab
                        title="Contact Categories"
                        description="Create and manage categories for organizing contacts."
                        phase={2}
                    />
                </TabsContent>

                <TabsContent value="prospect-tags">
                    <PlaceholderTab
                        title="Prospect Tags"
                        description="Create and manage tags for prospect categorization."
                        phase={8}
                    />
                </TabsContent>

                <TabsContent value="skills">
                    <PlaceholderTab
                        title="AI Skills"
                        description="Configure AI prompts, brand guidelines, and style settings."
                        phase={3}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function ApiConnectionsTab() {
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        // TODO: Save to Firestore settings collection
        await new Promise((r) => setTimeout(r, 500));
        toast.success('API settings saved');
        setSaving(false);
    };

    return (
        <div className="space-y-6">
            {/* Twilio */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Twilio (SMS)</CardTitle>
                            <CardDescription>
                                Configure Twilio for sending and receiving SMS.
                            </CardDescription>
                        </div>
                        <Badge variant="outline">Not Connected</Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="twilio-sid">Account SID</Label>
                            <Input id="twilio-sid" placeholder="AC..." type="password" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="twilio-token">Auth Token</Label>
                            <Input id="twilio-token" placeholder="••••••••" type="password" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="twilio-from">From Phone Number</Label>
                            <Input id="twilio-from" placeholder="+1..." />
                        </div>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                        Test Connection
                    </Button>
                </CardContent>
            </Card>

            {/* SendGrid */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">SendGrid (Email)</CardTitle>
                            <CardDescription>
                                Configure SendGrid for sending emails.
                            </CardDescription>
                        </div>
                        <Badge variant="outline">Not Connected</Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="sg-key">API Key</Label>
                            <Input id="sg-key" placeholder="SG...." type="password" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="sg-from">From Email</Label>
                            <Input id="sg-from" placeholder="noreply@solatube.com" />
                        </div>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                        Test Connection
                    </Button>
                </CardContent>
            </Card>

            {/* OpenAI */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">OpenAI</CardTitle>
                            <CardDescription>
                                Configure OpenAI for AI-powered features.
                            </CardDescription>
                        </div>
                        <Badge variant="outline">Not Connected</Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="openai-key">API Key</Label>
                            <Input id="openai-key" placeholder="sk-..." type="password" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="openai-model">Model</Label>
                            <Input id="openai-model" placeholder="gpt-4o" defaultValue="gpt-4o" />
                        </div>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                        Test Connection
                    </Button>
                </CardContent>
            </Card>

            <Separator />

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving…' : 'Save All Settings'}
                </Button>
            </div>
        </div>
    );
}

function PlaceholderTab({
    title,
    description,
    phase,
}: {
    title: string;
    description: string;
    phase: number;
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="rounded-lg border border-dashed border-border p-12 text-center">
                    <p className="text-sm text-muted-foreground">Coming in Phase {phase}</p>
                </div>
            </CardContent>
        </Card>
    );
}
