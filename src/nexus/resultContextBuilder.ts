// ═══════════════════════════════════════════════════════════
// Result Context Builder — NEXUS ↔ assessment integration (X2-7, #1279).
//
// Builds framework-aware context strings from a user's assessment
// results so NEXUS can discuss them accurately. Two paths:
//
//  1. SINGLE-RESULT (result page → NEXUS): a rich context for the
//     just-completed assessment, embedded into the NEXUS launch
//     question / system prompt. Framework-aware — NEXUS knows the
//     assessment's dimensions, the user's scores, matched archetype,
//     strengths, growth areas, and development priorities.
//
//  2. CROSS-ASSESSMENT (local history): reads localStorage history
//     (resultHistory.ts) to build a cross-assessment summary + progress
//     tracking. Complements the Supabase-backed assessmentContext.ts
//     (#1324) — works for the B2C single-rater flow where results are
//     device-local, not server-persisted.
//
// Brand rules: no internal framework names (TRIDENT, 3D, etc.) leak.
// "complimentary assessment", "Executive Introduction" — never "free".
// ═══════════════════════════════════════════════════════════
import type { ScoreResult, MatchedArchetype } from '@/lib/akira/engine';
import { ASSESSMENT_CATALOG, LISTED_INSTRUMENT_KEYS } from '@/assessments/catalog';
import { getResultHistory, type ResultHistoryEntry } from '@/services/resultHistory';

// ── 1. Single-result context (result page → NEXUS) ─────────────────

/**
 * Build a rich, framework-aware context string from a single ScoreResult.
 * NEXUS receives the user's exact results so it can discuss them without
 * re-asking, using correct terminology for the assessment's dimensions
 * and archetype.
 */
export function buildResultContextForNexus(
  code: string,
  result: ScoreResult,
  matchedArchetype?: MatchedArchetype,
): string {
  const upper = code.toUpperCase();
  const info = ASSESSMENT_CATALOG[upper];
  const assessmentName = info?.b2cName || info?.name || upper;
  const lines: string[] = [
    `=== USER ASSESSMENT RESULT: ${assessmentName} (${upper}) ===`,
    'The user has just completed this assessment. Reference their actual results below.',
    '',
    `Composite score: ${Math.round(result.composite?.score ?? 0)} / 100`,
  ];

  if (result.composite?.band) {
    lines.push(`Band: ${result.composite.band}`);
  }
  if (result.composite?.interpretation) {
    lines.push(`Interpretation: ${result.composite.interpretation}`);
  }
  lines.push('');

  // Matched archetype — framework-aware.
  const arch = matchedArchetype || result.archetype;
  if (arch) {
    lines.push(`Matched archetype: ${arch.name}`);
    if (arch.description) lines.push(`  Description: ${arch.description}`);
    const tagline = (arch as Record<string, unknown>).tagline as string | undefined;
    if (tagline) lines.push(`  Tagline: ${tagline}`);
    const strengths = (arch as Record<string, unknown>).strengths as string[] | undefined;
    if (Array.isArray(strengths) && strengths.length > 0) {
      lines.push(`  Strengths: ${strengths.join('; ')}`);
    }
    const growthAreas = (arch as Record<string, unknown>).growth_areas as string[] | undefined;
    if (Array.isArray(growthAreas) && growthAreas.length > 0) {
      lines.push(`  Growth areas: ${growthAreas.join('; ')}`);
    }
    const corePattern = (arch as Record<string, unknown>).core_pattern as string | undefined;
    if (corePattern) lines.push(`  Core pattern: ${corePattern}`);
    const primaryRisk = (arch as Record<string, unknown>).primary_governance_risk as string | undefined;
    if (primaryRisk) lines.push(`  Watch-for: ${primaryRisk}`);
    if (typeof arch.match_score === 'number') {
      lines.push(`  Match strength: ${Math.round(arch.match_score)}%`);
    }
    lines.push('');
  }

  // Dimension scores — with names so NEXUS uses correct terminology.
  const order = result.dimensions_ordered?.length
    ? result.dimensions_ordered
    : Object.keys(result.dimension_scores);
  if (order.length > 0) {
    lines.push('Dimension scores:');
    for (const dimId of order) {
      const ds = result.dimension_scores[dimId];
      if (!ds) continue;
      const meta = info?.dimensions.find((d) => d.id === dimId);
      const dimName = ds.name || meta?.name || dimId;
      const verdict = ds.verdict || result.dimension_verdicts?.[dimId]?.verdict;
      lines.push(
        `  - ${dimName} (${dimId}): ${Math.round(ds.percentage)}%${verdict ? ` [${verdict}]` : ''}`,
      );
    }
    lines.push('');
  }

  // Development priorities — actionable focus areas.
  if (result.development_priorities && result.development_priorities.length > 0) {
    lines.push('Development priorities (weakest dimensions first):');
    for (const p of result.development_priorities.slice(0, 3)) {
      lines.push(`  - ${p.dimension_name}: ${p.priority} — ${p.rationale}`);
    }
    lines.push('');
  }

  // Framework knowledge — so NEXUS uses correct terminology.
  if (info) {
    lines.push(`Assessment framework: ${assessmentName}`);
    lines.push(`  ${info.dimensions.length} dimensions, ${info.archetype_count} archetypes, ${info.total_questions} questions.`);
    lines.push(`  Tagline: ${info.tagline}`);
  }

  lines.push('');
  lines.push(
    'Guidance for this conversation: ground every answer in the user\'s actual results above. ' +
      'Use the dimension and archetype names exactly as listed. Do not invent scores. ' +
      'When the user asks "what should I focus on", reference the development priorities. ' +
      'When the user asks about a strength, reference their highest-scoring dimension. ' +
      'Be specific and actionable — not generic coaching.',
  );

  return lines.join('\n');
}

