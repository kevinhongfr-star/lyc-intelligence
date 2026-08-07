// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../../api/_lib/supabaseRest', () => ({
  selectOne: vi.fn(),
  selectMany: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  isSupabaseConfigured: vi.fn(() => true),
  handleError: vi.fn(),
}));

vi.mock('../../../api/_lib/adminAuth', () => ({
  getUserFromRequest: vi.fn(),
  getUserRole: vi.fn(),
}));

import { selectOne, selectMany, insert, update } from '../../../api/_lib/supabaseRest';
import { getUserFromRequest } from '../../../api/_lib/adminAuth';
import {
  assignTier,
  computeWeightedScore,
  compareCandidates,
  rankCandidates,
  aggregateReviews,
  computeShortlistHealth,
  normalizeScores,
  DEFAULT_DIMENSIONS,
  type CandidateScore,
} from '../../../api/_lib/clientReviewEngine';

const mockSelectOne = vi.mocked(selectOne);
const mockSelectMany = vi.mocked(selectMany);

beforeEach(() => {
  vi.clearAllMocks();
});

// ── assignTier ────────────────────────────────────────────────────────

describe('assignTier', () => {
  it('returns explicit tier if provided', () => {
    expect(assignTier(50, 'Gold')).toBe('Gold');
    expect(assignTier(10, 'Silver')).toBe('Silver');
    expect(assignTier(100, 'Bronze')).toBe('Bronze');
  });

  it('returns Gold for score >= 85', () => {
    expect(assignTier(85)).toBe('Gold');
    expect(assignTier(95)).toBe('Gold');
  });

  it('returns Silver for score >= 65', () => {
    expect(assignTier(65)).toBe('Silver');
    expect(assignTier(84)).toBe('Silver');
  });

  it('returns Bronze for score >= 45', () => {
    expect(assignTier(45)).toBe('Bronze');
    expect(assignTier(64)).toBe('Bronze');
  });

  it('returns Unranked for score < 45', () => {
    expect(assignTier(0)).toBe('Unranked');
    expect(assignTier(44)).toBe('Unranked');
  });

  it('uses canvas grade when no explicit tier or score', () => {
    expect(assignTier(0, null, 'S')).toBe('Gold');
    expect(assignTier(0, null, 'A')).toBe('Silver');
    expect(assignTier(0, null, 'B')).toBe('Bronze');
  });
});

// ── computeWeightedScore ──────────────────────────────────────────────

describe('computeWeightedScore', () => {
  it('computes weighted score using default dimensions', () => {
    const dims = { experience: 80, skills_match: 90, culture_fit: 70, leadership: 60, compensation: 30 };
    const score = computeWeightedScore(dims);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('defaults missing dimensions to 50', () => {
    const score = computeWeightedScore({});
    expect(score).toBe(50);
  });

  it('inverts compensation (lower is better)', () => {
    const highComp = computeWeightedScore({ compensation: 90 });
    const lowComp = computeWeightedScore({ compensation: 10 });
    expect(lowComp).toBeGreaterThan(highComp);
  });

  it('handles empty dimensions list', () => {
    const score = computeWeightedScore({ experience: 80 }, []);
    expect(score).toBe(0);
  });
});

// ── compareCandidates ─────────────────────────────────────────────────

describe('compareCandidates', () => {
  const candidates: CandidateScore[] = [
    { id: 'a', name: 'Alice', score: 90, tier: 'Gold', dimensions: { experience: 95, skills_match: 85, culture_fit: 80, leadership: 90, compensation: 40 } },
    { id: 'b', name: 'Bob', score: 75, tier: 'Silver', dimensions: { experience: 70, skills_match: 80, culture_fit: 90, leadership: 65, compensation: 30 } },
    { id: 'c', name: 'Carol', score: 60, tier: 'Bronze', dimensions: { experience: 60, skills_match: 55, culture_fit: 70, leadership: 50, compensation: 20 } },
  ];

  it('returns comparison for all dimensions', () => {
    const results = compareCandidates(candidates);
    expect(results.length).toBe(DEFAULT_DIMENSIONS.length);
    for (const r of results) {
      expect(r.candidates.length).toBe(3);
      expect(r.winner).toBeTruthy();
    }
  });

  it('normalizes values to 0-100 range per dimension', () => {
    const results = compareCandidates(candidates);
    for (const r of results) {
      for (const c of r.candidates) {
        expect(c.normalized).toBeGreaterThanOrEqual(0);
        expect(c.normalized).toBeLessThanOrEqual(100);
      }
    }
  });

  it('assigns ranks correctly', () => {
    const results = compareCandidates(candidates);
    const expResult = results.find(r => r.dimension === 'Experience');
    expect(expResult).toBeTruthy();
    const aliceExp = expResult!.candidates.find(c => c.id === 'a');
    expect(aliceExp?.rank).toBe(1);
  });
});

// ── rankCandidates ────────────────────────────────────────────────────

describe('rankCandidates', () => {
  const candidates: CandidateScore[] = [
    { id: 'c', name: 'Carol', score: 60, tier: 'Bronze', dimensions: {} },
    { id: 'a', name: 'Alice', score: 90, tier: 'Gold', dimensions: {} },
    { id: 'b', name: 'Bob', score: 75, tier: 'Silver', dimensions: {} },
  ];

  it('ranks by tier first, then by score', () => {
    const ranked = rankCandidates(candidates);
    expect(ranked[0].id).toBe('a');
    expect(ranked[1].id).toBe('b');
    expect(ranked[2].id).toBe('c');
  });

  it('assigns rank numbers', () => {
    const ranked = rankCandidates(candidates);
    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].rank).toBe(2);
    expect(ranked[2].rank).toBe(3);
  });

  it('sorts within same tier by score', () => {
    const sameTier: CandidateScore[] = [
      { id: 'x', name: 'X', score: 50, tier: 'Silver', dimensions: {} },
      { id: 'y', name: 'Y', score: 80, tier: 'Silver', dimensions: {} },
    ];
    const ranked = rankCandidates(sameTier);
    expect(ranked[0].id).toBe('y');
    expect(ranked[1].id).toBe('x');
  });
});

