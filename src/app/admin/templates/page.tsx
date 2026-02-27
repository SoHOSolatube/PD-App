'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import SmsTemplateEditor from '@/components/templates/SmsTemplateEditor';
import {
  getAllTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  duplicateTemplate,
} from '@/lib/services/templateService';
import { useAuth } from '@/context/AuthContext';
import type { Template } from '@/types';
import { toast } from 'sonner';
import {
  Plus,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  FileText,
  Loader2,
} from 'lucide-react';

// Dynamic import for EmailEditor (no SSR)
const EmailEditor = dynamic(
  () => import('@/components/templates/EmailEditor'),
  { ssr: false, loading: () => <div className="flex h-96 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div> }
);

export default function TemplatesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  // SMS dialog state
  const [smsDialogOpen, setSmsDialogOpen] = useState(false);
  const [editingSms, setEditingSms] = useState<Template | null>(null);
  const [smsName, setSmsName] = useState('');
  const [smsContent, setSmsContent] = useState('');
  const [smsSaving, setSmsSaving] = useState(false);

  // Email editor state
  const [showEmailEditor, setShowEmailEditor] = useState(false);
  const [editingEmail, setEditingEmail] = useState<Template | null>(null);
  const [emailName, setEmailName] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [nameDialogOpen, setNameDialogOpen] = useState(false);

  const loadTemplates = useCallback(async () => {
    try {
      const data = await getAllTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const emailTemplates = templates.filter((t) => t.type === 'email');
  const smsTemplates = templates.filter((t) => t.type === 'sms');

  // ── SMS Handlers ──
  const openSmsDialog = (template?: Template) => {
    if (template) {
      setEditingSms(template);
      setSmsName(template.name);
      setSmsContent(template.smsContent || '');
    } else {
      setEditingSms(null);
      setSmsName('');
      setSmsContent('');
    }
    setSmsDialogOpen(true);
  };

  const handleSaveSms = async () => {
    if (!smsName.trim()) return;
    setSmsSaving(true);
    try {
      if (editingSms) {
        await updateTemplate(editingSms.id, {
          name: smsName,
          smsContent,
        });
      } else {
        await createTemplate({
          name: smsName,
          type: 'sms',
          smsContent,
          createdBy: user?.uid || '',
        });
      }
      toast.success(editingSms ? 'SMS template updated' : 'SMS template created');
      setSmsDialogOpen(false);
      loadTemplates();
    } catch {
      toast.error('Failed to save SMS template');
    } finally {
      setSmsSaving(false);
    }
  };

  // ── Email Handlers ──
  const openEmailEditor = (template?: Template) => {
    if (template) {
      setEditingEmail(template);
      setEmailName(template.name);
      setEmailSubject(template.subject || '');
      setShowEmailEditor(true);
    } else {
      setEditingEmail(null);
      setEmailName('');
      setEmailSubject('');
      setNameDialogOpen(true);
    }
  };

  const handleStartEmailEditor = () => {
    if (!emailName.trim()) return;
    setNameDialogOpen(false);
    setShowEmailEditor(true);
  };

  const handleSaveEmail = async (html: string, json: string) => {
    if (editingEmail) {
      await updateTemplate(editingEmail.id, {
        name: emailName,
        subject: emailSubject,
        emailHtml: html,
        emailJson: json,
      });
    } else {
      await createTemplate({
        name: emailName,
        type: 'email',
        subject: emailSubject,
        emailHtml: html,
        emailJson: json,
        createdBy: user?.uid || '',
      });
    }
    setShowEmailEditor(false);
    setEditingEmail(null);
    loadTemplates();
  };

  // ── Common Handlers ──
  const handleDuplicate = async (id: string) => {
    try {
      await duplicateTemplate(id);
      toast.success('Template duplicated');
      loadTemplates();
    } catch {
      toast.error('Failed to duplicate');
    }
  };

  const handleDelete = async (template: Template) => {
    if (!confirm(`Delete "${template.name}"?`)) return;
    try {
      await deleteTemplate(template.id);
      toast.success('Template deleted');
      loadTemplates();
    } catch {
      toast.error('Failed to delete');
    }
  };

  // ── Email Editor View ──
  if (showEmailEditor) {
    return (
      <EmailEditor
        initialJson={editingEmail?.emailJson}
        onSave={handleSaveEmail}
        onBack={() => {
          setShowEmailEditor(false);
          setEditingEmail(null);
        }}
      />
    );
  }

  // ── Template List View ──
  const TemplateTable = ({
    items,
    type,
  }: {
    items: Template[];
    type: 'email' | 'sms';
  }) => {
    if (loading) {
      return (
        <Card>
          <CardContent className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      );
    }

    if (items.length === 0) {
      return (
        <Card>
          <CardContent className="flex h-48 flex-col items-center justify-center gap-2">
            <FileText className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No {type} templates yet.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              {type === 'email' && <TableHead>Subject</TableHead>}
              {type === 'sms' && <TableHead>Content Preview</TableHead>}
              <TableHead>Updated</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((template) => (
              <TableRow key={template.id}>
                <TableCell className="font-medium">{template.name}</TableCell>
                {type === 'email' && (
                  <TableCell className="text-muted-foreground">
                    {template.subject || '—'}
                  </TableCell>
                )}
                {type === 'sms' && (
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {template.smsContent?.slice(0, 60) || '—'}
                    {(template.smsContent?.length || 0) > 60 ? '…' : ''}
                  </TableCell>
                )}
                <TableCell className="text-xs text-muted-foreground">
                  {template.updatedAt.toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          type === 'email'
                            ? openEmailEditor(template)
                            : openSmsDialog(template)
                        }
                      >
                        <Pencil className="mr-2 h-3.5 w-3.5" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDuplicate(template.id)}
                      >
                        <Copy className="mr-2 h-3.5 w-3.5" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(template)}
                        className="text-destructive focus:text-destructive"
                      >
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
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
        <p className="mt-1 text-muted-foreground">
          Build email and SMS templates for messaging.
        </p>
      </div>

      <Tabs defaultValue="email">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="email" className="gap-2">
              <Mail className="h-4 w-4" />
              Email Templates
              {emailTemplates.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {emailTemplates.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sms" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              SMS Templates
              {smsTemplates.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {smsTemplates.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="email" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => openEmailEditor()}
              style={{ backgroundColor: 'var(--solatube-blue)' }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              New Email Template
            </Button>
          </div>
          <TemplateTable items={emailTemplates} type="email" />
        </TabsContent>

        <TabsContent value="sms" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => openSmsDialog()}
              style={{ backgroundColor: 'var(--solatube-blue)' }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              New SMS Template
            </Button>
          </div>
          <TemplateTable items={smsTemplates} type="sms" />
        </TabsContent>
      </Tabs>

      {/* SMS Template Dialog */}
      <Dialog open={smsDialogOpen} onOpenChange={setSmsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingSms ? 'Edit SMS Template' : 'New SMS Template'}
            </DialogTitle>
            <DialogDescription>
              Create an SMS template with merge tags and character tracking.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sms-name">Template Name *</Label>
              <Input
                id="sms-name"
                value={smsName}
                onChange={(e) => setSmsName(e.target.value)}
                placeholder="e.g. Event Reminder"
              />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <SmsTemplateEditor value={smsContent} onChange={setSmsContent} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSmsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveSms}
                disabled={!smsName.trim() || smsSaving}
              >
                {smsSaving ? 'Saving…' : editingSms ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Name + Subject Dialog */}
      <Dialog open={nameDialogOpen} onOpenChange={setNameDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Email Template</DialogTitle>
            <DialogDescription>
              Name your template, then build it in the email editor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-name">Template Name *</Label>
              <Input
                id="email-name"
                value={emailName}
                onChange={(e) => setEmailName(e.target.value)}
                placeholder="e.g. Monthly Newsletter"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-subject">Subject Line</Label>
              <Input
                id="email-subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="e.g. Your Solatube Update"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNameDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleStartEmailEditor}
                disabled={!emailName.trim()}
                style={{ backgroundColor: 'var(--solatube-blue)' }}
              >
                Open Editor
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
