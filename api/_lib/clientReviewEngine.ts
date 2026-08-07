/**
 * clientReviewEngine — Candidate review, scoring, and comparison (Phase 8)
 *
 * Pure-logic module (no Supabase calls) that powers:
 *   - Candidate scoring tier assignment (Gold / Silver / Bronze)
 *   - Side-by-side candidate comparison across key dimensions
 *   - Shortlist ranking and sorting
 *   - Review aggregation from multiple client reviewers
 *   - Score normalization and weighting
 *
 * Used by clientPortalHandler.ts and the CandidateReviewForm /
 * ComparisonView frontend components.
 */

export type Tier = 'Gold' | 'Silver' | 'Bronze' | 'Unranked';

export interface CandidateScore {
  id: string;
  name: string;
  score: number;
  tier: Tier;
  dimensions: Record<string, number>;
}

export interface ComparisonDimension {
  key: string;
  label: string;
  weight: number;
  higherIsBetter: boolean;
}

export interface ComparisonResult {
  dimension: string;
  candidates: Array<{ id: string; value: number; normalized: number; rank: number }>;
  winner: string | null;
}

export interface ReviewSummary {
  candidate_id: string;
  total_reviews: number;
  average_rating: number;
  decision_counts: Record<string, number>;
  strengths_frequency: Record<string, number>;
  concerns_frequency: Record<string, number>;
  consensus_score: number;
}

// ── Dimension definitions ───────────────────────────────────────────────

export const DEFAULT_DIMENSIONS: ComparisonDimension[] = [
  { key: 'experience', label: 'Experience', weight: 0.25, higherIsBetter: true },
  { key: 'skills_match', label: 'Skills Match', weight: 0.30, higherIsBetter: true },
  { key: 'culture_fit', label: 'Culture Fit', weight: 0.20, higherIsBetter: true },
  { key: 'leadership', label: 'Leadership', weight: 0.15, higherIsBetter: true },
  { key: 'compensation', label: 'Compensation', weight: 0.10, higherIsBetter: false },
];

// ── Tier assignment ─────────────────────────────────────────────────────

export function assignTier(
  score: number,
  explicitTier?: string | null,
  grade?: string | null,
): Tier {
  if (explicitTier === 'Gold' || explicitTier === 'Silver' || explicitTier === 'Bronze') {
    return explicitTier;
  }
  if (grade === 'S' || score >= 85) return 'Gold';
  if (grade === 'A' || score >= 65) return 'Silver';
  if (grade === 'B' || score >= 45) return 'Bronze';
  return 'Unranked';
}

// ── Score computation ───────────────────────────────────────────────────

export function computeWeightedScore(
  dimensions: Record<string, number>,
  dims: ComparisonDimension[] = DEFAULT_DIMENSIONS,
): number {
  let totalWeight = 0;
  let weightedSum = 0;

  for (const dim of dims) {
    const raw = dimensions[dim.key] ?? 50;
    const normalized = dim.higherIsBetter ? raw : 100 - raw;
    weightedSum += normalized * dim.weight;
    totalWeight += dim.weight;
  }

  return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : 0;
}

// ── Comparison ──────────────────────────────────────────────────────────

export function compareCandidates(
  candidates: CandidateScore[],
  dims: ComparisonDimension[] = DEFAULT_DIMENSIONS,
): ComparisonResult[] {
  const results: ComparisonResult[] = [];

  for (const dim of dims) {
    const values = candidates.map(c => ({
      id: c.id,
      value: c.dimensions[dim.key] ?? 50,
    }));

    const sorted = [...values].sort((a, b) =>
      dim.higherIsBetter ? b.value - a.value : a.value - b.value,
    );

    const max = sorted[0]?.value ?? 1;
    const min = sorted[sorted.length - 1]?.value ?? 0;
    const range = max - min || 1;

    const enriched = values.map(v => ({
      id: v.id,
      value: v.value,
      normalized: Math.round(((v.value - min) / range) * 100),
      rank: sorted.findIndex(s => s.id === v.id) + 1,
    }));

    const winner = sorted.length > 0 && sorted[0].value !== sorted[sorted.length - 1].value
      ? sorted[0].id
      : null;

    results.push({
      dimension: dim.label,
      candidates: enriched,
      winner,
    });
  }

  return results;
}

