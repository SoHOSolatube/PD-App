'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { Contact } from '@/types';
import type { Category } from '@/lib/services/settingsService';
import { X } from 'lucide-react';

interface ContactDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    contact?: Contact | null; // null = create mode, Contact = edit mode
    categories: Category[];
    onSave: (data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt' | 'notes'>) => Promise<void>;
}

export default function ContactDialog({
    open,
    onOpenChange,
    contact,
    categories,
    onSave,
}: ContactDialogProps) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [company, setCompany] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);

    const isEdit = !!contact;

    useEffect(() => {
        if (contact) {
            setName(contact.name);
            setEmail(contact.email);
            setPhone(contact.phone);
            setCompany(contact.company || '');
            setSelectedCategories(contact.categories || []);
        } else {
            setName('');
            setEmail('');
            setPhone('');
            setCompany('');
            setSelectedCategories([]);
        }
    }, [contact, open]);

    const toggleCategory = (catId: string) => {
        setSelectedCategories((prev) =>
            prev.includes(catId)
                ? prev.filter((c) => c !== catId)
                : [...prev, catId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await onSave({
                name,
                email,
                phone,
                company,
                status: contact?.status || 'active',
                categories: selectedCategories,
                optOutEmail: contact?.optOutEmail || false,
                optOutSms: contact?.optOutSms || false,
            });
            toast.success(isEdit ? 'Contact updated' : 'Contact created');
            onOpenChange(false);
        } catch (error: unknown) {
            const err = error as Error;
            toast.error(err.message || 'Failed to save contact');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit Contact' : 'New Contact'}</DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? 'Update contact information.'
                            : 'Add a new premier dealer contact.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="cd-name">Name *</Label>
                        <Input
                            id="cd-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="John Doe"
                        />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="cd-email">Email *</Label>
                            <Input
                                id="cd-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="john@example.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cd-phone">Phone</Label>
                            <Input
                                id="cd-phone"
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+1 555-0100"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="cd-company">Company / Dealer</Label>
                        <Input
                            id="cd-company"
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            placeholder="ABC Solar"
                        />
                    </div>

                    {/* Categories */}
                    {categories.length > 0 && (
                        <div className="space-y-2">
                            <Label>Categories</Label>
                            <div className="flex flex-wrap gap-2">
                                {categories.map((cat) => {
                                    const selected = selectedCategories.includes(cat.id);
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => toggleCategory(cat.id)}
                                            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${selected
                                                    ? 'border-transparent text-white'
                                                    : 'border-border text-muted-foreground hover:border-foreground'
                                                }`}
                                            style={
                                                selected
                                                    ? { backgroundColor: cat.color || 'var(--solatube-blue)' }
                                                    : undefined
                                            }
                                        >
                                            {cat.name}
                                            {selected && <X className="h-3 w-3" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving ? 'Saving…' : isEdit ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
