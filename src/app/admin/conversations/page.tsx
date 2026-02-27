'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  getMessages,
  addMessage,
  generateAIResponse,
  triggerHandoff,
  advancePlaybookStep,
  toggleConversationMode,
} from '@/lib/services/conversationService';
import { getAllProspects } from '@/lib/services/prospectService';
import type { Prospect, ProspectConversationMessage, ConversationMode } from '@/types';
import { toast } from 'sonner';
import {
  Bot,
  User,
  Users,
  Send,
  Loader2,
  Sparkles,
  ArrowRightCircle,
  MessageSquare,
  Lightbulb,
  ChevronRight,
  BookOpen,
  Phone,
  Mail,
  Building2,
  Tag,
} from 'lucide-react';

export default function ConversationsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Prospect | null>(null);
  const [messages, setMessages] = useState<ProspectConversationMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadProspects = useCallback(async () => {
    try {
      const data = await getAllProspects();
      setProspects(data);
    } catch (error) {
      console.error('Error loading prospects:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProspects();
  }, [loadProspects]);

  const selectProspect = async (p: Prospect) => {
    setSelected(p);
    setLoadingMessages(true);
    try {
      const msgs = await getMessages(p.id);
      setMessages(msgs);
    } catch {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send human reply ──
  const handleSendReply = async () => {
    if (!replyText.trim() || !selected) return;
    setSending(true);
    try {
      await addMessage(selected.id, {
        prospectId: selected.id,
        sender: 'human',
        channel: 'sms',
        content: replyText.trim(),
        playbookStep: selected.currentPlaybookStep,
      });
      setReplyText('');
      const msgs = await getMessages(selected.id);
      setMessages(msgs);
      toast.success('Message sent');
    } catch {
      toast.error('Failed to send');
    } finally {
      setSending(false);
    }
  };

  // ── Generate AI response ──
  const handleGenerateAI = async () => {
    if (!selected) return;
    setGeneratingAI(true);
    try {
      const response = await generateAIResponse(
        selected.id,
        selected.currentPlaybookStep,
        messages
      );
      await addMessage(selected.id, {
        prospectId: selected.id,
        sender: 'ai',
        channel: 'sms',
        content: response,
        playbookStep: selected.currentPlaybookStep,
      });
      const msgs = await getMessages(selected.id);
      setMessages(msgs);
    } catch {
      toast.error('AI generation failed');
    } finally {
      setGeneratingAI(false);
    }
  };

  // ── Handoff ──
  const handleHandoff = async () => {
    if (!selected) return;
    await triggerHandoff(selected.id);
    toast.success('Handed off to human agent');
    loadProspects();
    const updated = { ...selected, conversationMode: 'human' as const, qualificationStatus: 'handed-off' as const };
    setSelected(updated);
    const msgs = await getMessages(selected.id);
    setMessages(msgs);
  };

  // ── Mode toggle ──
  const handleModeToggle = async (checked: boolean) => {
    if (!selected) return;
    const mode: ConversationMode = checked ? 'auto' : 'human';
    await toggleConversationMode(selected.id, mode);
    const updated: Prospect = { ...selected, conversationMode: mode };
    setSelected(updated);
    loadProspects();
    toast.success(`Switched to ${mode} mode`);
  };

  // ── Advance step ──
  const handleAdvance = async () => {
    if (!selected) return;
    await advancePlaybookStep(selected.id, selected.currentPlaybookStep);
    const updated = { ...selected, currentPlaybookStep: selected.currentPlaybookStep + 1 };
    setSelected(updated);
    loadProspects();
    toast.success(`Advanced to step ${updated.currentPlaybookStep}`);
  };

  // ── Copilot suggestions ──
  const getCopilotSuggestions = (step: number): string[] => {
    const suggestions: Record<number, string[]> = {
      0: ['Ask about their business type', 'Inquire about service area', 'Ask about years of experience'],
      1: ['Ask about project volume', 'Discuss territory interest', 'Inquire about team size'],
      2: ['Present margin information', 'Explain training program', 'Discuss territory protection'],
      3: ['Schedule a call with regional manager', 'Send onboarding materials', 'Confirm contact details'],
    };
    return suggestions[step] || suggestions[0];
  };

  const senderIcon = (sender: string) => {
    switch (sender) {
      case 'ai': return <Bot className="h-3.5 w-3.5" />;
      case 'human': return <User className="h-3.5 w-3.5" />;
      case 'prospect': return <Users className="h-3.5 w-3.5" />;
      default: return <MessageSquare className="h-3.5 w-3.5" />;
    }
  };

  const senderColor = (sender: string) => {
    switch (sender) {
      case 'ai': return 'bg-purple-500 text-white';
      case 'human': return 'bg-[#0082c4] text-white';
      case 'prospect': return 'bg-muted';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Conversations</h1>
        <p className="mt-1 text-muted-foreground">
          AI and human conversations with prospects.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-4" style={{ height: 'calc(100vh - 220px)' }}>
        {/* Left: Prospect list */}
        <Card className="col-span-3 flex flex-col overflow-hidden">
          <CardHeader className="border-b py-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Prospects ({prospects.length})
            </CardTitle>
          </CardHeader>
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : prospects.length === 0 ? (
              <div className="p-6 text-center">
                <Users className="mx-auto h-8 w-8 text-muted-foreground/30" />
                <p className="mt-2 text-xs text-muted-foreground">No prospects yet</p>
              </div>
            ) : (
              prospects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => selectProspect(p)}
                  className={`w-full border-b px-4 py-3 text-left transition-colors hover:bg-muted/50 ${selected?.id === p.id ? 'bg-muted' : ''
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{p.name}</p>
                    <Badge
                      variant="outline"
                      className={`text-[9px] ${p.conversationMode === 'auto'
                        ? 'border-purple-300 text-purple-600'
                        : 'border-blue-300 text-blue-600'
                        }`}
                    >
                      {p.conversationMode === 'auto' ? '🤖 Auto' : '👤 Human'}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Step {p.currentPlaybookStep} · {p.qualificationStatus}
                  </p>
                </button>
              ))
            )}
          </ScrollArea>
        </Card>

        {/* Center: Message thread */}
        <Card className="col-span-6 flex flex-col overflow-hidden">
          {!selected ? (
            <CardContent className="flex flex-1 flex-col items-center justify-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/20" />
              <p className="mt-3 text-sm text-muted-foreground">
                Select a prospect to view conversation
              </p>
            </CardContent>
          ) : (
            <>
              {/* Thread header */}
              <CardHeader className="border-b py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm">{selected.name}</CardTitle>
                    <p className="text-[10px] text-muted-foreground">
                      Step {selected.currentPlaybookStep} · {selected.qualificationStatus}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Label className="text-[10px] text-muted-foreground">Auto</Label>
                      <Switch
                        checked={selected.conversationMode === 'auto'}
                        onCheckedChange={handleModeToggle}
                      />
                    </div>
                    {selected.conversationMode === 'auto' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1"
                        onClick={handleHandoff}
                      >
                        <ArrowRightCircle className="h-3 w-3" /> Handoff
                      </Button>
                    )}
                  </div>
                </div>
                {selected.conversationMode === 'human' && (
                  <div className="mt-2 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-1.5">
                    <p className="text-[10px] text-amber-700 dark:text-amber-300 font-medium">
                      👤 Human mode active — You are replying directly to this prospect
                    </p>
                  </div>
                )}
              </CardHeader>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {loadingMessages ? (
                  <div className="flex h-32 items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12">
                    <Bot className="mx-auto h-8 w-8 text-muted-foreground/20" />
                    <p className="mt-2 text-xs text-muted-foreground">
                      No messages yet. {selected.conversationMode === 'auto' ? 'Click "Send AI Message" to start.' : 'Type a message to start.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender === 'prospect' ? 'justify-start' : 'justify-end'}`}
                      >
                        <div className="max-w-[80%]">
                          <div className="flex items-center gap-1 mb-0.5">
                            <span className={`flex h-4 w-4 items-center justify-center rounded-full ${senderColor(msg.sender)}`}>
                              {senderIcon(msg.sender)}
                            </span>
                            <span className="text-[9px] text-muted-foreground font-medium uppercase">
                              {msg.sender}
                            </span>
                            {msg.playbookStep !== undefined && (
                              <Badge variant="outline" className="text-[8px] h-3.5 px-1">
                                Step {msg.playbookStep}
                              </Badge>
                            )}
                          </div>
                          <div
                            className={`rounded-2xl px-4 py-2 ${senderColor(msg.sender)}`}
                          >
                            <p className="text-sm">{msg.content}</p>
                          </div>
                          <p className="text-[9px] text-muted-foreground/60 mt-0.5 px-1">
                            {msg.timestamp.toLocaleTimeString(undefined, {
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Input area */}
              <div className="border-t p-3 space-y-2">
                {selected.conversationMode === 'auto' ? (
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 gap-2"
                      onClick={handleGenerateAI}
                      disabled={generatingAI}
                      style={{ backgroundColor: '#7c3aed' }}
                    >
                      {generatingAI ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      Send AI Message
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1"
                      onClick={handleAdvance}
                    >
                      <ChevronRight className="h-3 w-3" /> Advance Step
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type a reply…"
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendReply();
                        }
                      }}
                    />
                    <Button
                      onClick={handleSendReply}
                      disabled={!replyText.trim() || sending}
                      size="icon"
                    >
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </Card>

        {/* Right: Copilot sidebar */}
        <Card className="col-span-3 flex flex-col overflow-hidden">
          <CardHeader className="border-b py-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              AI Copilot
            </CardTitle>
          </CardHeader>
          {!selected ? (
            <CardContent className="flex flex-1 items-center justify-center">
              <p className="text-xs text-muted-foreground">Select a prospect</p>
            </CardContent>
          ) : (
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {/* Prospect info */}
                <div>
                  <h4 className="text-xs font-medium mb-2">Prospect Info</h4>
                  <div className="space-y-1.5 text-xs">
                    {selected.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3 w-3" /> {selected.phone}
                      </div>
                    )}
                    {selected.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3 w-3" /> {selected.email}
                      </div>
                    )}
                    {selected.businessType && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="h-3 w-3" /> {selected.businessType}
                      </div>
                    )}
                    {selected.tags.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        <Tag className="h-3 w-3 text-muted-foreground" />
                        {selected.tags.map((t) => (
                          <Badge key={t} variant="secondary" className="text-[9px]">{t}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Playbook context */}
                <div>
                  <h4 className="text-xs font-medium mb-2 flex items-center gap-1">
                    <BookOpen className="h-3 w-3" /> Playbook
                  </h4>
                  <div className="rounded-md bg-muted/50 p-2">
                    <p className="text-[10px] text-muted-foreground">
                      Current Step: <span className="font-medium text-foreground">{selected.currentPlaybookStep}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Mode: <span className="font-medium text-foreground">{selected.conversationMode}</span>
                    </p>
                  </div>
                </div>

                {/* Suggestions */}
                <div>
                  <h4 className="text-xs font-medium mb-2 flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-amber-500" /> Suggested Actions
                  </h4>
                  <div className="space-y-1.5">
                    {getCopilotSuggestions(selected.currentPlaybookStep).map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => setReplyText(suggestion)}
                        className="w-full rounded-md border border-dashed px-3 py-2 text-left text-[11px] text-muted-foreground hover:bg-muted/50 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Collected data */}
                {Object.keys(selected.collectedData).length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium mb-2">Collected Data</h4>
                    <div className="space-y-1">
                      {Object.entries(selected.collectedData).map(([key, val]) => (
                        <div key={key} className="flex justify-between text-[10px]">
                          <span className="text-muted-foreground">{key}:</span>
                          <span className="font-medium">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </Card>
      </div>
    </div>
  );
}
