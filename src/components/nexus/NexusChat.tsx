import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, Zap, Shield, Loader2, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { MessageBubble } from './MessageBubble';
import { SuggestedPrompts } from './SuggestedPrompts';
import { EmailCapture } from './EmailCapture';

const DS = {
  headingFont: 'Georgia, serif',
  accent: '#C108AB',
  bg: '#0A0A0A',
  card: '#111111',
  muted: '#888888',
  text: '#FFFFFF',
  textSecondary: '#CCCCCC',
  border: '#222222',
  radius: '12px'
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface NexusChatProps {
  showHeader?: boolean;
  initialPrompts?: string[];
}

export function NexusChat({ showHeader = true, initialPrompts }: NexusChatProps) {
  const { user, profile } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm **Nexus**, LYC Partners' AI assistant. I can help you with:\n\n- **Executive Search** — How we find cross-border leaders\n- **TRIDENT Matching** — How our AI-powered JD↔CV matching works\n- **Career Strategy** — Guidance for senior leaders navigating international careers\n- **Leadership Advisory** — Our D3 Framework: Diagnose · Design · Deliver\n\nWhat would you like to know?"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiState, setAiState] = useState<'idle' | 'thinking' | 'error'>('idle');
  const [lastUserMessage, setLastUserMessage] = useState<string | null>(null);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>(initialPrompts || [
    'What does LYC do?',
    'How does TRIDENT matching work?',
    'Tell me about the D3 Framework',
    'What is The Council?'
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [showEmailGate, setShowEmailGate] = useState(false);
  const [capturedEmail, setCapturedEmail] = useState<string | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showEmailGate]);

  const sendMessage = async (userMsg: string) => {
    setAiState('thinking');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          userId: user?.id,
          tier: profile?.tier || 'free',
          history: messages.slice(-10),
        })
      });
      if (!res.ok) throw new Error('API failed');
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      setSuggestedPrompts(data.suggested_prompts || suggestedPrompts);
      setAiState('idle');
    } catch (e) {
      console.error('Chat failed:', e);
      setAiState('error');
      setLastUserMessage(userMsg);
    } finally {
      setLoading(false);
    }
  };

  const send = async () => {
    if (!input.trim() || loading) return;

    // Check if we need to show email gate (after 3 messages if not authenticated and no email captured)
    if (!user && !capturedEmail && messages.length >= 3 && !showEmailGate) {
      setShowEmailGate(true);
      return;
    }

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    await sendMessage(userMsg);
  };

  const retry = async () => {
    if (lastUserMessage) {
      setAiState('thinking');
      setLoading(true);
      await sendMessage(lastUserMessage);
    }
  };

  const handlePromptSelect = (prompt: string) => {
    setInput(prompt);
  };

  const handleEmailCapture = (email: string) => {
    setCapturedEmail(email);
    setShowEmailGate(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: DS.bg, display: 'flex', flexDirection: 'column' }}>
      {showHeader && (
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: `1px solid ${DS.border}` }}>
          <span style={{ fontFamily: DS.headingFont, fontSize: '18px', fontWeight: 700, color: DS.text }}>LYC Intelligence</span>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <a href="/b2b" style={{ fontSize: '13px', color: DS.muted, textDecoration: 'none' }}>For Firms</a>
            <a href="/b2c" style={{ fontSize: '13px', color: DS.muted, textDecoration: 'none' }}>For Leaders</a>
            <a href="/match" style={{ fontSize: '13px', color: DS.muted, textDecoration: 'none' }}>TRIDENT Match</a>
          </div>
        </nav>
      )}

      <div style={{ flex: 1, maxWidth: '800px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', padding: '0 24px' }}>
        {showHeader && (
          <div style={{ textAlign: 'center', padding: '32px 0 20px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: `${DS.accent}15`, borderRadius: '20px', marginBottom: '12px' }}>
              <Zap style={{ width: 14, height: 14, color: DS.accent }} />
              <span style={{ fontSize: '12px', color: DS.accent, fontWeight: 600 }}>AI Assistant</span>
            </div>
            <h1 style={{ fontFamily: DS.headingFont, fontSize: '32px', fontWeight: 700, color: DS.text, margin: '0 0 4px' }}>Nexus AI</h1>
            <p style={{ fontSize: '14px', color: DS.muted }}>Powered by LYC Partners — Building Leadership That Works Across Borders</p>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: 'calc(100vh - 260px)', paddingTop: showEmailGate ? '12px' : 0 }}>
          {showEmailGate && !capturedEmail && (
            <EmailCapture onCapture={handleEmailCapture} />
          )}
          {messages.map((m, i) => (
            <MessageBubble key={i} role={m.role} content={m.content} />
          ))}
          {aiState === 'thinking' && (
            <div style={{ alignSelf: 'flex-start', padding: '12px 16px', background: DS.card, border: `1px solid ${DS.border}`, borderRadius: '12px 12px 12px 4px', color: DS.muted, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                  color: '#FFF',
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

        <SuggestedPrompts prompts={suggestedPrompts} onPromptSelect={handlePromptSelect} />

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Ask about LYC Partners, executive search, career strategy..."
            style={{
              flex: 1,
              padding: '14px 16px',
              background: DS.card,
              border: `1px solid ${DS.border}`,
              borderRadius: '8px',
              color: DS.text,
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            style={{
              padding: '14px 20px',
              background: DS.accent,
              color: '#FFF',
              border: 'none',
              borderRadius: '8px',
              cursor: (loading || !input.trim()) ? 'not-allowed' : 'pointer',
              opacity: (loading || !input.trim()) ? 0.5 : 1,
              minHeight: '44px'
            }}
          >
            <ArrowRight style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', marginBottom: '20px' }}>
          <Shield style={{ width: 12, height: 12, color: DS.muted }} />
          <span style={{ fontSize: '11px', color: DS.muted }}>Your conversation is confidential. Powered by LYC Intelligence.</span>
        </div>
      </div>
    </div>
  );
}
