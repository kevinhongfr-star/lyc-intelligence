// ═══════════════════════════════════════════════════════════
// Result History — local persistence for assessment results.
// X2-9 (#1322): enables progress tracking + trend visualization.
//
// Results are stored per-assessment in localStorage as a small
// history array (newest first). Each entry captures the composite
// score, archetype, dimension percentages, and timestamp — enough
// to render a trend without re-scoring.
//
// Scope: device-local only. Backend persistence / cross-device
// sync is a separate (auth-gated) concern. RLS still applies to
// any server-side results; this is the complimentary local view.
// ═══════════════════════════════════════════════════════════

const STORAGE_PREFIX = 'akira_result_history_';
const MAX_ENTRIES = 10;

export interface ResultHistoryEntry {
  /** ISO timestamp of when the assessment was completed. */
  completed_at: string;
  composite_score: number;
  composite_band?: string;
  archetype_name?: string;
  /** Dimension id → percentage (0–100). */
  dimension_percentages: Record<string, number>;
  /** Dimension id → display name (snapshot at time of completion). */
  dimension_names: Record<string, string>;
}

function storageKey(code: string): string {
  return `${STORAGE_PREFIX}${code.toUpperCase()}`;
}

function safeRead(code: string): ResultHistoryEntry[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(storageKey(code));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ResultHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function safeWrite(code: string, entries: ResultHistoryEntry[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(storageKey(code), JSON.stringify(entries));
  } catch {
    // Quota exceeded or storage disabled — history is best-effort.
  }
}

/** Read the stored history for an assessment (newest first). */
export function getResultHistory(code: string): ResultHistoryEntry[] {
  return safeRead(code);
}

/** Persist a new result entry. Newest-first, capped at MAX_ENTRIES. */
export function saveResultToHistory(
  code: string,
  compositeScore: number,
  compositeBand: string | undefined,
  archetypeName: string | undefined,
  dimensionPercentages: Record<string, number>,
  dimensionNames: Record<string, string>,
): ResultHistoryEntry[] {
  const entry: ResultHistoryEntry = {
    completed_at: new Date().toISOString(),
    composite_score: Math.round(compositeScore),
    composite_band: compositeBand,
    archetype_name: archetypeName,
    dimension_percentages: { ...dimensionPercentages },
    dimension_names: { ...dimensionNames },
  };
  const existing = safeRead(code);
  // Newest first.
  const next = [entry, ...existing].slice(0, MAX_ENTRIES);
  safeWrite(code, next);
  return next;
}

/** Clear history for an assessment (used by "retake" flows if desired). */
export function clearResultHistory(code: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(storageKey(code));
  } catch {
    // No-op.
  }
}

/**
 * Compare the latest entry against the previous one.
 * Returns the delta (latest − previous) and the prior timestamp,
 * or null if there are fewer than 2 entries.
 */
export function getScoreTrend(code: string): {
  delta: number;
  previousAt: string;
  latestScore: number;
  previousScore: number;
} | null {
  const history = safeRead(code);
  if (history.length < 2) return null;
  const latest = history[0];
  const previous = history[1];
  return {
    delta: Math.round((latest.composite_score - previous.composite_score) * 10) / 10,
    previousAt: previous.completed_at,
    latestScore: latest.composite_score,
    previousScore: previous.composite_score,
  };
}
