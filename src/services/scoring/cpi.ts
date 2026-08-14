// ═══════════════════════════════════════════════════════════
// CPI Scoring Config — Career Positioning Index (Phase 12)
// Scoring lives in existing CPI pipeline; this exports
// metadata so the unified AssessmentEngine can route CPI.
// ═══════════════════════════════════════════════════════════

export interface CPICfgDimension {
  id: string;
  name: string;
  weight: number;
  anchors: { min: number; max: number; label: string }[];
}

export interface CPICompositeBand {
  min: number;
  max: number;
  band: string;
  interpretation: string;
}

export const INSTRUMENT = 'CPI';
export const FULL_NAME = 'Career Positioning Index';
export const VERSION = '12.0';
export const TIER = 'flagship';
export const SCORING_MODE = 'weighted_average';
export const PRICE_MILES = 199;
export const TOTAL_QUESTIONS = 25;
export const SCALE = 'Scenario + structured evidence';
export const DELIVERY_MINUTES = 25;

export const DIMENSIONS: CPICfgDimension[] = [
  { id: 'D1', name: 'Strategic Orientation',       weight: 0.20, anchors: [] },
  { id: 'D2', name: 'Cross-Border Adaptability',   weight: 0.20, anchors: [] },
  { id: 'D3', name: 'Stakeholder Influence',       weight: 0.20, anchors: [] },
  { id: 'D4', name: 'Execution Discipline',        weight: 0.20, anchors: [] },
  { id: 'D5', name: 'Leadership Presence',         weight: 0.20, anchors: [] },
];

export const COMPOSITE_BANDS: CPICompositeBand[] = [
  { min: 80, max: 100, band: 'Flagship Candidate',     interpretation: 'Top 10% of APAC executive benchmarks.' },
  { min: 65, max: 79,  band: 'Board-Ready',            interpretation: 'Deployable at board / C-suite level.' },
  { min: 45, max: 64,  band: 'Nearly-Deployable',      interpretation: 'Close; targeted development areas identified.' },
  { min: 25, max: 44,  band: 'Positioning Gaps',       interpretation: 'Clear positioning work required before next mandate.' },
  { min:  0, max: 24,  band: 'Foundational Rebuild',   interpretation: 'Rebuild narrative, evidence base and visibility.' },
];

export const ARCHETYPES: Array<{ id: string; name: string; description: string }> = [
  { id: 'A1', name: 'Strategic Architect',    description: 'Frames the future, not just the task.' },
  { id: 'A2', name: 'Cross-Border Catalyst',  description: 'Translates across cultures and markets.' },
  { id: 'A3', name: 'Precision Operator',     description: 'Flawless execution engine.' },
  { id: 'A4', name: 'Influential Builder',    description: 'Moves stakeholder ecosystems.' },
  { id: 'A5', name: 'Adaptive Visionary',     description: 'Re-frames reality on the fly.' },
  { id: 'A6', name: 'Grounded Executor',      description: 'Delivers today while building tomorrow.' },
];

export const B2C_NAME = 'Career Positioning Index';
export const TAGLINE = 'The flagship executive diagnostic — benchmarking APAC senior leaders across 5 career positioning pillars.';

export const DIMENSION_VERDICTS = [
  { dim: 'all', min: 80, max: 100, verdict: 'Flagship', meaning: 'Top-tier executive capability with demonstrable APAC impact.' },
  { dim: 'all', min: 60, max: 79.9, verdict: 'Board-Ready', meaning: 'Deployable at C-suite / board level; targeted refinements only.' },
  { dim: 'all', min: 40, max: 59.9, verdict: 'Developing', meaning: 'Emerging senior capability with clear development leverage points.' },
  { dim: 'all', min: 0,  max: 39.9, verdict: 'Gap',      meaning: 'Material positioning work required before next mandate.' },
];

export const IS_CPI_LEGACY = true;

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
