'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
    getProspectById,
    updateProspect,
    updateTags,
} from '@/lib/services/prospectService';
import { getMessages } from '@/lib/services/conversationService';
import { getProspectTags } from '@/lib/services/settingsService';
import type { Prospect, ProspectConversationMessage } from '@/types';
import type { ProspectTag } from '@/lib/services/settingsService';
import { toast } from 'sonner';
import {
    ArrowLeft,
    Save,
    Loader2,
    User,
    Phone,
    Mail,
    Briefcase,
    Tag,
    MessageSquare,
    Calendar,
    Hash,
    X,
} from 'lucide-react';

export default function ProspectProfilePage() {
    const router = useRouter();
    const params = useParams();
    const prospectId = params.id as string;

    const [prospect, setProspect] = useState<Prospect | null>(null);
    const [messages, setMessages] = useState<ProspectConversationMessage[]>([]);
    const [availableTags, setAvailableTags] = useState<ProspectTag[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editBusiness, setEditBusiness] = useState('');

    const loadData = useCallback(async () => {
        const [p, msgs, tags] = await Promise.all([
            getProspectById(prospectId),
            getMessages(prospectId),
            getProspectTags(),
        ]);
        if (!p) {
            toast.error('Prospect not found');
            router.push('/admin/prospects');
            return;
        }
        setProspect(p);
        setMessages(msgs);
        setAvailableTags(tags);
        setEditName(p.name);
        setEditEmail(p.email);
        setEditPhone(p.phone);
        setEditBusiness(p.businessType || '');
        setLoading(false);
    }, [prospectId, router]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleSave = async () => {
        if (!prospect) return;
        setSaving(true);
        try {
            await updateProspect(prospect.id, {
                name: editName.trim(),
                email: editEmail.trim(),
                phone: editPhone.trim(),
                businessType: editBusiness.trim() || undefined,
            });
            toast.success('Prospect updated');
            loadData();
        } catch {
            toast.error('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const toggleTag = async (tagName: string) => {
        if (!prospect) return;
        const current = prospect.tags || [];
        const updated = current.includes(tagName)
            ? current.filter((t) => t !== tagName)
            : [...current, tagName];
        await updateTags(prospect.id, updated);
        setProspect({ ...prospect, tags: updated });
    };

    const statusColor: Record<string, string> = {
        new: 'bg-blue-100 text-blue-700',
        contacted: 'bg-yellow-100 text-yellow-700',
        'in-progress': 'bg-purple-100 text-purple-700',
        qualified: 'bg-green-100 text-green-700',
        'handed-off': 'bg-orange-100 text-orange-700',
        disqualified: 'bg-red-100 text-red-700',
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!prospect) return null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/admin/prospects')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight">{prospect.name}</h1>
                        <Badge className={statusColor[prospect.qualificationStatus] || ''}>
                            {prospect.qualificationStatus}
                        </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Created {prospect.createdAt.toLocaleDateString()} · Step {prospect.currentPlaybookStep} · Mode: {prospect.conversationMode}
                    </p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left column — profile + tags */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Profile Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" /> Profile Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="p-name">Name</Label>
                                    <Input id="p-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="p-email">Email</Label>
                                    <Input id="p-email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="p-phone">Phone</Label>
                                    <Input id="p-phone" type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="p-biz">Business Type</Label>
                                    <Input id="p-biz" value={editBusiness} onChange={(e) => setEditBusiness(e.target.value)} />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={handleSave} disabled={saving} className="gap-2">
                                    <Save className="h-4 w-4" />
                                    {saving ? 'Saving…' : 'Save'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tags */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Tag className="h-5 w-5" /> Tags
                            </CardTitle>
                            <CardDescription>Click a tag to toggle it on/off.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {availableTags.map((tag) => {
                                    const active = prospect.tags.includes(tag.name);
                                    return (
                                        <button
                                            key={tag.id}
                                            onClick={() => toggleTag(tag.name)}
                                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${active
                                                    ? 'ring-2 ring-offset-1 ring-primary'
                                                    : 'opacity-50 hover:opacity-80'
                                                }`}
                                            style={{
                                                backgroundColor: tag.color + '22',
                                                color: tag.color,
                                                borderColor: tag.color,
                                            }}
                                        >
                                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color }} />
                                            {tag.name}
                                            {active && <X className="h-3 w-3" />}
                                        </button>
                                    );
                                })}
                                {availableTags.length === 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        No tags configured. Add tags in Settings → Prospect Tags.
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Collected Data */}
                    {Object.keys(prospect.collectedData || {}).length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Hash className="h-5 w-5" /> Collected Data
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {Object.entries(prospect.collectedData).map(([key, value]) => (
                                        <div key={key} className="flex items-start justify-between rounded-lg border px-4 py-2">
                                            <span className="text-sm text-muted-foreground">{key}</span>
                                            <span className="text-sm font-medium">{String(value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right column — conversation history */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <MessageSquare className="h-5 w-5" />
                                Conversation ({messages.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {messages.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-6">No messages yet.</p>
                            ) : (
                                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                    {messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`rounded-lg p-3 text-sm ${msg.sender === 'prospect'
                                                    ? 'bg-muted ml-4'
                                                    : msg.sender === 'ai'
                                                        ? 'bg-blue-50 dark:bg-blue-950/30 mr-4'
                                                        : 'bg-green-50 dark:bg-green-950/30 mr-4'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <Badge variant="outline" className="text-[10px]">
                                                    {msg.sender === 'prospect' ? '👤 Prospect' : msg.sender === 'ai' ? '🤖 AI' : '🧑 Human'}
                                                </Badge>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {msg.timestamp.toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="whitespace-pre-wrap">{msg.content}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <Separator className="my-3" />
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => router.push('/admin/conversations')}
                            >
                                Open in Conversations
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Quick Info */}
                    <Card>
                        <CardContent className="py-4 space-y-3">
                            <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                {prospect.phone || 'No phone'}
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                {prospect.email || 'No email'}
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Briefcase className="h-4 w-4 text-muted-foreground" />
                                {prospect.businessType || 'Not specified'}
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                Last active: {prospect.lastActivityAt.toLocaleDateString()}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
