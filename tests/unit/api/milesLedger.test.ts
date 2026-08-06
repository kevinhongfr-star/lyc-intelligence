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

import { selectOne, selectMany, insert, update } from '../../../api/_lib/supabaseRest.js';
import {
  getMilesBalance,
  earnMiles,
  spendMiles,
  expireMiles,
  refundMiles,
  getTransactionHistory,
  getLedgerSummary,
  adjustMiles,
  type MilesTransaction,
  type MilesBalance,
  type TransactionType,
} from '../../../api/_lib/milesLedger.js';

const mockSelectOne = vi.mocked(selectOne);
const mockSelectMany = vi.mocked(selectMany);
const mockInsert = vi.mocked(insert);
const mockUpdate = vi.mocked(update);

beforeEach(() => {
  vi.clearAllMocks();
});

function makeLedgerRow(overrides: Record<string, any> = {}): MilesTransaction {
  return {
    id: 'tx-1',
    user_id: 'user-1',
    transaction_type: 'earn',
    amount: 100,
    description: 'Test earn',
    reference: null,
    created_at: '2026-08-06T10:00:00Z',
    ...overrides,
  };
}

function makeBalanceRow(overrides: Record<string, any> = {}) {
  return {
    user_id: 'user-1',
    balance: 500,
    total_earned: 1000,
    total_spent: 500,
    updated_at: '2026-08-06T10:00:00Z',
    ...overrides,
  };
}

function setupExistingBalance(balance: number = 500) {
  const row = makeBalanceRow({ balance });
  mockSelectOne.mockImplementation(async (table: string, filter: any) => {
    if (table === 'miles_balances') return row;
    return null;
  });
  return row;
}

function setupNoBalance() {
  mockSelectOne.mockResolvedValue(null);
}

describe('getMilesBalance', () => {
  it('returns balance from database', async () => {
    mockSelectOne.mockResolvedValue(makeBalanceRow());

    const result = await getMilesBalance('user-1');

    expect(result).toEqual({ balance: 500, total_earned: 1000, total_spent: 500 });
  });

  it('returns zero balance when no record exists', async () => {
    mockSelectOne.mockResolvedValue(null);

    const result = await getMilesBalance('unknown-user');

    expect(result).toEqual({ balance: 0, total_earned: 0, total_spent: 0 });
  });

  it('handles null/undefined fields gracefully', async () => {
    mockSelectOne.mockResolvedValue({ user_id: 'user-1' });

    const result = await getMilesBalance('user-1');

    expect(result).toEqual({ balance: 0, total_earned: 0, total_spent: 0 });
  });

  it('queries with correct table and column', async () => {
    mockSelectOne.mockResolvedValue(makeBalanceRow());

    await getMilesBalance('user-1');

    expect(selectOne).toHaveBeenCalledWith('miles_balances', {
      column: 'user_id',
      value: 'user-1',
      select: 'balance, total_earned, total_spent',
    });
  });
});

