// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../api/_lib/supabaseRest.js', () => ({
  selectOne: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  selectMany: vi.fn(),
}));

import {
  assessTrustLevel,
  recordTrustSignal,
  computeTrustScore,
  getTrustLevel,
  getAdviceDepthForTrust,
  SIGNAL_WEIGHTS,
  TRUST_THRESHOLDS,
  TRUST_LEVEL_ORDER,
  type TrustLevel,
  type TrustSignal,
  type TrustSignalRecord,
} from '../../../api/_lib/nexusTrustCalibrator.js';
import { selectOne, insert, update, selectMany } from '../../../api/_lib/supabaseRest.js';

const mockSelectOne = vi.mocked(selectOne);
const mockInsert = vi.mocked(insert);
const mockUpdate = vi.mocked(update);
const mockSelectMany = vi.mocked(selectMany);

beforeEach(() => {
  vi.clearAllMocks();
});

function makeSignal(overrides: Partial<TrustSignalRecord> = {}): TrustSignalRecord {
  return {
    id: 'sig-1',
    user_id: 'user-1',
    signal: 'shared_context',
    value: 1,
    created_at: '2026-08-06T10:00:00Z',
    ...overrides,
  };
}

describe('SIGNAL_WEIGHTS', () => {
  it('defines weights for all signal types', () => {
    const signals: TrustSignal[] = [
      'shared_context', 'vulnerability', 'follow_through', 'consistency', 'feedback',
    ];
    for (const s of signals) {
      expect(SIGNAL_WEIGHTS[s]).toBeGreaterThan(0);
    }
  });

  it('vulnerability has highest weight', () => {
    expect(SIGNAL_WEIGHTS.vulnerability).toBeGreaterThan(SIGNAL_WEIGHTS.shared_context);
    expect(SIGNAL_WEIGHTS.vulnerability).toBeGreaterThan(SIGNAL_WEIGHTS.feedback);
  });

  it('feedback has lowest weight', () => {
    expect(SIGNAL_WEIGHTS.feedback).toBeLessThan(SIGNAL_WEIGHTS.follow_through);
    expect(SIGNAL_WEIGHTS.feedback).toBeLessThan(SIGNAL_WEIGHTS.consistency);
  });
});

describe('TRUST_THRESHOLDS', () => {
  it('defines thresholds for all levels', () => {
    expect(TRUST_THRESHOLDS.cold).toBe(0);
    expect(TRUST_THRESHOLDS.warm).toBe(3);
    expect(TRUST_THRESHOLDS.trusted).toBe(7);
    expect(TRUST_THRESHOLDS.veteran).toBe(12);
  });

  it('thresholds are in ascending order', () => {
    expect(TRUST_THRESHOLDS.cold).toBeLessThan(TRUST_THRESHOLDS.warm);
    expect(TRUST_THRESHOLDS.warm).toBeLessThan(TRUST_THRESHOLDS.trusted);
    expect(TRUST_THRESHOLDS.trusted).toBeLessThan(TRUST_THRESHOLDS.veteran);
  });
});

describe('TRUST_LEVEL_ORDER', () => {
  it('contains all trust levels in order', () => {
    expect(TRUST_LEVEL_ORDER).toEqual(['cold', 'warm', 'trusted', 'veteran']);
  });
});

describe('computeTrustScore', () => {
  it('returns 0 for empty array', () => {
    expect(computeTrustScore([])).toBe(0);
  });

  it('returns 0 for null/undefined input', () => {
    expect(computeTrustScore(null as any)).toBe(0);
    expect(computeTrustScore(undefined as any)).toBe(0);
  });

  it('returns weighted score for single shared_context signal', () => {
    const signals = [makeSignal({ signal: 'shared_context', value: 1 })];
    expect(computeTrustScore(signals)).toBe(1.0);
  });

  it('returns weighted score for single vulnerability signal', () => {
    const signals = [makeSignal({ signal: 'vulnerability', value: 1 })];
    expect(computeTrustScore(signals)).toBe(1.5);
  });

  it('returns weighted score for single feedback signal', () => {
    const signals = [makeSignal({ signal: 'feedback', value: 1 })];
    expect(computeTrustScore(signals)).toBe(0.8);
  });

  it('multiplies weight by value', () => {
    const signals = [makeSignal({ signal: 'shared_context', value: 3 })];
    expect(computeTrustScore(signals)).toBe(3.0);
  });

  it('defaults value to 1 when not provided', () => {
    const signals = [makeSignal({ signal: 'follow_through', value: undefined })];
    expect(computeTrustScore(signals)).toBe(1.2);
  });

  it('sums multiple signals', () => {
    const signals: TrustSignalRecord[] = [
      makeSignal({ signal: 'shared_context', value: 1 }),
      makeSignal({ signal: 'vulnerability', value: 1 }),
      makeSignal({ signal: 'feedback', value: 1 }),
    ];
    expect(computeTrustScore(signals)).toBe(3.3);
  });

  it('rounds to one decimal place', () => {
    const signals: TrustSignalRecord[] = [
      makeSignal({ signal: 'shared_context', value: 1 }),
      makeSignal({ signal: 'follow_through', value: 1 }),
      makeSignal({ signal: 'consistency', value: 1 }),
    ];
    const score = computeTrustScore(signals);
    expect(score).toBe(3.2);
  });

  it('handles zero value', () => {
    const signals = [makeSignal({ signal: 'shared_context', value: 0 })];
    expect(computeTrustScore(signals)).toBe(0);
  });

  it('unknown signal defaults to weight 1.0', () => {
    const signals = [makeSignal({ signal: 'unknown_signal' as TrustSignal, value: 2 })];
    expect(computeTrustScore(signals)).toBe(2.0);
  });
});

