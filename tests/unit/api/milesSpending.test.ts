// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../api/_lib/supabaseRest.js', () => ({
  selectOne: vi.fn(),
  selectMany: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  countRows: vi.fn(),
  isSupabaseConfigured: vi.fn(() => true),
}));

vi.mock('../../../api/_lib/milesLedger.js', () => ({
  earnMiles: vi.fn(),
  getMilesBalance: vi.fn(),
  spendMiles: vi.fn(),
  getTransactionHistory: vi.fn().mockResolvedValue([]),
  refundMiles: vi.fn(),
}));

import { selectOne, selectMany, insert } from '../../../api/_lib/supabaseRest.js';
import { getMilesBalance, spendMiles, refundMiles } from '../../../api/_lib/milesLedger.js';
import {
  FEATURE_COST_MAP,
  checkAndSpend,
  refundSpend,
  getFeatureCost,
  getSpendingHistory,
} from '../../../api/_lib/milesSpending.js';

const mockSelectOne = vi.mocked(selectOne);
const mockSelectMany = vi.mocked(selectMany);
const mockInsert = vi.mocked(insert);
const mockGetMilesBalance = vi.mocked(getMilesBalance);
const mockSpendMiles = vi.mocked(spendMiles);
const mockRefundMiles = vi.mocked(refundMiles);

beforeEach(() => {
  vi.clearAllMocks();
});

function makeSpendingLog(overrides: Record<string, any> = {}) {
  return {
    id: 'log-1',
    user_id: 'user-1',
    feature_key: 'ai_chat',
    miles_cost: 5,
    transaction_reference: 'spend-ai_chat',
    status: 'completed',
    created_at: '2026-08-06T10:00:00Z',
    ...overrides,
  };
}

describe('FEATURE_COST_MAP', () => {
  it('defines costs for all major features', () => {
    const expectedFeatures = [
      'ai_chat', 'assessment', 'framework', 'peer_review',
      'coaching', 'export_pdf', 'mock_interview', 'generate_report',
      'advanced_analytics', 'executive_review',
    ];
    for (const f of expectedFeatures) {
      expect(FEATURE_COST_MAP[f]).toBeDefined();
      expect(FEATURE_COST_MAP[f].miles).toBeGreaterThan(0);
    }
  });

  it('assigns correct costs', () => {
    expect(FEATURE_COST_MAP.ai_chat.miles).toBe(5);
    expect(FEATURE_COST_MAP.assessment.miles).toBe(20);
    expect(FEATURE_COST_MAP.coaching.miles).toBe(50);
    expect(FEATURE_COST_MAP.executive_review.miles).toBe(100);
  });

  it('all costs are positive integers', () => {
    for (const [key, value] of Object.entries(FEATURE_COST_MAP)) {
      expect(Number.isInteger(value.miles)).toBe(true);
      expect(value.miles).toBeGreaterThan(0);
    }
  });

  it('each feature has description', () => {
    for (const [key, value] of Object.entries(FEATURE_COST_MAP)) {
      expect(typeof value.description).toBe('string');
      expect(value.description.length).toBeGreaterThan(0);
    }
  });
});

describe('getFeatureCost', () => {
  it('returns cost for known feature', () => {
    const cost = getFeatureCost('ai_chat');
    expect(cost).toBeDefined();
    expect(cost?.miles).toBe(5);
    expect(cost?.feature).toBe('ai_chat');
  });

  it('returns undefined for unknown feature', () => {
    const cost = getFeatureCost('nonexistent_feature');
    expect(cost).toBeUndefined();
  });

  it('returns correct cost for each feature', () => {
    expect(getFeatureCost('assessment')?.miles).toBe(20);
    expect(getFeatureCost('coaching')?.miles).toBe(50);
    expect(getFeatureCost('export_pdf')?.miles).toBe(3);
  });
});

