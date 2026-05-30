import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { requireAuth, AuthedRequest } from '../_lib/auth';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

export default async function handler(req: AuthedRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    if (!(await requireAuth(req, res))) return;
    const userId = req.userId!;

    const { action } = req.query;

    if (action === 'spend') {
      return handleSpend(req, res, userId);
    } else if (action === 'earn') {
      return handleEarn(req, res, userId);
    } else if (action === 'daily-reset') {
      return handleDailyReset(req, res, userId);
    }

    return res.status(400).json({ error: 'Invalid action' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleSpend(req: AuthedRequest, res: VercelResponse, userId: string) {
  const { amount, action, referenceId } = req.body;

  if (!amount || !action) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { data: creditData, error: creditError } = await supabase!
      .from('credits')
      .select('balance, tier, total_spent')
      .eq('user_id', userId)
      .single();

    if (creditError || !creditData) {
      return res.status(404).json({ error: 'Credits record not found', success: false });
    }

    if (creditData.balance < amount) {
      return res.status(400).json({ 
        error: 'Insufficient credits',
        success: false,
        currentBalance: creditData.balance,
        required: amount
      });
    }

    // Optimistic lock
    const { error: updateError } = await supabase!
      .from('credits')
      .update({
        balance: creditData.balance - amount,
        total_spent: (creditData.total_spent || 0) + amount,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('balance', creditData.balance);

    if (updateError) {
      return res.status(409).json({ error: 'Concurrent modification — please retry', success: false, retry: true });
    }

    const { error: transactionError } = await supabase!
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount: -amount,
        transaction_type: `spend_${action}`,
        description: `Spent ${amount} credits for ${action}`,
        reference_id: referenceId || null
      });

    if (transactionError) {
      console.error('[Credits] Transaction log error:', transactionError);
    }

    return res.status(200).json({
      success: true,
      newBalance: creditData.balance - amount,
      amountSpent: amount
    });
  } catch (e) {
    console.error('[Credits] Spend error:', e);
    return res.status(500).json({ error: 'Failed to spend credits', success: false });
  }
}

async function handleEarn(req: AuthedRequest, res: VercelResponse, userId: string) {
  const { amount, action, referenceId } = req.body;

  if (!amount || !action) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { data: creditData, error: creditError } = await supabase!
      .from('credits')
      .select('balance, total_earned')
      .eq('user_id', userId)
      .single();

    if (creditError || !creditData) {
      await supabase!
        .from('credits')
        .insert({
          user_id: userId,
          balance: amount,
          daily_balance: 5,
          total_earned: amount,
          total_spent: 0,
          tier: 'free'
        });

      await supabase!
        .from('credit_transactions')
        .insert({
          user_id: userId,
          amount,
          transaction_type: `earn_${action}`,
          description: `Earned ${amount} credits for ${action}`,
          reference_id: referenceId || null
        });

      return res.status(200).json({ success: true, newBalance: amount });
    }

    const newTotalEarned = (creditData.total_earned || 0) + amount;
    const { error: updateError } = await supabase!
      .from('credits')
      .update({
        balance: creditData.balance + amount,
        total_earned: newTotalEarned,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    await supabase!
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount,
        transaction_type: `earn_${action}`,
        description: `Earned ${amount} credits for ${action}`,
        reference_id: referenceId || null
      });

    return res.status(200).json({
      success: true,
      newBalance: creditData.balance + amount,
      amountEarned: amount
    });
  } catch (e) {
    console.error('[Credits] Earn error:', e);
    return res.status(500).json({ error: 'Failed to earn credits', success: false });
  }
}

async function handleDailyReset(req: AuthedRequest, res: VercelResponse, userId: string) {
  try {
    const { data: creditData, error: creditError } = await supabase!
      .from('credits')
      .select('tier, daily_balance, total_earned')
      .eq('user_id', userId)
      .single();

    if (creditError || !creditData) {
      return res.status(404).json({ error: 'Credits record not found' });
    }

    if (creditData.tier !== 'free') {
      return res.status(200).json({ success: true, creditsGranted: 0, message: 'No reset needed for paid tier' });
    }

    const dailyCredits = 5;

    await supabase!
      .from('credits')
      .update({
        balance: creditData.daily_balance + dailyCredits,
        daily_balance: dailyCredits,
        total_earned: (creditData.total_earned || 0) + dailyCredits,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    await supabase!
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount: dailyCredits,
        transaction_type: 'earn_daily',
        description: 'Daily login bonus'
      });

    return res.status(200).json({ 
      success: true, 
      creditsGranted: dailyCredits,
      newBalance: creditData.daily_balance + dailyCredits
    });
  } catch (e) {
    console.error('[Credits] Daily reset error:', e);
    return res.status(500).json({ error: 'Failed to reset daily credits' });
  }
}
