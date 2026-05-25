import { getSupabase } from './supabaseApi';
import { useAuthStore } from '../stores/authStore';

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
  free: 0,
  basic: 50,
  pro: 200,
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
      tier: data.tier || 'free',
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
  if (tier !== 'free') return false;
  return balance <= 5;
}

export function getInsufficientCreditsMessage(
  required: number, 
  available: number
): string {
  return `This action requires ${required} credits, but you only have ${available}. Upgrade to continue.`;
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
    earn_purchase: `${prefix}${amount} Credits purchased`,
    spend_assessment: `${amount} Assessment`,
    spend_match: `${amount} TRIDENT match`,
    spend_pdf: `${amount} PDF report`,
    spend_document: `${amount} Document upload`,
    spend_linkedin: `${amount} LinkedIn audit`,
    bonus: `${prefix}${amount} Bonus`,
    refund: `${prefix}${amount} Refund`,
    tier_grant: `${prefix}${amount} Tier grant`
  };
  return descriptions[type] || `${prefix}${amount} ${type}`;
}
