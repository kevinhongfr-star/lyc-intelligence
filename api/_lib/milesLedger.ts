import * as db from './supabaseRest.js';

export type TransactionType =
  | 'earn'
  | 'spend'
  | 'expire'
  | 'bonus'
  | 'referral'
  | 'refund'
  | 'adjustment';

export interface MilesTransaction {
  id: string;
  user_id: string;
  transaction_type: TransactionType;
  amount: number;
  description: string;
  reference?: string | null;
  created_at: string;
}

export interface MilesBalance {
  balance: number;
  total_earned: number;
  total_spent: number;
}

export interface LedgerSummary {
  total_transactions: number;
  total_earned: number;
  total_spent: number;
  total_expired: number;
  net_balance: number;
  first_transaction_at: string | null;
  last_transaction_at: string | null;
}

const LEDGER_TABLE = 'miles_ledger';
const BALANCE_TABLE = 'miles_balances';

export async function getMilesBalance(userId: string): Promise<MilesBalance> {
  const row = await db.selectOne(BALANCE_TABLE, {
    column: 'user_id',
    value: userId,
    select: 'balance, total_earned, total_spent',
  });

  if (!row) {
    return { balance: 0, total_earned: 0, total_spent: 0 };
  }

  return {
    balance: row.balance || 0,
    total_earned: row.total_earned || 0,
    total_spent: row.total_spent || 0,
  };
}

async function updateBalanceAtomic(
  userId: string,
  delta: number,
  isEarn: boolean
): Promise<MilesBalance> {
  const current = await getMilesBalance(userId);
  const newBalance = Math.max(0, current.balance + delta);

  const updates: Record<string, any> = {
    balance: newBalance,
    updated_at: new Date().toISOString(),
  };

  if (isEarn && delta > 0) {
    updates.total_earned = (current.total_earned || 0) + delta;
  } else if (!isEarn && delta < 0) {
    updates.total_spent = (current.total_spent || 0) + Math.abs(delta);
  }

  const existing = await db.selectOne(BALANCE_TABLE, {
    column: 'user_id',
    value: userId,
  });

  if (existing) {
    const rows = await db.update(
      BALANCE_TABLE,
      { column: 'user_id', value: userId },
      updates
    );
    const updated = rows[0];
    return {
      balance: updated?.balance ?? newBalance,
      total_earned: updated?.total_earned ?? updates.total_earned ?? current.total_earned,
      total_spent: updated?.total_spent ?? updates.total_spent ?? current.total_spent,
    };
  } else {
    const inserted = await db.insert(BALANCE_TABLE, {
      user_id: userId,
      balance: newBalance,
      total_earned: updates.total_earned || 0,
      total_spent: updates.total_spent || 0,
      updated_at: new Date().toISOString(),
    });
    return {
      balance: inserted?.balance ?? newBalance,
      total_earned: inserted?.total_earned ?? 0,
      total_spent: inserted?.total_spent ?? 0,
    };
  }
}

async function insertTransaction(
  userId: string,
  type: TransactionType,
  amount: number,
  description: string,
  reference?: string | null
): Promise<MilesTransaction> {
  const row = await db.insert(LEDGER_TABLE, {
    user_id: userId,
    transaction_type: type,
    amount,
    description,
    reference: reference || null,
  });

  return {
    id: row?.id || `tx-${Date.now()}`,
    user_id: userId,
    transaction_type: type,
    amount,
    description,
    reference: reference || null,
    created_at: row?.created_at || new Date().toISOString(),
  };
}

export async function earnMiles(
  userId: string,
  amount: number,
  description: string,
  reference?: string
): Promise<{ transaction: MilesTransaction; balance: MilesBalance }> {
  if (amount <= 0) {
    throw new Error('Earn amount must be positive');
  }

  const transaction = await insertTransaction(
    userId,
    'earn',
    amount,
    description,
    reference
  );
  const balance = await updateBalanceAtomic(userId, amount, true);

  return { transaction, balance };
}

export async function spendMiles(
  userId: string,
  amount: number,
  description: string,
  reference?: string
): Promise<{ transaction: MilesTransaction; balance: MilesBalance }> {
  if (amount <= 0) {
    throw new Error('Spend amount must be positive');
  }

  const current = await getMilesBalance(userId);
  if (current.balance < amount) {
    const deficit = amount - current.balance;
    const error: any = new Error(
      `Insufficient miles. Balance: ${current.balance}, requested: ${amount}, deficit: ${deficit}`
    );
    error.code = 'INSUFFICIENT_MILES';
    error.balance = current.balance;
    error.deficit = deficit;
    error.requested = amount;
    throw error;
  }

  const transaction = await insertTransaction(
    userId,
    'spend',
    -amount,
    description,
    reference
  );
  const balance = await updateBalanceAtomic(userId, -amount, false);

  return { transaction, balance };
}

