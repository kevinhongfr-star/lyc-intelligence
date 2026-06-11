/**
 * Client-facing 5-criteria scoring definitions.
 *
 * MIRROR of api/_lib/scoringCriteria.ts — but omits internal `weight` field
 * per LYC brand rule (NO INTERNAL-FRAMEWORK REFERENCES IN CLIENT OUTPUT).
 *
 * If you change the server version, update this file too. Drift between
 * server and client will cause confusion in the admin UI.
 */
export type CriterionId = 'C1' | 'C2' | 'C3' | 'C4' | 'C5';

export type TierId = 'T1_STRONG' | 'T2_GOOD' | 'T3_POTENTIAL' | 'T4_NOT_YET';

export interface Criterion {
  id: CriterionId;
  name: string;
  shortName: string;
  rubricLow: string;
  rubricMid: string;
  rubricHigh: string;
  description: string;
}

export const CRITERIA: Record<CriterionId, Criterion> = {
  C1: {
    id: 'C1',
    name: 'Tenure & Track Record',
    shortName: 'Tenure',
    rubricLow: 'Frequent short tenures, employment gaps, limited scope',
    rubricMid: 'Stable progression with some scope growth',
    rubricHigh: 'Long stable tenure with progressive responsibility, leadership roles',
    description: 'Career progression, stability, and growth in scope over time',
  },
  C2: {
    id: 'C2',
    name: 'Network & Influence',
    shortName: 'Network',
    rubricLow: 'Limited visibility, narrow industry footprint',
    rubricMid: 'Known within immediate company or function',
    rubricHigh: 'Recognized authority, speaking/publishing/advisory, well-connected',
    description: 'Breadth and depth of professional network and domain influence',
  },
  C3: {
    id: 'C3',
    name: 'Performance & Impact',
    shortName: 'Performance',
    rubricLow: 'Vague achievements, limited quantifiable outcomes',
    rubricMid: 'Some attributable wins, clear business impact',
    rubricHigh: 'Specific, attributable, compounding business outcomes',
    description: 'Quantified business outcomes delivered',
  },
  C4: {
    id: 'C4',
    name: 'Mobility & Adaptability',
    shortName: 'Mobility',
    rubricLow: 'Deep specialization, geographic or functional constraints',
    rubricMid: 'Some cross-functional exposure, willing to move within scope',
    rubricHigh: 'Demonstrated pivots, international experience, flexible scope',
    description: 'Openness and ability to move between roles, industries, geographies',
  },
  C5: {
    id: 'C5',
    name: 'Cultural & Mandate Fit',
    shortName: 'Cultural Fit',
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
