/**
 * #1324: assessmentResultService.ts
 *
 * NEXUS ↔ Assessments integration — read side.
 *
 * Provides:
 *  1. fetchUserAssessmentSummaries() — get a compact list of completed assessments
 *     for the current user (instrument, score, bracket, date, archetype, dims).
 *  2. fetchAssessmentResultById() — get full raw DB row for a single result.
 *  3. synthesizeExecutiveSummary() — produce a NEXUS-ready ExecutiveSummary
 *     from a raw DB result (for instruments that didn't persist one already).
 *  4. synthesize90DayPlan() — given a result, turn dimensions & scores into
 *     prioritized development actions (NEXUS explains/synthesizes a plan).
 *  5. buildNexusResultContext() — builds the string blob that's injected into
 *     the NEXUS system prompt so the AI coach can reference the user's real
 *     data when explaining / planning.
 *
 * Safe offline/mock fallback: if supabase fails or user is guest, we return
 * empty arrays so the call site (NexusChat) never breaks.
 */
import { getSupabase } from './supabaseApi';
import type {
  ExecutiveSummary,
  DevelopmentAction,
  InsightCard,
} from '@/components/assessment/results/types';

// ── DB Row shape (matches assessment_results table) ────────────────────

export interface AssessmentResultRow {
  id: string;
  instrument_key: string;
  user_id: string | null;
  composite_score: number;       // 0-100 (legacy may be 0-10)
  tier_label: string | null;
  archetype: string | null;
  dimension_scores: Record<string, number> | null;
  dimension_names: Record<string, string> | null;
  cross_border_score: number | null;
  generated_at: string | null;
  /** Extended fields (not all tables will have these) */
  executive_summary?: ExecutiveSummary | null;
  insights?: InsightCard[] | null;
  development_actions?: DevelopmentAction[] | null;
  strengths?: Array<{ title: string; text: string }> | null;
  gaps?: Array<{ title: string; text: string }> | null;
}

// ── Compact summary — what NEXUS shows in chat cards ──────────────────

export interface UserAssessmentSummary {
  id: string;
  instrumentCode: string;
  instrumentName: string;
  accent: string;
  overallScore: number;         // normalized 0-100
  bracket: ExecutiveSummary['bracket'];
  archetype: string | null;
  completedAt: string | null;   // ISO date
  topStrengths: Array<{ name: string; score: number }>;
  topGaps: Array<{ name: string; score: number }>;
  dimensionCount: number;
  crossBorderScore?: number | null;
}

// ── Constants (kept local to avoid circular imports) ──────────────────

const INSTRUMENT_ACCENTS: Record<string, string> = {
  CPI: '#C108AB',
  PRISM: '#0A84FF',
  SPARK: '#FF6A00',
  LEAP: '#2E8B57',
  QUEST: '#5B21B6',
  IMPACT: '#0F766E',
  DRIVE: '#B45309',
  COACH: '#9D174D',
  FORGE: '#475569',
  BRIDGE: '#0369A1',
  MOSAIC: '#7C2D12',
};

const INSTRUMENT_NAMES: Record<string, string> = {
  CPI: 'Chief Potential Index',
  PRISM: 'Executive Brand PRISM',
  SPARK: 'AI Readiness Diagnostic',
  LEAP: 'Career Transition Readiness',
  QUEST: 'Enterprise Leadership Quotient',
  IMPACT: 'Board Effectiveness Diagnostic',
  DRIVE: 'Motivational Orientation Diagnostic',
  COACH: 'Coaching Agility Profile',
  FORGE: 'Bilateral Partnership Readiness',
  BRIDGE: 'Cross-Border Adaptability',
  MOSAIC: 'Partnership Governance Diagnostic',
};

// ── Scoring → placement bracket ───────────────────────────────────────

export function scoreToBracket(rawScore: number): ExecutiveSummary['bracket'] {
  // Normalize to 0-100 (some legacy instruments score 0-10)
  const s = rawScore <= 10 ? rawScore * 10 : rawScore;
  if (s >= 88) return 'Top 10%';
  if (s >= 78) return 'Top Quartile';
  if (s >= 68) return 'Above Average';
  if (s >= 55) return 'Solid Midfield';
  if (s >= 40) return 'Developing';
  return 'Needs Attention';
}

