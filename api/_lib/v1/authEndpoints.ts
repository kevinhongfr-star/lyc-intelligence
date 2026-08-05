/**
 * v1 Auth endpoints — login / signup / logout / me / reset-password.
 *
 * All flows use the Supabase Auth REST API (`/auth/v1/*`) and keep the
 * resulting access_token in an httpOnly cookie (`lyc_v1_token`). The token
 * is NEVER returned to the client in the JSON body and is NEVER stored in
 * localStorage — so it cannot be exfiltrated by XSS.
 *
 * Endpoint summary:
 *   POST /auth/login           — password grant → set cookie → { user }
 *   POST /auth/signup          — create user + profile → set cookie (if
 *                                 session returned) → { user }
 *   POST /auth/logout          — clear cookie → { ok: true }
 *   GET  /auth/me              — resolve user from cookie → { user }
 *   POST /auth/reset-password  — trigger Supabase recover email → { ok: true }
 *
 * `login`/`signup`/`reset-password`/`logout` are PUBLIC (no prior auth).
 * `/auth/me` requires a valid cookie/ bearer token. The router applies the
 * stricter `authLimiter` to all of these.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { AUTH_COOKIE_NAME, resolveUser, type UserType, type V1AuthUser } from './auth.js';
import { isSupabaseConfigured, selectOne, insert } from '../supabaseRest.js';
import {
  sendSuccess,
  sendError,
  sendBadRequest,
  sendUnauthorized,
} from './response.js';
import { firstZodError, validateBody } from './validators.js';
import { logAuditEvent, getClientIp, getUserAgent } from './audit.js';
import { logWarn } from './logging.js';
import type { UserRole } from '../../../src/types/index.js';

// ─── Cookie config ────────────────────────────────────────────────

/** 7 days — matches Supabase's default access-token lifetime. */
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function isProduction(): boolean {
  const env = process.env.VERCEL_ENV || process.env.NODE_ENV;
  return env === 'production';
}

/**
 * Serialize a Set-Cookie header value for the auth cookie.
 * HttpOnly + SameSite=Lax + Path=/ always; Secure in production.
 */
function buildAuthCookie(value: string, maxAge: number): string {
  const parts = [
    `${AUTH_COOKIE_NAME}=${encodeURIComponent(value)}`,
    'Path=/',
    `Max-Age=${maxAge}`,
    'SameSite=Lax',
    'HttpOnly',
  ];
  if (isProduction()) parts.push('Secure');
  return parts.join('; ');
}

/** Set the auth cookie on the response (login / signup with session). */
export function setAuthCookie(res: VercelResponse, accessToken: string): void {
  res.setHeader('Set-Cookie', buildAuthCookie(accessToken, COOKIE_MAX_AGE_SECONDS));
}

/** Clear the auth cookie on the response (logout). */
export function clearAuthCookie(res: VercelResponse): void {
  res.setHeader('Set-Cookie', buildAuthCookie('', 0));
}

// ─── Supabase Auth REST helpers ───────────────────────────────────

function supabaseAuthUrl(path: string): string {
  const base = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  return `${base.replace(/\/$/, '')}${path}`;
}

/** Anon/public key — required as `apikey` for user-facing auth flows. */
function supabaseAnonKey(): string {
  return (
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_KEY ||
    ''
  );
}

interface SupabaseUser {
  id: string;
  email?: string;
  email_confirmed_at?: string | null;
}

interface SupabaseSession {
  access_token: string;
  refresh_token?: string;
}

interface SupabaseTokenResponse {
  access_token: string;
  refresh_token: string;
  user: SupabaseUser;
}

interface SupabaseSignupResponse {
  user: SupabaseUser | null;
  session: SupabaseSession | null;
}

/** Response shape from Supabase `/auth/v1/user` (used to confirm the token). */
interface SupabaseUserResponse {
  id: string;
  email?: string;
}

