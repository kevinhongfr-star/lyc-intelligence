import React, { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { sendNexusMessage } from '@/services/nexusChat';
import { V3 } from '@/styles/v3-tokens';
import {
  PageHeader,
  Button,
  Badge,
  MonoLabel,
  ListRow,
  Input,
  Textarea,
  Tabs,
  EmptyState,
  Skeleton,
  Avatar,
  ScoreBar,
  IconButton,
} from '@/components/app-v3/ui';

interface NexusConversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  lens_id?: string | null;
  milestone_id?: string | null;
  // Engine-internal state (corrective batch, v2.7 spec).
  // Persisted from _engine response. NEVER render lane in UI (v2.7 § Three Lanes).
  lane?: string | null;
  lens_signals?: Record<string, number> | null;
  trust_stage?: string | null;
}

interface NexusMessage {
  id?: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
  tokens_used?: number;
  model_used?: string;
}

const CHAT_BUBBLE_ICON = (
  <svg
    width="40"
    height="40"
    viewBox="0 0 40 40"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M32 10H8C5.79 10 4 11.79 4 14v14c0 2.21 1.79 4 4 4h4l4 6 6-6h10c2.21 0 4-1.79 4-4V14c0-2.21-1.79-4-4-4z" />
    <path d="M12 20h16" />
    <path d="M12 26h10" />
  </svg>
);

const CHAT_START_ICON = (
  <svg
    width="40"
    height="40"
    viewBox="0 0 40 40"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M8 8h20c2.21 0 4 1.79 4 4v14c0 2.21-1.79 4-4 4h-4l-4 6-6-6H8c-2.21 0-4-1.79-4-4V12c0-2.21 1.79-4 4-4z" />
    <path d="M12 16h12" />
    <path d="M12 22h8" />
    <path d="M32 20l6-4-6-4" />
  </svg>
);

const SEND_ICON = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M3 8h10M9 4l4 4-4 4" />
  </svg>
);

const TRASH_ICON = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M3 4h10M6 4V2.5A.5.5 0 0 1 6.5 2h3a.5.5 0 0 1 .5.5V4M5 4v9.5A.5.5 0 0 0 5.5 14h5a.5.5 0 0 0 .5-.5V4" />
    <path d="M7 7v4M9 7v4" />
  </svg>
);

