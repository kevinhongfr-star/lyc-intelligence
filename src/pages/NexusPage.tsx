/**
 * NEXUSPage — W4-4 / NEXUS chat UI polish
 *
 * Premium dark chat interface. Distinctive, not a generic chat widget.
 *
 * Brand rules (W4-4):
 *  - Zero border radius everywhere.
 *  - System serif headings, DM Sans body, IBM Plex Mono labels.
 *  - NEXUS accent = OCEAN / deep blue (#1E4D8C) — one accent per page.
 *  - Dark premium aesthetic.
 *  - Motion: 120–350ms, ease-out, purposeful only.
 *  - Loading = 3 subtle pulsing dots (NOT bouncing dots / spinner).
 *  - Response reveal = smooth fade-in (200ms ease-out), NO typewriter.
 *  - Error state = calm, premium, retry button, NOT red/alarming.
 *  - Mobile = full-screen, safe-area handling, keyboard-aware input.
 */
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Sparkles, ArrowRight, LogIn, RefreshCw } from 'lucide-react';
import { sendChatMessage } from '@/services/coze';
import { useAuthStore } from '@/stores/authStore';
import { SEO } from '@/components/seo/SEO';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { trackCTA, trackNexusFirstMessageSent, trackNexusChatInitiation } from '@/analytics/eventTracker';
import { reportError } from '@/analytics/errorMonitor';
import { buildNexusSystemPrompt, buildNexusFirstResponse, NEXUS_FIRST_RESPONSE_QUICK_REPLIES } from '@/nexus/nexusKnowledge';
import { ASSESSMENT_CATALOG } from '@/assessments/catalog';
import { OCEAN, FONT_DISPLAY, FONT_BODY, FONT_MONO } from '@/tokens';

// ── NEXUS accent (ocean / deep blue) — one accent per page ──
const ACCENT = OCEAN;            // #1E4D8C
const ACCENT_DARK = '#163E70';
const ACCENT_LIGHT = '#3A6BA8';

// ── Dark surface ramp ──
const SURFACE_BASE = '#0A0A12';    // page bg (deepest)
const SURFACE_1 = '#101019';       // header / input well
const SURFACE_2 = '#16161F';       // NEXUS bubble bg
const SURFACE_3 = '#1C1C28';       // user bubble bg (slightly lighter)
const BORDER_SUBTLE = 'rgba(255,255,255,0.08)';
const BORDER_FOCUS = 'rgba(58,107,168,0.55)'; // ocean-tinted focus border
const TEXT_PRIMARY = '#FFFFFF';
const TEXT_SECONDARY = 'rgba(255,255,255,0.66)';
const TEXT_DIM = 'rgba(255,255,255,0.42)';

// ── Motion tokens (V1 micro-interactions: 120–350ms, ease-out) ──
const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';
const REVEAL_MS = 200;

interface Message {
  role: 'user' | 'assistant';
  content: string;
  suggested_prompts?: string[];
  isError?: boolean;
  /** The user text that triggered this assistant message (for retry). */
  promptText?: string;
}

const GUEST_MESSAGE_LIMIT = 3;
const GUEST_STORAGE_KEY = 'nexus_guest_messages';

// W4-2: quick-reply chips shown below the NEXUS first response. Specific,
// framework-aware — not open-ended "how can I help?". Sourced from
// nexusKnowledge so the system prompt + UI stay in sync.
const QUICK_REPLIES = NEXUS_FIRST_RESPONSE_QUICK_REPLIES;

