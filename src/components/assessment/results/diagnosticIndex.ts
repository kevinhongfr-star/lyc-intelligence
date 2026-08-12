/**
 * diagnosticIndex.ts — Barrel for the DiagnosticResults page component.
 *
 * #1341: Results page for a single diagnostic attempt. Loads result via
 * diagnosticApi.getResult(resultId, slug, userId) and renders the overall
 * score hero, dimension breakdown, archetype card, key insights, NEXUS CTA,
 * share section, and anonymous user banner.
 */
export { DiagnosticResults } from './DiagnosticResults';
export type { DiagnosticResultsProps } from './DiagnosticResults';
