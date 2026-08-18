/**
 * schemas/diagnostics/mosaic.ts — MOSAIC: Cross-Border Partnership Agility (canonical)
 * Canonical: 4 dimensions, 6 archetypes (per canon/instruments/mosaic.json)
 */
import type { AssessmentResultSchema } from '../assessmentResult';

export const MOSAIC_DIMENSION_KEYS = [
  'contextual_humility',
  'perspective_fluency',
  'trust_formation_speed',
  'inclusion_action',
] as const;
export type MosaicDimensionKey = (typeof MOSAIC_DIMENSION_KEYS)[number];

export interface MosaicSpecific {
  cq_score_proxy?: number;
  strongest_cultures?: string[];
  growth_cultures?: string[];
  bias_patterns?: Array<{ pattern: string; mitigation: string }>;
  team_inclusion_playbook: Array<{ practice: string; frequency: 'daily' | 'weekly' | 'per-meeting' }>;
}

export type MosaicResultSchema = AssessmentResultSchema<MosaicSpecific>;

export const MOSAIC_CONTRACT = {
  diagnostic_slug: 'mosaic' as const,
  contract_version: 'b2c.v1' as const,
  dimension_keys: MOSAIC_DIMENSION_KEYS,
  ei_dimension_cap: 4,
  archetype_keys: [
    'the_local',
    'the_translator',
    'the_convenor',
    'the_wallflower',
    'the_evangelist',
    'the_protector',
  ] as const,
} as const;

export function isMosaicSchema(r: AssessmentResultSchema): r is MosaicResultSchema {
  return r.assessment.slug === 'mosaic';
}
