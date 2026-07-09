import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Send, Loader2, MessageSquare, Trash2 } from 'lucide-react';
import { sendChatMessage } from '@/services/coze';
import { useAuth } from '@/contexts';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MinimalFooter } from '@/components/MinimalFooter';

interface Message { role: 'user' | 'assistant'; content: string; }

const DS = {
  headingFont: "'Libre Baskerville', Georgia, serif",
  bodyFont: "'DM Sans', system-ui, sans-serif",
  accent: '#C108AB',
  accentHover: '#A00790',
  bgDark: '#0d0a14',
  bgCard: '#1a1225',
  bgInput: '#251a30',
  border: '#3a2040',
  text: '#FFFFFF',
  textSecondary: '#E0E0E0',
  muted: '#9CA3AF',
  radius: '0px',
  radiusSm: '0px',
  shadow: '0 1px 3px rgba(0,0,0,0.3)',
};

const SUGGESTED_PROMPTS = [
  'How do I position myself for a China-to-global leadership role?',
  'What do Asian boards look for in C-suite candidates?',
  'How should I navigate a cross-border executive transition?',
  'What makes a strong China-APAC leadership profile?',
];

const customComponents = {
  table: ({ children }: any) => (
    <div style={{ overflowX: 'auto', margin: '12px 0' }}>
      <table style={{ minWidth: '100%', borderCollapse: 'collapse', border: `1px solid ${DS.border}`, borderRadius: DS.radius, overflow: 'hidden' }}>
        {children}
      </table>
    </div>
  ),
  th: ({ children }: any) => (
    <th style={{ border: `1px solid ${DS.border}`, background: DS.bgInput, padding: '12px 16px', fontWeight: 700, color: DS.text, textAlign: 'left', fontFamily: DS.bodyFont }}>
      {children}
    </th>
  ),
  td: ({ children }: any) => (
    <td style={{ border: `1px solid ${DS.border}`, padding: '12px 16px', color: DS.textSecondary, fontFamily: DS.bodyFont }}>
      {children}
    </td>
  ),
  tr: ({ children }: any) => (
    <tr>{children}</tr>
  ),
  code: ({ inline, className, children, ...props }: any) => {
    if (inline) return <code style={{ background: DS.bgInput, borderRadius: DS.radius, padding: '2px 6px', fontSize: '12px', color: DS.accent, fontFamily: 'monospace' }} {...props}>{children}</code>;
    return (
      <pre style={{ background: DS.bgInput, borderRadius: DS.radius, padding: '12px', overflowX: 'auto', margin: '8px 0', fontSize: '12px', fontFamily: 'monospace' }}>
        <code className={className} {...props}>{children}</code>
      </pre>
    );
  },
  ul: ({ children }: any) => <ul style={{ listStyleType: 'disc', paddingLeft: '24px', color: DS.textSecondary, margin: '8px 0', fontFamily: DS.bodyFont }}>{children}</ul>,
  ol: ({ children }: any) => <ol style={{ listStyleType: 'decimal', paddingLeft: '24px', color: DS.textSecondary, margin: '8px 0', fontFamily: DS.bodyFont }}>{children}</ol>,
  li: ({ children }: any) => <li style={{ color: DS.textSecondary, fontFamily: DS.bodyFont }}>{children}</li>,
  a: ({ href, children }: any) => <a href={href} style={{ color: DS.accent, textDecoration: 'underline' }} target="_blank" rel="noopener noreferrer">{children}</a>,
  p: ({ children }: any) => <p style={{ color: DS.textSecondary, marginBottom: '8px', fontFamily: DS.bodyFont, fontSize: '14px', lineHeight: 1.6 }}>{children}</p>,
  h1: ({ children }: any) => <h1 style={{ fontFamily: DS.headingFont, fontSize: '20px', fontWeight: 700, color: DS.text, marginBottom: '8px', marginTop: '12px' }}>{children}</h1>,
  h2: ({ children }: any) => <h2 style={{ fontFamily: DS.headingFont, fontSize: '18px', fontWeight: 700, color: DS.text, marginBottom: '8px', marginTop: '12px' }}>{children}</h2>,
  h3: ({ children }: any) => <h3 style={{ fontFamily: DS.headingFont, fontSize: '16px', fontWeight: 600, color: DS.text, marginBottom: '4px', marginTop: '8px' }}>{children}</h3>,
  strong: ({ children }: any) => <strong style={{ fontWeight: 600, color: DS.text, fontFamily: DS.bodyFont }}>{children}</strong>,
  em: ({ children }: any) => <em style={{ fontStyle: 'italic', color: DS.textSecondary, fontFamily: DS.bodyFont }}>{children}</em>,
};

