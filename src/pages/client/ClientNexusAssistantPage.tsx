/**
 * ClientNexusAssistantPage — B2B Client Portal NEXUS AI assistant
 * Renders inside AppShell → Outlet. Shows AI-powered search,
 * insights, and recommendations for executive search.
 */
import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Sparkles, Clock, FileText, Users, Briefcase, User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Input, EmptyState } from '@/components/ui';
import { useTenantContext } from '@/hooks/useTenantContext';
import { getChatSessions, type ChatSession } from '@/services/supabaseApi';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface InsightCard {
  id: string;
  title: string;
  description: string;
  type: 'trend' | 'alert' | 'opportunity';
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'a1', label: 'Search candidates', icon: <Users className="w-4 h-4" /> },
  { id: 'a2', label: 'Analyze pipeline', icon: <Briefcase className="w-4 h-4" /> },
  { id: 'a3', label: 'Generate report', icon: <FileText className="w-4 h-4" /> },
  { id: 'a4', label: 'Market trends', icon: <Sparkles className="w-4 h-4" /> },
];

const STATIC_INSIGHTS: InsightCard[] = [
  { id: 'i1', title: 'High-Demand Skills', description: 'Cloud Architecture and AI/ML Engineering show 25% increased demand this quarter.', type: 'trend' },
  { id: 'i2', title: 'Pipeline Alert', description: '3 candidates in your VP Engineering pipeline have upcoming expirations.', type: 'alert' },
  { id: 'i3', title: 'Talent Opportunity', description: 'Identified 5 highly-scored candidates matching your CFO mandate criteria.', type: 'opportunity' },
];

const INITIAL_MESSAGES: ChatMessage[] = [
  { id: 'm1', role: 'assistant', content: 'Hello! I\'m NEXUS, your AI-powered talent intelligence assistant. How can I help you today?', timestamp: 'Just now' },
];

export function ClientNexusAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const { clientAccount, profile, user } = useTenantContext();

  useEffect(() => {
    if (!user?.id) {
      setSessionsLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await getChatSessions(user.id);
        if (!cancelled) setSessions(data);
      } catch (e) {
        console.error('[ClientNexusAssistantPage] Error:', e);
      } finally {
        if (!cancelled) setSessionsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: `m${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const assistantMessage: ChatMessage = {
      id: `m${Date.now() + 1}`,
      role: 'assistant',
      content: 'I found 12 candidates matching your criteria. Would you like me to share the top 5 profiles, or would you prefer to refine the search parameters?',
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsTyping(false);
  };

  const handleQuickAction = (action: QuickAction) => {
    setInputValue(action.label);
  };

  const displayName = clientAccount?.name || profile?.name || 'Client User';
  const organization = clientAccount?.organization || 'Your Organization';

  const typeColors = {
    trend: 'bg-blue/10 text-blue border-blue/20',
    alert: 'bg-amber/10 text-amber border-amber/20',
    opportunity: 'bg-green/10 text-green border-green/20',
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="font-serif font-bold text-2xl text-text-primary">NEXUS Assistant</h1>
            <p className="text-text-secondary text-sm mt-1">AI-powered talent search and insights at your fingertips.</p>
          </div>
          <div className="flex items-center gap-3 bg-bg-warm px-4 py-2 rounded-lg">
            <div className="w-9 h-9 rounded-full bg-fuchsia-light flex items-center justify-center">
              <User className="w-4 h-4 text-fuchsia" />
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-text-primary">{displayName}</div>
              <div className="text-xs text-text-muted">{organization}</div>
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
                <CardTitle>Chat with NEXUS</CardTitle>
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
              {isTyping && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-fuchsia-light flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-fuchsia" />
                  </div>
                  <div className="bg-bg-warm px-4 py-3 rounded-2xl rounded-tl-md">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-3">
                <div className="flex gap-2 flex-wrap">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => handleQuickAction(action)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-warm hover:bg-fuchsia-light rounded-full text-xs text-text-secondary hover:text-fuchsia transition-colors"
                    >
                      {action.icon}
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 mt-3">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask NEXUS about talent, pipeline, or market insights..."
                  className="flex-1"
                />
                <Button onClick={handleSend} disabled={!inputValue.trim()}>
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
                <MessageSquare className="w-5 h-5 text-fuchsia" />
                <CardTitle>AI Insights</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {STATIC_INSIGHTS.map((insight) => (
                  <div key={insight.id} className={`p-3 rounded-lg border ${typeColors[insight.type]}`}>
                    <div className="font-medium text-sm mb-1">{insight.title}</div>
                    <div className="text-xs opacity-80">{insight.description}</div>
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
              ) : sessions.length === 0 ? (
                <EmptyState title="No chat sessions" description="Start a conversation with NEXUS to see your session history here." />
              ) : (
                <div className="space-y-2">
                  {sessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => setInputValue(session.title)}
                      className="w-full text-left px-3 py-2 hover:bg-bg-warm rounded-lg text-sm text-text-secondary hover:text-text-primary transition-colors flex items-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{session.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Queries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  'Show me candidates for VP Engineering',
                  'What is the market salary for CFO roles?',
                  'Analyze my pipeline conversion rate',
                  'Generate a talent report for Q1',
                ].map((query, i) => (
                  <button
                    key={i}
                    onClick={() => setInputValue(query)}
                    className="w-full text-left px-3 py-2 hover:bg-bg-warm rounded-lg text-sm text-text-secondary hover:text-text-primary transition-colors flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {query}
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
                  <div className="font-medium text-text-primary text-sm">Need help?</div>
                  <div className="text-xs text-text-muted mt-1">
                    NEXUS can search talent pools, analyze your pipeline, generate reports, and provide market intelligence.
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

export default ClientNexusAssistantPage;