describe('getTrustLevel', () => {
  it('returns cold for score below 3', () => {
    expect(getTrustLevel(0)).toBe('cold');
    expect(getTrustLevel(2.9)).toBe('cold');
  });

  it('returns warm for score 3 to below 7', () => {
    expect(getTrustLevel(3)).toBe('warm');
    expect(getTrustLevel(6.9)).toBe('warm');
  });

  it('returns trusted for score 7 to below 12', () => {
    expect(getTrustLevel(7)).toBe('trusted');
    expect(getTrustLevel(11.9)).toBe('trusted');
  });

  it('returns veteran for score 12 and above', () => {
    expect(getTrustLevel(12)).toBe('veteran');
    expect(getTrustLevel(100)).toBe('veteran');
  });

  it('boundary: exactly 3.0 is warm', () => {
    expect(getTrustLevel(3.0)).toBe('warm');
  });

  it('boundary: exactly 7.0 is trusted', () => {
    expect(getTrustLevel(7.0)).toBe('trusted');
  });

  it('boundary: exactly 12.0 is veteran', () => {
    expect(getTrustLevel(12.0)).toBe('veteran');
  });

  it('handles negative scores as cold', () => {
    expect(getTrustLevel(-1)).toBe('cold');
  });
});

describe('assessTrustLevel', () => {
  it('returns cold with score 0 when no signals', async () => {
    mockSelectMany.mockResolvedValue(null);

    const result = await assessTrustLevel('user-1');

    expect(selectMany).toHaveBeenCalledWith('nexus_trust_signals', {
      where: [{ column: 'user_id', value: 'user-1' }],
      orderBy: { column: 'created_at', ascending: false },
      limit: 50,
    });
    expect(result.level).toBe('cold');
    expect(result.score).toBe(0);
  });

  it('returns warm when signals meet threshold', async () => {
    const rows = [
      makeSignal({ signal: 'shared_context', value: 1 }),
      makeSignal({ signal: 'vulnerability', value: 1 }),
      makeSignal({ signal: 'follow_through', value: 1 }),
    ];
    mockSelectMany.mockResolvedValue(rows);

    const result = await assessTrustLevel('user-1');

    expect(result.level).toBe('warm');
    expect(result.score).toBe(3.7);
  });

  it('returns trusted with accumulated signals', async () => {
    const rows = [
      makeSignal({ signal: 'shared_context', value: 2 }),
      makeSignal({ signal: 'vulnerability', value: 2 }),
      makeSignal({ signal: 'consistency', value: 2 }),
      makeSignal({ signal: 'feedback', value: 1 }),
    ];
    mockSelectMany.mockResolvedValue(rows);

    const result = await assessTrustLevel('user-1');

    expect(result.level).toBe('trusted');
  });

  it('returns veteran with heavy signal accumulation', async () => {
    const rows: TrustSignalRecord[] = [
      makeSignal({ signal: 'vulnerability', value: 3 }),
      makeSignal({ signal: 'vulnerability', value: 3 }),
      makeSignal({ signal: 'shared_context', value: 2 }),
      makeSignal({ signal: 'follow_through', value: 2 }),
      makeSignal({ signal: 'consistency', value: 2 }),
    ];
    mockSelectMany.mockResolvedValue(rows);

    const result = await assessTrustLevel('user-1');

    expect(result.level).toBe('veteran');
  });

  it('limits to 50 signals', async () => {
    mockSelectMany.mockResolvedValue([]);
    await assessTrustLevel('user-1');
    expect(selectMany).toHaveBeenCalledWith(
      'nexus_trust_signals',
      expect.objectContaining({ limit: 50 })
    );
  });
});

