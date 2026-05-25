import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, Zap, Shield, Loader2, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const DS = { headingFont: 'Georgia, serif', accent: '#C108AB', bg: '#0A0A0A', card: '#111111', muted: '#888888', text: '#FFFFFF', textSecondary: '#CCCCCC', border: '#222222', radius: '12px' };

const customComponents = {
  table: ({ children }: any) => (
    <div className="overflow-x-auto my-3">
      <table className="min-w-full border-collapse border border-gray-700 rounded-lg overflow-hidden">
        {children}
      </table>
    </div>
  ),
  th: ({ children }: any) => (
    <th className="border border-gray-600 bg-gray-800 px-4 py-3 font-bold text-gray-200 text-left">
      {children}
    </th>
  ),
  td: ({ children }: any) => (
    <td className="border border-gray-600 px-4 py-3 text-gray-300">
      {children}
    </td>
  ),
  tr: ({ children }: any) => (
    <tr className="even:bg-gray-900 odd:bg-gray-800">
      {children}
    </tr>
  ),
  code: ({ inline, className, children, ...props }: any) => {
    if (inline) return <code className="bg-gray-800 rounded px-1.5 py-0.5 text-sm text-accent" {...props}>{children}</code>;
    return (
      <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto my-3">
        <code className={className} {...props}>{children}</code>
      </pre>
    );
  },
  ul: ({ children }: any) => <ul className="list-disc pl-6 space-y-1 text-gray-300 my-2">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-6 space-y-1 text-gray-300 my-2">{children}</ol>,
  li: ({ children }: any) => <li className="text-gray-300">{children}</li>,
  a: ({ href, children }: any) => <a href={href} className="text-accent underline hover:text-purple-400" target="_blank" rel="noopener noreferrer">{children}</a>,
  p: ({ children }: any) => <p className="text-gray-300 mb-3 last:mb-0">{children}</p>,
  h1: ({ children }: any) => <h1 className="text-xl font-bold text-white mb-3 mt-4">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-lg font-bold text-white mb-2 mt-3">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-base font-semibold text-white mb-2 mt-2">{children}</h3>,
  h4: ({ children }: any) => <h4 className="text-sm font-semibold text-gray-200 mb-1 mt-2">{children}</h4>,
  strong: ({ children }: any) => <strong className="font-semibold text-white">{children}</strong>,
  em: ({ children }: any) => <em className="italic text-gray-300">{children}</em>,
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-4 border-accent pl-4 my-3 italic text-gray-400">
      {children}
    </blockquote>
  ),
};

