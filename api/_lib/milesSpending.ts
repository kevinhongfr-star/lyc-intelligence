import * as db from './supabaseRest.js';
import { spendMiles, getMilesBalance } from './milesLedger.js';

export interface FeatureCost {
  feature: string;
  miles: number;
  description: string;
  tier?: string;
}

export const FEATURE_COST_MAP: Record<string, FeatureCost> = {
  ai_chat: {
    feature: 'ai_chat',
    miles: 5,
    description: 'AI chat conversation',
  },
  assessment: {
    feature: 'assessment',
    miles: 20,
    description: 'Take an assessment',
  },
  framework: {
    feature: 'framework',
    miles: 15,
    description: 'Use a framework',
  },
  peer_review: {
    feature: 'peer_review',
    miles: 10,
    description: 'Peer review session',
  },
  coaching: {
    feature: 'coaching',
    miles: 50,
    description: 'Coaching session',
  },
  export_pdf: {
    feature: 'export_pdf',
    miles: 3,
    description: 'Export as PDF',
  },
  mock_interview: {
    feature: 'mock_interview',
    miles: 10,
    description: 'Mock interview',
  },
  generate_report: {
    feature: 'generate_report',
    miles: 25,
    description: 'Generate a report',
  },
  advanced_analytics: {
    feature: 'advanced_analytics',
    miles: 30,
    description: 'Advanced analytics view',
  },
  executive_review: {
    feature: 'executive_review',
    miles: 100,
    description: 'Executive review session',
  },
};

export interface SpendResult {
  success: boolean;
  transaction?: any;
  balance?: { balance: number; total_earned: number; total_spent: number };
  error?: {
    code: string;
    message: string;
    balance?: number;
    deficit?: number;
    tier?: string;
    upgradeUrl?: string;
  };
}

const SPEND_TABLE = 'miles_spending_log';

export function getFeatureCost(featureKey: string): FeatureCost | undefined {
  return FEATURE_COST_MAP[featureKey];
}

export async function checkAndSpend(
  userId: string,
  featureKey: string
): Promise<SpendResult> {
  const cost = FEATURE_COST_MAP[featureKey];
  if (!cost) {
    return {
      success: false,
      error: {
        code: 'UNKNOWN_FEATURE',
        message: `Unknown feature: ${featureKey}`,
      },
    };
  }

  const balance = await getMilesBalance(userId);
  if (balance.balance < cost.miles) {
    const deficit = cost.miles - balance.balance;
    return {
      success: false,
      balance,
      error: {
        code: 'INSUFFICIENT_MILES',
        message: `Insufficient miles for ${cost.description}. Need ${cost.miles}, have ${balance.balance}`,
        balance: balance.balance,
        deficit,
        tier: cost.tier,
        upgradeUrl: '/pricing',
      },
    };
  }

  try {
    const result = await spendMiles(
      userId,
      cost.miles,
      cost.description,
      `spend-${featureKey}`
    );

    await db.insert(SPEND_TABLE, {
      user_id: userId,
      feature_key: featureKey,
      miles_cost: cost.miles,
      transaction_reference: `spend-${featureKey}`,
      status: 'completed',
      created_at: new Date().toISOString(),
    });

    return {
      success: true,
      transaction: result.transaction,
      balance: result.balance,
    };
  } catch (err: any) {
    if (err.code === 'INSUFFICIENT_MILES') {
      return {
        success: false,
        error: {
          code: 'INSUFFICIENT_MILES',
          message: err.message,
          balance: err.balance,
          deficit: err.deficit,
          tier: cost.tier,
          upgradeUrl: '/pricing',
        },
      };
    }
    throw err;
  }
}

export async function refundSpend(
  userId: string,
  featureKey: string,
  referenceId: string
): Promise<SpendResult> {
  const cost = FEATURE_COST_MAP[featureKey];
  if (!cost) {
    return {
      success: false,
      error: {
        code: 'UNKNOWN_FEATURE',
        message: `Unknown feature: ${featureKey}`,
      },
    };
  }

  const original = await db.selectOne('miles_ledger', {
    column: 'reference',
    value: referenceId,
    select: 'id, transaction_type, amount',
  });

  if (!original) {
    return {
      success: false,
      error: {
        code: 'REFERENCE_NOT_FOUND',
        message: `Original transaction not found: ${referenceId}`,
      },
    };
  }

  const { refundMiles } = await import('./milesLedger.js');
  const refundResult = await refundMiles(userId, cost.miles, referenceId);

  await db.insert(SPEND_TABLE, {
    user_id: userId,
    feature_key: featureKey,
    miles_cost: cost.miles,
    transaction_reference: `refund-${referenceId}`,
    status: 'refunded',
    created_at: new Date().toISOString(),
  });

  return {
    success: true,
    transaction: refundResult.transaction,
    balance: refundResult.balance,
  };
}

export async function getSpendingHistory(
  userId: string,
  limit: number = 20
): Promise<any[]> {
  const rows = await db.selectMany(SPEND_TABLE, {
    where: [
      { column: 'user_id', value: userId },
      { column: 'status', value: 'completed' },
    ],
    orderBy: { column: 'created_at', ascending: false },
    limit,
  });

  return rows || [];
}