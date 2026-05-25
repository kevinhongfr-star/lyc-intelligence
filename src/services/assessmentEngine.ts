// Assessment Engine - CPD (Career Positioning Diagnostic)

// Typescript version

export type DimensionId =
  | 'strategic_orientation'
  | 'cross_border_adaptability'
  | 'stakeholder_influence'
  | 'execution_discipline'
  | 'leadership_presence';

export type DimensionAnswer = { score: number; text: string; label: string };
export type ScenarioQuestion = { id: string; dimension: DimensionId; scenario: string; answers: DimensionAnswer[] };

export type CPDArchetype =
  | 'Strategic Architect'
  | 'Cross-Border Catalyst'
  | 'Precision Operator'
  | 'Influential Builder'
  | 'Adaptive Visionary'
  | 'Grounded Executor';

export type WritingStyle = 'analytical' | 'visionary' | 'pragmatic' | 'empathetic';

export type CareerSituation = 'senior_leader' | 'actively_seeking' | 'recently_transitioned' | 'building_board';
export type CareerGeography = 'europe_to_apac' | 'apac_to_europe' | 'already_cross_border' | 'single_market';
export type PrimaryFunction = 'CEO' | 'CFO' | 'CTO' | 'CHRO' | 'CMO' | 'COO' | 'General Counsel' | 'Board' | 'Other';
export type CareerGoal =
  | 'land_target_role' | 'build_thought_leadership' | 'board_presence' | 'cross_border_credentials' | 'negotiate_offer' | 'internal_transition' | 'geography_move' | 'build_team_capability';

export interface AssessmentState {
  gate: {
    name: string; email: string; title?: string; country?: string;
  };
  professionalContext: { situation: CareerSituation; geography: CareerGeography; function: PrimaryFunction;
  };
  dimensions: Record<string, number>; // questionId → score
  crossBorderQuestions: Record<string, number>; // questionId → score
  writingStyle: WritingStyle;
  careerGoals: CareerGoal[];
}

