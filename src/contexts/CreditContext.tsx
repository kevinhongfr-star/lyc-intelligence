import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@/services/supabaseApi';
import { useAuthStore } from '@/stores/authStore';

// #1318 + #1320: Canonical CreditTier.
// The DB column may still contain legacy values ('free', 'member', 'council') from
// older migrations, so the type accepts all of them. But all NEW inserts use
// 'executive_introduction' and we normalise legacy values on read.
export type CreditTier =
  | 'executive_introduction'
  | 'basic'
  | 'pro'
  | 'enterprise'
  // legacy aliases — still readable from the DB:
  | 'free'
  | 'member'
  | 'council';

export interface CreditInfo {
  balance: number;
  tier: CreditTier;
  totalEarned: number;
  totalSpent: number;
  isLoading: boolean;
}

interface CreditContextType {
  credit: CreditInfo;
  refreshCredits: () => Promise<void>;
  deductCredit: (amount: number, description: string) => Promise<boolean>;
  hasCredits: (amount?: number) => boolean;
  tier: CreditTier;
  miles: number;
  deductMiles: (amount: number, description: string) => Promise<boolean>;
  refundMiles: (amount: number, description: string) => Promise<boolean>;
  hasMiles: (amount?: number) => boolean;
}

/**
 * #1318: Aligned with CANONICAL_TIER_PRICING monthly miles allowances
 *        (monetizationService.ts):
 *   explorer / executive_introduction → monthly: 0 (chat-only, complimentary intro)
 *   basic    (Starter)                 → monthly: 50
 *   pro      (Pro)                     → monthly: 150
 *   enterprise (Executive + Council)   → monthly: 300 Executive, 600 Council
 *
 * Infinity is no longer used — Council has a concrete 600 mi/mo allowance.
 * 'council' is treated as enterprise (same 600 mi).
 */
const CreditLimits: Record<CreditTier, { daily: number; monthly: number }> = {
  executive_introduction: { daily: 5, monthly: 0 },
  free:                     { daily: 5, monthly: 0 }, // legacy alias
  member:                   { daily: 5, monthly: 0 }, // legacy alias
  basic:                    { daily: 0, monthly: 50 },
  pro:                      { daily: 0, monthly: 150 },
  enterprise:               { daily: 0, monthly: 600 },
  council:                  { daily: 0, monthly: 600 }, // legacy alias for enterprise
};

/** Map any legacy tier string from the DB to a canonical CreditTier limit key. */
function resolveLimitKey(tier: string | null | undefined): keyof typeof CreditLimits {
  if (!tier) return 'executive_introduction';
  const t = String(tier);
  if (t in CreditLimits) return t as keyof typeof CreditLimits;
  if (t === 'explorer') return 'executive_introduction';
  if (t === 'starter') return 'basic';
  if (t === 'executive') return 'enterprise';
  return 'executive_introduction';
}

/** True when the given tier string maps to the complimentary Explorer tier. */
export function isExecutiveIntroTier(tier: string | null | undefined): boolean {
  const key = resolveLimitKey(tier);
  return key === 'executive_introduction' || key === 'free' || key === 'member';
}

const defaultCredit: CreditInfo = {
  balance: 5,
  tier: 'executive_introduction',
  totalEarned: 5,
  totalSpent: 0,
  isLoading: true,
};

const CreditContext = createContext<CreditContextType | undefined>(undefined);

