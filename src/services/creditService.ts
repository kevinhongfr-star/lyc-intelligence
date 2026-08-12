import { getSupabase } from './supabaseApi';
import { useAuthStore } from '../stores/authStore';

/**
 * ⚠️ DEPRECATED — Phase 15.5 / ticket #1303
 * ─────────────────────────────────────────────────────────────────────────────
 * This service is the LEGACY credits bridge layer. It talks to the backend
 * `credits` and `credit_transactions` tables and the legacy `/api/credits/*`
 * endpoints. The backend still uses "credits" internally as the table column
 * and API path names — that is a deeper migration that is out of scope for
 * the Phase 15.5 frontend alignment work.
 *
 * For all PRICING and TIER constants, use `@/services/monetizationService.ts`
 * (CANONICAL_TIER_PRICING, CANONICAL_ASSESSMENT_PRICING, etc.) — that is the
 * single source of truth.
 *
 * This file is preserved because:
 *   1. The Supabase tables `credits` and `credit_transactions` are still the
 *      physical store for the miles balance (the `balance` column IS the
 *      miles balance — only the label changed in the UI).
 *   2. The legacy API paths `/api/credits/spend`, `/api/credits/earn`,
 *      `/api/credits/daily-reset` are still served by the backend and have
 *      not been renamed.
 *   3. The `tier` column on `credits` holds legacy tier strings ('free',
 *      'basic', 'pro', 'council') that map to the canonical 5-tier model
 *      via the `mapToCanonicalTier` helpers used across the UI.
 *
 * Implied database schema (no SQL files in repo — schema is managed externally):
 *   credits
 *     ├── user_id        uuid  (fk auth.users, pk)
 *     ├── balance        int   (miles balance — labelled "miles" in UI)
 *     ├── daily_balance  int
 *     ├── total_earned   int
 *     ├── total_spent    int
 *     ├── tier           text  ('free' | 'basic' | 'pro' | 'council')
 *     ├── tier_credits_per_month  int
 *     ├── billing_period_start    timestamptz
 *     └── updated_at     timestamptz
 *   credit_transactions
 *     ├── id             uuid  (pk)
 *     ├── user_id        uuid  (fk auth.users)
 *     ├── amount         int   (signed: + earns / - spends)
 *     ├── transaction_type  text
 *     ├── description    text
 *     ├── reference_id   text
 *     ├── metadata       jsonb
 *     └── created_at     timestamptz
 *
 * RLS: assumed enabled on both tables with `user_id = auth.uid()` policies.
 * No new tables were introduced in Phase 15.5 — frontend-only alignment.
 *
 * Future migration (out of scope): rename `credits` → `miles_balances`,
 * `credit_transactions` → `miles_transactions`, and the `/api/credits/*`
 * endpoints → `/api/miles/*`. Requires a coordinated backend + DB migration.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface CreditInfo {
  balance: number;
  dailyBalance: number;
  totalEarned: number;
  totalSpent: number;
  tier: string;
  tierCreditsPerMonth: number;
  billingPeriodStart: string | null;
}

export interface CreditTransaction {
  id: string;
  amount: number;
  transactionType: string;
  description: string | null;
  createdAt: string;
}

export const CREDIT_EARNING_ACTIONS = {
  email_verification: 5,
  profile_completion: 10,
  assessment_completed: 5,
  cv_upload: 5,
  streak_7_days: 15,
  streak_30_days: 50,
  referral_signup: 10,
  referral_upgrade: 25,
  assessment_share: 3
} as const;

export const TIER_CREDITS = {
  explorer: 0,
  starter: 50,
  pro: 200,
  executive: 300,
  council: 999999
} as const;

export async function getCreditBalance(userId: string): Promise<CreditInfo | null> {
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('credits')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      balance: data.balance,
      dailyBalance: data.daily_balance,
      totalEarned: data.total_earned,
      totalSpent: data.total_spent,
      tier: data.tier || 'explorer',
      tierCreditsPerMonth: data.tier_credits_per_month || 0,
      billingPeriodStart: data.billing_period_start
    };
  } catch (e) {
    console.error('[CreditService] getCreditBalance error:', e);
    return null;
  }
}

export async function spendCredits(
  userId: string, 
  amount: number, 
  action: string,
  referenceId?: string
): Promise<{ success: boolean; newBalance: number }> {
  try {
    const response = await fetch('/api/credits/spend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount, action, referenceId })
    });

    const data = await response.json();
    return data;
  } catch (e) {
    console.error('[CreditService] spendCredits error:', e);
    return { success: false, newBalance: 0 };
  }
}

export async function earnCredits(
  userId: string,
  amount: number,
  action: keyof typeof CREDIT_EARNING_ACTIONS,
  referenceId?: string
): Promise<boolean> {
  try {
    const response = await fetch('/api/credits/earn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount, action, referenceId })
    });

    const data = await response.json();
    return data.success;
  } catch (e) {
    console.error('[CreditService] earnCredits error:', e);
    return false;
  }
}

export async function getTransactionHistory(
  userId: string,
  limit: number = 20
): Promise<CreditTransaction[]> {
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) {
      return [];
    }

    return data.map((t: any) => ({
      id: t.id,
      amount: t.amount,
      transactionType: t.transaction_type,
      description: t.description,
      createdAt: t.created_at
    }));
  } catch (e) {
    console.error('[CreditService] getTransactionHistory error:', e);
    return [];
  }
}

export function getLowCreditWarning(balance: number, tier: string): boolean {
  if (tier !== 'explorer') return false;
  return balance <= 5;
}

export function getInsufficientCreditsMessage(
  required: number, 
  available: number
): string {
  return `This action requires ${required} miles, but you only have ${available}. Upgrade to continue.`;
}

export async function updateUserTier(
  userId: string, 
  tier: string
): Promise<boolean> {
  try {
    const response = await fetch('/api/stripe/update-tier', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, tier })
    });

    const data = await response.json();
    return data.success;
  } catch (e) {
    console.error('[CreditService] updateUserTier error:', e);
    return false;
  }
}

export async function checkAndGrantDailyCredits(userId: string): Promise<number> {
  try {
    const response = await fetch('/api/credits/daily-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });

    const data = await response.json();
    return data.creditsGranted || 0;
  } catch (e) {
    console.error('[CreditService] checkAndGrantDailyCredits error:', e);
    return 0;
  }
}

export function formatTransactionDescription(type: string, amount: number): string {
  const prefix = amount > 0 ? '+' : '';
  const descriptions: Record<string, string> = {
    earn_daily: `${prefix}${amount} Daily login bonus`,
    earn_referral: `${prefix}${amount} Referral bonus`,
    earn_action: `${prefix}${amount} Action completed`,
    earn_purchase: `${prefix}${amount} Miles purchased`,
    spend_assessment: `${amount} Assessment`,
    spend_match: `${amount} Match Analysis match`,
    spend_pdf: `${amount} PDF report`,
    spend_document: `${amount} Document upload`,
    spend_linkedin: `${amount} LinkedIn audit`,
    bonus: `${prefix}${amount} Bonus`,
    refund: `${prefix}${amount} Refund`,
    tier_grant: `${prefix}${amount} Tier grant`
  };
  return descriptions[type] || `${prefix}${amount} ${type}`;
}

export interface MilesInfo {
  miles: number;
  tier: string;
}

export interface MilesTransaction {
  id: string;
  amount: number;
  transactionType: string;
  description: string | null;
  createdAt: string;
}

export async function milesBalance(userId?: string): Promise<MilesInfo> {
  const effectiveUserId = userId || useAuthStore.getState().user?.id;
  if (!effectiveUserId) {
    return { miles: 0, tier: 'explorer' };
  }
  const info = await getCreditBalance(effectiveUserId);
  return {
    miles: info?.balance ?? 0,
    tier: info?.tier ?? 'explorer'
  };
}

export async function deductMiles(
  amount: number,
  reason: string,
  meta?: Record<string, unknown>
): Promise<{ success: boolean; newBalance: number }> {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) {
    return { success: false, newBalance: 0 };
  }
  const milesReason = reason.replace(/credits?/gi, 'miles').replace(/Credit/g, 'Miles');
  const action = meta?.referenceId
    ? `${milesReason}_${meta.referenceId}`
    : milesReason;
  const description = meta?.description
    ? String(meta.description).replace(/credits?/gi, 'miles').replace(/Credit/g, 'Miles')
    : `${amount} miles · ${milesReason}`;

  const result = await spendCredits(userId, amount, action);

  try {
    const sb = getSupabase();
    await sb.from('credit_transactions').insert({
      user_id: userId,
      amount: -amount,
      transaction_type: 'spend_miles',
      description,
      reference_id: meta?.referenceId || null,
      metadata: meta || null,
    });
  } catch (e) {
    console.warn('[Miles] Could not insert miles-labeled transaction:', e);
  }

  return result;
}

export async function refundMiles(
  amount: number,
  reason: string,
  meta?: Record<string, unknown>
): Promise<boolean> {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) return false;

  const milesReason = reason.replace(/credits?/gi, 'miles').replace(/Credit/g, 'Miles');
  const description = meta?.description
    ? String(meta.description).replace(/credits?/gi, 'miles').replace(/Credit/g, 'Miles')
    : `Refund ${amount} miles · ${milesReason}`;

  try {
    const info = await getCreditBalance(userId);
    const currentBalance = info?.balance ?? 0;
    const newBalance = currentBalance + amount;

    const sb = getSupabase();
    await sb
      .from('credits')
      .update({
        balance: newBalance,
        total_spent: Math.max(0, (info?.totalSpent ?? 0) - amount),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    await sb.from('credit_transactions').insert({
      user_id: userId,
      amount,
      transaction_type: 'refund_miles',
      description,
      reference_id: meta?.referenceId || null,
      metadata: meta || null,
    });

    return true;
  } catch (e) {
    console.error('[Miles] refundMiles error:', e);
    return false;
  }
}

export async function milesLedger(userId?: string, limit: number = 20): Promise<MilesTransaction[]> {
  const effectiveUserId = userId || useAuthStore.getState().user?.id;
  if (!effectiveUserId) return [];

  const txs = await getTransactionHistory(effectiveUserId, limit);
  return txs.map((t) => ({
    id: t.id,
    amount: t.amount,
    transactionType: t.transactionType
      .replace(/credit/gi, 'miles')
      .replace(/Credit/g, 'Miles'),
    description: t.description
      ? t.description.replace(/credits?/gi, (m) => (m[0] === m[0].toUpperCase() ? 'Miles' : 'miles'))
      : null,
    createdAt: t.createdAt,
  }));
}
