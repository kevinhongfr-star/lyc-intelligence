/**
 * /api/data/[entity] — Scoped data-access endpoint.
 *
 * URL param entity: one of the allow-listed tables below.
 * Query string: select (columns csv), eq (col:value), neq, gt, lt, order (col[:asc|desc]),
 *               limit (100 default, 500 max), offset.
 * Request body (POST only): { filters: [{col,op,value}], upsert: { ...record } }
 *
 * Security:
 *   - Authorization: Bearer <supabase JWT> (required)
 *   - Role scoping per entity (see ENTITY_ACL below)
 *   - Client-role users automatically filter by organization_id column when present
 *   - Leader/self rows: auto-filter user_id = authUserId where the column exists
 *   - No cross-org access permitted for client users
 *
 * This endpoint is not a free-form SQL proxy — selectable entities are
 * allow-listed and mutations are restricted to role + ownership checks.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '../lib/supabase-rest.js';
import {
  AuthContext,
  enforceScope,
  getAuthorizedContext,
  isClientRole,
  isAdminRole,
  isConsultantRole,
  isScopedConsultantRole,
  isLeaderRole,
  RequestAuthError,
} from '../lib/auth.js';
import {
  assertBodySize,
  assertColumnName,
  assertEntityName,
  assertUrlLength,
  DEFAULT_BODY_LIMIT,
  handleApiError,
  logServerError,
  parseFilters,
  parseJsonBody,
  parseOrderParam,
  parseSelectList,
  safeErrorMessage,
  safeErrorStatus,
  sanitizeObject,
  rateLimit,
  setRateLimitHeaders,
} from '../lib/validate.js';
import { z } from 'zod';

// ── V3-6 / #1347 Consultant-entity block list ─────────────────────────────
// Consultant / B2B-internal entities are NEVER exposed to the public or
// B2C unauthenticated users. These tables require auth + admin OR
// consultant role — leader/candidate/client viewer always 403.

const CONSULTANT_ONLY_ENTITIES = new Set([
  'consultants',
  'consultant_profiles',
  'consultant_performance',
  'consultant_assignments',
  'mandates',
  'mandate_matches',
  'pipeline_stages',
  'mandate_timelines',
]);

function isConsultantOnlyEntity(entity: string): boolean {
  if (CONSULTANT_ONLY_ENTITIES.has(entity)) return true;
  // Also guard mandate_matches / consultant_* wildcard variants
  if (entity.startsWith('consultant_')) return true;
  if (entity.startsWith('mandate_match')) return true;
  if (entity === 'pipeline_stages') return true;
  return false;
}

// ── Entity access control list ──────────────────────────────────────────────
// Each allowlisted entity => { read: roles allowed to READ,
//                               write: roles allowed to INSERT/UPDATE/DELETE,
//                               selfColumn: optional column that equals userId => "own row" bypass,
//                               orgColumn: optional column for client-org scoping }

type Acl = {
  read: Array<'admin' | 'consultant' | 'client' | 'leader'>;
  write?: Array<'admin' | 'consultant' | 'client' | 'leader'>;
  selfColumn?: string;
  consultantColumn?: string;
  orgColumn?: string;
};
const ENTITY_ACL: Record<string, Acl> = {
  // #1313: profiles write is admin-only. Leaders update their own profile
  // via Supabase client-side RLS (updateProfile in authStore), NOT through
  // this endpoint. This prevents non-admins from creating profile rows
  // (i.e., "inviting" users) or assigning organization_id / role / tier.
  profiles:             { read: ['admin','consultant','client','leader'], write: ['admin'], selfColumn: 'id', orgColumn: 'organization_id' },
  credits:              { read: ['admin','leader'],                  write: ['admin','leader'],  selfColumn: 'user_id' },
  credit_transactions:  { read: ['admin','leader'],                  write: ['admin'],            selfColumn: 'user_id' },
  organizations:        { read: ['admin','consultant','client'],     write: ['admin','consultant'], orgColumn: 'id' },
  mandates:             { read: ['admin','consultant','client'],     write: ['admin','consultant'], consultantColumn: 'lead_consultant_id', orgColumn: 'organization_id' },
  mandate_timelines:    { read: ['admin','consultant','client'],     write: ['admin','consultant'] },
  contacts:             { read: ['admin','consultant','client','leader'], write: ['admin','consultant'], selfColumn: 'id', consultantColumn: 'owner_id', orgColumn: 'organization_id' },
  documents:            { read: ['admin','consultant','client','leader'], write: ['admin','consultant','leader'], selfColumn: 'owner_id', orgColumn: 'organization_id' },
  assessment_results:   { read: ['admin','consultant','leader'],     write: ['admin','leader'],   selfColumn: 'user_id' },
  memories:             { read: ['admin','leader'],                  write: ['admin','leader'],   selfColumn: 'user_id' },
  chat_sessions:        { read: ['admin','leader'],                  write: ['admin','leader'],   selfColumn: 'user_id' },
  chat_messages:        { read: ['admin','leader'],                  write: ['admin','leader'] },
  saved_searches:       { read: ['admin','consultant','client','leader'], write: ['admin','consultant','client','leader'], selfColumn: 'owner_id', orgColumn: 'organization_id' },
  talent_alerts:        { read: ['admin','consultant','leader'],     write: ['admin','consultant','leader'], selfColumn: 'owner_id' },
  search_executions:    { read: ['admin','consultant','leader'],     write: ['admin','consultant','leader'], selfColumn: 'owner_id' },
  approval_workflows:   { read: ['admin','consultant','client'],     write: ['admin','consultant'], orgColumn: 'organization_id' },
  approval_requests:    { read: ['admin','consultant','client','leader'], write: ['admin','consultant','leader'], selfColumn: 'requester_id', orgColumn: 'organization_id' },
  approval_step_records:{ read: ['admin','consultant','client','leader'], write: ['admin','consultant','leader'], selfColumn: 'actor_id' },
  approval_delegations: { read: ['admin','consultant','leader'],     write: ['admin','consultant','leader'], selfColumn: 'delegator_id' },
  approval_audit_log:   { read: ['admin','consultant','client'],     write: ['admin','consultant'] },
  notifications:        { read: ['admin','consultant','client','leader'], write: ['admin','leader'], selfColumn: 'user_id', orgColumn: 'organization_id' },
  audit_logs:           { read: ['admin','consultant','leader'],     write: ['admin','consultant','leader'], selfColumn: 'user_id' },
  nexus_event_outbox:   { read: ['admin','leader'],                  write: ['admin','leader'],   selfColumn: 'user_id' },
  nexus_event_log:      { read: ['admin','leader'],                  write: [] },
  nexus_sync_state:     { read: ['admin'],                           write: ['admin'] },
  bd_opportunities:     { read: ['admin','consultant','leader'],     write: ['admin','consultant'], selfColumn: 'owner_id' },
  bd_proposals:         { read: ['admin','consultant','client'],     write: ['admin','consultant'], orgColumn: 'organization_id' },
  bd_activities:        { read: ['admin','consultant','leader'],     write: ['admin','consultant','leader'], selfColumn: 'owner_id' },
  alumni:               { read: ['admin','consultant','client','leader'], write: ['admin','consultant'], orgColumn: 'org_id' },
  alumni_engagements:   { read: ['admin','consultant','client'],     write: ['admin','consultant'] },
  alumni_referrals:     { read: ['admin','consultant','client','leader'], write: ['admin','consultant','leader'], selfColumn: 'referrer_id', orgColumn: 'org_id' },
  guarantee_periods:    { read: ['admin','consultant','client'],     write: ['admin','consultant'], orgColumn: 'org_id' },
  scoring_runs:         { read: ['admin','consultant','client','leader'], write: ['admin','consultant','leader'], selfColumn: 'owner_id', orgColumn: 'organization_id' },
  benchmark_runs:       { read: ['admin','consultant','client'],     write: ['admin','consultant'], orgColumn: 'organization_id' },
  sla_configurations:   { read: ['admin','consultant','client'],     write: ['admin','consultant'], orgColumn: 'organization_id' },
  sla_escalations:      { read: ['admin','consultant','client'],     write: ['admin','consultant'], orgColumn: 'organization_id' },
  sla_performance_history: { read: ['admin','consultant','client'],  write: ['admin','consultant'], orgColumn: 'organization_id' },
  data_residency_tags:  { read: ['admin','consultant','client','leader'], write: ['admin','consultant','leader'], selfColumn: 'subject_id', orgColumn: 'org_id' },
  data_consents:        { read: ['admin','consultant','client','leader'], write: ['admin','consultant','leader'], selfColumn: 'subject_id', orgColumn: 'organization_id' },
  cross_border_transfers: { read: ['admin','consultant'],            write: ['admin','consultant'] },
  automation_rules:     { read: ['admin','consultant','leader'],     write: ['admin','consultant','leader'], selfColumn: 'owner_id' },
  // Phase 2 Amendments / #1334 + #1337
  assessments:           { read: ['admin','consultant','client','leader'], write: ['admin'] },
  user_assessment_progress: { read: ['admin','leader'], write: ['admin','leader'], selfColumn: 'user_id' },
  assessment_shares:     { read: ['admin','leader'], write: ['admin','leader'], selfColumn: 'owner_id' },
};

function parseColumnCsv(s?: string | string[]): string[] {
  // #1309: delegate to validated parser. Rejects anything that isn't
  // a safe identifier (or '*'). Throws RequestAuthError(422) on bad input.
  return parseSelectList(s);
}

function applyRoleFilters(
  query: any,
  ctx: AuthContext,
  acl: Acl,
): any {
  // 1) Client role users: force org filter if table has an org column.
  if (isClientRole(ctx.role) && acl.orgColumn && ctx.organizationId) {
    query = query.eq(acl.orgColumn, ctx.organizationId);
  }

  // 2) Scoped consultants (NOT admins): filter by consultantColumn when defined.
  //    This restricts consultants to their own mandates (lead_consultant_id)
  //    and contacts (owner_id). Admins bypass this — they see everything.
  //    Ticket #1306, #1307 — Phase 3 consultant RLS scoping.
  if (isScopedConsultantRole(ctx.role) && acl.consultantColumn) {
    query = query.eq(acl.consultantColumn, ctx.userId);
  }

  // 3) Leader rows: if table has an owner/user column AND caller isn't admin/consultant,
  //    scope to self (admins/consultants can see broader, they're internal).
  if (acl.selfColumn && !isAdminRole(ctx.role) && !isConsultantRole(ctx.role) && !isClientRole(ctx.role)) {
    // Leaders / candidates only see their own rows.
    query = query.eq(acl.selfColumn, ctx.userId);
  } else if (acl.selfColumn === 'user_id' && !isAdminRole(ctx.role) && !isConsultantRole(ctx.role)) {
    // Client leaders in particular — narrow to own rows on personal tables.
    if (isLeaderRole(ctx.role)) {
      query = query.eq(acl.selfColumn, ctx.userId);
    }
  }

  return query;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Vary', 'Origin, Authorization');
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    return res.status(204).end();
  }

  try {
    // #1314: reject oversized URLs before any processing — avoids 500s
    // from attackers stuffing payloads into query params.
    assertUrlLength(req);

    const ctx = await getAuthorizedContext(req, false);
    if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

    const entity = (req.query?.entity as string) || '';
    try {
      assertEntityName(entity);
    } catch {
      return res.status(404).json({ error: `Entity not accessible` });
    }

    // ── V3-6 / #1347: Consultant / B2B entities are B2B/internal-only. ──
    // Public (B2C unauth) users MUST NOT fetch consultant entities.
    // If the caller is NOT admin and NOT consultant role → 403.
    if (isConsultantOnlyEntity(entity)) {
      const roleOk = isAdminRole(ctx.role) || isConsultantRole(ctx.role);
      if (!roleOk) {
        return res.status(403).json({
          ok: false,
          code: 'FORBIDDEN',
          message: 'Consultant data not available to public users',
        });
      }
    }

    const acl = ENTITY_ACL[entity];
    if (!acl) {
      return res.status(404).json({ error: `Entity "${entity}" not accessible through this endpoint` });
    }

    // ── V3-7 / #1346 Write rate limit (global 20 writes / 60s per user) ─
    if (req.method === 'POST') {
      const rl = rateLimit(req, ctx.userId);
      setRateLimitHeaders(res, rl, 20);
      if (!rl.allowed) {
        return res.status(429).json({
          ok: false,
          code: 'RATE_LIMITED',
          message: 'Too many write requests — please retry in a moment',
        });
      }
    }

    const supabase = createClient();
    const q = req.query || {};

    // ── GET ──────────────────────────────────────────────────────────
    if (req.method === 'GET' || req.method === 'HEAD') {
      enforceScope(ctx, { allow: acl.read });

      const selectCols = parseColumnCsv(q.select as any).join(',');
      let query = supabase.from(entity).select(selectCols, { count: 'exact' });

      // #1309: parse & validate all filter params in one pass.
      // parseFilters throws RequestAuthError(422) on invalid column names.
      const filters = parseFilters(q as Record<string, string | string[] | undefined>);
      for (const f of filters) {
        if (f.op === 'in') {
          query = query.in(f.column, f.value.split('|'));
        } else if (f.op === 'like') {
          query = query.like(f.column, f.value);
        } else {
          query = (query as any)[f.op](f.column, f.value);
        }
      }

      const order = parseOrderParam(q.order as string | undefined);
      if (order) {
        query = query.order(order.column, { ascending: order.ascending });
      } else {
        // heuristic — most tables have created_at; ignore if not present
        try { query = query.order('created_at', { ascending: false }); } catch { /* ignore */ }
      }

      const limit = Math.min(Number(q.limit) || 100, 500);
      query = query.limit(limit);
      if (q.offset) query = query.range(Number(q.offset), Number(q.offset) + limit - 1);

      // Apply role scoping AFTER user-supplied filters so they can't widen scope.
      query = applyRoleFilters(query, ctx, acl);

      const { data, error, count } = await query;
      if (error) {
        // #1310: log full error server-side, return safe message to client.
        logServerError('api/data/[entity] GET', error, req);
        throw new RequestAuthError(safeErrorMessage(error, 'Failed to fetch data'), safeErrorStatus(error, 500));
      }
      if (req.method === 'HEAD') {
        res.setHeader('X-Total-Count', String(count ?? 0));
        return res.status(204).end();
      }
      res.setHeader('X-Total-Count', String(count ?? 0));
      return res.status(200).json({ ok: true, data, count });
    }

    // ── POST: { filters, upsert, delete_by } ──────────────────────────
    if (req.method === 'POST') {
      // #1309 + #1314: enforce body size limit, then parse + sanitize.
      assertBodySize(req.body, DEFAULT_BODY_LIMIT);

      const PostBodySchema = z.object({
        select: z.string().max(4096).optional(),
        upsert: z.record(z.string(), z.any()).max(200).optional(),
        delete_by: z.record(z.string(), z.any()).max(100).optional(),
        filters: z.array(z.object({ col: z.string().max(64), op: z.string().max(16), value: z.any() })).max(50).optional(),
        order: z.string().max(256).optional(),
        on_conflict: z.string().max(256).optional(),
        limit: z.number().int().min(0).max(500).optional(),
        offset: z.number().int().min(0).optional(),
      });

      const rawBody = parseJsonBody<{
        select?: string;
        upsert?: Record<string, unknown>;
        delete_by?: Record<string, unknown>;
        filters?: Array<{ col: string; op: string; value: unknown }>;
        order?: string;
        on_conflict?: string;
        limit?: number;
        offset?: number;
      }>(req);

      // V3-7: zod-validate the write shape before processing
      const needsWrite = !!rawBody.upsert || !!rawBody.delete_by;
      const body = needsWrite ? (function () {
        try { return PostBodySchema.parse(rawBody); } catch (zErr: any) {
          const first = zErr?.issues?.[0];
          const msg = first
            ? `Invalid input at ${first.path.join('.')}: ${first.message}`
            : 'Invalid write body';
          throw new RequestAuthError(msg.slice(0, 256), 422);
        }
      })() : rawBody;

      // Write access check first.
      if (body.upsert || body.delete_by) {
        if (!acl.write || acl.write.length === 0) {
          throw new RequestAuthError(`Write not permitted on "${entity}"`, 403);
        }
        enforceScope(ctx, { allow: acl.write });

        // #1313: Defense-in-depth — privileged fields on profiles (role,
        // tier, organization_id) require admin even if the caller somehow
        // passes the write ACL. The DB trigger also enforces this, but we
        // reject early with a clear 403 before hitting the database.
        if (entity === 'profiles' && body.upsert) {
          const privilegedFields = ['role', 'tier', 'organization_id', 'is_admin', 'is_staff'];
          const attempted = privilegedFields.filter(f => body.upsert![f] !== undefined);
          if (attempted.length > 0 && !isAdminRole(ctx.role)) {
            throw new RequestAuthError(
              `Permission denied: setting ${attempted.join(', ')} requires admin role`,
              403,
            );
          }
        }
      } else {
        // Read-only POST (filters only)
        enforceScope(ctx, { allow: acl.read });
      }

      const selectCols = parseColumnCsv(body.select).join(',');

      if (body.delete_by) {
        if (!isAdminRole(ctx.role) && acl.selfColumn) {
          // Self-only delete: must include selfColumn in delete_by
          if (!body.delete_by[acl.selfColumn]) {
            throw new RequestAuthError('Self-serve delete requires owner filter', 403);
          }
          if (String(body.delete_by[acl.selfColumn]) !== String(ctx.userId)) {
            throw new RequestAuthError('Cannot delete rows owned by other users', 403);
          }
        }
        let dq = supabase.from(entity).delete({ count: 'exact' });
        // #1309: validate every column name in delete_by before applying.
        for (const [k, v] of Object.entries(body.delete_by)) {
          assertColumnName(k);
          dq = dq.eq(k, v as any);
        }
        dq = applyRoleFilters(dq, ctx, acl);
        const { error, count: delCount } = await dq;
        if (error) {
          logServerError('api/data/[entity] DELETE', error, req);
          throw new RequestAuthError(safeErrorMessage(error, 'Failed to delete'), safeErrorStatus(error, 500));
        }

        // V3-7 audit write (best-effort — never fail on audit errors)
        try {
          await supabase.from('audit_logs').insert({
            actor_user_id: ctx.userId,
            action: `DELETE:${entity}`,
            entity,
            record_count: delCount ?? 0,
            details: { columns: Object.keys(body.delete_by ?? {}) },
            ip_address: null,
            user_agent: null,
          });
        } catch (_auditErr) { /* swallow */ }

        return res.status(200).json({ ok: true, deleted: delCount ?? 0 });
      }

      if (body.upsert) {
        // If owner column exists, caller cannot set it to another user's id (non-admins)
        if (!isAdminRole(ctx.role) && acl.selfColumn) {
          const ownerVal = body.upsert[acl.selfColumn];
          if (ownerVal !== undefined && String(ownerVal) !== String(ctx.userId)) {
            throw new RequestAuthError(`Cannot set ${acl.selfColumn} to another user`, 403);
          }
          // If caller didn't provide it, default it for them on insert scenarios.
          if (ownerVal === undefined) {
            body.upsert[acl.selfColumn] = ctx.userId;
          }
        }
        // Consultant scoping: scoped consultants must own the rows they write.
        // Ticket #1306, #1307.
        if (isScopedConsultantRole(ctx.role) && acl.consultantColumn) {
          const colVal = body.upsert[acl.consultantColumn];
          if (colVal !== undefined && String(colVal) !== String(ctx.userId)) {
            throw new RequestAuthError(`Cannot set ${acl.consultantColumn} to another user`, 403);
          }
          if (colVal === undefined) {
            body.upsert[acl.consultantColumn] = ctx.userId;
          }
        }
        // Client-org scoping: enforce org id on upserted rows.
        if (isClientRole(ctx.role) && acl.orgColumn && ctx.organizationId) {
          const orgVal = body.upsert[acl.orgColumn];
          if (orgVal !== undefined && String(orgVal) !== String(ctx.organizationId)) {
            throw new RequestAuthError(`Cannot set ${acl.orgColumn} outside your organization`, 403);
          }
          body.upsert[acl.orgColumn] = ctx.organizationId;
        }
        // #1309: validate on_conflict column name if provided.
        if (body.on_conflict) {
          for (const c of String(body.on_conflict).split(',')) {
            assertColumnName(c.trim());
          }
        }

        const { data, error } = await supabase
          .from(entity)
          .upsert(body.upsert, { onConflict: body.on_conflict || undefined })
          .select(selectCols);
        if (error) {
          logServerError('api/data/[entity] UPSERT', error, req);
          throw new RequestAuthError(safeErrorMessage(error, 'Failed to save'), safeErrorStatus(error, 500));
        }

        // V3-7 audit write (best-effort — never fail on audit errors)
        try {
          await supabase.from('audit_logs').insert({
            actor_user_id: ctx.userId,
            action: `POST:${entity}`,
            entity,
            record_count: data?.length ?? 0,
            details: { upsert_keys: Object.keys(body.upsert ?? {}) },
            ip_address: null,
            user_agent: null,
          });
        } catch (_auditErr) { /* swallow */ }

        return res.status(200).json({ ok: true, data });
      }

      // Filter-only POST (complex filters via body.filters: [{col,op,value}])
      let query = supabase.from(entity).select(selectCols, { count: 'exact' });
      for (const f of (body.filters || [])) {
        if (!f?.col || !f?.op) continue;
        // #1309: validate column + op before applying.
        try {
          assertColumnName(f.col);
        } catch {
          continue;  // skip invalid filter
        }
        if (!['eq','neq','gt','lt','gte','lte','in','like'].includes(f.op)) continue;
        if (f.op === 'in') query = query.in(f.col, (f.value as any[]) || []);
        else query = (query as any)[f.op]?.(f.col, f.value) ?? query;
      }
      if (body.order) {
        const order = parseOrderParam(body.order);
        if (order) query = query.order(order.column, { ascending: order.ascending });
      }
      const limit = Math.min(Number(body.limit) || 100, 500);
      query = query.limit(limit);
      if (body.offset) query = query.range(Number(body.offset), Number(body.offset) + limit - 1);

      query = applyRoleFilters(query, ctx, acl);
      const { data, error, count } = await query;
      if (error) {
        logServerError('api/data/[entity] POST filter', error, req);
        throw new RequestAuthError(safeErrorMessage(error, 'Failed to fetch data'), safeErrorStatus(error, 500));
      }
      res.setHeader('X-Total-Count', String(count ?? 0));
      return res.status(200).json({ ok: true, data, count });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e: any) {
    // #1314: centralized error handling — never leaks stack traces.
    handleApiError(res, e, 'api/data/[entity] unexpected', req);
    return;
  }
}
