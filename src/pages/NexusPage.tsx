import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Send, Loader2, MessageSquare, Trash2 } from 'lucide-react';
import { sendChatMessage } from '@/services/coze';
import { useAuthStore } from '@/stores/authStore';
import { logActivity } from '@/utils/activityLogger';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MinimalFooter } from '@/components/MinimalFooter';
import { COLORS, TYPOGRAPHY, RADII } from '@/styles/tokens';

interface Message { role: 'user' | 'assistant'; content: string; }

const CUSTOM_DS = {
  bgDark: '#0d0a14',
  bgCard: '#1a1225',
  bgInput: '#251a30',
  border: '#3a2040',
  textSecondary: '#E0E0E0',
  muted: '#9CA3AF',
  shadow: '0 1px 3px rgba(0,0,0,0.3)',
};

const SUGGESTED_PROMPTS = [
  'How do I position myself for a China-to-global leadership role?',
  'What do Asian boards look for in C-suite candidates?',
  'How should I navigate a cross-border executive transition?',
  'What makes a strong China-APAC leadership profile?',
];

const MANDATE_OPTIONS = [
  { id: 'm-001', title: 'CTO — Tencent' },
  { id: 'm-002', title: 'Head of IB — CICC' },
  { id: 'm-003', title: 'VP Engineering — Sea Limited' },
  { id: 'm-004', title: 'CFO — Ant Group' },
];

const customComponents = {
  table: ({ children }: any) => (
    <div style={{ overflowX: 'auto', margin: '12px 0' }}>
      <table style={{ minWidth: '100%', borderCollapse: 'collapse', border: `1px solid ${CUSTOM_DS.border}`, borderRadius: `${RADII.none}px`, overflow: 'hidden' }}>
        {children}
      </table>
    </div>
  ),
  th: ({ children }: any) => (
    <th style={{ border: `1px solid ${CUSTOM_DS.border}`, background: CUSTOM_DS.bgInput, padding: '12px 16px', fontWeight: 700, color: COLORS.white, textAlign: 'left', fontFamily: TYPOGRAPHY.fontFamily.sans }}>
      {children}
    </th>
  ),
  td: ({ children }: any) => (
    <td style={{ border: `1px solid ${CUSTOM_DS.border}`, padding: '12px 16px', color: CUSTOM_DS.textSecondary, fontFamily: TYPOGRAPHY.fontFamily.sans }}>
      {children}
    </td>
  ),
  tr: ({ children }: any) => (
    <tr>{children}</tr>
  ),
  code: ({ inline, className, children, ...props }: any) => {
    if (inline) return <code style={{ background: CUSTOM_DS.bgInput, borderRadius: `${RADII.none}px`, padding: '2px 6px', fontSize: '12px', color: COLORS.primary, fontFamily: 'monospace' }} {...props}>{children}</code>;
    return (
      <pre style={{ background: CUSTOM_DS.bgInput, borderRadius: `${RADII.none}px`, padding: '12px', overflowX: 'auto', margin: '8px 0', fontSize: '12px', fontFamily: 'monospace' }}>
        <code className={className} {...props}>{children}</code>
      </pre>
    );
  },
  ul: ({ children }: any) => <ul style={{ listStyleType: 'disc', paddingLeft: '24px', color: CUSTOM_DS.textSecondary, margin: '8px 0', fontFamily: TYPOGRAPHY.fontFamily.sans }}>{children}</ul>,
  ol: ({ children }: any) => <ol style={{ listStyleType: 'decimal', paddingLeft: '24px', color: CUSTOM_DS.textSecondary, margin: '8px 0', fontFamily: TYPOGRAPHY.fontFamily.sans }}>{children}</ol>,
  li: ({ children }: any) => <li style={{ color: CUSTOM_DS.textSecondary, fontFamily: TYPOGRAPHY.fontFamily.sans }}>{children}</li>,
  a: ({ href, children }: any) => <a href={href} style={{ color: COLORS.primary, textDecoration: 'underline' }} target="_blank" rel="noopener noreferrer">{children}</a>,
  p: ({ children }: any) => <p style={{ color: CUSTOM_DS.textSecondary, marginBottom: '8px', fontFamily: TYPOGRAPHY.fontFamily.sans, fontSize: '14px', lineHeight: 1.6 }}>{children}</p>,
  h1: ({ children }: any) => <h1 style={{ fontFamily: TYPOGRAPHY.fontFamily.serif, fontSize: '20px', fontWeight: 700, color: COLORS.white, marginBottom: '8px', marginTop: '12px' }}>{children}</h1>,
  h2: ({ children }: any) => <h2 style={{ fontFamily: TYPOGRAPHY.fontFamily.serif, fontSize: '18px', fontWeight: 700, color: COLORS.white, marginBottom: '8px', marginTop: '12px' }}>{children}</h2>,
  h3: ({ children }: any) => <h3 style={{ fontFamily: TYPOGRAPHY.fontFamily.serif, fontSize: '16px', fontWeight: 600, color: COLORS.white, marginBottom: '4px', marginTop: '8px' }}>{children}</h3>,
  strong: ({ children }: any) => <strong style={{ fontWeight: 600, color: COLORS.white, fontFamily: TYPOGRAPHY.fontFamily.sans }}>{children}</strong>,
  em: ({ children }: any) => <em style={{ fontStyle: 'italic', color: CUSTOM_DS.textSecondary, fontFamily: TYPOGRAPHY.fontFamily.sans }}>{children}</em>,
};

