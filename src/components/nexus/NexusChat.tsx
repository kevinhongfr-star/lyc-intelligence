import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowRight, Zap, Shield, Loader2, RefreshCw, Paperclip } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { MessageBubble } from './MessageBubble';
import { SuggestedPrompts } from './SuggestedPrompts';
import { EmailCapture } from './EmailCapture';
import { useSearchParams } from 'react-router-dom';

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
}

interface NexusChatProps {
  showHeader?: boolean;
  initialPrompts?: string[];
}

export function NexusChat({ showHeader = true, initialPrompts }: NexusChatProps) {
  const { user, profile } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [autoSend, setAutoSend] = useState<string | null>(null);
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
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [showEmailGate, setShowEmailGate] = useState(false);
  const [capturedEmail, setCapturedEmail] = useState<string | null>(null);
  const [documentContext, setDocumentContext] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showEmailGate]);

  // Phase 6.2 — Read assessment context from URL params
  useEffect(() => {
    const context = searchParams.get('context');
    const gap = searchParams.get('gap');
    const score = searchParams.get('score');
    const archetypeParam = searchParams.get('archetype');

    if (context === 'assessment' && archetypeParam) {
      const contextMessage = gap
        ? `I just completed the Career Positioning Diagnostic. My archetype is **${archetypeParam}**. My lowest dimension is **${gap}** at ${score}/100. I'd like help building a 90-day development plan focused on this.`
        : `I just completed the Career Positioning Diagnostic. My archetype is **${archetypeParam}** with a composite score of ${score}/100. Help me understand my results and plan next steps.`;
      setMessages(prev => [...prev, { role: 'user' as const, content: contextMessage }]);
      setAutoSend(contextMessage);
    }
  }, []);

  // Auto-send when context is loaded
  useEffect(() => {
    if (autoSend) {
      sendMessage(autoSend);
      setAutoSend(null);
    }
  }, [autoSend]);

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
          documentContext,
          memoryContext: [],
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

  const handleDocumentUpload = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.docx,.txt';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds 10MB limit');
        return;
      }

      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'document');
      
      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        if (data.text) {
          setDocumentContext(data.text);
          setMessages(prev => [...prev, {
            role: 'user',
            content: `I've uploaded a document: ${file.name}. Please analyze it and help me understand its content.`
          }]);
          await sendMessage(`Please analyze this document: ${file.name}`);
        }
      } catch (error) {
        console.error('Upload failed:', error);
        alert('Failed to upload document');
      } finally {
        setUploading(false);
      }
    };
    input.click();
  }, [sendMessage]);

  const handlePromptSelect = (prompt: string) => {
    setInput(prompt);
  };

  const handleEmailCapture = (email: string) => {
    setCapturedEmail(email);
    setShowEmailGate(false);
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'assistant' as const,
      content: "Got it — I've saved your details. I'll send you a summary of what we've discussed.\n\nNow, where were we?"
    }]);
  };

  return (
    <div style={{ minHeight: '100vh', background: DS.bg, display: 'flex', flexDirection: 'column' }}>
      {showHeader && (
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: `1px solid ${DS.border}` }}>
          <span style={{ fontFamily: DS.headingFont, fontSize: '18px', fontWeight: 700, color: DS.text }}>LYC Intelligence</span>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
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
              <Zap style={{ width: 14, height: 14, color: DS.accent }} />
              <span style={{ fontSize: '12px', color: DS.accent, fontWeight: 600 }}>AI Assistant</span>
            </div>
            <h1 style={{ fontFamily: DS.headingFont, fontSize: '32px', fontWeight: 700, color: DS.text, margin: '0 0 4px' }}>Nexus AI</h1>
            <p style={{ fontSize: '14px', color: DS.muted }}>Powered by LYC Partners — Building Leadership That Works Across Borders</p>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: 'calc(100vh - 260px)', paddingTop: showEmailGate ? '12px' : 0 }}>
          {messages.map((m, i) => (
            <MessageBubble key={i} role={m.role} content={m.content} />
          ))}
          {showEmailGate && !capturedEmail && (
            <div style={{ alignSelf: 'flex-start', maxWidth: '80%' }}>
              <EmailCapture onCapture={handleEmailCapture} />
            </div>
          )}
          {aiState === 'thinking' && (
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
              border: `1px solid ${DS.cardBorder}`,
              borderRadius: '8px',
              color: DS.text,
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <button
            onClick={handleDocumentUpload}
            disabled={uploading}
            style={{
              padding: '14px',
              background: DS.card,
              border: `1px solid ${DS.cardBorder}`,
              borderRadius: '8px',
              cursor: uploading ? 'not-allowed' : 'pointer',
              opacity: uploading ? 0.5 : 1,
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {uploading ? (
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