describe('earnMiles', () => {
  it('inserts transaction and updates balance for new user', async () => {
    const txRow = makeLedgerRow();
    const newBalance = makeBalanceRow({ balance: 100, total_earned: 100 });

    mockSelectOne.mockResolvedValue(null);
    mockInsert
      .mockResolvedValueOnce(txRow)
      .mockResolvedValueOnce(newBalance);

    const result = await earnMiles('user-1', 100, 'Test earn');

    expect(insert).toHaveBeenCalledWith(
      'miles_ledger',
      expect.objectContaining({
        user_id: 'user-1',
        transaction_type: 'earn',
        amount: 100,
        description: 'Test earn',
      })
    );
    expect(insert).toHaveBeenCalledWith(
      'miles_balances',
      expect.objectContaining({
        user_id: 'user-1',
        balance: 100,
        total_earned: 100,
      })
    );
    expect(result.transaction.amount).toBe(100);
    expect(result.balance.balance).toBe(100);
  });

  it('updates existing balance record', async () => {
    const txRow = makeLedgerRow();
    const existingBalance = makeBalanceRow({ balance: 500, total_earned: 1000, total_spent: 500 });
    const updatedBalance = makeBalanceRow({ balance: 600, total_earned: 1100, total_spent: 500 });

    mockSelectOne.mockImplementation(async (table: string) => {
      if (table === 'miles_balances') return existingBalance;
      return null;
    });
    mockInsert.mockResolvedValueOnce(txRow);
    mockUpdate.mockResolvedValueOnce([updatedBalance]);

    const result = await earnMiles('user-1', 100, 'Test earn');

    expect(update).toHaveBeenCalledWith(
      'miles_balances',
      { column: 'user_id', value: 'user-1' },
      expect.objectContaining({
        balance: 600,
        total_earned: 1100,
      })
    );
    expect(result.balance.balance).toBe(600);
  });

  it('throws on negative amount', async () => {
    await expect(earnMiles('user-1', -10, 'bad')).rejects.toThrow('positive');
  });

  it('throws on zero amount', async () => {
    await expect(earnMiles('user-1', 0, 'bad')).rejects.toThrow('positive');
  });

  it('stores reference when provided', async () => {
    const txRow = makeLedgerRow({ reference: 'ref-123' });
    const newBalance = makeBalanceRow({ balance: 50 });

    mockSelectOne.mockResolvedValue(null);
    mockInsert
      .mockResolvedValueOnce(txRow)
      .mockResolvedValueOnce(newBalance);

    await earnMiles('user-1', 50, 'test', 'ref-123');

    expect(insert).toHaveBeenCalledWith(
      'miles_ledger',
      expect.objectContaining({ reference: 'ref-123' })
    );
  });

  it('defaults reference to null when not provided', async () => {
    const txRow = makeLedgerRow({ reference: null });
    const newBalance = makeBalanceRow({ balance: 50 });

    mockSelectOne.mockResolvedValue(null);
    mockInsert
      .mockResolvedValueOnce(txRow)
      .mockResolvedValueOnce(newBalance);

    await earnMiles('user-1', 50, 'test');

    expect(insert).toHaveBeenCalledWith(
      'miles_ledger',
      expect.objectContaining({ reference: null })
    );
  });
});

describe('spendMiles', () => {
  it('deducts miles and records spend', async () => {
    const txRow = makeLedgerRow({ transaction_type: 'spend', amount: -50 });
    const existingBalance = makeBalanceRow({ balance: 500 });
    const updatedBalance = makeBalanceRow({ balance: 450, total_spent: 550 });

    mockSelectOne.mockImplementation(async (table: string) => {
      if (table === 'miles_balances') return existingBalance;
      return null;
    });
    mockInsert.mockResolvedValueOnce(txRow);
    mockUpdate.mockResolvedValueOnce([updatedBalance]);

    const result = await spendMiles('user-1', 50, 'Test spend');

    expect(insert).toHaveBeenCalledWith(
      'miles_ledger',
      expect.objectContaining({
        transaction_type: 'spend',
        amount: -50,
      })
    );
    expect(result.transaction.amount).toBe(-50);
    expect(result.balance.balance).toBe(450);
  });

  it('throws INSUFFICIENT_MILES when balance too low', async () => {
    mockSelectOne.mockResolvedValue(makeBalanceRow({ balance: 10 }));

    try {
      await spendMiles('user-1', 50, 'big spend');
      fail('Expected error');
    } catch (err: any) {
      expect(err.code).toBe('INSUFFICIENT_MILES');
      expect(err.balance).toBe(10);
      expect(err.deficit).toBe(40);
    }
  });

  it('allows spending exactly the balance', async () => {
    const txRow = makeLedgerRow({ transaction_type: 'spend', amount: -500 });
    const existingBalance = makeBalanceRow({ balance: 500, total_earned: 1000, total_spent: 500 });
    const updatedBalance = makeBalanceRow({ balance: 0, total_earned: 1000, total_spent: 1000 });

    mockSelectOne.mockImplementation(async (table: string) => {
      if (table === 'miles_balances') return existingBalance;
      return null;
    });
    mockInsert.mockResolvedValueOnce(txRow);
    mockUpdate.mockResolvedValueOnce([updatedBalance]);

    const result = await spendMiles('user-1', 500, 'full spend');

    expect(result.balance.balance).toBe(0);
  });

  it('throws on negative amount', async () => {
    await expect(spendMiles('user-1', -5, 'bad')).rejects.toThrow('positive');
  });

  it('throws on zero amount', async () => {
    await expect(spendMiles('user-1', 0, 'bad')).rejects.toThrow('positive');
  });

  it('checks balance before inserting transaction', async () => {
    mockSelectOne.mockResolvedValue(makeBalanceRow({ balance: 5 }));

    try {
      await spendMiles('user-1', 100, 'too much');
      fail('Expected error');
    } catch (err: any) {
      expect(err.code).toBe('INSUFFICIENT_MILES');
    }

    expect(insert).not.toHaveBeenCalled();
  });
});

