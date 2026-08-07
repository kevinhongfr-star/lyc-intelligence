// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  getScenarioTemplates,
  getScenarioById,
  initializeSimulation,
  startSimulation,
  submitTurn,
  completeSimulation,
  evaluateDecision,
  getSimulationSummary,
  generatePossibleActions,
  type SimulationState,
  type SimulationScenario,
} from '../../../api/_lib/simulationEngine.js';

describe('getScenarioTemplates', () => {
  it('returns array of scenarios', () => {
    const templates = getScenarioTemplates();
    expect(Array.isArray(templates)).toBe(true);
    expect(templates.length).toBeGreaterThan(0);
  });

  it('each scenario has required fields', () => {
    const templates = getScenarioTemplates();
    templates.forEach(s => {
      expect(s.id).toBeDefined();
      expect(s.title).toBeDefined();
      expect(s.type).toBeDefined();
      expect(s.difficulty).toBeDefined();
      expect(s.objectives).toBeDefined();
      expect(s.constraints).toBeDefined();
      expect(s.stakeholders).toBeDefined();
    });
  });

  it('contains leadership, career-transition, and performance scenarios', () => {
    const templates = getScenarioTemplates();
    const ids = templates.map(t => t.id);
    expect(ids.some(id => id.includes('leadership'))).toBe(true);
    expect(ids.some(id => id.includes('career'))).toBe(true);
    expect(ids.some(id => id.includes('performance'))).toBe(true);
  });
});

describe('getScenarioById', () => {
  it('returns scenario for valid id', () => {
    const scenario = getScenarioById('sci-leadership-001');
    expect(scenario).toBeDefined();
    expect(scenario?.title).toBe('The Underperforming Direct Report');
  });

  it('returns undefined for invalid id', () => {
    const scenario = getScenarioById('nonexistent');
    expect(scenario).toBeUndefined();
  });
});

describe('initializeSimulation', () => {
  it('creates initial state with correct defaults', () => {
    const state = initializeSimulation('sci-leadership-001');
    expect(state.scenarioId).toBe('sci-leadership-001');
    expect(state.currentTurn).toBe(0);
    expect(state.maxTurns).toBe(5);
    expect(state.completed).toBe(false);
    expect(state.status).toBe('not-started');
    expect(state.score).toBe(0);
  });

  it('throws for invalid scenario id', () => {
    expect(() => initializeSimulation('nonexistent')).toThrow();
  });
});

describe('startSimulation', () => {
  it('transitions status to in-progress', () => {
    let state = initializeSimulation('sci-leadership-001');
    state = startSimulation(state);
    expect(state.status).toBe('in-progress');
    expect(state.startedAt).toBeTruthy();
  });
});

describe('submitTurn', () => {
  it('adds a turn and updates state', () => {
    let state = initializeSimulation('sci-leadership-001');
    state = startSimulation(state);
    state = submitTurn(state, 'Schedule a career conversation with empathy');
    expect(state.turns.length).toBe(1);
    expect(state.currentTurn).toBe(1);
    expect(state.turns[0].playerAction).toBe('Schedule a career conversation with empathy');
    expect(state.turns[0].coachResponse).toBeTruthy();
    expect(state.turns[0].decisionQuality).toBeGreaterThan(0);
  });

  it('accumulates multiple turns', () => {
    let state = initializeSimulation('sci-leadership-001');
    state = startSimulation(state);
    state = submitTurn(state, 'Listen carefully to concerns');
    state = submitTurn(state, 'Create a development plan');
    state = submitTurn(state, 'Set clear milestones');
    expect(state.turns.length).toBe(3);
    expect(state.currentTurn).toBe(3);
  });

  it('auto-completes at max turns', () => {
    let state = initializeSimulation('sci-leadership-001');
    state = startSimulation(state);
    for (let i = 0; i < 5; i++) {
      state = submitTurn(state, `Action ${i + 1}: demonstrate empathy and plan`);
    }
    expect(state.completed).toBe(true);
    expect(state.status).toBe('completed');
  });

  it('generates insights for each turn', () => {
    let state = initializeSimulation('sci-leadership-001');
    state = startSimulation(state);
    state = submitTurn(state, 'Collaborate with stakeholders on a plan');
    expect(state.insights.length).toBeGreaterThan(0);
  });

  it('score improves with quality actions', () => {
    let state = initializeSimulation('sci-leadership-001');
    state = startSimulation(state);
    state = submitTurn(state, 'Use data and empathy to create a structured development plan with clear goals and metrics');
    expect(state.turns[0].decisionQuality).toBeGreaterThan(0.5);
  });
});

