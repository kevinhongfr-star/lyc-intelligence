export type CoachingFocus = 'leadership' | 'career-transition' | 'performance' | 'communication' | 'strategic-thinking' | 'emotional-intelligence';

export type AgentRole = 'lead-coach' | 'leadership-expert' | 'career-transition-specialist' | 'performance-strategist' | 'communication-coach' | 'peer-coach';

export type SessionStatus = 'scheduled' | 'in-progress' | 'paused' | 'completed' | 'cancelled';

export type MessageRole = 'coach' | 'coachee' | 'observer' | 'system';

export interface CoachAgent {
  id: string;
  role: AgentRole;
  name: string;
  expertise: CoachingFocus[];
  style: 'directive' | 'non-directive' | 'facilitative' | 'challenge';
  personality: { openness: number; conscientiousness: number; empathy: number; assertiveness: number };
}

export interface SessionMessage {
  id: string;
  role: MessageRole;
  agentId: string;
  content: string;
  methodology?: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface SessionAction {
  id: string;
  description: string;
  owner: string;
  deadline: number | null;
  completed: boolean;
  createdAt: number;
}

export interface CoachingSession {
  id: string;
  title: string;
  focus: CoachingFocus;
  status: SessionStatus;
  agents: CoachAgent[];
  coacheeId: string;
  messages: SessionMessage[];
  actions: SessionAction[];
  startedAt: number | null;
  endedAt: number | null;
  duration: number;
  notes: string[];
  methodology: string;
  progress: number;
}

const COACH_AGENTS: Record<AgentRole, CoachAgent> = {
  'lead-coach': {
    id: 'agent-lead',
    role: 'lead-coach',
    name: 'Alex Chen',
    expertise: ['leadership', 'career-transition', 'performance'],
    style: 'facilitative',
    personality: { openness: 0.9, conscientiousness: 0.85, empathy: 0.92, assertiveness: 0.7 },
  },
  'leadership-expert': {
    id: 'agent-leadership',
    role: 'leadership-expert',
    name: 'Dr. Sarah Mitchell',
    expertise: ['leadership', 'strategic-thinking'],
    style: 'challenge',
    personality: { openness: 0.8, conscientiousness: 0.95, empathy: 0.75, assertiveness: 0.9 },
  },
  'career-transition-specialist': {
    id: 'agent-career',
    role: 'career-transition-specialist',
    name: 'James Okonkwo',
    expertise: ['career-transition', 'communication'],
    style: 'non-directive',
    personality: { openness: 0.95, conscientiousness: 0.8, empathy: 0.88, assertiveness: 0.6 },
  },
  'performance-strategist': {
    id: 'agent-performance',
    role: 'performance-strategist',
    name: 'Maria Gonzalez',
    expertise: ['performance', 'emotional-intelligence'],
    style: 'directive',
    personality: { openness: 0.75, conscientiousness: 0.92, empathy: 0.82, assertiveness: 0.85 },
  },
  'communication-coach': {
    id: 'agent-communication',
    role: 'communication-coach',
    name: 'Thomas Weber',
    expertise: ['communication', 'emotional-intelligence'],
    style: 'facilitative',
    personality: { openness: 0.85, conscientiousness: 0.78, empathy: 0.9, assertiveness: 0.65 },
  },
  'peer-coach': {
    id: 'agent-peer',
    role: 'peer-coach',
    name: 'Jordan Lee',
    expertise: ['leadership', 'career-transition'],
    style: 'non-directive',
    personality: { openness: 0.9, conscientiousness: 0.7, empathy: 0.85, assertiveness: 0.55 },
  },
};

const FOCUS_AGENT_MAP: Record<CoachingFocus, AgentRole[]> = {
  leadership: ['lead-coach', 'leadership-expert', 'communication-coach'],
  'career-transition': ['lead-coach', 'career-transition-specialist', 'peer-coach'],
  performance: ['lead-coach', 'performance-strategist', 'communication-coach'],
  communication: ['communication-coach', 'lead-coach'],
  'strategic-thinking': ['leadership-expert', 'lead-coach'],
  'emotional-intelligence': ['performance-strategist', 'communication-coach', 'peer-coach'],
};

export function getCoachAgent(role: AgentRole): CoachAgent {
  return { ...COACH_AGENTS[role] };
}

export function getAgentsForFocus(focus: CoachingFocus): CoachAgent[] {
  const roles = FOCUS_AGENT_MAP[focus];
  return roles.map(r => ({ ...COACH_AGENTS[r] }));
}

export function createSession(
  coacheeId: string,
  focus: CoachingFocus,
  methodology: string = 'GROW',
  title?: string,
): CoachingSession {
  const agents = getAgentsForFocus(focus);
  const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  return {
    id: sessionId,
    title: title ?? `${focus.replace('-', ' ')} Coaching Session`,
    focus,
    status: 'scheduled',
    agents,
    coacheeId,
    messages: [],
    actions: [],
    startedAt: null,
    endedAt: null,
    duration: 3600,
    notes: [],
    methodology,
    progress: 0,
  };
}

export function startSession(session: CoachingSession): CoachingSession {
  const now = Date.now();
  const welcomeMessage: SessionMessage = {
    id: `msg-${now}-welcome`,
    role: 'system',
    agentId: 'system',
    content: `Coaching session "${session.title}" has started with ${session.agents.length} agents.`,
    timestamp: now,
  };
  const coachMessage: SessionMessage = {
    id: `msg-${now}-coach`,
    role: 'coach',
    agentId: session.agents[0].id,
    content: `Hello, I'm ${session.agents[0].name}, your lead coach today. We'll be using the ${session.methodology} model to work through your ${session.focus.replace('-', ' ')} goals. What would you like to focus on?`,
    methodology: session.methodology,
    timestamp: now,
  };
  return {
    ...session,
    status: 'in-progress',
    startedAt: now,
    messages: [welcomeMessage, coachMessage],
  };
}

export function addMessage(session: CoachingSession, message: Omit<SessionMessage, 'id' | 'timestamp'>): CoachingSession {
  const msg: SessionMessage = {
    ...message,
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
  };
  return { ...session, messages: [...session.messages, msg] };
}

export function coacheeRespond(session: CoachingSession, content: string): CoachingSession {
  const msg: SessionMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    role: 'coachee',
    agentId: session.coacheeId,
    content,
    timestamp: Date.now(),
  };
  const coachResponse = generateCoachResponse(session, content);
  const responseMsg: SessionMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    role: 'coach',
    agentId: coachResponse.agent.id,
    content: coachResponse.content,
    methodology: coachResponse.methodology,
    timestamp: Date.now(),
  };
  const progress = Math.min(100, session.progress + 15);
  return {
    ...session,
    messages: [...session.messages, msg, responseMsg],
    progress,
  };
}

