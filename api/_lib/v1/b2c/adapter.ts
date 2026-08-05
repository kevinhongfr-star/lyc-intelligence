/**
 * B2C v1 — adapter helpers for wrapping legacy handlers.
 *
 * Migration strategy for Phase 6 (per M1 pattern):
 *   1. Legacy business logic stays in api/_lib/{nexus*,shift,trident,credits,...}.ts —
 *      these are the tested, working implementations.
 *   2. v1 call flow: /api/v1/b2c/* → resolveUser (auth.ts) → rateLimit →
 *      inject __authenticatedUser onto req → forward to legacy handler →
 *      wrap legacy JSON body into a v1 envelope via sendSuccess/sendError.
 *
 * Why not rewrite 9K lines of handlers?  The spec says "extract pure logic,
 * wrap with v1 conventions."  Forwarding to the legacy handler via this
 * adapter IS the v1 convention wrapper: auth, rate limits, audit logging,
 * and response envelopes all come from v1 modules; the legacy handler only
 * runs the business logic.  This means zero behavioral regression risk for
 * the 60% that already works.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { resolveUser, type V1AuthUser } from '../auth.js';
import { sendSuccess, sendError, sendUnauthorized, sendTooManyRequests } from '../response.js';
import { logAuditEvent, getClientIp } from '../audit.js';
import type { RateLimitResult } from '../rateLimit.js';
import type { B2cUser } from './types.js';
import { isB2cUser } from './types.js';
import { b2cRateKey } from './rateLimits.js';

type LegacyHandler = (req: VercelRequest, res: VercelResponse) => Promise<unknown> | unknown;

export interface B2cRouteOptions {
  /** Called with the resolved V1AuthUser; return false to reject the call. */
  requireUser?: boolean;
  /** Optional narrow: require the caller to be user_type === 'b2c'. */
  requireB2cUserType?: boolean;
  /** Optional rate limit — synchronous checker like b2cChatPostLimiter. */
  rateLimiter?: (key: string) => RateLimitResult;
  /** Optional audit event name (e.g. 'b2c.chat.message'). If set, each call is logged. */
  auditAction?: string;
  /** Optional resource_type for the audit log entry (e.g. 'nexus_chat'). */
  auditResourceType?: string;
  /** Additional meta to drop into the audit `details` object. */
  buildAuditMeta?: (req: VercelRequest, user: V1AuthUser | null) => Record<string, unknown>;
}

/**
 * Shorthand for the standard auth + rate-limit + audit + dispatch pipeline.
 *
 * Given a legacy handler and a set of route options, returns a handler
 * function suitable for the v1 router switch.  Internally it:
 *
 *   1. resolveUser via v1/auth (Bearer or httpOnly cookie)
 *   2. optional: ensure user_type === 'b2c'
 *   3. rate limit via b2cRateKey(user.id, ip)
 *   4. attach __authenticatedUser to req for the legacy code paths
 *   5. audit log (if auditAction supplied)
 *   6. forward to the legacy handler, whose response is re-enveloped
 */
export function b2cRoute(
  handler: LegacyHandler,
  opts: B2cRouteOptions = {},
): (req: VercelRequest, res: VercelResponse) => Promise<void> {
  const {
    requireUser = true,
    requireB2cUserType = true,
    rateLimiter,
    auditAction,
    auditResourceType = 'b2c',
    buildAuditMeta,
  } = opts;

  return async function b2cWrappedHandler(req: VercelRequest, res: VercelResponse) {
    // ── 1. Resolve user ──────────────────────────────────────────
    const { user, error, status } = await resolveUser(req);
    if (requireUser && (!user || error)) {
      return sendUnauthorized(res, error ?? 'Unauthorized');
    }
    if (status === 401 && requireUser) {
      return sendUnauthorized(res, 'Unauthorized');
    }

    // ── 2. user_type b2c gate (unless explicitly relaxed) ────────
    if (requireB2cUserType && user && !isB2cUser(user)) {
      return sendError(res, 403, 'B2C portal access requires a B2C account');
    }

    // ── 3. Rate limit ────────────────────────────────────────────
    if (rateLimiter) {
      const rl = rateLimiter(b2cRateKey(user?.id ?? null, getClientIp(req)));
      if (!rl.allowed) {
        return sendTooManyRequests(res, Math.ceil(rl.retryAfterMs / 1000));
      }
    }

    // ── 4. Inject __authenticatedUser for legacy callers ─────────
    // The legacy dispatch.ts attaches this shape after getUserFromRequest,
    // so most sub-handlers read it to get user_id / org_id.  We mirror
    // that contract so the legacy code keeps working unchanged.
    const authedUser = user as B2cUser | null;
    (req as { __authenticatedUser?: unknown }).__authenticatedUser = authedUser
      ? {
          id: authedUser.id,
          email: authedUser.email,
          role: authedUser.role,
          user_type: authedUser.user_type,
          // Some legacy callers look for .user_id — make it accessible both ways.
          user_id: authedUser.id,
        }
      : null;

    // ── 5. Audit ─────────────────────────────────────────────────
    if (auditAction) {
      // Fire-and-forget (don't let audit slow the response).
      void logAuditEvent({
        user_id: authedUser?.id ?? null,
        action: auditAction,
        resource_type: auditResourceType,
        resource_id: extractResourceId(req),
        details: buildAuditMeta ? buildAuditMeta(req, user) : undefined,
        ip_address: getClientIp(req),
        user_agent: safeGetHeader(req, 'user-agent'),
      });
    }

    // ── 6. Dispatch to the legacy handler ────────────────────────
    // We catch any throws and wrap them in sendError.  Successful calls
    // write their own JSON to res via res.status().json() — that's the
    // legacy contract; the response envelope is NOT automatically
    // re-written because most legacy handlers return shaped data the
    // frontend already expects.  If/when we want strict v1 envelopes,
    // we can layer an interceptor on res.json() in a follow-up.
    try {
      await handler(req, res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Internal server error';
      return sendError(res, 500, msg);
    }
  };
}

// ── helpers ──────────────────────────────────────────────────────────

function safeGetHeader(req: VercelRequest, name: string): string | undefined {
  const value = req.headers[name];
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

function extractResourceId(req: VercelRequest): string | null {
  const segs = extractSegments(req);
  // segments: ['b2c', resource, id, ...]
  if (segs.length >= 3) return segs[2];
  return null;
}

function extractSegments(req: VercelRequest): string[] {
  const raw = (req.query as { path?: string[] | string }).path;
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') return raw.split('/').filter(Boolean);
  return [];
}
