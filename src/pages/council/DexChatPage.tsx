import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Sparkles, MessageCircle, CreditCard, Loader2, Lock, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

/**
 * DEX AI Chat Page (D1) — auth required.
 *
 * Progressive gating:
 *  - Messages 1–5: Executive Introduction (Complimentary)
 *  - Message 6 with credits: soft gate banner, deducts 1 credit per message
 *  - Message 6+ with 0 credits: hard gate, must purchase
 *
 * Brand rules:
 *  - NEVER use "free" — use "Executive Introduction" or "Complimentary"
 *  - DEX AI is the product name
 */

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const INTRO_MESSAGE_LIMIT = 5;

const SUGGESTED_PROMPTS = [
  'What is my market value as a VP of Engineering?',
  'How do I negotiate a CTO offer at a Series D startup?',
  'Should I take a board seat at a growth-stage company?',
  'What is the typical career path from VP to COO?',
];

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Welcome to DEX AI — your executive advisory assistant. Ask me anything about career strategy, compensation benchmarking, leadership development, market intelligence, or industry analysis. Your first 5 messages are part of your Complimentary Executive Introduction.",
  timestamp: Date.now(),
};

/**
 * Lightweight mock AI response. In production this is replaced by an SSE
 * stream from /api/chat (DeepSeek routing). Kept self-contained for the page.
 */
function buildMockResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();
  if (lower.includes('salary') || lower.includes('compensation') || lower.includes('negotiate')) {
    return `For a role at your seniority, here is the typical compensation landscape I am seeing in the market right now:

1. Base salary tends to land in the 75th–90th percentile of your peer band, with equity comprising 30–50% of total compensation at growth-stage companies.
2. Sign-on bonuses are increasingly common as a smoothing mechanism for forfeited equity.
3. Severance and acceleration clauses are negotiable — particularly the single-trigger vs. double-trigger distinction.

Want me to model two scenarios for you so you can compare?`;
  }
  if (lower.includes('career') || lower.includes('path') || lower.includes('next')) {
    return `Here is how I would frame your next move:

- Anchor on the role that gives you the most decision rights, not the most title.
- Look for scope expansion (P&L, headcount, geography) over lateral prestige moves.
- Sequence: 18–24 months in a stretch role, then a step-up where you can repeat the pattern.

Tell me about your current scope and I will benchmark it against typical trajectories.`;
  }
  return `That is a strong question. Here is my executive take:

- The right answer depends on your timeline, risk tolerance, and the optionality you currently hold.
- I would not optimize for the single best outcome — I would optimize for the best distribution of outcomes.
- Concretely: list your top 3 constraints, then we can pressure-test each assumption together.

What is the constraint that is hardest to change?`;
}

