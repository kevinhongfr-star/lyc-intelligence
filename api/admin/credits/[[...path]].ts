/**
 * Admin Credits API — credit management operations for platform administrators.
 * Routes:
 *   GET  /api/admin/credits                    — Credit overview stats
 *   GET  /api/admin/credits/transactions       — Transaction log
 *   POST /api/admin/credits/grant             — Grant credits to user
 *   POST /api/admin/credits/adjust            — Adjust credits (positive or negative)
 *   POST /api/admin/credits/bulk             — Bulk credit grant via CSV data
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { selectMany, selectOne, update, insert, isSupabaseConfigured, handleError } from '../../_lib/supabaseRest.js';
import { verifyAdmin, getUserFromRequest } from '../../_lib/adminAuth.js';

export const maxDuration = 60;

interface GrantEntry {
  email: string;
  amount: number;
  reason: string;
}

/**
 * Get aggregate credit stats across the platform.
 */
async function handleOverview(req: VercelRequest, res: VercelResponse) {
  try {
    const [totalIssued, totalConsumed] = await Promise.all([
      selectMany('credit_transactions', {
        select: 'amount',
        where: [{ column: 'amount', value: '0', op: 'gt' }],
      }, 30000, 10000),
      selectMany('credit_transactions', {
        select: 'amount',
        where: [{ column: 'amount', value: '0', op: 'lt' }],
      }, 30000, 10000),
    ]);

    const issued = (totalIssued || []).reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
    const consumed = (totalConsumed || []).reduce((sum: number, t: any) => sum + Math.abs(Number(t.amount || 0)), 0);

    const credits = await selectMany('credits', {
      select: 'user_id,balance',
    }, 30000, 10000);
    const totalRemaining = (credits || []).reduce((sum: number, c: any) => sum + Number(c.balance || 0), 0);
    const activeWithCredits = (credits || []).filter((c: any) => Number(c.balance || 0) > 0).length;

    return res.status(200).json({
      success: true,
      data: {
        totalIssued: issued,
        totalConsumed: consumed,
        totalRemaining,
        totalUsers: (credits || []).length,
        activeWithCredits,
      },
    });
  } catch (err) {
    return handleError(res, 'admin-credits', err);
  }
}

/**
 * Get transaction log with filters.
 */
async function handleTransactions(req: VercelRequest, res: VercelResponse) {
  const { type, userEmail, limit = 100, offset = 0 } = req.query || {};

  try {
    const transactions = await selectMany('credit_transactions', {
      select: 'id,user_id,amount,transaction_type,description,created_at,reference_id',
    }, 30000, Number(limit));

    let filtered = transactions || [];

    if (type && type !== 'all') {
      filtered = filtered.filter((t: any) => t.transaction_type === type);
    }

    // Join user emails if needed
    const userIds = [...new Set(filtered.map((t: any) => t.user_id))];
    const profiles = await selectMany('profiles', {
      select: 'id,email',
    }, 30000, 500);
    const emailMap: Record<string, string> = {};
    (profiles || []).forEach((p: any) => { emailMap[p.id] = p.email; });

    const enriched = filtered.map((t: any) => ({
      ...t,
      user_email: emailMap[t.user_id] || t.user_id,
    }));

    if (userEmail) {
      const q = String(userEmail).toLowerCase();
      return res.status(200).json({
        success: true,
        data: enriched.filter((t: any) => (t.user_email || '').toLowerCase().includes(q)),
        total: filtered.length,
      });
    }

    return res.status(200).json({
      success: true,
      data: enriched.slice(Number(offset), Number(offset) + Number(limit)),
      total: filtered.length,
    });
  } catch (err) {
    return handleError(res, 'admin-credits', err);
  }
}

/**
 * Grant credits to a single user.
 */
async function handleGrant(req: VercelRequest, res: VercelResponse) {
  const { email, amount, reason } = req.body || {};

  if (!email || !amount || !reason) {
    return res.status(400).json({ error: 'email, amount, and reason are required' });
  }

  const grantAmount = Number(amount);
  if (grantAmount <= 0) {
    return res.status(400).json({ error: 'Amount must be positive' });
  }

  if (grantAmount > 10000) {
    console.warn(`[Admin Credits] Large credit grant: ${grantAmount} to ${email} by admin`);
  }

  try {
    // Find user by email
    const profile = await selectOne('profiles', {
      column: 'email',
      value: email,
      select: 'id,email',
    });

    if (!profile) {
      return res.status(404).json({ error: 'User not found with this email' });
    }

    const userId = profile.id;

    // Get or create credits record
    let creditData = await selectOne('credits', {
      column: 'user_id',
      value: userId,
      select: 'balance,total_earned',
    });

    let newBalance: number;
    if (!creditData) {
      await insert('credits', {
        user_id: userId,
        balance: grantAmount,
        total_earned: grantAmount,
        total_spent: 0,
        tier: 'admin_granted',
      });
      newBalance = grantAmount;
    } else {
      newBalance = Number(creditData.balance || 0) + grantAmount;
      await update('credits', { column: 'user_id', value: userId }, {
        balance: newBalance,
        total_earned: Number(creditData.total_earned || 0) + grantAmount,
        updated_at: new Date().toISOString(),
      });
    }

    // Log transaction
    await insert('credit_transactions', {
      user_id: userId,
      amount: grantAmount,
      transaction_type: 'grant',
      description: reason,
    });

    // Audit log
    const { user: admin } = await getUserFromRequest(req);
    await logAuditEvent({
      action: 'credit_grant',
      actorId: admin?.id,
      targetId: userId,
      detail: `+${grantAmount} credits: ${reason}`,
      ip: req.headers['x-forwarded-for'] as string,
    });

    return res.status(200).json({
      success: true,
      data: { userId, email, newBalance, amount: grantAmount },
    });
  } catch (err) {
    return handleError(res, 'admin-credits', err);
  }
}

