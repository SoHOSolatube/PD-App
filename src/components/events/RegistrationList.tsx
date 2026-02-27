'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { Registration } from '@/types';
import { Trash2, Users } from 'lucide-react';

interface RegistrationListProps {
    registrations: Registration[];
    onRemove: (regId: string) => Promise<void>;
}

export default function RegistrationList({
    registrations,
    onRemove,
}: RegistrationListProps) {
    const [removing, setRemoving] = useState('');

    const handleRemove = async (regId: string) => {
        setRemoving(regId);
        await onRemove(regId);
        setRemoving('');
    };

    if (registrations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">No registrations yet.</p>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-2 flex items-center gap-2">
                <Badge variant="secondary">{registrations.length} registered</Badge>
            </div>
            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Registered</TableHead>
                            <TableHead className="w-[60px]" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {registrations.map((reg) => (
                            <TableRow key={reg.id}>
                                <TableCell className="font-medium">{reg.contactName}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                    {reg.registeredAt.toLocaleDateString(undefined, {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                    })}
                                </TableCell>
                                <TableCell>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-destructive hover:text-destructive"
                                        disabled={removing === reg.id}
                                        onClick={() => handleRemove(reg.id)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