export function NexusPage() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedMandateId, setSelectedMandateId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    // Prepend a hidden mandate context block to the outgoing message when a
    // mandate is selected, so downstream services can attribute the query.
    const selectedMandate = selectedMandateId
      ? MANDATE_OPTIONS.find(m => m.id === selectedMandateId)
      : null;
    let outgoing = userMsg;
    if (selectedMandate) {
      const contextBlock = JSON.stringify({
        mandate_context: { id: selectedMandate.id, title: selectedMandate.title },
      });
      outgoing = `${contextBlock}\n${userMsg}`;
    }

    const response = await sendChatMessage(outgoing, user?.id || 'anonymous', messages.slice(-10));
    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setLoading(false);

    logActivity({
      type: 'nexus_chat',
      summary: userMsg.length > 80 ? `${userMsg.slice(0, 80)}…` : userMsg,
      ...(selectedMandate
        ? {
            entity_type: 'mandate',
            entity_id: selectedMandate.id,
            metadata: { mandate_context: { id: selectedMandate.id, title: selectedMandate.title } },
          }
        : {}),
    });
  };

  const clearChat = () => setMessages([]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  return (
    <div style={{ minHeight: '100vh', background: CUSTOM_DS.bgDark, display: 'flex', flexDirection: 'column' }}>
      <div style={{ maxWidth: '900px', width: '100%', margin: '0 auto', padding: '24px 24px 0' }}>
        <Link to="/" style={{ fontSize: '13px', color: CUSTOM_DS.muted, textDecoration: 'none', display: 'inline-block', marginBottom: '24px', fontFamily: TYPOGRAPHY.fontFamily.sans }}>← Back to home</Link>
      </div>

      <main style={{ maxWidth: '900px', width: '100%', margin: '0 auto', padding: '0 24px 32px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontFamily: TYPOGRAPHY.fontFamily.sans, fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2.5px', color: COLORS.primary, marginBottom: '8px' }}>
              LYC INTELLIGENCE
            </div>
            <h1 style={{ fontFamily: TYPOGRAPHY.fontFamily.serif, fontSize: '28px', fontWeight: 700, color: COLORS.white, margin: '0 0 8px' }}>
              Nexus
            </h1>
            <p style={{ fontFamily: TYPOGRAPHY.fontFamily.sans, fontSize: '15px', color: CUSTOM_DS.textSecondary, margin: '0 0 6px' }}>
              Your cross-border leadership advisor
            </p>
            <p style={{ fontFamily: TYPOGRAPHY.fontFamily.sans, fontSize: '13px', color: CUSTOM_DS.muted, margin: 0, maxWidth: '600px', lineHeight: 1.5 }}>
              Trained on LYC's China-APAC leadership intelligence. Ask about positioning, board readiness, or cross-cultural strategy.
            </p>
          </div>
          {messages.length > 0 && (
            <button onClick={clearChat} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: 'transparent', border: `1px solid ${CUSTOM_DS.border}`, borderRadius: `${RADII.none}px`, color: CUSTOM_DS.muted, fontFamily: TYPOGRAPHY.fontFamily.sans, fontSize: '13px', cursor: 'pointer', minHeight: '44px' }}>
              <Trash2 style={{ width: 14, height: 14 }} /> Clear
            </button>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', background: CUSTOM_DS.bgCard, border: `1px solid ${CUSTOM_DS.border}`, borderRadius: `${RADII.none}px`, padding: '24px', minHeight: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.length === 0 && (
            <div style={{ color: CUSTOM_DS.muted, textAlign: 'center', padding: '48px 16px' }}>
              <MessageSquare style={{ width: 32, height: 32, margin: '0 auto 12px', opacity: 0.5, color: CUSTOM_DS.muted }} />
              <p style={{ fontFamily: TYPOGRAPHY.fontFamily.serif, fontSize: '16px', fontWeight: 600, color: CUSTOM_DS.textSecondary, margin: '0 0 24px' }}>Nexus is ready</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', maxWidth: '640px', margin: '0 auto' }}>
                {SUGGESTED_PROMPTS.map(q => (
                  <button
                    key={q}
                    onClick={() => { setInput(q); }}
                    style={{
                      padding: '14px 16px',
                      background: CUSTOM_DS.bgInput,
                      border: `1px solid ${CUSTOM_DS.border}`,
                      borderRadius: `${RADII.none}px`,
                      color: CUSTOM_DS.textSecondary,
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontFamily: TYPOGRAPHY.fontFamily.sans,
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
                  background: m.role === 'user' ? COLORS.primary : CUSTOM_DS.bgInput,
                  border: m.role === 'user' ? 'none' : `1px solid ${CUSTOM_DS.border}`,
                  borderRadius: `${RADII.none}px`,
                  color: m.role === 'user' ? '#FFFFFF' : COLORS.white,
                  fontFamily: TYPOGRAPHY.fontFamily.sans,
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
              <div style={{ padding: '12px 16px', background: CUSTOM_DS.bgInput, border: `1px solid ${CUSTOM_DS.border}`, borderRadius: `${RADII.none}px`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Loader2 style={{ width: 16, height: 16, color: COLORS.primary, animation: 'spin 1s linear infinite' }} />
                <span style={{ fontFamily: TYPOGRAPHY.fontFamily.sans, fontSize: '13px', color: CUSTOM_DS.muted }}>Thinking...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div style={{ marginTop: '16px' }}>
          {/* Mandate context selector */}
          <div style={{ marginBottom: '8px' }}>
            <select
              value={selectedMandateId || ''}
              onChange={e => setSelectedMandateId(e.target.value || null)}
              aria-label="Mandate context"
              style={{
                padding: '10px 14px',
                background: CUSTOM_DS.bgInput,
                border: `1px solid ${CUSTOM_DS.border}`,
                borderRadius: `${RADII.none}px`,
                color: COLORS.white,
                fontFamily: TYPOGRAPHY.fontFamily.sans,
                fontSize: '13px',
                outline: 'none',
                minHeight: '44px',
                cursor: 'pointer',
                maxWidth: '100%',
              }}
            >
              <option value="">No mandate context</option>
              {MANDATE_OPTIONS.map(m => (
                <option key={m.id} value={m.id}>{m.title}</option>
              ))}
            </select>
          </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Ask Nexus about career positioning, cross-border leadership..."
            style={{
              flex: 1,
              padding: '14px 16px',
              background: CUSTOM_DS.bgInput,
              border: `1px solid ${CUSTOM_DS.border}`,
              borderRadius: `${RADII.none}px`,
              color: COLORS.white,
              fontFamily: TYPOGRAPHY.fontFamily.sans,
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
              background: COLORS.primary,
              color: '#FFFFFF',
              border: 'none',
              borderRadius: `${RADII.none}px`,
              fontFamily: TYPOGRAPHY.fontFamily.sans,
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
        </div>
      </main>

      <MinimalFooter />

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