describe('checkAndSpend', () => {
  it('deducts miles successfully when balance sufficient', async () => {
    mockGetMilesBalance.mockResolvedValue({ balance: 500, total_earned: 1000, total_spent: 500 });
    mockSpendMiles.mockResolvedValue({
      transaction: { id: 'tx-1' } as any,
      balance: { balance: 495, total_earned: 1000, total_spent: 505 },
    });
    mockInsert.mockResolvedValue(makeSpendingLog());

    const result = await checkAndSpend('user-1', 'ai_chat');

    expect(result.success).toBe(true);
    expect(result.balance?.balance).toBe(495);
    expect(insert).toHaveBeenCalledWith(
      'miles_spending_log',
      expect.objectContaining({
        user_id: 'user-1',
        feature_key: 'ai_chat',
        miles_cost: 5,
        status: 'completed',
      })
    );
  });

  it('returns error for unknown feature', async () => {
    const result = await checkAndSpend('user-1', 'nonexistent');

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('UNKNOWN_FEATURE');
  });

  it('returns INSUFFICIENT_MILES when balance too low', async () => {
    mockGetMilesBalance.mockResolvedValue({ balance: 3, total_earned: 100, total_spent: 97 });

    const result = await checkAndSpend('user-1', 'ai_chat');

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('INSUFFICIENT_MILES');
    expect(result.error?.balance).toBe(3);
    expect(result.error?.deficit).toBe(2);
    expect(result.error?.upgradeUrl).toBe('/pricing');
  });

  it('does not deduct when balance insufficient', async () => {
    mockGetMilesBalance.mockResolvedValue({ balance: 0, total_earned: 0, total_spent: 0 });

    const result = await checkAndSpend('user-1', 'coaching');

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('INSUFFICIENT_MILES');
    expect(result.error?.deficit).toBe(50);
    expect(spendMiles).not.toHaveBeenCalled();
  });

  it('handles spendMiles throwing INSUFFICIENT_MILES', async () => {
    mockGetMilesBalance.mockResolvedValue({ balance: 100, total_earned: 0, total_spent: 0 });

    const err: any = new Error('Insufficient');
    err.code = 'INSUFFICIENT_MILES';
    err.balance = 10;
    err.deficit = 40;
    mockSpendMiles.mockRejectedValue(err);

    const result = await checkAndSpend('user-1', 'coaching');

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('INSUFFICIENT_MILES');
    expect(result.error?.balance).toBe(10);
  });

  it('re-throws non-insufficient errors', async () => {
    mockGetMilesBalance.mockResolvedValue({ balance: 500, total_earned: 0, total_spent: 0 });
    mockSpendMiles.mockRejectedValue(new Error('Database error'));

    await expect(checkAndSpend('user-1', 'ai_chat')).rejects.toThrow('Database error');
  });

  it('deducts correct amount for each feature', async () => {
    mockGetMilesBalance.mockResolvedValue({ balance: 1000, total_earned: 0, total_spent: 0 });
    mockSpendMiles.mockResolvedValue({
      transaction: {} as any,
      balance: { balance: 980, total_earned: 0, total_spent: 20 },
    });
    mockInsert.mockResolvedValue(makeSpendingLog());

    await checkAndSpend('user-1', 'assessment');

    expect(spendMiles).toHaveBeenCalledWith(
      'user-1',
      20,
      'Take an assessment',
      'spend-assessment'
    );
  });
});

describe('refundSpend', () => {
  it('refunds a successful spend', async () => {
    mockSelectOne.mockResolvedValue({ id: 'tx-1', transaction_type: 'spend', amount: -5 });
    mockRefundMiles.mockResolvedValue({
      transaction: { id: 'tx-2' } as any,
      balance: { balance: 500, total_earned: 1000, total_spent: 500 },
    });
    mockInsert.mockResolvedValue(makeSpendingLog({ status: 'refunded' }));

    const result = await refundSpend('user-1', 'ai_chat', 'spend-ai_chat');

    expect(result.success).toBe(true);
    expect(mockRefundMiles).toHaveBeenCalledWith(
      'user-1',
      5,
      'spend-ai_chat'
    );
  });

  it('returns error for unknown feature', async () => {
    const result = await refundSpend('user-1', 'unknown', 'ref-1');

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('UNKNOWN_FEATURE');
  });

  it('returns error when original transaction not found', async () => {
    mockSelectOne.mockResolvedValue(null);

    const result = await refundSpend('user-1', 'ai_chat', 'nonexistent-ref');

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('REFERENCE_NOT_FOUND');
  });
});

describe('getSpendingHistory', () => {
  it('returns completed spending records', async () => {
    const logs = [
      makeSpendingLog({ id: 'log-2', created_at: '2026-08-07T10:00:00Z' }),
      makeSpendingLog({ id: 'log-1', created_at: '2026-08-06T10:00:00Z' }),
    ];
    mockSelectMany.mockResolvedValue(logs);

    const result = await getSpendingHistory('user-1');

    expect(result).toHaveLength(2);
    expect(selectMany).toHaveBeenCalledWith(
      'miles_spending_log',
      expect.objectContaining({
        where: expect.arrayContaining([
          { column: 'user_id', value: 'user-1' },
          { column: 'status', value: 'completed' },
        ]),
      })
    );
  });

  it('defaults to limit of 20', async () => {
    mockSelectMany.mockResolvedValue([]);

    await getSpendingHistory('user-1');

    expect(selectMany).toHaveBeenCalledWith(
      'miles_spending_log',
      expect.objectContaining({ limit: 20 })
    );
  });

  it('supports custom limit', async () => {
    mockSelectMany.mockResolvedValue([]);

    await getSpendingHistory('user-1', 50);

    expect(selectMany).toHaveBeenCalledWith(
      'miles_spending_log',
      expect.objectContaining({ limit: 50 })
    );
  });

  it('returns empty array when no spending records', async () => {
    mockSelectMany.mockResolvedValue(null);

    const result = await getSpendingHistory('user-1');

    expect(result).toEqual([]);
  });
});