// ============ DATA: Scenario Questions for each dimension
export const CPD_SCENARIOS: ScenarioQuestion[] = [
  // Strategic Orientation (4 questions)
  {
    id: 'so_q1',
    dimension: 'strategic_orientation',
    scenario: 'You are asked to lead a new strategic planning session with your CEO and board. The CEO wants immediate next steps from last-minute changes: you:',
    answers: [
      { score: 2, text: 'Suggest delaying changes but express concerns about timing', label: 'A' },
      { score: 3, text: 'Push back privately, explaining risks but still align to changes', label: 'B' },
      { score: 4, text: 'Ask clarifying the strategic rationale', label: 'C' },
      { score: 5, text: 'Facilitate a brief discussion and iterate on strategic trade-offs', label: 'D' },
    ],
  },
  {
    id: 'so_q2',
    dimension: 'strategic_orientation',
    scenario: 'A new competitor launches a disruptive product is gaining on your core market. Your first response:',
    answers: [
      { score: 2, text: 'Optimize existing products to compete', label: 'A' },
      { score: 3, text: 'Conduct quick market research', label: 'B' },
      { score: 4, text: 'Form a small team to explore alternatives', label: 'C' },
      { score: 5, text: 'Define long-term response strategy and communicate vision', label: 'D' },
    ],
  },
  {
    id: 'so_q3',
    dimension: 'strategic_orientation',
    scenario: 'Your team has conflicting priorities between two urgent projects: you:',
    answers: [
      { score: 2, text: 'Pick based on immediate impact', label: 'A' },
      { score: 3, text: 'Negotiate trade-offs', label: 'B' },
      { score: 4, text: 'Use strategic lens', label: 'C' },
      { score: 5, text: 'Align to company goals and map priorities', label: 'D' },
    ],
  },
  {
    id: 'so_q4',
    dimension: 'strategic_orientation',
    scenario: 'You inherit an underperforming business unit. Your initial 90-day approach:',
    answers: [
      { score: 2, text: 'Make immediate cost-cutting and efficiency', label: 'A' },
      { score: 3, text: 'Assess and fix', label: 'B' },
      { score: 4, text: 'diagnose and pivot strategy', label: 'C' },
      { score: 5, text: 'shape a bold vision', label: 'D' },
    ],
  },
  // Cross-Border Adaptability (4)
  {
    id: 'cb_q1',
    dimension: 'cross_border_adaptability',
    scenario: 'You\'ve just joined as regional CFO. Your new team operates differently decision-making is slower and more consensus-driven. After two months you:',
    answers: [
      { score: 2, text: 'Push for the direct, faster approach you know works', label: 'A' },
      { score: 4, text: 'Observe for 90 days before suggesting any changes', label: 'B' },
      { score: 5, text: 'Adapt your style while gradually introducing what works', label: 'C' },
      { score: 4, text: 'Ask your team to help you understand the "why" before changing', label: 'D' },
    ],
  },
  {
    id: 'cb_q2',
    dimension: 'cross_border_adaptability',
    scenario: 'Your global counterpart has different communication norms (e.g., feedback): you:',
    answers: [
      { score: 2, text: 'Ask them to follow "speak your style', label: 'A' },
      { score: 3, text: 'Use a translator or intermediary', label: 'B' },
      { score: 4, text: 'Adapt your style to work together', label: 'C' },
      { score: 5, text: 'Adapt and bridge', label: 'D' },
    ],
  },
  {
    id: 'cb_q3',
    dimension: 'cross_border_adaptability',
    scenario: 'You are presenting to a global leadership audience',
    answers: [
      { score: 2, text: 'Use your standard home-market slides', label: 'A' },
      { score: 3, text: 'Adjust timing and pace', label: 'B' },
      { score: 4, text: 'Simplify language and jargon', label: 'C' },
      { score: 5, text: 'research culturalize and tailor content and learn', label: 'D' },
    ],
  },
  {
    id: 'cb_q4',
    dimension: 'cross_border_adaptability',
    scenario: 'You are managing a remote team spanning timezones. You:',
    answers: [
      { score: 2, text: 'Align to one timezone', label: 'A' },
      { score: 3, text: 'Rotate meeting times', label: 'B' },
      { score: 4, text: 'Use async and adjust', label: 'C' },
      { score: 5, text: 'Design inclusive processes', label: 'D' },
    ],
  },
  // Stakeholder Influence (4)
  {
    id: 'si_q1',
    dimension: 'stakeholder_influence',
    scenario: 'You need to convince skeptical stakeholders to your vision:',
    answers: [
      { score: 2, text: 'Use authority and mandate', label: 'A' },
      { score: 3, text: 'Build relationships first', label: 'B' },
      { score: 4, text: 'Frame and build', label: 'C' },
      { score: 5, text: 'listen, and influence with them and co-create', label: 'D' },
    ],
  },
  {
    id: 'si_q2',
    dimension: 'stakeholder_influence',
    scenario: 'A key stakeholder is opposing your proposal:',
    answers: [
      { score: 2, text: 'Go around them', label: 'A' },
      { score: 3, text: 'Meet privately understand their concerns privately', label: 'B' },
      { score: 4, text: 'involve them', label: 'C' },
      { score: 5, text: 'understand and co-create solution with them', label: 'D' },
    ],
  },
  {
    id: 'si_q3',
    dimension: 'stakeholder_influence',
    scenario: 'You are to communicate a difficult decision:',
    answers: [
      { score: 2, text: 'Communicate and execute', label: 'A' },
      { score: 3, text: 'Explain clearly and answer questions', label: 'B' },
      { score: 4, text: 'context', label: 'C' },
      { score: 5, text: 'and prepare stakeholders and build', label: 'D' },
    ],
  },
  {
    id: 'si_q4',
    dimension: 'stakeholder_influence',
    scenario: 'Your stakeholders have different priorities. You:',
    answers: [
      { score: 2, text: 'Prioritize the loudest voice', label: 'A' },
      { score: 3, text: 'balance them equally', label: 'B' },
      { score: 4, text: 'map relationships', label: 'C' },
      { score: 5, text: 'Align all stakeholders and align on shared goals', label: 'D' },
    ],
  },
  // Execution Discipline (4)
  {
    id: 'ed_q1',
    dimension: 'execution_discipline',
    scenario: 'Your team is behind on a critical deadline:',
    answers: [
      { score: 2, text: 'Push the team harder', label: 'A' },
      { score: 3, text: 'Reset expectations', label: 'B' },
      { score: 4, text: 'Diagnose bottlenecks', label: 'C' },
      { score: 5, text: 'address root causes and remove obstacles', label: 'D' },
    ],
  },
  {
    id: 'ed_q2',
    dimension: 'execution_discipline',
    scenario: 'You need to implement a new system/process:',
    answers: [
      { score: 2, text: 'Implement top-down', label: 'A' },
      { score: 3, text: 'Train team', label: 'B' },
      { score: 4, text: 'Pilot', label: 'C' },
      { score: 5, text: 'involve team design and iterate and learn', label: 'D' },
    ],
  },
  {
    id: 'ed_q3',
    dimension: 'execution_discipline',
    scenario: 'A project is going off track:',
    answers: [
      { score: 2, text: 'Quick and fix', label: 'A' },
      { score: 3, text: 'Re-plan', label: 'B' },
      { score: 4, text: 'Track closely', label: 'C' },
      { score: 5, text: 'and correct', label: 'D' },
    ],
  },
  {
    id: 'ed_q4',
    dimension: 'execution_discipline',
    scenario: 'You are to deliver results consistently:',
    answers: [
      { score: 2, text: 'Focus on hitting targets', label: 'A' },
      { score: 3, text: 'Set clear and plans', label: 'B' },
      { score: 4, text: 'Build processes', label: 'C' },
      { score: 5, text: 'Build accountability culture', label: 'D' },
    ],
  },
  // Leadership Presence (4)
  {
    id: 'lp_q1',
    dimension: 'leadership_presence',
    scenario: 'You are presenting to a senior audience:',
    answers: [
      { score: 2, text: 'Stick to slides', label: 'A' },
      { score: 3, text: 'Speak clearly and be clear and be confident', label: 'B' },
      { score: 4, text: 'Tell stories and use examples', label: 'C' },
      { score: 5, text: 'Connect authentically', label: 'D' },
    ],
  },
  {
    id: 'lp_q2',
    dimension: 'leadership_presence',
    scenario: 'Your team is facing uncertainty:',
    answers: [
      { score: 2, text: 'Give them reassurance', label: 'A' },
      { score: 3, text: 'Be visible and accessible', label: 'B' },
      { score: 4, text: 'Inspire confidence and calm', label: 'C' },
      { score: 5, text: 'Calm, model the right energy', label: 'D' },
    ],
  },
  {
    id: 'lp_q3',
    dimension: 'leadership_presence',
    scenario: 'You are receiving critical feedback:',
    answers: [
      { score: 2, text: 'Defend your position', label: 'A' },
      { score: 3, text: 'Listen and ask clarifying questions', label: 'B' },
      { score: 4, text: 'Seek to understand', label: 'C' },
      { score: 5, text: 'Reflect and learn and grow', label: 'D' },
    ],
  },
  {
    id: 'lp_q4',
    dimension: 'leadership_presence',
    scenario: 'You need to build trust with a new team:',
    answers: [
      { score: 2, text: 'Demonstrate expertise', label: 'A' },
      { score: 3, text: 'Listen actively', label: 'B' },
      { score: 4, text: 'Be transparent', label: 'C' },
      { score: 5, text: 'Be authentic and vulnerable', label: 'D' },
    ],
  },
];

