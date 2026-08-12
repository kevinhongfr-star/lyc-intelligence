/**
 * schemas/diagnostics/prism.ts — #97 PRISM diagnostic-specific schema
 * Diagnostic: Career & Professional Branding (6 dimensions)
 * Extends: AssessmentResultSchema (shared)
 */

import type { AssessmentResultSchema } from '../assessmentResult';

export const PRISM_DIMENSION_KEYS = [
  'clarity',          // clarity of professional narrative
  'visibility',       // market visibility (LinkedIn, etc.)
  'differentiation',  // positioning vs. peer set
  'alignment',        // career alignment with personal north star
  'credibility',      // social proof & credentials
  'network_value',    // network quality & leverage
] as const;

export type PrismDimensionKey = (typeof PRISM_DIMENSION_KEYS)[number];

/* ── PRISM-specific extension data ──────────────────────────────── */

export interface PrismSpecific {
  /** 0-100: Personal brand consistency across platforms (snapshot heuristic) */
  brand_consistency_score?: number;
  /** LinkedIn profile health: 0-100 (placeholder — future integration) */
  linkedin_health_score?: number;
  /** Top 3 value propositions surfaced from answers (ordered strongest first) */
  value_propositions: Array<{ headline: string; evidence: string }>;
  /** Top 3 positioning gaps — each with a concrete improvement task */
  positioning_gaps: Array<{ gap: string; fix: string }>;
  /** Career arc alignment quadrant label (for visual badge) */
  career_quadrant?: 'Emerging' | 'Established' | 'Pivoting' | 'C-Suite';
  /** Executive Introduction hides this section (redaction applied in pipeline) */
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
  /** Executive Introduction shows 4 dimensions — capped in pipeline */
  ei_dimension_cap: 4,
  /** Archetype keys for PRISM — matches assessment_archetypes.archetype_key */
  archetype_keys: ['the_architect', 'the_catalyst', 'the_anchor', 'the_orchestrator'] as const,
} as const;

/** Type guard (narrows a generic AssessmentResultSchema to PRISM) */
export function isPrismSchema(r: AssessmentResultSchema): r is PrismResultSchema {
  return r.assessment.slug === 'prism';
}
