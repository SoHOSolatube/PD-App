'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  getConversations,
  getMessages,
  sendReply,
  markRead,
  createConversation,
} from '@/lib/services/smsInboxService';
import type { SmsConversation, SmsMessage } from '@/lib/services/smsInboxService';
import { toast } from 'sonner';
import {
  MessageSquare,
  Send,
  Loader2,
  Phone,
  Plus,
  Inbox,
  User,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function SMSInboxPage() {
  const [conversations, setConversations] = useState<SmsConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SmsConversation | null>(null);
  const [messages, setMessages] = useState<SmsMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // New conversation dialog
  const [newOpen, setNewOpen] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [newMessage, setNewMessage] = useState('');

  const loadConversations = useCallback(async () => {
    try {
      const data = await getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const selectConversation = async (conv: SmsConversation) => {
    setSelected(conv);
    setLoadingMessages(true);
    try {
      const msgs = await getMessages(conv.id);
      setMessages(msgs);
      if (conv.unreadCount > 0) {
        await markRead(conv.id);
        loadConversations();
      }
    } catch {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleReply = async () => {
    if (!replyText.trim() || !selected) return;
    setSending(true);
    try {
      await sendReply(selected.id, selected.phone, replyText.trim());
      setReplyText('');
      const msgs = await getMessages(selected.id);
      setMessages(msgs);
      loadConversations();
      toast.success('Reply sent');
    } catch {
      toast.error('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleNewConversation = async () => {
    if (!newPhone.trim() || !newMessage.trim()) return;
    try {
      const convId = await createConversation(newPhone.trim(), newMessage.trim(), 'outbound');
      toast.success('Message sent');
      setNewOpen(false);
      setNewPhone('');
      setNewMessage('');
      await loadConversations();
      // Select the new conversation
      const convos = await getConversations();
      const newConv = convos.find((c) => c.id === convId);
      if (newConv) selectConversation(newConv);
    } catch {
      toast.error('Failed to send');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SMS Inbox</h1>
          <p className="mt-1 text-muted-foreground">
            Real-time inbound SMS messages and conversation threads.
          </p>
        </div>
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Message
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New SMS Message</DialogTitle>
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
                <Label>Message</Label>
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message…"
                />
              </div>
              <Button
                className="w-full"
                onClick={handleNewConversation}
                disabled={!newPhone.trim() || !newMessage.trim()}
              >
                Send
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-4" style={{ height: 'calc(100vh - 220px)' }}>
        {/* Conversations list */}
        <Card className="col-span-1 flex flex-col overflow-hidden">
          <CardHeader className="border-b py-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Inbox className="h-4 w-4" />
              Conversations ({conversations.length})
            </CardTitle>
          </CardHeader>
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center">
                <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground/30" />
                <p className="mt-2 text-xs text-muted-foreground">No conversations yet</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={`w-full border-b px-4 py-3 text-left transition-colors hover:bg-muted/50 ${selected?.id === conv.id ? 'bg-muted' : ''
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {conv.contactName || conv.phone}
                        </p>
                        {conv.contactName && (
                          <p className="text-[10px] text-muted-foreground">{conv.phone}</p>
                        )}
                      </div>
                    </div>
                    {conv.unreadCount > 0 && (
                      <Badge className="h-5 min-w-[20px] rounded-full text-[10px]">
                        {conv.unreadCount}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground pl-10">
                    {conv.direction === 'outbound' ? 'You: ' : ''}
                    {conv.lastMessage}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground/60 pl-10">
                    {conv.lastMessageAt.toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </button>
              ))
            )}
          </ScrollArea>
        </Card>

        {/* Message thread */}
        <Card className="col-span-2 flex flex-col overflow-hidden">
          {!selected ? (
            <CardContent className="flex flex-1 flex-col items-center justify-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/20" />
              <p className="mt-3 text-sm text-muted-foreground">
                Select a conversation to view messages
              </p>
            </CardContent>
          ) : (
            <>
              <CardHeader className="border-b py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-sm">
                      {selected.contactName || selected.phone}
                    </CardTitle>
                    {selected.contactName && (
                      <p className="text-xs text-muted-foreground">{selected.phone}</p>
                    )}
                  </div>
                </div>
              </CardHeader>

              <ScrollArea className="flex-1 p-4">
                {loadingMessages ? (
                  <div className="flex h-32 items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground py-8">
                    No messages in this thread
                  </p>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2 ${msg.direction === 'outbound'
                              ? 'bg-[#0082c4] text-white'
                              : 'bg-muted'
                            }`}
                        >
                          <p className="text-sm">{msg.body}</p>
                          <p
                            className={`mt-1 text-[10px] ${msg.direction === 'outbound'
                                ? 'text-white/60'
                                : 'text-muted-foreground/60'
                              }`}
                          >
                            {msg.createdAt.toLocaleTimeString(undefined, {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              <div className="border-t p-3">
                <div className="flex gap-2">
                  <Input
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type a reply…"
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleReply();
                      }
                    }}
                  />
                  <Button
                    onClick={handleReply}
                    disabled={!replyText.trim() || sending}
                    size="icon"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
