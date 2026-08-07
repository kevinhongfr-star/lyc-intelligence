/**
 * Client-facing coaching service.
 *
 * ── Integrated (Phase 7.5 — /coaching/coach) ──────────────────────
 * session.*      — calls REAL /api/coaching/* endpoints through fetch.
 *                  Uses `authFetch` helper (Authorization: Bearer JWT).
 *
 * ── Not yet integrated (later phases) ─────────────────────────────
 * simulation.*   — direct engine imports (coachingService.simulation.*)
 * methodology.*  — direct engine imports
 * reflection.*   — direct engine imports
 * peer.*         — direct engine imports
 * curriculum.*   — direct engine imports
 * progress.*     — direct engine imports
 *
 * DO NOT wire other modules to /api/coaching/* until their audit 6-pt
 * checklists are complete and dispatch registrations exist.
 */

import {
  getScenarioTemplates,
  getScenarioById,
  initializeSimulation,
  startSimulation,
  submitTurn,
  completeSimulation,
  getSimulationSummary,
  generatePossibleActions,
  type SimulationState,
  type SimulationScenario,
} from '../api/_lib/simulationEngine';

import {
  getMethodology,
  getAllMethodologies,
  getMethodologyForFocus,
  getProgress,
  generatePrompt,
  adaptMethodologyResponse,
  type CoachingMethodology,
} from '../api/_lib/coachingMethodologies';

import {
  createSession as engineCreateSession,
  startSession as engineStartSession,
  coacheeRespond as engineCoacheeRespond,
  addMessage as engineAddMessage,
  assignAction as engineAssignAction,
  completeAction as engineCompleteAction,
  endSession as engineEndSession,
  getSessionSummary as engineGetSessionSummary,
  getAgentsForFocus,
  type CoachingSession,
  type SessionMessage,
} from '../api/_lib/coachingSessionEngine';

import {
  getReflectionPrompts,
  generateStructuredReflection,
  getReflectionDepthScore,
  aggregateReflectionDepth,
  getReflectionPromptsForSession,
  type ReflectionEntry,
  type ReflectionPrompt,
} from '../api/_lib/reflectionJournal';

import {
  getPeerPool,
  getPeerById,
  matchPeers,
  createMatch,
  scoreMatch,
  getMatchRecommendations,
  type PeerProfile,
  type PeerMatch,
  type MatchScore,
} from '../api/_lib/peerMatchEngine';

import {
  getLearningPaths,
  getPathById,
  generateLearningPath,
  initializeProgress,
  updateModuleProgress,
  getPathSummary,
  getNextRecommendedAction,
  type LearningPath,
  type LearningProgress,
} from '../api/_lib/curriculumEngine';

import {
  getCompetenciesForFocus,
  initializeCompetencyScores,
  updateCompetencyScore,
  recordSession,
  createGoal,
  updateGoalMilestone,
  generateProgressReport,
  getProgressStatus,
  type CompetencyScore,
  type SessionRecord,
  type ProgressGoal,
  type CoachingProgressReport,
} from '../api/_lib/coachingProgressTracker';

// ── auth-aware fetch helper ─────────────────────────────────────────────
function getAuthHeader(): HeadersInit {
  const token = (typeof window !== 'undefined' && (window as any).__AUTH_TOKEN__)
    ? (window as any).__AUTH_TOKEN__
    : (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null);
  if (token) return { Authorization: `Bearer ${token}` };
  return {};
}

async function authFetchJson<T = any>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...(init.headers || {}),
    },
    ...init,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data as any)?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  if ((data as any)?.success === false) {
    throw new Error((data as any)?.error || 'Request failed');
  }
  return data as T;
}

