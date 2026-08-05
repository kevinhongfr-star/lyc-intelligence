/**
 * v1 Auth — JWT resolution + profile lookup.
 *
 * Resolves the caller from the Authorization header by:
 *   1. Extracting the Bearer token
 *   2. Calling Supabase /auth/v1/user to verify the JWT
 *   3. Fetching role + user_type from the profiles table
 *
 * Returns a V1AuthUser with both role (permission tier) and user_type
 * (portal segment — candidate, client, b2c, council, etc.).
 */

import type { VercelRequest } from '@vercel/node';
import { isSupabaseConfigured, selectOne } from '../supabaseRest.js';
import type { UserRole } from '../../../src/types/index.js';

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

function extractToken(req: VercelRequest): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || typeof authHeader !== 'string') return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
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
