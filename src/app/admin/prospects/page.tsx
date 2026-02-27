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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getAllProspects,
  createProspect,
  deleteProspect,
  updateQualificationStatus,
  updateTags,
} from '@/lib/services/prospectService';
import type { Prospect, QualificationStatus } from '@/types';
import { toast } from 'sonner';
import {
  Plus,
  MoreHorizontal,
  Trash2,
  Search,
  Loader2,
  Users,
  Tag,
  X,
  UserCheck,
  UserX,
  Clock,
  ArrowRight,
  Star,
} from 'lucide-react';

const STATUS_OPTIONS: { value: QualificationStatus; label: string; color: string }[] = [
  { value: 'new', label: 'New', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  { value: 'in-progress', label: 'In Progress', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  { value: 'qualified', label: 'Qualified', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  { value: 'not-a-fit', label: 'Not a Fit', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  { value: 'handed-off', label: 'Handed Off', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  { value: 'converted', label: 'Converted', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' },
];

const STATUS_ICONS: Record<QualificationStatus, React.ReactNode> = {
  'new': <Star className="h-3 w-3" />,
  'in-progress': <Clock className="h-3 w-3" />,
  'qualified': <UserCheck className="h-3 w-3" />,
  'not-a-fit': <UserX className="h-3 w-3" />,
  'handed-off': <ArrowRight className="h-3 w-3" />,
  'converted': <UserCheck className="h-3 w-3" />,
};

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selected, setSelected] = useState<Prospect | null>(null);

  // Add dialog
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newBizType, setNewBizType] = useState('');

  // Tag editor
  const [newTag, setNewTag] = useState('');

  const loadProspects = useCallback(async () => {
    try {
      const data = await getAllProspects({
        status: statusFilter !== 'all' ? statusFilter as QualificationStatus : undefined,
        search: search || undefined,
      });
      setProspects(data);
    } catch (error) {
      console.error('Error loading prospects:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    loadProspects();
  }, [loadProspects]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await createProspect({
        name: newName.trim(),
        email: newEmail.trim(),
        phone: newPhone.trim(),
        businessType: newBizType.trim() || undefined,
        currentPlaybookStep: 0,
        qualificationStatus: 'new',
        conversationMode: 'auto',
        tags: [],
        collectedData: {},
        optOutEmail: false,
        optOutSms: false,
      });
      toast.success('Prospect created');
      setAddOpen(false);
      setNewName(''); setNewEmail(''); setNewPhone(''); setNewBizType('');
      loadProspects();
    } catch {
      toast.error('Failed to create prospect');
    }
  };

  const handleDelete = async (p: Prospect) => {
    if (!confirm(`Delete "${p.name}"?`)) return;
    await deleteProspect(p.id);
    if (selected?.id === p.id) setSelected(null);
    toast.success('Prospect deleted');
    loadProspects();
  };

  const handleStatusChange = async (id: string, status: QualificationStatus) => {
    await updateQualificationStatus(id, status);
    toast.success('Status updated');
    loadProspects();
    if (selected?.id === id) {
      setSelected((prev) => prev ? { ...prev, qualificationStatus: status } : null);
    }
  };

  const handleAddTag = async () => {
    if (!selected || !newTag.trim()) return;
    const tags = [...selected.tags, newTag.trim()];
    await updateTags(selected.id, tags);
    setSelected({ ...selected, tags });
    setNewTag('');
    loadProspects();
  };

  const handleRemoveTag = async (tag: string) => {
    if (!selected) return;
    const tags = selected.tags.filter((t) => t !== tag);
    await updateTags(selected.id, tags);
    setSelected({ ...selected, tags });
    loadProspects();
  };

  const getStatusStyle = (status: QualificationStatus) => {
    return STATUS_OPTIONS.find((s) => s.value === status)?.color || '';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prospects</h1>
          <p className="mt-1 text-muted-foreground">
            Manage recruitment prospects, tags, and qualification status.
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Prospect
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Prospect</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Full name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email@company.com" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+1 555-0100" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Business Type</Label>
                <Input value={newBizType} onChange={(e) => setNewBizType(e.target.value)} placeholder="e.g. HVAC Contractor" />
              </div>
              <Button className="w-full" onClick={handleCreate} disabled={!newName.trim()}>
                Create Prospect
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search prospects…" className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Table */}
        <div className="col-span-2">
          {loading ? (
            <Card>
              <CardContent className="flex h-48 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
              </CardContent>
            </Card>
          ) : prospects.length === 0 ? (
            <Card>
              <CardContent className="flex h-48 flex-col items-center justify-center gap-2">
                <Users className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No prospects found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prospect</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Step</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead className="w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prospects.map((p) => (
                    <TableRow
                      key={p.id}
                      className={`cursor-pointer ${selected?.id === p.id ? 'bg-muted' : ''}`}
                      onClick={() => setSelected(p)}
                    >
                      <TableCell>
                        <p className="font-medium text-sm">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.email || p.phone}</p>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${getStatusStyle(p.qualificationStatus)}`}>
                          {STATUS_ICONS[p.qualificationStatus]}
                          {STATUS_OPTIONS.find((s) => s.value === p.qualificationStatus)?.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          Step {p.currentPlaybookStep}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {p.tags.slice(0, 2).map((t) => (
                            <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                          ))}
                          {p.tags.length > 2 && (
                            <Badge variant="secondary" className="text-[10px]">+{p.tags.length - 2}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-[10px] text-muted-foreground">
                        {p.lastActivityAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {STATUS_OPTIONS.map((s) => (
                              <DropdownMenuItem key={s.value} onClick={() => handleStatusChange(p.id, s.value)}>
                                {s.label}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDelete(p)} className="text-destructive focus:text-destructive">
                              <Trash2 className="mr-2 h-3.5 w-3.5" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <Card className="col-span-1">
          {!selected ? (
            <CardContent className="flex h-48 flex-col items-center justify-center">
              <Users className="h-8 w-8 text-muted-foreground/20" />
              <p className="mt-2 text-xs text-muted-foreground">Select a prospect</p>
            </CardContent>
          ) : (
            <>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{selected.name}</CardTitle>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  {selected.email && <p>{selected.email}</p>}
                  {selected.phone && <p>{selected.phone}</p>}
                  {selected.businessType && <p className="italic">{selected.businessType}</p>}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status */}
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Select
                    value={selected.qualificationStatus}
                    onValueChange={(v) => handleStatusChange(selected.id, v as QualificationStatus)}
                  >
                    <SelectTrigger className="h-8 text-xs mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tags */}
                <div>
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Tag className="h-3 w-3" /> Tags
                  </Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selected.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px] gap-1">
                        {tag}
                        <button onClick={() => handleRemoveTag(tag)}>
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-1 mt-1.5">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add tag…"
                      className="h-7 text-xs flex-1"
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddTag(); }}
                    />
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleAddTag}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Collected Data */}
                {Object.keys(selected.collectedData).length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Collected Data</Label>
                    <div className="mt-1 space-y-1">
                      {Object.entries(selected.collectedData).map(([key, val]) => (
                        <div key={key} className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{key}:</span>
                          <span>{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Meta */}
                <div className="text-[10px] text-muted-foreground space-y-0.5 pt-2 border-t">
                  <p>Playbook Step: {selected.currentPlaybookStep}</p>
                  <p>Mode: {selected.conversationMode}</p>
                  <p>Created: {selected.createdAt.toLocaleDateString()}</p>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