export function NexusPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    const response = await sendChatMessage(userMsg, user?.id || 'anonymous', messages.slice(-10));
    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setLoading(false);
  };

  const clearChat = () => setMessages([]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  return (
    <div style={{ minHeight: '100vh', background: DS.bgDark, display: 'flex', flexDirection: 'column' }}>
      <div style={{ maxWidth: '900px', width: '100%', margin: '0 auto', padding: '24px 24px 0' }}>
        <Link to="/" style={{ fontSize: '13px', color: DS.muted, textDecoration: 'none', display: 'inline-block', marginBottom: '24px', fontFamily: DS.bodyFont }}>← Back to home</Link>
      </div>

      <main style={{ maxWidth: '900px', width: '100%', margin: '0 auto', padding: '0 24px 32px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontFamily: DS.bodyFont, fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2.5px', color: DS.accent, marginBottom: '8px' }}>
              LYC INTELLIGENCE
            </div>
            <h1 style={{ fontFamily: DS.headingFont, fontSize: '28px', fontWeight: 700, color: DS.text, margin: '0 0 8px' }}>
              Nexus
            </h1>
            <p style={{ fontFamily: DS.bodyFont, fontSize: '15px', color: DS.textSecondary, margin: '0 0 6px' }}>
              Your cross-border leadership advisor
            </p>
            <p style={{ fontFamily: DS.bodyFont, fontSize: '13px', color: DS.muted, margin: 0, maxWidth: '600px', lineHeight: 1.5 }}>
              Trained on LYC's China-APAC leadership intelligence. Ask about positioning, board readiness, or cross-cultural strategy.
            </p>
          </div>
          {messages.length > 0 && (
            <button onClick={clearChat} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: 'transparent', border: `1px solid ${DS.border}`, borderRadius: DS.radius, color: DS.muted, fontFamily: DS.bodyFont, fontSize: '13px', cursor: 'pointer', minHeight: '44px' }}>
              <Trash2 style={{ width: 14, height: 14 }} /> Clear
            </button>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: DS.radius, padding: '24px', minHeight: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.length === 0 && (
            <div style={{ color: DS.muted, textAlign: 'center', padding: '48px 16px' }}>
              <MessageSquare style={{ width: 32, height: 32, margin: '0 auto 12px', opacity: 0.5, color: DS.muted }} />
              <p style={{ fontFamily: DS.headingFont, fontSize: '16px', fontWeight: 600, color: DS.textSecondary, margin: '0 0 24px' }}>Nexus is ready</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', maxWidth: '640px', margin: '0 auto' }}>
                {SUGGESTED_PROMPTS.map(q => (
                  <button
                    key={q}
                    onClick={() => { setInput(q); }}
                    style={{
                      padding: '14px 16px',
                      background: DS.bgInput,
                      border: `1px solid ${DS.border}`,
                      borderRadius: DS.radius,
                      color: DS.textSecondary,
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontFamily: DS.bodyFont,
                      fontSize: '13px',
                      lineHeight: 1.5,
                      minHeight: '44px',
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div
                style={{
                  maxWidth: '85%',
                  padding: '12px 16px',
                  background: m.role === 'user' ? DS.accent : DS.bgInput,
                  border: m.role === 'user' ? 'none' : `1px solid ${DS.border}`,
                  borderRadius: DS.radius,
                  color: m.role === 'user' ? '#FFFFFF' : DS.text,
                  fontFamily: DS.bodyFont,
                  fontSize: '14px',
                  lineHeight: 1.6,
                }}
              >
                {m.role === 'assistant' ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={customComponents}
                  >
                    {m.content}
                  </ReactMarkdown>
                ) : m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ padding: '12px 16px', background: DS.bgInput, border: `1px solid ${DS.border}`, borderRadius: DS.radius, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Loader2 style={{ width: 16, height: 16, color: DS.accent, animation: 'spin 1s linear infinite' }} />
                <span style={{ fontFamily: DS.bodyFont, fontSize: '13px', color: DS.muted }}>Thinking...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Ask Nexus about career positioning, cross-border leadership..."
            style={{
              flex: 1,
              padding: '14px 16px',
              background: DS.bgInput,
              border: `1px solid ${DS.border}`,
              borderRadius: DS.radius,
              color: DS.text,
              fontFamily: DS.bodyFont,
              fontSize: '14px',
              outline: 'none',
              minHeight: '48px',
            }}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            style={{
              padding: '14px 20px',
              background: DS.accent,
              color: '#FFFFFF',
              border: 'none',
              borderRadius: DS.radius,
              fontFamily: DS.bodyFont,
              fontSize: '14px',
              fontWeight: 600,
              cursor: (loading || !input.trim()) ? 'not-allowed' : 'pointer',
              opacity: (loading || !input.trim()) ? 0.5 : 1,
              minHeight: '48px',
              minWidth: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Send style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </main>

      <MinimalFooter />

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
