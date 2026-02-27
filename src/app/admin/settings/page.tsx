'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';
import {
    getCategories,
    setCategories as saveCategories,
    type Category,
} from '@/lib/services/settingsService';
import { toast } from 'sonner';
import { Plug, Tags, UserSearch, Sparkles, Plus, Trash2, Pencil, Check, X } from 'lucide-react';

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
                    <CategoriesTab />
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

function CategoriesTab() {
    const [categories, setCategoriesState] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState('#0082c4');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editColor, setEditColor] = useState('');

    useEffect(() => {
        getCategories().then((cats) => {
            setCategoriesState(cats);
            setLoading(false);
        });
    }, []);

    const save = async (updated: Category[]) => {
        setCategoriesState(updated);
        await saveCategories(updated);
    };

    const handleAdd = async () => {
        if (!newName.trim()) return;
        const cat: Category = {
            id: crypto.randomUUID(),
            name: newName.trim(),
            color: newColor,
        };
        await save([...categories, cat]);
        setNewName('');
        toast.success('Category added');
    };

    const handleDelete = async (id: string) => {
        await save(categories.filter((c) => c.id !== id));
        toast.success('Category deleted');
    };

    const startEdit = (cat: Category) => {
        setEditingId(cat.id);
        setEditName(cat.name);
        setEditColor(cat.color);
    };

    const handleSaveEdit = async () => {
        if (!editingId || !editName.trim()) return;
        await save(
            categories.map((c) =>
                c.id === editingId
                    ? { ...c, name: editName.trim(), color: editColor }
                    : c
            )
        );
        setEditingId(null);
        toast.success('Category updated');
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="flex h-32 items-center justify-center">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Contact Categories</CardTitle>
                <CardDescription>
                    Create and manage categories for organizing contacts.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Add New */}
                <div className="flex items-end gap-3">
                    <div className="flex-1 space-y-1">
                        <Label htmlFor="cat-name">Category Name</Label>
                        <Input
                            id="cat-name"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="e.g. Gold Tier"
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="cat-color">Color</Label>
                        <input
                            id="cat-color"
                            type="color"
                            value={newColor}
                            onChange={(e) => setNewColor(e.target.value)}
                            className="h-10 w-12 cursor-pointer rounded border"
                        />
                    </div>
                    <Button onClick={handleAdd} disabled={!newName.trim()} className="gap-1">
                        <Plus className="h-4 w-4" />
                        Add
                    </Button>
                </div>

                <Separator />

                {/* Category List */}
                {categories.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                        No categories yet.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {categories.map((cat) => (
                            <div
                                key={cat.id}
                                className="flex items-center justify-between rounded-lg border px-4 py-2"
                            >
                                {editingId === cat.id ? (
                                    <div className="flex flex-1 items-center gap-2">
                                        <input
                                            type="color"
                                            value={editColor}
                                            onChange={(e) => setEditColor(e.target.value)}
                                            className="h-7 w-9 cursor-pointer rounded border"
                                        />
                                        <Input
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="h-8"
                                            onKeyDown={(e) =>
                                                e.key === 'Enter' && handleSaveEdit()
                                            }
                                        />
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7"
                                            onClick={handleSaveEdit}
                                        >
                                            <Check className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7"
                                            onClick={() => setEditingId(null)}
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="h-4 w-4 rounded-full"
                                                style={{ backgroundColor: cat.color }}
                                            />
                                            <span className="text-sm font-medium">
                                                {cat.name}
                                            </span>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-7 w-7"
                                                onClick={() => startEdit(cat)}
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-7 w-7 text-destructive hover:text-destructive"
                                                onClick={() => handleDelete(cat.id)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
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
