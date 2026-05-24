import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@/services/supabaseApi';

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
  const [credit, setCredit] = useState<CreditInfo>(defaultCredit);

  const refreshCredits = useCallback(async () => {
    if (!userId) {
      setCredit({ ...defaultCredit, isLoading: false });
      return;
    }

    setCredit(prev => ({ ...prev, isLoading: true }));

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('credits')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        const { data: newData, error: insertError } = await supabase
          .from('credits')
          .insert({ user_id: userId, balance: 5, tier: 'free', total_earned: 5, total_spent: 0 })
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
            .eq('user_id', userId);
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
  }, [userId]);

  const deductCredit = async (amount: number, description: string): Promise<boolean> => {
    if (!userId || credit.balance < amount) return false;

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
        .eq('user_id', userId);

      await supabase.from('credit_transactions').insert({
        user_id: userId,
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
    };
  }
  return context;
}
