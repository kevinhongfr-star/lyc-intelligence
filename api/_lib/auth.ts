/**
 * Phase 16 / P0-3 — shared serverless function auth helpers.
 *
 * All /api/* endpoints (other than truly anonymous ones: og, events bulk-sink,
 * and public asset hosts) should go through `getAuthorizedContext()` which:
 *   1. Parses and verifies the Supabase JWT from Authorization: Bearer <token>
 *   2. Resolves the full user profile (role, organization_id) from the DB
 *   3. Returns a typed AuthContext — or throws RequestAuthError on failure
 *
 * This is the single source of truth for role + org scoping enforcement on
 * serverless functions. Client-side checks (route guards) are UX-only.
 */

import type { VercelRequest } from '@vercel/node';
import { createClient } from '../../src/lib/supabase/server';

export type RoleKey =
  | 'admin' | 'lyc_admin' | 'super_admin'
  | 'consultant' | 'lyc_consultant'
  | 'client_admin' | 'client_viewer' | 'client'
  | 'member' | 'leader' | 'candidate'
  | string;

export interface AuthContext {
  userId: string;
  email: string | null;
  role: RoleKey;
  organizationId: string | null;
  tier: string | null;
  profileId?: string;
}

export class RequestAuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
    this.name = 'RequestAuthError';
  }
}

const BEARER = /^Bearer\s+(.+)$/i;

export function extractToken(req: VercelRequest): string | null {
  const header = (req.headers['authorization'] || req.headers['Authorization']) as string | undefined;
  if (!header) return null;
  const m = BEARER.exec(header.trim());
  return m ? m[1] : null;
}

/**
 * Returns verified auth context for the incoming request.
 *
 * All functions are on the Vercel Node runtime and use the Supabase service
 * role key — they MUST re-check role + org because the caller could be
 * anybody with a valid JWT. RLS policies also exist on the tables, but this
 * is our second enforcement gate before making queries.
 *
 * @param req - Vercel incoming request
 * @param allowAnonymous - if true, returns null instead of throwing on missing/invalid auth
 */
export async function getAuthorizedContext(
  req: VercelRequest,
  allowAnonymous = false,
): Promise<AuthContext | null> {
  const supabase = createClient();

  const token = extractToken(req);
  if (!token) {
    if (allowAnonymous) return null;
    throw new RequestAuthError('Missing Authorization header');
  }

  // Verify JWT via Supabase auth.getUser() — this hits Supabase's auth
  // service (centralized source of truth), not a local decode. Safe even
  // if an attacker crafts a JWT with a modified `role` claim.
  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData?.user) {
    if (allowAnonymous) return null;
    throw new RequestAuthError('Invalid or expired token', 401);
  }

  const user = userData.user;
  const userId = user.id;

  // Resolve profile (role + org) — single canonical source of truth.
  // app_metadata claims are a secondary fallback but profiles table wins.
  let role: RoleKey = (user as any)?.app_metadata?.role ?? 'leader';
  let organizationId: string | null = (user as any)?.app_metadata?.organization_id ?? null;
  let tier: string | null = null;

  try {
    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('role, organization_id, tier, id, email')
      .eq('id', userId)
      .limit(1)
      .maybeSingle();

    if (!pErr && profile) {
      if (profile.role) role = profile.role as RoleKey;
      if (profile.organization_id) organizationId = profile.organization_id;
      if (profile.tier) tier = profile.tier;
    }
  } catch {
    // profiles table might not exist in dev — fall back to app_metadata
  }

  return {
    userId,
    email: user.email ?? null,
    role,
    organizationId,
    tier,
  };
}

// ─────────── Role taxonomy helpers (mirrors services/portalClassification.ts) ───────────

export function isAdminRole(role?: RoleKey | null): boolean {
  if (!role) return false;
  return ['admin', 'lyc_admin', 'super_admin'].includes(role);
}
export function isConsultantRole(role?: RoleKey | null): boolean {
  if (!role) return false;
  return isAdminRole(role) || ['consultant', 'lyc_consultant'].includes(role);
}
export function isClientRole(role?: RoleKey | null): boolean {
  if (!role) return false;
  return ['client', 'client_admin', 'client_viewer'].includes(role);
}
export function isInternalStaff(role?: RoleKey | null): boolean {
  return isConsultantRole(role) || isAdminRole(role);
}
export function isLeaderRole(role?: RoleKey | null): boolean {
  if (!role) return true; // unclassified defaults to leader
  return !isInternalStaff(role) && !isClientRole(role);
}

/**
 * Scope-checker: throws 403 unless the caller passes one of the allowed
 * role predicates and/or org ownership. Every data-access function should
 * call this AFTER `getAuthorizedContext()`.
 */
export function enforceScope(ctx: AuthContext, opts: {
  allow?: Array<'admin' | 'consultant' | 'client' | 'leader' | 'candidate'>;
  requireOrgMatchWith?: string | null; // column value to compare against ctx.organizationId
  ownerUserId?: string | null;         // if set, record owner bypasses role checks
}): void {
  const { allow = [], requireOrgMatchWith, ownerUserId } = opts;

  if (ownerUserId && ownerUserId === ctx.userId) return; // self-access OK

  let pass = false;
  for (const r of allow) {
    if (r === 'admin' && isAdminRole(ctx.role)) pass = true;
    if (r === 'consultant' && isConsultantRole(ctx.role)) pass = true;
    if (r === 'client' && isClientRole(ctx.role)) pass = true;
    if ((r === 'leader' || r === 'candidate') && isLeaderRole(ctx.role)) pass = true;
  }

  if (!pass) {
    throw new RequestAuthError(
      `Role "${ctx.role}" not allowed for this endpoint`,
      403,
    );
  }

  // For client viewers, enforce org isolation even when role predicate passes.
  // Admins + consultants are exempt (they need cross-org visibility).
  if (requireOrgMatchWith !== undefined && isClientRole(ctx.role)) {
    if (!ctx.organizationId || String(requireOrgMatchWith) !== String(ctx.organizationId)) {
      throw new RequestAuthError('Organization scope mismatch', 403);
    }
  }
}
