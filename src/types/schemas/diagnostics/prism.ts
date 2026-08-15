/**
 * schemas/diagnostics/prism.ts — PRISM: Career & Professional Branding (canonical)
 * Canonical: 5 dimensions, 10 archetypes (per canon/instruments/prism.json)
 * Extends: AssessmentResultSchema (shared)
 */

import type { AssessmentResultSchema } from '../assessmentResult';

export const PRISM_DIMENSION_KEYS = [
  'brand_clarity',
  'market_legibility',
  'identity_consistency',
  'narrative_power',
  'visibility_level',
] as const;

export type PrismDimensionKey = (typeof PRISM_DIMENSION_KEYS)[number];

/* ── PRISM-specific extension data ──────────────────────────────── */

export interface PrismSpecific {
  brand_consistency_score?: number;
  linkedin_health_score?: number;
  value_propositions: Array<{ headline: string; evidence: string }>;
  positioning_gaps: Array<{ gap: string; fix: string }>;
  career_quadrant?: 'Emerging' | 'Established' | 'Pivoting' | 'C-Suite';
  target_positioning?: {
    target_role: string;
    target_industries: string[];
    gap_map: Array<{ dimension: PrismDimensionKey; delta: number; priority: 'high' | 'medium' | 'low' }>;
  };
}

/* ── Public PRISM Result Contract ───────────────────────────────── */

export type PrismResultSchema = AssessmentResultSchema<PrismSpecific>;

export const PRISM_CONTRACT = {
  diagnostic_slug: 'prism' as const,
  contract_version: 'b2c.v1' as const,
  dimension_keys: PRISM_DIMENSION_KEYS,
  ei_dimension_cap: 5,
  archetype_keys: [
    'the_authority',
    'the_signal',
    'the_monument',
    'the_chameleon',
    'the_amplifier',
    'the_operator',
    'the_ghost',
    'the_mask',
    'the_static',
    'the_blank_page',
  ] as const,
} as const;

export function isPrismSchema(r: AssessmentResultSchema): r is PrismResultSchema {
  return r.assessment.slug === 'prism';
}
