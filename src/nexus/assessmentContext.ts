/**
 * assessmentContext.ts — NEXUS ↔ Assessment integration layer (ticket #1324).
 *
 * Bridges the assessment product (Supabase `assessment_results`) into the
 * NEXUS conversation. Provides:
 *   1. getUserAssessmentContext(userId)        — fetches a user's assessment history
 *   2. buildAssessmentContextForNexus(results) — formats results into a NEXUS-readable context string
 *   3. getCrossDiagnosticSynthesis(results)   — synthesizes insights across 2+ assessments
 *   4. getRecommendedNextAssessment(results)   — recommends the next instrument based on gaps
 *
 * Data model note: the `assessment_results` table is written by multiple code
 * paths (reportPipeline.ts, assessmentEngine.ts) which use slightly different
 * column names for the same concept. This service reads `select('*')` and
 * normalizes defensively so it works regardless of which path persisted the row.
 */
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  NEXUS_ASSESSMENT_KB,
  NEXUS_KB_CODES_ORDERED,
  type NexusAssessmentKBEntry,
} from '@/nexus/nexusKnowledge';
import { ASSESSMENT_CATALOG } from '@/assessments/catalog';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

/** A single normalized assessment result row for one user. */
export interface AssessmentResult {
  /** Row id from assessment_results */
  id: string;
  /** Canonical instrument code, e.g. "PRISM" (uppercased) */
  code: string;
  /** Instrument display name, e.g. "PRISM" */
  name: string;
  /** Overall composite score 0-100 (if available) */
  compositeScore: number | null;
  /** Tier label / band, e.g. "Executive" */
  tierLabel: string | null;
  /** Archetype classification, e.g. "Strategic Architect" */
  archetype: string | null;
  /** Dimension scores keyed by dimension id → score 0-100 */
  dimensionScores: Record<string, number>;
  /** Dimension display names keyed by dimension id → name */
  dimensionNames: Record<string, string>;
  /** ISO timestamp of when the result was generated */
  createdAt: string | null;
}

/** The bundled context object handed to NEXUS. */
export interface AssessmentContext {
  /** Number of assessment results available */
  resultCount: number;
  /** Ordered results, most recent first */
  results: AssessmentResult[];
  /** NEXUS-readable context string (empty if no results) */
  contextString: string;
}

/** A single synthesized insight across multiple assessments. */
export interface CrossDiagnosticInsight {
  /** 'strength' = recurring high area, 'gap' = recurring low area, 'focus' = recommended focus */
  type: 'strength' | 'gap' | 'focus';
  /** Short headline */
  title: string;
  /** Detail referencing the contributing assessments */
  detail: string;
  /** Instrument codes that contributed to this insight */
  sources: string[];
}

/** Recommendation for the next assessment. */
export interface NextAssessmentRecommendation {
  code: string;
  name: string;
  /** Why this is the recommended next step, grounded in the user's existing results */
  rationale: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// ROW NORMALIZATION
// ─────────────────────────────────────────────────────────────────────────────

/** Defensively read a string column that may be stored under several names. */
function pickStr(row: Record<string, any>, keys: string[]): string | null {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return null;
}

/** Defensively read a numeric column that may be stored under several names. */
function pickNum(row: Record<string, any>, keys: string[]): number | null {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === 'number' && !Number.isNaN(v)) return v;
  }
  return null;
}

/** Defensively read an object column that may be stored as jsonb under several names. */
function pickObj<T = Record<string, unknown>>(row: Record<string, any>, keys: string[]): T | null {
  for (const k of keys) {
    const v = row[k];
    if (v && typeof v === 'object' && !Array.isArray(v)) return v as T;
  }
  return null;
}