export function NexusLanding() {
  const [messages, setMessages] = useState<Array<{role: string; content: string}>>([
    { role: 'assistant', content: "Hi! I'm **Nexus**, LYC Partners' AI assistant. I can help you with:\n\n- **Executive Search** — How we find cross-border leaders\n- **TRIDENT Matching** — How our AI-powered JD↔CV matching works\n- **Career Strategy** — Guidance for senior leaders navigating international careers\n- **Leadership Advisory** — Our D3 Framework: Diagnose · Design · Deliver\n\nWhat would you like to know?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiState, setAiState] = useState<'idle'|'thinking'|'error'>('idle');
  const [lastUserMessage, setLastUserMessage] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [showEmailGate, setShowEmailGate] = useState(false);
  const [email, setEmail] = useState('');
  const [capturedEmail, setCapturedEmail] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, showEmailGate]);

  const handleEmailSubmit = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setCapturing(true);
    try {
      // Use API endpoint for lead capture
      await fetch('/api/lead-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'nexus_chat' })
      });
      setCapturedEmail(email);
      setShowEmailGate(false);
    } catch (e) {
      console.error('Failed to capture lead:', e);
    } finally {
      setCapturing(false);
    }
  };

  const sendMessage = async (userMsg: string) => {
    setAiState('thinking');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMsg, 
          userId: 'nexus-visitor', 
          history: messages.slice(-10)
        })
      });
      if (!res.ok) throw new Error('API failed');
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
        setAiState('idle');
      } else {
        throw new Error(data.error);
      }
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
    
    // Check if we need to show email gate (after 3 messages)
    if (!capturedEmail && messages.length >= 3 && !showEmailGate) {
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

  return (
    <div style={{ minHeight: '100vh', background: DS.bg, display: 'flex', flexDirection: 'column' }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: `1px solid ${DS.border}` }}>
        <span style={{ fontFamily: DS.headingFont, fontSize: '18px', fontWeight: 700, color: DS.text }}>LYC Intelligence</span>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <a href="/b2b" style={{ fontSize: '13px', color: DS.muted, textDecoration: 'none' }}>For Firms</a>
          <a href="/b2c" style={{ fontSize: '13px', color: DS.muted, textDecoration: 'none' }}>For Leaders</a>
          <a href="/match" style={{ fontSize: '13px', color: DS.muted, textDecoration: 'none' }}>TRIDENT Match</a>
        </div>
      </nav>

      <div style={{ flex: 1, maxWidth: '800px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', padding: '32px 0 20px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: `${DS.accent}15`, borderRadius: '20px', marginBottom: '12px' }}>
            <Zap style={{ width: 14, height: 14, color: DS.accent }} />
            <span style={{ fontSize: '12px', color: DS.accent, fontWeight: 600 }}>AI Assistant</span>
          </div>
          <h1 style={{ fontFamily: DS.headingFont, fontSize: '32px', fontWeight: 700, color: DS.text, margin: '0 0 4px' }}>Nexus AI</h1>
          <p style={{ fontSize: '14px', color: DS.muted }}>Powered by LYC Partners — Building Leadership That Works Across Borders</p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: 'calc(100vh - 260px)', paddingTop: showEmailGate ? '12px' : 0 }}>
          {showEmailGate && !capturedEmail && (
            <div style={{ alignSelf: 'center', width: '100%', maxWidth: '400px', background: DS.card, border: `1px solid ${DS.border}`, borderRadius: '12px', padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
              <h3 style={{ fontFamily: DS.headingFont, fontSize: '16px', fontWeight: 600, color: DS.text, marginBottom: '8px' }}>
                Save our conversation
              </h3>
              <p style={{ fontSize: '13px', color: DS.muted, marginBottom: '16px' }}>
                Enter your email to get your full leadership report and continue our chat.
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    background: DS.bg,
                    border: `1px solid ${DS.border}`,
                    borderRadius: '8px',
                    color: DS.text,
                    fontSize: '14px',
                    outline: 'none',
                    minHeight: '44px'
                  }}
                />
                <button
                  onClick={handleEmailSubmit}
                  disabled={capturing || !email}
                  style={{
                    padding: '12px 20px',
                    background: DS.accent,
                    color: '#FFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: (capturing || !email) ? 'not-allowed' : 'pointer',
                    opacity: (capturing || !email) ? 0.5 : 1,
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {capturing ? (
                    <>
                      <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
                      ...
                    </>
                  ) : (
                    'Continue'
                  )}
                </button>
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
              <div style={{
                padding: '12px 16px',
                borderRadius: m.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                background: m.role === 'user' ? DS.accent : DS.card,
                border: m.role === 'user' ? 'none' : `1px solid ${DS.border}`,
                color: m.role === 'user' ? '#FFF' : DS.textSecondary,
                fontSize: '14px',
                lineHeight: 1.6
              }}>
                {m.role === 'user' ? (
                  m.content
                ) : (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={customComponents}
                  >
                    {m.content}
                  </ReactMarkdown>
                )}
              </div>
            </div>
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

        <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
          {['What does LYC do?', 'How does TRIDENT matching work?', 'Tell me about the D3 Framework', 'What is The Council?'].map(q => (
            <button key={q} onClick={() => setInput(q)} style={{ padding: '6px 12px', background: DS.card, border: `1px solid ${DS.border}`, borderRadius: '14px', color: DS.textSecondary, fontSize: '11px', cursor: 'pointer' }}>{q}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Ask about LYC Partners, executive search, career strategy..." style={{ flex: 1, padding: '14px 16px', background: DS.card, border: `1px solid ${DS.border}`, borderRadius: '8px', color: DS.text, fontSize: '14px', outline: 'none' }} />
          <button onClick={send} disabled={loading || !input.trim()} style={{ padding: '14px 20px', background: DS.accent, color: '#FFF', border: 'none', borderRadius: '8px', cursor: 'pointer', opacity: (loading || !input.trim()) ? 0.5 : 1, minHeight: '44px' }}>
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