// ── Ranking ─────────────────────────────────────────────────────────────

export function rankCandidates(candidates: CandidateScore[]): CandidateScore[] {
  const tierOrder: Record<Tier, number> = { Gold: 0, Silver: 1, Bronze: 2, Unranked: 3 };
  return [...candidates].sort((a, b) => {
    const tierDiff = tierOrder[a.tier] - tierOrder[b.tier];
    if (tierDiff !== 0) return tierDiff;
    return b.score - a.score;
  }).map((c, i) => ({ ...c, rank: i + 1 })) as CandidateScore[];
}

// ── Review aggregation ─────────────────────────────────────────────────

export function aggregateReviews(
  reviews: Array<{
    candidate_id: string;
    rating: number;
    decision: string;
    strengths?: string[] | null;
    concerns?: string[] | null;
  }>,
): ReviewSummary {
  if (reviews.length === 0) {
    return {
      candidate_id: '',
      total_reviews: 0,
      average_rating: 0,
      decision_counts: {},
      strengths_frequency: {},
      concerns_frequency: {},
      consensus_score: 0,
    };
  }

  const candidateId = reviews[0].candidate_id;
  const totalReviews = reviews.length;
  const sumRating = reviews.reduce((s, r) => s + r.rating, 0);
  const avgRating = Math.round((sumRating / totalReviews) * 10) / 10;

  const decisionCounts: Record<string, number> = {};
  const strengthsFreq: Record<string, number> = {};
  const concernsFreq: Record<string, number> = {};

  for (const r of reviews) {
    decisionCounts[r.decision] = (decisionCounts[r.decision] || 0) + 1;
    for (const s of (r.strengths || [])) {
      strengthsFreq[s] = (strengthsFreq[s] || 0) + 1;
    }
    for (const c of (r.concerns || [])) {
      concernsFreq[c] = (concernsFreq[c] || 0) + 1;
    }
  }

  const hireVotes = decisionCounts['interested'] || 0;
  const consensusScore = totalReviews > 0
    ? Math.round((hireVotes / totalReviews) * 100)
    : 0;

  return {
    candidate_id: candidateId,
    total_reviews: totalReviews,
    average_rating: avgRating,
    decision_counts: decisionCounts,
    strengths_frequency: strengthsFreq,
    concerns_frequency: concernsFreq,
    consensus_score: consensusScore,
  };
}

// ── Shortlist health check ─────────────────────────────────────────────

export function computeShortlistHealth(
  candidates: Array<{ id: string; tier: Tier }>,
): { healthy: boolean; distribution: Record<Tier, number>; warnings: string[] } {
  const distribution: Record<Tier, number> = { Gold: 0, Silver: 0, Bronze: 0, Unranked: 0 };
  for (const c of candidates) {
    distribution[c.tier] = (distribution[c.tier] || 0) + 1;
  }

  const warnings: string[] = [];
  const total = candidates.length;

  if (total === 0) warnings.push('No candidates in shortlist');
  if (distribution.Gold === 0 && total > 0) warnings.push('No Gold-tier candidates');
  if (distribution.Unranked > total * 0.5 && total > 0) warnings.push('More than 50% unranked candidates');

  return {
    healthy: warnings.length === 0,
    distribution,
    warnings,
  };
}

// ── Normalize scores across a slate ─────────────────────────────────────

export function normalizeScores(candidates: CandidateScore[]): CandidateScore[] {
  if (candidates.length === 0) return [];
  const min = Math.min(...candidates.map(c => c.score));
  const max = Math.max(...candidates.map(c => c.score));
  const range = max - min || 1;

  return candidates.map(c => ({
    ...c,
    normalized_score: Math.round(((c.score - min) / range) * 100),
  })) as CandidateScore[];
}