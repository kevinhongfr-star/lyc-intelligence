/**
 * Admin Users API — user management for platform administrators.
 * Routes:
 *   GET  /api/admin/users                    — List all users
 *   GET  /api/admin/users/:id                — Get user detail
 *   PATCH /api/admin/users/:id/role          — Change user role
 *   POST /api/admin/users/:id/disable        — Disable user
 *   POST /api/admin/users/:id/enable         — Enable user
 *   POST /api/admin/users/:id/reset-password — Reset password
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { selectMany, selectOne, update, insert, isSupabaseConfigured, handleError } from '../../_lib/supabaseRest.js';
import { verifyAdmin, getUserFromRequest } from '../../_lib/adminAuth.js';

export const maxDuration = 60;

/**
 * List all users with credit and activity summary.
 */
async function handleList(req: VercelRequest, res: VercelResponse) {
  const { icp, role, status, search } = req.query || {};
  const limit = Number(req.query?.limit) || 100;
  const offset = Number(req.query?.offset) || 0;

  try {
    let query = `profiles?select=id,email,name,first_name,last_name,icp,role,subtype,status,created_at,last_login_at`;

    // Note: Filtering via REST requires chained .eq() calls on the client side
    // For simplicity, we fetch all and filter in-memory for now
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

    // Fetch credit balances for filtered users
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

/**
 * Get a single user with full detail.
 */
async function handleGet(req: VercelRequest, res: VercelResponse) {
  const pathArr = (req.query.path as string[]) || [];
  const userId = pathArr[0];

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

    // Fetch credit balance
    const credit = await selectOne('credits', {
      column: 'user_id',
      value: userId,
      select: 'balance,total_earned,total_spent',
    });

    // Count active mandates
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

/**
 * Change a user's role.
 */
async function handleRoleChange(req: VercelRequest, res: VercelResponse) {
  const pathArr = (req.query.path as string[]) || [];
  const userId = pathArr[0];

  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  const { newRole } = req.body || {};
  if (!newRole || !['admin', 'user'].includes(newRole)) {
    return res.status(400).json({ error: 'Invalid role. Must be "admin" or "user".' });
  }

  try {
    // Verify new role doesn't demote the last admin
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

    // Log to audit
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

/**
 * Disable a user account.
 */
async function handleDisable(req: VercelRequest, res: VercelResponse) {
  const pathArr = (req.query.path as string[]) || [];
  const userId = pathArr[0];

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

/**
 * Enable a disabled user account.
 */
async function handleEnable(req: VercelRequest, res: VercelResponse) {
  const pathArr = (req.query.path as string[]) || [];
  const userId = pathArr[0];

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
    console.error('[Admin Users] Audit log failed:', e);
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
    const method = req.method;

    // GET /api/admin/users (no path)
    if (method === 'GET' && pathArr.length === 0) {
      return handleList(req, res);
    }

    // GET /api/admin/users/:id
    if (method === 'GET' && pathArr.length === 1 && !pathArr[0].includes('/')) {
      return handleGet(req, res);
    }

    // PATCH /api/admin/users/:id/role
    if (method === 'PATCH' && pathArr[1] === 'role') {
      return handleRoleChange(req, res);
    }

    // POST /api/admin/users/:id/disable
    if (method === 'POST' && pathArr[1] === 'disable') {
      return handleDisable(req, res);
    }

    // POST /api/admin/users/:id/enable
    if (method === 'POST' && pathArr[1] === 'enable') {
      return handleEnable(req, res);
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (err) {
    return handleError(res, 'admin-users', err);
  }
}