describe('completeSimulation', () => {
  it('marks simulation as completed', () => {
    let state = initializeSimulation('sci-leadership-001');
    state = completeSimulation(state);
    expect(state.completed).toBe(true);
    expect(state.status).toBe('completed');
    expect(state.completedAt).toBeTruthy();
  });
});

describe('evaluateDecision', () => {
  it('returns quality, outcome, feedback, and insights', () => {
    const scenario = getScenarioById('sci-leadership-001')!;
    const state = initializeSimulation('sci-leadership-001');
    const result = evaluateDecision('Demonstrate empathy and create a structured plan', scenario, state);
    expect(result.quality).toBeGreaterThan(0);
    expect(['success', 'partial', 'failure']).toContain(result.outcome);
    expect(result.feedback).toBeTruthy();
    expect(Array.isArray(result.insights)).toBe(true);
  });

  it('high-quality actions get success or partial outcome', () => {
    const scenario = getScenarioById('sci-leadership-001')!;
    const state = initializeSimulation('sci-leadership-001');
    const result = evaluateDecision('Use data, empathy, stakeholder collaboration, and clear metrics to plan', scenario, state);
    expect(result.outcome).not.toBe('failure');
  });
});

describe('getSimulationSummary', () => {
  it('provides summary with all required fields', () => {
    let state = initializeSimulation('sci-leadership-001');
    state = startSimulation(state);
    state = submitTurn(state, 'Listen and empathize');
    state = submitTurn(state, 'Plan with data');
    const summary = getSimulationSummary(state);
    expect(summary.overallScore).toBeDefined();
    expect(summary.completion).toBeDefined();
    expect(Array.isArray(summary.topInsights)).toBe(true);
    expect(Array.isArray(summary.strengths)).toBe(true);
    expect(Array.isArray(summary.areasForGrowth)).toBe(true);
    expect(summary.recommendation).toBeTruthy();
  });

  it('increases score with better decisions', () => {
    let poorState = initializeSimulation('sci-leadership-001');
    poorState = startSimulation(poorState);
    poorState = submitTurn(poorState, 'Rush to judgment without listening');
    let goodState = initializeSimulation('sci-leadership-001');
    goodState = startSimulation(goodState);
    goodState = submitTurn(goodState, 'Demonstrate empathy with careful data-driven stakeholder plan');
    const poorSummary = getSimulationSummary(poorState);
    const goodSummary = getSimulationSummary(goodState);
    expect(goodSummary.overallScore).toBeGreaterThan(poorSummary.overallScore);
  });
});

describe('generatePossibleActions', () => {
  it('returns actions for different turns', () => {
    const scenario = getScenarioById('sci-leadership-001')!;
    const state = initializeSimulation('sci-leadership-001');
    const actionsTurn0 = generatePossibleActions(scenario, { ...state, currentTurn: 0 });
    const actionsTurn3 = generatePossibleActions(scenario, { ...state, currentTurn: 3 });
    expect(actionsTurn0.length).toBeGreaterThan(0);
    expect(actionsTurn3.length).toBeGreaterThan(0);
    expect(actionsTurn0).not.toEqual(actionsTurn3);
  });
});
