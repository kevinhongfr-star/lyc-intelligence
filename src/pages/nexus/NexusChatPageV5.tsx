import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { V1 } from '@/styles/v1-tokens';
import ChatRightRail from '@/components/nexus/ChatRightRail';
import { ConversationContextBar, DateSeparator } from '@/components/nexus/SingleConversationView';
import { sendChatMessage } from '@/services/coze';
import { useAuthStore } from '@/stores/authStore';
import {
  buildNexusSystemPrompt,
  buildNexusFirstResponse,
  NEXUS_FIRST_RESPONSE_QUICK_REPLIES,
} from '@/nexus/nexusKnowledge';
import {
  buildLocalAssessmentContextForNexus,
  getAssessmentProgress,
  recommendNextAssessment,
} from '@/nexus/resultContextBuilder';
import { ASSESSMENT_CATALOG } from '@/assessments/catalog';
import { getAvailablePersonas } from '@/config/nexusPersonas';
import { reportError } from '@/analytics/errorMonitor';
import {
  trackCTA,
  trackNexusChatInitiation,
  trackNexusFirstMessageSent,
} from '@/analytics/eventTracker';

interface BotMessage {
  type: 'bot';
  id: string;
  paragraphs: string[];
  time: string;
}

interface UserMessage {
  type: 'user';
  id: string;
  text: string;
  time: string;
}

interface SystemCard {
  type: 'system';
  id: string;
  label: string;
  title: string;
  pills?: string[];
  insight?: string;
}

interface MilestoneCard {
  type: 'milestone';
  id: string;
  title: string;
  dueDate: string;
  status: string;
}

interface DateSeparatorRow {
  type: 'date';
  id: string;
  date: string;
}

interface OptionChips {
  type: 'chips';
  id: string;
  options: string[];
}

interface TypingIndicator {
  type: 'typing';
  id: string;
}

type MessageRow =
  | BotMessage
  | UserMessage
  | SystemCard
  | MilestoneCard
  | DateSeparatorRow
  | OptionChips
  | TypingIndicator;

function nowTime(prefix: string): string {
  const d = new Date();
  const hh = d.getHours();
  const mm = d.getMinutes().toString().padStart(2, '0');
  const ampm = hh >= 12 ? 'PM' : 'AM';
  const h12 = ((hh + 11) % 12) + 1;
  return `${prefix} · ${h12}:${mm} ${ampm}`;
}

function todayLabel(): string {
  const d = new Date();
  const month = d.toLocaleString('en-US', { month: 'short' });
  return `Today · ${month} ${d.getDate()}, ${d.getFullYear()}`;
}

/** Split a model response into display paragraphs (V5 plain-text blocks). */
function toParagraphs(response: string): string[] {
  const paras = response
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  return paras.length > 0 ? paras : [response];
}

function BotMessageBlock({ msg }: { msg: BotMessage }) {
  return (
    <div style={{ marginTop: 28 }}>
      <div style={{ marginLeft: 44 }}>
        {msg.paragraphs.map((p, i) => (
          <p
            key={i}
            style={{
              fontFamily: V1.displayFont,
              fontSize: 17,
              lineHeight: V1.leadingBody,
              color: V1.ink900,
              fontWeight: V1.fwRegular,
              margin: i === 0 ? '0 0 12px 0' : i === msg.paragraphs.length - 1 ? '12px 0 0 0' : '12px 0',
            }}
          >
            {p}
          </p>
        ))}
      </div>
      <div
        style={{
          marginTop: 8,
          marginLeft: 44,
          fontFamily: V1.monoFont,
          fontSize: '0.65rem',
          letterSpacing: V1.trackingMono,
          textTransform: 'uppercase',
          color: V1.ink400,
          lineHeight: V1.leadingLabel,
        }}
      >
        {msg.time}
      </div>
    </div>
  );
}

