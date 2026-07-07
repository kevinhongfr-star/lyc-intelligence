/**
 * Nexus Memory Service
 * Cross-session memory reconstruction for returning users
 * 
 * When a user returns to Nexus, this service:
 * 1. Fetches their last N chat sessions from Supabase
 * 2. Extracts key topics, decisions, and action items
 * 3. Builds a "session-start ritual" that reconstructs continuity
 */

import { supabase } from '@/lib/supabase';

export interface SessionSummary {
  sessionId: string;
  title: string;
  lastMessage: string;
  keyTopics: string[];
  actionItems: string[];
  diagnosticProgress: number;
  createdAt: string;
}

export interface MemoryContext {
  hasHistory: boolean;
  lastSession?: SessionSummary;
  totalSessions: number;
  recurringTopics: string[];
  continuityMessage: string;
}

/**
 * Fetch recent chat sessions for a user
 */
export async function fetchRecentSessions(userId: string, limit: number = 5): Promise<SessionSummary[]> {
  const { data: sessions, error } = await supabase
    .from('chat_sessions')
    .select('id, title, diagnostic_progress, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error || !sessions) {
    console.error('[nexusMemory] Failed to fetch sessions:', error);
    return [];
  }

  const summaries: SessionSummary[] = [];

  for (const session of sessions) {
    // Get last message from session
    const { data: messages } = await supabase
      .from('chat_messages')
      .select('content, role')
      .eq('session_id', session.id)
      .order('created_at', { ascending: false })
      .limit(3);

    const lastUserMessage = messages?.find(m => m.role === 'user')?.content || '';
    const lastAssistantMessage = messages?.find(m => m.role === 'assistant')?.content || '';

    // Extract key topics (simple keyword extraction)
    const keyTopics = extractTopics(lastUserMessage + ' ' + lastAssistantMessage);
    const actionItems = extractActionItems(lastAssistantMessage);

    summaries.push({
      sessionId: session.id,
      title: session.title || 'Untitled Session',
      lastMessage: lastUserMessage,
      keyTopics,
      actionItems,
      diagnosticProgress: session.diagnostic_progress || 0,
      createdAt: session.created_at,
    });
  }

  return summaries;
}

/**
 * Build memory context for session-start ritual
 */
export async function buildMemoryContext(userId: string, userName?: string): Promise<MemoryContext> {
  const sessions = await fetchRecentSessions(userId, 3);

  if (sessions.length === 0) {
    return {
      hasHistory: false,
      totalSessions: 0,
      recurringTopics: [],
      continuityMessage: '',
    };
  }

  const lastSession = sessions[0];
  const allTopics = sessions.flatMap(s => s.keyTopics);
  const recurringTopics = findRecurringTopics(allTopics);
  const totalSessions = sessions.length;

  // Build continuity message
  const continuityMessage = buildContinuityMessage(lastSession, userName, totalSessions);

  return {
    hasHistory: true,
    lastSession,
    totalSessions,
    recurringTopics,
    continuityMessage,
  };
}

/**
 * Build the session-start ritual message
 * This is what Nexus says when a returning user starts a new session
 */
function buildContinuityMessage(session: SessionSummary, userName?: string, totalSessions?: number): string {
  const greeting = userName ? `Welcome back, ${userName}.` : 'Welcome back.';
  
  if (totalSessions && totalSessions > 1) {
    return `${greeting} This is session ${totalSessions + 1} together. Last time we discussed ${session.keyTopics.slice(0, 2).join(' and ')}. ${session.actionItems.length > 0 ? `You had ${session.actionItems.length} action items to follow up on.` : ''} What would you like to work on today?`;
  }

  return `${greeting} Last time we were exploring ${session.keyTopics[0] || 'your situation'}. ${session.diagnosticProgress > 0 ? `We completed ${session.diagnosticProgress}/5 diagnostic dimensions.` : ''} Where would you like to pick up?`;
}

/**
 * Extract key topics from text (simple keyword extraction)
 */
function extractTopics(text: string): string[] {
  const topics: string[] = [];
  
  // Common career/leadership topics
  const topicPatterns = [
    { pattern: /career|position|move|transition|opportunity/i, topic: 'career positioning' },
    { pattern: /interview|prepare|presentation|meeting/i, topic: 'interview preparation' },
    { pattern: /salary|compensation|offer|negotiate|package/i, topic: 'compensation negotiation' },
    { pattern: /leadership|lead|team|manage|direct/i, topic: 'leadership development' },
    { pattern: /board|director|governance|stakeholder/i, topic: 'board readiness' },
    { pattern: /cross.border|international|global|apac|europe|asia/i, topic: 'cross-border transition' },
    { pattern: /profile|linkedin|brand|presence|visibility/i, topic: 'personal branding' },
    { pattern: /assessment|score|benchmark|evaluate/i, topic: 'profile assessment' },
    { pattern: /conflict|resolution|difficult|challenge|problem/i, topic: 'conflict resolution' },
    { pattern: /decision|choice|option|strategy|plan/i, topic: 'strategic decision-making' },
  ];

  for (const { pattern, topic } of topicPatterns) {
    if (pattern.test(text) && !topics.includes(topic)) {
      topics.push(topic);
    }
  }

  return topics.slice(0, 3); // Limit to top 3 topics
}

/**
 * Extract action items from assistant response
 */
function extractActionItems(text: string): string[] {
  const actions: string[] = [];
  
  // Look for action-oriented phrases
  const actionPatterns = [
    /(?:next step|action item|to do|should|need to|must|try to|consider)\s+([^\n.]+)/gi,
    /\d+\.\s+([^\n.]+)/g, // Numbered lists
  ];

  for (const pattern of actionPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const action = match[1]?.trim();
      if (action && action.length > 10 && action.length < 200) {
        actions.push(action);
      }
    }
  }

  return actions.slice(0, 3); // Limit to top 3 action items
}

/**
 * Find recurring topics across sessions
 */
function findRecurringTopics(topics: string[]): string[] {
  const counts: Record<string, number> = {};
  
  for (const topic of topics) {
    counts[topic] = (counts[topic] || 0) + 1;
  }

  return Object.entries(counts)
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .map(([topic]) => topic)
    .slice(0, 3);
}

/**
 * Build memory context string for system prompt
 */
export function buildMemoryContextString(context: MemoryContext): string {
  if (!context.hasHistory) {
    return 'This is the first session with this user. No prior conversation history available.';
  }

  let memoryStr = `Previous session summary:\n`;
  
  if (context.lastSession) {
    memoryStr += `- Last discussed: ${context.lastSession.keyTopics.join(', ') || 'general topics'}\n`;
    memoryStr += `- Diagnostic progress: ${context.lastSession.diagnosticProgress}/5 dimensions\n`;
    
    if (context.lastSession.actionItems.length > 0) {
      memoryStr += `- Previous action items:\n`;
      for (const action of context.lastSession.actionItems) {
        memoryStr += `  * ${action}\n`;
      }
    }
  }

  if (context.recurringTopics.length > 0) {
    memoryStr += `- Recurring themes: ${context.recurringTopics.join(', ')}\n`;
  }

  memoryStr += `- Total sessions together: ${context.totalSessions}\n`;
  memoryStr += `\nUse this context to provide continuity. Reference previous discussions naturally. Check on progress of previous action items if appropriate.`;

  return memoryStr;
}