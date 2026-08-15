// ═══════════════════════════════════════════════════════════
// CPI Scoring Config — Career Positioning Index (B2C single-rater port)
// X2-1: Flagship executive self-awareness assessment.
// 6 dimensions (5 weighted + 1 meta self-awareness) · 6 archetypes.
// Source: B2B CPI framework, simplified to single-rater self-assessment.
// Multi-rater / teams version = separate B2B upsell (noted on page).
// ═══════════════════════════════════════════════════════════

export interface CPICfgDimension {
  id: string;
  name: string;
  description?: string;
  weight: number;
  question_ids: string[];
  reverse_coded: string[];
  raw_max: number;
  n_questions: number;
  normalised_max: number;
  normalised_formula: string;
  /** Marks the meta-dimension (Self-Awareness Quotient) — scored through
   *  variance rather than direct weighting in the composite. */
  is_meta?: boolean;
  anchors: { min: number; max: number; label: string }[];
}

export interface CPICompositeBand {
  min: number;
  max: number;
  band: string;
  interpretation: string;
}

export const INSTRUMENT = 'CPI';
export const FULL_NAME = 'CPI — Career Positioning Index';
// TODO(Akira - X4-1): confirm descriptor against Diagnostic Portfolio Master Library. Current = CPI — Career Positioning Index draft derived from reportPipeline.
export const B2C_NAME = 'CPI — Career Positioning Index';
// TODO(Akira - X4-1): confirm descriptor against Diagnostic Portfolio Master Library. Current = CPI — Career Positioning Index draft derived from reportPipeline.
export const VERSION = '13.0';
export const TIER = 'flagship';
export const SCORING_MODE = 'weighted_average';
export const PRICE_MILES = 199;
export const TOTAL_QUESTIONS = 30;
export const SCALE = '1-5 Likert';
export const DELIVERY_MINUTES = 15;

// 6 dimensions: 5 weighted operational dimensions + 1 meta self-awareness
// dimension. The meta dimension is included in archetype matching but
// receives reduced composite weight (it modulates interpretation rather
// than driving the headline score).
//
// X4-6 CPI dimension drift (Akira audit 2026-08-15): APPROVED DIVERGENCE.
// B2C CPI (this file) = 6-D B2C single-rater flagship variant (executive
// self-assessment surface on lyc-intelligence.app). It is NOT the same
// instrument as B2B CPI v2 Master Library (12-D multi-rater structure
// containing Talent Representation, Development Investment, External
// Hiring Capability, etc.). B2B v2 targets internal enterprise / people
// analytics teams. The B2C surface deliberately uses a smaller,
// psychologically self-contained 6-D set:
//   1. Strategic Orientation
//   2. Cross-Border Adaptability
//   3. Stakeholder Influence
//   4. Execution Discipline
//   5. Leadership Presence
//   6. Self-Awareness Quotient
//
// If a future cycle ports B2B CPI v2 for the corporate surface, it MUST
// be a separate instrument key (e.g., CPI_B2B) and NOT merge into the
// B2C CPI scoring config used here.
export const DIMENSIONS: CPICfgDimension[] = [
  {
    id: 'D1',
    name: 'Strategic Orientation',
    description: 'Long-horizon framing and trade-off discipline.',
    weight: 0.22,
    question_ids: ['Q01', 'Q02', 'Q03', 'Q04', 'Q05'],
    reverse_coded: ['Q02'],
    raw_max: 25,
    n_questions: 5,
    normalised_max: 20,
    normalised_formula: '(raw/25) × 20',
    anchors: [],
  },
  {
    id: 'D2',
    name: 'Cross-Border Adaptability',
    description: 'Agility across cultures, markets, and organizational structures.',
    weight: 0.20,
    question_ids: ['Q06', 'Q07', 'Q08', 'Q09', 'Q10'],
    reverse_coded: ['Q08'],
    raw_max: 25,
    n_questions: 5,
    normalised_max: 20,
    normalised_formula: '(raw/25) × 20',
    anchors: [],
  },
  {
    id: 'D3',
    name: 'Stakeholder Influence',
    description: 'Mobilizing ecosystem actors without formal authority.',
    weight: 0.20,
    question_ids: ['Q11', 'Q12', 'Q13', 'Q14', 'Q15'],
    reverse_coded: ['Q14'],
    raw_max: 25,
    n_questions: 5,
    normalised_max: 20,
    normalised_formula: '(raw/25) × 20',
    anchors: [],
  },
  {
    id: 'D4',
    name: 'Execution Discipline',
    description: 'Reliable delivery through structure, cadence, and prioritization.',
    weight: 0.20,
    question_ids: ['Q16', 'Q17', 'Q18', 'Q19', 'Q20'],
    reverse_coded: ['Q18'],
    raw_max: 25,
    n_questions: 5,
    normalised_max: 20,
    normalised_formula: '(raw/25) × 20',
    anchors: [],
  },
  {
    id: 'D5',
    name: 'Leadership Presence',
    description: 'Composure, narrative, and inspiration under pressure.',
    weight: 0.18,
    question_ids: ['Q21', 'Q22', 'Q23', 'Q24', 'Q25'],
    reverse_coded: ['Q24'],
    raw_max: 25,
    n_questions: 5,
    normalised_max: 20,
    normalised_formula: '(raw/25) × 20',
    anchors: [],
  },
  {
    id: 'D6',
    name: 'Self-Awareness Quotient',
    description: 'Accurate read of one\'s own operating patterns and blind spots. The meta-dimension.',
    weight: 0.10,
    question_ids: ['Q26', 'Q27', 'Q28', 'Q29', 'Q30'],
    reverse_coded: ['Q29'],
    raw_max: 25,
    n_questions: 5,
    normalised_max: 20,
    normalised_formula: '(raw/25) × 20',
    is_meta: true,
    anchors: [],
  },
];