function UserMessageBlock({ msg }: { msg: UserMessage }) {
  return (
    <div style={{ marginTop: 28, textAlign: 'right' }}>
      <div
        style={{
          display: 'inline-block',
          maxWidth: '75%',
          textAlign: 'left',
          fontFamily: V1.bodyFont,
          fontSize: 16,
          lineHeight: V1.leadingBody,
          color: V1.ink900,
        }}
      >
        {msg.text}
      </div>
      <div
        style={{
          marginTop: 8,
          textAlign: 'right',
          fontFamily: V1.monoFont,
          fontSize: '0.65rem',
          letterSpacing: V1.trackingMono,
          textTransform: 'uppercase',
          color: V1.ink400,
          lineHeight: V1.leadingLabel,
        }}
      >
        {msg.time}
      </div>
    </div>
  );
}

function OptionChipsBlock({
  chips,
  onSelect,
}: {
  chips: OptionChips;
  onSelect: (text: string) => void;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  return (
    <div
      style={{
        marginTop: 16,
        marginLeft: 44,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
      }}
    >
      {chips.options.map((opt, i) => (
        <button
          key={i}
          onClick={() => onSelect(opt)}
          onMouseEnter={() => setHoveredIdx(i)}
          onMouseLeave={() => setHoveredIdx(null)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '8px 14px',
            border: `1px solid ${hoveredIdx === i ? V1.teal600 : V1.ink300}`,
            background: V1.white,
            borderRadius: 0,
            cursor: 'pointer',
            fontFamily: V1.bodyFont,
            fontSize: 14,
            color: hoveredIdx === i ? V1.teal700 : V1.ink700,
            lineHeight: V1.leadingBody,
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function SystemCardBlock({ card }: { card: SystemCard }) {
  return (
    <div
      style={{
        marginLeft: 44,
        marginTop: 20,
        marginBottom: 20,
        background: V1.ink900,
        padding: 24,
        borderRadius: 0,
      }}
    >
      <div
        style={{
          fontFamily: V1.monoFont,
          fontSize: '0.7rem',
          letterSpacing: V1.trackingMono,
          textTransform: 'uppercase',
          color: V1.teal300,
          lineHeight: V1.leadingLabel,
          fontWeight: V1.fwSemibold,
        }}
      >
        {card.label}
      </div>
      <div
        style={{
          fontFamily: V1.displayFont,
          fontSize: '1.1rem',
          fontWeight: V1.fwSemibold,
          color: V1.white,
          marginTop: 8,
          marginBottom: 16,
          lineHeight: V1.leadingHeading,
        }}
      >
        {card.title}
      </div>
      {card.pills && card.pills.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {card.pills.map((pill, i) => (
            <span
              key={i}
              style={{
                border: `1px solid ${V1.teal300}`,
                color: V1.teal300,
                fontFamily: V1.monoFont,
                fontSize: '0.6rem',
                letterSpacing: V1.trackingMono,
                textTransform: 'uppercase',
                padding: '4px 8px',
                borderRadius: 0,
                lineHeight: V1.leadingLabel,
              }}
            >
              {pill}
            </span>
          ))}
        </div>
      )}
      {card.insight && (
        <div
          style={{
            marginTop: card.pills && card.pills.length > 0 ? 16 : 0,
            fontFamily: V1.displayFont,
            fontSize: 15,
            fontStyle: 'italic',
            color: 'rgba(255,255,255,0.85)',
            lineHeight: V1.leadingBody,
          }}
        >
          {card.insight}
        </div>
      )}
    </div>
  );
}

function MilestoneCardBlock({ card }: { card: MilestoneCard }) {
  return (
    <div
      style={{
        marginLeft: 44,
        marginTop: 20,
        marginBottom: 20,
        border: `1px solid ${V1.teal200}`,
        background: V1.teal50,
        padding: 16,
        borderRadius: 0,
      }}
    >
      <div
        style={{
          fontFamily: V1.monoFont,
          fontSize: '0.7rem',
          letterSpacing: V1.trackingMono,
          textTransform: 'uppercase',
          color: V1.teal700,
          lineHeight: V1.leadingLabel,
          fontWeight: V1.fwSemibold,
        }}
      >
        MILESTONE
      </div>
      <div
        style={{
          fontFamily: V1.displayFont,
          fontSize: 18,
          color: V1.teal900,
          fontWeight: V1.fwSemibold,
          marginTop: 4,
          marginBottom: 8,
          lineHeight: V1.leadingHeading,
        }}
      >
        {card.title}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <div
          style={{
            fontFamily: V1.monoFont,
            fontSize: '0.65rem',
            letterSpacing: '0.02em',
            color: V1.ink600,
            lineHeight: V1.leadingLabel,
          }}
        >
          {card.dueDate}
        </div>
        <div
          style={{
            fontFamily: V1.monoFont,
            fontSize: '0.65rem',
            letterSpacing: V1.trackingMono,
            textTransform: 'uppercase',
            color: V1.teal700,
            lineHeight: V1.leadingLabel,
            fontWeight: V1.fwSemibold,
          }}
        >
          {card.status}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <a
          href="#"
          style={{
            fontFamily: V1.bodyFont,
            fontSize: 13,
            color: V1.teal700,
            textDecoration: 'none',
            fontWeight: V1.fwMedium,
            lineHeight: V1.leadingBody,
          }}
        >
          View milestone →
        </a>
      </div>
    </div>
  );
}

function TypingIndicatorBlock() {
  return (
    <div style={{ marginTop: 28, marginLeft: 44, display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        <span
          style={{
            width: 4,
            height: 4,
            background: V1.teal600,
            animation: 'nexus-typing-bounce 1.1s infinite ease-in-out',
            animationDelay: '0ms',
            display: 'inline-block',
          }}
        />
        <span
          style={{
            width: 4,
            height: 4,
            background: V1.teal600,
            animation: 'nexus-typing-bounce 1.1s infinite ease-in-out',
            animationDelay: '160ms',
            display: 'inline-block',
          }}
        />
        <span
          style={{
            width: 4,
            height: 4,
            background: V1.teal600,
            animation: 'nexus-typing-bounce 1.1s infinite ease-in-out',
            animationDelay: '320ms',
            display: 'inline-block',
          }}
        />
      </div>
      <span
        style={{
          fontFamily: V1.monoFont,
          fontSize: '0.65rem',
          letterSpacing: V1.trackingMono,
          textTransform: 'uppercase',
          color: V1.ink400,
          lineHeight: V1.leadingLabel,
        }}
      >
        Thinking
      </span>
      <style>{`
        @keyframes nexus-typing-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export function NexusChatPageV5(): React.ReactElement {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, profile } = useAuthStore();
  const [searchParams] = useSearchParams();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const firstMessageSentRef = useRef(false);

  const codeParam = searchParams.get('code');

  // System prompt construction (matches the existing /nexus/chat pattern).
  const lensContext = useMemo(() => {
    if (!codeParam) return undefined;
    const info = ASSESSMENT_CATALOG[codeParam.toUpperCase()];
    if (!info) return undefined;
    const dimList = info.dimensions
      .map((d) => `${d.name} (${d.lowLabel} → ${d.highLabel})`)
      .join('; ');
    return [
      `=== CURRENT LENS CONTEXT ===`,
      `The user is asking about their ${info.name} (${info.code}) results.`,
      `Instrument measures ${info.dimensions.length} dimensions: ${dimList}.`,
      `Tagline: ${info.tagline}`,
      `Ground your answer in this instrument. Reference the specific dimensions by name when explaining findings.`,
    ].join('\n');
  }, [codeParam]);

  const localAssessmentContext = useMemo(() => buildLocalAssessmentContextForNexus(), []);
  const combinedContext = [lensContext, localAssessmentContext.contextString]
    .filter(Boolean)
    .join('\n\n');
  const systemPrompt = useMemo(
    () => buildNexusSystemPrompt(combinedContext).systemPrompt,
    [combinedContext],
  );

  // Active lens for the right rail — derived from URL or local history.
  const activeLensData = useMemo(() => {
    const pick = (code: string | undefined) => {
      if (!code) return undefined;
      const info = ASSESSMENT_CATALOG[code.toUpperCase()];
      if (!info) return undefined;
      return { code: info.code, name: info.b2cName || info.name, progress: 100 };
    };
    return pick(codeParam) || pick(localAssessmentContext.completedCodes[0]);
  }, [codeParam, localAssessmentContext]);

  // Persona for the right rail — derived from the member's tier.
  const activePersona = useMemo(() => {
    const personas = getAvailablePersonas(profile?.tier);
    return personas[0];
  }, [profile?.tier]);

  const autoGrow = (el: HTMLTextAreaElement) => {
    el.style.height = '44px';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  };

  // Initialize the thread with NEXUS's first response (same pattern as the
  // existing /nexus/chat page — no sample data).
  useEffect(() => {
    trackNexusChatInitiation('direct_link');
    const base = buildNexusFirstResponse(profile?.name);
    const assessmentProgress = getAssessmentProgress();
    let greeting = base;
    if (assessmentProgress.completed > 0) {
      const progressLine = `\n\nYou've completed ${assessmentProgress.completed} of ${assessmentProgress.total} assessments on this device.`;
      let recLine = '';
      const nextRecommendation = recommendNextAssessment();
      if (nextRecommendation) {
        recLine = `\nBased on your history, I'd suggest **${nextRecommendation.name}** next — ${nextRecommendation.reason}`;
      }
      greeting = base + progressLine + recLine;
    }
    setMessages([
      { type: 'date', id: 'today', date: todayLabel() },
      { type: 'bot', id: 'welcome', paragraphs: toParagraphs(greeting), time: nowTime('NEXUS') },
      { type: 'chips', id: 'quick-replies', options: NEXUS_FIRST_RESPONSE_QUICK_REPLIES },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.name]);

  // Auto-scroll on new messages / loading.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = async (messageText?: string) => {
    const text = (messageText || inputValue).trim();
    if (!text || loading) return;
    if (messageText) {
      trackCTA({
        location: 'nexus_chat',
        label: 'Quick Reply',
        destination: undefined,
        context_id: messageText.slice(0, 80),
      });
    }
    const userMsg: UserMessage = {
      type: 'user',
      id: `u-${Date.now()}`,
      text,
      time: nowTime('You'),
    };
    const typingId = `t-${Date.now()}`;
    // Drop any chips / stale typing before appending the user msg + fresh typing.
    setMessages((prev) => {
      const cleaned = prev.filter((m) => m.type !== 'typing' && m.type !== 'chips');
      return [...cleaned, userMsg, { type: 'typing', id: typingId }];
    });
    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
    }
    setLoading(true);
    try {
      const userId =
        user?.id ||
        'guest-' + (localStorage.getItem('nexus_guest_id') || Math.random().toString(36).slice(2));
      const history = messages
        .filter((m) => m.type === 'user' || m.type === 'bot')
        .slice(-10)
        .map((m) => ({
          role: m.type === 'user' ? 'user' : 'assistant',
          content: m.type === 'user' ? m.text : m.paragraphs.join('\n\n'),
        }));
      const response = await sendChatMessage(
        text,
        userId,
        history,
        systemPrompt ? { systemPrompt } : undefined,
      );
      setMessages((prev) => {
        const withoutTyping = prev.filter((m) => m.id !== typingId);
        return [
          ...withoutTyping,
          {
            type: 'bot',
            id: `b-${Date.now()}`,
            paragraphs: toParagraphs(response),
            time: nowTime('NEXUS'),
          },
        ];
      });
      if (!firstMessageSentRef.current) {
        firstMessageSentRef.current = true;
        trackNexusFirstMessageSent('coze-gpt-4o');
      }
    } catch (e) {
      reportError(e, { scope: 'nexus_v5:sendChatMessage', severity: 'warning' });
      setMessages((prev) => {
        const withoutTyping = prev.filter((m) => m.id !== typingId);
        return [
          ...withoutTyping,
          {
            type: 'bot',
            id: `b-err-${Date.now()}`,
            paragraphs: ['Something went wrong. Please try again in a moment.'],
            time: nowTime('NEXUS'),
          },
        ];
      });
    }
    setLoading(false);
  };

  const handleChipSelect = (text: string) => {
    sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{ display: 'flex', gap: 0, minHeight: 'calc(100vh - 0px)' }}>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 'calc(100vh - 0px)',
          position: 'relative',
          background: V1.white,
        }}
      >
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            background: V1.white,
            borderBottom: `1px solid ${V1.ink100}`,
            padding: '12px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span
              style={{
                fontFamily: V1.monoFont,
                fontSize: '0.7rem',
                letterSpacing: V1.trackingMono,
                textTransform: 'uppercase',
                color: V1.teal600,
                lineHeight: V1.leadingLabel,
                fontWeight: V1.fwSemibold,
              }}
            >
              Conversation
            </span>
            <span style={{ color: V1.ink300, fontFamily: V1.bodyFont }}>·</span>
            <span
              style={{
                fontFamily: V1.displayFont,
                fontSize: 15,
                fontStyle: 'italic',
                color: V1.ink600,
                lineHeight: V1.leadingBody,
              }}
            >
              Single continuous thread
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontFamily: V1.monoFont,
                fontSize: '0.7rem',
                letterSpacing: V1.trackingMono,
                textTransform: 'uppercase',
                color: V1.ink500,
                lineHeight: V1.leadingLabel,
              }}
            >
              Export
            </button>
            <span style={{ color: V1.ink300, fontFamily: V1.bodyFont }}>•</span>
            <button
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontFamily: V1.monoFont,
                fontSize: '0.7rem',
                letterSpacing: V1.trackingMono,
                textTransform: 'uppercase',
                color: V1.ink500,
                lineHeight: V1.leadingLabel,
              }}
            >
              Share →
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '32px 24 24px 24px',
          }}
        >
          <div style={{ maxWidth: 820, margin: '0 auto' }}>
            <ConversationContextBar />
            {messages.map((row) => {
              switch (row.type) {
                case 'date':
                  return <DateSeparator key={row.id} date={row.date} />;
                case 'bot':
                  return <BotMessageBlock key={row.id} msg={row} />;
                case 'user':
                  return <UserMessageBlock key={row.id} msg={row} />;
                case 'chips':
                  return <OptionChipsBlock key={row.id} chips={row} onSelect={handleChipSelect} />;
                case 'system':
                  return <SystemCardBlock key={row.id} card={row} />;
                case 'milestone':
                  return <MilestoneCardBlock key={row.id} card={row} />;
                case 'typing':
                  return <TypingIndicatorBlock key={row.id} />;
                default:
                  return null;
              }
            })}
          </div>
        </div>

        <div
          style={{
            flexShrink: 0,
            borderTop: `1px solid ${V1.ink100}`,
            background: V1.white,
            padding: '16px 24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  autoGrow(e.target);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Write to Nexus…"
                rows={1}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  border: `1px solid ${V1.ink200}`,
                  borderRadius: 0,
                  padding: '12px 16px',
                  fontFamily: V1.bodyFont,
                  fontSize: 15,
                  color: V1.ink900,
                  lineHeight: V1.leadingBody,
                  minHeight: 44,
                  maxHeight: 200,
                  resize: 'vertical',
                  outline: 'none',
                  background: V1.white,
                  transition: `border-color ${V1.durFast}ms ${V1.ease}`,
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = V1.teal600)}
                onBlur={(e) => (e.currentTarget.style.borderColor = V1.ink200)}
              />
              <div style={{ marginTop: 4 }}>
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    fontFamily: V1.monoFont,
                    fontSize: '0.65rem',
                    letterSpacing: V1.trackingMono,
                    textTransform: 'uppercase',
                    color: V1.teal600,
                    lineHeight: V1.leadingLabel,
                  }}
                >
                  + File
                </button>
              </div>
            </div>
            <button
              onClick={sendMessage}
              style={{
                alignSelf: 'flex-end',
                padding: '10px 20px',
                background: V1.ink900,
                color: V1.white,
                fontFamily: V1.monoFont,
                fontSize: '0.7rem',
                letterSpacing: V1.trackingMono,
                textTransform: 'uppercase',
                borderRadius: 0,
                border: 'none',
                cursor: 'pointer',
                lineHeight: V1.leadingLabel,
                fontWeight: V1.fwSemibold,
                transition: `background-color ${V1.durFast}ms ${V1.ease}`,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = V1.teal900)}
              onMouseLeave={(e) => (e.currentTarget.style.background = V1.ink900)}
            >
              Send
            </button>
          </div>
        </div>
      </div>

      <ChatRightRail
        mode="regular"
        persona={activePersona}
        activeLens={activeLensData}
        recentMilestones={[]}
      />
    </div>
  );
}

export default NexusChatPageV5;
