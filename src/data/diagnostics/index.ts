/**
 * Diagnostic loader — loads diagnostic JSON definitions from static files.
 *
 * #1342: JSON files are seed data. Database tables are the runtime source
 * of truth (seeded from these files at deploy time). This loader provides
 * the seed data for the client-side fallback and for the seed script.
 *
 * All 6 diagnostics follow the #1342 placeholder strategy: they are fully
 * functional end-to-end with generic placeholder content. Content team
 * replaces JSON files later — zero code changes needed.
 */

import type { DiagnosticDefinition } from '@/types/assessment';
import type { DiagnosticSlug } from '@/config/tierConfig';

import prism from './prism.json';
import spark from './spark.json';
import forge from './forge.json';
import bridge from './bridge.json';
import mosaic from './mosaic.json';
import drive from './drive.json';

export const DIAGNOSTIC_DEFINITIONS: Record<string, DiagnosticDefinition> = {
  prism: prism as DiagnosticDefinition,
  spark: spark as DiagnosticDefinition,
  forge: forge as DiagnosticDefinition,
  bridge: bridge as DiagnosticDefinition,
  mosaic: mosaic as DiagnosticDefinition,
  drive: drive as DiagnosticDefinition,
};

/**
 * Get a diagnostic definition by slug.
 * Falls back to client-side JSON if the API is unavailable.
 */
export function getDiagnostic(slug: string): DiagnosticDefinition | null {
  return DIAGNOSTIC_DEFINITIONS[slug] ?? null;
}

/**
 * Get all diagnostic slugs.
 */
export function getAllDiagnosticSlugs(): string[] {
  return Object.keys(DIAGNOSTIC_DEFINITIONS);
}

/**
 * Get diagnostic metadata for landing page config generation.
 */
export function getDiagnosticMeta(slug: string): DiagnosticDefinition['meta'] | null {
  return DIAGNOSTIC_DEFINITIONS[slug]?.meta ?? null;
}