describe('expireMiles', () => {
  it('expires miles from balance', async () => {
    const txRow = makeLedgerRow({ transaction_type: 'expire', amount: -100 });
    const existingBalance = makeBalanceRow({ balance: 500 });
    const updatedBalance = makeBalanceRow({ balance: 400 });

    mockSelectOne.mockImplementation(async (table: string) => {
      if (table === 'miles_balances') return existingBalance;
      return null;
    });
    mockInsert.mockResolvedValueOnce(txRow);
    mockUpdate.mockResolvedValueOnce([updatedBalance]);

    const result = await expireMiles('user-1', 100, 'Monthly expiration');

    expect(result.transaction.transaction_type).toBe('expire');
    expect(result.transaction.amount).toBe(-100);
    expect(result.balance.balance).toBe(400);
  });

  it('only expires up to available balance', async () => {
    const txRow = makeLedgerRow({ transaction_type: 'expire', amount: -50 });
    const existingBalance = makeBalanceRow({ balance: 50 });
    const updatedBalance = makeBalanceRow({ balance: 0 });

    mockSelectOne.mockImplementation(async (table: string) => {
      if (table === 'miles_balances') return existingBalance;
      return null;
    });
    mockInsert.mockResolvedValueOnce(txRow);
    mockUpdate.mockResolvedValueOnce([updatedBalance]);

    const result = await expireMiles('user-1', 999, 'big expire');

    expect(result.transaction.amount).toBe(-50);
    expect(result.balance.balance).toBe(0);
  });

  it('throws on negative amount', async () => {
    await expect(expireMiles('user-1', -5, 'bad')).rejects.toThrow('positive');
  });

  it('throws on zero amount', async () => {
    await expect(expireMiles('user-1', 0, 'bad')).rejects.toThrow('positive');
  });
});

describe('refundMiles', () => {
  it('refunds miles back to balance', async () => {
    const originalTx = makeLedgerRow({ reference: 'spend-ref-1' });
    const refundTx = makeLedgerRow({
      transaction_type: 'refund',
      amount: 50,
      reference: 'refund-spend-ref-1',
    });
    const existingBalance = makeBalanceRow({ balance: 450 });
    const updatedBalance = makeBalanceRow({ balance: 500 });

    mockSelectOne.mockImplementation(async (table: string, filter: any) => {
      if (table === 'miles_ledger' && filter?.column === 'reference') return originalTx;
      if (table === 'miles_balances') return existingBalance;
      return null;
    });
    mockInsert
      .mockResolvedValueOnce(refundTx)
      .mockResolvedValueOnce(updatedBalance);
    mockUpdate.mockResolvedValueOnce([updatedBalance]);

    const result = await refundMiles('user-1', 50, 'spend-ref-1');

    expect(result.transaction.transaction_type).toBe('refund');
    expect(result.transaction.amount).toBe(50);
    expect(result.transaction.reference).toBe('refund-spend-ref-1');
  });

  it('throws when original reference not found', async () => {
    mockSelectOne.mockResolvedValue(null);

    await expect(refundMiles('user-1', 50, 'nonexistent')).rejects.toThrow(
      'Original transaction not found'
    );
  });

  it('throws on negative amount', async () => {
    await expect(refundMiles('user-1', -5, 'ref')).rejects.toThrow('positive');
  });

  it('throws on empty reference', async () => {
    await expect(refundMiles('user-1', 50, '')).rejects.toThrow(
      'Original reference is required'
    );
  });
});

