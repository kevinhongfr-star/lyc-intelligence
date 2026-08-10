import { v1Client } from '@/hooks/v1/v1Client';

export interface Tier {
  key: 'explorer' | 'starter' | 'pro' | 'executive' | 'council';
  name: string;
  priceMonthly: number;
  priceAnnual: number;
  features: string[];
}

export interface MilesBalance {
  balance: number;
  total_earned: number;
  total_spent: number;
}

export interface MilesHistoryEntry {
  id: string;
  transaction_type: string;
  amount: number;
  description: string;
  created_at: string;
}

export interface MilesEarningProgress {
  event_type: string;
  total_earned: number;
  count: number;
  last_earned_at: string | null;
}

export interface SubscriptionStatus {
  status: string;
  tier: string;
  subscriptionId: string | null;
  currentPeriodEnd: number | null;
  cancelAtPeriodEnd: boolean;
}

export interface Invoice {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  hosted_invoice_url: string | null;
  pdf_url: string | null;
}

export interface CheckoutSession {
  url: string;
  sessionId: string;
}

export type BillingCycle = 'monthly' | 'annual';

export const TIER_KEYS = ['explorer', 'starter', 'pro', 'executive', 'council'] as const;
export type TierKey = typeof TIER_KEYS[number];

export async function fetchTiers(): Promise<Tier[]> {
  return v1Client.get<Tier[]>('/billing/tiers');
}

export async function fetchMilesBalance(): Promise<MilesBalance> {
  return v1Client.get<MilesBalance>('/billing/miles/balance');
}

export async function fetchMilesHistory(limit: number = 20): Promise<MilesHistoryEntry[]> {
  return v1Client.get<MilesHistoryEntry[]>('/billing/miles/history', {
    params: { limit },
  });
}

export async function fetchMilesEarningProgress(): Promise<MilesEarningProgress[]> {
  return v1Client.get<MilesEarningProgress[]>('/billing/miles/progress');
}

export async function purchaseMiles(featureKey: string): Promise<{
  transaction_id: string;
  new_balance: number;
}> {
  return v1Client.post('/billing/miles/purchase', { feature_key: featureKey });
}

export async function fetchSubscriptionStatus(): Promise<SubscriptionStatus> {
  return v1Client.get<SubscriptionStatus>('/billing/subscription/status');
}

export async function createCheckoutSession(
  tier: TierKey,
  cycle: BillingCycle = 'monthly'
): Promise<CheckoutSession> {
  return v1Client.post('/billing/checkout', { tier, cycle });
}

export async function cancelSubscription(): Promise<{ canceled: boolean }> {
  return v1Client.post('/billing/subscription/cancel');
}

export async function fetchInvoices(): Promise<Invoice[]> {
  return v1Client.get<Invoice[]>('/billing/invoices');
}

export async function upgradeSubscription(
  tier: TierKey
): Promise<{ upgraded: boolean }> {
  return v1Client.post('/billing/subscription/upgrade', { tier });
}

export const ASSESSMENT_MILES_COSTS: Record<string, number> = {
  LEAP: 3,
  QUEST: 3,
  DRIVE: 3,
  COACH: 3,
  IMPACT: 5,
  FORGE: 3,
  BRIDGE: 3,
  MOSAIC: 3,
  CPI: 5,
  PRISM: 3,
  SPARK: 3,
};

export async function spendAssessmentMiles(
  instrumentKey: string,
  opts?: { referenceId?: string; userId?: string }
): Promise<{ success: boolean; newBalance: number; milesUsed: number }> {
  const milesUsed = ASSESSMENT_MILES_COSTS[instrumentKey] ?? 3;
  try {
    const result = (await v1Client.post('/billing/miles/spend', {
      feature_key: `assessment_${instrumentKey.toLowerCase()}`,
      amount: milesUsed,
      description: `${instrumentKey} Assessment — ${milesUsed} mi`,
      reference_id: opts?.referenceId,
      user_id: opts?.userId,
    })) as unknown as { new_balance?: number; data?: { new_balance?: number } };
    const nb = typeof result === "object" && result
      ? (typeof result.new_balance === "number" ? result.new_balance : (result.data && typeof result.data.new_balance === "number" ? result.data.new_balance : undefined))
      : undefined;
    return {
      success: true,
      newBalance: nb ?? 0,
      milesUsed,
    };
  } catch (e) {
    console.error('[Monetization] spendAssessmentMiles error:', e);
    return { success: false, newBalance: 0, milesUsed };
  }
}

export async function refundAssessmentMiles(
  instrumentKey: string,
  opts?: { referenceId?: string; reason?: string; userId?: string }
): Promise<{ success: boolean; milesRefunded: number }> {
  const milesRefunded = ASSESSMENT_MILES_COSTS[instrumentKey] ?? 3;
  try {
    await v1Client.post('/billing/miles/refund', {
      feature_key: `assessment_${instrumentKey.toLowerCase()}`,
      amount: milesRefunded,
      description: `Refund ${milesRefunded} mi — ${instrumentKey} Assessment${opts?.reason ? ` · ${opts.reason}` : ''}`,
      reference_id: opts?.referenceId,
      user_id: opts?.userId,
    });
    return { success: true, milesRefunded };
  } catch (e) {
    console.error('[Monetization] refundAssessmentMiles error:', e);
    return { success: false, milesRefunded };
  }
}