export function CreditProvider({ children, userId }: { children: React.ReactNode; userId?: string }) {
  // Fall back to the authenticated user's id so the credit system works app-wide
  // without every call site needing to pass userId explicitly.
  const authUserId = useAuthStore(s => s.user?.id);
  const effectiveUserId = userId ?? authUserId;
  const [credit, setCredit] = useState<CreditInfo>(defaultCredit);

  const refreshCredits = useCallback(async () => {
    if (!effectiveUserId) {
      setCredit({ ...defaultCredit, isLoading: false });
      return;
    }

    setCredit(prev => ({ ...prev, isLoading: true }));

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('credits')
        .select('*')
        .eq('user_id', effectiveUserId)
        .single();

      if (error || !data) {
        // #1316: column = miles, not balance.
        // #1320: default tier = executive_introduction, never "free".
        const { data: newData, error: insertError } = await supabase
          .from('credits')
          .insert({
            user_id: effectiveUserId,
            miles: 5,
            tier: 'executive_introduction',
            total_earned: 5,
            total_spent: 0,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setCredit({
          balance: newData.miles,
          tier: (newData.tier as CreditTier) ?? 'executive_introduction',
          totalEarned: newData.total_earned,
          totalSpent: newData.total_spent,
          isLoading: false,
        });
      } else {
        const limitKey = resolveLimitKey(data.tier);
        const limits = CreditLimits[limitKey];
        // #1316: read from miles column (not balance)
        let milesVal = Number(data.miles ?? data.balance ?? 0);

        // Complimentary tier always keeps a 5-mi floor so users can try DEX.
        if (isExecutiveIntroTier(data.tier) && milesVal < 5) {
          milesVal = 5;
          await supabase
            .from('credits')
            .update({ miles: 5, updated_at: new Date().toISOString() })
            .eq('user_id', effectiveUserId);
        }

        setCredit({
          balance: milesVal,
          tier: (data.tier as CreditTier) ?? 'executive_introduction',
          totalEarned: data.total_earned ?? 0,
          totalSpent: data.total_spent ?? 0,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('[CreditContext] Error:', error);
      setCredit({ ...defaultCredit, isLoading: false });
    }
  }, [effectiveUserId]);

  const deductCredit = async (amount: number, description: string): Promise<boolean> => {
    if (!effectiveUserId || credit.balance < amount) return false;

    try {
      const supabase = getSupabase();
      const newBalance = credit.balance - amount;

      // #1316: write miles column
      await supabase
        .from('credits')
        .update({
          miles: newBalance,
          total_spent: credit.totalSpent + amount,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', effectiveUserId);

      await supabase.from('credit_transactions').insert({
        user_id: effectiveUserId,
        amount: -amount,
        type: 'spend',
        description,
      });

      setCredit(prev => ({
        ...prev,
        balance: newBalance,
        totalSpent: prev.totalSpent + amount,
      }));

      return true;
    } catch (error) {
      console.error('[CreditContext] Deduct error:', error);
      return false;
    }
  };

  const hasCredits = (amount: number = 1): boolean => {
    return credit.balance >= amount;
  };

  const deductMiles = async (amount: number, description: string): Promise<boolean> => {
    return deductCredit(amount, description.replace(/credits?/gi, 'miles').replace(/Credit/g, 'Miles'));
  };

  const refundMiles = async (amount: number, description: string): Promise<boolean> => {
    if (!effectiveUserId) return false;
    try {
      const supabase = getSupabase();
      const newBalance = credit.balance + amount;

      // #1316: write miles column
      await supabase
        .from('credits')
        .update({
          miles: newBalance,
          total_spent: Math.max(0, credit.totalSpent - amount),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', effectiveUserId);

      await supabase.from('credit_transactions').insert({
        user_id: effectiveUserId,
        amount,
        type: 'refund_miles',
        description: description.replace(/credits?/gi, 'miles').replace(/Credit/g, 'Miles'),
      });

      setCredit(prev => ({
        ...prev,
        balance: newBalance,
        totalSpent: Math.max(0, prev.totalSpent - amount),
      }));

      return true;
    } catch (error) {
      console.error('[CreditContext] Refund miles error:', error);
      return false;
    }
  };

  const hasMiles = (amount: number = 1): boolean => {
    return credit.balance >= amount;
  };

  useEffect(() => {
    refreshCredits();
  }, [refreshCredits]);

  return (
    <CreditContext.Provider
      value={{
        credit,
        refreshCredits,
        deductCredit,
        hasCredits,
        tier: credit.tier,
        miles: credit.balance,
        deductMiles,
        refundMiles,
        hasMiles,
      }}
    >
      {children}
    </CreditContext.Provider>
  );
}

export function useCredits() {
  const context = useContext(CreditContext);
  if (context === undefined) {
    return {
      credit: defaultCredit,
      refreshCredits: async () => {},
      deductCredit: async () => false,
      hasCredits: () => true,
      tier: 'executive_introduction' as CreditTier,
      miles: defaultCredit.balance,
      deductMiles: async () => false,
      refundMiles: async () => false,
      hasMiles: () => true,
    };
  }
  return context;
}

export const MilesProvider = CreditProvider;
export const useMiles = useCredits;