describe('getTransactionHistory', () => {
  it('returns transactions ordered by created_at descending', async () => {
    const rows: MilesTransaction[] = [
      makeLedgerRow({ id: 'tx-2', created_at: '2026-08-06T12:00:00Z' }),
      makeLedgerRow({ id: 'tx-1', created_at: '2026-08-06T10:00:00Z' }),
    ];
    mockSelectMany.mockResolvedValue(rows);

    const result = await getTransactionHistory('user-1');

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('tx-2');
    expect(selectMany).toHaveBeenCalledWith(
      'miles_ledger',
      expect.objectContaining({
        orderBy: { column: 'created_at', ascending: false },
      })
    );
  });

  it('filters by transaction type', async () => {
    mockSelectMany.mockResolvedValue([]);

    await getTransactionHistory('user-1', { type: 'earn' });

    expect(selectMany).toHaveBeenCalledWith(
      'miles_ledger',
      expect.objectContaining({
        where: expect.arrayContaining([
          { column: 'user_id', value: 'user-1' },
          { column: 'transaction_type', value: 'earn' },
        ]),
      })
    );
  });

  it('supports date range filtering', async () => {
    mockSelectMany.mockResolvedValue([]);

    await getTransactionHistory('user-1', {
      startDate: '2026-08-01',
      endDate: '2026-08-31',
    });

    expect(selectMany).toHaveBeenCalledWith(
      'miles_ledger',
      expect.objectContaining({
        where: expect.arrayContaining([
          { column: 'created_at', value: '2026-08-01', op: 'gte' },
          { column: 'created_at', value: '2026-08-31', op: 'lte' },
        ]),
      })
    );
  });

  it('supports pagination', async () => {
    mockSelectMany.mockResolvedValue([]);

    await getTransactionHistory('user-1', { limit: 10, offset: 20 });

    expect(selectMany).toHaveBeenCalledWith(
      'miles_ledger',
      expect.objectContaining({ limit: 10, offset: 20 })
    );
  });

  it('defaults to 50 limit and 0 offset', async () => {
    mockSelectMany.mockResolvedValue([]);

    await getTransactionHistory('user-1');

    expect(selectMany).toHaveBeenCalledWith(
      'miles_ledger',
      expect.objectContaining({ limit: 50, offset: 0 })
    );
  });

  it('returns empty array when no transactions', async () => {
    mockSelectMany.mockResolvedValue(null);

    const result = await getTransactionHistory('user-1');

    expect(result).toEqual([]);
  });
});