// Cross-Border Readiness questions
export const CROSS_BORDER_QUESTIONS: { id: string; question: string; options: { score: number; label: string }[] }[] = [
  { id: 'cb_read_1', question: 'Language and communication adaptability', options: [ {score: 1, label: 'Limited'}, { score:2, label: 'Developing' }, { score:3, label: 'Comfortable' }, { score:4, label:'Strong' }, {score:5, label:'Advanced' } ] },
  { id: 'cb_read_2', question: 'Experience in matrix reporting', options: [ {score:1, label: 'None' }, { score:2, label: 'Limited' }, { score:3, label: 'Moderate' }, { score:4, label:'Extensive' }, { score:5, label: 'Expert' } ] },
  { id: 'cb_read_3', question: 'Comfort with regulatory ambiguity', options: [ { score:1, label:'Very low'}, { score:2, label:'Low'}, { score:3, label:'Moderate'}, { score:4, label:'High'}, { score:5, label:'Very high'} ] },
  { id: 'cb_read_4', question: 'Track record in unfamiliar cultural contexts', options: [ { score:1, label:'None'}, { score:2, label:'Limited'}, { score:3, label:'Moderate'}, { score:4, label:'Strong'}, { score:5, label:'Exceptional'} ] },
  { id: 'cb_read_5', question: 'Network strength outside home market', options: [ { score:1, label:'Weak'}, { score:2, label:'Developing'}, { score:3, label:'Growing'}, { score:4, label:'Strong'}, { score:5, label:'Extensive'} ] },
];

