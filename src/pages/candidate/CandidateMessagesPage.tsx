/**
 * CandidateMessagesPage — Candidate ↔ Consultant messaging
 * Issue #14: Candidate Portal v2.1
 */
import React, { useState, useEffect } from 'react';
import { Send, MessageSquare, Plus, X, ArrowLeft } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, EmptyState } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';

interface Message {
  id: string;
  thread_id: string;
  sender_type: 'candidate' | 'consultant' | 'system';
  sender_id: string;
  subject: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
  message_type: string;
}

interface Thread {
  thread_id: string;
  subject: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  messages: Message[];
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function CandidateMessagesPage() {
  const { session, user } = useAuthStore();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newContent, setNewContent] = useState('');
  const [replyContent, setReplyContent] = useState('');

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/candidate-portal/messages', {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      const data = await res.json();
      if (data.success && data.threads) {
        setThreads(data.threads);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [session]);

  const handleSendNew = async () => {
    if (!newContent.trim()) return;
    try {
      const res = await fetch('/api/candidate-portal/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          subject: newSubject || 'New Message',
          content: newContent,
          message_type: 'general',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowNewMessage(false);
        setNewSubject('');
        setNewContent('');
        fetchMessages();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleReply = async () => {
    if (!replyContent.trim() || !selectedThread) return;
    try {
      const res = await fetch('/api/candidate-portal/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          thread_id: selectedThread.thread_id,
          subject: selectedThread.subject,
          content: replyContent,
          message_type: 'general',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReplyContent('');
        fetchMessages();
        // Update selected thread
        if (selectedThread) {
          setSelectedThread({
            ...selectedThread,
            messages: [...selectedThread.messages, data.message],
            last_message: data.message.content,
            last_message_at: data.message.created_at,
          });
        }
      }
    } catch (err) {
      console.error('Failed to send reply:', err);
    }
  };

  const handleSelectThread = async (thread: Thread) => {
    setSelectedThread(thread);
    // Mark unread messages as read
    for (const msg of thread.messages) {
      if (!msg.is_read && msg.sender_type !== 'candidate') {
        try {
          await fetch(`/api/candidate-portal/messages/${msg.id}/read`, {
            method: 'PATCH',
            headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
          });
        } catch {
          // ignore
        }
      }
    }
    fetchMessages();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-[#F5F5F5] animate-pulse rounded" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-[#F5F5F5] animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif font-bold text-2xl text-[#171717]">Messages</h1>
          <p className="text-sm text-[#737373] mt-1">Communicate with your consultant and LYC team.</p>
        </div>
        <Button onClick={() => setShowNewMessage(true)} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          New Message
        </Button>
      </div>

      {/* New message form */}
      {showNewMessage && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-[#171717]">New Message</h3>
            <button onClick={() => setShowNewMessage(false)} className="text-[#737373] hover:text-[#171717]">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              value={newSubject}
              onChange={e => setNewSubject(e.target.value)}
              placeholder="Subject..."
              className="w-full px-3 py-2 border border-[#E5E5E5] text-sm focus:outline-none focus:border-[#C108AB]"
              style={{ borderRadius: 0 }}
            />
            <textarea
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              placeholder="Type your message..."
              rows={4}
              className="w-full px-3 py-2 border border-[#E5E5E5] text-sm focus:outline-none focus:border-[#C108AB] resize-none"
              style={{ borderRadius: 0 }}
            />
            <div className="flex justify-end">
              <Button size="sm" onClick={handleSendNew} disabled={!newContent.trim()}>
                <Send className="w-4 h-4 mr-1" />
                Send
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Thread view */}
      {selectedThread ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedThread(null)}
                  className="text-[#737373] hover:text-[#171717]"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <CardTitle>{selectedThread.subject}</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
              {selectedThread.messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_type === 'candidate' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] px-4 py-3 ${
                      msg.sender_type === 'candidate'
                        ? 'bg-[#C108AB] text-white'
                        : 'bg-[#F5F5F5] text-[#171717]'
                    }`}
                    style={{ borderRadius: 0 }}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p className={`text-xs mt-1 ${msg.sender_type === 'candidate' ? 'text-white/70' : 'text-[#A3A3A3]'}`}>
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply box */}
            <div className="flex gap-2 border-t border-[#E5E5E5] pt-3">
              <input
                type="text"
                value={replyContent}
                onChange={e => setReplyContent(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleReply()}
                placeholder="Type a reply..."
                className="flex-1 px-3 py-2 border border-[#E5E5E5] text-sm focus:outline-none focus:border-[#C108AB]"
                style={{ borderRadius: 0 }}
              />
              <Button size="sm" onClick={handleReply} disabled={!replyContent.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Thread list */
        <Card>
          <CardContent>
            {threads.length === 0 ? (
              <EmptyState
                icon={<MessageSquare className="w-10 h-10 text-[#D4D4D4]" />}
                title="No messages yet"
                description="Start a conversation with your consultant."
              />
            ) : (
              <div className="divide-y divide-[#E5E5E5]">
                {threads.map(thread => (
                  <button
                    key={thread.thread_id}
                    onClick={() => handleSelectThread(thread)}
                    className="w-full text-left p-4 hover:bg-[#FAFAFA] transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-[#171717]">{thread.subject}</span>
                      <span className="text-xs text-[#A3A3A3]">{formatTime(thread.last_message_at)}</span>
                    </div>
                    <p className="text-sm text-[#737373] truncate">{thread.last_message}</p>
                    {thread.unread_count > 0 && (
                      <Badge className="mt-1 bg-[#C108AB] text-white text-xs">
                        {thread.unread_count} unread
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default CandidateMessagesPage;