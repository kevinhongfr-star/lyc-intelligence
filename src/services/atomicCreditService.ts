/**
 * Atomic Credit Service
 * 
 * Consolidated credit operations with:
 * - Database-level locking (SELECT FOR UPDATE)
 * - Atomic balance updates via stored procedures
 * - Single source of truth (v2_credit_transactions)
 */

import { createClient } from '@supabase/supabase-js';
import type { CreditTier } from '@/types/auth';

export type CreditType = 'dex_credits' | 'council_credits';
export type TransactionType = 
  | 'purchase'
  | 'grant'
  | 'consumption'
  | 'refund'
  | 'expiry'
  | 'adjustment'
  | 'transfer'
  | 'daily_reset';

export interface CreditBalance {
  user_id: string;
  dex_credits: number;
  council_credits: number;
  tier: CreditTier;
  updated_at: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  organization_id?: string;
  credit_type: CreditType;
  transaction_type: TransactionType;
  amount: number;
  balance_after: number;
  reference_id?: string;
  reference_type?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

/**
 * Server-side credit operations (requires service role key)
 */
export class AtomicCreditService {
  private supabase;

  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });
  }

  /**
   * Get current credit balance for a user
   */
  async getBalance(userId: string): Promise<CreditBalance> {
    const { data, error } = await this.supabase
      .rpc('get_user_credit_balance', { p_user_id: userId });

    if (error) throw error;

    return {
      user_id: userId,
      dex_credits: data?.dex_credits ?? 0,
      council_credits: data?.council_credits ?? 0,
      tier: data?.tier ?? 'free',
      updated_at: data?.updated_at ?? new Date().toISOString(),
    };
  }

  /**
   * Atomically deduct credits from a user's balance
   * Returns the new balance or throws if insufficient credits
   */
  async deduct(
    userId: string,
    amount: number,
    creditType: CreditType,
    options: {
      organizationId?: string;
      referenceId?: string;
      referenceType?: string;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<CreditTransaction> {
    const { data, error } = await this.supabase.rpc('atomic_deduct_credits', {
      p_user_id: userId,
      p_amount: amount,
      p_credit_type: creditType,
      p_organization_id: options.organizationId,
      p_reference_id: options.referenceId,
      p_reference_type: options.referenceType,
      p_metadata: options.metadata,
    });

    if (error) {
      if (error.message.includes('Insufficient credits')) {
        throw new Error('INSUFFICIENT_CREDITS');
      }
      throw error;
    }

    return data;
  }

  /**
   * Atomically add credits to a user's balance
   */
  async credit(
    userId: string,
    amount: number,
    creditType: CreditType,
    transactionType: TransactionType,
    options: {
      organizationId?: string;
      referenceId?: string;
      referenceType?: string;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<CreditTransaction> {
    const { data, error } = await this.supabase.rpc('atomic_add_credits', {
      p_user_id: userId,
      p_amount: amount,
      p_credit_type: creditType,
      p_transaction_type: transactionType,
      p_organization_id: options.organizationId,
      p_reference_id: options.referenceId,
      p_reference_type: options.referenceType,
      p_metadata: options.metadata,
    });

    if (error) throw error;

    return data;
  }

  /**
   * Transfer credits between users (requires admin)
   */
  async transfer(
    fromUserId: string,
    toUserId: string,
    amount: number,
    creditType: CreditType,
    options: {
      organizationId?: string;
      referenceId?: string;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<{ deduction: CreditTransaction; addition: CreditTransaction }> {
    const { data, error } = await this.supabase.rpc('atomic_transfer_credits', {
      p_from_user_id: fromUserId,
      p_to_user_id: toUserId,
      p_amount: amount,
      p_credit_type: creditType,
      p_organization_id: options.organizationId,
      p_reference_id: options.referenceId,
      p_metadata: options.metadata,
    });

    if (error) throw error;

    return data;
  }

  /**
   * Get transaction history for a user
   */
  async getTransactions(
    userId: string,
    options: {
      creditType?: CreditType;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<CreditTransaction[]> {
    let query = this.supabase
      .from('v2_credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options.creditType) {
      query = query.eq('credit_type', options.creditType);
    }

    const { data, error } = await query
      .limit(options.limit ?? 50)
      .range(options.offset ?? 0, (options.offset ?? 0) + (options.limit ?? 50) - 1);

    if (error) throw error;

    return data || [];
  }

  /**
   * Daily credit reset (called by cron)
   */
  async dailyReset(tierLimits: Record<CreditTier, number>): Promise<{ processed: number; errors: string[] }> {
    const { data, error } = await this.supabase.rpc('daily_credit_reset', {
      p_tier_limits: tierLimits,
    });

    if (error) throw error;

    return data || { processed: 0, errors: [] };
  }

  /**
   * Check if user has sufficient credits
   */
  async hasCredits(userId: string, amount: number, creditType: CreditType): Promise<boolean> {
    const balance = await this.getBalance(userId);
    return balance[creditType] >= amount;
  }
}

/**
 * Client-side credit service (uses user's session)
 */
export class ClientCreditService {
  private supabase;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  async getBalance(): Promise<CreditBalance | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await this.supabase
      .from('credits')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      // Try v2 view
      const { data: v2Data } = await this.supabase
        .rpc('get_user_credit_balance', { p_user_id: user.id });
      
      if (v2Data) {
        return {
          user_id: user.id,
          dex_credits: v2Data.dex_credits ?? 0,
          council_credits: v2Data.council_credits ?? 0,
          tier: v2Data.tier ?? 'free',
          updated_at: v2Data.updated_at ?? new Date().toISOString(),
        };
      }
      return null;
    }

    return {
      user_id: user.id,
      dex_credits: data?.balance ?? 0,
      council_credits: data?.balance ?? 0, // Unified for now
      tier: data?.tier ?? 'free',
      updated_at: data?.updated_at ?? new Date().toISOString(),
    };
  }

  async getTransactions(limit = 20): Promise<CreditTransaction[]> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return [];

    const { data } = await this.supabase
      .from('v2_credit_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    return data || [];
  }
}

// Export singleton factory
let creditServiceInstance: AtomicCreditService | null = null;

export function getCreditService(): AtomicCreditService {
  if (!creditServiceInstance) {
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (!url || !key) {
      throw new Error('Credit service requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    }
    creditServiceInstance = new AtomicCreditService(url, key);
  }
  return creditServiceInstance;
}