export const DIMENSION_WEIGHTS: Record<DimensionId, number> = {
  strategic_orientation: 0.25,
  cross_border_adaptability: 0.25,
  stakeholder_influence: 0.20,
  execution_discipline: 0.15,
  leadership_presence: 0.15,
};

export const DIMENSION_INFO: Record<DimensionId, { name: string; description: string }> = {
  strategic_orientation: { name: 'Strategic Orientation', description: 'Ability to think long-term and set direction' },
  cross_border_adaptability: { name: 'Cross-Border Adaptability', description: 'Ability to adapt across cultures' },
  stakeholder_influence: { name: 'Stakeholder Influence', description: 'Ability to influence and align' },
  execution_discipline: { name: 'Execution Discipline', description: 'Delivering results consistently' },
  leadership_presence: { name: 'Leadership Presence', description: 'Executive presence and trust' },
};

// === Functions

function calculateDimensionScore(dimension: DimensionId, answers: Record<string, number>): number {
  const questionsForDimension = CPD_SCENARIOS.filter(q => q.dimension === dimension);
  const scores = questionsForDimension.map(q => answers[q.id] || 3);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.round(avg * 20); // 0-100
}

function calculateCrossBorderScore(crossBorderAnswers: Record<string, number>): number {
  const answers: number[] = CROSS_BORDER_QUESTIONS.map(q => crossBorderAnswers[q.id] || 3);
  const avg = answers.reduce((a, b) => a + b, 0) / answers.length;
  return Math.round(avg * 20);
}

function getDimensionScores(answers: Record<string, number>): Record<DimensionId, number> {
  const scores: Partial<Record<DimensionId, number>> = {} as Record<DimensionId, number>;
  for (const dimId of Object.keys(DIMENSION_WEIGHTS) as DimensionId[]) {
    scores[dimId] = calculateDimensionScore(dimId, answers);
  }
  return scores as Record<DimensionId, number>;
}

function getCompositeScore(dimensionScores: Record<DimensionId, number>, crossBorderScore: number): number {
  let composite = 0;
  for (const [dimId, score] of Object.entries(dimensionScores)) {
    const weight = DIMENSION_WEIGHTS[dimId as DimensionId] || 0;
    composite += score * weight;
  }
  if (crossBorderScore >= 80) composite += 5; // Bonus! (Max 100)
  return Math.min(100, Math.round(composite));
}