// ── Markdown components tuned for dark premium chat ──
const customComponents = {
  table: ({ children }: any) => (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full border-collapse" style={{ border: `1px solid ${BORDER_SUBTLE}` }}>{children}</table>
    </div>
  ),
  th: ({ children }: any) => (
    <th
      className="px-4 py-2 font-semibold text-sm text-left"
      style={{ border: `1px solid ${BORDER_SUBTLE}`, background: SURFACE_3 }}
    >
      {children}
    </th>
  ),
  td: ({ children }: any) => (
    <td className="px-4 py-2 text-sm" style={{ border: `1px solid ${BORDER_SUBTLE}`, color: TEXT_SECONDARY }}>
      {children}
    </td>
  ),
  tr: ({ children }: any) => <tr>{children}</tr>,
  code: ({ inline, className, children, ...props }: any) => {
    if (inline) {
      return (
        <code
          className="px-1.5 py-0.5 text-xs"
          style={{ background: SURFACE_3, color: ACCENT_LIGHT, fontFamily: FONT_MONO }}
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <pre
        className="p-4 overflow-x-auto my-3 text-xs"
        style={{ background: SURFACE_BASE, color: 'rgba(255,255,255,0.85)', fontFamily: FONT_MONO, border: `1px solid ${BORDER_SUBTLE}` }}
      >
        <code className={className} {...props}>{children}</code>
      </pre>
    );
  },
  ul: ({ children }: any) => <ul className="list-disc pl-5 space-y-1.5 my-2" style={{ color: TEXT_SECONDARY }}>{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-5 space-y-1.5 my-2" style={{ color: TEXT_SECONDARY }}>{children}</ol>,
  li: ({ children }: any) => <li style={{ color: TEXT_SECONDARY }}>{children}</li>,
  a: ({ href, children }: any) => (
    <a href={href} style={{ color: ACCENT_LIGHT, textDecoration: 'underline' }} target="_blank" rel="noopener noreferrer">{children}</a>
  ),
  p: ({ children }: any) => <p className="mb-3 last:mb-0 leading-relaxed" style={{ color: TEXT_PRIMARY }}>{children}</p>,
  h1: ({ children }: any) => <h1 className="text-xl font-bold mb-3 mt-4" style={{ fontFamily: FONT_DISPLAY, color: TEXT_PRIMARY }}>{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-lg font-bold mb-2 mt-4" style={{ fontFamily: FONT_DISPLAY, color: TEXT_PRIMARY }}>{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-base font-semibold mb-1.5 mt-3" style={{ color: TEXT_PRIMARY }}>{children}</h3>,
  strong: ({ children }: any) => <strong className="font-semibold" style={{ color: TEXT_PRIMARY }}>{children}</strong>,
  em: ({ children }: any) => <em style={{ color: TEXT_SECONDARY }}>{children}</em>,
};

function getGuestCount(): number {
  try {
    return parseInt(localStorage.getItem(GUEST_STORAGE_KEY) || '0', 10);
  } catch {
    return 0;
  }
}

function setGuestCount(count: number) {
  try {
    localStorage.setItem(GUEST_STORAGE_KEY, String(count));
  } catch {}
}

export function NEXUSPage() {
  const { user, profile } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // W4-2: NEXUS speaks first. The opening message is a fixed, framework-aware
  // template (NOT generated by the LLM) so the first impression is always
  // specific and premium — never "How can I help you?". Greeted by name if
  // the profile is known. Lazy initializer runs once on mount.
  const [messages, setMessages] = useState<Message[]>(() => [
    { role: 'assistant', content: buildNexusFirstResponse(profile?.name) },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [guestCount, setGuestCountState] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const firstMessageSentRef = useRef(false);

  // #1324: Pre-fill the input when arriving with a `q` query param (e.g. from
  // an "Ask NEXUS about this" CTA on the assessment results page).
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setInput(q);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // #1324: Consume the `code` query param — inject assessment framework context.
  const codeParam = searchParams.get('code');
  const frameworkContext = useMemo(() => {
    if (!codeParam) return undefined;
    const info = ASSESSMENT_CATALOG[codeParam.toUpperCase()];
    if (!info) return undefined;
    const dimList = info.dimensions.map(d => `${d.name} (${d.lowLabel} → ${d.highLabel})`).join('; ');
    return [
      `=== CURRENT ASSESSMENT CONTEXT ===`,
      `The user is asking about their ${info.name} (${info.code}) results.`,
      `Instrument measures ${info.dimensions.length} dimensions: ${dimList}.`,
      `Tagline: ${info.tagline}`,
      `Ground your answer in this instrument's framework. Reference the specific dimensions by name when explaining findings.`,
    ].join('\n');
  }, [codeParam]);

  const systemPrompt = useMemo(
    () => buildNexusSystemPrompt(frameworkContext).systemPrompt,
    [frameworkContext]
  );

  const isGuest = !user;
  const remaining = isGuest ? Math.max(0, GUEST_MESSAGE_LIMIT - guestCount) : Infinity;
  const showGuestLimit = isGuest && guestCount >= GUEST_MESSAGE_LIMIT;

  useEffect(() => {
    trackNexusChatInitiation('direct_link');
  }, []);

  useEffect(() => {
    if (isGuest) {
      setGuestCountState(getGuestCount());
    }
  }, [isGuest]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 150) + 'px';
    }
  }, [input]);

  const send = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || loading) return;
    if (showGuestLimit) {
      navigate('/signup');
      return;
    }

    if (messageText) {
      trackCTA({ location: 'nexus_chat', label: 'Quick Reply', destination: undefined, context_id: messageText.slice(0, 80) });
    }

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

      if (!firstMessageSentRef.current) {
        firstMessageSentRef.current = true;
        trackNexusFirstMessageSent('coze-gpt-4o');
      }
    } catch (e) {
      reportError(e, { scope: 'nexus:sendChatMessage', severity: 'warning' });
      // W4-4: calm, premium error state — not red/alarming.
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Something went wrong. Try again?',
        isError: true,
        promptText: text,
      }]);
    }
    setLoading(false);

    if (isGuest) {
      const newCount = guestCount + 1;
      setGuestCountState(newCount);
      setGuestCount(newCount);
    }
  };

  // W4-4: Retry the failed message — re-send the original prompt text.
  const retry = (failedMessage: Message) => {
    if (!failedMessage.promptText || loading) return;
    // Remove the error bubble, then re-send.
    setMessages(prev => prev.filter(m => m !== failedMessage));
    send(failedMessage.promptText);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: SURFACE_BASE, fontFamily: FONT_BODY }}
    >
      <SEO page="nexus" />

      {/* Inline keyframes: message fade-in reveal (200ms ease-out) + pulsing dots */}
      <style>{`
        @keyframes nexus-reveal {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .nexus-msg-enter { animation: nexus-reveal ${REVEAL_MS}ms ${EASE_OUT} both; }
        @keyframes nexus-pulse {
          0%, 80%, 100% { opacity: 0.25; transform: scale(0.8); }
          40%           { opacity: 1;    transform: scale(1); }
        }
        .nexus-dot { animation: nexus-pulse 1.4s ease-in-out infinite; }
        .nexus-dot:nth-child(2) { animation-delay: 0.16s; }
        .nexus-dot:nth-child(3) { animation-delay: 0.32s; }
      `}</style>

      {/* Header — clean, minimal, ocean accent indicator */}
      <header
        className="sticky top-0 z-10"
        style={{
          background: SURFACE_1,
          borderBottom: `1px solid ${BORDER_SUBTLE}`,
          paddingTop: 'env(safe-area-inset-top)',
        }}
      >
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 flex items-center justify-center"
              style={{ background: ACCENT }}
            >
              <Sparkles className="w-4 h-4" style={{ color: TEXT_PRIMARY }} />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight" style={{ fontFamily: FONT_DISPLAY, color: TEXT_PRIMARY }}>
                NEXUS
              </h1>
              <p className="text-[10px] tracking-[0.22em] uppercase" style={{ fontFamily: FONT_MONO, color: TEXT_DIM }}>
                Executive Intelligence
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isGuest ? (
              <Link
                to="/login"
                onClick={() => trackCTA({ location: 'nexus_chat', label: 'Sign in (header)', destination: '/login' })}
                className="text-sm flex items-center gap-1.5 transition-colors"
                style={{ color: TEXT_SECONDARY }}
                onMouseEnter={(e) => (e.currentTarget.style.color = TEXT_PRIMARY)}
                onMouseLeave={(e) => (e.currentTarget.style.color = TEXT_SECONDARY)}
              >
                <LogIn className="w-4 h-4" />
                Sign in
              </Link>
            ) : (
              <div className="text-sm" style={{ color: TEXT_DIM }}>
                {profile?.name || user?.email}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Chat area */}
      <main
        className="flex-1 flex flex-col max-w-4xl w-full mx-auto px-6 py-8"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
      >
        {/* Messages — NEXUS speaks first (W4-2 first response is pre-injected) */}
        <div className="flex-1 space-y-6 pb-6">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex nexus-msg-enter ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] ${m.role === 'user' ? 'order-1' : ''}`}>
                {m.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-1.5">
                    <div
                      className="w-5 h-5 flex items-center justify-center"
                      style={{ background: `${ACCENT}22` }}
                    >
                      <Sparkles className="w-3 h-3" style={{ color: ACCENT_LIGHT }} />
                    </div>
                    <span
                      className="text-[10px] font-semibold uppercase tracking-[0.18em]"
                      style={{ fontFamily: FONT_MONO, color: TEXT_DIM }}
                    >
                      NEXUS
                    </span>
                  </div>
                )}
                {/* W4-4 chat bubbles — zero radius, dark premium
                    User: dark bg + ocean accent left border (indicator)
                    NEXUS: slightly lighter dark bg + clean white text */}
                <div
                  className="px-5 py-3.5 text-sm leading-relaxed"
                  style={
                    m.role === 'user'
                      ? {
                          background: SURFACE_3,
                          borderLeft: `3px solid ${ACCENT}`,
                          color: TEXT_PRIMARY,
                          fontFamily: FONT_BODY,
                        }
                      : m.isError
                        ? {
                            background: SURFACE_2,
                            border: `1px solid ${BORDER_SUBTLE}`,
                            color: TEXT_SECONDARY,
                            fontStyle: 'italic',
                            fontFamily: FONT_BODY,
                          }
                        : {
                            background: SURFACE_2,
                            border: `1px solid ${BORDER_SUBTLE}`,
                            color: TEXT_PRIMARY,
                            fontFamily: FONT_BODY,
                          }
                  }
                >
                  {m.role === 'assistant' && !m.isError ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={customComponents}>
                      {m.content}
                    </ReactMarkdown>
                  ) : (
                    m.content
                  )}
                </div>
                {/* W4-4: calm error state — retry button, not red/alarming */}
                {m.isError && (
                  <button
                    onClick={() => retry(m)}
                    disabled={loading}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 transition-all disabled:opacity-40"
                    style={{
                      background: 'transparent',
                      border: `1px solid ${ACCENT}55`,
                      color: ACCENT_LIGHT,
                      fontFamily: FONT_BODY,
                    }}
                    onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = `${ACCENT}1A`; } }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <RefreshCw className="w-3 h-3" />
                    Try again
                  </button>
                )}
              </div>
            </div>
          ))}
          {/* W4-4 loading: 3 subtle pulsing dots — NOT a spinner, NOT bouncing dots */}
          {loading && (
            <div className="flex justify-start nexus-msg-enter">
              <div className="max-w-[85%]">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-5 h-5 flex items-center justify-center" style={{ background: `${ACCENT}22` }}>
                    <Sparkles className="w-3 h-3" style={{ color: ACCENT_LIGHT }} />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ fontFamily: FONT_MONO, color: TEXT_DIM }}>
                    NEXUS
                  </span>
                </div>
                <div
                  className="px-5 py-4 flex items-center gap-1.5"
                  style={{ background: SURFACE_2, border: `1px solid ${BORDER_SUBTLE}` }}
                >
                  <span className="nexus-dot inline-block w-1.5 h-1.5" style={{ background: ACCENT_LIGHT }} />
                  <span className="nexus-dot inline-block w-1.5 h-1.5" style={{ background: ACCENT_LIGHT }} />
                  <span className="nexus-dot inline-block w-1.5 h-1.5" style={{ background: ACCENT_LIGHT }} />
                </div>
              </div>
            </div>
          )}
          {/* W4-2: Quick-reply chips below the first response (only the greeting,
              no user messages yet). Specific, framework-aware — not open-ended. */}
          {messages.length === 1 && !loading && !showGuestLimit && (
            <div className="flex flex-wrap gap-2.5 justify-start pl-1 nexus-msg-enter">
              {QUICK_REPLIES.map((reply, i) => (
                <button
                  key={i}
                  onClick={() => send(reply)}
                  className="text-left px-4 py-2.5 text-sm font-medium transition-all group inline-flex items-center gap-2"
                  style={{
                    background: SURFACE_2,
                    border: `1px solid ${BORDER_SUBTLE}`,
                    color: TEXT_SECONDARY,
                    fontFamily: FONT_BODY,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = SURFACE_3;
                    e.currentTarget.style.borderColor = `${ACCENT}66`;
                    e.currentTarget.style.color = TEXT_PRIMARY;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = SURFACE_2;
                    e.currentTarget.style.borderColor = BORDER_SUBTLE;
                    e.currentTarget.style.color = TEXT_SECONDARY;
                  }}
                >
                  {reply}
                  <ArrowRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" style={{ color: ACCENT_LIGHT }} />
                </button>
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Guest limit banner — calm, premium */}
        {showGuestLimit && (
          <div className="p-6 mb-4 nexus-msg-enter" style={{ background: SURFACE_2, border: `1px solid ${ACCENT}33` }}>
            <h3 className="text-lg font-bold mb-2" style={{ fontFamily: FONT_DISPLAY, color: TEXT_PRIMARY }}>
              Unlock the full experience
            </h3>
            <p className="text-sm mb-4 leading-relaxed" style={{ color: TEXT_SECONDARY }}>
              Create an Executive Introduction profile for full NEXUS access, all 11
              assessments, personalized insights, and saved conversation history.
            </p>
            <Link
              to="/signup"
              onClick={() => trackCTA({ location: 'nexus_chat', label: 'Create Account (guest limit CTA)', destination: '/signup' })}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-all"
              style={{ background: ACCENT, color: TEXT_PRIMARY, fontFamily: FONT_BODY }}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT_DARK)}
              onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
            >
              Create profile <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Input area — clean, minimal border, ocean send button, zero radius */}
        <div className="mt-auto">
          {isGuest && remaining > 0 && remaining < GUEST_MESSAGE_LIMIT && (
            <div className="text-xs mb-2 text-center" style={{ color: TEXT_DIM }}>
              {remaining} complimentary message{remaining === 1 ? '' : 's'} remaining
            </div>
          )}
          <div
            className="relative transition-colors"
            style={{
              background: SURFACE_1,
              border: `1px solid ${BORDER_SUBTLE}`,
              marginBottom: 'env(keyboard-inset-height, 0px)',
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                showGuestLimit
                  ? 'Create a profile to continue...'
                  : 'Ask about your results, leadership challenges, or assessments...'
              }
              disabled={showGuestLimit || loading}
              rows={1}
              className="w-full px-4 py-3.5 bg-transparent text-sm focus:outline-none resize-none disabled:opacity-50 leading-relaxed"
              style={{
                color: TEXT_PRIMARY,
                fontFamily: FONT_BODY,
                minHeight: '52px',
                maxHeight: '150px',
                caretColor: ACCENT_LIGHT,
              }}
              onFocus={(e) => { e.currentTarget.parentElement!.style.borderColor = BORDER_FOCUS; }}
              onBlur={(e) => { e.currentTarget.parentElement!.style.borderColor = BORDER_SUBTLE; }}
            />
            <div className="absolute right-2.5 bottom-2.5">
              <button
                onClick={() => send()}
                disabled={loading || !input.trim() || showGuestLimit}
                className="w-9 h-9 flex items-center justify-center transition-all disabled:opacity-30"
                style={{ background: ACCENT, color: TEXT_PRIMARY }}
                onMouseEnter={(e) => { if (!loading && input.trim()) e.currentTarget.style.background = ACCENT_DARK; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = ACCENT; }}
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-xs text-center mt-2" style={{ color: TEXT_DIM }}>
            NEXUS may produce inaccurate information. Verify critical decisions.
          </p>
        </div>
      </main>
    </div>
  );
}

export default NEXUSPage;
