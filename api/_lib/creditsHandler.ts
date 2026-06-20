import type { VercelRequest, VercelResponse } from '@vercel/node';
import { selectOne, insert, update, isSupabaseConfigured, handleError } from './supabaseRest.js';

// Vercel Hobby default is 10s — credit operations should be well under that,
// but we extend for safety in case the DB is slow.
export const maxDuration = 60;

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
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (err) {
    return handleError(res, 'credits', err);
  }
}

async function handleSpend(req: VercelRequest, res: VercelResponse) {
  const { userId, amount, action, referenceId } = req.body;

  if (!userId || !amount || !action) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Get current balance
  const creditData = await selectOne('credits', { column: 'user_id', value: userId, select: 'balance,tier,total_spent' });
  if (!creditData) {
    return res.status(404).json({ error: 'Credits record not found', success: false });
  }

  // Check if user has enough credits
  if (creditData.balance < amount) {
    return res.status(400).json({
      error: 'Insufficient credits',
      success: false,
      currentBalance: creditData.balance,
      required: amount,
    });
  }

  // Deduct credits
  await update('credits', { column: 'user_id', value: userId }, {
    balance: creditData.balance - amount,
    total_spent: (creditData.total_spent || 0) + amount,
    updated_at: new Date().toISOString(),
  });

  // Record transaction (best-effort — don't fail the spend if the log fails)
  try {
    await insert('credit_transactions', {
      user_id: userId,
      amount: -amount,
      transaction_type: `spend_${action}`,
      description: `Spent ${amount} credits for ${action}`,
      reference_id: referenceId || null,
    });
  } catch (e) {
    console.error('[Credits] Transaction log error:', e);
  }

  return res.status(200).json({
    success: true,
    newBalance: creditData.balance - amount,
    amountSpent: amount,
  });
}

async function handleEarn(req: VercelRequest, res: VercelResponse) {
  const { userId, amount, action, referenceId } = req.body;

  if (!userId || !amount || !action) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Get current balance
  const creditData = await selectOne('credits', { column: 'user_id', value: userId, select: 'balance,total_earned' });

  if (!creditData) {
    // Create credits record if it doesn't exist
    await insert('credits', {
      user_id: userId,
      balance: amount,
      daily_balance: 5,
      total_earned: amount,
      total_spent: 0,
      tier: 'free',
    });

    // Record transaction (best-effort)
    try {
      await insert('credit_transactions', {
        user_id: userId,
        amount,
        transaction_type: `earn_${action}`,
        description: `Earned ${amount} credits for ${action}`,
        reference_id: referenceId || null,
      });
    } catch (e) {
      console.error('[Credits] Transaction log error:', e);
    }

    return res.status(200).json({ success: true, newBalance: amount });
  }

  // Update balance
  const newBalance = creditData.balance + amount;
  await update('credits', { column: 'user_id', value: userId }, {
    balance: newBalance,
    total_earned: (creditData.total_earned || 0) + amount,
    updated_at: new Date().toISOString(),
  });

  // Record transaction (best-effort)
  try {
    await insert('credit_transactions', {
      user_id: userId,
      amount,
      transaction_type: `earn_${action}`,
      description: `Earned ${amount} credits for ${action}`,
      reference_id: referenceId || null,
    });
  } catch (e) {
    console.error('[Credits] Transaction log error:', e);
  }

  return res.status(200).json({
    success: true,
    newBalance,
    amountEarned: amount,
  });
}

async function handleDailyReset(req: VercelRequest, res: VercelResponse) {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  // Get user's credits record
  const creditData = await selectOne('credits', { column: 'user_id', value: userId, select: 'tier,balance,total_earned' });
  if (!creditData) {
    return res.status(404).json({ error: 'Credits record not found' });
  }

  // Only reset for free tier users
  if (creditData.tier !== 'free') {
    return res.status(200).json({ success: true, creditsGranted: 0, message: 'No reset needed for paid tier' });
  }

  // Grant daily credits (5 for free tier)
  const dailyCredits = 5;
  const newBalance = (creditData.balance || 0) + dailyCredits;
  const newTotalEarned = (creditData.total_earned || 0) + dailyCredits;

  await update('credits', { column: 'user_id', value: userId }, {
    balance: newBalance,
    total_earned: newTotalEarned,
    updated_at: new Date().toISOString(),
  });

  // Record transaction (best-effort)
  try {
    await insert('credit_transactions', {
      user_id: userId,
      amount: dailyCredits,
      transaction_type: 'earn_daily',
      description: 'Daily login bonus',
    });
  } catch (e) {
    console.error('[Credits] Daily-reset transaction log error:', e);
  }

  return res.status(200).json({
    success: true,
    creditsGranted: dailyCredits,
    newBalance,
  });
}
