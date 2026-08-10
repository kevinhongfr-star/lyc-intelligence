import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles, ArrowRight, LogIn } from 'lucide-react';
import { sendChatMessage } from '@/services/coze';
import { useAuthStore } from '@/stores/authStore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link, useNavigate } from 'react-router-dom';

interface Message { role: 'user' | 'assistant'; content: string; suggested_prompts?: string[]; }

const GUEST_MESSAGE_LIMIT = 3;
const GUEST_STORAGE_KEY = 'nexus_guest_messages';

const SUGGESTED_PROMPTS = [
  'How do I position for a cross-border executive role?',
  'What makes a standout leadership profile?',
  'How should I prepare for a board interview?',
  'What do boards look for in a C-suite candidate?',
];

const customComponents = {
  table: ({ children }: any) => (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full border-collapse border border-gray-200">
        {children}
      </table>
    </div>
  ),
  th: ({ children }: any) => (
    <th className="border border-gray-200 bg-gray-50 px-4 py-2 font-semibold text-sm text-gray-900 text-left">
      {children}
    </th>
  ),
  td: ({ children }: any) => (
    <td className="border border-gray-200 px-4 py-2 text-sm text-gray-700">
      {children}
    </td>
  ),
  tr: ({ children }: any) => (
    <tr className="even:bg-gray-50">{children}</tr>
  ),
  code: ({ inline, className, children, ...props }: any) => {
    if (inline) return <code className="bg-gray-100 px-1.5 py-0.5 text-xs font-mono text-primary" {...props}>{children}</code>;
    return (
      <pre className="bg-gray-900 p-4 overflow-x-auto my-3 text-xs font-mono text-gray-100">
        <code className={className} {...props}>{children}</code>
      </pre>
    );
  },
  ul: ({ children }: any) => <ul className="list-disc pl-5 space-y-1.5 text-gray-700 my-2">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-5 space-y-1.5 text-gray-700 my-2">{children}</ol>,
  li: ({ children }: any) => <li className="text-gray-700">{children}</li>,
  a: ({ href, children }: any) => <a href={href} className="text-primary underline hover:text-primary-hover" target="_blank" rel="noopener noreferrer">{children}</a>,
  p: ({ children }: any) => <p className="text-gray-700 mb-3 last:mb-0 leading-relaxed">{children}</p>,
  h1: ({ children }: any) => <h1 className="text-xl font-serif font-bold text-gray-900 mb-3 mt-4">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-lg font-serif font-bold text-gray-900 mb-2 mt-4">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-base font-semibold text-gray-900 mb-1.5 mt-3">{children}</h3>,
  strong: ({ children }: any) => <strong className="font-semibold text-gray-900">{children}</strong>,
  em: ({ children }: any) => <em className="italic text-gray-600">{children}</em>,
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

export function NexusPage() {
  const { user, profile } = useAuthStore();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [guestCount, setGuestCountState] = useState(0);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isGuest = !user;
  const remaining = isGuest ? Math.max(0, GUEST_MESSAGE_LIMIT - guestCount) : Infinity;
  const showGuestLimit = isGuest && guestCount >= GUEST_MESSAGE_LIMIT;

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

    setInput('');
    setSuggestedPrompts([]);
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    try {
      const response = await sendChatMessage(
        text,
        user?.id || 'guest-' + (localStorage.getItem('nexus_guest_id') || Math.random().toString(36).slice(2)),
        messages.slice(-10).map(m => ({ role: m.role, content: m.content }))
      );
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting right now. Please try again in a moment." }]);
    }
    setLoading(false);

    if (isGuest) {
      const newCount = guestCount + 1;
      setGuestCountState(newCount);
      setGuestCount(newCount);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-serif text-lg font-bold text-gray-900 leading-tight">NEXUS</h1>
              <p className="text-xs text-gray-500 tracking-wider uppercase">Executive Advisory</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isGuest ? (
              <Link
                to="/login"
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1.5 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Sign in
              </Link>
            ) : (
              <div className="text-sm text-gray-500">
                {profile?.first_name || user?.email}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Chat area */}
      <main className="flex-1 flex flex-col max-w-4xl w-full mx-auto px-6 py-8">
        {messages.length === 0 ? (
          /* Welcome screen */
          <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
            <div className="w-16 h-16 bg-primary/5 flex items-center justify-center mb-6">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <h2 className="font-serif text-3xl font-bold text-gray-900 mb-3">
              Executive advisory, on demand.
            </h2>
            <p className="text-gray-600 max-w-lg mb-8 leading-relaxed">
              Nexus is calibrated on 500+ executive placements across 47 markets.
              Ask about career positioning, cross-border leadership, board readiness,
              or executive transition strategy.
            </p>
            {isGuest && (
              <p className="text-sm text-gray-400 mb-8">
                {GUEST_MESSAGE_LIMIT} complimentary messages — no account required
              </p>
            )}
            <div className="grid grid-cols-2 gap-3 w-full max-w-2xl">
              {SUGGESTED_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => send(prompt)}
                  className="text-left p-4 bg-white border border-gray-200 hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <p className="text-sm text-gray-700 group-hover:text-gray-900 leading-relaxed">
                    {prompt}
                  </p>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary mt-2 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Messages */
          <div className="flex-1 space-y-8 pb-6">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${m.role === 'user' ? 'order-1' : ''}`}>
                  {m.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-primary/10 flex items-center justify-center">
                        <Sparkles className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nexus</span>
                    </div>
                  )}
                  <div
                    className={`px-5 py-4 text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-primary text-white'
                        : 'bg-gray-50 border border-gray-100 text-gray-800'
                    }`}
                  >
                    {m.role === 'assistant' ? (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={customComponents}
                      >
                        {m.content}
                      </ReactMarkdown>
                    ) : (
                      m.content
                    )}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[80%]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-primary/10 flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nexus</span>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 px-5 py-4 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm text-gray-500">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}

        {/* Guest limit banner */}
        {showGuestLimit && (
          <div className="border border-primary/20 bg-primary/5 p-6 mb-4">
            <h3 className="font-serif text-lg font-bold text-gray-900 mb-2">
              Unlock the full experience
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Create an Executive Introduction account for 5 daily credits,
              full assessments, personalized insights, and saved conversation history.
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors"
            >
              Create account <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Input */}
        <div className="mt-auto">
          {isGuest && remaining > 0 && remaining < GUEST_MESSAGE_LIMIT && (
            <div className="text-xs text-gray-400 mb-2 text-center">
              {remaining} complimentary message{remaining === 1 ? '' : 's'} remaining
            </div>
          )}
          <div className="relative border border-gray-200 focus-within:border-primary transition-colors bg-white">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={showGuestLimit ? "Create an account to continue..." : "Ask Nexus about career strategy, leadership positioning, board readiness..."}
              disabled={showGuestLimit || loading}
              rows={1}
              className="w-full px-4 py-3 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none resize-none disabled:opacity-50 font-sans leading-relaxed"
              style={{ minHeight: '48px', maxHeight: '150px' }}
            />
            <div className="absolute right-2 bottom-2">
              <button
                onClick={() => send()}
                disabled={loading || !input.trim() || showGuestLimit}
                className="w-9 h-9 bg-primary hover:bg-primary-hover text-white flex items-center justify-center disabled:opacity-40 disabled:hover:bg-primary transition-colors"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">
            Nexus may produce inaccurate information. Verify critical decisions.
          </p>
        </div>
      </main>
    </div>
  );
}

export default NexusPage;
