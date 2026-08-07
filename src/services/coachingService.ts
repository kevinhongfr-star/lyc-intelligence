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
  createSession,
  startSession,
  coacheeRespond,
  addMessage,
  assignAction,
  completeAction,
  endSession,
  getSessionSummary,
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

  session: {
    create: createSession,
    start: startSession,
    respond: coacheeRespond,
    addMessage,
    assignAction,
    completeAction,
    end: endSession,
    getSummary: getSessionSummary,
    getAgentsForFocus,
  },

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
