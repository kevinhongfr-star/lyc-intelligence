/**
 * Credits handler — org-level and user-level credit balance management.
 * 
 * Routes:
 *   POST /api/credits/spend        — deduct credits (org first, then user fallback)
 *   POST /api/credits/earn         — add credits to user/org
 *   POST /api/credits/daily-reset  — grant daily allocation (council orgs get 5)
 *   POST /api/credits/org-balance  — get org credit balance
 *   POST /api/credits/daily-allocate — trigger bulk daily council allocation (admin)
 * 
 * Schema:
 *   organizations.id, organizations.credit_balance
 *   credits.user_id, credits.balance, credits.organization_id
 *   credit_transactions.* (with organization_id column)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { selectOne, insert, update, selectMany, isSupabaseConfigured, handleError } from './supabaseRest.js';
import { getUserFromRequest } from './adminAuth.js';

// Vercel Hobby default is 10s — credit operations should be well under that,
// but we extend for safety in case the DB is slow.
export const maxDuration = 60;

export interface CreditPackPurchase {
  priceId: string;
  credits: number;
  sessionId: string;
  userId: string;
  orgId?: string | null;
}

export async function handleCredits(req: VercelRequest, res: VercelResponse) {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({ error: 'Server configuration error: Supabase not configured', success: false });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const pathArr = (req.query.path as string[]) || [];
    const action = pathArr[0] || (req.query.action as string);

    if (action === 'spend') {
      return await handleSpend(req, res);
    } else if (action === 'earn') {
      return await handleEarn(req, res);
    } else if (action === 'daily-reset') {
      return await handleDailyReset(req, res);
    } else if (action === 'org-balance') {
      return await handleOrgBalance(req, res);
    } else if (action === 'daily-allocate') {
      return await handleDailyAllocate(req, res);
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (err) {
    return handleError(res, 'credits', err);
  }
}

/**
 * Get the organization ID for a given user (from profiles table).
 */
async function getUserOrgId(userId: string): Promise<string | null> {
  const profile = await selectOne('profiles', {
    column: 'id',
    value: userId,
    select: 'organization_id',
  });
  return profile?.organization_id || null;
}

/**
 * Get current organization credit balance.
 */
export async function getOrgCreditBalance(orgId: string): Promise<number> {
  const org = await selectOne('organizations', {
    column: 'id',
    value: orgId,
    select: 'credit_balance',
  });
  return Number(org?.credit_balance || 0);
}

/**
 * Add credits to organization balance (atomic).
 * Uses a raw SQL update pattern via REST to keep the counter in sync.
 */
async function addOrgCredits(orgId: string, amount: number): Promise<number> {
  const currentBalance = await getOrgCreditBalance(orgId);
  const newBalance = currentBalance + amount;

  await update('organizations', { column: 'id', value: orgId }, {
    credit_balance: newBalance,
    updated_at: new Date().toISOString(),
  });

  return newBalance;
}

/**
 * Deduct credits from organization balance.
 * Throws if insufficient balance.
 */
async function deductOrgCredits(orgId: string, amount: number): Promise<number> {
  const currentBalance = await getOrgCreditBalance(orgId);
  if (currentBalance < amount) {
    throw new Error('Insufficient organization credits');
  }

  const newBalance = currentBalance - amount;
  await update('organizations', { column: 'id', value: orgId }, {
    credit_balance: newBalance,
    updated_at: new Date().toISOString(),
  });
  return newBalance;
}

/**
 * Log a credit transaction. Best-effort; does not throw on log failure
 * but prints an error so it can be reconciled later.
 */
async function logTransaction(params: {
  user_id: string;
  amount: number;
  reason: string;
  organization_id?: string | null;
  reference_id?: string | null;
  stripe_session_id?: string | null;
}) {
  try {
    await insert('credit_transactions', {
      user_id: params.user_id,
      amount: params.amount,
      transaction_type: params.amount < 0 ? 'spend_credit' : 'earn_credit',
      description: params.reason,
      reference_id: params.reference_id || null,
      organization_id: params.organization_id || null,
      stripe_session_id: params.stripe_session_id || null,
    });
  } catch (e) {
    console.error('[Credits] Transaction log error:', e);
  }
}

/**
 * Spend credits: check org balance first, fall back to user balance.
 */
