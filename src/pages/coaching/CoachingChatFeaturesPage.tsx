/**
 * CoachingChatFeaturesPage — B2C Coaching Portal chat features showcase
 * Renders inside AppShell → Outlet. Shows available chat features,
 * messaging capabilities, and AI tools.
 */
import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Sparkles, Mic, Video, Paperclip, Smile, Send, Bot, Wand2, Languages, FileText, User, Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Input, EmptyState } from '@/components/ui';
import { useTenantContext } from '@/hooks/useTenantContext';
import { getCoacheePastSessions, type CoachingSession } from '@/services/supabaseApi';

interface ChatFeature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'AI' | 'Communication' | 'Productivity';
  available: boolean;
}

// Static content — feature catalog, not backed by a database table
const STATIC_FEATURES: ChatFeature[] = [
  { id: 'f1', title: 'AI Coaching Assistant', description: 'Get instant answers to career questions 24/7', icon: <Bot className="w-5 h-5" />, category: 'AI', available: true },
  { id: 'f2', title: 'Voice Messages', description: 'Send and receive voice notes', icon: <Mic className="w-5 h-5" />, category: 'Communication', available: true },
  { id: 'f3', title: 'Video Calls', description: '1:1 video sessions with your coach', icon: <Video className="w-5 h-5" />, category: 'Communication', available: true },
  { id: 'f4', title: 'File Sharing', description: 'Share documents, images, and resources', icon: <Paperclip className="w-5 h-5" />, category: 'Productivity', available: true },
  { id: 'f5', title: 'Smart Replies', description: 'AI-suggested responses based on context', icon: <Wand2 className="w-5 h-5" />, category: 'AI', available: true },
  { id: 'f6', title: 'Real-time Translation', description: 'Chat in 50+ languages seamlessly', icon: <Languages className="w-5 h-5" />, category: 'AI', available: true },
  { id: 'f7', title: 'Emoji & Reactions', description: 'Express yourself with rich emoji', icon: <Smile className="w-5 h-5" />, category: 'Communication', available: true },
  { id: 'f8', title: 'Message Search', description: 'Find any message or file instantly', icon: <FileText className="w-5 h-5" />, category: 'Productivity', available: true },
];

const CATEGORY_COLORS: Record<string, string> = {
  AI: 'bg-fuchsia/10 text-fuchsia',
  Communication: 'bg-blue/10 text-blue',
  Productivity: 'bg-green/10 text-green',
};

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  createdAt: number;
}

// Simple canned AI responses keyed off the user's message keywords.
// Real AI integration would call the coaching service; this keeps the
// chat interactive without a network roundtrip.
function generateAssistantReply(userMessage: string, displayName: string): string {
  const msg = userMessage.toLowerCase();
  if (/interview/.test(msg)) {
    return `Happy to help with interview prep, ${displayName}. What role and company are you targeting? I can run a mock behavioral interview or share STAR-format frameworks.`;
  }
  if (/resume|cv/.test(msg)) {
    return `Let's strengthen your resume. Paste the role description and your current bullet points, and I'll suggest higher-impact phrasing aligned with what recruiters scan for.`;
  }
  if (/salary|negotiat/.test(msg)) {
    return `Salary negotiation — let's prepare. Share the offer details (base, bonus, equity) and the market data you have. I'll help you build a script and a counter range.`;
  }
  if (/career (path|change|switch)|pivot/.test(msg)) {
    return `Career pivots are a great use of our time. Tell me about your current role, what's driving the change, and the directions you're considering — we'll map options against your strengths and the market.`;
  }
  if (/stress|burnout|overwhelm/.test(msg)) {
    return `Sorry you're feeling this way, ${displayName}. Let's unpack it together — what's taking the most energy right now, and what does your support system look like?`;
  }
  if (/hi|hello|hey|thanks|thank you/.test(msg)) {
    return `Hi ${displayName}! I can help with interview prep, resume reviews, salary negotiation, or career strategy. What would you like to work on?`;
  }
  return `Got it. Tell me a bit more about what you'd like to achieve and I'll tailor my next steps — happy to dig into specifics.`;
}

const SUGGESTED_PROMPTS = [
  'Help me prep for an interview',
  'Review my resume',
  'How do I negotiate salary?',
  'I want to pivot careers',
];