/**
 * Adjust credits (positive or negative, with reason).
 */
async function handleAdjust(req: VercelRequest, res: VercelResponse) {
  const { email, amount, reason } = req.body || {};

  if (!email || amount === undefined || !reason) {
    return res.status(400).json({ error: 'email, amount, and reason are required' });
  }

  const adjustAmount = Number(amount);
  if (adjustAmount === 0) {
    return res.status(400).json({ error: 'Amount cannot be zero' });
  }

  try {
    const profile = await selectOne('profiles', {
      column: 'email',
      value: email,
      select: 'id,email',
    });

    if (!profile) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = profile.id;
    const creditData = await selectOne('credits', {
      column: 'user_id',
      value: userId,
      select: 'balance',
    });

    const currentBalance = Number(creditData?.balance || 0);
    const newBalance = currentBalance + adjustAmount;

    if (newBalance < 0) {
      return res.status(400).json({ error: 'Adjustment would result in negative balance' });
    }

    await update('credits', { column: 'user_id', value: userId }, {
      balance: newBalance,
      updated_at: new Date().toISOString(),
    });

    await insert('credit_transactions', {
      user_id: userId,
      amount: adjustAmount,
      transaction_type: adjustAmount > 0 ? 'grant' : 'adjustment',
      description: reason,
    });

    const { user: admin } = await getUserFromRequest(req);
    await logAuditEvent({
      action: adjustAmount > 0 ? 'credit_grant' : 'credit_adjustment',
      actorId: admin?.id,
      targetId: userId,
      detail: `${adjustAmount > 0 ? '+' : ''}${adjustAmount} credits: ${reason}`,
      ip: req.headers['x-forwarded-for'] as string,
    });

    return res.status(200).json({ success: true, data: { newBalance, adjustment: adjustAmount } });
  } catch (err) {
    return handleError(res, 'admin-credits', err);
  }
}

/**
 * Bulk credit grant — accepts array of {email, amount, reason} entries.
 * For CSV upload, parse the CSV server-side before calling this.
 */
async function handleBulk(req: VercelRequest, res: VercelResponse) {
  const { entries } = req.body || {};

  if (!Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({ error: 'entries array is required' });
  }

  const results: { email: string; success: boolean; error?: string }[] = [];
  const { user: admin } = await getUserFromRequest(req);

  for (const entry of entries as GrantEntry[]) {
    try {
      const { email, amount, reason } = entry;
      if (!email || !amount || !reason) {
        results.push({ email, success: false, error: 'Missing fields' });
        continue;
      }

      const grantAmount = Number(amount);
      if (grantAmount <= 0) {
        results.push({ email, success: false, error: 'Invalid amount' });
        continue;
      }

      const profile = await selectOne('profiles', {
        column: 'email',
        value: email,
        select: 'id',
      });

      if (!profile) {
        results.push({ email, success: false, error: 'User not found' });
        continue;
      }

      const userId = profile.id;
      let creditData = await selectOne('credits', {
        column: 'user_id',
        value: userId,
        select: 'balance,total_earned',
      });

      let newBalance: number;
      if (!creditData) {
        await insert('credits', {
          user_id: userId,
          balance: grantAmount,
          total_earned: grantAmount,
          total_spent: 0,
          tier: 'admin_granted',
        });
        newBalance = grantAmount;
      } else {
        newBalance = Number(creditData.balance || 0) + grantAmount;
        await update('credits', { column: 'user_id', value: userId }, {
          balance: newBalance,
          total_earned: Number(creditData.total_earned || 0) + grantAmount,
          updated_at: new Date().toISOString(),
        });
      }

      await insert('credit_transactions', {
        user_id: userId,
        amount: grantAmount,
        transaction_type: 'grant',
        description: reason,
      });

      results.push({ email, success: true });
    } catch (err: any) {
      results.push({ email: entry.email, success: false, error: err?.message || 'Unknown error' });
    }
  }

  const successCount = results.filter((r) => r.success).length;
  await logAuditEvent({
    action: 'credit_bulk',
    actorId: admin?.id,
    targetId: undefined,
    detail: `Bulk grant: +${entries.length} entries, ${successCount} succeeded`,
    ip: req.headers['x-forwarded-for'] as string,
  });

  return res.status(200).json({ success: true, data: { results, total: entries.length, succeeded: successCount, failed: entries.length - successCount } });
}

async function logAuditEvent(params: {
  action: string;
  actorId?: string;
  targetId?: string;
  detail: string;
  ip?: string;
}) {
  try {
    await insert('org_audit_log', {
      action: params.action,
      actor_id: params.actorId || null,
      target_id: params.targetId || null,
      detail: params.detail,
      ip_address: params.ip || null,
      created_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error('[Admin Credits] Audit log failed:', e);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isSupabaseConfigured()) {
    return res.status(500).json({ error: 'Server configuration error', success: false });
  }

  const { user, error } = await verifyAdmin(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  try {
    const pathArr = (req.query.path as string[]) || [];
    const key = pathArr[0] || '';
    const method = req.method;

    if (method === 'GET' && (key === 'transactions' || key === '')) {
      return handleTransactions(req, res);
    }

    if (method === 'GET') {
      return handleOverview(req, res);
    }

    if (method === 'POST' && key === 'grant') {
      return handleGrant(req, res);
    }

    if (method === 'POST' && key === 'adjust') {
      return handleAdjust(req, res);
    }

    if (method === 'POST' && key === 'bulk') {
      return handleBulk(req, res);
    }

    // Default: overview
    return handleOverview(req, res);
  } catch (err) {
    return handleError(res, 'admin-credits', err);
  }
}
