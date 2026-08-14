// ═══════════════════════════════════════════════════════════
// NexusDebriefWidget — embedded NEXUS chat panel for result pages.
// X2-8 (#1324): "NEXUS chat panel/widget directly on result page".
//
// A lightweight inline debrief that launches with the user's result
// context pre-loaded (via the system prompt), so NEXUS already knows
// the scores without the user re-explaining. Offers suggested question
// chips for a guided debrief: overall → dimensions → archetype → insights.
//
// Uses sendChatMessage (coze.ts) → /api/chat → DeepSeek. No API keys
// in the client. Falls back gracefully when the API is unavailable.
//
// Brand: zero border radius, system serif headings, one accent color.
// ═══════════════════════════════════════════════════════════
import { useState, useRef, useCallback } from 'react';
import { MessageSquare, ChevronDown, Send, Loader2 } from 'lucide-react';
import { sendChatMessage } from '@/services/coze';
import { DS, SUCCESS, WARNING } from '@/tokens';

interface DebriefMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  /** Pre-built, framework-aware result context (from resultContextBuilder). */
  resultContext: string;
  /** Assessment display name, for the panel header. */
  assessmentName: string;
  /** Assessment-specific accent color. */
  accent: string;
  /** Matched archetype name (for the greeting). */
  archetypeName?: string;
}

// Suggested debrief questions — guided flow per X2-8.
const SUGGESTED_QUESTIONS = [
  'Walk me through my results',
  'What are my blind spots?',
  'How do I improve my weakest dimension?',
  'What should I focus on first?',
];

const SYSTEM_PROMPT_SUFFIX =
  '\n\nYou are conducting a guided debrief of the user\'s assessment results. ' +
  'Be concise, specific, and grounded in their actual scores. Use plain language — no jargon. ' +
  'When the user asks what to focus on, give a concrete next step, not generic advice. ' +
  'Do not reproduce the raw context block verbatim; synthesize it into a natural conversation.';

export function NexusDebriefWidget({
  resultContext,
  assessmentName,
  accent,
  archetypeName,
}: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<DebriefMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const systemPrompt = resultContext + SYSTEM_PROMPT_SUFFIX;

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput('');
    const userMsg: DebriefMessage = { role: 'user', content: trimmed };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setLoading(true);

    // History for the API (last 10, role/content only).
    const history = nextMessages.slice(-10).map((m) => ({ role: m.role, content: m.content }));

    try {
      const reply = await sendChatMessage(trimmed, 'guest-debrief', history, {
        systemPrompt,
      });
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'I\'m having trouble connecting right now. You can continue this conversation in the full NEXUS experience.',
        },
      ]);
    } finally {
      setLoading(false);
      // Scroll to bottom after update.
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 50);
    }
  }, [messages, loading, systemPrompt]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <div style={{
      background: DS.card,
      border: `1px solid ${accent}40`,
      marginBottom: '24px',
      overflow: 'hidden',
    }}>
      {/* Header — collapsible */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '20px 24px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <MessageSquare style={{ width: 20, height: 20, color: accent, flexShrink: 0 }} />
          <span style={{ minWidth: 0 }}>
            <span style={{
              display: 'block',
              fontFamily: DS.headingFont,
              fontSize: '16px',
              fontWeight: 700,
              color: DS.text,
            }}>
              Discuss your results with NEXUS
            </span>
            <span style={{
              display: 'block',
              fontSize: '12px',
              color: DS.muted,
              marginTop: '2px',
            }}>
              {archetypeName
                ? `NEXUS already knows your ${archetypeName} profile — ask anything.`
                : 'NEXUS already knows your scores — ask anything.'}
            </span>
          </span>
        </span>
        <ChevronDown
          style={{
            width: 18, height: 18, color: DS.muted, flexShrink: 0,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 200ms cubic-bezier(0.16,1,0.3,1)',
          }}
        />
      </button>

      {open ? (
        <div style={{ padding: '0 24px 24px' }}>
          {/* Conversation area */}
          {messages.length > 0 ? (
            <div
              ref={scrollRef}
              style={{
                maxHeight: '360px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginBottom: '16px',
                paddingTop: '8px',
              }}
            >
              {messages.map((m, i) => (
                <div
                  key={i}
                  style={{
                    alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    padding: '10px 14px',
                    background: m.role === 'user' ? accent : DS.bgAlt,
                    color: m.role === 'user' ? '#FFFFFF' : DS.text,
                    fontSize: '14px',
                    lineHeight: 1.55,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {m.content}
                </div>
              ))}
              {loading ? (
                <div style={{
                  alignSelf: 'flex-start',
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '10px 14px', background: DS.bgAlt, color: DS.muted,
                  fontSize: '13px',
                }}>
                  <Loader2 style={{ width: 14, height: 14, animation: 'spin 700ms linear infinite' }} />
                  NEXUS is thinking…
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              ) : null}
            </div>
          ) : (
            <div style={{
              padding: '16px 0',
              fontSize: '13px', color: DS.textSecondary, lineHeight: 1.6,
            }}>
              Start with a suggested question, or ask anything about your {assessmentName} results.
              NEXUS has your scores, archetype, and development priorities in context.
            </div>
          )}

          {/* Suggested question chips */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '8px',
            marginBottom: '12px',
          }}>
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => send(q)}
                disabled={loading}
                style={{
                  padding: '7px 12px',
                  fontSize: '12px', fontWeight: 500,
                  border: `1px solid ${accent}40`,
                  background: `${accent}0D`,
                  color: accent,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1,
                  transition: 'background 200ms cubic-bezier(0.16,1,0.3,1)',
                }}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={{
            display: 'flex', gap: '8px', alignItems: 'flex-end',
            border: `1px solid ${DS.border}`,
            background: DS.bgAlt,
          }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask NEXUS about your results…"
              rows={1}
              style={{
                flex: '1 1 auto',
                padding: '12px 14px',
                border: 'none', background: 'transparent',
                color: DS.text, fontFamily: DS.bodyFont, fontSize: '14px',
                resize: 'none', outline: 'none', minHeight: '44px',
                lineHeight: '1.5',
              }}
            />
            <button
              type="button"
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
              style={{
                padding: '12px 16px',
                background: accent, color: '#FFFFFF',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: loading || !input.trim() ? 0.5 : 1,
              }}
              aria-label="Send message"
            >
              <Send style={{ width: 16, height: 16 }} />
            </button>
          </div>
          <p style={{
            fontSize: '10px', color: DS.muted, marginTop: '8px',
            fontFamily: DS.monoFont, textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            This is a complimentary debrief. Responses are AI-generated — verify before acting.
          </p>
        </div>
      ) : null}
    </div>
  );
}

export default NexusDebriefWidget;
