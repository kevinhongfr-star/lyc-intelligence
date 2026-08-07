export type SimulationType = 'decision-forcing' | 'role-playing' | 'case-analysis' | 'socratic-dialogue';

export type ScenarioDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type DecisionOutcome = 'success' | 'partial' | 'failure';

export interface ScenarioConstraint {
  id: string;
  description: string;
  impact: number;
  resolved: boolean;
}

export interface ScenarioStakeholder {
  id: string;
  name: string;
  role: string;
  perspective: string;
  influence: number;
  satisfied: boolean;
}

export interface ScenarioTurn {
  id: string;
  playerAction: string;
  coachResponse: string;
  decisionQuality: number;
  insight: string;
  timestamp: number;
}

export interface SimulationScenario {
  id: string;
  title: string;
  type: SimulationType;
  difficulty: ScenarioDifficulty;
  background: string;
  context: string;
  objectives: string[];
  constraints: ScenarioConstraint[];
  stakeholders: ScenarioStakeholder[];
  possibleActions: string[];
  successCriteria: string[];
  timeLimit: number;
  metadata: Record<string, unknown>;
}

export interface SimulationState {
  scenarioId: string;
  currentTurn: number;
  maxTurns: number;
  turns: ScenarioTurn[];
  score: number;
  insights: string[];
  completed: boolean;
  status: 'not-started' | 'in-progress' | 'paused' | 'completed';
  startedAt: number | null;
  completedAt: number | null;
}

