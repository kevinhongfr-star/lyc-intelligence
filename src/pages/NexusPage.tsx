/**
 * NEXUSPage — V2 VISUAL REWORK (V1 foundation)
 *
 * 3-column app shell (V1 line-art system):
 *   LEFT  (220)  — Workspace / Depth / Human Layer nav groups
 *                  First-session (Day 1): "Getting started" checklist instead
 *   MAIN        — chat: welcome block, message flow, lens activation card,
 *                  milestone inline badge, option chips, input bar
 *   RIGHT (280) — context panel: active lens, what we're working on,
 *                  what we've learned, thinking style, privacy note
 *                  First-session: progress checklist
 *
 * Chat logic (send / retry / system prompt / guest limit / query params) is
 * preserved verbatim — this is a visual re-skin, not a backend change.
 *
 * Naming rules (enforced):
 *  - "NEXUS" always by name — never "the AI" / "the coach"
 *  - "Lenses" not "Assessments" / "Diagnostics"
 *  - No "Platform" / "Architecture" anywhere.
 *  - Lens activation = coach-recommended opt-in, NOT auto-activate.
 *  - Miles are a UI unit, never marketed.
 */
import React, { useState, useRef, useEffect, useMemo } from 'react';
// FIX 7 — no icon library. Typographic symbols only (→, ✓, ◆, ↻, etc.).
import { sendChatMessage } from '@/services/coze';
import { useAuthStore } from '@/stores/authStore';
import { SEO } from '@/components/seo/SEO';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { trackCTA, trackNexusFirstMessageSent, trackNexusChatInitiation } from '@/analytics/eventTracker';
import { reportError } from '@/analytics/errorMonitor';
import { buildNexusSystemPrompt, buildNexusFirstResponse, NEXUS_FIRST_RESPONSE_QUICK_REPLIES } from '@/nexus/nexusKnowledge';
import { buildLocalAssessmentContextForNexus, getAssessmentProgress, recommendNextAssessment } from '@/nexus/resultContextBuilder';
import { ASSESSMENT_CATALOG } from '@/assessments/catalog';
import { V1 } from '@/styles/v1-tokens';

// ── V1 motion tokens ──
const EASE_OUT = V1.ease;
const REVEAL_MS = V1.durNormal;

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
  promptText?: string;
}

const GUEST_MESSAGE_LIMIT = 3;
const GUEST_STORAGE_KEY = 'nexus_guest_messages';

const QUICK_REPLIES = NEXUS_FIRST_RESPONSE_QUICK_REPLIES;

/* ── Markdown components tuned for V1 light chat ── */
const customComponents = {
  a: ({ href, children }: any) => (
    <a href={href} style={{ color: V1.teal700, textDecoration: 'underline' }} target="_blank" rel="noopener noreferrer">{children}</a>
  ),
  p: ({ children }: any) => <p style={{ margin: '0 0 10px', lineHeight: V1.leadingBody, color: V1.text, fontFamily: V1.bodyFont, fontSize: V1.textBody }}>{children}</p>,
  h1: ({ children }: any) => <h1 style={{ fontFamily: V1.displayFont, color: V1.text, fontSize: V1.textH3, margin: '4px 0 10px', lineHeight: V1.leadingDisplay }}>{children}</h1>,
  h2: ({ children }: any) => <h2 style={{ fontFamily: V1.displayFont, color: V1.text, fontSize: 18, margin: '4px 0 8px' }}>{children}</h2>,
  h3: ({ children }: any) => <h3 style={{ fontFamily: V1.displayFont, color: V1.text, fontSize: 15, margin: '4px 0 6px' }}>{children}</h3>,
  strong: ({ children }: any) => <strong style={{ color: V1.text, fontWeight: V1.fwSemibold }}>{children}</strong>,
  em: ({ children }: any) => <em style={{ color: V1.textSecondary }}>{children}</em>,
  ul: ({ children }: any) => <ul style={{ margin: '0 0 10px', paddingLeft: 18 }}>{children}</ul>,
  li: ({ children }: any) => <li style={{ color: V1.text, fontFamily: V1.bodyFont, fontSize: V1.textBody, lineHeight: V1.leadingBody, marginBottom: 4 }}>{children}</li>,
};