function formatShortDate(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    return d.toLocaleDateString([], { weekday: 'short' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function ChatPageV3(): React.ReactElement {
  const { user, profile } = useAuthStore();
  const userId = user?.id;

  const [activeTab, setActiveTab] = useState<string>('all');
  const [conversations, setConversations] = useState<NexusConversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState<boolean>(true);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<NexusMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState<boolean>(false);
  const [composerText, setComposerText] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [streamingMsgIndex, setStreamingMsgIndex] = useState<number | null>(null);

  const threadRef = useRef<HTMLDivElement>(null);
  const inMemoryConvos = useRef<NexusConversation[]>([]);
  const inMemoryMessages = useRef<Record<string, NexusMessage[]>>({});
  const streamIntervalRef = useRef<number | null>(null);

  /* ── Load conversations ─────────────────────────────────────── */

  const loadConversations = async () => {
    if (!userId) {
      setConversationsLoading(false);
      setConversations([]);
      return;
    }
    setConversationsLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('nexus_conversations')
          .select('*')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
          .limit(30);
        if (error) throw error;
        setConversations((data as NexusConversation[]) || []);
      } else {
        setConversations(inMemoryConvos.current.filter((c) => c.user_id === userId));
      }
    } catch (e) {
      console.error('[ChatPageV3] loadConversations error:', e);
      setConversations([]);
    } finally {
      setConversationsLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [userId]);

  /* ── Load messages when active convo changes ────────────────── */

  const loadMessages = async (convoId: string) => {
    setMessagesLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('nexus_messages')
          .select('*')
          .eq('conversation_id', convoId)
          .order('created_at', { ascending: true });
        if (error) throw error;
        setMessages((data as NexusMessage[]) || []);
      } else {
        setMessages(inMemoryMessages.current[convoId] || []);
      }
    } catch (e) {
      console.error('[ChatPageV3] loadMessages error:', e);
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
    } else {
      setMessages([]);
    }
  }, [activeConversationId]);

  /* ── Auto-scroll ────────────────────────────────────────────── */

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages.length, messages[messages.length - 1]?.content?.length]);

  /* ── Cleanup streaming interval ─────────────────────────────── */

  useEffect(() => {
    return () => {
      if (streamIntervalRef.current != null) {
        window.clearInterval(streamIntervalRef.current);
        streamIntervalRef.current = null;
      }
    };
  }, []);

  /* ── Create conversation ────────────────────────────────────── */

  const createConversation = async () => {
    if (!userId) return;
    const newId =
      (isSupabaseConfigured ? null : `local-${Date.now()}`) ||
      `local-${Date.now()}`;
    const now = new Date().toISOString();
    const baseConvo: NexusConversation = {
      id: newId,
      user_id: userId,
      title: 'New conversation',
      created_at: now,
      updated_at: now,
    };
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('nexus_conversations')
          .insert({
            user_id: userId,
            title: 'New conversation',
          })
          .select()
          .single();
        if (error) throw error;
        const created = data as NexusConversation;
        setConversations((prev) => [created, ...prev]);
        setActiveConversationId(created.id);
      } else {
        inMemoryConvos.current.unshift(baseConvo);
        inMemoryMessages.current[baseConvo.id] = [];
        setConversations([...inMemoryConvos.current.filter((c) => c.user_id === userId)]);
        setActiveConversationId(baseConvo.id);
      }
    } catch (e) {
      console.error('[ChatPageV3] createConversation error:', e);
    }
  };

  /* ── Delete conversation ────────────────────────────────────── */

  const deleteConversation = async (convoId: string) => {
    try {
      if (isSupabaseConfigured) {
        const { error: msgErr } = await supabase
          .from('nexus_messages')
          .delete()
          .eq('conversation_id', convoId);
        if (msgErr) throw msgErr;
        const { error: convErr } = await supabase
          .from('nexus_conversations')
          .delete()
          .eq('id', convoId);
        if (convErr) throw convErr;
      } else {
        inMemoryConvos.current = inMemoryConvos.current.filter((c) => c.id !== convoId);
        delete inMemoryMessages.current[convoId];
      }
      setConversations((prev) => prev.filter((c) => c.id !== convoId));
      if (activeConversationId === convoId) {
        setActiveConversationId(null);
      }
    } catch (e) {
      console.error('[ChatPageV3] deleteConversation error:', e);
    }
  };

  /* ── Insert message helper ──────────────────────────────────── */

  const insertMessage = async (msg: NexusMessage): Promise<NexusMessage | null> => {
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('nexus_messages')
          .insert({
            conversation_id: msg.conversation_id,
            role: msg.role,
            content: msg.content,
            tokens_used: msg.tokens_used,
            model_used: msg.model_used,
          })
          .select()
          .single();
        if (error) throw error;
        return data as NexusMessage;
      } else {
        const local: NexusMessage = {
          ...msg,
          id: `msg-${Date.now()}-${Math.random()}`,
          created_at: new Date().toISOString(),
        };
        if (!inMemoryMessages.current[msg.conversation_id]) {
          inMemoryMessages.current[msg.conversation_id] = [];
        }
        inMemoryMessages.current[msg.conversation_id].push(local);
        return local;
      }
    } catch (e) {
      console.error('[ChatPageV3] insertMessage error:', e);
      return null;
    }
  };

  const bumpConversationUpdated = async (convoId: string, newTitle?: string) => {
    const now = new Date().toISOString();
    try {
      if (isSupabaseConfigured) {
        const patch: Record<string, unknown> = { updated_at: now };
        if (newTitle) patch.title = newTitle;
        const { data, error } = await supabase
          .from('nexus_conversations')
          .update(patch)
          .eq('id', convoId)
          .select()
          .single();
        if (error) throw error;
        if (data) {
          setConversations((prev) =>
            prev
              .map((c) => (c.id === convoId ? (data as NexusConversation) : c))
              .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1)),
          );
        }
      } else {
        inMemoryConvos.current = inMemoryConvos.current
          .map((c) =>
            c.id === convoId
              ? { ...c, updated_at: now, title: newTitle || c.title }
              : c,
          )
          .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
        setConversations([...inMemoryConvos.current.filter((c) => c.user_id === userId)]);
      }
    } catch (e) {
      console.error('[ChatPageV3] bumpConversationUpdated error:', e);
    }
  };

  /* ── Send message ───────────────────────────────────────────── */

  const handleSend = async () => {
    const text = composerText.trim();
    if (!text || !activeConversationId || isSending || !userId) return;

    setIsSending(true);
    setComposerText('');

    const userMsg: NexusMessage = {
      conversation_id: activeConversationId,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    const savedUser = await insertMessage(userMsg);
    if (savedUser) {
      setMessages((prev) => [...prev, savedUser]);
    } else {
      setMessages((prev) => [...prev, userMsg]);
    }

    const isFirstUserMsg =
      messages.filter((m) => m.role === 'user').length === 0 &&
      (savedUser ? 1 : 0) === 1;
    if (isFirstUserMsg) {
      const firstLine = text.split(/\n/)[0].slice(0, 60) || 'New conversation';
      await bumpConversationUpdated(activeConversationId, firstLine);
    } else {
      await bumpConversationUpdated(activeConversationId);
    }

    // Engine takes history WITHOUT the current user message (it appends
    // itself); history is already [assistant, user, assistant, …].
    const historyForApi: Array<{ role: string; content: string }> = messages.map(
      (m) => ({ role: m.role, content: m.content }),
    );

    // Onboarding & opening-vector flags (v2.7 § OPENING SCRIPTS v1.2).
    // Vector D fires only when conversation has ZERO prior messages AND the
    // user has clicked an "empty" NEXUS-start (below) — handled separately by
    // calling nexusStartsTheChat=true with empty text.
    const priorUserCount = messages.filter((m) => m.role === 'user').length;
    const nexusStartsTheChat = !!(body as any)?.nexusStartsTheChatFlag;
    void nexusStartsTheChat; // currently driven via empty-chat button below
    const currentLane =
      conversations.find((c) => c.id === activeConversationId)?.lane ?? null;
    const totalConvos = conversations.length;

    const assistantPlaceholder: NexusMessage = {
      conversation_id: activeConversationId,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, assistantPlaceholder]);
    const placeholderIndex = messages.length + (savedUser ? 1 : 1);
    setStreamingMsgIndex(placeholderIndex);

    try {
      const nexusResult = await sendNexusMessage(text, {
        conversationId: activeConversationId,
        userId,
        history: historyForApi,
        currentLane,
        sessionCount: totalConvos,
        lensCount: 0,
        nexusStartsTheChat: priorUserCount === 0 && !text,
        userProfile: {
          name: profile?.name,
          tier: profile?.tier,
          icp: profile?.icp,
        },
      });
      const fullResponse = nexusResult.response;

      // Persist engine-internal state (lane is NEVER rendered in UI).
      if (isSupabaseConfigured) {
        void supabase
          .from('nexus_conversations')
          .update({
            lane: nexusResult._engine.lane,
            lens_signals: nexusResult._engine.lensSignals,
            trust_stage: nexusResult._engine.trustStage,
          })
          .eq('id', activeConversationId);
      }
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversationId
            ? {
                ...c,
                lane: nexusResult._engine.lane,
                lens_signals: nexusResult._engine.lensSignals,
                trust_stage: nexusResult._engine.trustStage,
              }
            : c,
        ),
      );

      if (streamIntervalRef.current != null) {
        window.clearInterval(streamIntervalRef.current);
      }

      let revealed = 0;
      streamIntervalRef.current = window.setInterval(() => {
        revealed = Math.min(revealed + 1, fullResponse.length);
        setMessages((prev) => {
          const copy = [...prev];
          if (copy[placeholderIndex]) {
            copy[placeholderIndex] = {
              ...copy[placeholderIndex],
              content: fullResponse.slice(0, revealed),
            };
          }
          return copy;
        });
        if (revealed >= fullResponse.length) {
          if (streamIntervalRef.current != null) {
            window.clearInterval(streamIntervalRef.current);
            streamIntervalRef.current = null;
          }
          setStreamingMsgIndex(null);
          (async () => {
            const finalMsg: NexusMessage = {
              conversation_id: activeConversationId,
              role: 'assistant',
              content: fullResponse,
              created_at: new Date().toISOString(),
            };
            const saved = await insertMessage(finalMsg);
            if (saved) {
              setMessages((prev) => {
                const copy = [...prev];
                copy[placeholderIndex] = saved;
                return copy;
              });
            }
          })();
        }
      }, 12);
    } catch (e) {
      console.error('[ChatPageV3] handleSend error:', e);
      setStreamingMsgIndex(null);
      setMessages((prev) => {
        const copy = [...prev];
        if (copy[placeholderIndex]) {
          copy[placeholderIndex] = {
            ...copy[placeholderIndex],
            content: 'I\'m having trouble connecting right now. Please try again in a moment.',
          };
        }
        return copy;
      });
    } finally {
      setIsSending(false);
    }
  };

  const onComposerKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* ── Filtered conversations by tab ──────────────────────────── */

  const filteredConversations = conversations.filter((c) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'lenses') return Boolean(c.lens_id);
    if (activeTab === 'milestones') return Boolean(c.milestone_id);
    return true;
  });

  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;

  /* ── Render helpers ─────────────────────────────────────────── */

  const renderConversationList = () => {
    if (conversationsLoading) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} height={56} />
          ))}
        </div>
      );
    }
    if (filteredConversations.length === 0) {
      return (
        <EmptyState
          iconSvg={CHAT_BUBBLE_ICON}
          title="No conversations yet"
          description="New threads land here automatically."
        />
      );
    }
    return (
      <div
        style={{
          border: `1px solid ${V3.ink200}`,
          background: V3.white,
        }}
      >
        {filteredConversations.map((c) => {
          const isActive = c.id === activeConversationId;
          return (
            <div
              key={c.id}
              onClick={() => setActiveConversationId(c.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                padding: '14px 16px',
                borderBottom: `1px solid ${V3.ink100}`,
                cursor: 'pointer',
                background: isActive ? V3.ocean50 : 'transparent',
                borderLeft: isActive ? `3px solid ${V3.ocean600}` : '3px solid transparent',
                transition: `background ${V3.durFast}ms ${V3.ease}`,
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = V3.ink50;
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: V3.bodyFont,
                    fontSize: '14px',
                    fontWeight: V3.fwMedium,
                    color: V3.ink800,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    lineHeight: 1.3,
                  }}
                >
                  {c.title || 'Untitled'}
                </div>
                <div style={{ marginTop: 6 }}>
                  <MonoLabel color={V3.ink400} size="sm">
                    {formatShortDate(c.updated_at)}
                  </MonoLabel>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderMessageThread = () => {
    if (!activeConversation) {
      return (
        <EmptyState
          iconSvg={CHAT_START_ICON}
          title="Pick a conversation, or start one."
          description="Your message history stays with you, private."
          action={
            <Button variant="ghost" disabled>
              Select a conversation
            </Button>
          }
        />
      );
    }

    if (messagesLoading) {
      return (
        <div
          style={{
            padding: '24px 24px 48px',
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          {Array.from({ length: 5 }).map((_, i) => {
            const isUser = i % 2 === 0;
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  alignItems: isUser ? 'flex-end' : 'flex-start',
                }}
              >
                <Skeleton width={isUser ? 48 : 120} height={16} />
                <Skeleton
                  width={isUser ? '60%' : '70%'}
                  height={isUser ? 40 : 60}
                />
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div
          style={{
            position: 'sticky',
            top: 0,
            borderBottom: `1px solid ${V3.ink100}`,
            padding: '12px 24px',
            background: V3.white,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            zIndex: 2,
          }}
        >
          <div
            style={{
              fontFamily: V3.bodyFont,
              fontSize: '16px',
              fontWeight: V3.fwSemibold,
              color: V3.ink800,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              flex: 1,
              minWidth: 0,
            }}
          >
            {activeConversation.title || 'Untitled'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <Button variant="ghost">Share</Button>
            <IconButton
              label="Delete conversation"
              onClick={() => deleteConversation(activeConversation.id)}
            >
              {TRASH_ICON}
            </IconButton>
          </div>
        </div>
        <div
          ref={threadRef}
          style={{
            maxHeight: '60vh',
            overflowY: 'auto',
            flex: 1,
            minHeight: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 24,
              padding: '24px 24px 48px',
            }}
          >
            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              const isStreaming = streamingMsgIndex === idx;
              return (
                <div
                  key={msg.id || `${msg.conversation_id}-${idx}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start',
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      flexDirection: isUser ? 'row-reverse' : 'row',
                    }}
                  >
                    {isUser ? (
                      <Avatar name={profile?.name || 'You'} size="sm" />
                    ) : (
                      <div
                        style={{
                          width: V3.sizeAvatarSm,
                          height: V3.sizeAvatarSm,
                          background: V3.ocean700,
                          color: V3.white,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: V3.displayFont,
                          fontSize: '11px',
                          fontWeight: V3.fwBold,
                          flexShrink: 0,
                        }}
                      >
                        N
                      </div>
                    )}
                    <div
                      style={{
                        fontFamily: V3.bodyFont,
                        fontSize: '12.5px',
                        color: V3.ink500,
                        fontWeight: V3.fwMedium,
                        lineHeight: 1,
                      }}
                    >
                      {isUser ? profile?.name || 'You' : 'NEXUS'}
                    </div>
                  </div>
                  <div style={{ maxWidth: '75%' }}>
                    <div
                      style={{
                        display: 'inline-block',
                        padding: '12px 16px',
                        fontFamily: V3.bodyFont,
                        fontSize: '14px',
                        lineHeight: 1.6,
                        wordBreak: 'break-word',
                        background: isUser ? V3.ocean600 : V3.white,
                        color: isUser ? V3.white : V3.ink800,
                        border: isUser ? 'none' : `1px solid ${V3.ink200}`,
                      }}
                    >
                      {msg.content}
                      {isStreaming && (
                        <span
                          className="v3-blink-cursor"
                          style={{
                            display: 'inline-block',
                            width: 6,
                            height: 14,
                            marginLeft: 4,
                            background: V3.ink900,
                            verticalAlign: 'middle',
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        background: V3.cream,
        minHeight: '100vh',
      }}
    >
      <style>
        {`
          @keyframes v3-blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
          }
          .v3-blink-cursor {
            animation: v3-blink 1s step-end infinite;
          }
        `}
      </style>

      <div
        style={{
          paddingTop: V3.appPageHeaderPad,
          paddingBottom: 64,
          paddingLeft: 24,
          paddingRight: 24,
        }}
      >
        <PageHeader
          kicker="NEXUS"
          title="Your conversations."
          description="Always-on executive coach. Attuned to your full baseline — lenses, milestones, documents — and with you every step."
          right={
            <Button variant="primary" size="large" onClick={createConversation}>
              + New conversation
            </Button>
          }
        />
      </div>

      <div
        style={{
          maxWidth: V3.appContentMax,
          margin: '0 auto',
          paddingLeft: 24,
          paddingRight: 24,
          borderBottom: `1px solid ${V3.ink200}`,
        }}
      >
        <Tabs
          tabs={[
            { key: 'all', label: 'All' },
            { key: 'lenses', label: 'Tied to lenses' },
            { key: 'milestones', label: 'Tied to milestones' },
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />
      </div>

      <div
        style={{
          maxWidth: V3.appContentMax,
          margin: '0 auto',
          marginTop: 48,
          paddingLeft: 24,
          paddingRight: 24,
          display: 'grid',
          gridTemplateColumns: `${V3.appChatSideWidth}px 1fr ${V3.appInfoPanelWidth}px`,
          gap: 24,
          alignItems: 'flex-start',
        }}
      >
        {/* COLUMN 1 — Conversation list */}
        <div
          style={{
            width: V3.appChatSideWidth,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <Button variant="primary" block onClick={createConversation}>
            + New conversation
          </Button>

          <div style={{ padding: '0 0 12px 0' }}>
            <MonoLabel color={V3.ink400}>RECENT</MonoLabel>
          </div>

          {renderConversationList()}
        </div>

        {/* COLUMN 2 — Message thread + composer */}
        <div
          style={{
            flex: '1 1 auto',
            minWidth: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              background: V3.white,
              border: `1px solid ${V3.ink200}`,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {renderMessageThread()}

            {activeConversation && (
              <div
                style={{
                  position: 'sticky',
                  bottom: 0,
                  borderTop: `1px solid ${V3.ink200}`,
                  padding: '16px 24px',
                  background: V3.cream,
                }}
              >
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <Textarea
                    placeholder="Ask NEXUS anything…"
                    rows={2}
                    value={composerText}
                    onChange={(e) => setComposerText(e.target.value)}
                    onKeyDown={onComposerKeyDown}
                    disabled={isSending}
                    style={{
                      flex: 1,
                      minHeight: 48,
                      resize: 'vertical',
                    }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <IconButton
                      label="Send"
                      onClick={handleSend}
                      disabled={isSending || !composerText.trim()}
                      size={V3.sizeSendButton}
                      style={{
                        background: !isSending && composerText.trim() ? V3.ocean600 : 'transparent',
                        color:
                          !isSending && composerText.trim()
                            ? V3.white
                            : V3.ink400,
                        width: V3.sizeSendButton,
                        height: V3.sizeSendButton,
                      }}
                    >
                      {SEND_ICON}
                    </IconButton>
                  </div>
                </div>
                <div style={{ marginTop: 8 }}>
                  <MonoLabel color={V3.ink400} size="sm">
                    Enter to send, shift+enter new line
                  </MonoLabel>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 3 — Info panel (hide on tablet) */}
        <div
          className="v3-app-hide-tablet"
          style={{
            width: V3.appInfoPanelWidth,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              border: `1px solid ${V3.ink200}`,
              background: V3.white,
              padding: 24,
            }}
          >
            <MonoLabel color={V3.ink400}>MEMORY</MonoLabel>
            <div
              style={{
                marginTop: 16,
                fontFamily: V3.displayFont,
                fontSize: '20px',
                fontWeight: V3.fwRegular,
                color: V3.ocean600,
                lineHeight: 1.2,
              }}
            >
              Context on tap.
            </div>
            <div
              style={{
                marginTop: 12,
                fontFamily: V3.bodyFont,
                fontSize: '14px',
                lineHeight: 1.6,
                color: V3.ink500,
              }}
            >
              Active lens scores, active milestone targets, and most recent document extracts appear here for longer-running threads.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