export async function expireMiles(
  userId: string,
  amount: number,
  description: string
): Promise<{ transaction: MilesTransaction; balance: MilesBalance }> {
  if (amount <= 0) {
    throw new Error('Expire amount must be positive');
  }

  const current = await getMilesBalance(userId);
  const actualExpire = Math.min(amount, current.balance);

  const transaction = await insertTransaction(
    userId,
    'expire',
    -actualExpire,
    description
  );
  const balance = await updateBalanceAtomic(userId, -actualExpire, false);

  return { transaction, balance };
}

export async function refundMiles(
  userId: string,
  amount: number,
  originalReference: string
): Promise<{ transaction: MilesTransaction; balance: MilesBalance }> {
  if (amount <= 0) {
    throw new Error('Refund amount must be positive');
  }
  if (!originalReference) {
    throw new Error('Original reference is required for refund');
  }

  const original = await db.selectOne(LEDGER_TABLE, {
    column: 'reference',
    value: originalReference,
    select: 'id, transaction_type, amount',
  });

  if (!original) {
    throw new Error(`Original transaction not found for reference: ${originalReference}`);
  }

  const refunded = await insertTransaction(
    userId,
    'refund',
    amount,
    `Refund for ${originalReference}`,
    `refund-${originalReference}`
  );
  const balance = await updateBalanceAtomic(userId, amount, true);

  return { transaction: refunded, balance };
}

export interface TransactionFilters {
  type?: TransactionType;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export async function getTransactionHistory(
  userId: string,
  filters?: TransactionFilters
): Promise<MilesTransaction[]> {
  const where: any[] = [{ column: 'user_id', value: userId }];

  if (filters?.type) {
    where.push({ column: 'transaction_type', value: filters.type });
  }

  if (filters?.startDate) {
    where.push({ column: 'created_at', value: filters.startDate, op: 'gte' });
  }

  if (filters?.endDate) {
    where.push({ column: 'created_at', value: filters.endDate, op: 'lte' });
  }

  const rows = await db.selectMany(LEDGER_TABLE, {
    where,
    orderBy: { column: 'created_at', ascending: false },
    limit: filters?.limit ?? 50,
    offset: filters?.offset ?? 0,
  });

  return (rows || []).map((r: any) => ({
    id: r.id,
    user_id: r.user_id,
    transaction_type: r.transaction_type,
    amount: r.amount,
    description: r.description,
    reference: r.reference,
    created_at: r.created_at,
  }));
}

export async function getLedgerSummary(userId: string): Promise<LedgerSummary> {
  const transactions = await getTransactionHistory(userId, { limit: 1000 });

  let totalEarned = 0;
  let totalSpent = 0;
  let totalExpired = 0;

  for (const tx of transactions) {
    switch (tx.transaction_type) {
      case 'earn':
      case 'bonus':
      case 'referral':
      case 'refund':
        if (tx.amount > 0) totalEarned += tx.amount;
        break;
      case 'adjustment':
        if (tx.amount > 0) {
          totalEarned += tx.amount;
        } else {
          totalSpent += Math.abs(tx.amount);
        }
        break;
      case 'spend':
        totalSpent += Math.abs(tx.amount);
        break;
      case 'expire':
        totalExpired += Math.abs(tx.amount);
        break;
    }
  }

  const balance = await getMilesBalance(userId);
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return {
    total_transactions: transactions.length,
    total_earned: totalEarned,
    total_spent: totalSpent,
    total_expired: totalExpired,
    net_balance: balance.balance,
    first_transaction_at: sorted[0]?.created_at || null,
    last_transaction_at: sorted[sorted.length - 1]?.created_at || null,
  };
}

export async function adjustMiles(
  userId: string,
  amount: number,
  description: string,
  reference?: string
): Promise<{ transaction: MilesTransaction; balance: MilesBalance }> {
  if (amount === 0) {
    throw new Error('Adjustment amount must be non-zero');
  }

  const isEarn = amount > 0;
  const transaction = await insertTransaction(
    userId,
    'adjustment',
    amount,
    description,
    reference
  );
  const balance = await updateBalanceAtomic(userId, amount, isEarn);

  return { transaction, balance };
}