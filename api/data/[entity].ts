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

// ── Entity access control list ──────────────────────────────────────────────
// Each allowlisted entity => { read: roles allowed to READ,
//                               write: roles allowed to INSERT/UPDATE/DELETE,
//                               selfColumn: optional column that equals userId => "own row" bypass,
//                               orgColumn: optional column for client-org scoping }

type Acl = {
  read: Array<'admin' | 'consultant' | 'client' | 'leader'>;
  write?: Array<'admin' | 'consultant' | 'client' | 'leader'>;
  selfColumn?: string;        // e.g. 'user_id', 'owner_id' — column = userId for leader/candidate self-scoping
  consultantColumn?: string;  // column = userId for scoped-consultant per-user scoping (e.g. 'lead_consultant_id', 'owner_id')
  orgColumn?: string;         // e.g. 'organization_id', 'org_id'
};
const ENTITY_ACL: Record<string, Acl> = {
  profiles:             { read: ['admin','consultant','client','leader'], write: ['admin','leader'], selfColumn: 'id', orgColumn: 'organization_id' },
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
  if (!s) return ['*'];
  const raw = Array.isArray(s) ? s[0] : s;
  const cols = raw.split(',').map(c => c.trim()).filter(Boolean);
  return cols.length ? cols : ['*'];
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
    const ctx = await getAuthorizedContext(req, false);
    if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

    const entity = (req.query?.entity as string) || '';
    const acl = ENTITY_ACL[entity];
    if (!acl) {
      return res.status(404).json({ error: `Entity "${entity}" not accessible through this endpoint` });
    }

    const supabase = createClient();
    const q = req.query || {};

    // ── GET ──────────────────────────────────────────────────────────
    if (req.method === 'GET' || req.method === 'HEAD') {
      enforceScope(ctx, { allow: acl.read });

      const selectCols = parseColumnCsv(q.select as any).join(',');
      let query = supabase.from(entity).select(selectCols, { count: 'exact' });

      // Simple filter params: eq=col:val  neq=col:val  gt=col:val  lt=col:val  in=col:a|b|c
      for (const [op, paramName] of [
        ['eq', 'eq'], ['neq', 'neq'], ['gt', 'gt'], ['lt', 'lt'],
        ['gte', 'gte'], ['lte', 'lte'], ['in', 'in'], ['like', 'like'],
      ] as const) {
        const raw = q[paramName];
        if (!raw) continue;
        const pairs = Array.isArray(raw) ? raw : [raw as string];
        for (const pair of pairs) {
          const [col, val] = (pair as string).split(':');
          if (!col || val === undefined) continue;
          if (op === 'in') {
            query = query.in(col, val.split('|'));
          } else if (op === 'like') {
            query = query.like(col, val);
          } else {
            query = (query as any)[op](col, val);
          }
        }
      }

      if (q.order) {
        const [col, dir = 'asc'] = (q.order as string).split(':');
        query = query.order(col, { ascending: dir !== 'desc' });
      } else {
        const hasCreated = true; // heuristic — most tables have created_at
        try { query = query.order('created_at', { ascending: false }); } catch { /* ignore */ }
        void hasCreated;
      }

      const limit = Math.min(Number(q.limit) || 100, 500);
      query = query.limit(limit);
      if (q.offset) query = query.range(Number(q.offset), Number(q.offset) + limit - 1);

      // Apply role scoping AFTER user-supplied filters so they can't widen scope.
      query = applyRoleFilters(query, ctx, acl);

      const { data, error, count } = await query;
      if (error) throw new RequestAuthError(`DB error: ${error.message}`, 500);
      if (req.method === 'HEAD') {
        res.setHeader('X-Total-Count', String(count ?? 0));
        return res.status(204).end();
      }
      res.setHeader('X-Total-Count', String(count ?? 0));
      return res.status(200).json({ ok: true, data, count });
    }

    // ── POST: { filters, upsert, delete_by } ──────────────────────────
    if (req.method === 'POST') {
      const body = req.body || {};
      // Write access check first.
      if (body.upsert || body.delete_by) {
        if (!acl.write || acl.write.length === 0) {
          throw new RequestAuthError(`Write not permitted on "${entity}"`, 403);
        }
        enforceScope(ctx, { allow: acl.write });
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
        for (const [k, v] of Object.entries(body.delete_by)) dq = dq.eq(k, v);
        dq = applyRoleFilters(dq, ctx, acl);
        const { error, count: delCount } = await dq;
        if (error) throw new RequestAuthError(`DB delete error: ${error.message}`, 500);
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

        const { data, error } = await supabase
          .from(entity)
          .upsert(body.upsert, { onConflict: body.on_conflict || undefined })
          .select(selectCols);
        if (error) throw new RequestAuthError(`DB upsert error: ${error.message}`, 500);
        return res.status(200).json({ ok: true, data });
      }

      // Filter-only POST (complex filters via body.filters: [{col,op,value}])
      let query = supabase.from(entity).select(selectCols, { count: 'exact' });
      for (const f of (body.filters || [])) {
        if (!f?.col || !f?.op) continue;
        if (f.op === 'in') query = query.in(f.col, f.value || []);
        else query = (query as any)[f.op]?.(f.col, f.value) ?? query;
      }
      if (body.order) {
        const [col, dir = 'asc'] = (body.order as string).split(':');
        query = query.order(col, { ascending: dir !== 'desc' });
      }
      const limit = Math.min(Number(body.limit) || 100, 500);
      query = query.limit(limit);
      if (body.offset) query = query.range(Number(body.offset), Number(body.offset) + limit - 1);

      query = applyRoleFilters(query, ctx, acl);
      const { data, error, count } = await query;
      if (error) throw new RequestAuthError(`DB error: ${error.message}`, 500);
      res.setHeader('X-Total-Count', String(count ?? 0));
      return res.status(200).json({ ok: true, data, count });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e: any) {
    if (e instanceof RequestAuthError) {
      return res.status(e.status).json({ error: e.message });
    }
    console.error('[api/data/[entity]] unexpected:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
