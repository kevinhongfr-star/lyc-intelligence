/**
 * adminUserManagement.ts — Admin user CRUD, invite, deactivate, password reset.
 *
 * Provides server-side functions for managing platform users:
 * list, get by id, create (invite), update, deactivate, re-enable,
 * admin-initiated password reset, and permanent deletion.
 *
 * All functions assume the caller is already authed as an admin via
 * verifyAdmin() in the handler layer. This module does not re-check RBAC.
 */

import {
  selectOne,
  selectMany,
  insert,
  update,
  remove,
  createAuthUser,
  handleError,
  isSupabaseConfigured,
} from './supabaseRest.js';

export interface AdminUserRecord {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  status: 'active' | 'invited' | 'disabled';
  created_at: string;
  last_login: string | null;
  org_id: string | null;
  avatar_url: string | null;
  title: string | null;
}

export interface CreateUserInput {
  email: string;
  full_name?: string;
  role: string;
  org_id?: string;
  title?: string;
  send_invite?: boolean;
}

export interface UpdateUserInput {
  full_name?: string;
  role?: string;
  title?: string;
  avatar_url?: string;
  org_id?: string;
}

export interface ListUsersFilters {
  status?: 'active' | 'invited' | 'disabled';
  role?: string;
  org_id?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

const VALID_ROLES = [
  'admin',
  'partner',
  'consultant',
  'recruiter',
  'analyst',
  'lyc_admin',
  'lyc_consultant',
  'super_admin',
  'team_lead',
  'member',
  'candidate',
  'client_admin',
  'client_viewer',
];

function validateRole(role: string): boolean {
  return VALID_ROLES.includes(role);
}

export async function listUsers(
  filters: ListUsersFilters = {}
): Promise<{ users: AdminUserRecord[]; total: number }> {
  if (!isSupabaseConfigured()) {
    return { users: [], total: 0 };
  }

  const where: { column: string; value: any; op?: string }[] = [];

  if (filters.status) {
    where.push({ column: 'status', value: filters.status, op: 'eq' });
  }
  if (filters.role) {
    where.push({ column: 'role', value: filters.role, op: 'eq' });
  }
  if (filters.org_id) {
    where.push({ column: 'org_id', value: filters.org_id, op: 'eq' });
  }
  if (filters.search) {
    const term = `%${filters.search}%`;
    where.push({ column: 'full_name', value: term, op: 'ilike' });
    where.push({ column: 'email', value: term, op: 'ilike' });
  }

  const users = await selectMany('profiles', {
    select: 'id,email,full_name,role,status,created_at,last_login,org_id,avatar_url,title',
    where: where.length > 0 ? where : undefined,
    orderBy: { column: 'created_at', ascending: false },
    limit: filters.limit ?? 50,
    offset: filters.offset ?? 0,
  });

  return { users: users as AdminUserRecord[], total: users.length };
}

export async function getUser(userId: string): Promise<AdminUserRecord | null> {
  if (!isSupabaseConfigured()) return null;
  const profile = await selectOne('profiles', {
    column: 'id',
    value: userId,
    select: 'id,email,full_name,role,status,created_at,last_login,org_id,avatar_url,title',
  });
  return profile as AdminUserRecord | null;
}

export async function createUser(
  input: CreateUserInput,
  adminId: string
): Promise<AdminUserRecord> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }
  if (!input.email || !input.email.includes('@')) {
    throw new Error('Valid email is required');
  }
  if (!validateRole(input.role)) {
    throw new Error(`Invalid role: ${input.role}`);
  }

  const existing = await selectOne('profiles', {
    column: 'email',
    value: input.email.toLowerCase(),
    select: 'id,email',
  });
  if (existing) {
    throw new Error(`User with email ${input.email} already exists`);
  }

  const tempPassword =
    Math.random().toString(36).slice(2) +
    Math.random().toString(36).slice(2) +
    'Aa1!';

  try {
    await createAuthUser(input.email, tempPassword, {
      email_confirm: input.send_invite ?? true,
      user_metadata: { role: input.role },
    });
  } catch (err: any) {
    throw new Error(`Failed to create auth user: ${err.message || err}`);
  }

  const profile = await insert('profiles', {
    email: input.email.toLowerCase(),
    full_name: input.full_name || null,
    role: input.role,
    status: 'invited',
    org_id: input.org_id || null,
    title: input.title || null,
    created_at: new Date().toISOString(),
  });

  await logAdminAction(adminId, 'user.create', {
    target_email: input.email,
    target_role: input.role,
  });

  return profile as AdminUserRecord;
}

