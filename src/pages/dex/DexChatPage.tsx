/**
 * DexChatPage — B2C chat interface for DEX AI (S2-T02 / S2-T03)
 *
 * Connects to the DeepSeek-backed /api/chat endpoint, persists conversation
 * to localStorage, and applies tier gating:
 *   - Executive Introduction: first 5 messages complimentary (no credits)
 *   - After 5: 1 credit per message (soft gate → hard gate when depleted)
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Send, Sparkles, Loader2, ArrowLeft, AlertCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useCredits } from '@/contexts/CreditContext';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  ts: number;
}

const INTRO_LIMIT = 5; // Executive Introduction = 5 complimentary messages
const STORAGE_KEY = 'dex_conversation_v1';

export function DexChatPage() {
  const user = useAuthStore(s => s.user);
  const { credit, deductCredit, refreshCredits } = useCredits();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showHardGate, setShowHardGate] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load persisted conversation
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ChatMessage[];
        if (Array.isArray(parsed)) setMessages(parsed);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Persist conversation
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-50)));
    } catch {
      /* ignore */
    }
  }, [messages]);

  // Refresh credits on mount
  useEffect(() => {
    refreshCredits();
  }, [refreshCredits]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Determine gate state: 'intro' (complimentary), 'soft' (credit needed), 'hard' (depleted)
  const userMsgCount = useMemo(() => messages.filter(m => m.role === 'user').length, [messages]);
  const gateState: 'intro' | 'soft' | 'hard' = useMemo(() => {
    if (userMsgCount < INTRO_LIMIT) return 'intro';
    if (credit.balance >= 1) return 'soft';
    return 'hard';
  }, [userMsgCount, credit.balance]);

  const remainingIntro = Math.max(0, INTRO_LIMIT - userMsgCount);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    // Hard gate: out of credits
    if (gateState === 'hard') {
      setShowHardGate(true);
      return;
    }

    // Soft gate: deduct a credit once Executive Introduction is exhausted
    if (gateState === 'soft') {
      const ok = await deductCredit(1, 'DEX AI message');
      if (!ok) {
        setShowHardGate(true);
        return;
      }
    }

    const userMsg: ChatMessage = { role: 'user', content: text, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSending(true);

    // Build history for the API (last 10 turns)
    const history = [...messages, userMsg]
      .slice(-20)
      .map(m => ({ role: m.role, content: m.content }));

    // API tier hint
    const apiTier =
      gateState === 'intro' ? 'intro' : credit.tier === 'enterprise' ? 'pro' : 'standard';

    let replyText = '';
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history,
          userId: user?.id,
          tier: apiTier,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { response?: string; error?: string };
      replyText = (data.response || '').trim();
      if (!replyText) {
        replyText = data.error
          ? `Sorry, I couldn't process that right now. (${data.error})`
          : "Sorry, I didn't get a response. Please try again.";
      }
    } catch (err) {
      console.warn('[DexChatPage] /api/chat failed:', err);
      replyText =
        'I am having trouble connecting right now. Please check your connection and try again in a moment.';
    }

    const assistantMsg: ChatMessage = { role: 'assistant', content: replyText, ts: Date.now() };
    setMessages(prev => [...prev, assistantMsg]);
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <a href="/dex-ai" className="text-gray-500 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" />
          </a>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-fuchsia flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-semibold text-sm">DEX AI</div>
              <div className="text-[10px] text-gray-400">Executive Advisory</div>
            </div>
          </div>
        </div>
        {/* Credit / intro status */}
        <div className="flex items-center gap-2 text-xs">
          {gateState === 'intro' ? (
            <span className="px-2.5 py-1 bg-fuchsia-50 text-fuchsia-600 font-medium">
              {remainingIntro} complimentary messages left
            </span>
          ) : (
            <span className="px-2.5 py-1 bg-gray-100 text-gray-500 font-medium flex items-center gap-1">
              <Zap className="w-3 h-3 text-fuchsia" /> {credit.balance} credits
            </span>
          )}
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <div className="w-14 h-14 bg-fuchsia/15 text-fuchsia flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7" />
              </div>
              <h2
                className="text-2xl font-bold mb-2"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                Welcome to your Executive Introduction
              </h2>
              <p className="text-sm text-gray-400 max-w-md mx-auto">
                Ask me anything about your career trajectory, compensation, or next move. Your first
                5 messages are complimentary.
              </p>
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-fuchsia text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="bg-gray-100 px-4 py-3 text-sm text-gray-400 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> DEX AI is thinking…
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hard gate banner */}
      {showHardGate && (
        <div className="px-4 md:px-6 py-3 bg-fuchsia-50 border-t border-fuchsia/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-fuchsia-600">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            You are out of credits. Get more to continue the conversation.
          </div>
          <a href="/dex/credits">
            <Button size="sm">Get Credits</Button>
          </a>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 px-4 md:px-6 py-4 flex-shrink-0">
        <div className="max-w-3xl mx-auto flex items-end gap-3">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Ask DEX AI about your career, compensation, or next move…"
            className="flex-1 bg-white text-gray-900 text-sm px-4 py-3 resize-none border border-gray-200 focus:outline-none focus:ring-1 focus:ring-fuchsia placeholder:text-gray-400 min-h-[48px] max-h-40"
            disabled={sending}
          />
          <Button onClick={handleSend} disabled={sending || !input.trim()} className="flex-shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[10px] text-gray-400 text-center mt-2">
          DEX AI provides advisory guidance, not legal or financial advice.
        </p>
      </div>
    </div>
  );
}

export default DexChatPage;