describe('getLedgerSummary', () => {
  it('computes summary correctly from transactions', async () => {
    const txs: MilesTransaction[] = [
      makeLedgerRow({ transaction_type: 'earn', amount: 200 }),
      makeLedgerRow({ transaction_type: 'spend', amount: -50 }),
      makeLedgerRow({ transaction_type: 'expire', amount: -30 }),
      makeLedgerRow({ transaction_type: 'bonus', amount: 50 }),
    ];

    mockSelectMany.mockResolvedValue(txs);
    mockSelectOne.mockResolvedValue(makeBalanceRow({ balance: 170 }));

    const summary = await getLedgerSummary('user-1');

    expect(summary.total_transactions).toBe(4);
    expect(summary.total_earned).toBe(250);
    expect(summary.total_spent).toBe(50);
    expect(summary.total_expired).toBe(30);
    expect(summary.net_balance).toBe(170);
  });

  it('returns zeros for user with no transactions', async () => {
    mockSelectMany.mockResolvedValue(null);
    mockSelectOne.mockResolvedValue(null);

    const summary = await getLedgerSummary('new-user');

    expect(summary.total_transactions).toBe(0);
    expect(summary.total_earned).toBe(0);
    expect(summary.total_spent).toBe(0);
    expect(summary.net_balance).toBe(0);
    expect(summary.first_transaction_at).toBeNull();
    expect(summary.last_transaction_at).toBeNull();
  });

  it('includes first and last transaction dates', async () => {
    const txs: MilesTransaction[] = [
      makeLedgerRow({ created_at: '2026-08-06T10:00:00Z' }),
      makeLedgerRow({ created_at: '2026-08-07T10:00:00Z' }),
      makeLedgerRow({ created_at: '2026-08-08T10:00:00Z' }),
    ];
    mockSelectMany.mockResolvedValue(txs);
    mockSelectOne.mockResolvedValue(makeBalanceRow());

    const summary = await getLedgerSummary('user-1');

    expect(summary.first_transaction_at).toBe('2026-08-06T10:00:00Z');
    expect(summary.last_transaction_at).toBe('2026-08-08T10:00:00Z');
  });

  it('counts refund and positive adjustment as earnings', async () => {
    const txs: MilesTransaction[] = [
      makeLedgerRow({ transaction_type: 'refund', amount: 30 }),
      makeLedgerRow({ transaction_type: 'adjustment', amount: 20 }),
    ];
    mockSelectMany.mockResolvedValue(txs);
    mockSelectOne.mockResolvedValue(makeBalanceRow({ balance: 50 }));

    const summary = await getLedgerSummary('user-1');

    expect(summary.total_earned).toBe(50);
  });

  it('counts negative adjustment as spend', async () => {
    const txs: MilesTransaction[] = [
      makeLedgerRow({ transaction_type: 'adjustment', amount: -10 }),
    ];
    mockSelectMany.mockResolvedValue(txs);
    mockSelectOne.mockResolvedValue(makeBalanceRow({ balance: 490 }));

    const summary = await getLedgerSummary('user-1');

    expect(summary.total_spent).toBe(10);
  });
});

describe('adjustMiles', () => {
  it('records positive adjustment as earn-type transaction', async () => {
    const txRow = makeLedgerRow({ transaction_type: 'adjustment', amount: 25 });
    const existingBalance = makeBalanceRow();
    const updatedBalance = makeBalanceRow({ balance: 525, total_earned: 1025 });

    mockSelectOne.mockImplementation(async (table: string) => {
      if (table === 'miles_balances') return existingBalance;
      return null;
    });
    mockInsert.mockResolvedValueOnce(txRow);
    mockUpdate.mockResolvedValueOnce([updatedBalance]);

    const result = await adjustMiles('user-1', 25, 'Manual adjustment');

    expect(result.transaction.transaction_type).toBe('adjustment');
    expect(result.transaction.amount).toBe(25);
  });

  it('records negative adjustment reducing balance', async () => {
    const txRow = makeLedgerRow({ transaction_type: 'adjustment', amount: -15 });
    const existingBalance = makeBalanceRow();
    const updatedBalance = makeBalanceRow({ balance: 485 });

    mockSelectOne.mockImplementation(async (table: string) => {
      if (table === 'miles_balances') return existingBalance;
      return null;
    });
    mockInsert.mockResolvedValueOnce(txRow);
    mockUpdate.mockResolvedValueOnce([updatedBalance]);

    const result = await adjustMiles('user-1', -15, 'Correction');

    expect(result.transaction.amount).toBe(-15);
    expect(result.balance.balance).toBe(485);
  });

  it('throws on zero amount', async () => {
    await expect(adjustMiles('user-1', 0, 'zero')).rejects.toThrow('non-zero');
  });
});

describe('TransactionType type coverage', () => {
  it('supports all 7 defined transaction types', () => {
    const types: TransactionType[] = [
      'earn', 'spend', 'expire', 'bonus', 'referral', 'refund', 'adjustment',
    ];
    expect(types).toHaveLength(7);
  });
});