export async function updateUser(
  userId: string,
  input: UpdateUserInput,
  adminId: string
): Promise<AdminUserRecord> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const updates: Record<string, any> = {};
  if (input.full_name !== undefined) updates.full_name = input.full_name;
  if (input.role !== undefined) {
    if (!validateRole(input.role)) {
      throw new Error(`Invalid role: ${input.role}`);
    }
    updates.role = input.role;
  }
  if (input.title !== undefined) updates.title = input.title;
  if (input.avatar_url !== undefined) updates.avatar_url = input.avatar_url;
  if (input.org_id !== undefined) updates.org_id = input.org_id;

  if (Object.keys(updates).length === 0) {
    const current = await getUser(userId);
    if (!current) throw new Error('User not found');
    return current;
  }

  const result = await update('profiles', { column: 'id', value: userId }, updates);
  const updated = result[0];
  if (!updated) throw new Error('User not found');

  await logAdminAction(adminId, 'user.update', {
    target_user_id: userId,
    changes: Object.keys(updates),
  });

  return updated as AdminUserRecord;
}

export async function deactivateUser(
  userId: string,
  adminId: string
): Promise<AdminUserRecord> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const result = await update(
    'profiles',
    { column: 'id', value: userId },
    { status: 'disabled' }
  );
  const updated = result[0];
  if (!updated) throw new Error('User not found');

  await logAdminAction(adminId, 'user.deactivate', {
    target_user_id: userId,
  });

  return updated as AdminUserRecord;
}

export async function reactivateUser(
  userId: string,
  adminId: string
): Promise<AdminUserRecord> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const result = await update(
    'profiles',
    { column: 'id', value: userId },
    { status: 'active' }
  );
  const updated = result[0];
  if (!updated) throw new Error('User not found');

  await logAdminAction(adminId, 'user.reactivate', {
    target_user_id: userId,
  });

  return updated as AdminUserRecord;
}

export async function adminResetPassword(
  userId: string,
  adminId: string
): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const user = await getUser(userId);
  if (!user) throw new Error('User not found');

  const newPassword =
    Math.random().toString(36).slice(2) +
    Math.random().toString(36).slice(2) +
    'Rst!';

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const serviceKey =
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: newPassword }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Password reset failed: ${res.status} ${text}`);
    }

    await logAdminAction(adminId, 'user.password_reset', {
      target_user_id: userId,
    });

    return {
      success: true,
      message: `Password reset for ${user.email}. New password: ${newPassword}`,
    };
  } catch (err: any) {
    throw new Error(`Failed to reset password: ${err.message || err}`);
  }
}

export async function deleteUser(
  userId: string,
  adminId: string
): Promise<{ success: boolean }> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const serviceKey =
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    });

    if (!res.ok && res.status !== 404) {
      const text = await res.text().catch(() => '');
      throw new Error(`Failed to delete auth user: ${res.status} ${text}`);
    }
  } catch (err: any) {
    if (!err.message?.includes('404')) {
      throw new Error(`Failed to delete auth user: ${err.message || err}`);
    }
  }

  await remove('profiles', { column: 'id', value: userId });

  await logAdminAction(adminId, 'user.delete', {
    target_user_id: userId,
  });

  return { success: true };
}

async function logAdminAction(
  actorId: string,
  action: string,
  metadata: Record<string, any>
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    await insert('audit_logs', {
      actor_id: actorId,
      action,
      entity_type: 'user',
      entity_id: metadata.target_user_id || metadata.target_email || null,
      metadata,
      created_at: new Date().toISOString(),
    });
  } catch {
    // Audit log failure should not block the operation
    console.warn('[adminUserManagement] Failed to write audit log for', action);
  }
}

export { VALID_ROLES };