const SCENARIO_TEMPLATES: SimulationScenario[] = [
  {
    id: 'sci-leadership-001',
    title: 'The Underperforming Direct Report',
    type: 'decision-forcing',
    difficulty: 'intermediate',
    background: 'A senior team member has been underperforming for three consecutive quarters. Their manager must decide whether to invest in coaching, reassign responsibilities, or begin performance proceedings.',
    context: 'The team member was once a top performer. Recent personal challenges have affected their output. The manager has a 1:1 scheduled today.',
    objectives: [
      'Identify the root cause of underperformance',
      'Create a structured improvement plan',
      'Preserve team morale and retain talent',
    ],
    constraints: [
      { id: 'c1', description: 'Quarterly review deadline in 2 weeks', impact: 0.8, resolved: false },
      { id: 'c2', description: 'Team member has 10+ years of institutional knowledge', impact: 0.6, resolved: false },
      { id: 'c3', description: 'Company policies require progressive discipline', impact: 0.7, resolved: false },
    ],
    stakeholders: [
      { id: 's1', name: 'Alex (Direct Report)', role: 'Senior Engineer', perspective: 'Feels undervalued and overwhelmed', influence: 0.5, satisfied: false },
      { id: 's2', name: 'Director', role: 'VP Engineering', perspective: 'Wants results and stability', influence: 0.9, satisfied: false },
      { id: 's3', name: 'HR Business Partner', role: 'HR BP', perspective: 'Focused on policy compliance', influence: 0.4, satisfied: false },
    ],
    possibleActions: [
      'Schedule an in-depth career conversation',
      'Assign a peer mentor',
      'Create a 90-day performance improvement plan',
      'Reassign them to a different project',
      'Begin documentation for performance action',
    ],
    successCriteria: [
      'Demonstrates empathy and active listening',
      'Balances compassion with accountability',
      'Creates a clear, actionable plan',
      'Documents the conversation properly',
    ],
    timeLimit: 1800,
    metadata: { domain: 'leadership', competency: 'people-management' },
  },
  {
    id: 'sci-career-transition-001',
    title: 'Pivoting from Individual Contributor to Manager',
    type: 'role-playing',
    difficulty: 'advanced',
    background: 'A successful IC has been offered a team lead position. They must navigate conversations with their current manager, their new team, and HR.',
    context: 'The transition needs to happen over 30 days. The IC is excited but uncertain about managing former peers.',
    objectives: [
      'Evaluate readiness for people management',
      'Negotiate transition terms',
      'Build credibility with the new team',
      'Create a 100-day plan',
    ],
    constraints: [
      { id: 'c1', description: 'Must hand off critical project in 2 weeks', impact: 0.9, resolved: false },
      { id: 'c2', description: 'Salary adjustment pending final approval', impact: 0.5, resolved: false },
      { id: 'c3', description: 'Two former peers may resent the transition', impact: 0.7, resolved: false },
    ],
    stakeholders: [
      { id: 's1', name: 'Current Manager', role: 'Tech Lead', perspective: 'Reluctant to lose top performer', influence: 0.7, satisfied: false },
      { id: 's2', name: 'New Team Members', role: 'Engineering Team', perspective: 'Apprehensive about peer becoming manager', influence: 0.6, satisfied: false },
      { id: 's3', name: 'HR Director', role: 'HR', perspective: 'Focused on smooth transition', influence: 0.5, satisfied: false },
      { id: 's4', name: 'VP of Engineering', role: 'VP', perspective: 'Strategic workforce planning', influence: 0.8, satisfied: false },
    ],
    possibleActions: [
      'Negotiate a 4-week overlap period',
      'Request a formal mentorship arrangement',
      'Propose a trial co-lead model',
      'Negotiate revised compensation',
      'Decline the offer and stay as IC',
    ],
    successCriteria: [
      'Demonstrates self-awareness about leadership readiness',
      'Addresses stakeholder concerns proactively',
      'Creates a realistic transition timeline',
      'Secures support from key stakeholders',
    ],
    timeLimit: 2700,
    metadata: { domain: 'career-transition', competency: 'leadership-readiness' },
  },
  {
    id: 'sci-performance-001',
    title: 'The Difficult Performance Review Conversation',
    type: 'decision-forcing',
    difficulty: 'advanced',
    background: 'A manager must deliver a candid performance review to a team member who believes they are performing well. The gap between perception and reality is significant.',
    context: 'The team member is popular and has strong self-assessment scores. Objective metrics tell a different story.',
    objectives: [
      'Deliver honest feedback while maintaining trust',
      'Use concrete examples and data',
      'Create a development plan',
      'Handle emotional reactions skillfully',
    ],
    constraints: [
      { id: 'c1', description: 'Review must be completed by end of week', impact: 0.8, resolved: false },
      { id: 'c2', description: 'Limited HR guidance available', impact: 0.4, resolved: false },
      { id: 'c3', description: 'Team member has strong relationships with executives', impact: 0.6, resolved: false },
    ],
    stakeholders: [
      { id: 's1', name: 'Jamie (Team Member)', role: 'Product Designer', perspective: 'Confident in own performance', influence: 0.5, satisfied: false },
      { id: 's2', name: 'Skip-Level Manager', role: 'Director of Design', perspective: 'Observing management capability', influence: 0.9, satisfied: false },
      { id: 's3', name: 'Team Peers', role: 'Design Team', perspective: 'Watching how this is handled', influence: 0.3, satisfied: false },
    ],
    possibleActions: [
      'Share data first, then discuss feelings',
      'Start with positive observations, then address gaps',
      'Focus on future development, not past mistakes',
      'Use a 360-feedback approach',
      'Document everything and involve HR',
    ],
    successCriteria: [
      'Uses SBI model (Situation-Behavior-Impact)',
      'Demonstrates emotional intelligence',
      'Creates a forward-looking plan',
      'Gains buy-in for development areas',
    ],
    timeLimit: 1200,
    metadata: { domain: 'performance', competency: 'difficult-conversations' },
  },
];

const DECISION_QUALITY_RULES: { threshold: number; label: DecisionOutcome; feedback: string }[] = [
  { threshold: 0.75, label: 'success', feedback: 'Excellent decision! You demonstrated strong judgment and strategic thinking.' },
  { threshold: 0.55, label: 'partial', feedback: 'Good effort. Consider additional perspectives to strengthen your approach.' },
  { threshold: 0, label: 'failure', feedback: 'This approach may not achieve the desired outcome. Consider alternatives.' },
];

export function getScenarioTemplates(): SimulationScenario[] {
  return SCENARIO_TEMPLATES;
}

export function getScenarioById(id: string): SimulationScenario | undefined {
  return SCENARIO_TEMPLATES.find(s => s.id === id);
}

