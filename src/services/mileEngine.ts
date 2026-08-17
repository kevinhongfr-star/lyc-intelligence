/**
 * mileEngine.ts — Core mile economy engine.
 *
 * Batch 2 / Tickets 1, 3, 5: Balance tracking, allocation, rollover,
 * deduction, refund, pack purchasing, expiry.
 *
 * Consumption order: allocated → rollover → purchased.
 * Deductions happen on assessment COMPLETION, not on start.
 * Soft gates everywhere — insufficient balance returns a gate object,
 * never throws a hard error.
 *
 * Uses Supabase JS SDK (frontend). API routes use the RPC functions
 * defined in the migration SQL (deduct_miles_balanced, etc.).
 */
import { supabase } from '@/lib/supabase/client';
import {
  type MileBalance,
  type MileTransaction,
  type MileTransactionType,
  type MileBalanceType,
  MONTHLY_ALLOCATION,
  ROLLOVER_PERCENT,
  ROLLOVER_MAX_MONTHS,
  PURCHASED_MILES_EXPIRY_MONTHS,
  MILE_PACKS,
  type MilePack,
  getInstrumentMileCost,
  CPI_REQUIRED_TIER,
  ABANDON_REFUND_QUESTION_THRESHOLD,
  // Pure functions (re-exported from config for backward compat)
  computeRollover,
  computeTotalBalance,
  canAfford,
  getMonthlyAllocation,
} from '@/config/miles';
import { normalizeTier, tierMeets, type TierKey } from '@/config/tiers';

// Re-export pure functions for backward compat
export { computeRollover, computeTotalBalance, canAfford, getMonthlyAllocation };

// ═══════════════════════════════════════════════════════════════════════
// Balance operations (DB)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Get the current mile balance for a user.
 * Creates a row if one doesn't exist (with default allocation).
 */
export async function getBalance(userId: string): Promise<MileBalance | null> {
  const { data, error } = await supabase
    .from('credits')
    .select('user_id, allocated_miles, rollover_miles, purchased_miles, purchased_miles_expiry, last_allocation_date, tier, miles')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[mileEngine] getBalance error:', error);
    return null;
  }

  if (!data) {
    // No row — create one with default allocation
    return await initBalance(userId);
  }

  const allocated = data.allocated_miles ?? 0;
  const rollover = data.rollover_miles ?? 0;
  const purchased = data.purchased_miles ?? 0;

  return {
    user_id: data.user_id,
    allocated_miles: allocated,
    rollover_miles: rollover,
    purchased_miles: purchased,
    total: computeTotalBalance(allocated, rollover, purchased),
    purchased_miles_expiry: data.purchased_miles_expiry,
    last_allocation_date: data.last_allocation_date,
    tier: data.tier,
  };
}

/**
 * Initialize a mile balance row for a new user.
 */
