/**
 * Admin Client Account Management handler — DEX AI Technical Blueprint 05
 *
 * Routes:
 *   POST /api/admin/client-accounts              — Create client account
 *   PATCH /api/admin/client-accounts/:id         — Update client account
 *
 * Admin-only: manage client accounts and mandate access
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  selectOne,
  selectMany,
  insert,
  update,
  isSupabaseConfigured,
  handleError,
} from './supabaseRest.js';
import { getUserFromRequest, getUserRole } from './adminAuth.js';

export const maxDuration = 30;

export async function handleAdminClientAccounts(req: VercelRequest, res: VercelResponse) {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    const pathArr = (req.query.path as string[]) || [];
    const resource = pathArr[0];
    const id = pathArr[1];

    if (resource === 'client-accounts' && req.method === 'POST') return handleCreateClientAccount(req, res);
    if (resource === 'client-accounts' && id && req.method === 'PATCH') return handleUpdateClientAccount(req, res, id);
    if (resource === 'client-accounts' && req.method === 'GET') return handleListClientAccounts(req, res);

    return res.status(404).json({ success: false, error: 'Admin client route not found' });
  } catch (err) {
    return handleError(res, 'admin-client', err);
  }
}

// ── Verify Admin ────────────────────────────────────────────────────────
async function verifyAdmin(user: any) {
  const role = await getUserRole(user.id);
  if (role !== 'admin') {
    throw new Error('Admin access required');
  }
}

// ── Create Client Account ───────────────────────────────────────────────
async function handleCreateClientAccount(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  try {
    await verifyAdmin(user);

    const { email, name, organization, title, mandate_ids } = req.body || {};

    if (!email || !name || !organization) {
      return res.status(400).json({ success: false, error: 'email, name, and organization are required' });
    }

    let clientAccount = await selectOne('client_accounts', {
      column: 'email', value: email, select: '*',
    }, 10000);

    if (!clientAccount) {
      clientAccount = await insert('client_accounts', {
        email,
        name,
        organization,
        title,
      });
    }

    if (mandate_ids && Array.isArray(mandate_ids)) {
      for (const mandateId of mandate_ids) {
        const existing = await selectOne('client_mandate_access', {
          column: 'client_account_id', value: clientAccount.id, select: '*',
        }, 5000);

        if (!existing || existing.mandate_id !== mandateId) {
          await insert('client_mandate_access', {
            client_account_id: clientAccount.id,
            mandate_id: mandateId,
            access_level: 'feedback',
          });
        }
      }
    }

    return res.json({ success: true, client_account: clientAccount });
  } catch (err: any) {
    return res.status(403).json({ success: false, error: err.message });
  }
}

// ── Update Client Account ───────────────────────────────────────────────
async function handleUpdateClientAccount(req: VercelRequest, res: VercelResponse, id: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  try {
    await verifyAdmin(user);

    const { mandate_ids, is_active, access_expires } = req.body || {};

    const updateData: Record<string, any> = {};
    if (is_active !== undefined) updateData.is_active = is_active;
    if (access_expires !== undefined) updateData.access_expires = access_expires;

    const updated = await update('client_accounts', id, updateData);

    if (mandate_ids && Array.isArray(mandate_ids)) {
      const existingAccess = await selectMany('client_mandate_access', {
        client_account_id: id,
      }, [], 50, 0, '*');

      const existingMandates = existingAccess.map((a: any) => a.mandate_id);
      const newMandates = mandate_ids.filter((m: string) => !existingMandates.includes(m));

      for (const mandateId of newMandates) {
        await insert('client_mandate_access', {
          client_account_id: id,
          mandate_id: mandateId,
          access_level: 'feedback',
        });
      }
    }

    return res.json({ success: true, client_account: updated });
  } catch (err: any) {
    return res.status(403).json({ success: false, error: err.message });
  }
}

// ── List Client Accounts ────────────────────────────────────────────────
async function handleListClientAccounts(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  try {
    await verifyAdmin(user);

    const accounts = await selectMany('client_accounts', {}, ['created_at DESC'], 50, 0, '*');

    const enriched = await Promise.all(accounts.map(async (account: any) => {
      const access = await selectMany('client_mandate_access', {
        client_account_id: account.id,
      }, [], 10, 0, '*');

      const mandates = await Promise.all(access.map(async (a: any) => {
        return selectOne('mandates', { column: 'id', value: a.mandate_id, select: 'role_title' }, 5000);
      }));

      return {
        ...account,
        mandates: mandates.filter(Boolean).map((m: any) => m.role_title),
      };
    }));

    return res.json({ success: true, client_accounts: enriched });
  } catch (err: any) {
    return res.status(403).json({ success: false, error: err.message });
  }
}