export function initializeSimulation(scenarioId: string): SimulationState {
  const scenario = getScenarioById(scenarioId);
  if (!scenario) throw new Error(`Scenario not found: ${scenarioId}`);
  return {
    scenarioId,
    currentTurn: 0,
    maxTurns: 5,
    turns: [],
    score: 0,
    insights: [],
    completed: false,
    status: 'not-started',
    startedAt: null,
    completedAt: null,
  };
}

export function startSimulation(state: SimulationState): SimulationState {
  return { ...state, status: 'in-progress', startedAt: Date.now() };
}

export function evaluateDecision(
  action: string,
  scenario: SimulationScenario,
  state: SimulationState,
): { quality: number; outcome: DecisionOutcome; feedback: string; insights: string[] } {
  const baseQuality = scoreActionQuality(action, scenario);
  const stakeholderAlignment = computeStakeholderAlignment(action, scenario);
  const constraintResolution = computeConstraintResolution(action, scenario);
  const totalQuality = Math.round((baseQuality * 0.4 + stakeholderAlignment * 0.35 + constraintResolution * 0.25) * 100) / 100;
  const rule = DECISION_QUALITY_RULES.find(r => totalQuality >= r.threshold) ?? DECISION_QUALITY_RULES[DECISION_QUALITY_RULES.length - 1];
  const insights = generateInsights(action, totalQuality, scenario);
  return { quality: totalQuality, outcome: rule.label, feedback: rule.feedback, insights };
}

export function submitTurn(
  state: SimulationState,
  action: string,
): SimulationState {
  const scenario = getScenarioById(state.scenarioId);
  if (!scenario) throw new Error(`Scenario not found: ${state.scenarioId}`);
  const evaluation = evaluateDecision(action, scenario, state);
  const coachResponse = generateCoachResponse(action, evaluation.outcome, scenario);
  const turn: ScenarioTurn = {
    id: `turn-${state.currentTurn + 1}`,
    playerAction: action,
    coachResponse,
    decisionQuality: evaluation.quality,
    insight: evaluation.insights[0] ?? 'Consider how this decision affects all stakeholders.',
    timestamp: Date.now(),
  };
  const newTurns = [...state.turns, turn];
  const newScore = Math.round((newTurns.reduce((sum, t) => sum + t.decisionQuality, 0) / newTurns.length) * 100) / 100;
  const newState: SimulationState = {
    ...state,
    currentTurn: state.currentTurn + 1,
    turns: newTurns,
    score: newScore,
    insights: [...state.insights, ...evaluation.insights],
  };
  if (newState.currentTurn >= newState.maxTurns) {
    return completeSimulation(newState);
  }
  return newState;
}

export function completeSimulation(state: SimulationState): SimulationState {
  return { ...state, completed: true, status: 'completed', completedAt: Date.now() };
}

export function pauseSimulation(state: SimulationState): SimulationState {
  return { ...state, status: 'paused' };
}

export function resumeSimulation(state: SimulationState): SimulationState {
  return { ...state, status: 'in-progress' };
}

export function getSimulationSummary(state: SimulationState): {
  overallScore: number;
  completion: number;
  topInsights: string[];
  strengths: string[];
  areasForGrowth: string[];
  recommendation: string;
} {
  const scenario = getScenarioById(state.scenarioId);
  if (!scenario) throw new Error(`Scenario not found: ${state.scenarioId}`);
  const avgScore = state.score || 0;
  const completion = state.currentTurn / state.maxTurns;
  const qualityDistribution = state.turns.map(t => t.decisionQuality);
  const strengths: string[] = [];
  const areasForGrowth: string[] = [];
  const avgQuality = qualityDistribution.length > 0
    ? qualityDistribution.reduce((a, b) => a + b, 0) / qualityDistribution.length
    : 0;
  if (avgQuality >= 0.8) strengths.push('Consistently demonstrates high-quality decision-making');
  if (avgQuality >= 0.7) strengths.push('Balances multiple stakeholder perspectives effectively');
  if (avgQuality < 0.6) areasForGrowth.push('Consider a broader range of stakeholder impacts');
  if (avgQuality < 0.5) areasForGrowth.push('Think more systematically about constraint resolution');
  areasForGrowth.push('Practice framing decisions in terms of long-term consequences');
  const recommendation = avgScore >= 0.75
    ? 'Ready for advanced scenarios. Consider mentoring others.'
    : avgScore >= 0.55
      ? 'Making solid progress. Focus on feedback areas for growth.'
      : 'Review fundamentals and practice with more scenarios before advancing.';
  return {
    overallScore: avgScore,
    completion: Math.round(completion * 100),
    topInsights: state.insights.slice(-5),
    strengths,
    areasForGrowth,
    recommendation,
  };
}

