import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, MessageSquare, Trash2 } from 'lucide-react';
import { sendChatMessage } from '@/services/coze';
import { useAuth } from '@/contexts';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link } from 'react-router-dom';
import { MinimalFooter } from '../components/MinimalFooter';

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

interface Message { role: 'user' | 'assistant'; content: string; }

const customComponents = {
  table: ({ children }: any) => (
    <div style={{ overflowX: 'auto', margin: '12px 0' }}>
      <table style={{ minWidth: '100%', borderCollapse: 'collapse', border: `1px solid ${DS.border}`, borderRadius: DS.radius, overflow: 'hidden' }}>
        {children}
      </table>
    </div>
  ),
  th: ({ children }: any) => (
    <th style={{ border: `1px solid ${DS.border}`, background: DS.bgInput, padding: '12px 16px', fontWeight: 600, color: DS.text, textAlign: 'left', fontFamily: DS.bodyFont, fontSize: '13px' }}>
      {children}
    </th>
  ),
  td: ({ children }: any) => (
    <td style={{ border: `1px solid ${DS.border}`, padding: '12px 16px', color: DS.textSecondary, fontFamily: DS.bodyFont, fontSize: '13px' }}>
      {children}
    </td>
  ),
  tr: ({ children }: any) => (
    <tr style={{ background: DS.bgCard }}>
      {children}
    </tr>
  ),
  code: ({ inline, className, children, ...props }: any) => {
    if (inline) return <code style={{ background: DS.bgInput, borderRadius: DS.radiusSm, padding: '2px 6px', fontSize: '12px', color: DS.accent, fontFamily: 'monospace' }} {...props}>{children}</code>;
    return (
      <pre style={{ background: DS.bgInput, borderRadius: DS.radius, padding: '16px', overflowX: 'auto', margin: '12px 0', fontSize: '12px' }}>
        <code style={{ fontFamily: 'monospace', color: DS.textSecondary }} {...props}>{children}</code>
      </pre>
    );
  },
  ul: ({ children }: any) => <ul style={{ listStyle: 'disc', paddingLeft: '24px', margin: '12px 0', color: DS.textSecondary }}>{children}</ul>,
  ol: ({ children }: any) => <ol style={{ listStyle: 'decimal', paddingLeft: '24px', margin: '12px 0', color: DS.textSecondary }}>{children}</ol>,
  li: ({ children }: any) => <li style={{ margin: '4px 0', color: DS.textSecondary }}>{children}</li>,
  a: ({ href, children }: any) => <a href={href} style={{ color: DS.accent, textDecoration: 'underline', hover: { color: DS.accentHover } }} target="_blank" rel="noopener noreferrer">{children}</a>,
  p: ({ children }: any) => <p style={{ color: DS.textSecondary, margin: '8px 0', lineHeight: 1.6 }}>{children}</p>,
  h1: ({ children }: any) => <h1 style={{ fontFamily: DS.headingFont, fontSize: '20px', fontWeight: 700, color: DS.text, margin: '16px 0 8px' }}>{children}</h1>,
  h2: ({ children }: any) => <h2 style={{ fontFamily: DS.headingFont, fontSize: '18px', fontWeight: 600, color: DS.text, margin: '14px 0 8px' }}>{children}</h2>,
  h3: ({ children }: any) => <h3 style={{ fontFamily: DS.headingFont, fontSize: '16px', fontWeight: 600, color: DS.textSecondary, margin: '12px 0 6px' }}>{children}</h3>,
  strong: ({ children }: any) => <strong style={{ fontWeight: 600, color: DS.text }}>{children}</strong>,
  em: ({ children }: any) => <em style={{ fontStyle: 'italic', color: DS.textSecondary }}>{children}</em>,
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

  const suggestedPrompts = [
    'How do I position myself for a China-to-global leadership role?',
    'What do Asian boards look for in C-suite candidates?',
    'How should I navigate a cross-border executive transition?',
    'What makes a strong China-APAC leadership profile?',
  ];

  return (
    <div style={{ minHeight: '100vh', background: DS.bgDark, display: 'flex', flexDirection: 'column' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 32px', flex: 1 }}>
        <Link to="/" style={{ fontSize: '13px', color: DS.muted, textDecoration: 'none', display: 'inline-block', marginBottom: '24px' }}>← Back to home</Link>
        
        {/* Branded Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2.5px', color: DS.accent, marginBottom: '8px' }}>
            LYC INTELLIGENCE
          </div>
          <h1 style={{ fontFamily: DS.headingFont, fontSize: '28px', fontWeight: 700, color: DS.text, margin: '0 0 8px' }}>
            Nexus
          </h1>
          <p style={{ fontFamily: DS.bodyFont, fontSize: '16px', color: DS.textSecondary, margin: '0 0 8px' }}>
            Your cross-border leadership advisor
          </p>
          <p style={{ fontFamily: DS.bodyFont, fontSize: '14px', color: DS.muted, margin: 0, lineHeight: 1.5 }}>
            Trained on LYC's China-APAC leadership intelligence. Ask about positioning, board readiness, or cross-cultural strategy.
          </p>
        </div>

        {/* Chat Area */}
        <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: DS.radius, padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '400px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <span style={{ fontFamily: DS.headingFont, fontSize: '16px', fontWeight: 600, color: DS.text }}>Chat</span>
            </div>
            {messages.length > 0 && (
              <button 
                onClick={clearChat} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  padding: '8px 16px', 
                  fontSize: '13px', 
                  color: DS.muted, 
                  background: DS.bgInput, 
                  border: `1px solid ${DS.border}`,
                  borderRadius: DS.radius,
                  cursor: 'pointer',
                  minHeight: '40px',
                }}
              >
                <Trash2 style={{ width: 14, height: 14 }} /> Clear
              </button>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.length === 0 && (
              <div style={{ color: DS.muted, textAlign: 'center', padding: '40px 20px' }}>
                <MessageSquare style={{ width: 32, height: 32, margin: '0 auto 16px', opacity: 0.5 }} />
                <p style={{ fontFamily: DS.bodyFont, fontSize: '15px', fontWeight: 500, color: DS.textSecondary, margin: '0 0 16px' }}>Nexus is ready</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', maxWidth: '500px', margin: '0 auto' }}>
                  {suggestedPrompts.map((q) => (
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
                        hover: { borderColor: DS.accent },
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
                <div style={{ 
                  maxWidth: '85%', 
                  borderRadius: DS.radius, 
                  padding: '16px', 
                  fontSize: '14px',
                  lineHeight: 1.6,
                  fontFamily: DS.bodyFont,
                }}
                >
                  {m.role === 'user' ? (
                    <div style={{ background: DS.accent, color: '#FFFFFF', borderRadius: DS.radius, padding: '16px' }}>
                      {m.content}
                    </div>
                  ) : (
                    <div style={{ background: DS.bgInput, border: `1px solid ${DS.border}`, borderRadius: DS.radius, padding: '16px' }}>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={customComponents}
                      >
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ background: DS.bgInput, border: `1px solid ${DS.border}`, borderRadius: DS.radius, padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite', color: DS.accent }} />
                  <span style={{ fontFamily: DS.bodyFont, fontSize: '14px', color: DS.muted }}>Thinking...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input Area */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Ask Nexus about career positioning, cross-border leadership..."
              style={{
                flex: 1,
                padding: '14px 16px',
                background: DS.bgInput,
                border: `1px solid ${DS.border}`,
                borderRadius: DS.radius,
                fontSize: '14px',
                color: DS.text,
                fontFamily: DS.bodyFont,
                placeholder: { color: DS.muted },
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
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !input.trim() ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '48px',
                minWidth: '48px',
              }}
            >
              <Send style={{ width: 18, height: 18 }} />
            </button>
          </div>
        </div>
      </div>

      <MinimalFooter />

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        input:focus {
          border-color: ${DS.accent} !important;
        }
        input::placeholder {
          color: ${DS.muted};
        }
      `}</style>
    </div>
  );
}