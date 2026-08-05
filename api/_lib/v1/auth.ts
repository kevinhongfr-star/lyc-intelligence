/**
 * v1 Auth — JWT resolution + profile lookup.
 *
 * Resolves the caller from EITHER the Authorization header (Bearer token)
 * OR the httpOnly auth cookie set by `/api/v1/auth/login` + `/signup`, by:
 *   1. Extracting the token (Bearer header first, cookie as fallback)
 *   2. Calling Supabase /auth/v1/user to verify the JWT
 *   3. Fetching role + user_type from the profiles table
 *
 * Returns a V1AuthUser with both role (permission tier) and user_type
 * (portal segment — candidate, client, b2c, council, etc.).
 *
 * The JWT lives in an httpOnly cookie (not localStorage), so it is not
 * readable from JS — eliminating an entire XSS token-exfil class. The
 * Bearer header path is kept for service-to-service + integration callers.
 */

import type { VercelRequest } from '@vercel/node';
import { isSupabaseConfigured, selectOne } from '../supabaseRest.js';
import type { UserRole } from '../../../src/types/index.js';

/** Name of the httpOnly cookie that carries the Supabase access_token. */
export const AUTH_COOKIE_NAME = 'lyc_v1_token';

export type UserType =
  | 'internal'
  | 'client'
  | 'candidate'
  | 'b2c'
  | 'council'
  | 'workshop'
  | 'alumni'
  | 'partner';

export interface V1AuthUser {
  id: string;
  email: string;
  role: UserRole;
  user_type: UserType;
}

export interface AuthResult {
  user: V1AuthUser | null;
  error: string | null;
  status: number;
}

/**
 * Extract the JWT from the request.
 * Prefers the `Authorization: Bearer <token>` header; falls back to the
 * httpOnly auth cookie so browser sessions (set by /auth/login) work
 * without the client ever touching the token.
 */
export function extractToken(req: VercelRequest): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && typeof authHeader === 'string') {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match) return match[1];
  }

  // Cookie fallback — parse manually so we don't depend on a cookie parser.
  const rawCookie = req.headers.cookie;
  if (rawCookie && typeof rawCookie === 'string') {
    for (const part of rawCookie.split(';')) {
      const [name, ...rest] = part.trim().split('=');
      if (name === AUTH_COOKIE_NAME) {
        const value = rest.join('=');
        if (value) return decodeURIComponent(value);
      }
    }
  }

  return null;
}

async function verifyJwt(token: string): Promise<string | null> {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) return null;

    const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: 'GET',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.id === 'string' ? data.id : null;
  } catch {
    return null;
  }
}

/**
 * Resolve the caller from the request.
 * Returns user object on success, or error + HTTP status code on failure.
 */
export async function resolveUser(req: VercelRequest): Promise<AuthResult> {
  const token = extractToken(req);
  if (!token) {
    return { user: null, error: 'Missing authorization header', status: 401 };
  }

  if (!isSupabaseConfigured()) {
    return { user: null, error: 'Supabase not configured', status: 500 };
  }

  const userId = await verifyJwt(token);
  if (!userId) {
    return { user: null, error: 'Invalid or expired token', status: 401 };
  }

  const profile = await selectOne(
    'profiles',
    { column: 'id', value: userId, select: 'id,email,role,user_type' }
  );

  if (!profile) {
    return { user: null, error: 'Profile not found', status: 401 };
  }

  return {
    user: {
      id: profile.id,
      email: profile.email,
      role: profile.role as UserRole,
      user_type: profile.user_type as UserType,
    },
    error: null,
    status: 200,
  };
}