// ── Service helpers ───────────────────────────────────────────────────

function normalizeScore(raw: number): number {
  const n = raw <= 10 ? raw * 10 : raw;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function topDims(
  dimScores: Record<string, number> | null,
  dimNames: Record<string, string> | null,
  direction: 'top' | 'bottom',
  limit = 2,
): Array<{ name: string; score: number }> {
  if (!dimScores) return [];
  const entries = Object.entries(dimScores)
    .map(([id, s]) => ({ name: (dimNames?.[id]) || id, score: normalizeScore(s) }))
    .sort((a, b) => (direction === 'top' ? b.score - a.score : a.score - b.score));
  return entries.slice(0, limit);
}

// ── Public API ────────────────────────────────────────────────────────

/**
 * Fetch all completed assessments for a user.
 * If userId is omitted, uses the currently authenticated user via supabase.
 */
export async function fetchUserAssessmentSummaries(
  userId?: string,
): Promise<UserAssessmentSummary[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return [];

    const query = supabase
      .from('assessment_results')
      .select('*')
      .order('generated_at', { ascending: false });
    if (userId) query.eq('user_id', userId);

    const { data, error } = await query;
    if (error) {
      console.warn('[assessmentResultService] fetchUserAssessmentSummaries failed:', error.message);
      return [];
    }
    if (!data) return [];

    return (data as AssessmentResultRow[]).map(rowToSummary);
  } catch (e: any) {
    console.warn('[assessmentResultService] fetchUserAssessmentSummaries error:', e?.message);
    return [];
  }
}

function rowToSummary(row: AssessmentResultRow): UserAssessmentSummary {
  const code = row.instrument_key?.toUpperCase() || 'UNKNOWN';
  const overall = normalizeScore(row.composite_score || 0);
  return {
    id: row.id,
    instrumentCode: code,
    instrumentName: INSTRUMENT_NAMES[code] || `${code} Assessment`,
    accent: INSTRUMENT_ACCENTS[code] || '#C108AB',
    overallScore: overall,
    bracket: scoreToBracket(overall),
    archetype: row.archetype,
    completedAt: row.generated_at,
    topStrengths: topDims(row.dimension_scores, row.dimension_names, 'top', 2),
    topGaps: topDims(row.dimension_scores, row.dimension_names, 'bottom', 2),
    dimensionCount: row.dimension_scores ? Object.keys(row.dimension_scores).length : 0,
    crossBorderScore: typeof row.cross_border_score === 'number'
      ? normalizeScore(row.cross_border_score)
      : null,
  };
}

/** Fetch a single result by ID (e.g. when user clicks "explain this result") */
export async function fetchAssessmentResultById(
  resultId: string,
): Promise<AssessmentResultRow | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('assessment_results')
      .select('*')
      .eq('id', resultId)
      .single();
    if (error || !data) return null;
    return data as AssessmentResultRow;
  } catch {
    return null;
  }
}

// ── Synthesis: Executive Summary derivation ───────────────────────────

/**
 * If a result doesn't have a persisted executive_summary (e.g. legacy CPI runs),
 * derive one from score + dimensions. NEXUS uses this when it "explains" a result.
 */