function getTopDimensions(dimensionScores: Record<DimensionId, number>): [DimensionId, DimensionId] {
  const sorted: Array<{ id: DimensionId; score: number }> = (Object.entries(dimensionScores) as Array<[DimensionId, number]>).map(
    ([id, score]) => ({ id, score })
  ).sort((a, b) => b.score - a.score);
  return [sorted[0].id, sorted[1].id];
}

function getArchetype(dimensionScores: Record<DimensionId, number>, crossBorderScore: number): CPDArchetype {
  const [top1, top2] = getTopDimensions(dimensionScores);
  
  if (top1 === 'strategic_orientation' && top2 === 'stakeholder_influence' && crossBorderScore >= 70) {
    return 'Strategic Architect';
  }
  if (top1 === 'cross_border_adaptability' && top2 === 'leadership_presence' && crossBorderScore >= 75) {
    return 'Cross-Border Catalyst';
  }
  if (top1 === 'execution_discipline' && top2 === 'strategic_orientation') {
    return 'Precision Operator';
  }
  if (top1 === 'leadership_presence' && top2 === 'stakeholder_influence' && crossBorderScore >= 60) {
    return 'Influential Builder';
  }
  if (top1 === 'cross_border_adaptability' && top2 === 'strategic_orientation' && crossBorderScore >= 80) {
    return 'Adaptive Visionary';
  }
  if (top1 === 'execution_discipline' && top2 === 'cross_border_adaptability') {
    return 'Grounded Executor';
  }
  return 'Precision Operator'; // Fallback
}

export const ARCHETYPE_INFO: Record<CPDArchetype, { description: string; strengths: string[]; development: string[]; tagline: string }> = {
  'Strategic Architect': {
    description: 'You see the big picture and inspire others to follow. Great at setting direction and building buy-in.',
    strengths: ['Strategic thinking', 'Stakeholder influence', 'Visionary leadership', 'Long-term perspective'],
    development: ['Execution', 'Adaptability'],
    tagline: 'Building leadership that works across borders'
  },
  'Cross-Border Catalyst': {
    description: 'You thrive in diverse, multi-cultural environments.',
    strengths: ['Cultural adaptability', 'Leadership presence', 'Relationship-building', 'Global mindset'],
    development: ['Strategic rigor', 'Execution discipline'],
    tagline: 'Bridging cultures for global impact'
  },
  'Precision Operator': {
    description: 'You excel at execution and delivering results consistently.',
    strengths: ['Execution discipline', 'Strategic orientation', 'Attention to detail', 'Consistency'],
    development: ['Cross-border adaptability', 'Leadership presence'],
    tagline: 'Delivering results that matter'
  },
  'Influential Builder': {
    description: 'You build trust and inspire people to follow you.',
    strengths: ['Leadership presence', 'Stakeholder influence', 'Relationships', 'Inspiration'],
    development: ['Strategic thinking', 'Execution discipline'],
    tagline: 'Leading with presence and purpose'
  },
  'Adaptive Visionary': {
    description: 'You can adapt to any culture while setting inspiring vision.',
    strengths: ['Cross-border adaptability', 'Strategic orientation', 'Vision', 'Cultural intelligence'],
    development: ['Execution', 'Influence'],
    tagline: 'Adapting, innovating, leading'
  },
  'Grounded Executor': {
    description: 'You get things done while adapting to circumstances.',
    strengths: ['Execution discipline', 'Cross-border adaptability', 'Resilience', 'Delivery'],
    development: ['Strategic vision', 'Influence'],
    tagline: 'Getting it done, anywhere'
  },
};

export function getCrossBorderTier(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Elite', color: '#22C55E' };
  if (score >= 65) return { label: 'Advanced', color: '#C108AB' };
  if (score >= 50) return { label: 'Established', color: '#EAB308' };
  return { label: 'Developing', color: '#888888' };
}

export const ASSESSMENT_ENGINE = {
  calculateDimensionScore,
  calculateCrossBorderScore,
  getDimensionScores,
  getCompositeScore,
  getArchetype,
  getTopDimensions,
  ARCHETYPE_INFO,
  getCrossBorderTier,
};
