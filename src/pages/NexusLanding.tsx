import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, Zap, Shield } from 'lucide-react';
import { sendChatMessage } from '@/services/coze';

const DS = { headingFont: 'Georgia, serif', accent: '#C108AB', bg: '#0A0A0A', card: '#111111', muted: '#888888', text: '#FFFFFF', textSecondary: '#CCCCCC', border: '#222222', radius: '12px' };

function renderMd(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/```([\s\S]*?)```/g, '<pre style="background:#0A0A0A;padding:8px;border-radius:6px;overflow-x:auto;font-size:12px;margin:6px 0">$1</pre>')
    .replace(/`([^`]+)`/g, '<code style="background:#0A0A0A;padding:2px 6px;border-radius:4px;font-size:12px;color:#C108AB">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h4 style="font-size:14px;font-weight:600;color:#FFF;margin:8px 0 4px">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 style="font-size:15px;font-weight:600;color:#FFF;margin:8px 0 4px">$1</h3>')
    .replace(/^# (.+)$/gm, '<h2 style="font-size:16px;font-weight:600;color:#FFF;margin:8px 0 4px">$1</h2>')
    .replace(/^- (.+)$/gm, '<div style="padding-left:12px;margin:2px 0;color:#CCC">• $1</div>')
    .replace(/^\d+\. (.+)$/gm, '<div style="padding-left:12px;margin:2px 0;color:#CCC">$1</div>')
    .replace(/\|(.+)\|/g, (match) => {
      const cells = match.split('|').filter(c => c.trim());
      if (cells.every(c => /^[\s-]+$/.test(c))) return '';
      return '<div style="display:flex;gap:8px;padding:2px 0">' + cells.map(c => `<span style="flex:1;font-size:12px;color:#CCC">${c.trim()}</span>`).join('') + '</div>';
    })
    .replace(/\n/g, '<br/>');
}

export function NexusLanding() {
  const [messages, setMessages] = useState<Array<{role: string; content: string}>>([
    { role: 'assistant', content: "Hi! I'm **Nexus**, LYC Partners' AI assistant. I can help you with:\n\n- **Executive Search** — How we find cross-border leaders\n- **TRIDENT Matching** — How our AI-powered JD↔CV matching works\n- **Career Strategy** — Guidance for senior leaders navigating international careers\n- **Leadership Advisory** — Our D3 Framework: Diagnose · Design · Deliver\n\nWhat would you like to know?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    const reply = await sendChatMessage(userMsg, 'nexus-visitor', messages.slice(-10));
    setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    setLoading(false);
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

        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: 'calc(100vh - 260px)' }}>
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
              }} dangerouslySetInnerHTML={{ __html: m.role === 'user' ? m.content : renderMd(m.content) }} />
            </div>
          ))}
          {loading && (
            <div style={{ alignSelf: 'flex-start', padding: '12px 16px', background: DS.card, border: `1px solid ${DS.border}`, borderRadius: '12px 12px 12px 4px', color: DS.muted, fontSize: '14px' }}>Thinking...</div>
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