export const COMPOSITE_BANDS: CPICompositeBand[] = [
  { min: 80, max: 100, band: 'Flagship Candidate',  interpretation: 'Top decile of APAC executive benchmarks. Deployable at board / C-suite level immediately.' },
  { min: 65, max: 79,  band: 'Board-Ready',         interpretation: 'Deployable at board / C-suite level. Targeted refinements only.' },
  { min: 45, max: 64,  band: 'Nearly-Deployable',   interpretation: 'Close; targeted development areas identified.' },
  { min: 25, max: 44,  band: 'Positioning Gaps',    interpretation: 'Clear positioning work required before next mandate.' },
  { min: 0,  max: 24,  band: 'Foundational Rebuild', interpretation: 'Rebuild narrative, evidence base and visibility.' },
];

// 6 archetypes — primary_dim is used for matching (top-scoring dimension).
// 'Balanced Collaborative' has no primary_dim; matched when no single
// dimension dominates (top spread below threshold).
export const ARCHETYPES = [
  {
    id: 'A1',
    // TODO(Akira - X4-4): confirm archetype-word 'Architect' retention against Architecture-ban policy
    name: 'Strategic Architect',
    description: 'Systemic thinker with future-back orientation. Frames the future, not just the task.',
    primary_dim: 'D1',
    tagline: 'Systemic thinker with future-back orientation.',
    strengths: ['Long-horizon framing', 'Trade-off discipline', 'Connects function to enterprise strategy'],
    growth_areas: ['May under-invest in execution mechanics', 'Can lose the room if narrative is too abstract'],
  },
  {
    id: 'A2',
    name: 'Precision Operator',
    description: 'Reliable delivery through structure and cadence. Flawless execution engine.',
    primary_dim: 'D4',
    tagline: 'Reliable delivery through structure and cadence.',
    strengths: ['Operational cadence', 'Metric discipline', 'Slippage detection'],
    growth_areas: ['May default to plan over people', 'Strategic narrative can feel thin'],
  },
  {
    id: 'A3',
    name: 'Influential Builder',
    description: 'Coalition-based mobilizer of people and plans. Moves stakeholder ecosystems.',
    primary_dim: 'D3',
    tagline: 'Coalition-based mobilizer of people and plans.',
    strengths: ['Stakeholder mapping', 'Coalition building', 'Influence without authority'],
    growth_areas: ['May over-index on relationships vs. substance', 'Execution cadence can slip'],
  },
  {
    id: 'A4',
    name: 'Confident Executor',
    description: 'Inspires confident, decisive execution under pressure. Visible in high-stakes moments.',
    primary_dim: 'D5',
    tagline: 'Inspires confident, decisive execution.',
    strengths: ['Composure under scrutiny', 'Narrative authority', 'Inspirational presence'],
    growth_areas: ['Can dominate over collaborate', 'May under-invest in execution mechanics'],
  },
  {
    id: 'A5',
    name: 'Cross-Border Catalyst',
    description: 'Bridges cultures, markets, and operating silos. Translates across boundaries.',
    primary_dim: 'D2',
    tagline: 'Bridges cultures, markets, and operating silos.',
    strengths: ['APAC cultural fluency', 'Cross-market stakeholder capital', 'Regulatory awareness'],
    growth_areas: ['May be perceived as generalist', 'Depth in any single market can lag'],
  },
  {
    id: 'A6',
    name: 'Balanced Collaborative',
    description: 'High floor across all dimensions. Stable integrator who compounds team capability.',
    primary_dim: null,
    tagline: 'High floor across all dimensions. Stable integrator.',
    strengths: ['No critical gaps', 'Integrates perspectives', 'Builds team capability'],
    growth_areas: ['May lack a distinctive edge', 'Positioning narrative needs deliberate sharpening'],
  },
];

export const TAGLINE = 'The flagship executive self-awareness assessment — six dimensions, six archetypes, one composite profile.';

export const DIMENSION_VERDICTS = [
  { dim: 'all', min: 80, max: 100, verdict: 'Flagship',     meaning: 'Top-tier executive capability with demonstrable APAC impact.' },
  { dim: 'all', min: 60, max: 79.9, verdict: 'Board-Ready',  meaning: 'Deployable at C-suite / board level; targeted refinements only.' },
  { dim: 'all', min: 40, max: 59.9, verdict: 'Developing',   meaning: 'Emerging senior capability with clear development leverage points.' },
  { dim: 'all', min: 0,  max: 39.9, verdict: 'Gap',          meaning: 'Material positioning work required before next mandate.' },
];

// Retained for legacy CPI renderer references — B2C v1 uses the Akira engine
// for deterministic scoring. Multi-rater / teams version remains a B2B upsell.
export const IS_CPI_LEGACY = false;

export const SCORING_CONFIG = {
  INSTRUMENT,
  FULL_NAME,
  VERSION,
  TOTAL_QUESTIONS,
  SCALE,
  DELIVERY_MINUTES,
  TIER,
  SCORING_MODE,
  PRICE_MILES,
  B2C_NAME,
  TAGLINE,
  DIMENSIONS,
  COMPOSITE_BANDS,
  DIMENSION_VERDICTS,
  ARCHETYPES,
};
