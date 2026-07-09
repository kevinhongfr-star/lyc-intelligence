/**
 * CandidateNexusCoachPage — Candidate Portal NEXUS AI Coach
 * Renders inside AppShell → Outlet. Shows AI coaching chat,
 * personalized insights, and quick actions.
 */
import React, { useState, useEffect } from 'react';
import { Sparkles, Send, MessageSquare, Clock, Target, TrendingUp, Lightbulb, User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Input, EmptyState } from '@/components/ui';
import { useTenantContext } from '@/hooks/useTenantContext';
import { getChatSessions, type ChatSession } from '@/services/supabaseApi';
import { sendChatMessage } from '@/services/coze';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface QuickAction {
  id: string;
  label: string;
  prompt: string;
}

interface Insight {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

// Static content — quick actions are static UI prompts
const STATIC_QUICK_ACTIONS: QuickAction[] = [
  { id: 'a1', label: 'Interview Prep', prompt: 'Help me prepare for an upcoming interview' },
  { id: 'a2', label: 'Negotiate Offer', prompt: 'I need help negotiating my compensation' },
  { id: 'a3', label: 'Career Path', prompt: 'What are my next career steps?' },
  { id: 'a4', label: 'Skill Gap', prompt: 'What skills should I develop next?' },
];

// Static content — insights are static UI hints
const STATIC_INSIGHTS: Insight[] = [
  { id: 'i1', title: 'Interview Tomorrow', description: 'TechCorp VP Engineering final round at 10 AM', icon: <Target className="w-4 h-4" /> },
  { id: 'i2', title: 'Skill Match', description: 'You match 92% of senior engineer roles', icon: <TrendingUp className="w-4 h-4" /> },
  { id: 'i3', title: 'Profile Tip', description: 'Add 2 more projects to boost visibility by 40%', icon: <Lightbulb className="w-4 h-4" /> },
];

const INITIAL_MESSAGES: ChatMessage[] = [
  { id: 'm1', role: 'assistant', content: 'Hi! I\'m NEXUS Coach, your personal AI career advisor. I can help you with interview prep, career planning, skill development, and more. What would you like to work on today?', timestamp: 'Just now' },
];

const STATIC_TOPICS: string[] = [
  'System design interview prep',
  'Negotiating VP-level offers',
  'Building executive presence',
  'Networking strategies',
];

export function CandidateNexusCoachPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const { user, candidateProfile, profile } = useTenantContext();

  useEffect(() => {
    let cancelled = false;
    const fetchSessions = async () => {
      if (!user?.id) {
        if (!cancelled) setSessionsLoading(false);
        return;
      }
      try {
        setSessionsError(null);
        const data = await getChatSessions(user.id);
        if (cancelled) return;
        setSessions(data);
      } catch (e) {
        console.error('[CandidateNexusCoachPage] Error:', e);
        if (!cancelled) setSessionsError('Failed to load chat sessions');
      } finally {
        if (!cancelled) setSessionsLoading(false);
      }
    };
    fetchSessions();
    return () => { cancelled = true; };
  }, [user?.id]);

