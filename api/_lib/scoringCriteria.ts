/**
 * Org Intelligence — 5-Criteria Scoring Framework
 * Source of truth: docs/org_intelligence_scoring_spec_v1.2.md
 *
 * Implements the v1.2 spec proposal. Weights and tier boundaries are
 * subject to Kevin sign-off (see spec §"Open Questions for Kevin").
 * If sign-off changes, update this file in one place — all callers
 * (compute.ts, future admin UI, scoring tests) will pick up the new values.
 *
 * Backend file — internal terminology allowed (admin-only access).
 */

export type CriterionId = 'C1' | 'C2' | 'C3' | 'C4' | 'C5';

export type TierId = 'T1_STRONG' | 'T2_GOOD' | 'T3_POTENTIAL' | 'T4_NOT_YET';

export interface Criterion {
  id: CriterionId;
  name: string;
  shortName: string;
  weight: number;          // 0..1, sum of all weights = 1.0
  rubricLow: string;       // 0-7 range
  rubricMid: string;       // 8-13 range
  rubricHigh: string;      // 14-20 range
  description: string;     // for admin UI / debug
}

export const CRITERIA: Record<CriterionId, Criterion> = {
  C1: {
    id: 'C1',
    name: 'Tenure & Track Record',
    shortName: 'Tenure',
    weight: 0.25,
    rubricLow: 'Frequent short tenures, employment gaps, limited scope',
    rubricMid: 'Stable progression with some scope growth',
    rubricHigh: 'Long stable tenure with progressive responsibility, leadership roles',
    description: 'Career progression, stability, and growth in scope over time',
  },
  C2: {
    id: 'C2',
    name: 'Network & Influence',
    shortName: 'Network',
    weight: 0.20,
    rubricLow: 'Limited visibility, narrow industry footprint',
    rubricMid: 'Known within immediate company or function',
    rubricHigh: 'Recognized authority, speaking/publishing/advisory, well-connected',
    description: 'Breadth and depth of professional network and domain influence',
  },
  C3: {
    id: 'C3',
    name: 'Performance & Impact',
    shortName: 'Performance',
    weight: 0.25,
    rubricLow: 'Vague achievements, limited quantifiable outcomes',
    rubricMid: 'Some attributable wins, clear business impact',
    rubricHigh: 'Specific, attributable, compounding business outcomes',
    description: 'Quantified business outcomes delivered',
  },
  C4: {
    id: 'C4',
    name: 'Mobility & Adaptability',
    shortName: 'Mobility',
    weight: 0.15,
    rubricLow: 'Deep specialization, geographic or functional constraints',
    rubricMid: 'Some cross-functional exposure, willing to move within scope',
    rubricHigh: 'Demonstrated pivots, international experience, flexible scope',
    description: 'Openness and ability to move between roles, industries, geographies',
  },
  C5: {
    id: 'C5',
    name: 'Cultural & Mandate Fit',
    shortName: 'Cultural Fit',
    weight: 0.15,
    rubricLow: 'Past roles in very different cultural or governance contexts',
    rubricMid: 'Some alignment with mandate context',
    rubricHigh: 'Strong alignment with mandate stakeholders, pace, governance',
    description: 'Alignment between individual working style and target mandate',
  },
};

export const TIER_BOUNDARIES: Record<TierId, { min: number; label: string }> = {
  T1_STRONG:    { min: 80, label: 'Strong Fit' },
  T2_GOOD:      { min: 60, label: 'Good Fit' },
  T3_POTENTIAL: { min: 40, label: 'Potential Fit' },
  T4_NOT_YET:   { min:  0, label: 'Not Yet Fit' },
};

export const OVERRIDE_MIN_REASON_LENGTH = 30;
export const LLM_TEMPERATURE = 0.1;
export const LLM_TIMEOUT_MS = 7_000;
export const LLM_MODEL: 'deepseek-v4-flash' = 'deepseek-v4-flash';
export const LLM_MAX_TOKENS = 200;

export type SubScores = Record<CriterionId, number>;

/**
 * Compute composite score from 5 sub-scores.
 * Sub-scores are 0-20 each. Weights sum to 1.0.
 * Formula: (sum of sub_i * weight_i) * 5 → 0-100 scale, 1 decimal
 */
export function computeComposite(subScores: SubScores): number {
  let weighted = 0;
  for (const id of Object.keys(CRITERIA) as CriterionId[]) {
    const raw = subScores[id] ?? 0;
    const clamped = Math.max(0, Math.min(20, raw));
    weighted += clamped * CRITERIA[id].weight;
  }
  return Math.round(weighted * 5 * 10) / 10;
}

export function tierFor(composite: number): TierId {
  if (composite >= TIER_BOUNDARIES.T1_STRONG.min) return 'T1_STRONG';
  if (composite >= TIER_BOUNDARIES.T2_GOOD.min)   return 'T2_GOOD';
  if (composite >= TIER_BOUNDARIES.T3_POTENTIAL.min) return 'T3_POTENTIAL';
  return 'T4_NOT_YET';
}

export function tierLabel(t: TierId): string {
  return TIER_BOUNDARIES[t].label;
}

/**
 * Module-load sanity check: weights must sum to 1.0.
 * If a future edit breaks this, fail loudly at deploy time, not at runtime.
 */
const TOTAL_WEIGHT = Object.values(CRITERIA).reduce((s, c) => s + c.weight, 0);
if (Math.abs(TOTAL_WEIGHT - 1.0) > 0.001) {
  throw new Error(
    `CRITERIA weights sum to ${TOTAL_WEIGHT}, expected 1.0. ` +
    `Check api/_lib/scoringCriteria.ts configuration.`
  );
}