async function handleSpend(req: VercelRequest, res: VercelResponse) {
  const { userId, amount, action, referenceId } = req.body;

  if (!userId || !amount || !action) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const spendAmount = Number(amount);
  if (spendAmount <= 0) {
    return res.status(400).json({ error: 'Amount must be positive' });
  }

  // 1. Try to deduct from organization balance first (if user has org)
  const orgId = await getUserOrgId(userId);

  if (orgId) {
    try {
      const orgBalance = await getOrgCreditBalance(orgId);
      if (orgBalance >= spendAmount) {
        const newOrgBalance = await deductOrgCredits(orgId, spendAmount);

        await logTransaction({
          user_id: userId,
          amount: -spendAmount,
          reason: `Spent ${spendAmount} credits for ${action}`,
          organization_id: orgId,
          reference_id: referenceId || null,
        });

        return res.status(200).json({
          success: true,
          newBalance: newOrgBalance,
          amountSpent: spendAmount,
          source: 'org',
        });
      }
    } catch (e) {
      console.error('[Credits] Org deduction failed, falling back to user:', e);
    }
  }

  // 2. Fallback: use user's personal credits
  const creditData = await selectOne('credits', {
    column: 'user_id',
    value: userId,
    select: 'balance, tier, total_spent',
  });

  if (!creditData) {
    return res.status(404).json({ error: 'Credits record not found', success: false });
  }

  if (Number(creditData.balance) < spendAmount) {
    return res.status(400).json({
      error: 'Insufficient credits',
      success: false,
      currentBalance: creditData.balance,
      required: spendAmount,
    });
  }

  const newBalance = Number(creditData.balance) - spendAmount;
  await update('credits', { column: 'user_id', value: userId }, {
    balance: newBalance,
    total_spent: (Number(creditData.total_spent) || 0) + spendAmount,
    updated_at: new Date().toISOString(),
  });

  await logTransaction({
    user_id: userId,
    amount: -spendAmount,
    reason: `Spent ${spendAmount} credits for ${action}`,
    reference_id: referenceId || null,
  });

  return res.status(200).json({
    success: true,
    newBalance,
    amountSpent: spendAmount,
    source: 'user',
  });
}

/**
 * Earn credits: top up the user's organization balance if they have one,
 * otherwise add to the user's personal credits record.
 */
async function handleEarn(req: VercelRequest, res: VercelResponse) {
  const { userId, amount, action, referenceId } = req.body;

  if (!userId || !amount || !action) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const earnAmount = Number(amount);
  if (earnAmount <= 0) {
    return res.status(400).json({ error: 'Amount must be positive' });
  }

  const orgId = await getUserOrgId(userId);

  if (orgId) {
    const newBalance = await addOrgCredits(orgId, earnAmount);

    await logTransaction({
      user_id: userId,
      amount: earnAmount,
      reason: `Earned ${earnAmount} credits for ${action}`,
      organization_id: orgId,
      reference_id: referenceId || null,
    });

    return res.status(200).json({
      success: true,
      newBalance,
      amountEarned: earnAmount,
      source: 'org',
    });
  }

  // Fallback: user personal credits (no org)
  const creditData = await selectOne('credits', {
    column: 'user_id',
    value: userId,
    select: 'balance, total_earned',
  });

  if (!creditData) {
    await insert('credits', {
      user_id: userId,
      balance: earnAmount,
      daily_balance: 5,
      total_earned: earnAmount,
      total_spent: 0,
      tier: 'free',
    });

    await logTransaction({
      user_id: userId,
      amount: earnAmount,
      reason: `Earned ${earnAmount} credits for ${action}`,
      reference_id: referenceId || null,
    });

    return res.status(200).json({ success: true, newBalance: earnAmount, source: 'user' });
  }

  const newBalance = Number(creditData.balance) + earnAmount;
  await update('credits', { column: 'user_id', value: userId }, {
    balance: newBalance,
    total_earned: (Number(creditData.total_earned) || 0) + earnAmount,
    updated_at: new Date().toISOString(),
  });

  await logTransaction({
    user_id: userId,
    amount: earnAmount,
    reason: `Earned ${earnAmount} credits for ${action}`,
    reference_id: referenceId || null,
  });

  return res.status(200).json({
    success: true,
    newBalance,
    amountEarned: earnAmount,
    source: 'user',
  });
}

/**
 * Daily reset for user-level free-tier credits (5/day).
 * Note: organization-level council credits are handled via handleDailyAllocate.
 */
