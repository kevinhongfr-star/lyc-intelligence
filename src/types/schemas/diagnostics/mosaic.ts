/**
 * schemas/diagnostics/mosaic.ts — #97 MOSAIC: Cultural Intelligence
 */
import type { AssessmentResultSchema } from '../assessmentResult';

export const MOSAIC_DIMENSION_KEYS = [
  'cultural_humility',  // self-awareness of own cultural biases
  'perspective_taking', // ability to take alternative cultural frame
  'adaptability',       // behavioral adaptability across contexts
  'code_switching',     // language + register switching
  'inclusion_practice', // inclusive team / meeting practices
  'intercultural_trust',// trust building across cultural lines
] as const;
export type MosaicDimensionKey = (typeof MOSAIC_DIMENSION_KEYS)[number];

export interface MosaicSpecific {
  cq_score_proxy?: number;   // aggregated Cultural Quotient
  strongest_cultures?: string[];  // contexts user is most fluent in
  growth_cultures?: string[];     // contexts user should stretch into
  bias_patterns?: Array<{ pattern: string; mitigation: string }>;
  team_inclusion_playbook: Array<{ practice: string; frequency: 'daily' | 'weekly' | 'per-meeting' }>;
}

export type MosaicResultSchema = AssessmentResultSchema<MosaicSpecific>;

export const MOSAIC_CONTRACT = {
  diagnostic_slug: 'mosaic' as const,
  contract_version: 'b2c.v1' as const,
  dimension_keys: MOSAIC_DIMENSION_KEYS,
  ei_dimension_cap: 4,
  archetype_keys: ['the_chameleon', 'the_bridge_builder', 'the_anthropologist', 'the_anchor'] as const,
} as const;

export function isMosaicSchema(r: AssessmentResultSchema): r is MosaicResultSchema {
  return r.assessment.slug === 'mosaic';
}