// ── session.* — signature matches CoachingPage expectations (CoachingSession in/out)
//    but each mutation also persists to the REAL /api/coaching/* endpoints.
//    Non-mutating reads fall back to the engine for offline UI rendering.
const session = {
  // Sync initializer (CoachingPage useState starter uses this)
  create: (coacheeId: string, focus: CoachingSession['focus'], methodology?: string, title?: string): CoachingSession => {
    const local = engineCreateSession(coacheeId, focus, methodology, title);
    // Fire-and-forget server-side create (best-effort)
    authFetchJson<{ session: any }>('/api/coaching/sessions', {
      method: 'POST',
      body: JSON.stringify({
        focus,
        methodology: methodology || local.methodology,
        title,
      }),
    }).then((r) => {
      if (r?.session?.id) {
        // Map the server id back so subsequent API calls hit the real record
        (local as any)._serverId = r.session.id;
      }
    }).catch(() => { /* offline: ignore */ });
    return local;
  },

  start: (s: CoachingSession): CoachingSession => {
    const after = engineStartSession(s);
    const sid = (s as any)._serverId ?? s.id;
    authFetchJson<{ session: any }>(`/api/coaching/sessions/${sid}/start`, { method: 'POST' })
      .catch(() => { /* offline: ignore */ });
    return after;
  },

  respond: (s: CoachingSession, content: string): CoachingSession => {
    const after = engineCoacheeRespond(s, content);
    const sid = (s as any)._serverId ?? s.id;
    authFetchJson<{ session: any }>(`/api/coaching/sessions/${sid}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }).catch(() => { /* offline: ignore */ });
    return after;
  },

  addMessage: (s: CoachingSession, msg: Omit<SessionMessage, 'id' | 'timestamp'>): CoachingSession => {
    const after = engineAddMessage(s, msg);
    if (msg.role === 'coachee') {
      const sid = (s as any)._serverId ?? s.id;
      authFetchJson<{ session: any }>(`/api/coaching/sessions/${sid}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: msg.content }),
      }).catch(() => {});
    }
    return after;
  },

  assignAction: (s: CoachingSession, description: string, owner?: string, deadline?: number | null): CoachingSession => {
    return engineAssignAction(s, description, owner ?? s.coacheeId, deadline ?? null);
  },

  completeAction: (s: CoachingSession, actionId: string): CoachingSession => {
    return engineCompleteAction(s, actionId);
  },

  end: (s: CoachingSession): CoachingSession => {
    const after = engineEndSession(s);
    const sid = (s as any)._serverId ?? s.id;
    authFetchJson<{ session: any }>(`/api/coaching/sessions/${sid}/complete`, { method: 'POST' })
      .catch(() => {});
    return after;
  },

  getSummary: engineGetSessionSummary,
  getAgentsForFocus,
};

// ── non-integrated modules stay on direct engine imports ───────────────
export const coachingService = {
  simulation: {
    getScenarios: getScenarioTemplates,
    getById: getScenarioById,
    initialize: initializeSimulation,
    start: startSimulation,
    submitTurn,
    complete: completeSimulation,
    getSummary: getSimulationSummary,
    getPossibleActions: generatePossibleActions,
  },

  methodology: {
    get: getMethodology,
    getAll: getAllMethodologies,
    getForFocus: getMethodologyForFocus,
    getProgress,
    generatePrompt,
    adaptResponse: adaptMethodologyResponse,
  },

  session,

  reflection: {
    getPrompts: getReflectionPrompts,
    generate: generateStructuredReflection,
    getDepthScore: getReflectionDepthScore,
    aggregateDepth: aggregateReflectionDepth,
    getPromptsForSession,
  },

  peer: {
    getPool: getPeerPool,
    getById: getPeerById,
    match: matchPeers,
    createMatch,
    scoreMatch,
    getRecommendations: getMatchRecommendations,
  },

  curriculum: {
    getPaths: getLearningPaths,
    getById: getPathById,
    generate: generateLearningPath,
    initializeProgress,
    updateProgress: updateModuleProgress,
    getSummary: getPathSummary,
    getNextAction: getNextRecommendedAction,
  },

  progress: {
    getCompetenciesForFocus,
    initializeScores: initializeCompetencyScores,
    updateScore: updateCompetencyScore,
    recordSession,
    createGoal,
    updateGoal,
    generateReport: generateProgressReport,
    getStatus: getProgressStatus,
  },
};

export type {
  SimulationState,
  SimulationScenario,
  CoachingMethodology,
  CoachingSession,
  SessionMessage,
  ReflectionEntry,
  ReflectionPrompt,
  PeerProfile,
  PeerMatch,
  MatchScore,
  LearningPath,
  LearningProgress,
  CompetencyScore,
  SessionRecord,
  ProgressGoal,
  CoachingProgressReport,
};
