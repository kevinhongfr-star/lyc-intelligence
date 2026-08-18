import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@/services/supabaseApi';
import { useAuthStore } from '@/stores/authStore';

export type CreditTier = 'free' | 'basic' | 'pro' | 'enterprise';

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

const CreditLimits: Record<CreditTier, { daily: number; monthly: number }> = {
  free: { daily: 5, monthly: 0 },
  basic: { daily: 0, monthly: 20 },
  pro: { daily: 0, monthly: 50 },
  enterprise: { daily: 0, monthly: Infinity },
};

const defaultCredit: CreditInfo = {
  balance: 5,
  tier: 'free',
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
        const { data: newData, error: insertError } = await supabase
          .from('credits')
          .insert({ user_id: effectiveUserId, balance: 5, tier: 'free', total_earned: 5, total_spent: 0 })
          .select()
          .single();

        if (insertError) throw insertError;
        setCredit({
          balance: newData.balance,
          tier: newData.tier as CreditTier,
          totalEarned: newData.total_earned,
          totalSpent: newData.total_spent,
          isLoading: false,
        });
      } else {
        const limits = CreditLimits[data.tier as CreditTier] || CreditLimits.free;
        let balance = data.balance;

        if (data.tier === 'free' && balance < 5) {
          balance = 5;
          await supabase
            .from('credits')
            .update({ balance: 5, updated_at: new Date().toISOString() })
            .eq('user_id', effectiveUserId);
        }

        setCredit({
          balance,
          tier: data.tier as CreditTier,
          totalEarned: data.total_earned,
          totalSpent: data.total_spent,
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

      await supabase
        .from('credits')
        .update({
          balance: newBalance,
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

      await supabase
        .from('credits')
        .update({
          balance: newBalance,
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
      tier: 'free' as CreditTier,
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
