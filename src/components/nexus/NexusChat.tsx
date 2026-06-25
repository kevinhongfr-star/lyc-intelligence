import React, { useState, useRef, useEffect, useCallback } from 'react';
import { authFetch } from '@/utils/authFetch';
import { toast } from '@/stores/toastStore';
import { 
  ArrowRight, Shield, Loader2, RefreshCw, Paperclip, 
  Crown, MessageSquare, Plus, CreditCard, Menu, X, Sparkles
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { getCreditBalance, checkAndGrantDailyCredits } from '@/services/creditService';
import { CreditGate } from './CreditGate';
import { CareerInsight } from './CareerInsight';
import { CouncilUpsell } from './CouncilUpsell';

const DS = {
  headingFont: "'Libre Baskerville', Georgia, serif",
  bodyFont: "'DM Sans', system-ui, sans-serif",
  accent: '#C108AB',
  accentHover: '#A00790',
  bg: '#FFFFFF',
  bgAlt: '#F5F5F5',
  card: '#FFFFFF',
  cardBorder: '#E5E5E5',
  text: '#000000',
  textSecondary: '#333333',
  muted: '#666666',
  border: '#E5E5E5',
  radius: '12px',
  radiusSm: '8px',
  shadow: '0 1px 3px rgba(0,0,0,0.08)',
  shadowHover: '0 4px 12px rgba(0,0,0,0.1)',
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

interface NexusChatProps {
  showHeader?: boolean;
  initialPrompts?: string[];
  onMessageSent?: () => void;
  onCreditCheck?: () => Promise<{ balance: number; tier: string } | null>;
}

export function NexusChat({ showHeader = true, initialPrompts, onMessageSent }: NexusChatProps) {
  const { user, profile } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "I'm Nexus. LYC Partners has placed 500+ executives across 47 markets — I carry that knowledge into every conversation.\n\nOne in three cross-border executive moves fails within 18 months. Usually for the same reasons.\n\nWhat are you navigating right now?"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiState, setAiState] = useState<'idle' | 'thinking' | 'error'>('idle');
  const [lastUserMessage, setLastUserMessage] = useState<string | null>(null);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>(initialPrompts || [
    "I'm considering a move from Europe to APAC — what do I need to know?",
    'What makes a strong cross-border C-suite profile in 2026?',
    'I have a senior interview next week — help me prepare',
    'How does my profile benchmark against regional executives?'
  ]);
  const [creditBalance, setCreditBalance] = useState(0);
  const [creditTier, setCreditTier] = useState('free');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [streamingContent, setStreamingContent] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  const FREE_TRIAL_LIMIT = 5;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  useEffect(() => {
    const loadSession = async () => {
      if (user?.id) {
        await checkAndGrantDailyCredits(user.id);
        const creditInfo = await getCreditBalance(user.id);
        if (creditInfo) {
          setCreditBalance(creditInfo.balance);
          setCreditTier(creditInfo.tier);
        }
        
        const savedSession = localStorage.getItem(`nexus_chat_${user.id}`);
        if (savedSession) {
          try {
            const parsed = JSON.parse(savedSession);
            setMessages(parsed.messages || messages);
            setSessionId(parsed.sessionId);
            setMessageCount(parsed.messageCount || 0);
          } catch (e) {
            console.error('[NexusChat] Failed to load saved session:', e);
          }
        } else {
          const newId = `session_${Date.now()}`;
          setSessionId(newId);
        }
      }
    };
    loadSession();
  }, [user?.id]);

  useEffect(() => {
    if (user?.id && sessionId) {
      localStorage.setItem(`nexus_chat_${user.id}`, JSON.stringify({
        sessionId,
        messages,
        messageCount,
        updatedAt: Date.now()
      }));
    }
  }, [messages, user?.id, sessionId, messageCount]);

  const getContextWindow = useCallback(() => {
    return messages.slice(-10);
  }, [messages]);

  const sendMessage = async (userMsg: string) => {
    setAiState('thinking');
    setStreamingContent('');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await authFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          userId: user?.id,
          tier: profile?.tier || creditTier,
          history: getContextWindow(),
          documentContext: '',
          memoryContext: [],
          messageCount: messageCount + 1,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      
      if (!res.ok) {
        let serverMsg = 'API failed';
        try {
          const errBody = await res.json();
          serverMsg = errBody.response || errBody.error || serverMsg;
        } catch {}
        throw new Error(serverMsg);
      }

      const reader = res.body?.getReader();
      if (!reader) {
        const data = await res.json();
        handleResponse(data);
        return;
      }

      const decoder = new TextDecoder();
      let fullContent = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;
        
        try {
          const parsed = JSON.parse(fullContent);
          setStreamingContent(parsed.response || '');
        } catch {
          setStreamingContent(fullContent);
        }
      }

      try {
        const data = JSON.parse(fullContent);
        handleResponse(data);
      } catch {
        handleResponse({ response: fullContent, suggested_prompts: [] });
      }
    } catch (e: any) {
      clearTimeout(timeout);
      console.error('Chat failed:', e);
      const isAbort = e?.name === 'AbortError';
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: isAbort
          ? 'The request took too long. Please try a shorter question or try again.'
          : `Sorry, something went wrong: ${e?.message || 'Unknown error'}`
      }]);
      setAiState('idle');
      setStreamingContent(null);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = (data: { response: string; suggested_prompts?: string[] }) => {
    setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    setSuggestedPrompts(data.suggested_prompts || suggestedPrompts);
    setAiState('idle');
    setStreamingContent(null);
    
    if (user?.id) {
      getCreditBalance(user.id).then(info => {
        if (info) setCreditBalance(info.balance);
      });
    }
  };

  const handleCreditApproval = (reason: 'free_trial' | 'credit_deducted') => {
    setPendingApproval(false);
    if (reason === 'credit_deducted' && user?.id) {
      getCreditBalance(user.id).then(info => {
        if (info) setCreditBalance(info.balance);
      });
    }
    send(input.trim());
  };

  const send = async () => {
    if (!input.trim() || loading) return;

    const newMessageCount = messageCount + 1;
    
    if (newMessageCount > FREE_TRIAL_LIMIT && creditTier === 'free' && creditBalance < 1) {
      setPendingApproval(true);
      return;
    }

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    setMessageCount(newMessageCount);
    
    onMessageSent?.();
    
    await sendMessage(userMsg);
  };

  const retry = async () => {
    if (lastUserMessage) {
      setAiState('thinking');
      setLoading(true);
      await sendMessage(lastUserMessage);
    }
  };

  const handleDocumentUpload = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.docx,.txt';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      if (file.size > 10 * 1024 * 1024) {
        toast.warning('File size exceeds 10MB limit');
        return;
      }

      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'document');
      
      try {
        const response = await authFetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        if (data.text) {
          setMessages(prev => [...prev, {
            role: 'user',
            content: `I've uploaded a document: ${file.name}. Please analyze it and help me understand its content.`
          }]);
          setMessageCount(prev => prev + 1);
          await sendMessage(`Please analyze this document: ${file.name}`);
        }
      } catch (error) {
        console.error('Upload failed:', error);
        toast.error('Failed to upload document');
      } finally {
        setLoading(false);
      }
    };
    input.click();
  }, [sendMessage]);

  const handlePromptSelect = (prompt: string) => {
    setInput(prompt);
  };

  const createNewSession = () => {
    const newId = `session_${Date.now()}`;
    setSessionId(newId);
    setMessages([{
      role: 'assistant',
      content: "I'm Nexus. LYC Partners has placed 500+ executives across 47 markets — I carry that knowledge into every conversation.\n\nOne in three cross-border executive moves fails within 18 months. Usually for the same reasons.\n\nWhat are you navigating right now?"
    }]);
    setMessageCount(0);
    setShowSidebar(false);
  };

  const shouldShowUpsell = () => {
    if (creditTier !== 'free') return null;
    if (messageCount === FREE_TRIAL_LIMIT) return 'trial' as const;
    if (messageCount > 0 && messageCount % 5 === 0) return 'insight' as const;
    if (messageCount >= 10) return 'usage' as const;
    return null;
  };

  const upsellTrigger = shouldShowUpsell();

  return (
    <div style={{ minHeight: '100vh', background: DS.bg, display: 'flex' }}>
      <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" style={{ display: showSidebar ? 'block' : 'none' }} 
        onClick={() => setShowSidebar(false)} />

      <aside style={{
        width: '280px',
        background: DS.bgAlt,
        borderRight: `1px solid ${DS.border}`,
        display: showSidebar ? 'block' : 'none',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 50,
        overflowY: 'auto',
        '@media (min-width: 1024px)': { position: 'relative', display: 'block' }
      }}>
        <div className="p-4 border-b border-border">
          <button 
            onClick={() => setShowSidebar(false)}
            className="lg:hidden p-2 mb-2 text-text-muted hover:text-text-primary"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Nexus</h3>
              <p className="text-xs text-text-muted">{sessions.length} conversations</p>
            </div>
          </div>
        </div>

        <button
          onClick={createNewSession}
          className="w-full m-4 px-4 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent-hover transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>

        <div className="px-2 space-y-1">
          {sessions.map(session => (
            <button
              key={session.id}
              className={`w-full text-left px-3 py-3 rounded-lg hover:bg-bg-tertiary transition-colors ${
                session.id === sessionId ? 'bg-accent/10' : ''
              }`}
            >
              <p className="text-sm font-medium text-text-primary truncate">{session.title}</p>
              <p className="text-xs text-text-muted truncate">
                {session.messages.length} messages
              </p>
            </button>
          ))}
        </div>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {showHeader && (
          <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: `1px solid ${DS.border}` }}>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowSidebar(true)}
                className="lg:hidden p-2 text-text-muted hover:text-text-primary"
              >
                <Menu className="w-5 h-5" />
              </button>
              <a href="/" style={{ fontFamily: DS.headingFont, fontSize: '18px', fontWeight: 700, color: DS.text, textDecoration: 'none' }}>LYC Intelligence</a>
            </div>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
              {user && creditTier === 'free' && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-full">
                  <CreditCard className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium text-accent">{creditBalance} credits</span>
                </div>
              )}
              {creditTier !== 'free' && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 rounded-full">
                  <Crown className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-700">Council</span>
                </div>
              )}
              <a href="/b2b" style={{ fontSize: '13px', color: DS.muted, textDecoration: 'none' }}>For Firms</a>
              <a href="/b2c" style={{ fontSize: '13px', color: DS.muted, textDecoration: 'none' }}>For Leaders</a>
              <a href="/match" style={{ fontSize: '13px', color: DS.muted, textDecoration: 'none' }}>Score Match</a>
            </div>
          </nav>
        )}

        <div style={{ flex: 1, maxWidth: '800px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', padding: '0 24px' }}>
          {showHeader && (
            <div style={{ textAlign: 'center', padding: '32px 0 20px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: `${DS.accent}15`, borderRadius: '20px', marginBottom: '12px' }}>
                <span className="nexus-pulse-dot" />
                <span style={{ fontSize: '12px', color: DS.accent, fontWeight: 600 }}>Nexus</span>
              </div>
              <h1 style={{ fontFamily: DS.headingFont, fontSize: '32px', fontWeight: 700, color: DS.text, margin: '0 0 4px' }}>Nexus</h1>
              <p style={{ fontSize: '14px', color: DS.muted }}>Know where you stand. Know where to go.</p>
            </div>
          )}

          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: 'calc(100vh - 280px)' }}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: m.role === 'user' ? '70%' : '80%',
                }}
              >
                <div
                  style={{
                    padding: '14px 18px',
                    background: m.role === 'user' ? DS.accent : DS.card,
                    border: m.role === 'user' ? 'none' : `1px solid ${DS.cardBorder}`,
                    borderRadius: m.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                    color: m.role === 'user' ? '#FFFFFF' : DS.text,
                    fontSize: '14px',
                    lineHeight: '1.6',
                    wordBreak: 'break-word',
                  }}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {streamingContent && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  maxWidth: '80%',
                  padding: '14px 18px',
                  background: DS.card,
                  border: `1px solid ${DS.cardBorder}`,
                  borderRadius: '12px 12px 12px 4px',
                  color: DS.text,
                  fontSize: '14px',
                  lineHeight: '1.6',
                }}
              >
                {streamingContent}
                <span className="animate-pulse">|</span>
              </div>
            )}

            {upsellTrigger && (
              <CouncilUpsell
                trigger={upsellTrigger}
                messageCount={messageCount}
                onUpgrade={() => setShowUpgradeModal(true)}
              />
            )}

            <CareerInsight
              messageCount={messageCount}
              conversationHistory={messages}
              onUpgrade={() => setShowUpgradeModal(true)}
            />

            {aiState === 'thinking' && !streamingContent && (
              <div style={{ alignSelf: 'flex-start', padding: '12px 16px', background: DS.card, border: `1px solid ${DS.cardBorder}`, borderRadius: '12px 12px 12px 4px', color: DS.muted, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
                Thinking...
              </div>
            )}

            {aiState === 'error' && (
              <div style={{ alignSelf: 'flex-start', width: '100%', maxWidth: '400px', background: 'rgba(193, 8, 171, 0.1)', border: '1px solid rgba(193, 8, 171, 0.3)', borderRadius: '12px', padding: '16px' }}>
                <p style={{ fontSize: '13px', color: DS.textSecondary, marginBottom: '12px' }}>
                  Oops, something went wrong. Want to try again?
                </p>
                <button
                  onClick={retry}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    background: DS.accent,
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    minHeight: '36px'
                  }}
                >
                  <RefreshCw style={{ width: 14, height: 14 }} />
                  Retry
                </button>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="space-y-3 mb-4">
            <p className="text-xs text-text-muted text-center">Suggested questions:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestedPrompts.slice(0, 3).map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handlePromptSelect(prompt)}
                  className="px-3 py-1.5 bg-bg-tertiary hover:bg-bg-secondary text-text-muted hover:text-text-primary text-xs rounded-full transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Ask about LYC Partners, executive search, career strategy..."
              style={{
                flex: 1,
                padding: '14px 16px',
                background: DS.card,
                border: `1px solid ${DS.cardBorder}`,
                borderRadius: '8px',
                color: DS.text,
                fontSize: '14px',
                outline: 'none',
                resize: 'none'
              }}
              rows={1}
            />
            <button
              onClick={handleDocumentUpload}
              disabled={loading}
              style={{
                padding: '14px',
                background: DS.card,
                border: `1px solid ${DS.cardBorder}`,
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {loading ? (
                <Loader2 style={{ width: 18, height: 18, color: DS.accent, animation: 'spin 1s linear infinite' }} />
              ) : (
                <Paperclip style={{ width: 18, height: 18, color: DS.textSecondary }} />
              )}
            </button>
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              style={{
                padding: '14px 20px',
                background: DS.accent,
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                cursor: (loading || !input.trim()) ? 'not-allowed' : 'pointer',
                opacity: (loading || !input.trim()) ? 0.5 : 1,
                minHeight: '44px',
              }}
            >
              <ArrowRight style={{ width: 18, height: 18 }} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', marginBottom: '20px' }}>
            <Shield style={{ width: 12, height: 12, color: DS.muted }} />
            <span style={{ fontSize: '11px', color: DS.muted }}>Leadership isn't a title — it's a trajectory. Powered by LYC Intelligence.</span>
          </div>
        </div>
      </div>

      {pendingApproval && (
        <CreditGate
          messageCount={messageCount + 1}
          onApproved={handleCreditApproval}
          onUpgrade={() => setShowUpgradeModal(true)}
          onCancel={() => setPendingApproval(false)}
        />
      )}

      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-accent to-purple-600 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Crown className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Upgrade to Council</h3>
                  <p className="text-white/80 text-sm">Unlock unlimited career insights</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-accent" />
                  <div>
                    <p className="font-semibold text-text-primary">5 Credits per Day</p>
                    <p className="text-sm text-text-muted">Never run out of insights</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-accent" />
                  <div>
                    <p className="font-semibold text-text-primary">SHIFT Assessments</p>
                    <p className="text-sm text-text-muted">Personalized career reports</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-accent" />
                  <div>
                    <p className="font-semibold text-text-primary">Priority Support</p>
                    <p className="text-sm text-text-muted">Get answers when you need them</p>
                  </div>
                </div>
              </div>

              <div className="text-center mb-6">
                <p className="text-3xl font-bold text-accent">$29</p>
                <p className="text-text-muted text-sm">per month</p>
              </div>

              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  window.open('/pricing', '_blank');
                }}
                className="w-full py-3 px-4 bg-accent text-white rounded-xl font-medium hover:bg-accent-hover transition-colors flex items-center justify-center gap-2"
              >
                Start 14-Day Free Trial
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setShowUpgradeModal(false)}
                className="w-full mt-3 py-3 px-4 bg-bg-tertiary text-text-primary rounded-xl font-medium hover:bg-bg-secondary transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}