  const displayName = candidateProfile?.name || profile?.name || 'Candidate';
  const currentTitle = candidateProfile?.current_title || 'Professional';

  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!inputValue.trim() || sending) return;

    const userMessage: ChatMessage = {
      id: `m${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: 'Just now',
    };

    const history = messages.map(m => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setSending(true);

    try {
      const response = await sendChatMessage(
        userMessage.content,
        user?.id || 'anonymous',
        history,
        {
          tier: profile?.tier || 'free',
          systemPrompt: 'You are NEXUS Coach, a personal AI career advisor for executive candidates. Help with interview prep, career planning, skill development, and compensation negotiation. Be concise, actionable, and encouraging.',
        }
      );

      const assistantMessage: ChatMessage = {
        id: `m${Date.now() + 1}`,
        role: 'assistant',
        content: response,
        timestamp: 'Just now',
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (e) {
      console.error('[CandidateNexusCoachPage] Chat error:', e);
      const errorMessage: ChatMessage = {
        id: `m${Date.now() + 1}`,
        role: 'assistant',
        content: 'I\'m having trouble connecting right now. Please try again in a moment.',
        timestamp: 'Just now',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setSending(false);
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    setInputValue(action.prompt);
  };

  const fmtSessionDate = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="font-serif font-bold text-2xl text-text-primary">NEXUS Coach</h1>
            <p className="text-text-secondary text-sm mt-1">Your personal AI career advisor, available 24/7.</p>
          </div>
          <div className="flex items-center gap-3 bg-bg-warm px-4 py-2 rounded-lg">
            <div className="w-9 h-9 rounded-full bg-fuchsia-light flex items-center justify-center">
              <User className="w-4 h-4 text-fuchsia" />
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-text-primary">{displayName}</div>
              <div className="text-xs text-text-muted">{currentTitle}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-fuchsia" />
                <CardTitle>Chat with NEXUS Coach</CardTitle>
                <Badge variant="outline" className="ml-auto text-xs">AI Powered</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-4 pb-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user' ? 'bg-fuchsia text-white' : 'bg-fuchsia-light text-fuchsia'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </div>
                  <div className={`max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
                    <div className={`inline-block px-4 py-2 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-fuchsia text-white rounded-tr-md'
                        : 'bg-bg-warm text-text-primary rounded-tl-md'
                    }`}>
                      {message.content}
                    </div>
                    <div className="text-xs text-text-muted mt-1 flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3" />
                      {message.timestamp}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
            <div className="p-4 border-t border-border">
              <div className="flex gap-2 flex-wrap mb-3">
                {STATIC_QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleQuickAction(action)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-warm hover:bg-fuchsia-light rounded-full text-xs text-text-secondary hover:text-fuchsia transition-colors"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask NEXUS Coach anything..."
                  className="flex-1"
                />
                <Button onClick={handleSend} disabled={!inputValue.trim() || sending}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-fuchsia" />
                <CardTitle>Personal Insights</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {STATIC_INSIGHTS.map((insight) => (
                  <div key={insight.id} className="p-3 bg-bg-warm rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-fuchsia">{insight.icon}</span>
                      <span className="font-medium text-text-primary text-sm">{insight.title}</span>
                    </div>
                    <div className="text-xs text-text-muted">{insight.description}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-fuchsia" />
                <CardTitle>Recent Sessions</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {sessionsLoading ? (
                <div className="py-8 text-center text-text-muted text-sm">Loading sessions...</div>
              ) : sessionsError ? (
                <EmptyState title="Failed to load sessions" description={sessionsError} />
              ) : sessions.length === 0 ? (
                <EmptyState
                  title="No chat sessions yet"
                  description="Start a conversation with NEXUS Coach and your past sessions will appear here."
                />
              ) : (
                <div className="space-y-2">
                  {sessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => setInputValue(session.title)}
                      className="w-full text-left px-3 py-2 hover:bg-bg-warm rounded-lg text-sm text-text-secondary hover:text-text-primary transition-colors flex items-center gap-2"
                    >
                      <MessageSquare className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate flex-1">{session.title}</span>
                      <span className="text-xs text-text-muted flex-shrink-0">{fmtSessionDate(session.updated_at || session.created_at)}</span>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-fuchsia" />
                <CardTitle>Suggested Topics</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {STATIC_TOPICS.map((topic, i) => (
                  <button
                    key={i}
                    onClick={() => setInputValue(topic)}
                    className="w-full text-left px-3 py-2 hover:bg-bg-warm rounded-lg text-sm text-text-secondary hover:text-text-primary transition-colors flex items-center gap-2"
                  >
                    <MessageSquare className="w-3 h-3" />
                    {topic}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-fuchsia-light/50 border-fuchsia/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-6 h-6 text-fuchsia flex-shrink-0" />
                <div>
                  <div className="font-medium text-text-primary text-sm">Pro Tip</div>
                  <div className="text-xs text-text-muted mt-1">
                    Ask specific questions with context for the most actionable advice.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default CandidateNexusCoachPage;