// ── aggregateReviews ──────────────────────────────────────────────────

describe('aggregateReviews', () => {
  it('returns empty summary for no reviews', () => {
    const summary = aggregateReviews([]);
    expect(summary.total_reviews).toBe(0);
    expect(summary.consensus_score).toBe(0);
  });

  it('aggregates ratings and decisions', () => {
    const reviews = [
      { candidate_id: 'c1', rating: 5, decision: 'interested', strengths: ['leadership'], concerns: [] },
      { candidate_id: 'c1', rating: 4, decision: 'interested', strengths: ['leadership', 'vision'], concerns: [] },
      { candidate_id: 'c1', rating: 3, decision: 'not_interested', strengths: [], concerns: ['experience'] },
    ];
    const summary = aggregateReviews(reviews);
    expect(summary.total_reviews).toBe(3);
    expect(summary.average_rating).toBe(4);
    expect(summary.decision_counts['interested']).toBe(2);
    expect(summary.decision_counts['not_interested']).toBe(1);
    expect(summary.strengths_frequency['leadership']).toBe(2);
    expect(summary.strengths_frequency['vision']).toBe(1);
    expect(summary.concerns_frequency['experience']).toBe(1);
  });

  it('computes consensus score', () => {
    const reviews = [
      { candidate_id: 'c1', rating: 5, decision: 'interested', strengths: [], concerns: [] },
      { candidate_id: 'c1', rating: 5, decision: 'interested', strengths: [], concerns: [] },
    ];
    const summary = aggregateReviews(reviews);
    expect(summary.consensus_score).toBe(100);
  });
});

// ── computeShortlistHealth ─────────────────────────────────────────────

describe('computeShortlistHealth', () => {
  it('reports healthy for good distribution', () => {
    const result = computeShortlistHealth([
      { id: 'a', tier: 'Gold' },
      { id: 'b', tier: 'Silver' },
      { id: 'c', tier: 'Bronze' },
    ]);
    expect(result.healthy).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it('warns when no Gold candidates', () => {
    const result = computeShortlistHealth([
      { id: 'a', tier: 'Silver' },
      { id: 'b', tier: 'Bronze' },
    ]);
    expect(result.healthy).toBe(false);
    expect(result.warnings.some(w => w.includes('Gold'))).toBe(true);
  });

  it('warns when shortlist is empty', () => {
    const result = computeShortlistHealth([]);
    expect(result.healthy).toBe(false);
    expect(result.warnings.some(w => w.includes('No candidates'))).toBe(true);
  });

  it('warns when more than 50% unranked', () => {
    const result = computeShortlistHealth([
      { id: 'a', tier: 'Unranked' },
      { id: 'b', tier: 'Unranked' },
      { id: 'c', tier: 'Gold' },
    ]);
    expect(result.healthy).toBe(false);
  });
});

// ── normalizeScores ────────────────────────────────────────────────────

describe('normalizeScores', () => {
  it('normalizes scores to 0-100 range', () => {
    const candidates: CandidateScore[] = [
      { id: 'a', name: 'A', score: 90, tier: 'Gold', dimensions: {} },
      { id: 'b', name: 'B', score: 30, tier: 'Bronze', dimensions: {} },
      { id: 'c', name: 'C', score: 60, tier: 'Silver', dimensions: {} },
    ];
    const normalized = normalizeScores(candidates) as Array<CandidateScore & { normalized_score: number }>;
    expect(normalized[0].normalized_score).toBe(100);
    expect(normalized[1].normalized_score).toBe(0);
    expect(normalized[2].normalized_score).toBeGreaterThan(0);
  });

  it('handles empty list', () => {
    const result = normalizeScores([]);
    expect(result).toHaveLength(0);
  });
});