async function callSupabaseAuth<T>(
  path: string,
  body: Record<string, unknown>,
  accessToken?: string,
): Promise<{ ok: boolean; status: number; data: T | null }> {
  const url = supabaseAuthUrl(path);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: supabaseAnonKey(),
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, status: 0, data: null };
  }

  let data: T | null = null;
  try {
    data = (await res.json()) as T;
  } catch {
    data = null;
  }
  return { ok: res.ok, status: res.status, data };
}

async function fetchSupabaseUser(accessToken: string): Promise<SupabaseUserResponse | null> {
  const url = supabaseAuthUrl('/auth/v1/user');
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        apikey: supabaseAnonKey(),
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as SupabaseUserResponse;
  } catch {
    return null;
  }
}

// ─── Profile helpers ──────────────────────────────────────────────

/**
 * Load (or lazily create) the profiles row for a Supabase auth user.
 * New signups default to role `member` + the requested user_type so the
 * RLS / RBAC layer has something to gate on. Idempotent: if a profile
 * already exists we return it as-is.
 */
async function ensureProfile(
  authUser: { id: string; email?: string },
  defaults: { name?: string; user_type?: UserType },
): Promise<V1AuthUser> {
  const existing = await selectOne(
    'profiles',
    { column: 'id', value: authUser.id, select: 'id,email,role,user_type' },
  );

  if (existing) {
    return {
      id: existing.id,
      email: existing.email ?? authUser.email ?? '',
      role: existing.role as UserRole,
      user_type: existing.user_type as UserType,
    };
  }

  const user_type: UserType = defaults.user_type ?? 'b2c';
  const inserted = await insert('profiles', {
    id: authUser.id,
    email: authUser.email ?? null,
    name: defaults.name ?? null,
    role: 'member' as UserRole,
    user_type,
    created_at: new Date().toISOString(),
  });

  return {
    id: authUser.id,
    email: authUser.email ?? '',
    role: (inserted?.role as UserRole) ?? 'member',
    user_type: (inserted?.user_type as UserType) ?? user_type,
  };
}

// ─── Schemas ──────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(256),
});

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(256),
  name: z.string().min(1).max(200),
  user_type: z
    .enum(['internal', 'client', 'candidate', 'b2c', 'council', 'workshop', 'alumni', 'partner'])
    .optional(),
});

const resetPasswordSchema = z.object({
  email: z.string().email(),
});

// ─── Handlers ─────────────────────────────────────────────────────

/**
 * POST /auth/login
 * Body: { email, password }
 * Sets the httpOnly cookie + returns the resolved V1AuthUser.
 */
export async function handleAuthLogin(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!isSupabaseConfigured() || !supabaseAnonKey()) {
    return sendError(res, 500, 'Auth is not configured');
  }

  const parsed = validateBody(req, loginSchema);
  if (!parsed.success) return sendBadRequest(res, firstZodError(parsed));
  const { email, password } = parsed.data;

  const result = await callSupabaseAuth<SupabaseTokenResponse>(
    '/auth/v1/token?grant_type=password',
    { email, password },
  );

  if (!result.ok || !result.data?.access_token || !result.data?.user?.id) {
    logWarn('auth.login failed', { status: result.status, email });
    return sendUnauthorized(res, 'Invalid email or password');
  }

  setAuthCookie(res, result.data.access_token);

  const user = await ensureProfile(
    { id: result.data.user.id, email: result.data.user.email ?? email },
    { name: undefined, user_type: 'b2c' },
  );

  await logAuditEvent({
    user_id: user.id,
    action: 'auth.login',
    resource_type: 'auth',
    resource_id: user.id,
    details: { email },
    ip_address: getClientIp(req),
    user_agent: getUserAgent(req),
  });

  sendSuccess(res, { user });
}

/**
 * POST /auth/signup
 * Body: { email, password, name, user_type? }
 * Creates the Supabase auth user + a profiles row. Sets the cookie ONLY
 * if Supabase returns a session (email confirmation disabled). Otherwise
 * the client should prompt the user to confirm their email before login.
 */