/**
 * Build a contextual opening question that embeds the user's key results,
 * so the NEXUS conversation starts from their data. Used in the `q` param
 * of the NEXUS launch URL (the only params NEXUS actually consumes).
 */
export function buildNexusOpeningQuestion(
  code: string,
  result: ScoreResult,
  matchedArchetype?: MatchedArchetype,
): string {
  const upper = code.toUpperCase();
  const info = ASSESSMENT_CATALOG[upper];
  const name = info?.b2cName || upper;
  const score = Math.round(result.composite?.score ?? 0);
  const arch = matchedArchetype || result.archetype;

  // Weakest dimension for focus.
  const order = result.dimensions_ordered?.length
    ? result.dimensions_ordered
    : Object.keys(result.dimension_scores);
  const weakest = order
    .map((id) => result.dimension_scores[id])
    .filter(Boolean)
    .sort((a, b) => a.percentage - b.percentage)[0];

  const parts = [`I just completed my ${name} assessment.`];
  parts.push(`My overall score is ${score} out of 100.`);
  if (arch) parts.push(`My matched profile is "${arch.name}".`);
  if (weakest) {
    parts.push(`My lowest dimension is "${weakest.name}" at ${Math.round(weakest.percentage)}%.`);
  }
  parts.push('Walk me through my results and help me understand what to prioritise.');
  return parts.join(' ');
}

// ── 2. Cross-assessment context (local history) ────────────────────

/** All result-history entries across all listed instruments (localStorage). */
function getAllLocalHistory(): Array<{ code: string; entries: ResultHistoryEntry[] }> {
  return LISTED_INSTRUMENT_KEYS.map((code) => ({
    code,
    entries: getResultHistory(code),
  })).filter((h) => h.entries.length > 0);
}

export interface AssessmentProgress {
  completed: number;
  total: number;
  completedCodes: string[];
}

/** Assessment progress: "completed N of {total} assessments". */
export function getAssessmentProgress(): AssessmentProgress {
  const all = getAllLocalHistory();
  const completedCodes = all.map((h) => h.code);
  return {
    completed: completedCodes.length,
    total: LISTED_INSTRUMENT_KEYS.length,
    completedCodes,
  };
}

/**
 * Build a cross-assessment context string from localStorage history.
 * Complements the Supabase path in assessmentContext.ts — works for the
 * B2C single-rater flow where results are device-local.
 */
