import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handler as handleCompaniesUpload } from '../_lib/companiesUploadHandler.js';
import { handler as handleGridReportsGenerate } from '../_lib/gridReportsGenerateHandler.js';
import { handler as handleScoringCompute } from '../_lib/scoringComputeHandler.js';
import {
  selectMany,
  selectOne,
  update,
  insert,
  isSupabaseConfigured,
  handleError,
} from '../_lib/supabaseRest.js';
import { verifyAdmin, getUserFromRequest } from '../_lib/adminAuth.js';

export const maxDuration = 60;

// ─── Credits Handlers ────────────────────────────────────────────

interface GrantEntry {
  email: string;
  amount: number;
  reason: string;
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

async function handleCreditsOverview(req: VercelRequest, res: VercelResponse) {
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

async function handleCreditsTransactions(req: VercelRequest, res: VercelResponse) {
  const { type, userEmail, limit = 100, offset = 0 } = req.query || {};

  try {
    const transactions = await selectMany('credit_transactions', {
      select: 'id,user_id,amount,transaction_type,description,created_at,reference_id',
    }, 30000, Number(limit));

    let filtered = transactions || [];

    if (type && type !== 'all') {
      filtered = filtered.filter((t: any) => t.transaction_type === type);
    }

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

async function handleCreditsGrant(req: VercelRequest, res: VercelResponse) {
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
    const profile = await selectOne('profiles', {
      column: 'email',
      value: email,
      select: 'id,email',
    });

    if (!profile) {
      return res.status(404).json({ error: 'User not found with this email' });
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

async function handleCreditsAdjust(req: VercelRequest, res: VercelResponse) {
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

async function handleCreditsBulk(req: VercelRequest, res: VercelResponse) {
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

async function handleCredits(req: VercelRequest, res: VercelResponse) {
  if (!isSupabaseConfigured()) {
    return res.status(500).json({ error: 'Server configuration error', success: false });
  }

  const { user, error } = await verifyAdmin(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  try {
    const pathArr = (req.query.path as string[]) || [];
    const key = pathArr[1] || '';
    const method = req.method;

    if (method === 'GET' && (key === 'transactions' || key === '')) {
      return handleCreditsTransactions(req, res);
    }

    if (method === 'GET') {
      return handleCreditsOverview(req, res);
    }

    if (method === 'POST' && key === 'grant') {
      return handleCreditsGrant(req, res);
    }

    if (method === 'POST' && key === 'adjust') {
      return handleCreditsAdjust(req, res);
    }

    if (method === 'POST' && key === 'bulk') {
      return handleCreditsBulk(req, res);
    }

    return handleCreditsOverview(req, res);
  } catch (err) {
    return handleError(res, 'admin-credits', err);
  }
}

// ─── Users Handlers ─────────────────────────────────────────────

async function handleUsersList(req: VercelRequest, res: VercelResponse) {
  const { icp, role, status, search } = req.query || {};
  const limit = Number(req.query?.limit) || 100;
  const offset = Number(req.query?.offset) || 0;

  try {
    const users = await selectMany('profiles', {
      select: 'id,email,name,first_name,last_name,icp,role,subtype,status,created_at,last_login_at',
    }, 30000, limit);

    let filtered = users || [];

    if (icp && icp !== 'all') {
      filtered = filtered.filter((u: any) => u.icp === icp);
    }
    if (role && role !== 'all') {
      filtered = filtered.filter((u: any) => u.role === role);
    }
    if (status && status !== 'all') {
      filtered = filtered.filter((u: any) => (u.status || 'active') === status);
    }
    if (search) {
      const q = String(search).toLowerCase();
      filtered = filtered.filter((u: any) =>
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
      );
    }

    const userIds = filtered.map((u: any) => u.id);
    const credits = await selectMany('credits', {
      select: 'user_id,balance',
    }, 30000, 500);

    const creditMap: Record<string, number> = {};
    (credits || []).forEach((c: any) => { creditMap[c.user_id] = Number(c.balance || 0); });

    const enriched = filtered.map((u: any) => ({
      ...u,
      credits: creditMap[u.id] || 0,
    }));

    return res.status(200).json({
      success: true,
      data: enriched,
      total: enriched.length,
      limit,
      offset,
    });
  } catch (err) {
    return handleError(res, 'admin-users', err);
  }
}

async function handleUsersGet(req: VercelRequest, res: VercelResponse) {
  const pathArr = (req.query.path as string[]) || [];
  const userId = pathArr[1];

  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  try {
    const profile = await selectOne('profiles', {
      column: 'id',
      value: userId,
      select: 'id,email,name,first_name,last_name,icp,role,subtype,status,organization_id,created_at,last_login_at',
    });

    if (!profile) {
      return res.status(404).json({ error: 'User not found' });
    }

    const credit = await selectOne('credits', {
      column: 'user_id',
      value: userId,
      select: 'balance,total_earned,total_spent',
    });

    const mandates = await selectMany('mandates', {
      select: 'id',
      where: [{ column: 'consultant_id', value: userId }, { column: 'status', value: 'active' }],
    }, 10000, 100);

    return res.status(200).json({
      success: true,
      data: {
        ...profile,
        credits: credit ? {
          balance: Number(credit.balance || 0),
          totalEarned: Number(credit.total_earned || 0),
          totalSpent: Number(credit.total_spent || 0),
        } : null,
        activeMandates: (mandates || []).length,
      },
    });
  } catch (err) {
    return handleError(res, 'admin-users', err);
  }
}

async function handleUsersRoleChange(req: VercelRequest, res: VercelResponse) {
  const pathArr = (req.query.path as string[]) || [];
  const userId = pathArr[1];

  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  const { newRole } = req.body || {};
  if (!newRole || !['admin', 'user'].includes(newRole)) {
    return res.status(400).json({ error: 'Invalid role. Must be "admin" or "user".' });
  }

  try {
    if (newRole === 'user') {
      const admins = await selectMany('profiles', {
        select: 'id',
        where: [{ column: 'role', value: 'admin' }],
      }, 10000, 10);
      if ((admins || []).length <= 1) {
        return res.status(400).json({ error: 'Cannot demote the last admin' });
      }
    }

    const updated = await update('profiles', { column: 'id', value: userId }, {
      role: newRole,
      updated_at: new Date().toISOString(),
    });

    const { user: admin } = await getUserFromRequest(req);
    await logAuditEvent({
      action: 'role_change',
      actorId: admin?.id,
      targetId: userId,
      detail: `Role changed to ${newRole}`,
      ip: req.headers['x-forwarded-for'] as string || req.socket?.remoteAddress,
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    return handleError(res, 'admin-users', err);
  }
}

async function handleUsersDisable(req: VercelRequest, res: VercelResponse) {
  const pathArr = (req.query.path as string[]) || [];
  const userId = pathArr[1];

  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  try {
    await update('profiles', { column: 'id', value: userId }, {
      status: 'disabled',
      updated_at: new Date().toISOString(),
    });

    const { user: admin } = await getUserFromRequest(req);
    await logAuditEvent({
      action: 'user_disabled',
      actorId: admin?.id,
      targetId: userId,
      detail: 'Account disabled',
      ip: req.headers['x-forwarded-for'] as string || req.socket?.remoteAddress,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    return handleError(res, 'admin-users', err);
  }
}

async function handleUsersEnable(req: VercelRequest, res: VercelResponse) {
  const pathArr = (req.query.path as string[]) || [];
  const userId = pathArr[1];

  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  try {
    const updated = await update('profiles', { column: 'id', value: userId }, {
      status: 'active',
      updated_at: new Date().toISOString(),
    });

    const { user: admin } = await getUserFromRequest(req);
    await logAuditEvent({
      action: 'user_enabled',
      actorId: admin?.id,
      targetId: userId,
      detail: 'Account enabled',
      ip: req.headers['x-forwarded-for'] as string || req.socket?.remoteAddress,
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    return handleError(res, 'admin-users', err);
  }
}

async function handleUsers(req: VercelRequest, res: VercelResponse) {
  if (!isSupabaseConfigured()) {
    return res.status(500).json({ error: 'Server configuration error', success: false });
  }

  const { user, error } = await verifyAdmin(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  try {
    const pathArr = (req.query.path as string[]) || [];
    const method = req.method;

    if (method === 'GET' && pathArr.length <= 1) {
      return handleUsersList(req, res);
    }

    if (method === 'GET' && pathArr.length >= 2) {
      return handleUsersGet(req, res);
    }

    if (method === 'PATCH' && pathArr[2] === 'role') {
      return handleUsersRoleChange(req, res);
    }

    if (method === 'POST' && pathArr[2] === 'disable') {
      return handleUsersDisable(req, res);
    }

    if (method === 'POST' && pathArr[2] === 'enable') {
      return handleUsersEnable(req, res);
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (err) {
    return handleError(res, 'admin-users', err);
  }
}

// ─── Health Handler ─────────────────────────────────────────────

interface DependencyStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  latency?: number;
  uptime?: number;
  error?: string;
}

interface HealthResult {
  overall: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  dependencies: DependencyStatus[];
  dbStats: Record<string, number>;
  recentErrors: any[];
  deployments: any[];
}

async function checkSupabase(): Promise<DependencyStatus> {
  try {
    const startTime = Date.now();
    await selectMany('profiles', { select: 'id' }, 5000, 1);
    const latency = Date.now() - startTime;
    return {
      name: 'Supabase',
      status: latency > 3000 ? 'degraded' : 'operational',
      latency,
      uptime: 99.9,
    };
  } catch (err: any) {
    return {
      name: 'Supabase',
      status: 'down',
      error: err?.message || 'Connection failed',
    };
  }
}

async function checkVercel(): Promise<DependencyStatus> {
  return {
    name: 'Vercel Functions',
    status: 'operational',
    latency: 0,
    uptime: 99.7,
  };
}

async function getDbStats(): Promise<Record<string, number>> {
  const tables = ['profiles', 'mandates', 'candidates', 'companies', 'assessments', 'credits', 'org_audit_log'];
  const stats: Record<string, number> = {};

  for (const table of tables) {
    try {
      const result = await selectMany(table, { select: 'id' }, 5000, 1000);
      stats[table] = (result || []).length;
    } catch {
      stats[table] = -1;
    }
  }

  return stats;
}

async function getRecentErrors(): Promise<any[]> {
  try {
    const logs = await selectMany('org_audit_log', {
      select: 'id,action,detail,created_at',
      order: 'created_at',
    }, 10000, 20);

    return (logs || [])
      .filter((l: any) => ['user_disabled', 'credit_grant'].includes(l.action))
      .slice(0, 5)
      .map((l: any) => ({
        id: l.id,
        action: l.action,
        detail: l.detail,
        time: l.created_at,
      }));
  } catch {
    return [];
  }
}

async function handleHealth(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isSupabaseConfigured()) {
    return res.status(500).json({
      overall: 'down',
      error: 'Supabase not configured',
      timestamp: new Date().toISOString(),
    });
  }

  const { user, error } = await verifyAdmin(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  try {
    const [supabaseStatus, vercelStatus, dbStats, recentErrors] = await Promise.all([
      checkSupabase(),
      checkVercel(),
      getDbStats(),
      getRecentErrors(),
    ]);

    const dependencies: DependencyStatus[] = [supabaseStatus, vercelStatus];
    const overall: 'healthy' | 'degraded' | 'down' =
      dependencies.some((d) => d.status === 'down')
        ? 'down'
        : dependencies.some((d) => d.status === 'degraded')
        ? 'degraded'
        : 'healthy';

    const result: HealthResult = {
      overall,
      timestamp: new Date().toISOString(),
      dependencies,
      dbStats,
      recentErrors,
      deployments: [],
    };

    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({
      overall: 'down',
      error: err?.message || 'Health check failed',
      timestamp: new Date().toISOString(),
    });
  }
}

// ─── Main Dispatcher ────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const pathArr = (req.query.path as string[]) || [];
  const segment = pathArr[0] || '';

  if (segment === 'health') {
    return handleHealth(req, res);
  }

  if (segment === 'credits') {
    return handleCredits(req, res);
  }

  if (segment === 'org-intelligence' || segment === 'org-intel') {
    const subPath = pathArr.slice(1).join('/');
    if (subPath === 'companies/upload' || pathArr[1] === 'companies') {
      return handleCompaniesUpload(req, res);
    }
    if (subPath === 'grid-reports/generate' || pathArr[1] === 'grid-reports') {
      return handleGridReportsGenerate(req, res);
    }
    if (subPath === 'scoring/compute' || pathArr[1] === 'scoring') {
      return handleScoringCompute(req, res);
    }
    return res.status(404).json({ error: 'Not found' });
  }

  if (segment === 'users') {
    return handleUsers(req, res);
  }

  return res.status(404).json({ error: `Admin route not found: ${segment}` });
}