export function synthesizeExecutiveSummary(
  summary: UserAssessmentSummary,
): ExecutiveSummary {
  const { overallScore, bracket, instrumentName, topStrengths, topGaps, archetype } = summary;

  // Headline — bracket + instrument-aware
  const headline = buildHeadline(instrumentName, bracket, archetype);
  const synopsis = buildSynopsis(summary);

  // Key takeaways: always 3 (strength + gap + meta)
  const keyTakeaways: ExecutiveSummary['keyTakeaways'] = [];
  if (topStrengths[0]) {
    keyTakeaways.push({
      tone: 'strength',
      label: `${topStrengths[0].name} — ${topStrengths[0].score}/100`,
      detail: `A stand-out dimension. You consistently bring a calibrated, differentiated approach to ${topStrengths[0].name.toLowerCase()} — this is how stakeholders will remember your contribution during the first 90 days.`,
    });
  } else {
    keyTakeaways.push({
      tone: 'neutral',
      label: 'Profile structure',
      detail: 'A balanced result without extreme skew — this signals operating breadth across multiple dimensions, valuable in matrixed and P&L contexts.',
    });
  }

  if (topGaps[0]) {
    keyTakeaways.push({
      tone: 'gap',
      label: `${topGaps[0].name} — ${topGaps[0].score}/100`,
      detail: `The highest-leverage focus area for the next 90 days. Disproportionate return on investment from small, deliberate practice shifts in ${topGaps[0].name.toLowerCase()}.`,
    });
  } else {
    keyTakeaways.push({
      tone: 'neutral',
      label: 'No single gap dominates',
      detail: 'Development focus should be sequenced, not parallelized — pick one dimension per 30-day sprint rather than spreading effort thinly across many.',
    });
  }

  // Meta takeaway — placement narrative
  keyTakeaways.push({
    tone: 'neutral',
    label: `Placement: ${bracket}`,
    detail: overallScore >= 78
      ? 'Benchmark signals you are ready for a more complex mandate. The question is sequencing — whether to expand internally or test the external market first.'
      : overallScore >= 55
        ? 'A solid foundation. The next 12 months are about turning breadth into depth — converting a "Solid Midfield" result into a differentiated Top Quartile profile.'
        : 'The early wins are structural: make the first 30 days about process and narrative, so your raw material is visible before others form opinions.',
  });

  return { headline, synopsis, keyTakeaways, bracket };
}

function buildHeadline(name: string, bracket: string, archetype: string | null): string {
  const codeName = name || 'Assessment';
  const archetypeClause = archetype ? ` — you profile as a ${archetype}` : '';
  if (bracket === 'Top 10%') return `${codeName}: Elite profile${archetypeClause}. The question is where to play next.`;
  if (bracket === 'Top Quartile') return `${codeName}: Strong, differentiated profile${archetypeClause}. Ready for scope expansion.`;
  if (bracket === 'Above Average') return `${codeName}: Above-average readiness${archetypeClause}. One concerted 90-day push moves you into Top Quartile.`;
  if (bracket === 'Solid Midfield') return `${codeName}: Solid operating breadth${archetypeClause}. Pick 1–2 dimensions and turn them into signature strengths.`;
  if (bracket === 'Developing') return `${codeName}: Structured foundation building${archetypeClause}. The next 90 days are about turning intention into visible habit.`;
  return `${codeName}: Focused intervention needed${archetypeClause}. Narrow scope to 30-day structural wins.`;
}

function buildSynopsis(s: UserAssessmentSummary): string {
  const strength = s.topStrengths[0]?.name;
  const gap = s.topGaps[0]?.name;
  const dimCount = s.dimensionCount;
  const cross = s.crossBorderScore;

  const parts: string[] = [];
  parts.push(`Across ${dimCount} dimensions, your overall score sits at ${s.overallScore}/100 — a ${s.bracket.toLowerCase()} placement.`);
  if (strength && gap) {
    parts.push(`${strength} stands out as a signature strength you can lean into to create differentiation, while ${gap} is the highest-leverage focus area to close the gap between intent and impact.`);
  }
  if (typeof cross === 'number') {
    parts.push(`Cross-border adaptability registers at ${cross}/100 — ${cross >= 70 ? 'an asset to lean into when evaluating regional or global mandates' : 'a dimension to actively practice before accepting an inbound APAC or cross-border assignment'}.`);
  }
  if (s.archetype) {
    parts.push(`Your ${s.archetype} profile is the narrative filter stakeholders will use — so your development investments should reinforce that story, not fight it.`);
  }
  return parts.join(' ');
}

// ── Synthesis: 90-day development plan ────────────────────────────────