/** Normalize a raw assessment_results row into an AssessmentResult. */
function normalizeResult(row: Record<string, any>): AssessmentResult {
  const rawCode = pickStr(row, ['assessment_code', 'instrument_code', 'instrument_key']) || '';
  const code = rawCode.toUpperCase();

  const dimScores = pickObj<Record<string, number>>(row, [
    'dimension_scores',
    'dimension_scores_json',
  ]);
  const dimNames = pickObj<Record<string, string>>(row, [
    'dimension_names',
    'dimension_names_json',
  ]);
  const scoreSummary = pickObj<Record<string, any>>(row, ['score_summary', 'composite_json']);

  // composite score may live at top level or inside score_summary
  let compositeScore = pickNum(row, ['composite_score']);
  if (compositeScore == null && scoreSummary) {
    compositeScore = pickNum(scoreSummary as Record<string, any>, ['score', 'composite', 'composite_score', 'overall']);
  }

  // archetype may be a string or an object with .name
  let archetype: string | null = pickStr(row, ['archetype']);
  if (!archetype) {
    const archObj = pickObj<{ name?: string; label?: string }>(row, ['archetype_json', 'archetype']);
    if (archObj) archetype = archObj.name || archObj.label || null;
  }

  const tierLabel = pickStr(row, ['tier_label', 'pricing_tier']) || null;
  const createdAt = pickStr(row, ['created_at', 'generated_at', 'updated_at']);

  // Resolve display name from catalog/KB, fall back to the code.
  const kbEntry: NexusAssessmentKBEntry | undefined = NEXUS_ASSESSMENT_KB[code];
  const catalogEntry = ASSESSMENT_CATALOG[code];
  const name = kbEntry?.name || catalogEntry?.name || code || 'Assessment';

  return {
    id: String(row.id ?? ''),
    code,
    name,
    compositeScore,
    tierLabel,
    archetype,
    dimensionScores: dimScores || {},
    dimensionNames: dimNames || {},
    createdAt,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. getUserAssessmentContext
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a user's assessment results from Supabase, ordered most-recent first.
 * Returns an empty list when the user is anonymous or Supabase is unavailable.
 */
export async function getUserAssessmentContext(userId: string | null | undefined): Promise<AssessmentResult[]> {
  if (!userId || !isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('assessment_results')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      console.warn('[assessmentContext] fetch failed:', error.message);
      return [];
    }
    if (!Array.isArray(data) || data.length === 0) return [];
    // De-duplicate by instrument code, keeping the most recent result per code.
    const byCode = new Map<string, AssessmentResult>();
    for (const row of data) {
      const r = normalizeResult(row as Record<string, any>);
      if (!r.code) continue;
      if (!byCode.has(r.code)) byCode.set(r.code, r);
    }
    return Array.from(byCode.values());
  } catch (e) {
    console.warn('[assessmentContext] fetch threw:', e);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. buildAssessmentContextForNexus
// ─────────────────────────────────────────────────────────────────────────────

function formatScoreLabel(score: number | null): string {
  if (score == null) return 'n/a';
  return String(Math.round(score));
}

/**
 * Format a user's assessment results into a NEXUS-readable context string.
 * This is appended to the NEXUS system prompt so NEXUS can reference the
 * user's actual results during the conversation.
 */
export function buildAssessmentContextForNexus(results: AssessmentResult[]): AssessmentContext {
  const resultCount = results.length;
  if (resultCount === 0) {
    return { resultCount: 0, results: [], contextString: '' };
  }

  const lines: string[] = [
    '=== USER ASSESSMENT HISTORY (actual results — reference these when relevant) ===',
    `The user has completed ${resultCount} assessment${resultCount === 1 ? '' : 's'}:`,
    '',
  ];

  results.forEach((r, i) => {
    lines.push(`--- ${i + 1}. ${r.name} (${r.code}) ---`);
    if (r.createdAt) {
      lines.push(`  Completed: ${r.createdAt.split('T')[0]}`);
    }
    lines.push(`  Composite score: ${formatScoreLabel(r.compositeScore)} / 100`);
    if (r.archetype) lines.push(`  Archetype: ${r.archetype}`);
    if (r.tierLabel) lines.push(`  Tier: ${r.tierLabel}`);

    const dimEntries = Object.entries(r.dimensionScores);
    if (dimEntries.length > 0) {
      lines.push('  Dimension scores:');
      for (const [dimId, score] of dimEntries) {
        const dimName = r.dimensionNames[dimId] || dimId;
        lines.push(`    - ${dimName}: ${formatScoreLabel(score)} / 100`);
      }
    }
    lines.push('');
  });

  // When 2+ results, append a synthesized summary so NEXUS can cross-reference.
  if (resultCount >= 2) {
    const synthesis = getCrossDiagnosticSynthesis(results);
    if (synthesis.length > 0) {
      lines.push('--- CROSS-DIAGNOSTIC SYNTHESIS ---');
      for (const s of synthesis) {
        lines.push(`  [${s.type.toUpperCase()}] ${s.title}: ${s.detail} (from ${s.sources.join(', ')})`);
      }
      lines.push('');
    }
  }

  lines.push(
    'When the user asks about their results, ground your answer in the data above. ' +
      'Do not invent scores. If a dimension is not listed, say you do not have that data point.',
  );

  return {
    resultCount,
    results,
    contextString: lines.join('\n'),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. getCrossDiagnosticSynthesis
// ─────────────────────────────────────────────────────────────────────────────

/** A scored dimension contribution used for cross-diagnostic synthesis. */
interface DimensionContribution {
  assessmentCode: string;
  assessmentName: string;
  dimensionName: string;
  score: number;
}

/** Flatten all dimension scores across all results into a single list. */
function flattenDimensions(results: AssessmentResult[]): DimensionContribution[] {
  const out: DimensionContribution[] = [];
  for (const r of results) {
    for (const [dimId, score] of Object.entries(r.dimensionScores)) {
      if (typeof score !== 'number' || Number.isNaN(score)) continue;
      out.push({
        assessmentCode: r.code,
        assessmentName: r.name,
        dimensionName: r.dimensionNames[dimId] || dimId,
        score,
      });
    }
  }
  return out;
}

/**
 * Synthesize insights across multiple assessment results. Only meaningful when
 * the user has 2+ results; returns an empty array otherwise.
 *
 * Surfaces:
 *  - recurring strengths (high scores across assessments)
 *  - recurring gaps (low scores across assessments)
 *  - recommended focus areas (the lowest dimensions, prioritized)
 */
export function getCrossDiagnosticSynthesis(results: AssessmentResult[]): CrossDiagnosticInsight[] {
  if (!results || results.length < 2) return [];

  const insights: CrossDiagnosticInsight[] = [];
  const dims = flattenDimensions(results);

  // Strengths: dimensions scoring >= 75, grouped by name (case-insensitive).
  const strengthGroups = groupDimensions(dims, (d) => d.score >= 75);
  for (const [name, group] of strengthGroups.entries()) {
    if (group.length < 1) continue;
    const codes = uniqueCodes(group);
    const avg = average(group.map((g) => g.score));
    insights.push({
      type: 'strength',
      title: `Recurring strength: ${name}`,
      detail: `Averaging ${avg}/100 across ${group.length} dimension${group.length === 1 ? '' : 's'} — a consistent high point in your diagnostic profile.`,
      sources: codes,
    });
  }

  // Gaps: dimensions scoring <= 49, grouped by name.
  const gapGroups = groupDimensions(dims, (d) => d.score <= 49);
  for (const [name, group] of gapGroups.entries()) {
    if (group.length < 1) continue;
    const codes = uniqueCodes(group);
    const avg = average(group.map((g) => g.score));
    insights.push({
      type: 'gap',
      title: `Recurring gap: ${name}`,
      detail: `Averaging ${avg}/100 across ${group.length} dimension${group.length === 1 ? '' : 's'} — an area that surfaces repeatedly and likely warrants deliberate development.`,
      sources: codes,
    });
  }

  // Focus areas: the 1-3 lowest single dimensions overall.
  const sorted = [...dims].sort((a, b) => a.score - b.score);
  const focus = sorted.slice(0, Math.min(3, sorted.length));
  // Deduplicate focus by dimension name (keep the lowest).
  const seenFocus = new Set<string>();
  for (const f of focus) {
    const key = f.dimensionName.toLowerCase();
    if (seenFocus.has(key)) continue;
    seenFocus.add(key);
    insights.push({
      type: 'focus',
      title: `Priority focus: ${f.dimensionName}`,
      detail: `Lowest at ${f.score}/100 in ${f.assessmentName} — the single most leveraged area to develop next.`,
      sources: [f.assessmentCode],
    });
  }

  return insights;
}

/** Group dimension contributions by normalized dimension name. */
function groupDimensions(
  dims: DimensionContribution[],
  predicate: (d: DimensionContribution) => boolean,
): Map<string, DimensionContribution[]> {
  const out = new Map<string, DimensionContribution[]>();
  for (const d of dims) {
    if (!predicate(d)) continue;
    const key = d.dimensionName.toLowerCase();
    const arr = out.get(key) || [];
    arr.push(d);
    out.set(key, arr);
  }
  return out;
}

function uniqueCodes(group: DimensionContribution[]): string[] {
  return Array.from(new Set(group.map((g) => g.assessmentCode)));
}

function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. getRecommendedNextAssessment
// ─────────────────────────────────────────────────────────────────────────────

/** Set of instrument codes the user has already completed. */
function completedCodes(results: AssessmentResult[]): Set<string> {
  return new Set(results.map((r) => r.code));
}

/**
 * Recommend the next assessment based on gaps and patterns in the user's
 * existing results. Strategy:
 *   - Prefer the flagship CPI if not yet taken and the user shows senior/cross-border signals.
 *   - Otherwise pick the first untaken instrument in catalog order.
 *   - Ground the rationale in the user's lowest dimensions / recurring gaps.
 */
export function getRecommendedNextAssessment(
  results: AssessmentResult[],
): NextAssessmentRecommendation | null {
  const done = completedCodes(results);
  const allCodes = NEXUS_KB_CODES_ORDERED;

  // Identify the user's lowest dimensions for rationale grounding.
  const dims = flattenDimensions(results);
  const lowest = dims.length > 0
    ? [...dims].sort((a, b) => a.score - b.score).slice(0, 2)
    : [];

  // If CPI (flagship) is not yet taken, recommend it first for senior executives.
  if (!done.has('CPI')) {
    const cpiKb = NEXUS_ASSESSMENT_KB['CPI'];
    if (cpiKb) {
      return {
        code: 'CPI',
        name: cpiKb.name,
        rationale: lowest.length
          ? `Your current diagnostics surface lower scores in ${lowest.map((l) => l.dimensionName).join(' and ')}. CPI — the flagship positioning baseline — would pressure-test those dimensions against 20 years of LYC APAC placement data before your next senior move.`
          : `As your most senior diagnostic, CPI calibrates all five positioning dimensions against benchmarked placement data. It is the natural flagship baseline before a cross-border C-suite move.`,
      };
    }
  }

  // Otherwise recommend the first untaken instrument in canonical order.
  for (const code of allCodes) {
    if (done.has(code)) continue;
    const kb = NEXUS_ASSESSMENT_KB[code];
    if (!kb) continue;
    return {
      code,
      name: kb.name,
      rationale: lowest.length
        ? `Based on your existing results, your lower-scoring areas (${lowest.map((l) => l.dimensionName).join(' and ')}) map directly onto ${kb.name}'s dimensions: ${kb.dimensionNames.join(', ')}. ${kb.name} would sharpen this picture.`
        : `${kb.name} covers dimensions you have not yet measured: ${kb.dimensionNames.join(', ')}. It complements your existing diagnostics without overlap.`,
    };
  }

  // Everything taken — recommend revisiting the lowest-scoring one for a re-take.
  if (results.length > 0) {
    const reTake = [...results].sort((a, b) => (a.compositeScore ?? 100) - (b.compositeScore ?? 100))[0];
    return {
      code: reTake.code,
      name: reTake.name,
      rationale: `You have completed every available instrument. Your lowest composite was ${reTake.name} (${formatScoreLabel(reTake.compositeScore)}/100). Consider re-taking it after a development cycle to measure progress.`,
    };
  }

  return null;
}
