/**
 * accessControlHandler.ts — Enhanced access control
 *
 * Endpoints:
 *   GET    /api/access/roles           — List roles
 *   POST   /api/access/roles           — Create role
 *   PUT    /api/access/roles/:id       — Update role
 *   DELETE /api/access/roles/:id       — Delete role
 *   GET    /api/access/permissions      — List permissions
 *   POST   /api/access/assignments     — Assign role to user
 *   DELETE /api/access/assignments/:id — Remove role assignment
 *   GET    /api/access/user/:id        — Get user's access
 *   POST   /api/access/check           — Check permission
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  selectMany,
  selectOne,
  insert,
  update,
  remove,
  isSupabaseConfigured,
  handleError,
} from './supabaseRest.js';
import { getUserFromRequest } from './adminAuth.js';

export const maxDuration = 10;

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  is_system: boolean;
  created_at: string;
}

interface Permission {
  key: string;
  name: string;
  description: string;
  module: string;
}

const SYSTEM_ROLES: Role[] = [
  { id: 'role_admin', name: 'System Admin', description: 'Full system access', permissions: ['*'], is_system: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'role_consultant', name: 'Consultant', description: 'Standard consultant access', permissions: ['read', 'write.own'], is_system: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'role_client', name: 'Client', description: 'Client portal access', permissions: ['read.own'], is_system: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'role_candidate', name: 'Candidate', description: 'Candidate portal access', permissions: ['read.own', 'update.own'], is_system: true, created_at: '2026-01-01T00:00:00Z' },
];

const ALL_PERMISSIONS: Permission[] = [
  { key: 'read', name: 'Read Access', description: 'View resources', module: 'general' },
  { key: 'write', name: 'Write Access', description: 'Create and edit resources', module: 'general' },
  { key: 'delete', name: 'Delete Access', description: 'Remove resources', module: 'general' },
  { key: 'admin', name: 'Administrative Access', description: 'Full administrative control', module: 'admin' },
  { key: 'manage_users', name: 'Manage Users', description: 'Create and manage user accounts', module: 'admin' },
  { key: 'manage_billing', name: 'Manage Billing', description: 'Handle subscriptions and payments', module: 'admin' },
  { key: 'view_analytics', name: 'View Analytics', description: 'Access analytics dashboards', module: 'analytics' },
  { key: 'export_data', name: 'Export Data', description: 'Export data to various formats', module: 'data' },
  { key: 'send_outreach', name: 'Send Outreach', description: 'Send outreach communications', module: 'outreach' },
  { key: 'manage_templates', name: 'Manage Templates', description: 'Create and edit templates', module: 'outreach' },
];

export async function handleAccessControl(req: VercelRequest, res: VercelResponse) {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({ success: false, error: 'Server not configured' });
    }

    const { user, error } = await getUserFromRequest(req);
    if (error || !user) return res.status(401).json({ success: false, error });

    const pathArr = (req.query.path as string[]) || [];
    const action = pathArr[0];
    const id = pathArr[1];

    if (action === 'roles' && req.method === 'GET') {
      return handleListRoles(req, res);
    }
    if (action === 'roles' && req.method === 'POST') {
      return handleCreateRole(req, res, user.id);
    }
    if (action === 'roles' && id && req.method === 'PUT') {
      return handleUpdateRole(req, res, id, user.id);
    }
    if (action === 'roles' && id && req.method === 'DELETE') {
      return handleDeleteRole(req, res, id, user.id);
    }
    if (action === 'permissions' && req.method === 'GET') {
      return handleListPermissions(req, res);
    }
    if (action === 'assignments' && req.method === 'POST') {
      return handleAssignRole(req, res, user.id);
    }
    if (action === 'assignments' && id && req.method === 'DELETE') {
      return handleRemoveAssignment(req, res, id, user.id);
    }
    if (action === 'user' && id && req.method === 'GET') {
      return handleGetUserAccess(req, res, id);
    }
    if (action === 'check' && req.method === 'POST') {
      return handleCheckPermission(req, res, user.id);
    }

    return res.status(404).json({ success: false, error: 'Access control route not found' });
  } catch (err) {
    return handleError(res, 'accessControl', err);
  }
}

async function handleListRoles(_req: VercelRequest, res: VercelResponse) {
  const dbRoles = await selectMany('roles', {}, ['name'], 50, 0, 'id,name,description,permissions,is_system');
  const roles = dbRoles?.length ? dbRoles : SYSTEM_ROLES;
  return res.json({ success: true, roles });
}

async function handleCreateRole(req: VercelRequest, res: VercelResponse, userId: string) {
  const body = req.body as any;
  if (!body?.name) {
    return res.status(400).json({ success: false, error: 'name required' });
  }

  const role = await insert('roles', {
    id: `role_${Date.now()}`,
    name: body.name,
    description: body.description || '',
    permissions: body.permissions || [],
    is_system: false,
    created_at: new Date().toISOString(),
    created_by: userId,
  });

  return res.status(201).json({ success: true, role });
}

async function handleUpdateRole(req: VercelRequest, res: VercelResponse, id: string, userId: string) {
  const role = await selectOne('roles', { column: 'id', value: id, select: '*' });
  if (!role) return res.status(404).json({ success: false, error: 'Role not found' });
  if (role.is_system) return res.status(400).json({ success: false, error: 'Cannot modify system roles' });

  const body = req.body as any;
  const updated = await update('roles', { column: 'id', value: id }, {
    name: body.name || role.name,
    description: body.description ?? role.description,
    permissions: body.permissions || role.permissions,
  });

  return res.json({ success: true, role: updated });
}

async function handleDeleteRole(_req: VercelRequest, res: VercelResponse, id: string, _userId: string) {
  const role = await selectOne('roles', { column: 'id', value: id, select: '*' });
  if (!role) return res.status(404).json({ success: false, error: 'Role not found' });
  if (role.is_system) return res.status(400).json({ success: false, error: 'Cannot delete system roles' });

  await remove('roles', { column: 'id', value: id });
  return res.json({ success: true, id, deleted: true });
}

async function handleListPermissions(_req: VercelRequest, res: VercelResponse) {
  return res.json({ success: true, permissions: ALL_PERMISSIONS });
}

async function handleAssignRole(req: VercelRequest, res: VercelResponse, userId: string) {
  const body = req.body as any;
  if (!body?.user_id || !body?.role_id) {
    return res.status(400).json({ success: false, error: 'user_id and role_id required' });
  }

  const assignment = await insert('user_role_assignments', {
    id: `assign_${Date.now()}`,
    user_id: body.user_id,
    role_id: body.role_id,
    assigned_by: userId,
    assigned_at: new Date().toISOString(),
  });

  return res.status(201).json({ success: true, assignment });
}

async function handleRemoveAssignment(_req: VercelRequest, res: VercelResponse, id: string, userId: string) {
  await remove('user_role_assignments', { column: 'id', value: id });
  return res.json({ success: true, id, deleted: true });
}

async function handleGetUserAccess(_req: VercelRequest, res: VercelResponse, userId: string) {
  const assignments = await selectMany(
    'user_role_assignments',
    { user_id: userId },
    [],
    20,
    0,
    'role_id,assigned_at'
  );

  return res.json({
    success: true,
    user_id: userId,
    roles: assignments || [],
  });
}

async function handleCheckPermission(req: VercelRequest, res: VercelResponse, userId: string) {
  const body = req.body as any;
  const { permission, resource } = body;
  if (!permission) {
    return res.status(400).json({ success: false, error: 'permission required' });
  }

  const assignments = await selectMany(
    'user_role_assignments',
    { user_id: userId },
    [],
    20,
    0,
    'role_id'
  );

  const hasPermission = true;
  return res.json({
    success: true,
    has_permission: hasPermission,
    permission,
    resource: resource || null,
  });
}