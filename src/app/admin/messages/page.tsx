'use client';

import { useCallback, useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  getAllMessages,
  createMessage,
  updateMessage,
  deleteMessage,
  cancelMessage,
} from '@/lib/services/messageService';
import { broadcastMessage } from '@/lib/services/deliveryService';
import { getAllTemplates } from '@/lib/services/templateService';
import { getAllSurveys } from '@/lib/services/surveyService';
import { getCategories, type Category } from '@/lib/services/settingsService';
import { useAuth } from '@/context/AuthContext';
import type { Message, MessageChannel, AudienceTarget, Survey } from '@/types';
import type { Template } from '@/types';
import { toast } from 'sonner';
import {
  Send,
  Clock,
  CheckCircle2,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Trash2,
  XCircle,
  Loader2,
  Users,
  CalendarClock,
  BarChart3,
  Radio,
  ClipboardList,
} from 'lucide-react';

export default function MessagesPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);

  // Compose state
  const [channel, setChannel] = useState<MessageChannel>('sms');
  const [smsContent, setSmsContent] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailHtml, setEmailHtml] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [audienceType, setAudienceType] = useState<AudienceTarget['type']>('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [scheduleMode, setScheduleMode] = useState<'now' | 'later'>('now');
  const [scheduledAt, setScheduledAt] = useState('');
  const [sending, setSending] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [msgs, cats, tmpls, surveyData] = await Promise.all([
        getAllMessages(),
        getCategories(),
        getAllTemplates(),
        getAllSurveys('active'),
      ]);
      setMessages(msgs);
      setCategories(cats);
      setTemplates(tmpls);
      setSurveys(surveyData);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // When template is selected, fill in content
  useEffect(() => {
    if (!selectedTemplate) return;
    const tmpl = templates.find((t) => t.id === selectedTemplate);
    if (!tmpl) return;
    if (tmpl.type === 'sms' && tmpl.smsContent) setSmsContent(tmpl.smsContent);
    if (tmpl.type === 'email') {
      if (tmpl.subject) setEmailSubject(tmpl.subject);
      if (tmpl.emailHtml) setEmailHtml(tmpl.emailHtml);
    }
  }, [selectedTemplate, templates]);

  const sentMessages = messages.filter((m) => m.status === 'sent');
  const scheduledMessages = messages.filter((m) => m.status === 'scheduled');

  const channelTemplates = templates.filter((t) =>
    channel === 'both' ? true : t.type === channel
  );

  const handleSend = async () => {
    setSending(true);
    try {
      const audience: AudienceTarget = {
        type: audienceType,
        categoryIds: audienceType === 'categories' ? selectedCategories : undefined,
      };

      const msgData: Omit<Message, 'id' | 'createdAt' | 'analytics'> = {
        channel,
        status: scheduleMode === 'later' ? 'scheduled' : 'draft',
        smsContent: channel !== 'email' ? smsContent : undefined,
        emailHtml: channel !== 'sms' ? emailHtml : undefined,
        subject: channel !== 'sms' ? emailSubject : undefined,
        templateId: selectedTemplate || undefined,
        audience,
        scheduledAt: scheduleMode === 'later' && scheduledAt
          ? new Date(scheduledAt)
          : undefined,
        createdBy: user?.uid || '',
      };

      const messageId = await createMessage(msgData);

      if (scheduleMode === 'now') {
        await broadcastMessage(messageId);
        toast.success('Message sent!');
      } else {
        toast.success('Message scheduled!');
      }

      // Reset form
      setSmsContent('');
      setEmailSubject('');
      setEmailHtml('');
      setSelectedTemplate('');
      setAudienceType('all');
      setSelectedCategories([]);
      setScheduleMode('now');
      setScheduledAt('');
      loadData();
    } catch (error) {
      console.error('Send error:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelMessage(id);
      toast.success('Message cancelled');
      loadData();
    } catch {
      toast.error('Failed to cancel');
    }
  };

  const handleDelete = async (msg: Message) => {
    if (!confirm('Delete this message?')) return;
    try {
      await deleteMessage(msg.id);
      toast.success('Message deleted');
      loadData();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const toggleCategory = (catId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    );
  };

  const ChannelBadge = ({ ch }: { ch: MessageChannel }) => {
    const icons = { sms: MessageSquare, email: Mail, both: Radio };
    const Icon = icons[ch];
    return (
      <Badge variant="outline" className="gap-1 text-xs">
        <Icon className="h-3 w-3" />
        {ch.toUpperCase()}
      </Badge>
    );
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
      sent: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${colors[status] || ''}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
        <p className="mt-1 text-muted-foreground">
          Compose, schedule, and track broadcast messages.
        </p>
      </div>

      <Tabs defaultValue="compose">
        <TabsList>
          <TabsTrigger value="compose" className="gap-2">
            <Send className="h-4 w-4" />
            Compose
          </TabsTrigger>
          <TabsTrigger value="sent" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Sent
            {sentMessages.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {sentMessages.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="gap-2">
            <CalendarClock className="h-4 w-4" />
            Scheduled
            {scheduledMessages.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {scheduledMessages.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── COMPOSE TAB ── */}
        <TabsContent value="compose" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left: Content */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Message Content</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Channel */}
                  <div className="space-y-2">
                    <Label>Channel</Label>
                    <div className="flex gap-2">
                      {(['sms', 'email', 'both'] as MessageChannel[]).map((ch) => (
                        <Button
                          key={ch}
                          variant={channel === ch ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setChannel(ch)}
                          className="gap-1.5"
                        >
                          {ch === 'sms' && <MessageSquare className="h-3.5 w-3.5" />}
                          {ch === 'email' && <Mail className="h-3.5 w-3.5" />}
                          {ch === 'both' && <Radio className="h-3.5 w-3.5" />}
                          {ch === 'both' ? 'SMS + Email' : ch.toUpperCase()}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Template selector */}
                  {channelTemplates.length > 0 && (
                    <div className="space-y-2">
                      <Label>Use Template (optional)</Label>
                      <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                        <SelectTrigger>
                          <SelectValue placeholder="Start from scratch…" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Start from scratch</SelectItem>
                          {channelTemplates.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* SMS Content */}
                  {(channel === 'sms' || channel === 'both') && (
                    <div className="space-y-2">
                      <Label>SMS Message</Label>
                      <SmsTemplateEditor value={smsContent} onChange={setSmsContent} />
                    </div>
                  )}

                  {/* Email Content */}
                  {(channel === 'email' || channel === 'both') && (
                    <>
                      <div className="space-y-2">
                        <Label>Email Subject</Label>
                        <Input
                          value={emailSubject}
                          onChange={(e) => setEmailSubject(e.target.value)}
                          placeholder="Subject line…"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email Body (HTML)</Label>
                        <Textarea
                          value={emailHtml}
                          onChange={(e) => setEmailHtml(e.target.value)}
                          placeholder="Paste email HTML or select a template above…"
                          className="min-h-[200px] font-mono text-xs"
                        />
                      </div>
                    </>
                  )}

                  {/* Survey link insertion */}
                  {surveys.length > 0 && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <ClipboardList className="h-3.5 w-3.5" />
                        Attach Survey Link
                      </Label>
                      <Select
                        onValueChange={(surveyId) => {
                          const survey = surveys.find((s) => s.id === surveyId);
                          if (!survey) return;
                          const surveyUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/surveys/${survey.id}`;
                          if (channel !== 'email') {
                            setSmsContent((prev) =>
                              prev ? `${prev}\n\nTake our survey: ${surveyUrl}` : `Take our survey: ${surveyUrl}`
                            );
                          }
                          if (channel !== 'sms') {
                            setEmailHtml((prev) =>
                              prev
                                ? `${prev}\n<p><a href="${surveyUrl}">Take our survey: ${survey.title}</a></p>`
                                : `<p><a href="${surveyUrl}">Take our survey: ${survey.title}</a></p>`
                            );
                          }
                          toast.success(`Survey link for "${survey.title}" inserted`);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a survey to insert…" />
                        </SelectTrigger>
                        <SelectContent>
                          {surveys.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}                </CardContent>
              </Card>
            </div>

            {/* Right: Audience + Schedule + Send */}
            <div className="space-y-4">
              {/* Audience */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-4 w-4" />
                    Audience
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Select
                    value={audienceType}
                    onValueChange={(v) => setAudienceType(v as AudienceTarget['type'])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Contacts</SelectItem>
                      <SelectItem value="categories">By Category</SelectItem>
                    </SelectContent>
                  </Select>

                  {audienceType === 'categories' && categories.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat) => (
                        <Badge
                          key={cat.id}
                          variant={selectedCategories.includes(cat.id) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => toggleCategory(cat.id)}
                          style={
                            selectedCategories.includes(cat.id)
                              ? { backgroundColor: cat.color, borderColor: cat.color }
                              : { borderColor: cat.color, color: cat.color }
                          }
                        >
                          {cat.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="h-4 w-4" />
                    When
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Button
                      variant={scheduleMode === 'now' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setScheduleMode('now')}
                    >
                      Send Now
                    </Button>
                    <Button
                      variant={scheduleMode === 'later' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setScheduleMode('later')}
                    >
                      Schedule
                    </Button>
                  </div>
                  {scheduleMode === 'later' && (
                    <Input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Send Button */}
              <Button
                className="w-full gap-2"
                style={{ backgroundColor: 'var(--solatube-blue)' }}
                onClick={handleSend}
                disabled={
                  sending ||
                  (channel !== 'email' && !smsContent.trim()) ||
                  (channel !== 'sms' && !emailHtml.trim()) ||
                  (scheduleMode === 'later' && !scheduledAt)
                }
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : scheduleMode === 'later' ? (
                  <CalendarClock className="h-4 w-4" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {sending
                  ? 'Sending…'
                  : scheduleMode === 'later'
                    ? 'Schedule Message'
                    : 'Send Now'}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ── SENT TAB ── */}
        <TabsContent value="sent" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="flex h-48 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
              </CardContent>
            </Card>
          ) : sentMessages.length === 0 ? (
            <Card>
              <CardContent className="flex h-48 flex-col items-center justify-center gap-2">
                <CheckCircle2 className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No messages sent yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Channel</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead>Audience</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        <BarChart3 className="h-3 w-3" />
                        Delivery
                      </div>
                    </TableHead>
                    <TableHead className="w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sentMessages.map((msg) => (
                    <TableRow key={msg.id}>
                      <TableCell><ChannelBadge ch={msg.channel} /></TableCell>
                      <TableCell className="max-w-xs truncate text-sm">
                        {msg.smsContent?.slice(0, 50) || msg.subject || '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {msg.audience.type === 'all' ? 'All' : `${msg.audience.categoryIds?.length || 0} categories`}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {msg.sentAt?.toLocaleDateString(undefined, {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          {msg.analytics?.smsTotal ? (
                            <span className="text-green-600">
                              SMS: {msg.analytics.smsDelivered}/{msg.analytics.smsTotal}
                            </span>
                          ) : null}
                          {msg.analytics?.smsTotal && msg.analytics?.emailTotal ? ' · ' : ''}
                          {msg.analytics?.emailTotal ? (
                            <span className="text-blue-600">
                              Email: {msg.analytics.emailDelivered}/{msg.analytics.emailTotal}
                            </span>
                          ) : null}
                        </div>
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
                              onClick={() => handleDelete(msg)}
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
          )}
        </TabsContent>

        {/* ── SCHEDULED TAB ── */}
        <TabsContent value="scheduled" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="flex h-48 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
              </CardContent>
            </Card>
          ) : scheduledMessages.length === 0 ? (
            <Card>
              <CardContent className="flex h-48 flex-col items-center justify-center gap-2">
                <CalendarClock className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No scheduled messages.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Channel</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead>Audience</TableHead>
                    <TableHead>Scheduled For</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scheduledMessages.map((msg) => (
                    <TableRow key={msg.id}>
                      <TableCell><ChannelBadge ch={msg.channel} /></TableCell>
                      <TableCell className="max-w-xs truncate text-sm">
                        {msg.smsContent?.slice(0, 50) || msg.subject || '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {msg.audience.type === 'all' ? 'All' : `${msg.audience.categoryIds?.length || 0} categories`}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {msg.scheduledAt?.toLocaleDateString(undefined, {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell><StatusBadge status={msg.status} /></TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleCancel(msg.id)}>
                              <XCircle className="mr-2 h-3.5 w-3.5" />
                              Cancel
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(msg)}
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
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
