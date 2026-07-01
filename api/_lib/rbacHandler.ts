/**
 * RBAC & Notification handler — DEX AI Technical Blueprint 07
 *
 * RBAC Routes:
 *   GET  /api/rbac/permissions             — Current user's effective permissions
 *   GET  /api/admin/role-permissions       — Full role permission matrix (admin)
 *   PUT  /api/admin/role-permissions       — Update role permission (admin)
 *   GET  /api/admin/users                  — List all users (admin)
 *   PATCH /api/admin/users/:id/role        — Change user role (admin)
 *   GET  /api/admin/permission-overrides   — List overrides (admin)
 *   POST /api/admin/permission-overrides   — Create override (admin)
 *   DELETE /api/admin/permission-overrides/:id — Remove override (admin)
 *
 * Notification Routes:
 *   GET  /api/notifications                — List user's notifications (paginated)
 *   GET  /api/notifications/unread-count   — Unread count
 *   PATCH /api/notifications/:id/read      — Mark as read
 *   PATCH /api/notifications/read-all      — Mark all as read
 *   GET  /api/notification-preferences     — Get preferences
 *   PUT  /api/notification-preferences     — Update preferences
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  selectOne,
  selectMany,
  insert,
  update,
  remove,
  isSupabaseConfigured,
  handleError,
} from './supabaseRest.js';
import { getUserFromRequest, getUserRole } from './adminAuth.js';

export const maxDuration = 30;

export async function handleRbac(req: VercelRequest, res: VercelResponse) {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    const pathArr = (req.query.path as string[]) || [];
    const resource = pathArr[0];
    const id = pathArr[1];
    const subResource = pathArr[2];

    if (resource === 'permissions' && req.method === 'GET') {
      return handleUserPermissions(req, res);
    }

    if (resource === 'notifications' && req.method === 'GET') {
      return handleListNotifications(req, res);
    }
    if (resource === 'notifications' && id === 'unread-count' && req.method === 'GET') {
      return handleUnreadCount(req, res);
    }
    if (resource === 'notifications' && id && subResource === 'read' && req.method === 'PATCH') {
      return handleMarkRead(req, res, id);
    }
    if (resource === 'notifications' && id === 'read-all' && req.method === 'PATCH') {
      return handleMarkAllRead(req, res);
    }

    if (resource === 'notification-preferences' && req.method === 'GET') {
      return handleGetPreferences(req, res);
    }
    if (resource === 'notification-preferences' && req.method === 'PUT') {
      return handleUpdatePreferences(req, res);
    }

    return res.status(404).json({ success: false, error: 'RBAC route not found' });
  } catch (err) {
    return handleError(res, 'rbac', err);
  }
}

export async function handleAdminRbac(req: VercelRequest, res: VercelResponse) {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    const pathArr = (req.query.path as string[]) || [];
    const resource = pathArr[0];
    const id = pathArr[1];
    const subResource = pathArr[2];

    const { user, error } = await getUserFromRequest(req);
    if (error || !user) return res.status(401).json({ success: false, error });

    const role = await getUserRole(user.id);
    if (role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    if (resource === 'role-permissions' && req.method === 'GET') {
      return handleListRolePermissions(req, res);
    }
    if (resource === 'role-permissions' && req.method === 'PUT') {
      return handleUpdateRolePermission(req, res);
    }

    if (resource === 'users' && req.method === 'GET') {
      return handleListUsers(req, res);
    }
    if (resource === 'users' && id && subResource === 'role' && req.method === 'PATCH') {
      return handleChangeUserRole(req, res, id);
    }

    if (resource === 'permission-overrides' && req.method === 'GET') {
      return handleListOverrides(req, res);
    }
    if (resource === 'permission-overrides' && req.method === 'POST') {
      return handleCreateOverride(req, res);
    }
    if (resource === 'permission-overrides' && id && req.method === 'DELETE') {
      return handleDeleteOverride(req, res, id);
    }

    return res.status(404).json({ success: false, error: 'Admin RBAC route not found' });
  } catch (err) {
    return handleError(res, 'admin-rbac', err);
  }
}

// ── Current User's Permissions ─────────────────────────────────────────
async function handleUserPermissions(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  const profile = await selectOne('profiles', { column: 'id', value: user.id, select: 'role' }, 10000);
  if (!profile) return res.status(404).json({ success: false, error: 'Profile not found' });

  const rolePerms = await selectMany('role_permissions', {
    role: profile.role,
    allowed: true,
  }, [], 100, 0, 'resource, action, conditions');

  const overrides = await selectMany('permission_overrides', {
    user_id: user.id,
    is_active: true,
  }, [], 100, 0, 'resource, action, allowed');

  const permissions: Record<string, boolean> = {};

  for (const p of rolePerms) {
    permissions[`${p.resource}:${p.action}`] = true;
  }

  for (const o of overrides) {
    const key = `${o.resource}:${o.action}`;
    if (o.allowed) {
      permissions[key] = true;
    } else {
      delete permissions[key];
    }
  }

  return res.json({
    success: true,
    role: profile.role,
    permissions,
  });
}

// ── List All Role Permissions (Admin) ──────────────────────────────────
async function handleListRolePermissions(req: VercelRequest, res: VercelResponse) {
  const permissions = await selectMany('role_permissions', {}, ['role', 'resource', 'action'], 500, 0, '*');
  return res.json({ success: true, permissions });
}

// ── Update Role Permission (Admin) ─────────────────────────────────────
async function handleUpdateRolePermission(req: VercelRequest, res: VercelResponse) {
  const { role, resource, action, allowed, reason } = req.body || {};

  if (!role || !resource || !action || allowed === undefined) {
    return res.status(400).json({ success: false, error: 'role, resource, action, allowed are required' });
  }

  const existing = await selectMany('role_permissions', { role, resource, action }, [], 1, 0, '*');

  const previousValue = existing[0] ? { allowed: existing[0].allowed } : null;

  let updated;
  if (existing.length > 0) {
    updated = await update('role_permissions', existing[0].id, { allowed });
  } else {
    updated = await insert('role_permissions', { role, resource, action, allowed });
  }

  const { user } = await getUserFromRequest(req);

  await insert('permission_audit_log', {
    changed_by: user.id,
    change_type: 'role_permission_update',
    target_role: role,
    resource,
    action,
    previous_value: JSON.stringify(previousValue),
    new_value: JSON.stringify({ allowed }),
    reason,
  });

  return res.json({ success: true, permission: updated });
}

// ── List All Users (Admin) ─────────────────────────────────────────────
async function handleListUsers(req: VercelRequest, res: VercelResponse) {
  const users = await selectMany('profiles', {}, ['created_at DESC'], 100, 0, 'id, full_name, email, role, created_at');
  return res.json({ success: true, users });
}

// ── Change User Role (Admin) ───────────────────────────────────────────
async function handleChangeUserRole(req: VercelRequest, res: VercelResponse, userId: string) {
  const { role, reason } = req.body || {};

  if (!role || !['admin', 'team_lead', 'consultant', 'client'].includes(role)) {
    return res.status(400).json({ success: false, error: 'Valid role is required' });
  }

  const existing = await selectOne('profiles', { column: 'id', value: userId, select: 'role' }, 10000);
  if (!existing) return res.status(404).json({ success: false, error: 'User not found' });

  const previousRole = existing.role;
  const updated = await update('profiles', userId, { role });

  const { user } = await getUserFromRequest(req);

  await insert('permission_audit_log', {
    changed_by: user.id,
    change_type: 'role_change',
    target_user_id: userId,
    previous_value: JSON.stringify({ role: previousRole }),
    new_value: JSON.stringify({ role }),
    reason,
  });

  return res.json({ success: true, user: updated });
}

// ── List Permission Overrides (Admin) ─────────────────────────────────
async function handleListOverrides(req: VercelRequest, res: VercelResponse) {
  const overrides = await selectMany('permission_overrides', { is_active: true }, ['created_at DESC'], 100, 0, '*');
  return res.json({ success: true, overrides });
}

// ── Create Permission Override (Admin) ─────────────────────────────────
async function handleCreateOverride(req: VercelRequest, res: VercelResponse) {
  const { user_id, resource, action, allowed, reason, expires_at } = req.body || {};

  if (!user_id || !resource || !action || allowed === undefined) {
    return res.status(400).json({ success: false, error: 'user_id, resource, action, allowed are required' });
  }

  const { user } = await getUserFromRequest(req);

  const override = await insert('permission_overrides', {
    user_id,
    resource,
    action,
    allowed,
    reason,
    granted_by: user.id,
    expires_at,
  });

  await insert('permission_audit_log', {
    changed_by: user.id,
    change_type: 'override_create',
    target_user_id: user_id,
    resource,
    action,
    new_value: JSON.stringify({ allowed, expires_at }),
    reason,
  });

  return res.json({ success: true, override });
}

// ── Delete Permission Override (Admin) ─────────────────────────────────
async function handleDeleteOverride(req: VercelRequest, res: VercelResponse, id: string) {
  const existing = await selectOne('permission_overrides', { column: 'id', value: id, select: '*' }, 10000);
  if (!existing) return res.status(404).json({ success: false, error: 'Override not found' });

  const { user } = await getUserFromRequest(req);

  await remove('permission_overrides', id);

  await insert('permission_audit_log', {
    changed_by: user.id,
    change_type: 'override_delete',
    target_user_id: existing.user_id,
    resource: existing.resource,
    action: existing.action,
    previous_value: JSON.stringify({ allowed: existing.allowed }),
  });

  return res.json({ success: true });
}

// ── List Notifications ─────────────────────────────────────────────────
async function handleListNotifications(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  const { page = '1', limit = '20', read, type } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const filters: Record<string, any> = { recipient_id: user.id };
  if (read !== undefined) filters.read = read === 'true';
  if (type) filters.type = type;

  const notifications = await selectMany(
    'notifications',
    filters,
    ['created_at DESC'],
    limitNum,
    offset,
    '*'
  );

  const count = await selectMany('notifications', filters, [], 1000, 0, 'id');

  return res.json({
    success: true,
    notifications,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: count.length,
      total_pages: Math.ceil(count.length / limitNum),
    },
  });
}

// ── Unread Count ───────────────────────────────────────────────────────
async function handleUnreadCount(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  const unread = await selectMany('notifications', { recipient_id: user.id, read: false }, [], 100, 0, 'id');

  return res.json({ success: true, unread_count: unread.length });
}

// ── Mark Single Notification Read ──────────────────────────────────────
async function handleMarkRead(req: VercelRequest, res: VercelResponse, id: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  const notif = await selectOne('notifications', { column: 'id', value: id, select: '*' }, 10000);
  if (!notif) return res.status(404).json({ success: false, error: 'Notification not found' });
  if (notif.recipient_id !== user.id) {
    return res.status(403).json({ success: false, error: 'Not your notification' });
  }

  await update('notifications', id, { read: true, read_at: new Date().toISOString() });
  return res.json({ success: true });
}

// ── Mark All Notifications Read ────────────────────────────────────────
async function handleMarkAllRead(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  const unread = await selectMany('notifications', { recipient_id: user.id, read: false }, [], 100, 0, 'id');

  for (const notif of unread) {
    await update('notifications', notif.id, { read: true, read_at: new Date().toISOString() });
  }

  return res.json({ success: true, updated: unread.length });
}

// ── Get Notification Preferences ───────────────────────────────────────
async function handleGetPreferences(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  const prefs = await selectMany('notification_preferences', { user_id: user.id }, [], 50, 0, '*');

  const defaultTypes = [
    'pipeline_stage_change', 'gate_blocked', 'trident_review_needed', 'canvas_review_needed',
    'client_feedback_received', 'client_access_granted', 'mandate_phase_change', 'stale_candidate',
    'match_available', 'import_complete', 'dedup_needed', 'permission_changed',
    'assignment_changed', 'mention',
  ];

  const prefMap = new Map(prefs.map(p => [p.notification_type, p]));
  const result = defaultTypes.map(type => {
    const pref = prefMap.get(type);
    return {
      type,
      in_app: pref ? pref.in_app_enabled : true,
      email: pref ? pref.email_enabled : false,
    };
  });

  return res.json({ success: true, preferences: result });
}

// ── Update Notification Preferences ────────────────────────────────────
async function handleUpdatePreferences(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  const { preferences } = req.body || {};
  if (!Array.isArray(preferences)) {
    return res.status(400).json({ success: false, error: 'preferences array is required' });
  }

  for (const pref of preferences) {
    const existing = await selectMany(
      'notification_preferences',
      { user_id: user.id, notification_type: pref.type },
      [], 1, 0, '*'
    );

    if (existing.length > 0) {
      await update('notification_preferences', existing[0].id, {
        in_app_enabled: pref.in_app,
        email_enabled: pref.email,
        updated_at: new Date().toISOString(),
      });
    } else {
      await insert('notification_preferences', {
        user_id: user.id,
        notification_type: pref.type,
        in_app_enabled: pref.in_app,
        email_enabled: pref.email,
      });
    }
  }

  return res.json({ success: true });
}