export interface Nexus90DayPlan {
  instrumentCode: string;
  instrumentName: string;
  overallScore: number;
  bracket: ExecutiveSummary['bracket'];
  /** Grouped by 30/60/90 day windows */
  windows: {
    day30: DevelopmentAction[];
    day60: DevelopmentAction[];
    day90: DevelopmentAction[];
  };
  /** Top 3 overall actions, sorted by leverage */
  priorityActions: DevelopmentAction[];
}

/**
 * Turn a result + summary into a prioritized, sequenced 90-day development plan.
 * Uses persisted development_actions if available; otherwise derives from
 * dimension scores (lowest-scoring dims = highest leverage for early windows).
 */
export function synthesize90DayPlan(
  summary: UserAssessmentSummary,
  row?: AssessmentResultRow | null,
): Nexus90DayPlan {
  const code = summary.instrumentCode;
  const name = summary.instrumentName;

  // Prefer persisted actions when available
  if (row?.development_actions && Array.isArray(row.development_actions) && row.development_actions.length > 0) {
    const sorted = [...row.development_actions].sort((a, b) => a.priority - b.priority);
    const day30 = sorted.filter((a) => a.timeline?.includes('30')).slice(0, 3);
    const day60 = sorted.filter((a) => a.timeline?.includes('60')).slice(0, 3);
    const day90 = sorted.filter((a) => a.timeline?.includes('90')).slice(0, 3);
    const windows = {
      day30: day30.length ? day30 : sorted.slice(0, 3),
      day60: day60.length ? day60 : sorted.slice(3, 6),
      day90: day90.length ? day90 : sorted.slice(6, 9),
    };
    return {
      instrumentCode: code,
      instrumentName: name,
      overallScore: summary.overallScore,
      bracket: summary.bracket,
      windows,
      priorityActions: sorted.slice(0, 5),
    };
  }

  // Derive from dimension gaps + strengths
  const gapDims = topDims(
    // Fake a dimScores object back out of topGaps/topStrengths to reuse helper
    Object.fromEntries([
      ...summary.topGaps.map((g) => [g.name, g.score]),
      ...summary.topStrengths.map((g) => [g.name, g.score]),
    ]),
    null,
    'bottom',
    6,
  );

  const strengthDims = topDims(
    Object.fromEntries([
      ...summary.topStrengths.map((g) => [g.name, g.score]),
      ...summary.topGaps.map((g) => [g.name, g.score]),
    ]),
    null,
    'top',
    3,
  );

  const derived: DevelopmentAction[] = [];
  let priority = 1;

  // 30 days: structural, fast wins — 2 gap dimensions
  for (let i = 0; i < Math.min(2, gapDims.length); i++) {
    derived.push({
      priority: priority++,
      dimension: gapDims[i].name,
      action: `30-day structural sprint on ${gapDims[i].name.toLowerCase()}: commit to one deliberate practice per week, journal the outcome every Friday, and book a 20-min review with a peer or stakeholder who scores you in this dimension.`,
      timeline: '30 days',
      impactLabel: 'High',
    });
  }

  // 60 days: double-down on strengths for differentiation
  for (let i = 0; i < Math.min(2, strengthDims.length); i++) {
    derived.push({
      priority: priority++,
      dimension: strengthDims[i].name,
      action: `Turn ${strengthDims[i].name.toLowerCase()} into a visible signature strength: own one initiative or forum where this dimension is the bottleneck, and use it to demonstrate disproportionate impact on a board-level or P&L metric.`,
      timeline: '60 days',
      impactLabel: 'Medium',
    });
  }

  // 90 days: narrative + structural proof of shift
  const narrativeDim = gapDims[1] || gapDims[0];
  if (narrativeDim) {
    derived.push({
      priority: priority++,
      dimension: narrativeDim.name,
      action: `Embed the ${narrativeDim.name.toLowerCase()} shift into stakeholder narrative: capture 2-3 concrete anecdotes of changed behaviour, shape them into a before/after story, and surface them in 3:1 conversations so your sponsor can promote them in rooms you're not in.`,
      timeline: '90 days',
      impactLabel: 'Long-term',
    });
  }

  return {
    instrumentCode: code,
    instrumentName: name,
    overallScore: summary.overallScore,
    bracket: summary.bracket,
    windows: {
      day30: derived.filter((d) => d.timeline === '30 days'),
      day60: derived.filter((d) => d.timeline === '60 days'),
      day90: derived.filter((d) => d.timeline === '90 days'),
    },
    priorityActions: derived.slice(0, 5),
  };
}

