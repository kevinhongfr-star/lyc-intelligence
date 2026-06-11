/**
 * scoringClient.ts
 *
 * Client-side service for the candidate-matching flow (legacy MatchPage,
 * BatchScoringPage, Shortlist1Pager, CandidateList, ResultsTable).
 *
 * Calls /api/admin/org-intelligence/scoring/compute with `public: true`,
 * which runs a 5-criteria LLM evaluation and projects back to the legacy
 * 3-dim shape (experience / skills / fit) for backward compat.
 *
 * File history: succeeded tridentScoring.ts (pre-org-intel service file) to
 * remove internal framework name from the client codebase (LYC brand rule).
 *
 * Server endpoint: api/admin/org-intelligence/scoring/compute.ts
 * Public mode spec: docs/org_intelligence_scoring_spec_v1.2.md
 */

export interface CandidateInput {
  name: string;
  cv: string;
}

export interface MatchResult {
  candidate_name: string;
  composite_score: number;
  dimension_scores: {
    experience: number;
    skills: number;
    fit: number;
  };
  match_reasons: string[];
  risk_factors: string[];
  approach_strategy: string;
  /** v1.2 5-criteria sub-scores (each 0-20), also returned by the server. */
  sub_scores?: {
    C1: number;
    C2: number;
    C3: number;
    C4: number;
    C5: number;
  };
}

export interface ScoringResponse {
  results: MatchResult[];
  total_tokens?: number;
  duration_ms?: number;
  model?: string;
}

const SCORE_ENDPOINT = '/api/admin/org-intelligence/scoring/compute';

export async function runMatchScoring(
  jd: string,
  candidates: CandidateInput[],
  userId?: string
): Promise<ScoringResponse> {
  try {
    const response = await fetch(SCORE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        public: true,
        jd,
        candidates,
        userId,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Scoring failed (${response.status}): ${errText.slice(0, 200)}`);
    }

    return await response.json();
  } catch (e) {
    console.error('[scoringClient] runMatchScoring error:', e);
    throw e;
  }
}

/**
 * Score a single candidate (used by BatchScoringPage single-shot UI).
 * Wraps the single candidate in the candidates[] array.
 */
export async function scoreSingleCandidate(
  jd: string,
  cv: string,
  candidateName: string
): Promise<{ d1: number; d2: number; d3: number; composite: number; reasoning: string } | null> {
  try {
    const response = await runMatchScoring(jd, [{ name: candidateName, cv }]);
    const r = response.results?.[0];
    if (!r) return null;
    return {
      d1: r.dimension_scores.experience,
      d2: r.dimension_scores.skills,
      d3: r.dimension_scores.fit,
      composite: r.composite_score,
      reasoning: [
        ...(r.match_reasons || []),
        ...(r.approach_strategy ? [`Approach: ${r.approach_strategy}`] : []),
      ].join(' '),
    };
  } catch (e) {
    console.error('[scoringClient] scoreSingleCandidate error:', e);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────
// Display helpers (unchanged from legacy — used by MatchPage, BatchPage UI)
// ─────────────────────────────────────────────────────────────────

export function getTierFromScore(score: number): {
  tier: 'T1' | 'T2' | 'T3';
  label: string;
  color: string;
} {
  if (score >= 75) {
    return { tier: 'T1', label: 'Strong Primary', color: '#22C55E' };
  } else if (score >= 50) {
    return { tier: 'T2', label: 'Strong Secondary', color: '#EAB308' };
  } else {
    return { tier: 'T3', label: 'Reserve', color: '#EF4444' };
  }
}

export function formatScore(score: number): string {
  return score.toString().padStart(2, '0');
}

export function getScoreBarColor(score: number): string {
  if (score >= 75) return '#22C55E';
  if (score >= 50) return '#EAB308';
  return '#EF4444';
}

export function getCreditCost(candidateCount: number, isFirstBatch: boolean): {
  credits: number;
  description: string;
} {
  if (isFirstBatch) {
    return { credits: 0, description: 'First 3 matches free' };
  }
  if (candidateCount >= 5) {
    return { credits: 8, description: 'Batch of 5' };
  }
  return { credits: candidateCount * 2, description: `${candidateCount} matches` };
}

/**
 * Local composite computation — used as a fallback if the server
 * response is malformed (shouldn't happen, but defensive). Weights
 * mirror the legacy client-side formula for display consistency.
 */
export function computeMatchScore(input: { d1: number; d2: number; d3: number }) {
  const { d1, d2, d3 } = input;
  const composite = Math.round(d1 * 0.35 + d2 * 0.4 + d3 * 0.25);
  let tier: string;
  let verdict: string;
  if (composite >= 75) {
    tier = 'T1';
    verdict = 'Strong Primary';
  } else if (composite >= 50) {
    tier = 'T2';
    verdict = 'Strong Secondary';
  } else {
    tier = 'T3';
    verdict = 'Reserve';
  }
  return { composite, verdict, tier };
}