function formatTime(ts: number): string {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

type GateState = 'intro' | 'soft' | 'hard';

export function DexChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [creditBalance, setCreditBalance] = useState(0);
  const [showHardGate, setShowHardGate] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Welcome message does not count toward the 5-message Executive Introduction.
  const userMessageCount = useMemo(
    () => messages.filter((m) => m.role === 'user').length,
    [messages]
  );

  const introRemaining = Math.max(0, INTRO_MESSAGE_LIMIT - userMessageCount);

  const gateState: GateState = useMemo(() => {
    if (userMessageCount < INTRO_MESSAGE_LIMIT) return 'intro';
    if (creditBalance > 0) return 'soft';
    return 'hard';
  }, [userMessageCount, creditBalance]);

  // Auto-scroll to the latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, isResponding]);

  const canSend = input.trim().length > 0 && !isResponding && gateState !== 'hard';

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isResponding) return;

    // Hard gate: no intro left and no credits.
    if (gateState === 'hard') {
      setShowHardGate(true);
      return;
    }

    // Soft gate: also block if somehow we are out of credits past intro.
    if (gateState === 'soft' && creditBalance <= 0) {
      setShowHardGate(true);
      return;
    }

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsResponding(true);

    // Deduct a credit once Executive Introduction is exhausted.
    if (gateState === 'soft') {
      setCreditBalance((b) => Math.max(0, b - 1));
    }

    // Simulate streaming response delay.
    await new Promise((r) => setTimeout(r, 700));

    const aiMsg: ChatMessage = {
      id: `a-${Date.now()}`,
      role: 'assistant',
      content: buildMockResponse(text),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, aiMsg]);
    setIsResponding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggested = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div
      className="h-screen flex flex-col bg-[#F7F7F7] text-[#1C1C1C]"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      {/* Header */}
      <header className="bg-white border-b border-[#E5E5E5] flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 bg-[#C108AB] flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <div
                className="text-base font-bold text-[#1C1C1C] leading-tight truncate"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                DEX AI
              </div>
              <div className="text-[11px] text-[#A3A3A3] leading-tight truncate">
                Executive Advisory
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Executive Introduction badge */}
            {gateState === 'intro' && (
              <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-[rgba(193,8,171,0.08)] text-[#C108AB] text-[11px] font-semibold uppercase tracking-wide">
                <Sparkles className="w-3 h-3" />
                Executive Introduction · {introRemaining} left
              </div>
            )}

            {/* Credit balance */}
            <a
              href="/dex/credits"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-[#E5E5E5] text-xs font-semibold text-[#1C1C1C] no-underline hover:border-[#C108AB]/40 transition-colors"
              title="View credit store"
            >
              <CreditCard className="w-3.5 h-3.5 text-[#C108AB]" />
              <span>{creditBalance}</span>
              <span className="text-[#A3A3A3] font-normal">credits</span>
            </a>
          </div>
        </div>

        {/* Mobile-only intro badge row */}
        {gateState === 'intro' && (
          <div className="sm:hidden px-4 pb-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[rgba(193,8,171,0.08)] text-[#C108AB] text-[11px] font-semibold uppercase tracking-wide">
              <Sparkles className="w-3 h-3" />
              Executive Introduction · {introRemaining} left
            </div>
          </div>
        )}
      </header>

      {/* Soft gate banner */}
      {gateState === 'soft' && (
        <div className="bg-[rgba(193,8,171,0.06)] border-b border-[rgba(193,8,171,0.20)] flex-shrink-0">
          <div className="max-w-4xl mx-auto px-4 md:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-[#C108AB] flex-shrink-0 mt-0.5" />
              <div className="text-xs text-[#1C1C1C] leading-relaxed">
                <span className="font-semibold">You have completed your Executive Introduction.</span>{' '}
                Each additional message uses 1 DEX AI credit ({creditBalance} remaining).
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                size="sm"
                onClick={() => (window.location.href = '/dex/credits')}
              >
                <CreditCard className="w-3.5 h-3.5" />
                Get Credits
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => (window.location.href = '/council/membership')}
              >
                Explore Council
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
          {messages.length === 1 && (
            <div className="mb-6">
              <div className="bg-white border border-[#E5E5E5] p-5 mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <MessageCircle className="w-4 h-4 text-[#C108AB]" />
                  <h3
                    className="text-sm font-semibold text-[#1C1C1C]"
                    style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                  >
                    Try one of these
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SUGGESTED_PROMPTS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleSuggested(p)}
                      className="text-left text-sm text-[#525252] px-3 py-2.5 bg-[#F7F7F7] border border-transparent hover:border-[#C108AB]/30 hover:bg-white transition-colors"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-5">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}

            {isResponding && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#C108AB] flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white border border-[#E5E5E5] px-4 py-3 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 text-[#A3A3A3] animate-spin" />
                  <span className="text-xs text-[#A3A3A3]">DEX AI is thinking…</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

      {/* Input */}
      <footer className="bg-white border-t border-[#E5E5E5] flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4">
          {gateState === 'hard' ? (
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
              <div className="flex items-center gap-2 text-sm text-[#1C1C1C]">
                <Lock className="w-4 h-4 text-[#C108AB]" />
                <span>Credits required to continue. Your Executive Introduction is complete.</span>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  className="w-full sm:w-auto"
                  onClick={() => (window.location.href = '/dex/credits')}
                >
                  <CreditCard className="w-4 h-4" />
                  Get Credits
                </Button>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => (window.location.href = '/council/membership')}
                >
                  Explore Council
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask DEX AI anything about your career…"
                disabled={isResponding}
                aria-label="Message DEX AI"
                autoFocus
              />
              <Button
                onClick={handleSend}
                disabled={!canSend}
                aria-label="Send message"
                className="flex-shrink-0"
              >
                {isResponding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">Send</span>
                  </>
                )}
              </Button>
            </div>
          )}
          <div className="mt-2 text-[11px] text-[#A3A3A3] flex items-center justify-between">
            <span>
              {gateState === 'intro'
                ? `${introRemaining} Complimentary messages remaining in your Executive Introduction.`
                : gateState === 'soft'
                ? `${creditBalance} DEX AI credits remaining. Each message uses 1 credit.`
                : 'Purchase credits or join The Council to continue.'}
            </span>
            <span className="hidden sm:inline">Press Enter to send</span>
          </div>
        </div>
      </footer>

      {/* Hard gate modal */}
      {showHardGate && (
        <HardGateModal
          onClose={() => setShowHardGate(false)}
          onGetCredits={() => (window.location.href = '/dex/credits')}
          onExploreCouncil={() => (window.location.href = '/council/membership')}
        />
      )}
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`w-8 h-8 flex items-center justify-center flex-shrink-0 ${
          isUser ? 'bg-[#1C1C1C]' : 'bg-[#C108AB]'
        }`}
      >
        {isUser ? (
          <span className="text-xs font-bold text-white">You</span>
        ) : (
          <Sparkles className="w-4 h-4 text-white" />
        )}
      </div>
      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? 'bg-[#C108AB] text-white'
              : 'bg-white border border-[#E5E5E5] text-[#1C1C1C]'
          }`}
        >
          {message.content}
        </div>
        <div className="text-[10px] text-[#A3A3A3] mt-1 px-1">{formatTime(message.timestamp)}</div>
      </div>
    </div>
  );
}

function HardGateModal({
  onClose,
  onGetCredits,
  onExploreCouncil,
}: {
  onClose: () => void;
  onGetCredits: () => void;
  onExploreCouncil: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hard-gate-title"
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#E5E5E5] max-w-md w-full p-7 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 text-[#A3A3A3] hover:text-[#1C1C1C] p-1"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="w-11 h-11 bg-[rgba(193,8,171,0.08)] flex items-center justify-center mb-4">
          <Lock className="w-5 h-5 text-[#C108AB]" />
        </div>
        <h3
          id="hard-gate-title"
          className="text-lg font-bold text-[#1C1C1C] mb-2"
          style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
        >
          Credits required
        </h3>
        <p className="text-sm text-[#525252] leading-relaxed mb-5">
          Your Complimentary Executive Introduction is complete. Purchase DEX AI credits
          to continue this conversation, or explore Council membership for coaching,
          events, and a community of peers.
        </p>
        <div className="bg-[#F7F7F7] border border-[#E5E5E5] px-3 py-2 mb-5 text-xs text-[#525252] flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-[#A3A3A3]" />
            Current balance
          </span>
          <span className="font-semibold text-[#1C1C1C]">0 DEX AI credits</span>
        </div>
        <div className="flex flex-col gap-2">
          <Button onClick={onGetCredits} className="w-full">
            <CreditCard className="w-4 h-4" />
            Get Credits — from $9.99
          </Button>
          <Button variant="outline" onClick={onExploreCouncil} className="w-full">
            Explore Council Membership
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