export function assignAction(
  session: CoachingSession,
  description: string,
  owner: string,
  deadline: number | null = null,
): CoachingSession {
  const action: SessionAction = {
    id: `action-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    description,
    owner,
    deadline,
    completed: false,
    createdAt: Date.now(),
  };
  const actionMessage: SessionMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    role: 'system',
    agentId: 'system',
    content: `Action item created: "${description}" assigned to ${owner}`,
    timestamp: Date.now(),
  };
  return {
    ...session,
    actions: [...session.actions, action],
    messages: [...session.messages, actionMessage],
  };
}

export function completeAction(session: CoachingSession, actionId: string): CoachingSession {
  const actions = session.actions.map(a =>
    a.id === actionId ? { ...a, completed: true } : a,
  );
  return { ...session, actions };
}

export function endSession(session: CoachingSession): CoachingSession {
  const summary: SessionMessage = {
    id: `msg-${Date.now()}-summary`,
    role: 'system',
    agentId: 'system',
    content: `Session completed. ${session.actions.filter(a => a.completed).length}/${session.actions.length} actions completed.`,
    timestamp: Date.now(),
  };
  const closingMessage: SessionMessage = {
    id: `msg-${Date.now()}-closing`,
    role: 'coach',
    agentId: session.agents[0].id,
    content: 'Thank you for this session. Remember that progress comes from consistent action. Review your action items and journal about your insights.',
    timestamp: Date.now(),
  };
  return {
    ...session,
    status: 'completed',
    endedAt: Date.now(),
    messages: [...session.messages, summary, closingMessage],
  };
}

export function getSessionSummary(session: CoachingSession): {
  duration: string;
  messageCount: number;
  actionCount: number;
  completedActions: number;
  topTopics: string[];
  agentContributions: Record<string, number>;
} {
  const mins = Math.floor((session.endedAt ?? Date.now() - (session.startedAt ?? Date.now())) / 60000);
  const secs = Math.floor(((session.endedAt ?? Date.now() - (session.startedAt ?? Date.now())) % 60000) / 1000);
  const agentContributions: Record<string, number> = {};
  session.messages.forEach(m => {
    if (m.role === 'coach') {
      agentContributions[m.agentId] = (agentContributions[m.agentId] ?? 0) + 1;
    }
  });
  const topTopics = extractTopics(session.messages);
  return {
    duration: `${mins}m ${secs}s`,
    messageCount: session.messages.length,
    actionCount: session.actions.length,
    completedActions: session.actions.filter(a => a.completed).length,
    topTopics,
    agentContributions,
  };
}

function generateCoachResponse(session: CoachingSession, coacheeContent: string): { agent: CoachAgent; content: string; methodology?: string } {
  const lowerContent = coacheeContent.toLowerCase();
  const methodology = session.methodology;
  let respondent = session.agents[0];
  for (const agent of session.agents) {
    if (lowerContent.includes(agent.expertise.map(e => e.replace('-', ' ')).join(' '))) {
      respondent = agent;
      break;
    }
  }
  const responses: Record<string, string[]> = {
    GROW: [
      'Let\'s start by clarifying your Goal. What specifically do you want to achieve?',
      'Good. Now let\'s examine the Reality of your current situation. What is working and what isn\'t?',
      'Consider your Options here. What are 2-3 different paths forward?',
      'Will you commit to a specific course of action? What\'s your next step?',
    ],
    CLEAR: [
      'Let\'s establish the Context first. What\'s the broader picture here?',
      'What specific Outcome are you aiming for? Let\'s make it measurable.',
      'Explore the Options available to you. What are the pros and cons?',
      'Identify the Will — what\'s your commitment to this path?',
    ],
    'coaching-wheel': [
      'Let\'s assess where you are on the coaching wheel. Which quadrant needs attention?',
      'Consider all four perspectives: thinking, feeling, doing, and being.',
      'Which area would bring the most leverage if improved?',
      'Let\'s create an integrated plan that addresses all quadrants.',
    ],
  };
  const methodResponses = responses[methodology] ?? responses.GROW;
  const idx = Math.min(session.messages.filter(m => m.role === 'coach').length, methodResponses.length - 1);
  return {
    agent: respondent,
    content: methodResponses[idx],
    methodology,
  };
}

function extractTopics(messages: SessionMessage[]): string[] {
  const topics: string[] = [];
  const topicKeywords: Record<string, string[]> = {
    'career growth': ['career', 'grow', 'promotion', 'advance', 'develop'],
    'team management': ['team', 'manage', 'lead', 'direct report', 'report'],
    'communication': ['communic', 'feedback', 'conversation', 'present'],
    'strategic planning': ['strategy', 'plan', 'goal', 'objective', 'vision'],
    'work-life balance': ['balance', 'workload', 'stress', 'burnout', 'priority'],
    'conflict resolution': ['conflict', 'disagree', 'tension', 'resolve', 'address'],
  };
  const allContent = messages.map(m => m.content.toLowerCase()).join(' ');
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(k => allContent.includes(k))) {
      topics.push(topic);
    }
  }
  return topics.slice(0, 5);
}

export function listSessionsForCoachee(coacheeId: string, allSessions: CoachingSession[]): CoachingSession[] {
  return allSessions.filter(s => s.coacheeId === coacheeId);
}