export function CoachingChatFeaturesPage() {
  const [filter, setFilter] = useState<'All' | 'AI' | 'Communication' | 'Productivity'>('All');
  const [sessions, setSessions] = useState<CoachingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, profile } = useTenantContext();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm0',
      role: 'assistant',
      content: `Hi ${profile?.name || 'there'}! I'm your AI coaching assistant. How can I help you today?`,
      createdAt: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [translationEnabled, setTranslationEnabled] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const data = await getCoacheePastSessions(user.id);
        if (cancelled) return;
        setSessions(data.slice(0, 5));
        setError(null);
      } catch (e) {
        console.error('[CoachingChatFeaturesPage] Error:', e);
        if (!cancelled) setError('Failed to load session history');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const displayName = profile?.name || 'Coachee';
  const tier = profile?.tier || 'Professional';

  const filteredFeatures = filter === 'All' ? STATIC_FEATURES : STATIC_FEATURES.filter(f => f.category === filter);
  const availableCount = STATIC_FEATURES.filter(f => f.available).length;

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isThinking) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
      createdAt: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    // Simulate assistant thinking latency
    window.setTimeout(() => {
      const reply = generateAssistantReply(trimmed, displayName);
      setMessages(prev => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: reply,
          createdAt: Date.now(),
        },
      ]);
      setIsThinking(false);
    }, 650);
  };

  const handleSendClick = () => sendMessage(input);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="font-serif font-bold text-2xl text-text-primary">Chat Features</h1>
            <p className="text-text-secondary text-sm mt-1">Explore all the tools available in your coaching chat experience.</p>
          </div>
          <div className="flex items-center gap-3 bg-bg-warm px-4 py-2 rounded-lg">
            <div className="w-9 h-9 rounded-full bg-fuchsia-light flex items-center justify-center">
              <User className="w-4 h-4 text-fuchsia" />
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-text-primary">{displayName}</div>
              <div className="text-xs text-text-muted">{tier}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-fuchsia" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{availableCount}</div>
              <div className="text-xs text-text-muted">Available Features</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-fuchsia/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-fuchsia" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">3</div>
              <div className="text-xs text-text-muted">AI-Powered Tools</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue/10 flex items-center justify-center">
              <Video className="w-5 h-5 text-blue" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">24/7</div>
              <div className="text-xs text-text-muted">Availability</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['All', 'AI', 'Communication', 'Productivity'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === cat
                ? 'bg-fuchsia text-white'
                : 'bg-bg-warm text-text-secondary hover:bg-fuchsia-light hover:text-fuchsia'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredFeatures.map((feature) => (
          <Card key={feature.id} className="p-5 hover:shadow-card-hover transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center text-fuchsia">
                {feature.icon}
              </div>
              {feature.id === 'f6' && (
                <button
                  type="button"
                  onClick={() => setTranslationEnabled(prev => !prev)}
                  className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                    translationEnabled
                      ? 'bg-fuchsia text-white'
                      : 'bg-bg-warm text-text-secondary hover:bg-fuchsia-light hover:text-fuchsia'
                  }`}
                  title="Toggle real-time translation for the chat below"
                >
                  {translationEnabled ? 'On' : 'Off'}
                </button>
              )}
            </div>
            <h3 className="font-medium text-text-primary text-sm mb-1">{feature.title}</h3>
            <p className="text-xs text-text-muted">{feature.description}</p>
            <div className="mt-3">
              <Badge className={CATEGORY_COLORS[feature.category]}>{feature.category}</Badge>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-fuchsia" />
            <CardTitle>Recent Coaching Sessions</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map(i => (
                <div key={i} className="animate-pulse h-16 bg-bg-tertiary rounded-lg" />
              ))}
            </div>
          ) : error ? (
            <div className="py-6 text-center text-red text-sm">{error}</div>
          ) : sessions.length === 0 ? (
            <EmptyState
              title="No coaching sessions yet"
              description="Your past coaching sessions will appear here."
            />
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 bg-bg-warm rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center text-fuchsia">
                      <Video className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-medium text-text-primary text-sm">{session.title}</div>
                      <div className="text-xs text-text-muted">
                        {new Date(session.scheduled_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })} · {session.duration_min} min · {session.format}
                      </div>
                    </div>
                  </div>
                  <Badge
                    className={
                      session.status === 'completed'
                        ? 'bg-green/10 text-green'
                        : session.status === 'cancelled'
                        ? 'bg-red/10 text-red'
                        : 'bg-amber/10 text-amber'
                    }
                  >
                    {session.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-fuchsia" />
              <CardTitle>Try the Chat</CardTitle>
            </div>
            {translationEnabled && (
              <Badge className="bg-fuchsia/10 text-fuchsia text-xs flex items-center gap-1">
                <Languages className="w-3 h-3" /> Translation on
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-bg-warm rounded-lg p-4 min-h-[320px] flex flex-col">
            <div ref={scrollRef} className="flex-1 space-y-3 mb-4 overflow-y-auto max-h-[420px]">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      m.role === 'user' ? 'bg-fuchsia' : 'bg-fuchsia-light'
                    }`}
                  >
                    {m.role === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-fuchsia" />
                    )}
                  </div>
                  <div
                    className={`px-4 py-2 rounded-2xl max-w-[80%] ${
                      m.role === 'user'
                        ? 'bg-fuchsia text-white rounded-tr-md'
                        : 'bg-white text-text-primary rounded-tl-md'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap">{m.content}</div>
                  </div>
                </div>
              ))}
              {isThinking && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-fuchsia-light flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-fuchsia" />
                  </div>
                  <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-md">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {messages.length <= 1 && !isThinking && (
              <div className="flex gap-2 flex-wrap mb-3">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    className="px-3 py-1.5 bg-white border border-border rounded-full text-xs text-text-secondary hover:bg-fuchsia-light hover:text-fuchsia hover:border-fuchsia transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                className="flex-1"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isThinking}
              />
              <Button onClick={handleSendClick} disabled={isThinking || !input.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CoachingChatFeaturesPage;