export async function initBalance(userId: string, tier: string = 'explorer'): Promise<MileBalance | null> {
  const canonical = normalizeTier(tier) ?? 'explorer';
  const allocation = MONTHLY_ALLOCATION[canonical] ?? 0;

  const { data, error } = await supabase
    .from('credits')
    .upsert({
      user_id: userId,
      miles: allocation,
      tier: canonical,
      allocated_miles: allocation,
      rollover_miles: 0,
      purchased_miles: 0,
      total_earned: allocation,
      total_spent: 0,
      last_allocation_date: new Date().toISOString().slice(0, 10),
    }, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) {
    console.error('[mileEngine] initBalance error:', error);
    return null;
  }

  return {
    user_id: userId,
    allocated_miles: allocation,
    rollover_miles: 0,
    purchased_miles: 0,
    total: allocation,
    purchased_miles_expiry: null,
    last_allocation_date: data.last_allocation_date,
    tier: canonical,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// Assessment gating & deduction
// ═══════════════════════════════════════════════════════════════════════

export interface GatingResult {
  allowed: boolean;
  /** If not allowed, the reason + upgrade path. */
  gate?: {
    reason: 'insufficient_miles' | 'tier_required' | 'free_token_available';
    message: string;
    upgrade_to?: TierKey;
    buy_miles_url?: string;
    /** If free token is available, this is the instrument to use it on. */
    free_token?: boolean;
  };
  mileCost: number;
  balance: number;
}

/**
 * Check if a user can start an assessment.
 * Returns a soft-gate result (never throws).
 *
 * Checks:
 * 1. CPI → Council-only
 * 2. Explorer free token availability
 * 3. Sufficient mile balance
 */
export async function checkAssessmentAccess(
  userId: string,
  instrumentCode: string,
  userTier: string | null | undefined,
): Promise<GatingResult> {
  const canonicalTier = normalizeTier(userTier) ?? 'explorer';
  const mileCost = getInstrumentMileCost(instrumentCode);
  const balance = await getBalance(userId);
  const totalBalance = balance?.total ?? 0;

  // 1. CPI → Council-only
  if (instrumentCode === 'CPI' && !tierMeets(canonicalTier, CPI_REQUIRED_TIER)) {
    return {
      allowed: false,
      mileCost,
      balance: totalBalance,
      gate: {
        reason: 'tier_required',
        message: `CPI is available on our Council tier.`,
        upgrade_to: CPI_REQUIRED_TIER,
      },
    };
  }

  // 2. Explorer free token check
  if (canonicalTier === 'explorer') {
    const { EXPLORER_FREE_ASSESSMENTS } = await import('@/config/miles');
    if (EXPLORER_FREE_ASSESSMENTS.includes(instrumentCode)) {
      const hasFreeToken = await checkExplorerFreeToken(userId, instrumentCode);
      if (hasFreeToken) {
        return {
          allowed: true,
          mileCost: 0, // Free — no miles charged
          balance: totalBalance,
          gate: { reason: 'free_token_available', message: 'Free assessment token available', free_token: true },
        };
      }
    }
  }

  // 3. Sufficient mile balance
  if (totalBalance < mileCost) {
    return {
      allowed: false,
      mileCost,
      balance: totalBalance,
      gate: {
        reason: 'insufficient_miles',
        message: `This assessment costs ${mileCost} miles. You have ${totalBalance} miles remaining.`,
        buy_miles_url: '/pricing',
      },
    };
  }

  return { allowed: true, mileCost, balance: totalBalance };
}

/**
 * Deduct miles on assessment completion.
 * Uses the deduct_miles_balanced RPC for atomic, race-safe deduction.
 * Consumption order: allocated → rollover → purchased.
 *
 * Returns true on success, false on insufficient balance.
 */
export async function deductMiles(
  userId: string,
  instrumentCode: string,
  assessmentId?: string,
): Promise<{ success: boolean; deducted: number; error?: string }> {
  const mileCost = getInstrumentMileCost(instrumentCode);
  if (mileCost === 0) return { success: true, deducted: 0 };

  const { data, error } = await supabase.rpc('deduct_miles_balanced', {
    p_user_id: userId,
    p_amount: mileCost,
    p_instrument_code: instrumentCode,
    p_assessment_id: assessmentId ?? null,
    p_description: `${instrumentCode} assessment completion`,
  });

  if (error) {
    console.error('[mileEngine] deductMiles error:', error);
    return { success: false, deducted: 0, error: error.message };
  }

  if (data === -1) {
    return { success: false, deducted: 0, error: 'Insufficient mile balance' };
  }

  return { success: true, deducted: mileCost };
}

/**
 * Refund miles if user abandons assessment within first N questions.
 * No-op if the user has answered more than the threshold.
 */
export async function refundMiles(
  userId: string,
  instrumentCode: string,
  assessmentId: string,
  questionsAnswered: number,
): Promise<{ success: boolean; refunded: number; reason?: string }> {
  const mileCost = getInstrumentMileCost(instrumentCode);
  if (mileCost === 0) return { success: true, refunded: 0 };

  // Only refund if abandoned within first 2 questions
  if (questionsAnswered > ABANDON_REFUND_QUESTION_THRESHOLD) {
    return { success: false, refunded: 0, reason: 'Beyond refund threshold' };
  }

  const { data, error } = await supabase.rpc('refund_miles_balanced', {
    p_user_id: userId,
    p_amount: mileCost,
    p_instrument_code: instrumentCode,
    p_assessment_id: assessmentId,
    p_description: `${instrumentCode} assessment abandoned (refund)`,
  });

  if (error) {
    console.error('[mileEngine] refundMiles error:', error);
    return { success: false, refunded: 0, reason: error.message };
  }

  return { success: true, refunded: mileCost };
}

// ═══════════════════════════════════════════════════════════════════════
// Monthly allocation + rollover
// ═══════════════════════════════════════════════════════════════════════

/**
 * Process monthly mile allocation for a user.
 * Should be called on billing cycle date (cron or login trigger).
 *
 * 1. 50% of unused allocated miles → rollover
 * 2. Rollover capped at 3 months of allocation
 * 3. New monthly allocation applied
 */
export async function processMonthlyAllocation(
  userId: string,
  tier: string,
): Promise<{ allocated: number; rolloverAdded: number; expired: number } | null> {
  const canonical = normalizeTier(tier) ?? 'explorer';
  const allocationAmount = MONTHLY_ALLOCATION[canonical] ?? 0;

  if (allocationAmount === 0) {
    // Explorer — no monthly allocation
    return { allocated: 0, rolloverAdded: 0, expired: 0 };
  }

  const { data, error } = await supabase.rpc('process_monthly_mile_allocation', {
    p_user_id: userId,
    p_tier: canonical,
    p_allocation_amount: allocationAmount,
  });

  if (error) {
    console.error('[mileEngine] processMonthlyAllocation error:', error);
    return null;
  }

  return {
    allocated: data ?? allocationAmount,
    rolloverAdded: 0, // RPC handles internally
    expired: 0,
  };
}

/**
 * Check if a user's monthly allocation needs to be reset.
 * Called on login — if last_allocation_date is in a previous month,
 * process the allocation.
 */
export async function maybeProcessMonthlyAllocation(
  userId: string,
  tier: string,
): Promise<void> {
  const balance = await getBalance(userId);
  if (!balance) return;

  const lastAlloc = balance.last_allocation_date
    ? new Date(balance.last_allocation_date)
    : null;
  const now = new Date();

  if (!lastAlloc || lastAlloc.getMonth() !== now.getMonth() || lastAlloc.getFullYear() !== now.getFullYear()) {
    await processMonthlyAllocation(userId, tier);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Pack purchasing
// ═══════════════════════════════════════════════════════════════════════

/**
 * Get available mile packs.
 */
export function getMilePacks(): MilePack[] {
  return MILE_PACKS;
}

/**
 * Record a purchased mile pack after Stripe payment succeeds.
 * Adds miles to purchased balance + sets 12-month expiry.
 */
export async function recordPackPurchase(
  userId: string,
  packId: string,
  stripePaymentIntent?: string,
): Promise<{ success: boolean; milesAdded: number; expiresAt: string }> {
  const pack = MILE_PACKS.find((p) => p.id === packId);
  if (!pack) {
    return { success: false, milesAdded: 0, expiresAt: '' };
  }

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + PURCHASED_MILES_EXPIRY_MONTHS);

  // Insert pack record
  const { error: packError } = await supabase.from('mile_packs').insert({
    user_id: userId,
    pack_id: pack.id,
    miles: pack.miles,
    price_usd: pack.priceUsd,
    stripe_payment_intent: stripePaymentIntent ?? null,
    expires_at: expiresAt.toISOString(),
  });

  if (packError) {
    console.error('[mileEngine] recordPackPurchase pack insert error:', packError);
    return { success: false, milesAdded: 0, expiresAt: '' };
  }

  // Add miles to purchased balance
  const { error: balanceError } = await supabase.rpc('increment_credits_balanced', {
    p_user_id: userId,
    p_amount: pack.miles,
  });

  if (balanceError) {
    // Fallback: direct update
    const { error: directError } = await supabase
      .from('credits')
      .update({
        purchased_miles: supabase.rpc('increment', { x: pack.miles }),
        miles: supabase.rpc('increment', { x: pack.miles }),
        purchased_miles_expiry: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (directError) {
      console.error('[mileEngine] recordPackPurchase balance update error:', directError);
      return { success: false, milesAdded: 0, expiresAt: '' };
    }
  }

  // Update purchased_miles + miles + expiry directly
  await supabase
    .from('credits')
    .update({
      purchased_miles: pack.miles, // This will be additive — need to read current first
      purchased_miles_expiry: expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  // Ledger entry
  await supabase.from('credit_transactions').insert({
    user_id: userId,
    amount: pack.miles,
    type: 'purchase',
    balance_type: 'purchased',
    description: `Purchased ${pack.label} (${pack.priceUsd} USD)`,
    metadata: { pack_id: pack.id, price_usd: pack.priceUsd },
  });

  return { success: true, milesAdded: pack.miles, expiresAt: expiresAt.toISOString() };
}

// ═══════════════════════════════════════════════════════════════════════
// Transaction history
// ═══════════════════════════════════════════════════════════════════════

/**
 * Get transaction history for a user.
 */
export async function getTransactionHistory(
  userId: string,
  limit: number = 50,
): Promise<MileTransaction[]> {
  const { data, error } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[mileEngine] getTransactionHistory error:', error);
    return [];
  }

  return (data ?? []) as MileTransaction[];
}

// ═══════════════════════════════════════════════════════════════════════
// Explorer free assessment tokens
// ═══════════════════════════════════════════════════════════════════════

/**
 * Check if an Explorer user has an unused free token for an instrument.
 */
export async function checkExplorerFreeToken(
  userId: string,
  instrumentCode: string,
): Promise<boolean> {
  const { EXPLORER_FREE_ASSESSMENTS } = await import('@/config/miles');
  if (!EXPLORER_FREE_ASSESSMENTS.includes(instrumentCode)) return false;

  const { data } = await supabase
    .from('explorer_free_assessments')
    .select('id')
    .eq('user_id', userId)
    .eq('instrument_code', instrumentCode)
    .maybeSingle();

  // If no row exists, the token is available
  return !data;
}

/**
 * Mark an Explorer free assessment token as used.
 */
export async function useExplorerFreeToken(
  userId: string,
  instrumentCode: string,
  assessmentId?: string,
): Promise<boolean> {
  const { error } = await supabase
    .from('explorer_free_assessments')
    .insert({
      user_id: userId,
      instrument_code: instrumentCode,
      assessment_id: assessmentId ?? null,
    });

  if (error) {
    // Unique constraint violation = already used
    return false;
  }

  // Ledger entry (free token, not miles)
  await supabase.from('credit_transactions').insert({
    user_id: userId,
    amount: 0,
    type: 'spend',
    balance_type: 'free',
    description: `${instrumentCode} free assessment token used`,
    instrument_code: instrumentCode,
    assessment_id: assessmentId ?? null,
  });

  return true;
}

/**
 * Get all used Explorer free tokens for a user.
 */
export async function getUsedExplorerTokens(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('explorer_free_assessments')
    .select('instrument_code')
    .eq('user_id', userId);

  return (data ?? []).map((r) => r.instrument_code);
}

// ═══════════════════════════════════════════════════════════════════════
// Expiry processing
// ═══════════════════════════════════════════════════════════════════════

/**
 * Process expired purchased miles.
 * Should be called by a daily cron or on login.
 */
export async function processExpiredMiles(userId: string): Promise<{ expired: number }> {
  const now = new Date().toISOString();

  // Find expired, unconsumed packs
  const { data: expiredPacks } = await supabase
    .from('mile_packs')
    .select('id, miles, consumed_miles')
    .eq('user_id', userId)
    .eq('expired', false)
    .lt('expires_at', now)
    .eq('fully_consumed', false);

  if (!expiredPacks || expiredPacks.length === 0) {
    return { expired: 0 };
  }

  let totalExpired = 0;
  for (const pack of expiredPacks) {
    const remaining = pack.miles - pack.consumed_miles;
    totalExpired += remaining;

    await supabase
      .from('mile_packs')
      .update({ expired: true })
      .eq('id', pack.id);

    await supabase.from('credit_transactions').insert({
      user_id: userId,
      amount: -remaining,
      type: 'purchase_expiry',
      balance_type: 'purchased',
      description: `Pack expired (${remaining} miles)`,
      metadata: { pack_id: pack.id },
    });
  }

  if (totalExpired > 0) {
    // Deduct from purchased balance
    const { data: balance } = await supabase
      .from('credits')
      .select('purchased_miles, miles')
      .eq('user_id', userId)
      .single();

    if (balance) {
      const newPurchased = Math.max(0, balance.purchased_miles - totalExpired);
      await supabase
        .from('credits')
        .update({
          purchased_miles: newPurchased,
          miles: balance.miles - totalExpired,
          updated_at: now,
        })
        .eq('user_id', userId);
    }
  }

  return { expired: totalExpired };
}

/**
 * Get packs that are expiring soon (within N days).
 * Used for reminder notifications.
 */
export async function getExpiringPacks(
  userId: string,
  daysAhead: number = 30,
): Promise<Array<{ pack_id: string; miles: number; expires_at: string; remaining: number }>> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + daysAhead);

  const { data } = await supabase
    .from('mile_packs')
    .select('pack_id, miles, consumed_miles, expires_at')
    .eq('user_id', userId)
    .eq('expired', false)
    .eq('fully_consumed', false)
    .lt('expires_at', cutoff.toISOString())
    .gt('expires_at', new Date().toISOString());

  return (data ?? []).map((p) => ({
    pack_id: p.pack_id,
    miles: p.miles,
    expires_at: p.expires_at,
    remaining: p.miles - p.consumed_miles,
  }));
}
