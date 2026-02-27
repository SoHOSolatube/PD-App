'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import {
    getPendingRequests,
    approveRequest,
    denyRequest,
    type PendingRequest,
} from '@/lib/services/pendingRequestService';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';

export default function PendingApprovalQueue() {
    const { user } = useAuth();
    const [requests, setRequests] = useState<PendingRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);

    const loadRequests = async () => {
        try {
            const data = await getPendingRequests();
            setRequests(data);
        } catch (error) {
            console.error('Error loading requests:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRequests();
    }, []);

    const handleApprove = async (id: string) => {
        if (!user) return;
        setProcessing(id);
        try {
            await approveRequest(id, user.uid);
            toast.success('Request approved — contact created');
            loadRequests();
        } catch {
            toast.error('Failed to approve request');
        } finally {
            setProcessing(null);
        }
    };

    const handleDeny = async (id: string) => {
        if (!user) return;
        setProcessing(id);
        try {
            await denyRequest(id, user.uid);
            toast.success('Request denied');
            loadRequests();
        } catch {
            toast.error('Failed to deny request');
        } finally {
            setProcessing(null);
        }
    };

    const pendingCount = requests.filter((r) => r.status === 'pending').length;

    if (loading) {
        return (
            <Card>
                <CardContent className="flex h-32 items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            Pending Approvals
                            {pendingCount > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                    {pendingCount}
                                </Badge>
                            )}
                        </CardTitle>
                        <CardDescription>
                            Dealer signup requests awaiting review.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {requests.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-8 text-center">
                        <Clock className="mx-auto h-8 w-8 text-muted-foreground/50" />
                        <p className="mt-2 text-sm text-muted-foreground">
                            No pending requests.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {requests.map((req) => (
                            <div
                                key={req.id}
                                className="flex items-center justify-between rounded-lg border p-4"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium">{req.name}</p>
                                        <Badge
                                            variant={
                                                req.status === 'pending'
                                                    ? 'outline'
                                                    : req.status === 'approved'
                                                        ? 'default'
                                                        : 'secondary'
                                            }
                                            className="text-xs"
                                        >
                                            {req.status}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {req.email}
                                        {req.dealerAffiliation && ` · ${req.dealerAffiliation}`}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Submitted{' '}
                                        {req.submittedAt.toLocaleDateString(undefined, {
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                    </p>
                                </div>

                                {req.status === 'pending' && (
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleDeny(req.id)}
                                            disabled={processing === req.id}
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <XCircle className="mr-1.5 h-3.5 w-3.5" />
                                            Deny
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => handleApprove(req.id)}
                                            disabled={processing === req.id}
                                            style={{ backgroundColor: 'var(--solatube-blue)' }}
                                        >
                                            {processing === req.id ? (
                                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                                            )}
                                            Approve
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