function scoreActionQuality(action: string, scenario: SimulationScenario): number {
  const keywords = ['empathy', 'listen', 'understand', 'plan', 'develop', 'support', 'coach', 'mentor', 'collaborate', 'communicate', 'honest', 'transparent', 'action', 'timeline', 'measure', 'goal', 'data', 'stakeholder', 'team', 'group', 'metric', 'milestone'];
  const lowerAction = action.toLowerCase();
  let score = 0.4;
  const matches = keywords.filter(k => lowerAction.includes(k));
  score += matches.length * 0.06;
  if (lowerAction.includes('data') || lowerAction.includes('metric')) score += 0.08;
  if (lowerAction.includes('stakeholder') || lowerAction.includes('team')) score += 0.06;
  if (lowerAction.includes('hurry') || lowerAction.includes('rush')) score -= 0.12;
  return Math.min(Math.max(score, 0.15), 0.95);
}

function computeStakeholderAlignment(action: string, scenario: SimulationScenario): number {
  const lowerAction = action.toLowerCase();
  let alignment = 0.4;
  const stakeholderKeywords = scenario.stakeholders.map(s => s.name.toLowerCase().split(' ')[0]);
  stakeholderKeywords.forEach(kw => { if (lowerAction.includes(kw)) alignment += 0.08; });
  if (lowerAction.includes('team') || lowerAction.includes('group')) alignment += 0.06;
  if (lowerAction.includes('individual') || lowerAction.includes('one-on-one')) alignment += 0.05;
  return Math.min(alignment, 0.95);
}

function computeConstraintResolution(action: string, scenario: SimulationScenario): number {
  const lowerAction = action.toLowerCase();
  let resolution = 0.3;
  const constraintKeywords = ['time', 'deadline', 'resource', 'budget', 'team', 'policy', 'process', 'timeline', 'plan', 'schedule'];
  constraintKeywords.forEach(kw => { if (lowerAction.includes(kw)) resolution += 0.07; });
  return Math.min(resolution, 0.9);
}

function generateInsights(action: string, quality: number, scenario: SimulationScenario): string[] {
  const insights: string[] = [];
  if (quality > 0.75) {
    insights.push('Strong strategic alignment demonstrated in this decision.');
    insights.push('Consider how this approach creates ripple effects across the organization.');
  } else if (quality > 0.55) {
    insights.push('Reasonable approach, but explore how different stakeholders might react.');
    insights.push('Think about what data would strengthen this decision.');
  } else {
    insights.push('This approach has limitations. Consider alternative framings.');
    insights.push('Ask yourself: what would a more experienced leader do differently?');
  }
  return insights;
}

function generateCoachResponse(action: string, outcome: DecisionOutcome, scenario: SimulationScenario): string {
  const responses: Record<DecisionOutcome, string[]> = {
    success: [
      'That demonstrates excellent judgment. Let\'s explore the ripple effects of this choice.',
      'Strong approach. Consider how this creates value for all stakeholders involved.',
      'You\'re showing real leadership here. What would you do differently if you had more resources?',
    ],
    partial: [
      'Good direction. Let\'s examine some blind spots in this approach.',
      'Noted. How might the other stakeholders react to this plan?',
      'Consider the second-order effects of this decision.',
    ],
    failure: [
      'Let\'s pause and reconsider. What data are we missing here?',
      'This approach may face resistance. What\'s another way to frame this?',
      'Let\'s explore alternative paths before committing to this direction.',
    ],
  };
  const list = responses[outcome];
  return list[Math.floor(Math.random() * list.length)];
}

export function generatePossibleActions(scenario: SimulationScenario, state: SimulationState): string[] {
  if (state.currentTurn === 0) return scenario.possibleActions.slice(0, 3);
  if (state.currentTurn <= 2) return scenario.possibleActions.slice(1, 5);
  return scenario.possibleActions.slice(2);
}