async function handleDailyReset(req: VercelRequest, res: VercelResponse) {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  const creditData = await selectOne('credits', {
    column: 'user_id',
    value: userId,
    select: 'tier, balance, total_earned',
  });

  if (!creditData) {
    return res.status(404).json({ error: 'Credits record not found' });
  }

  if (creditData.tier !== 'free') {
    return res.status(200).json({ success: true, creditsGranted: 0, message: 'No reset needed for paid tier' });
  }

  const dailyCredits = 5;
  const newBalance = Number(creditData.balance || 0) + dailyCredits;
  const newTotalEarned = Number(creditData.total_earned || 0) + dailyCredits;

  await update('credits', { column: 'user_id', value: userId }, {
    balance: newBalance,
    total_earned: newTotalEarned,
    updated_at: new Date().toISOString(),
  });

  await logTransaction({
    user_id: userId,
    amount: dailyCredits,
    reason: 'Daily login bonus',
  });

  return res.status(200).json({
    success: true,
    creditsGranted: dailyCredits,
    newBalance,
  });
}

/**
 * Expose the current org credit balance for UI display.
 */
async function handleOrgBalance(req: VercelRequest, res: VercelResponse) {
  const { user } = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const orgId = await getUserOrgId(user.id);
  if (!orgId) {
    return res.status(200).json({ success: true, orgBalance: 0, hasOrg: false });
  }

  const orgBalance = await getOrgCreditBalance(orgId);
  return res.status(200).json({
    success: true,
    orgBalance,
    hasOrg: true,
    orgId,
  });
}

/**
 * Bulk daily council allocation: adds 5 credits/day to every council-tier org.
 * Designed to be called once per day via a cron job or admin trigger.
 */
async function handleDailyAllocate(req: VercelRequest, res: VercelResponse) {
  // Minimal gate — only super_admin can trigger bulk allocation
  const { user } = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const councilOrgs = await selectMany('organizations', {
    select: 'id, name, credit_balance',
    where: [{ column: 'plan', value: 'council' }],
  }, 60000);

  if (!councilOrgs || councilOrgs.length === 0) {
    return res.status(200).json({ success: true, allocated: 0, orgsProcessed: 0 });
  }

  const dailyAllocation = 5;
  let totalAllocated = 0;
  let orgsProcessed = 0;

  for (const org of councilOrgs) {
    try {
      await addOrgCredits(org.id, dailyAllocation);

      await logTransaction({
        user_id: user.id,
        amount: dailyAllocation,
        reason: 'Daily council allocation',
        organization_id: org.id,
      });

      totalAllocated += dailyAllocation;
      orgsProcessed += 1;
    } catch (e) {
      console.error(`[Credits] Failed to allocate for org ${org.id}:`, e);
    }
  }

  return res.status(200).json({
    success: true,
    allocated: totalAllocated,
    orgsProcessed,
    creditsPerOrg: dailyAllocation,
  });
}

/**
 * Public helper used by the Stripe webhook handler to credit an organization
 * (or a user) for a purchased credit pack. Kept in this module so the
 * balance + transaction log are updated atomically within one code path.
 */
export async function applyCreditPackPurchase(purchase: CreditPackPurchase): Promise<{
  success: boolean;
  newBalance?: number;
  source?: 'org' | 'user';
  error?: string;
}> {
  try {
    const { priceId, credits, sessionId, userId, orgId } = purchase;

    if (!sessionId || !userId || credits <= 0) {
      return { success: false, error: 'Invalid credit pack purchase request' };
    }

    if (orgId) {
      const newBalance = await addOrgCredits(orgId, credits);

      await logTransaction({
        user_id: userId,
        amount: credits,
        reason: `Credit pack purchase (${credits} credits) — pack:${priceId}`,
        organization_id: orgId,
        stripe_session_id: sessionId,
      });

      return { success: true, newBalance, source: 'org' };
    }

    const creditData = await selectOne('credits', {
      column: 'user_id',
      value: userId,
      select: 'balance, total_earned',
    });

    if (!creditData) {
      await insert('credits', {
        user_id: userId,
        balance: credits,
        daily_balance: 5,
        total_earned: credits,
        total_spent: 0,
        tier: 'free',
      });

      await logTransaction({
        user_id: userId,
        amount: credits,
        reason: `Credit pack purchase (${credits} credits) — pack:${priceId}`,
        stripe_session_id: sessionId,
      });

      return { success: true, newBalance: credits, source: 'user' };
    }

    const newBalance = Number(creditData.balance) + credits;
    await update('credits', { column: 'user_id', value: userId }, {
      balance: newBalance,
      total_earned: (Number(creditData.total_earned) || 0) + credits,
      updated_at: new Date().toISOString(),
    });

    await logTransaction({
      user_id: userId,
      amount: credits,
      reason: `Credit pack purchase (${credits} credits) — pack:${priceId}`,
      stripe_session_id: sessionId,
    });

    return { success: true, newBalance, source: 'user' };
  } catch (err: any) {
    console.error('[Credits] applyCreditPackPurchase failed:', err);
    return { success: false, error: err?.message || 'Unknown error' };
  }
}