export function buildLocalAssessmentContextForNexus(): {
  contextString: string;
  resultCount: number;
  completedCodes: string[];
} {
  const all = getAllLocalHistory();
  if (all.length === 0) {
    return { contextString: '', resultCount: 0, completedCodes: [] };
  }

  const lines: string[] = [
    '=== USER ASSESSMENT HISTORY (device-local results — reference these when relevant) ===',
    `The user has completed ${all.length} assessment${all.length === 1 ? '' : 's'} on this device:`,
    '',
  ];

  // Track all dimension scores for cross-assessment synthesis.
  const allDimScores: Array<{ assessment: string; dimension: string; pct: number }> = [];

  all.forEach(({ code, entries }, i) => {
    const latest = entries[0]; // newest first
    const info = ASSESSMENT_CATALOG[code];
    const name = info?.b2cName || code;
    lines.push(`--- ${i + 1}. ${name} (${code}) ---`);
    if (latest.completed_at) {
      try {
        lines.push(`  Last taken: ${new Date(latest.completed_at).toLocaleDateString()}`);
      } catch {
        // keep ISO if parsing fails
        lines.push(`  Last taken: ${latest.completed_at}`);
      }
    }
    lines.push(`  Composite score: ${latest.composite_score} / 100`);
    if (latest.composite_band) lines.push(`  Band: ${latest.composite_band}`);
    if (latest.archetype_name) lines.push(`  Archetype: ${latest.archetype_name}`);

    const dimEntries = Object.entries(latest.dimension_percentages);
    if (dimEntries.length > 0) {
      lines.push('  Dimension scores:');
      for (const [dimId, pct] of dimEntries) {
        const dimName = latest.dimension_names[dimId] || dimId;
        lines.push(`    - ${dimName}: ${Math.round(pct)} / 100`);
        allDimScores.push({ assessment: name, dimension: dimName, pct });
      }
    }
    if (entries.length > 1) {
      lines.push(`  (Taken ${entries.length} times total — trend data available.)`);
    }
    lines.push('');
  });

  // Cross-assessment synthesis when 2+ assessments.
  if (all.length >= 2) {
    lines.push('--- CROSS-ASSESSMENT SYNTHESIS ---');
    // Recurring strengths (≥70 across assessments).
    const strengthCounts = new Map<string, { count: number; avg: number; sources: string[] }>();
    const gapCounts = new Map<string, { count: number; avg: number; sources: string[] }>();
    for (const d of allDimScores) {
      if (d.pct >= 70) {
        const ex = strengthCounts.get(d.dimension) || { count: 0, avg: 0, sources: [] };
        ex.count++;
        ex.avg = (ex.avg * (ex.count - 1) + d.pct) / ex.count;
        if (!ex.sources.includes(d.assessment)) ex.sources.push(d.assessment);
        strengthCounts.set(d.dimension, ex);
      } else if (d.pct < 50) {
        const ex = gapCounts.get(d.dimension) || { count: 0, avg: 0, sources: [] };
        ex.count++;
        ex.avg = (ex.avg * (ex.count - 1) + d.pct) / ex.count;
        if (!ex.sources.includes(d.assessment)) ex.sources.push(d.assessment);
        gapCounts.set(d.dimension, ex);
      }
    }
    const recurringStrengths = [...strengthCounts.entries()]
      .filter(([, v]) => v.sources.length >= 2)
      .sort((a, b) => b[1].count - a[1].count);
    const recurringGaps = [...gapCounts.entries()]
      .filter(([, v]) => v.sources.length >= 2)
      .sort((a, b) => a[1].avg - b[1].avg);

    if (recurringStrengths.length > 0) {
      lines.push('  Recurring strengths (≥70 across multiple assessments):');
      for (const [dim, v] of recurringStrengths.slice(0, 3)) {
        lines.push(`    - ${dim}: avg ${Math.round(v.avg)} (from ${v.sources.join(', ')})`);
      }
    }
    if (recurringGaps.length > 0) {
      lines.push('  Recurring gaps (<50 across multiple assessments):');
      for (const [dim, v] of recurringGaps.slice(0, 3)) {
        lines.push(`    - ${dim}: avg ${Math.round(v.avg)} (from ${v.sources.join(', ')})`);
      }
    }
    if (recurringStrengths.length === 0 && recurringGaps.length === 0) {
      lines.push('  No recurring patterns detected across assessments yet.');
    }
    lines.push('');
  }

  lines.push(
    'When the user asks about their results, ground your answer in the data above. ' +
      'Do not invent scores. If a dimension is not listed, say you do not have that data point. ' +
      'For progress questions, reference how many assessments they have completed.',
  );

  return {
    contextString: lines.join('\n'),
    resultCount: all.length,
    completedCodes: all.map((h) => h.code),
  };
}

// ── 3. Assessment recommendation ───────────────────────────────────

export interface NextAssessmentRecommendation {
  code: string;
  name: string;
  reason: string;
}

/**
 * Recommend the next assessment based on local history.
 * CPI (flagship) first if not taken, then first untaken in canonical
 * order. Returns null if all listed assessments are complete.
 */
export function recommendNextAssessment(): NextAssessmentRecommendation | null {
  const { completedCodes } = getAssessmentProgress();
  const completed = new Set(completedCodes);

  // Hero assessments first (CPI is flagship).
  const heroOrder = ['CPI', 'LEAP', 'SPARK', 'IMPACT'];
  for (const code of heroOrder) {
    if (!completed.has(code)) {
      const info = ASSESSMENT_CATALOG[code];
      return {
        code,
        name: info?.b2cName || code,
        reason: info?.tagline || `${info?.b2cName || code} is a core assessment you haven't taken yet.`,
      };
    }
  }
  // Then any remaining listed instrument.
  for (const code of LISTED_INSTRUMENT_KEYS) {
    if (!completed.has(code)) {
      const info = ASSESSMENT_CATALOG[code];
      return {
        code,
        name: info?.b2cName || code,
        reason: info?.tagline || `${info?.b2cName || code} would complement your existing results.`,
      };
    }
  }
  return null;
}
