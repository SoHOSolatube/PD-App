'use client';

import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { getAllUsers, createUserDoc, updateUserRole, deleteUserDoc, getLogs } from '@/lib/services/userService';
import { createUser } from '@/lib/firebase/auth';
import { toast } from 'sonner';
import type { AppUser, LogEntry } from '@/types';
import {
    Users,
    ClipboardList,
    UserPlus,
    Trash2,
    Shield,
    ShieldCheck,
} from 'lucide-react';

export default function UsersLogsPage() {
    const { role } = useAuth();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Users & Logs</h1>
                <p className="mt-1 text-muted-foreground">
                    Manage admin users and view activity logs.
                </p>
            </div>

            <Tabs defaultValue="users" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="users" className="gap-2">
                        <Users className="h-4 w-4" />
                        Users
                    </TabsTrigger>
                    <TabsTrigger value="logs" className="gap-2">
                        <ClipboardList className="h-4 w-4" />
                        Activity Log
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="users">
                    {role === 'admin' ? (
                        <UsersTab />
                    ) : (
                        <Card>
                            <CardContent className="flex h-48 items-center justify-center">
                                <p className="text-muted-foreground">
                                    Only administrators can manage users.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="logs">
                    <LogsTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function UsersTab() {
    const [users, setUsers] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteName, setInviteName] = useState('');
    const [inviteRole, setInviteRole] = useState<'admin' | 'manager'>('manager');
    const [invitePassword, setInvitePassword] = useState('');
    const [inviting, setInviting] = useState(false);

    const loadUsers = async () => {
        try {
            const data = await getAllUsers();
            setUsers(data);
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviting(true);
        try {
            const firebaseUser = await createUser(inviteEmail, invitePassword, inviteName);
            await createUserDoc(firebaseUser.uid, {
                email: inviteEmail,
                displayName: inviteName,
                role: inviteRole,
            });
            toast.success(`Invited ${inviteName} as ${inviteRole}`);
            setInviteOpen(false);
            setInviteEmail('');
            setInviteName('');
            setInvitePassword('');
            loadUsers();
        } catch (error: unknown) {
            const err = error as Error;
            toast.error(err.message || 'Failed to invite user');
        } finally {
            setInviting(false);
        }
    };

    const handleRoleChange = async (uid: string, newRole: 'admin' | 'manager') => {
        try {
            await updateUserRole(uid, newRole);
            toast.success('Role updated');
            loadUsers();
        } catch {
            toast.error('Failed to update role');
        }
    };

    const handleDelete = async (user: AppUser) => {
        if (!confirm(`Delete ${user.displayName}?`)) return;
        try {
            await deleteUserDoc(user.id);
            toast.success('User removed');
            loadUsers();
        } catch {
            toast.error('Failed to delete user');
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="flex h-48 items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    {users.length} user{users.length !== 1 ? 's' : ''}
                </p>
                <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2" style={{ backgroundColor: 'var(--solatube-blue)' }}>
                            <UserPlus className="h-4 w-4" />
                            Invite User
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Invite New User</DialogTitle>
                            <DialogDescription>
                                Create a new admin or manager account.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleInvite} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="inv-name">Display Name</Label>
                                <Input
                                    id="inv-name"
                                    value={inviteName}
                                    onChange={(e) => setInviteName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="inv-email">Email</Label>
                                <Input
                                    id="inv-email"
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="inv-pass">Password</Label>
                                <Input
                                    id="inv-pass"
                                    type="password"
                                    value={invitePassword}
                                    onChange={(e) => setInvitePassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Role</Label>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant={inviteRole === 'manager' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setInviteRole('manager')}
                                    >
                                        Manager
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={inviteRole === 'admin' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setInviteRole('admin')}
                                    >
                                        Admin
                                    </Button>
                                </div>
                            </div>
                            <Button type="submit" className="w-full" disabled={inviting}>
                                {inviting ? 'Creating…' : 'Create User'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* User List */}
            <div className="space-y-2">
                {users.map((u) => (
                    <Card key={u.id}>
                        <CardContent className="flex items-center justify-between py-3">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium">
                                    {u.displayName?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <div>
                                    <p className="font-medium">{u.displayName}</p>
                                    <p className="text-sm text-muted-foreground">{u.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant={u.role === 'admin' ? 'default' : 'secondary'}
                                    className="gap-1"
                                >
                                    {u.role === 'admin' ? (
                                        <ShieldCheck className="h-3 w-3" />
                                    ) : (
                                        <Shield className="h-3 w-3" />
                                    )}
                                    {u.role}
                                </Badge>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                        handleRoleChange(u.id, u.role === 'admin' ? 'manager' : 'admin')
                                    }
                                    className="text-xs"
                                >
                                    Toggle Role
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(u)}
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

function LogsTab() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadLogs = async () => {
            try {
                const data = await getLogs({ limit: 50 });
                setLogs(data);
            } catch (error) {
                console.error('Error loading logs:', error);
            } finally {
                setLoading(false);
            }
        };
        loadLogs();
    }, []);

    if (loading) {
        return (
            <Card>
                <CardContent className="flex h-48 items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Activity Log</CardTitle>
                <CardDescription>
                    Recent actions across the portal.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {logs.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-12 text-center">
                        <p className="text-sm text-muted-foreground">
                            No activity logs yet. Logs will appear as features are used.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {logs.map((log) => (
                            <div
                                key={log.id}
                                className="flex items-center justify-between rounded-lg border p-3"
                            >
                                <div>
                                    <p className="text-sm font-medium">{log.description}</p>
                                    <p className="text-xs text-muted-foreground">
                                        by {log.userName}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <Badge variant="outline" className="text-xs">
                                        {log.action.replace(/_/g, ' ')}
                                    </Badge>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {log.createdAt?.toLocaleDateString?.() || '—'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
