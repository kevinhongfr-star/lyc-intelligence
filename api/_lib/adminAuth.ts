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
 *   2. Verify JWT signature using jose library (HS256)
 *      - Uses SUPABASE_JWT_SECRET environment variable
 *      - Falls back to Supabase /auth/v1/verify endpoint
 *   3. Extract the user id (sub claim) from verified payload
 *   4. Look up the matching row in `profiles` via the service role key
 *   5. For verifyAdmin: reject unless role is super_admin or lyc_admin
 *   6. For getUserFromRequest: return any authenticated user
 *
 * Note: This is a *read* of the profiles table. The service role key bypasses
 * RLS so this works even when the caller's JWT has anon-level perms.
 */

import type { VercelRequest } from '@vercel/node';
import { jwtVerify, SignJWT } from 'jose';
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

// Cache the JWT secret encoder
let _jwtSecret: TextEncoder | null = null;
function getJwtSecret(): TextEncoder {
  if (!_jwtSecret) {
    _jwtSecret = new TextEncoder();
  }
  return _jwtSecret;
}

/**
 * Verify JWT signature and extract the sub claim.
 * Uses SUPABASE_JWT_SECRET if available, otherwise falls back to Supabase's verify endpoint.
 */
async function verifyAndDecodeJwt(token: string): Promise<string | null> {
  try {
    // Option A: Verify using JWT secret (recommended for performance)
    const jwtSecret = process.env.SUPABASE_JWT_SECRET;
    if (jwtSecret && jwtSecret.length > 0) {
      const secret = getJwtSecret();
      // Supabase uses HS256
      const { payload } = await jwtVerify(token, secret, {
        algorithms: ['HS256'],
      });
      return typeof payload.sub === 'string' ? payload.sub : null;
    }

    // Option B: Fallback to Supabase's /auth/v1/verify endpoint
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      console.error('[adminAuth] Missing SUPABASE_URL or service key for JWT verification');
      return null;
    }

    const verifyRes = await fetch(`${supabaseUrl}/auth/v1/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ token }),
    });

    if (!verifyRes.ok) {
      console.warn('[adminAuth] Supabase verify returned:', verifyRes.status);
      return null;
    }

    const data = await verifyRes.json();
    return typeof data.sub === 'string' ? data.sub : null;
  } catch (err) {
    console.error('[adminAuth] JWT verification failed:', err);
    return null;
  }
}

/**
 * Decode JWT payload WITHOUT verification (for debugging/logging only).
 * DO NOT use for authentication — use verifyAndDecodeJwt instead.
 */
function decodeJwtSubUnsafe(token: string): string | null {
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
  return ['client_admin', 'client_viewer', 'lyc_consultant', 'lyc_admin', 'super_admin'].includes(role);
}

/**
 * Check if user is an org admin.
 */
export function isOrgAdmin(role: UserRole): boolean {
  return ['client_admin', 'lyc_admin', 'super_admin'].includes(role);
}
