// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  classifyNPSScore,
  calculateNPS,
  computeLoginStreak,
  computeAverageResponseTime,
  computeEngagementLevel,
} from '../../../api/_lib/clientEngagementHandler';

// ── classifyNPSScore ──────────────────────────────────────────────────

describe('classifyNPSScore', () => {
  it('classifies 9-10 as promoter', () => {
    expect(classifyNPSScore(9)).toBe('promoter');
    expect(classifyNPSScore(10)).toBe('promoter');
  });

  it('classifies 7-8 as passive', () => {
    expect(classifyNPSScore(7)).toBe('passive');
    expect(classifyNPSScore(8)).toBe('passive');
  });

  it('classifies 0-6 as detractor', () => {
    expect(classifyNPSScore(0)).toBe('detractor');
    expect(classifyNPSScore(6)).toBe('detractor');
  });
});

// ── calculateNPS ────────────────────────────────────────────────────────

describe('calculateNPS', () => {
  it('returns 0 for no records', () => {
    expect(calculateNPS([])).toBe(0);
  });

  it('returns positive NPS when more promoters than detractors', () => {
    const records = [
      { score: 10, category: 'promoter' },
      { score: 9, category: 'promoter' },
      { score: 2, category: 'detractor' },
    ];
    const nps = calculateNPS(records);
    expect(nps).toBeGreaterThan(0);
  });

  it('returns negative NPS when more detractors', () => {
    const records = [
      { score: 2, category: 'detractor' },
      { score: 3, category: 'detractor' },
      { score: 10, category: 'promoter' },
    ];
    const nps = calculateNPS(records);
    expect(nps).toBeLessThan(0);
  });

  it('returns 100 when all promoters', () => {
    const records = [
      { score: 10, category: 'promoter' },
      { score: 9, category: 'promoter' },
    ];
    expect(calculateNPS(records)).toBe(100);
  });

  it('returns -100 when all detractors', () => {
    const records = [
      { score: 0, category: 'detractor' },
      { score: 5, category: 'detractor' },
    ];
    expect(calculateNPS(records)).toBe(-100);
  });
});

// ── computeLoginStreak ─────────────────────────────────────────────────

describe('computeLoginStreak', () => {
  it('returns 0 for empty logins', () => {
    expect(computeLoginStreak([])).toBe(0);
  });

  it('returns 1 for single login today', () => {
    const today = new Date();
    expect(computeLoginStreak([today])).toBe(1);
  });

  it('counts consecutive days', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    expect(computeLoginStreak([today, yesterday, twoDaysAgo])).toBe(3);
  });

  it('breaks streak on gap', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    expect(computeLoginStreak([today, threeDaysAgo])).toBe(1);
  });
});

// ── computeAverageResponseTime ────────────────────────────────────────

describe('computeAverageResponseTime', () => {
  it('returns null for fewer than 2 records', () => {
    expect(computeAverageResponseTime([])).toBeNull();
    expect(computeAverageResponseTime([{ created_at: '2026-01-01T00:00:00Z' }])).toBeNull();
  });

  it('computes average time difference in hours', () => {
    const jan1 = new Date('2026-01-01T00:00:00Z').toISOString();
    const jan2 = new Date('2026-01-02T00:00:00Z').toISOString();
    const result = computeAverageResponseTime([{ created_at: jan2 }, { created_at: jan1 }]);
    expect(result).toBe(24);
  });
});

// ── computeEngagementLevel ─────────────────────────────────────────────

describe('computeEngagementLevel', () => {
  it('returns inactive for zero activity', () => {
    expect(computeEngagementLevel(0, 0, 0)).toBe('inactive');
  });

  it('returns active for high engagement', () => {
    expect(computeEngagementLevel(50, 30, 20)).toBe('active');
  });

  it('returns moderate for moderate engagement', () => {
    expect(computeEngagementLevel(30, 15, 10)).toBe('moderate');
  });

  it('returns low for low engagement', () => {
    expect(computeEngagementLevel(10, 5, 3)).toBe('low');
  });
});