function getGuestCount(): number {
  try { return parseInt(localStorage.getItem(GUEST_STORAGE_KEY) || '0', 10); } catch { return 0; }
}
function setGuestCount(count: number) {
  try { localStorage.setItem(GUEST_STORAGE_KEY, String(count)); } catch {}
}

export function NEXUSPage() {
  const { user, profile } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const assessmentProgress = useMemo(() => getAssessmentProgress(), []);
  const nextRecommendation = useMemo(() => recommendNextAssessment(), []);

  const [messages, setMessages] = useState<Message[]>(() => {
    const base = buildNexusFirstResponse(profile?.name);
    let greeting = base;
    if (assessmentProgress.completed > 0) {
      const progressLine = `\n\nYou've completed ${assessmentProgress.completed} of ${assessmentProgress.total} assessments on this device.`;
      let recLine = '';
      if (nextRecommendation) {
        recLine = `\nBased on your history, I'd suggest **${nextRecommendation.name}** next — ${nextRecommendation.reason}`;
      }
      greeting = base + progressLine + recLine;
    }
    return [{ role: 'assistant', content: greeting }];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [guestCount, setGuestCountState] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const firstMessageSentRef = useRef(false);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) { setInput(q); setTimeout(() => inputRef.current?.focus(), 0); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const codeParam = searchParams.get('code');
  const lensContext = useMemo(() => {
    if (!codeParam) return undefined;
    const info = ASSESSMENT_CATALOG[codeParam.toUpperCase()];
    if (!info) return undefined;
    const dimList = info.dimensions.map(d => `${d.name} (${d.lowLabel} → ${d.highLabel})`).join('; ');
    return [
      `=== CURRENT LENS CONTEXT ===`,
      `The user is asking about their ${info.name} (${info.code}) results.`,
      `Instrument measures ${info.dimensions.length} dimensions: ${dimList}.`,
      `Tagline: ${info.tagline}`,
      `Ground your answer in this instrument. Reference the specific dimensions by name when explaining findings.`,
    ].join('\n');
  }, [codeParam]);

  const localAssessmentContext = useMemo(() => buildLocalAssessmentContextForNexus(), []);
  const combinedContext = [lensContext, localAssessmentContext.contextString].filter(Boolean).join('\n\n');
  const systemPrompt = useMemo(() => buildNexusSystemPrompt(combinedContext).systemPrompt, [combinedContext]);

  const isGuest = !user;
  const remaining = isGuest ? Math.max(0, GUEST_MESSAGE_LIMIT - guestCount) : Infinity;
  const showGuestLimit = isGuest && guestCount >= GUEST_MESSAGE_LIMIT;

  // First-session (Day 1) = no user message sent yet on this device.
  const isFirstSession = !firstMessageSentRef.current && messages.length <= 1;

  useEffect(() => { trackNexusChatInitiation('direct_link'); }, []);
  useEffect(() => { if (isGuest) setGuestCountState(getGuestCount()); }, [isGuest]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 150) + 'px';
    }
  }, [input]);

  const send = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || loading) return;
    if (showGuestLimit) { navigate('/signup'); return; }
    if (messageText) trackCTA({ location: 'nexus_chat', label: 'Quick Reply', destination: undefined, context_id: messageText.slice(0, 80) });
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);
    try {
      const response = await sendChatMessage(
        text,
        user?.id || 'guest-' + (localStorage.getItem('nexus_guest_id') || Math.random().toString(36).slice(2)),
        messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
        systemPrompt ? { systemPrompt } : undefined
      );
      setMessages(prev => [...prev, { role: 'assistant', content: response, promptText: text }]);
      if (!firstMessageSentRef.current) { firstMessageSentRef.current = true; trackNexusFirstMessageSent('coze-gpt-4o'); }
    } catch (e) {
      reportError(e, { scope: 'nexus:sendChatMessage', severity: 'warning' });
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Try again?', isError: true, promptText: text }]);
    }
    setLoading(false);
    if (isGuest) { const n = guestCount + 1; setGuestCountState(n); setGuestCount(n); }
  };

  const retry = (failedMessage: Message) => {
    if (!failedMessage.promptText || loading) return;
    setMessages(prev => prev.filter(m => m !== failedMessage));
    send(failedMessage.promptText);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="v1-scope" style={{ minHeight: '100vh', background: V1.bg }}>
      <SEO page="nexus" />
      <style>{`
        @keyframes nexus-reveal { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .nexus-msg-enter { animation: nexus-reveal ${REVEAL_MS}ms ${EASE_OUT} both; }
        @keyframes nexus-pulse { 0%,80%,100% { opacity: 0.25; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }
        .nexus-dot { animation: nexus-pulse 1.4s ease-in-out infinite; display: inline-block; }
        .nexus-dot:nth-child(2) { animation-delay: 0.16s; }
        .nexus-dot:nth-child(3) { animation-delay: 0.32s; }
      `}</style>

      {/* ══════════ NAV (fixed, translucent cream, Day 1 label for first session) ══════════ */}
      <nav className="v1-nav" aria-label="Primary">
        <div className="v1-nav-inner">
          <Link to="/" className="v1-wordmark" aria-label="NEXUS home">NEXUS<span className="v1-dot">.</span></Link>
          <div className="v1-nav-links v1-hidden-mobile">
            <Link to="/nexus/chat">Chat</Link>
            <Link to="/nexus/lenses">Lenses</Link>
            <Link to="/nexus/milestones">Milestones</Link>
          </div>
          <div className="v1-nav-cta">
            {isFirstSession ? (
              <span className="v1-mono v1-mono-teal" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span className="v1-status-dot v1-status-dot-teal" /> Day 1
              </span>
            ) : isGuest ? (
              <Link to="/login" className="v1-btn v1-btn-secondary" onClick={() => trackCTA({ location: 'nexus_chat', label: 'Sign in (header)', destination: '/login' })}>
                Sign in
              </Link>
            ) : (
              <span className="v1-avatar v1-avatar-sm" title={profile?.name || user?.email || ''}>
                {(profile?.name || user?.email || 'U').slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </nav>

      {/* ══════════ 3-COLUMN APP SHELL ══════════ */}
      <div className="v1-appshell" style={{ marginTop: V1.navHeight, height: `calc(100vh - ${V1.navHeight})` }}>

        {/* ── LEFT SIDEBAR ── */}
        <aside className="v1-appshell-col">
          <div className="v1-sidebar-sticky">
            {isFirstSession ? (
              <div className="v1-sidebar-section">
                <div className="v1-sidebar-label">Getting started</div>
                <div className="v1-timeline" style={{ marginTop: 8 }}>
                  {[
                    { t: 'Start the conversation', done: false, active: true },
                    { t: 'Add your first lens', done: false, active: false },
                    { t: 'See your first insight', done: false, active: false },
                    { t: 'Carry the thread forward', done: false, active: false },
                  ].map((s, i) => (
                    <div className={`v1-timeline-item ${s.active ? 'v1-active' : ''}`} key={i}>
                      <div className="v1-timeline-marker" />
                      <div style={{ fontFamily: V1.bodyFont, fontSize: V1.textBodySm, color: s.active ? V1.teal700 : V1.textSecondary, fontWeight: s.active ? V1.fwMedium : V1.fwRegular }}>
                        {s.t}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="v1-sidebar-section">
                  <div className="v1-sidebar-label">Workspace</div>
                  <Link to="/nexus/chat" className="v1-sidebar-link v1-active">Chat</Link>
                  <Link to="/nexus/lenses" className="v1-sidebar-link">Lenses</Link>
                  <Link to="/nexus/milestones" className="v1-sidebar-link">Milestones</Link>
                  <Link to="/nexus/insights" className="v1-sidebar-link">Insights</Link>
                  <Link to="/app/documents" className="v1-sidebar-link">Documents</Link>
                  <Link to="/app/billing" className="v1-sidebar-link">Billing</Link>
                </div>
                <div className="v1-sidebar-section">
                  <div className="v1-sidebar-label">Depth</div>
                  {['Positioning', 'Influence', 'Transition', 'Enterprise China'].map(area => (
                    <Link to="/nexus/lenses" key={area} className="v1-sidebar-link">{area}<span className="v1-sidebar-meta">practice</span></Link>
                  ))}
                  <Link to="/nexus/lenses" className="v1-sidebar-link">All eleven lenses <span aria-hidden="true">→</span></Link>
                </div>
                <div className="v1-sidebar-section">
                  <div className="v1-sidebar-label">Human Layer</div>
                  <Link to="/debrief/book" className="v1-sidebar-link">Book a debrief</Link>
                  <Link to="/nexus/chat" className="v1-sidebar-link">Coaching packages</Link>
                </div>
              </>
            )}
          </div>
        </aside>

        {/* ── MAIN CHAT ── */}
        <main className="v1-appshell-main" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: `${V1.shellPad}px ${V1.shellPad}px 0` }}>
            <div style={{ maxWidth: 720, margin: '0 auto', paddingBottom: 24 }}>

              {/* Welcome block (first session only) */}
              {isFirstSession && (
                <div className="v1-card v1-card-focus nexus-msg-enter" style={{ marginBottom: 24, padding: 28 }}>
                  <div className="v1-eyebrow" style={{ marginBottom: 12 }}>Welcome</div>
                  <h1 className="v1-display" style={{ fontSize: V1.textH1, margin: '0 0 12px' }}>
                    Start wherever you want. No form to fill out first.
                  </h1>
                  <p style={{ fontFamily: V1.bodyFont, fontSize: V1.textBodyLg, lineHeight: V1.leadingBody, color: V1.textSecondary, margin: 0 }}>
                    NEXUS speaks first. Say what is on your mind — a decision, a friction, a question you have been avoiding — and the thread begins.
                  </p>
                </div>
              )}

              {/* Message flow */}
              {messages.map((m, i) => (
                <div key={i} className={`nexus-msg-enter ${m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}`} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 20 }}>
                  <div style={{ maxWidth: '85%' }}>
                    {m.role === 'assistant' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span className="v1-avatar v1-avatar-sm" style={{ width: 20, height: 20, fontSize: 9 }}>N</span>
                        <span className="v1-mono" style={{ color: V1.textMuted }}>NEXUS</span>
                      </div>
                    )}
                    <div style={
                      m.role === 'user'
                        ? { background: V1.ink900, color: V1.onDark, padding: '12px 16px', fontFamily: V1.bodyFont, fontSize: V1.textBody, lineHeight: V1.leadingBody, borderLeft: `3px solid ${V1.teal600}` }
                        : m.isError
                          ? { background: V1.surface, border: `1px solid ${V1.border}`, padding: '12px 16px', color: V1.textSecondary, fontStyle: 'italic', fontFamily: V1.bodyFont, fontSize: V1.textBody }
                          : { background: V1.surface, border: `1px solid ${V1.border}`, padding: '12px 16px', color: V1.text, fontFamily: V1.bodyFont, fontSize: V1.textBody }
                    }>
                      {m.role === 'assistant' && !m.isError ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={customComponents}>{m.content}</ReactMarkdown>
                      ) : m.content}
                    </div>
                    {m.isError && (
                      <button onClick={() => retry(m)} disabled={loading}
                        className="v1-btn v1-btn-secondary" style={{ marginTop: 8, padding: '6px 12px', fontSize: 12, minHeight: 'auto' }}>
                        <span aria-hidden="true">↻</span> Try again
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading — 3 subtle pulsing dots */}
              {loading && (
                <div className="nexus-msg-enter" style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 20 }}>
                  <div style={{ maxWidth: '85%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span className="v1-avatar v1-avatar-sm" style={{ width: 20, height: 20, fontSize: 9 }}>N</span>
                      <span className="v1-mono" style={{ color: V1.textMuted }}>NEXUS</span>
                    </div>
                    <div style={{ background: V1.surface, border: `1px solid ${V1.border}`, padding: '14px 16px', display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span className="nexus-dot" style={{ width: 6, height: 6, background: V1.teal600 }} />
                      <span className="nexus-dot" style={{ width: 6, height: 6, background: V1.teal600 }} />
                      <span className="nexus-dot" style={{ width: 6, height: 6, background: V1.teal600 }} />
                    </div>
                  </div>
                </div>
              )}

              {/* First-session: lens activation card (coach-recommended opt-in) */}
              {isFirstSession && !loading && (
                <div className="v1-card v1-card-system nexus-msg-enter" style={{ marginBottom: 20, padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    {/* CSS editorial ornament instead of icon library */}
                    <span aria-hidden="true" style={{ display: 'inline-block', width: 14, height: 14, border: `1px solid ${V1.onDark}`, position: 'relative', borderRadius: '50%' }}>
                      <span style={{ position: 'absolute', inset: 'auto auto auto -1px', top: '50%', width: 16, height: 1, background: V1.onDark }} />
                      <span style={{ position: 'absolute', inset: '0 auto auto 50%', left: '50%', width: 1, height: 16, background: V1.onDark, top: '-1px' }} />
                    </span>
                    <span className="v1-mono v1-mono-on-dark">NEXUS proposes a lens</span>
                  </div>
                  <h3 className="v1-display" style={{ fontSize: V1.textH3, margin: '0 0 6px', color: V1.onDark }}>PRISM — professional branding</h3>
                  <p style={{ fontFamily: V1.bodyFont, fontSize: V1.textBodySm, color: V1.onDarkMuted, margin: '0 0 14px', lineHeight: V1.leadingBody }}>
                    Adding PRISM would sharpen where you stand and how you are seen. You opt in deliberately — it costs 2 miles.
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className="v1-btn v1-btn-primary v1-on-dark" style={{ padding: '8px 16px', minHeight: 36, fontSize: 13 }}>Activate lens</button>
                    <button className="v1-btn v1-btn-link" style={{ color: V1.onDarkMuted, fontSize: 13, minHeight: 36 }}>Not now</button>
                  </div>
                </div>
              )}

              {/* First-session: milestone inline badge */}
              {isFirstSession && !loading && (
                <div className="v1-milestone-badge nexus-msg-enter" style={{ marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span aria-hidden="true" style={{ color: V1.fuchsia600, marginTop: 2, fontWeight: 700 }}>✓</span>
                  <div>
                    <div className="v1-mono" style={{ color: V1.fuchsia600, marginBottom: 2 }}>Milestone</div>
                    <div style={{ fontFamily: V1.bodyFont, fontSize: V1.textBodySm, color: V1.text, lineHeight: V1.leadingBody }}>
                      First conversation begun. Your thread is now private and persistent.
                    </div>
                  </div>
                </div>
              )}

              {/* Option chips / quick replies (first response only) */}
              {messages.length === 1 && !loading && !showGuestLimit && (
                <div className="nexus-msg-enter" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                  {QUICK_REPLIES.map((reply, i) => (
                    <button key={i} onClick={() => send(reply)} className="v1-chip" style={{ minHeight: 36 }}>
                      {reply} <span aria-hidden="true">→</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Guest limit banner */}
              {showGuestLimit && (
                <div className="v1-card v1-card-addon nexus-msg-enter" style={{ marginBottom: 20, padding: 24 }}>
                  <h3 className="v1-display" style={{ fontSize: V1.textH3, margin: '0 0 8px' }}>Unlock the full experience</h3>
                  <p style={{ fontFamily: V1.bodyFont, fontSize: V1.textBodySm, color: V1.textSecondary, margin: '0 0 16px', lineHeight: V1.leadingBody }}>
                    Create a profile for full NEXUS access, the 11-lens catalog, and saved conversation history.
                  </p>
                  <Link to="/signup" onClick={() => trackCTA({ location: 'nexus_chat', label: 'Create Account (guest limit CTA)', destination: '/signup' })} className="v1-btn v1-btn-primary">
                    Create profile <span aria-hidden="true">→</span>
                  </Link>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>

          {/* Input bar */}
          <div style={{ borderTop: `1px solid ${V1.border}`, background: V1.surface, padding: `${V1.shellPad}px`, paddingBottom: 'calc(32px + env(safe-area-inset-bottom, 0px))' }}>
            <div style={{ maxWidth: 720, margin: '0 auto' }}>
              {isGuest && remaining > 0 && remaining < GUEST_MESSAGE_LIMIT && (
                <div className="v1-mono" style={{ textAlign: 'center', marginBottom: 8, color: V1.textDim }}>
                  {remaining} complimentary message{remaining === 1 ? '' : 's'} remaining
                </div>
              )}
              <div className="v1-input-row">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={showGuestLimit ? 'Create a profile to continue...' : 'Ask NEXUS about a decision, a friction, or a question you have been avoiding...'}
                  disabled={showGuestLimit || loading}
                  rows={1}
                  className="v1-textarea"
                  style={{ minHeight: 40, maxHeight: 150 }}
                />
                <button onClick={() => send()} disabled={loading || !input.trim() || showGuestLimit} className="v1-send-btn" aria-label="Send message">
                  <span aria-hidden="true">→</span>
                </button>
              </div>
              <p className="v1-mono" style={{ textAlign: 'center', marginTop: 8, color: V1.textDim }}>
                NEXUS may produce inaccurate information. Verify critical decisions.
              </p>
            </div>
          </div>
        </main>

        {/* ── RIGHT SIDEBAR — context panel ── */}
        <aside className="v1-appshell-col">
          <div className="v1-sidebar-sticky">
            {isFirstSession ? (
              <>
                <div className="v1-sidebar-section">
                  <div className="v1-sidebar-label">First-session progress</div>
                  <div className="v1-timeline" style={{ marginTop: 8 }}>
                    {[
                      { t: 'Conversation started', done: true },
                      { t: 'First lens activated', done: false, active: false },
                      { t: 'First insight captured', done: false, active: false },
                      { t: 'Thread saved', done: false, active: false },
                    ].map((s, i) => (
                      <div className={`v1-timeline-item ${s.done ? 'v1-completed' : ''}`} key={i}>
                        <div className="v1-timeline-marker" />
                        <div style={{ fontFamily: V1.bodyFont, fontSize: V1.textBodySm, color: s.done ? V1.text : V1.textSecondary }}>
                          {s.t}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="v1-progress" style={{ marginTop: 16 }}>
                    <div className="v1-progress-fill" style={{ width: '25%' }} />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="v1-sidebar-section">
                  <div className="v1-sidebar-label">Active lens</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className="v1-status-dot v1-status-dot-teal" />
                    <span className="v1-display" style={{ fontSize: 18 }}>PRISM</span>
                  </div>
                  <p style={{ fontFamily: V1.bodyFont, fontSize: V1.textBodySm, color: V1.textSecondary, margin: 0, lineHeight: V1.leadingBody }}>
                    professional branding · 2 miles
                  </p>
                </div>
                <div className="v1-sidebar-section">
                  <div className="v1-sidebar-label">What we're working on</div>
                  <p style={{ fontFamily: V1.bodyFont, fontSize: V1.textBodySm, color: V1.textSecondary, margin: 0, lineHeight: V1.leadingBody }}>
                    How you are perceived relative to where you want to go next.
                  </p>
                </div>
                <div className="v1-sidebar-section">
                  <div className="v1-sidebar-label">What we've learned</div>
                  <p style={{ fontFamily: V1.bodyFont, fontSize: V1.textBodySm, color: V1.textSecondary, margin: 0, lineHeight: V1.leadingBody }}>
                    No insights captured yet. They will collect here as the thread grows.
                  </p>
                </div>
                <div className="v1-sidebar-section">
                  <div className="v1-sidebar-label">Thinking style</div>
                  <p style={{ fontFamily: V1.bodyFont, fontSize: V1.textBodySm, color: V1.textSecondary, margin: 0, lineHeight: V1.leadingBody }}>
                    Socratic. NEXUS asks before it advises.
                  </p>
                </div>
              </>
            )}
            <div className="v1-sidebar-section">
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span aria-hidden="true" style={{ color: V1.teal600, marginTop: 1, flexShrink: 0, fontSize: 14, lineHeight: 1 }}>◆</span>
                <p className="v1-mono" style={{ color: V1.textMuted, lineHeight: V1.leadingLabel, textTransform: 'none', letterSpacing: 0, fontFamily: V1.bodyFont, fontSize: 11 }}>
                  Your context stays yours. Nothing leaves this thread without your say.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default NEXUSPage;
