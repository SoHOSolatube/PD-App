'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { addNote } from '@/lib/services/contactService';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import type { Note } from '@/types';
import { MessageSquare, Send } from 'lucide-react';

interface ContactNotesProps {
    contactId: string;
    notes: Note[];
    onNoteAdded: () => void;
}

export default function ContactNotes({
    contactId,
    notes,
    onNoteAdded,
}: ContactNotesProps) {
    const { user } = useAuth();
    const [content, setContent] = useState('');
    const [adding, setAdding] = useState(false);

    const handleAddNote = async () => {
        if (!content.trim() || !user) return;
        setAdding(true);
        try {
            await addNote(contactId, {
                id: crypto.randomUUID(),
                content: content.trim(),
                createdBy: user.displayName || user.email || 'Unknown',
            });
            setContent('');
            toast.success('Note added');
            onNoteAdded();
        } catch {
            toast.error('Failed to add note');
        } finally {
            setAdding(false);
        }
    };

    const sortedNotes = [...notes].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <MessageSquare className="h-4 w-4" />
                    Notes ({notes.length})
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Add Note */}
                <div className="flex gap-2">
                    <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Add a note…"
                        className="min-h-[60px] resize-none"
                    />
                    <Button
                        size="icon"
                        onClick={handleAddNote}
                        disabled={!content.trim() || adding}
                        className="h-[60px] w-10 shrink-0"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>

                {sortedNotes.length > 0 && <Separator />}

                {/* Notes List */}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                    {sortedNotes.map((note) => (
                        <div key={note.id} className="rounded-lg bg-muted/50 p-3">
                            <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{note.createdBy}</span>
                                <span>·</span>
                                <span>
                                    {new Date(note.createdAt).toLocaleDateString(undefined, {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit',
                                    })}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
