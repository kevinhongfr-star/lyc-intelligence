/**
 * Admin auth helper — verifies the caller's Supabase JWT and confirms admin role.
 *
 * Usage in a Vercel handler:
 *
 *   import { verifyAdmin } from '../_lib/adminAuth.js';
 *
 *   const { user, error } = await verifyAdmin(req);
 *   if (error || !user) {
 *     return res.status(401).json({ success: false, error: error || 'Unauthorized' });
 *   }
 *   // user.id, user.email, user.role available
 *
 * Flow:
 *   1. Read `Authorization: Bearer <jwt>` header
 *   2. Decode the JWT payload (base64url) to extract the user id (sub claim).
 *      No signature verification here — Supabase REST will reject forged tokens
 *      on every subsequent query.
 *   3. Look up the matching row in `profiles` via the service role key.
 *   4. Reject unless `role === 'super_admin'`.
 *
 * Note: This is a *read* of the profiles table. The service role key bypasses
 * RLS so this works even when the caller's JWT has anon-level perms.
 */

import type { VercelRequest } from '@vercel/node';
import { isSupabaseConfigured, selectOne } from './supabaseRest.js';
import type { UserRole } from '@/types';

export interface AdminUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthResult {
  user: AdminUser | null;
  error: string | null;
}

function decodeJwtSub(token: string): string | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4 !== 0) b64 += '=';
    const json = Buffer.from(b64, 'base64').toString('utf-8');
    const payload = JSON.parse(json);
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}

export async function verifyAdmin(req: VercelRequest): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return { user: null, error: 'Supabase not configured on server' };
  }
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return { user: null, error: 'Missing or invalid Authorization header' };
  }
  const token = auth.slice(7).trim();
  if (!token) return { user: null, error: 'Empty bearer token' };

  const userId = decodeJwtSub(token);
  if (!userId) {
    return { user: null, error: 'Invalid JWT format (no sub claim)' };
  }

  try {
    const profile = await selectOne('profiles', {
      column: 'id',
      value: userId,
      select: 'id,email,role',
    });
    if (!profile) {
      return { user: null, error: 'Profile not found for this user' };
    }
    if (profile.role !== 'super_admin') {
      return { user: null, error: 'Admin access required' };
    }
    return { user: profile as AdminUser, error: null };
  } catch (err: any) {
    return { user: null, error: `Auth lookup failed: ${err?.message || 'unknown'}` };
  }
}

/**
 * Extract user from JWT — any authenticated user, no admin check.
 * Returns the user's id, email, and role from the profiles table.
 */
export async function getUserFromRequest(req: VercelRequest): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return { user: null, error: 'Supabase not configured on server' };
  }
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return { user: null, error: 'Missing or invalid Authorization header' };
  }
  const token = auth.slice(7).trim();
  if (!token) return { user: null, error: 'Empty bearer token' };

  const userId = decodeJwtSub(token);
  if (!userId) {
    return { user: null, error: 'Invalid JWT format (no sub claim)' };
  }

  try {
    const profile = await selectOne('profiles', {
      column: 'id',
      value: userId,
      select: 'id,email,role',
    });
    if (!profile) {
      return { user: null, error: 'Profile not found for this user' };
    }
    return { user: profile as AdminUser, error: null };
  } catch (err: any) {
    return { user: null, error: `Auth lookup failed: ${err?.message || 'unknown'}` };
  }
}

/**
 * Check if user has org-level access permissions.
 */
export function hasOrgAccess(role: UserRole): boolean {
  return ['client_admin', 'client_viewer', 'lyc_consultant', 'lyc_admin', 'super_admin'].includes(role);
}

/**
 * Check if user is an org admin.
 */
export function isOrgAdmin(role: UserRole): boolean {
  return ['client_admin', 'lyc_admin', 'super_admin'].includes(role);
}