// ── System-prompt injection: give NEXUS context to explain/synthesize ─

/**
 * Build a concise, structured context blob for the NEXUS system prompt.
 * ~500 tokens max, so it fits in the context budget without crowding out
 * the rest of the product brain.
 */
export function buildNexusResultContext(
  summaries: UserAssessmentSummary[],
): string {
  if (!summaries.length) {
    return `[Assessment history] None on file. If the user asks about past results, invite them to take their first instrument — CPI is the standard entry point; Executive Introduction covers framework samples.`;
  }
  const lines: string[] = [];
  lines.push(`[Assessment history — ${summaries.length} completed instrument${summaries.length > 1 ? 's' : ''}]`);
  for (const s of summaries.slice(0, 5)) {  // cap at 5 most recent for token budget
    lines.push(`- ${s.instrumentCode} (${s.instrumentName})`);
    lines.push(`  Score: ${s.overallScore}/100 → ${s.bracket}`);
    if (s.archetype) lines.push(`  Archetype: ${s.archetype}`);
    if (s.topStrengths.length) {
      lines.push(`  Strengths: ${s.topStrengths.map((x) => `${x.name} (${x.score})`).join(', ')}`);
    }
    if (s.topGaps.length) {
      lines.push(`  Gaps: ${s.topGaps.map((x) => `${x.name} (${x.score})`).join(', ')}`);
    }
    if (typeof s.crossBorderScore === 'number') {
      lines.push(`  Cross-border: ${s.crossBorderScore}/100`);
    }
    if (s.completedAt) {
      lines.push(`  Completed: ${new Date(s.completedAt).toISOString().split('T')[0]}`);
    }
  }
  lines.push('');
  lines.push('[How to use this] When the user asks "explain my results", "what does this mean", "my plan", etc.:');
  lines.push('  1. Lead with the bracket + the headline narrative — never lead with a raw number.');
  lines.push('  2. Use 2 strengths + 1 gap as the structure. Frame gaps as "focus areas", not weaknesses.');
  lines.push('  3. Always end with a concrete 30-day next step. Never dump all actions at once.');
  lines.push('  4. Reference the archetype as the narrative filter — investments should reinforce that story, not fight it.');
  lines.push('  5. If the user completed multiple instruments, compare them: note which dimensions are consistent strengths and which are inconsistent across contexts.');
  return lines.join('\n');
}

// ── Intent detection: user is asking about their results ──────────────

const RESULT_INTENT_MARKERS = [
  'my result', 'my score', 'my assessment', 'explain my', 'my plan',
  '90 day', '90-day', 'what does this mean', 'stand for', 'bracket',
  'my dimension', 'my archetype', 'development', 'where to focus',
  'my strengths', 'my gaps', 'my weaknesses', 'top quartile', 'top 10%',
  'improve at', 'get better at', 'how to develop', 'develop me',
];

/**
 * Heuristic intent detector — runs BEFORE the AI call. If it returns true,
 * NexusChat appends a "my results" assistant card with the actual data
 * (so the user sees their real numbers even if the API call fails).
 */
export function isResultQuery(userMsg: string): boolean {
  const lc = userMsg.toLowerCase().trim();
  if (lc.length < 6) return false;
  return RESULT_INTENT_MARKERS.some((m) => lc.includes(m));
}

// ── Best-instrument selector ──────────────────────────────────────────

/** Which assessment should NEXUS "explain" first when user has many? */
export function pickPrimaryResult(
  summaries: UserAssessmentSummary[],
): UserAssessmentSummary | null {
  if (!summaries.length) return null;
  // Prefer Flagship tier → most recent
  const flagship = summaries.find((s) => s.instrumentCode === 'CPI');
  if (flagship) return flagship;
  return summaries[0];
}