describe('recordTrustSignal', () => {
  it('inserts and returns the signal record', async () => {
    const row = makeSignal();
    mockInsert.mockResolvedValue(row);

    const result = await recordTrustSignal('user-1', 'shared_context', 1);

    expect(insert).toHaveBeenCalledWith('nexus_trust_signals', {
      user_id: 'user-1',
      signal: 'shared_context',
      value: 1,
    });
    expect(result).toEqual(row);
  });

  it('defaults value to null when not provided', async () => {
    mockInsert.mockResolvedValue(makeSignal({ value: null }));

    await recordTrustSignal('user-1', 'vulnerability');

    expect(insert).toHaveBeenCalledWith('nexus_trust_signals', {
      user_id: 'user-1',
      signal: 'vulnerability',
      value: null,
    });
  });

  it('works with all signal types', async () => {
    const types: TrustSignal[] = [
      'shared_context', 'vulnerability', 'follow_through', 'consistency', 'feedback',
    ];
    for (const t of types) {
      const row = makeSignal({ signal: t });
      mockInsert.mockResolvedValue(row);
      const result = await recordTrustSignal('user-1', t, 1);
      expect(result.signal).toBe(t);
    }
  });

  it('throws when insert fails', async () => {
    mockInsert.mockRejectedValue(new Error('DB error'));
    await expect(recordTrustSignal('user-1', 'feedback', 1)).rejects.toThrow('DB error');
  });
});

describe('getAdviceDepthForTrust', () => {
  it('cold: strategy only, no tactical/prescriptive/intimate', () => {
    const depth = getAdviceDepthForTrust('cold');
    expect(depth.canGiveStrategy).toBe(true);
    expect(depth.canGiveTactical).toBe(false);
    expect(depth.canGivePrescriptive).toBe(false);
    expect(depth.canGiveIntimate).toBe(false);
    expect(depth.maxAdvicePersonalization).toBe(20);
  });

  it('warm: strategy + tactical, no prescriptive/intimate', () => {
    const depth = getAdviceDepthForTrust('warm');
    expect(depth.canGiveStrategy).toBe(true);
    expect(depth.canGiveTactical).toBe(true);
    expect(depth.canGivePrescriptive).toBe(false);
    expect(depth.canGiveIntimate).toBe(false);
    expect(depth.maxAdvicePersonalization).toBe(50);
  });

  it('trusted: strategy + tactical + prescriptive, no intimate', () => {
    const depth = getAdviceDepthForTrust('trusted');
    expect(depth.canGiveStrategy).toBe(true);
    expect(depth.canGiveTactical).toBe(true);
    expect(depth.canGivePrescriptive).toBe(true);
    expect(depth.canGiveIntimate).toBe(false);
    expect(depth.maxAdvicePersonalization).toBe(80);
  });

  it('veteran: full access to all advice types', () => {
    const depth = getAdviceDepthForTrust('veteran');
    expect(depth.canGiveStrategy).toBe(true);
    expect(depth.canGiveTactical).toBe(true);
    expect(depth.canGivePrescriptive).toBe(true);
    expect(depth.canGiveIntimate).toBe(true);
    expect(depth.maxAdvicePersonalization).toBe(100);
  });

  it('all levels return valid structure', () => {
    const levels: TrustLevel[] = ['cold', 'warm', 'trusted', 'veteran'];
    for (const level of levels) {
      const depth = getAdviceDepthForTrust(level);
      expect(depth).toHaveProperty('canGiveStrategy');
      expect(depth).toHaveProperty('canGiveTactical');
      expect(depth).toHaveProperty('canGivePrescriptive');
      expect(depth).toHaveProperty('canGiveIntimate');
      expect(depth).toHaveProperty('maxAdvicePersonalization');
    }
  });

  it('personalization increases with trust level', () => {
    const cold = getAdviceDepthForTrust('cold').maxAdvicePersonalization;
    const warm = getAdviceDepthForTrust('warm').maxAdvicePersonalization;
    const trusted = getAdviceDepthForTrust('trusted').maxAdvicePersonalization;
    const veteran = getAdviceDepthForTrust('veteran').maxAdvicePersonalization;

    expect(cold).toBeLessThan(warm);
    expect(warm).toBeLessThan(trusted);
    expect(trusted).toBeLessThan(veteran);
  });
});