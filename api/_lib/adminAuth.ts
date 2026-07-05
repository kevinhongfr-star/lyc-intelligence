/**
 * Admin auth helper — verifies the caller's Supabase JWT and confirms admin role.
 *
 * Usage in a Vercel handler:
 *
 *   import { verifyAdmin, getUserFromRequest } from '../_lib/adminAuth.js';
 *
 *   const { user, error } = await verifyAdmin(req);
 *   if (error || !user) {
 *     return res.status(401).json({ success: false, error: error || 'Unauthorized' });
 *   }
 *   // user.id, user.email, user.role available
 *
 * Flow:
 *   1. Read `Authorization: Bearer <jwt>` header
 *   2. Verify JWT by calling Supabase /auth/v1/user endpoint
 *      (works with both HS256 and ES256 JWTs — no local secret needed)
 *   3. Extract the user id from the verified response
 *   4. Look up the matching row in `profiles` via the service role key
 *   5. For verifyAdmin: reject unless role is super_admin or lyc_admin
 *   6. For getUserFromRequest: return any authenticated user
 *
 * Note: This is a *read* of the profiles table. The service role key bypasses
 * RLS so this works even when the caller's JWT has anon-level perms.
 */

import type { VercelRequest } from '@vercel/node';
import { isSupabaseConfigured, selectOne } from './supabaseRest.js';
import type { UserRole } from '../../src/types/index.js';

export interface AdminUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthResult {
  user: AdminUser | null;
  error: string | null;
}

/**
 * Verify JWT by calling Supabase's /auth/v1/user endpoint.
 * This works regardless of JWT signing algorithm (HS256, ES256, etc.)
 * because Supabase handles verification internally.
 */
async function verifyAndDecodeJwt(token: string): Promise<string | null> {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      console.error('[adminAuth] Missing SUPABASE_URL or service key');
      return null;
    }

    // Call /auth/v1/user with the user's JWT as bearer token
    // If the JWT is valid, Supabase returns the user object
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: 'GET',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!userRes.ok) {
      console.warn(`[adminAuth] /auth/v1/user returned ${userRes.status}`);
      return null;
    }

    const userData = await userRes.json();
    return typeof userData.id === 'string' ? userData.id : null;
  } catch (err) {
    console.error('[adminAuth] JWT verification failed:', err);
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

  // Verify JWT signature and extract user ID
  const userId = await verifyAndDecodeJwt(token);
  if (!userId) {
    return { user: null, error: 'Invalid or expired JWT' };
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
    if (profile.role !== 'super_admin' && profile.role !== 'lyc_admin') {
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

  // Verify JWT signature and extract user ID
  const userId = await verifyAndDecodeJwt(token);
  if (!userId) {
    return { user: null, error: 'Invalid or expired JWT' };
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
  return ['client_admin', 'client_viewer', 'lyc_consultant', 'lyc_admin', 'super_admin', 'admin'].includes(role);
}

/**
 * Check if user is an org admin.
 */
export function isOrgAdmin(role: UserRole): boolean {
  return ['client_admin', 'lyc_admin', 'super_admin', 'admin'].includes(role);
}

/**
 * Get user's role from the profiles table.
 */
export async function getUserRole(userId: string): Promise<UserRole> {
  if (!isSupabaseConfigured()) {
    return 'member'; // Default fallback
  }
  try {
    const profile = await selectOne('profiles', {
      column: 'id',
      value: userId,
      select: 'role',
    });
    return (profile?.role as UserRole) || 'member';
  } catch {
    return 'member';
  }
}

/**
 * Check if user has admin role (super_admin or lyc_admin).
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === 'super_admin' || role === 'lyc_admin' || role === 'admin';
}

/**
 * Check if user has team lead or admin role.
 */
export function isTeamLead(role: UserRole): boolean {
  return role === 'team_lead' || role === 'admin' || role === 'lyc_admin' || role === 'super_admin';
}