export async function handleAuthSignup(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!isSupabaseConfigured() || !supabaseAnonKey()) {
    return sendError(res, 500, 'Auth is not configured');
  }

  const parsed = validateBody(req, signupSchema);
  if (!parsed.success) return sendBadRequest(res, firstZodError(parsed));
  const { email, password, name, user_type } = parsed.data;

  const result = await callSupabaseAuth<SupabaseSignupResponse>('/auth/v1/signup', {
    email,
    password,
    data: { name, user_type: user_type ?? 'b2c' },
  });

  if (!result.ok || !result.data?.user?.id) {
    const msg =
      result.data && typeof (result.data as { msg?: string; message?: string }).msg === 'string'
        ? (result.data as { msg?: string }).msg!
        : result.data && typeof (result.data as { message?: string }).message === 'string'
          ? (result.data as { message?: string }).message!
          : 'Signup failed';
    logWarn('auth.signup failed', { status: result.status, email });
    return sendError(res, result.status >= 400 && result.status < 500 ? result.status : 400, msg);
  }

  const authUser = result.data.user;
  const session = result.data.session;

  // Always ensure a profile exists (even pre-confirmation).
  const user = await ensureProfile(
    { id: authUser.id, email: authUser.email ?? email },
    { name, user_type: user_type ?? 'b2c' },
  );

  if (session?.access_token) {
    setAuthCookie(res, session.access_token);
  }

  await logAuditEvent({
    user_id: user.id,
    action: 'auth.signup',
    resource_type: 'auth',
    resource_id: user.id,
    details: { email, user_type: user.user_type, confirmed: Boolean(authUser.email_confirmed_at) },
    ip_address: getClientIp(req),
    user_agent: getUserAgent(req),
  });

  sendSuccess(res, { user });
}

/**
 * POST /auth/logout
 * Clears the auth cookie. No server-side session to revoke (Supabase JWTs
 * are stateless); the cookie removal is what ends the browser session.
 */
export async function handleAuthLogout(req: VercelRequest, res: VercelResponse): Promise<void> {
  // Best-effort audit — resolve the user from the cookie if still present.
  const { user } = await resolveUser(req);
  if (user) {
    await logAuditEvent({
      user_id: user.id,
      action: 'auth.logout',
      resource_type: 'auth',
      resource_id: user.id,
      ip_address: getClientIp(req),
      user_agent: getUserAgent(req),
    });
  }

  clearAuthCookie(res);
  sendSuccess(res, { ok: true as const });
}

/**
 * GET /auth/me
 * Resolves the current user from the cookie (or Bearer header). Returns
 * 401 when unauthenticated — the client `useAuth` hook treats 401 as
 * "no user" rather than an error.
 */
export async function handleAuthMe(req: VercelRequest, res: VercelResponse): Promise<void> {
  const { user, status } = await resolveUser(req);
  if (!user) {
    return sendError(res, status, 'Unauthorized');
  }
  sendSuccess(res, { user });
}

/**
 * POST /auth/reset-password
 * Body: { email }
 * Triggers Supabase's recover-email flow. ALWAYS returns ok (even if the
 * address is unknown) so we don't leak which accounts exist.
 */
export async function handleAuthResetPassword(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (!isSupabaseConfigured() || !supabaseAnonKey()) {
    return sendError(res, 500, 'Auth is not configured');
  }

  const parsed = validateBody(req, resetPasswordSchema);
  if (!parsed.success) return sendBadRequest(res, firstZodError(parsed));
  const { email } = parsed.data;

  // We intentionally do NOT await surfacing failures — see note above.
  await callSupabaseAuth<{ ok: true }>('/auth/v1/recover', { email });

  sendSuccess(res, { ok: true as const });
}

/** Re-exported for tests + the router. */
export { fetchSupabaseUser };
