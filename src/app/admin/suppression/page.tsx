'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getAllSuppressions,
  addOptOut,
  removeOptOut,
} from '@/lib/services/suppressionService';
import type { SuppressionEntry, SuppressionChannel, SuppressionReason } from '@/lib/services/suppressionService';
import { toast } from 'sonner';
import {
  Plus,
  Trash2,
  Search,
  ShieldOff,
  Loader2,
  Mail,
  MessageSquare,
  Ban,
} from 'lucide-react';

export default function SuppressionListPage() {
  const [entries, setEntries] = useState<SuppressionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterChannel, setFilterChannel] = useState<string>('all');

  // Add dialog
  const [addOpen, setAddOpen] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newChannel, setNewChannel] = useState<SuppressionChannel>('sms');
  const [newReason, setNewReason] = useState<SuppressionReason>('manual');

  const loadEntries = useCallback(async () => {
    try {
      const data = await getAllSuppressions();
      setEntries(data);
    } catch (error) {
      console.error('Error loading suppression list:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleAdd = async () => {
    if (!newPhone.trim() && !newEmail.trim()) {
      toast.error('Please enter a phone number or email');
      return;
    }
    try {
      await addOptOut({
        phone: newPhone.trim() || undefined,
        email: newEmail.trim() || undefined,
        channel: newChannel,
        reason: newReason,
      });
      toast.success('Opt-out added');
      setAddOpen(false);
      setNewPhone('');
      setNewEmail('');
      loadEntries();
    } catch {
      toast.error('Failed to add opt-out');
    }
  };

  const handleRemove = async (entry: SuppressionEntry) => {
    if (!confirm(`Re-subscribe ${entry.phone || entry.email}?`)) return;
    await removeOptOut(entry.id);
    toast.success('Opt-out removed');
    loadEntries();
  };

  const filtered = entries.filter((e) => {
    if (filterChannel !== 'all' && e.channel !== filterChannel) return false;
    if (search) {
      const term = search.toLowerCase();
      return (
        (e.phone?.toLowerCase().includes(term)) ||
        (e.email?.toLowerCase().includes(term))
      );
    }
    return true;
  });

  const ChannelIcon = ({ channel }: { channel: SuppressionChannel }) => {
    if (channel === 'sms') return <MessageSquare className="h-3.5 w-3.5" />;
    if (channel === 'email') return <Mail className="h-3.5 w-3.5" />;
    return <Ban className="h-3.5 w-3.5" />;
  };

  const channelLabel = (c: SuppressionChannel) =>
    c === 'sms' ? 'SMS' : c === 'email' ? 'Email' : 'Both';

  const reasonLabel = (r: SuppressionReason) => {
    const map: Record<SuppressionReason, string> = {
      'user-request': 'User Request',
      'twilio-stop': 'Twilio STOP',
      'sendgrid-unsubscribe': 'SendGrid Unsubscribe',
      manual: 'Manual',
      bounce: 'Bounce',
    };
    return map[r] || r;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Suppression List</h1>
          <p className="mt-1 text-muted-foreground">
            Manage email and SMS opt-outs for compliance.
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Opt-Out
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add to Suppression List</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+1 555-0100"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Channel</Label>
                  <Select value={newChannel} onValueChange={(v) => setNewChannel(v as SuppressionChannel)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Select value={newReason} onValueChange={(v) => setNewReason(v as SuppressionReason)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="user-request">User Request</SelectItem>
                      <SelectItem value="bounce">Bounce</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full" onClick={handleAdd}>
                Add Opt-Out
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search phone or email…"
            className="pl-9"
          />
        </div>
        <Select value={filterChannel} onValueChange={setFilterChannel}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Channel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Channels</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="both">Both</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <Card>
          <CardContent className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex h-48 flex-col items-center justify-center gap-2">
            <ShieldOff className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              {entries.length === 0 ? 'No suppressed contacts' : 'No matches found'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contact</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <div>
                      {entry.phone && <p className="text-sm font-medium">{entry.phone}</p>}
                      {entry.email && <p className="text-xs text-muted-foreground">{entry.email}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1">
                      <ChannelIcon channel={entry.channel} />
                      {channelLabel(entry.channel)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs">{reasonLabel(entry.reason)}</span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {entry.createdAt.toLocaleDateString(undefined, {
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
                      onClick={() => handleRemove(entry)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Stats */}
      {entries.length > 0 && (
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>Total: {entries.length}</span>
          <span>SMS: {entries.filter((e) => e.channel === 'sms' || e.channel === 'both').length}</span>
          <span>Email: {entries.filter((e) => e.channel === 'email' || e.channel === 'both').length}</span>
        </div>
      )}
    </div>
  );
}
