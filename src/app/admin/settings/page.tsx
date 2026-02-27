'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/AuthContext';
import {
    getCategories,
    setCategories as saveCategories,
    type Category,
} from '@/lib/services/settingsService';
import {
    getAllSkills,
    createSkill,
    updateSkill,
    deleteSkill,
    type Skill,
} from '@/lib/services/skillService';
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
                    <SkillsTab />
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

function SkillsTab() {
    const [skills, setSkills] = useState<Skill[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
    const [form, setForm] = useState({
        name: '',
        description: '',
        prompt: '',
        toneOfVoice: '',
    });

    useEffect(() => {
        getAllSkills().then((data) => {
            setSkills(data);
            setLoading(false);
        });
    }, []);

    const reload = async () => {
        setSkills(await getAllSkills());
    };

    const openDialog = (skill?: Skill) => {
        if (skill) {
            setEditingSkill(skill);
            setForm({
                name: skill.name,
                description: skill.description,
                prompt: skill.prompt,
                toneOfVoice: skill.toneOfVoice || '',
            });
        } else {
            setEditingSkill(null);
            setForm({ name: '', description: '', prompt: '', toneOfVoice: '' });
        }
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!form.name.trim() || !form.prompt.trim()) return;
        if (editingSkill) {
            await updateSkill(editingSkill.id, form);
        } else {
            await createSkill(form);
        }
        setDialogOpen(false);
        reload();
        toast.success(editingSkill ? 'Skill updated' : 'Skill created');
    };

    const handleDelete = async (id: string) => {
        await deleteSkill(id);
        reload();
        toast.success('Skill deleted');
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
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>AI Skills</CardTitle>
                            <CardDescription>
                                Configure AI prompts, tone of voice, and brand guidelines for email generation.
                            </CardDescription>
                        </div>
                        <Button onClick={() => openDialog()} className="gap-1" size="sm">
                            <Plus className="h-4 w-4" />
                            Add Skill
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-2">
                    {skills.length === 0 ? (
                        <p className="py-4 text-center text-sm text-muted-foreground">
                            No skills configured yet.
                        </p>
                    ) : (
                        skills.map((skill) => (
                            <div
                                key={skill.id}
                                className="flex items-center justify-between rounded-lg border px-4 py-3"
                            >
                                <div>
                                    <p className="text-sm font-medium">{skill.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {skill.description || skill.prompt.slice(0, 80)}…
                                    </p>
                                </div>
                                <div className="flex gap-1">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7"
                                        onClick={() => openDialog(skill)}
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7 text-destructive hover:text-destructive"
                                        onClick={() => handleDelete(skill.id)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>

            {/* Skill Dialog */}
            {dialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-lg rounded-lg bg-background p-6 shadow-xl">
                        <h3 className="mb-4 text-lg font-semibold">
                            {editingSkill ? 'Edit Skill' : 'New Skill'}
                        </h3>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <Label>Name *</Label>
                                <Input
                                    value={form.name}
                                    onChange={(e) =>
                                        setForm({ ...form, name: e.target.value })
                                    }
                                    placeholder="e.g. Newsletter Writer"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>Description</Label>
                                <Input
                                    value={form.description}
                                    onChange={(e) =>
                                        setForm({ ...form, description: e.target.value })
                                    }
                                    placeholder="Brief description of this skill"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>System Prompt *</Label>
                                <Textarea
                                    value={form.prompt}
                                    onChange={(e) =>
                                        setForm({ ...form, prompt: e.target.value })
                                    }
                                    placeholder="You are a professional email copywriter for Solatube International…"
                                    className="min-h-[120px]"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>Tone of Voice</Label>
                                <Input
                                    value={form.toneOfVoice}
                                    onChange={(e) =>
                                        setForm({ ...form, toneOfVoice: e.target.value })
                                    }
                                    placeholder="e.g. Professional, friendly, concise"
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={!form.name.trim() || !form.prompt.trim()}
                                >
                                    {editingSkill ? 'Update' : 'Create'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
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
