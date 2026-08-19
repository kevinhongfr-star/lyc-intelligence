import React, { useRef, useState } from 'react';
import { V1 } from '@/styles/v1-tokens';
import ChatRightRail from '@/components/nexus/ChatRightRail';
import { ConversationContextBar, DateSeparator } from '@/components/nexus/SingleConversationView';

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

const sampleMessages: MessageRow[] = [
  { type: 'date', id: 'd1', date: 'Yesterday · Aug 18, 2026' },
  {
    type: 'bot',
    id: 'b1',
    paragraphs: [
      'Good morning. I\'ve reviewed your notes from the offsite — there\'s a throughline in what you\'re grappling with. The transition you\'re managing isn\'t just structural; it\'s a shift in how the regional team perceives authority and direction.',
      'Before we dig deeper, let me make sure I have the frame right. You\'re six weeks into a broader APAC remit, reporting now to the CFO instead of the regional VP. Two direct reports have resigned since the announcement. And your board readout is in three weeks.',
    ],
    time: 'NEXUS · 9:14 AM',
  },
  {
    type: 'chips',
    id: 'c1',
    options: [
      'Tell me more about my PRISM readout',
      'Walk me through my milestones',
      'Start a new lens',
    ],
  },
  {
    type: 'system',
    id: 's1',
    label: 'LENS ACTIVATED',
    title: 'PRISM · Professional branding',
    pills: ['POSITIONING', 'VOICE', 'STORY', 'PRESENCE'],
    insight: 'Starting PRISM adds 12 dimensions to your profile. We\'ll ask 28 questions across 4 categories — expect 12–15 minutes.',
  },
  {
    type: 'bot',
    id: 'b2',
    paragraphs: [
      'PRISM is designed to surface gaps between how you see yourself and how others experience your leadership. Based on your 360 data, there\'s a specific tension worth examining first.',
      'Your self-assessment rates "direct communication" at 4.6/5. But peer and direct-report scores cluster around 3.2 on the same dimension. The qualitative comments are consistent: they describe your communication as "thoughtful but hard to parse" and "confident when written, indirect in person."',
    ],
    time: 'NEXUS · 9:16 AM',
  },
  {
    type: 'user',
    id: 'u1',
    text: 'That tracks. I\'ve always preferred writing things down — I process better that way. But in regional standups, I feel like I\'m searching for the right words while everyone\'s waiting.',
    time: 'You · 9:21 AM',
  },
  {
    type: 'bot',
    id: 'b3',
    paragraphs: [
      'That\'s not a defect in how you communicate. It\'s a mismatch between your cognitive style and the format expected of you. Reflective writers don\'t perform well in rooms that reward quick, decisive verbal turns — especially when the room is watching for signals of authority.',
      'There\'s a specific intervention worth testing. Instead of opening standups with "what happened yesterday" — which puts you on the spot for spontaneous synthesis — try circulating a one-page memo the night before. Then open the standup with "what would you challenge in what I wrote?"',
    ],
    time: 'NEXUS · 9:23 AM',
  },
  {
    type: 'system',
    id: 's2',
    label: 'MILESTONE CREATED',
    title: 'Improve stakeholder alignment',
    pills: [],
    insight: 'Milestone added to your Q3 plan. First checkpoint in two weeks.',
  },
  {
    type: 'milestone',
    id: 'm1',
    title: 'Improve stakeholder alignment',
    dueDate: 'Due · Oct 15, 2026',
    status: 'On track',
  },
  {
    type: 'bot',
    id: 'b4',
    paragraphs: [
      'I\'ve extracted this as a concrete milestone with a specific first action: circulate three pre-written memos before your next three regional standups. We\'ll measure the difference in engagement quality and decision velocity.',
      'Between now and next week, I\'ll surface three short exercises — five minutes each — drawn from PRISM\'s Voice dimension. They\'re designed to build a tighter linkage between your written and spoken presence so that the memo and the room align rather than compete.',
    ],
    time: 'NEXUS · 9:25 AM',
  },
  { type: 'date', id: 'd2', date: 'Today · Aug 19, 2026' },
  {
    type: 'bot',
    id: 'b5',
    paragraphs: [
      'Good morning. I\'ve been thinking about what we covered yesterday. There\'s something in the offsite notes I want to raise — something that connects the resignations to the memo approach.',
      'The two people who resigned both made the same remark in exit interviews: they "didn\'t know where you stood" on priorities. That\'s not a content problem. It\'s a signalling problem. The pre-meeting memo doesn\'t just help you think — it broadcasts your stance before the room starts negotiating.',
    ],
    time: 'NEXUS · 10:42 AM',
  },
  {
    type: 'user',
    id: 'u2',
    text: 'I sent the first memo last night. It went over better than I expected. One direct report pushed back on a timeline — but in a way that felt constructive, not oppositional.',
    time: 'You · 10:43 AM',
  },
  {
    type: 'bot',
    id: 'b6',
    paragraphs: [
      'That\'s the pattern we want to repeat. Constructive pushback means the memo gave them something specific to push against — rather than trying to read ambiguity in your tone or body language.',
      'Let me ask a harder question. When you read the pushback, what did you feel? Relief? Annoyance? Something else? The answer tells us where to go next in PRISM.',
    ],
    time: 'NEXUS · 10:45 AM',
  },
  { type: 'typing', id: 't1' },
];

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
  const [messages, setMessages] = useState<MessageRow[]>(sampleMessages);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const autoGrow = (el: HTMLTextAreaElement) => {
    el.style.height = '44px';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  };

  const sendMessage = () => {
    const text = inputValue.trim();
    if (!text) return;
    const now = new Date();
    const hh = now.getHours();
    const mm = now.getMinutes().toString().padStart(2, '0');
    const ampm = hh >= 12 ? 'PM' : 'AM';
    const h12 = ((hh + 11) % 12) + 1;
    const userMsg: UserMessage = {
      type: 'user',
      id: `u-new-${Date.now()}`,
      text,
      time: `You · ${h12}:${mm} ${ampm}`,
    };
    const beforeTyping = messages.filter((m) => m.type !== 'typing');
    setMessages([...beforeTyping, userMsg, { type: 'typing', id: `t-new-${Date.now()}` }]);
    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
    }
    setTimeout(() => {
      setMessages((prev) => {
        const withoutTyping = prev.filter((m) => m.type !== 'typing');
        return [
          ...withoutTyping,
          {
            type: 'bot',
            id: `b-new-${Date.now()}`,
            paragraphs: [
              `That's a useful framing. Let me ground this in what you've already shared and pull the relevant threads together.`,
            ],
            time: `NEXUS · ${h12}:${mm} ${ampm}`,
          },
        ];
      });
    }, 1600);
  };

  const handleChipSelect = (text: string) => {
    setInputValue(text);
    if (textareaRef.current) {
      textareaRef.current.focus();
      autoGrow(textareaRef.current);
    }
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
        activeLens={{
          code: 'PRISM',
          name: 'Professional branding',
          progress: 32,
        }}
        recentMilestones={[
          { title: 'Improve stakeholder alignment', status: 'on_track' },
          { title: 'Board impact narrative', status: 'at_risk' },
          { title: 'Q3 leadership transition', status: 'pending' },
        ]}
      />
    </div>
  );
}

export default NexusChatPageV5;
