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
