// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  getCoachAgent,
  getAgentsForFocus,
  createSession,
  startSession,
  addMessage,
  coacheeRespond,
  assignAction,
  completeAction,
  endSession,
  getSessionSummary,
  getAgent,
  type CoachingSession,
  type CoachAgent,
} from '../../../api/_lib/coachingSessionEngine.js';

describe('getCoachAgent', () => {
  it('returns agent for each role', () => {
    const roles: Array<CoachAgent['role']> = ['lead-coach', 'leadership-expert', 'career-transition-specialist', 'performance-strategist', 'communication-coach', 'peer-coach'];
    roles.forEach(role => {
      const agent = getCoachAgent(role);
      expect(agent.role).toBe(role);
      expect(agent.name).toBeTruthy();
      expect(Array.isArray(agent.expertise)).toBe(true);
    });
  });
});

describe('getAgentsForFocus', () => {
  it('returns multiple agents for leadership focus', () => {
    const agents = getAgentsForFocus('leadership');
    expect(agents.length).toBeGreaterThan(1);
    expect(agents.every(a => a.role)).toBeTruthy();
  });

  it('returns appropriate agents for each focus area', () => {
    const focuses: Array<'leadership' | 'career-transition' | 'performance' | 'communication' | 'strategic-thinking' | 'emotional-intelligence'> = ['leadership', 'career-transition', 'performance', 'communication', 'strategic-thinking', 'emotional-intelligence'];
    focuses.forEach(f => {
      const agents = getAgentsForFocus(f);
      expect(agents.length).toBeGreaterThan(0);
    });
  });
});

describe('createSession', () => {
  it('creates session with correct defaults', () => {
    const session = createSession('user-001', 'leadership');
    expect(session.coacheeId).toBe('user-001');
    expect(session.focus).toBe('leadership');
    expect(session.status).toBe('scheduled');
    expect(session.messages.length).toBe(0);
    expect(session.agents.length).toBeGreaterThan(0);
    expect(session.id.startsWith('session-')).toBe(true);
  });

  it('accepts custom methodology and title', () => {
    const session = createSession('user-001', 'leadership', 'GROW', 'My Custom Session');
    expect(session.methodology).toBe('GROW');
    expect(session.title).toBe('My Custom Session');
  });
});

describe('startSession', () => {
  it('starts session with welcome and coach messages', () => {
    let session = createSession('user-001', 'leadership');
    session = startSession(session);
    expect(session.status).toBe('in-progress');
    expect(session.startedAt).toBeTruthy();
    expect(session.messages.length).toBeGreaterThanOrEqual(2);
    expect(session.messages[0].role).toBe('system');
    expect(session.messages[1].role).toBe('coach');
  });
});

describe('addMessage', () => {
  it('adds message to session', () => {
    let session = createSession('user-001', 'leadership');
    session = startSession(session);
    const beforeCount = session.messages.length;
    session = addMessage(session, { role: 'coachee', agentId: 'user-001', content: 'I need help with team management' });
    expect(session.messages.length).toBe(beforeCount + 1);
    expect(session.messages[session.messages.length - 1].role).toBe('coachee');
  });
});

describe('coacheeRespond', () => {
  it('processes coachee response and generates coach reply', () => {
    let session = createSession('user-001', 'leadership');
    session = startSession(session);
    const beforeCount = session.messages.length;
    session = coacheeRespond(session, 'I\'m struggling with managing my team\'s performance');
    expect(session.messages.length).toBe(beforeCount + 2);
    const lastMsg = session.messages[session.messages.length - 1];
    expect(lastMsg.role).toBe('coach');
    expect(lastMsg.content).toBeTruthy();
  });

  it('increases progress on response', () => {
    let session = createSession('user-001', 'leadership');
    session = startSession(session);
    expect(session.progress).toBe(0);
    session = coacheeRespond(session, 'I need to develop my strategic thinking');
    expect(session.progress).toBeGreaterThan(0);
  });
});

describe('assignAction', () => {
  it('creates action item', () => {
    let session = createSession('user-001', 'leadership');
    session = startSession(session);
    session = assignAction(session, 'Complete leadership assessment', 'user-001');
    expect(session.actions.length).toBe(1);
    expect(session.actions[0].description).toBe('Complete leadership assessment');
    expect(session.actions[0].completed).toBe(false);
  });

  it('adds system message about action', () => {
    let session = createSession('user-001', 'leadership');
    session = startSession(session);
    const beforeCount = session.messages.length;
    session = assignAction(session, 'Read chapter 3 on emotional intelligence', 'user-001');
    expect(session.messages.length).toBe(beforeCount + 1);
    expect(session.messages[session.messages.length - 1].role).toBe('system');
  });
});

describe('completeAction', () => {
  it('marks action as completed', () => {
    let session = createSession('user-001', 'leadership');
    session = startSession(session);
    session = assignAction(session, 'Finish assessment', 'user-001');
    const actionId = session.actions[0].id;
    session = completeAction(session, actionId);
    expect(session.actions[0].completed).toBe(true);
  });
});

describe('endSession', () => {
  it('completes session with summary messages', () => {
    let session = createSession('user-001', 'leadership');
    session = startSession(session);
    session = coacheeRespond(session, 'I want to improve my leadership skills');
    session = assignAction(session, 'Complete self-assessment', 'user-001');
    session = endSession(session);
    expect(session.status).toBe('completed');
    expect(session.endedAt).toBeTruthy();
    expect(session.messages.length).toBeGreaterThan(0);
  });
});

describe('getSessionSummary', () => {
  it('returns correct summary structure', () => {
    let session = createSession('user-001', 'leadership');
    session = startSession(session);
    session = coacheeRespond(session, 'I need better communication with my team');
    session = assignAction(session, 'Practice active listening', 'user-001');
    const summary = getSessionSummary(session);
    expect(summary.messageCount).toBeGreaterThan(0);
    expect(summary.actionCount).toBe(1);
    expect(summary.completedActions).toBe(0);
    expect(Array.isArray(summary.topTopics)).toBe(true);
    expect(typeof summary.duration).toBe('string');
  });
});
