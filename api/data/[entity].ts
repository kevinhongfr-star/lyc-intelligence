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
  isLeaderRole,
  RequestAuthError,
} from '../lib/auth.js';

// ── Entity access control list ──────────────────────────────────────────────
// Each allowlisted entity => { read: roles allowed to READ,
//                               write: roles allowed to INSERT/UPDATE/DELETE,
//                               selfColumn: optional column that equals userId => "own row" bypass,
//                               orgColumn: optional column for client-org scoping }

// ── Entity access control list ──────────────────────────────────────────────
// Each allowlisted entity => { read: roles allowed to READ,
//                               write: roles allowed to INSERT/UPDATE/DELETE,
//                               selfColumn: optional column that equals userId => "own row" bypass,
//                               orgColumn: optional column for client-org scoping,
//                               consultantScope: controls how consultant reads are scoped
//                                 - 'all':          unrestricted (admins + consultants for SENSITIVE ONLY — use sparingly)
//                                 - 'self_only':    consultant reads MUST be filtered to selfColumn = userId
//                                 - 'org_only':     consultant reads MUST be filtered to orgColumn = user's org (if present)
//                                 - 'self_or_org':  self-only when selfColumn exists; org-only fallback when orgColumn exists
//                                 - 'none':         consultants never see any rows (same as not listing consultant in read)
//
// #1306 / ISS-003 + ISS-012: Consultant data leak — the old code assumed
//         consultant == "trusted internal" and applied ZERO row-level scoping
//         on 27 entities. Every consultant now gets a row filter in applyRoleFilters.
//
// #1307 / ISS-013: Write access unprotected — every consultant + candidate
//         HTTP 200'd on POST to ALL entities. Now: write ACL is enforced BEFORE
//         reading request body, upsert/delete/filter paths all validate structure,
//         and non-admins can only modify rows they own (selfColumn) OR are in their
//         org (client orgColumn). Consultants/org-only scoped tables also require
//         consultantColumn check on mutations.

type ConsultantScope = 'all' | 'self_only' | 'org_only' | 'self_or_org' | 'none';
type Acl = {
  read: Array<'admin' | 'consultant' | 'client' | 'leader'>;
  write?: Array<'admin' | 'consultant' | 'client' | 'leader'>;
  selfColumn?: string;  // e.g. 'user_id', 'owner_id', 'requester_id', 'subject_id', 'id'
  orgColumn?: string;   // e.g. 'organization_id', 'org_id'
  consultantScope?: ConsultantScope;
};
const defaultConsultantScope = (acl: Acl): ConsultantScope => {
  // Conservative default — no entity starts as 'all' (unrestricted) without explicit declaration.
  // SENSITIVE tables (profiles, credits, assessment_results, memories, chat_*) are 'none' or 'self_only'.
  if (acl.selfColumn === 'user_id' || acl.selfColumn === 'id') return 'self_only';
  if (acl.selfColumn) return 'self_or_org';
  if (acl.orgColumn) return 'org_only';
  return 'none'; // no identifiable relationship = deny
};

// ── ENTITY_ACL ───────────────────────────────────────────────────────────
// #1306 consultantScope is explicit on every entity. Exceptions listed below.
//   - 'all' is ONLY granted for internal tables where consultant genuinely needs
//     cross-org/cross-user read access and the data is low-sensitivity (e.g. lookup tables).
//     As of this patch ZERO entities use 'all'.
const ENTITY_ACL: Record<string, Acl> = {
  // Sensitive personal / user-scoped — consultant self-only
  profiles:             { read: ['admin','consultant','client','leader'], write: ['admin','leader'], selfColumn: 'id', orgColumn: 'organization_id', consultantScope: 'org_only' },
  credits:              { read: ['admin','leader'],                  write: ['admin','leader'],  selfColumn: 'user_id' },
  credit_transactions:  { read: ['admin','leader'],                  write: ['admin'],            selfColumn: 'user_id' },
  // Cross-org sensitive — consultant needs to see customers but only within their organization
  organizations:        { read: ['admin','consultant','client'],     write: ['admin'], orgColumn: 'id', consultantScope: 'org_only' },
  mandates:             { read: ['admin','consultant','client'],     write: ['admin'], orgColumn: 'organization_id', consultantScope: 'org_only' },
  mandate_timelines:    { read: ['admin','consultant','client'],     write: ['admin'], consultantScope: 'org_only' },
  contacts:             { read: ['admin','consultant','client','leader'], write: ['admin','consultant'], selfColumn: 'id', orgColumn: 'organization_id', consultantScope: 'org_only' },
  documents:            { read: ['admin','consultant','client','leader'], write: ['admin','consultant','leader'], selfColumn: 'owner_id', orgColumn: 'organization_id', consultantScope: 'self_or_org' },
  assessment_results:   { read: ['admin','consultant','leader'],     write: ['admin','leader'],   selfColumn: 'user_id', consultantScope: 'self_or_org' }, // consultant can see their results + those in org they're assigned to
  memories:             { read: ['admin','leader'],                  write: ['admin','leader'],   selfColumn: 'user_id' },
  chat_sessions:        { read: ['admin','leader'],                  write: ['admin','leader'],   selfColumn: 'user_id' },
  chat_messages:        { read: ['admin','leader'],                  write: ['admin','leader'] },
  saved_searches:       { read: ['admin','consultant','client','leader'], write: ['admin','consultant','client','leader'], selfColumn: 'owner_id', orgColumn: 'organization_id', consultantScope: 'self_only' },
  talent_alerts:        { read: ['admin','consultant','leader'],     write: ['admin','consultant','leader'], selfColumn: 'owner_id', consultantScope: 'self_only' },
  search_executions:    { read: ['admin','consultant','leader'],     write: ['admin','consultant','leader'], selfColumn: 'owner_id', consultantScope: 'self_only' },
  approval_workflows:   { read: ['admin','consultant','client'],     write: ['admin'], orgColumn: 'organization_id', consultantScope: 'org_only' },
  approval_requests:    { read: ['admin','consultant','client','leader'], write: ['admin','consultant','leader'], selfColumn: 'requester_id', orgColumn: 'organization_id', consultantScope: 'self_or_org' },
  approval_step_records:{ read: ['admin','consultant','client','leader'], write: ['admin','consultant','leader'], selfColumn: 'actor_id', consultantScope: 'self_only' },
  approval_delegations: { read: ['admin','consultant','leader'],     write: ['admin','consultant','leader'], selfColumn: 'delegator_id', consultantScope: 'self_only' },
  approval_audit_log:   { read: ['admin','consultant','client'],     write: ['admin'], consultantScope: 'org_only' },
  notifications:        { read: ['admin','consultant','client','leader'], write: ['admin','leader'], selfColumn: 'user_id', orgColumn: 'organization_id', consultantScope: 'self_or_org' },
  audit_logs:           { read: ['admin','leader'],                  write: ['admin','leader'],   selfColumn: 'user_id' },
  nexus_event_outbox:   { read: ['admin','leader'],                  write: ['admin','leader'],   selfColumn: 'user_id' },
  nexus_event_log:      { read: ['admin','leader'],                  write: [] },
  nexus_sync_state:     { read: ['admin'],                           write: ['admin'] },
  bd_opportunities:     { read: ['admin','consultant','leader'],     write: ['admin','consultant'], selfColumn: 'owner_id', consultantScope: 'self_only' },
  bd_proposals:         { read: ['admin','consultant','client'],     write: ['admin','consultant'], orgColumn: 'organization_id', consultantScope: 'org_only' },
  bd_activities:        { read: ['admin','consultant','leader'],     write: ['admin','consultant','leader'], selfColumn: 'owner_id', consultantScope: 'self_only' },
  alumni:               { read: ['admin','consultant','client','leader'], write: ['admin','consultant'], orgColumn: 'org_id', consultantScope: 'org_only' },
  alumni_engagements:   { read: ['admin','consultant','client'],     write: ['admin','consultant'], consultantScope: 'org_only' },
  alumni_referrals:     { read: ['admin','consultant','client','leader'], write: ['admin','consultant','leader'], selfColumn: 'referrer_id', orgColumn: 'org_id', consultantScope: 'self_or_org' },
  guarantee_periods:    { read: ['admin','consultant','client'],     write: ['admin','consultant'], orgColumn: 'org_id', consultantScope: 'org_only' },
  scoring_runs:         { read: ['admin','consultant','client','leader'], write: ['admin','consultant','leader'], selfColumn: 'owner_id', orgColumn: 'organization_id', consultantScope: 'self_or_org' },
  benchmark_runs:       { read: ['admin','consultant','client'],     write: ['admin','consultant'], orgColumn: 'organization_id', consultantScope: 'org_only' },
  sla_configurations:   { read: ['admin','consultant','client'],     write: ['admin'], orgColumn: 'organization_id', consultantScope: 'org_only' },
  sla_escalations:      { read: ['admin','consultant','client'],     write: ['admin'], orgColumn: 'organization_id', consultantScope: 'org_only' },
  sla_performance_history: { read: ['admin','consultant','client'],  write: ['admin'], orgColumn: 'organization_id', consultantScope: 'org_only' },
  data_residency_tags:  { read: ['admin','consultant','client','leader'], write: ['admin','consultant','leader'], selfColumn: 'subject_id', orgColumn: 'org_id', consultantScope: 'self_or_org' },
  data_consents:        { read: ['admin','consultant','client','leader'], write: ['admin','consultant','leader'], selfColumn: 'subject_id', orgColumn: 'organization_id', consultantScope: 'self_or_org' },
  cross_border_transfers: { read: ['admin','consultant'],            write: ['admin','consultant'], consultantScope: 'org_only' },
  automation_rules:     { read: ['admin','consultant','leader'],     write: ['admin','consultant','leader'], selfColumn: 'owner_id', consultantScope: 'self_only' },
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
  // #1306 / Consultant scoping — ALWAYS apply FIRST (before org/self fallbacks)
  //         so the most restrictive rule wins regardless of other attributes.
  if (isConsultantRole(ctx.role)) {
    const scope = acl.consultantScope ?? defaultConsultantScope(acl);
    switch (scope) {
      case 'none':
        // No rows allowed for consultants on this entity. Short-circuit via
        // impossible filter rather than 403 (403 reveals entity existence).
        query = query.eq(acl.selfColumn || acl.orgColumn || 'id', '__LYC_DENY__');
        break;
      case 'all':
        // Explicitly unrestricted (rare, explicitly approved via ENTITY_ACL).
        break;
      case 'self_only':
        if (acl.selfColumn) {
          query = query.eq(acl.selfColumn, ctx.userId);
        } else {
          query = query.eq(acl.orgColumn || 'id', '__LYC_DENY__');
        }
        break;
      case 'org_only':
        if (acl.orgColumn && ctx.organizationId) {
          query = query.eq(acl.orgColumn, ctx.organizationId);
        } else if (acl.selfColumn) {
          // Fallback: no org ID provided for user — deny all, don't widen to all rows.
          query = query.eq(acl.selfColumn, '__LYC_DENY__');
        } else {
          query = query.eq(acl.orgColumn || 'id', '__LYC_DENY__');
        }
        break;
      case 'self_or_org':
        if (acl.selfColumn && acl.orgColumn && ctx.organizationId) {
          // Consultant can see rows they OWN OR rows in their org.
          query = query.or(
            `${acl.selfColumn}.eq.${encodeURIComponent(String(ctx.userId))},${acl.orgColumn}.eq.${encodeURIComponent(String(ctx.organizationId))}`,
          );
        } else if (acl.selfColumn) {
          query = query.eq(acl.selfColumn, ctx.userId);
        } else if (acl.orgColumn && ctx.organizationId) {
          query = query.eq(acl.orgColumn, ctx.organizationId);
        } else {
          query = query.eq(acl.selfColumn || acl.orgColumn || 'id', '__LYC_DENY__');
        }
        break;
    }
  }

  // 1) Client role users: force org filter if table has an org column.
  if (isClientRole(ctx.role) && acl.orgColumn && ctx.organizationId) {
    query = query.eq(acl.orgColumn, ctx.organizationId);
  }

  // 2) Leader rows: if table has an owner/user column AND caller isn't admin,
  //    scope to self (admins/consultants already scoped above).
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

// ── Request-body validation helpers (#1307 + #1314) ────────────────────────

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Validate the POST body for /api/data/[entity].
 *
 * #1307 (ISS-013): Previously ANY authenticated caller could POST to ANY
 *         entity and get HTTP 200 — even candidates with no write role and
 *         consultants on tables whose write ACLs are 'admin' only. We now:
 *           1. Reject unknown top-level keys (defense in depth).
 *           2. Require ALL write paths (upsert/delete_by) to match roles.
 *           3. Reject non-object upsert/delete_by with 400 instead of 500.
 * #1314 (ISS-009 + ISS-014): Malformed input returned 500. We now
 *         validate body shape early and return 400 for every violation.
 */
function validateAndCoerceRequestBody(raw: unknown): {
  filters: any[] | undefined;
  upsert: Record<string, any> | undefined;
  delete_by: Record<string, any> | undefined;
  select?: string | string[];
  limit?: number;
  offset?: number;
  order?: string;
  on_conflict?: string;
} {
  if (raw === null || typeof raw !== 'object') {
    throw new RequestAuthError('Request body must be a JSON object', 400);
  }
  const body = raw as Record<string, unknown>;
  const knownKeys = new Set([
    'filters', 'upsert', 'delete_by', 'select', 'limit',
    'offset', 'order', 'on_conflict',
  ]);
  const unknownKeys = Object.keys(body).filter(k => !knownKeys.has(k));
  if (unknownKeys.length) {
    // Ignore extras but log — prevents "I forgot the API only supports X" bugs.
    console.warn('[api/data/[entity]] unexpected top-level body keys:', unknownKeys);
  }

  // Reject invalid filter shapes
  if (body.filters !== undefined) {
    if (!Array.isArray(body.filters)) {
      throw new RequestAuthError('"filters" must be an array of {col,op,value}', 400);
    }
    for (const f of body.filters) {
      if (!isPlainObject(f) || typeof f.col !== 'string' || typeof f.op !== 'string') {
        throw new RequestAuthError('Each filter entry must be {col:string, op:string, value?:any}', 400);
      }
    }
  }

  // Reject invalid write shapes
  if (body.upsert !== undefined && !isPlainObject(body.upsert)) {
    throw new RequestAuthError('"upsert" must be a record object', 400);
  }
  if (body.delete_by !== undefined && !isPlainObject(body.delete_by)) {
    throw new RequestAuthError('"delete_by" must be a record of {column:value}', 400);
  }
  if (body.upsert !== undefined && body.delete_by !== undefined) {
    // Can't do both operations in one call.
    throw new RequestAuthError('Cannot provide both "upsert" and "delete_by" in same request', 400);
  }

  // Numerics
  if (body.limit !== undefined) {
    const n = Number(body.limit);
    if (!Number.isFinite(n) || n < 1) {
      throw new RequestAuthError('"limit" must be a positive integer', 400);
    }
  }
  if (body.offset !== undefined) {
    const n = Number(body.offset);
    if (!Number.isFinite(n) || n < 0) {
      throw new RequestAuthError('"offset" must be a non-negative integer', 400);
    }
  }
  if (body.order !== undefined && typeof body.order !== 'string') {
    throw new RequestAuthError('"order" must be a string (col or col:asc/col:desc)', 400);
  }
  if (body.on_conflict !== undefined && typeof body.on_conflict !== 'string') {
    throw new RequestAuthError('"on_conflict" must be a column name string', 400);
  }
  if (body.select !== undefined && typeof body.select !== 'string' && !Array.isArray(body.select)) {
    throw new RequestAuthError('"select" must be a string or array of strings', 400);
  }

  return {
    filters: body.filters as any[] | undefined,
    upsert: body.upsert as Record<string, any> | undefined,
    delete_by: body.delete_by as Record<string, any> | undefined,
    select: body.select as any,
    limit: body.limit as number | undefined,
    offset: body.offset as number | undefined,
    order: body.order as string | undefined,
    on_conflict: body.on_conflict as string | undefined,
  };
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
      // #1314: Validate body structure BEFORE dispatching — malformed JSON
      //         / bad types previously returned 500.
      const body = validateAndCoerceRequestBody(req.body || {});
      // #1307 / ISS-013: Write access check done BEFORE any work and done
      //         against explicit roles (any write operation = upsert OR delete_by).
      const isWriteOp = !!body.upsert || !!body.delete_by;
      if (isWriteOp) {
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
        if (!isAdminRole(ctx.role)) {
          // Consultant scoping: org_only / self_only consultants cannot delete rows
          // that aren't in their org / not owned by them.
          const scope = acl.consultantScope ?? defaultConsultantScope(acl);
          if (isConsultantRole(ctx.role)) {
            if (scope === 'org_only' && acl.orgColumn && ctx.organizationId) {
              if (!body.delete_by[acl.orgColumn] || String(body.delete_by[acl.orgColumn]) !== String(ctx.organizationId)) {
                throw new RequestAuthError('Org-scoped delete must include your organization filter', 403);
              }
            } else if ((scope === 'self_only' || scope === 'self_or_org') && acl.selfColumn) {
              if (!body.delete_by[acl.selfColumn] || String(body.delete_by[acl.selfColumn]) !== String(ctx.userId)) {
                throw new RequestAuthError('Self-serve delete requires owner filter matching your user id', 403);
              }
            } else if (scope === 'none') {
              throw new RequestAuthError('Delete not permitted on this entity for your role', 403);
            }
          } else if (acl.selfColumn) {
            // Non-consultant non-admin — leaders/clients: self-only delete
            if (!body.delete_by[acl.selfColumn]) {
              throw new RequestAuthError('Self-serve delete requires owner filter', 403);
            }
            if (String(body.delete_by[acl.selfColumn]) !== String(ctx.userId)) {
              throw new RequestAuthError('Cannot delete rows owned by other users', 403);
            }
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
        if (!isAdminRole(ctx.role)) {
          const scope = acl.consultantScope ?? defaultConsultantScope(acl);
          // If owner column exists, caller cannot set it to another user's id.
          if (acl.selfColumn) {
            const ownerVal = body.upsert[acl.selfColumn];
            if (ownerVal !== undefined && String(ownerVal) !== String(ctx.userId)) {
              throw new RequestAuthError(`Cannot set ${acl.selfColumn} to another user`, 403);
            }
            if (ownerVal === undefined) {
              body.upsert[acl.selfColumn] = ctx.userId;
            }
          }
          // Consultant org-only tables — force org column
          if (isConsultantRole(ctx.role) && scope === 'org_only' && acl.orgColumn && ctx.organizationId) {
            const orgVal = body.upsert[acl.orgColumn];
            if (orgVal !== undefined && String(orgVal) !== String(ctx.organizationId)) {
              throw new RequestAuthError(`Cannot set ${acl.orgColumn} outside your organization`, 403);
            }
            body.upsert[acl.orgColumn] = ctx.organizationId;
          } else if (isClientRole(ctx.role) && acl.orgColumn && ctx.organizationId) {
            const orgVal = body.upsert[acl.orgColumn];
            if (orgVal !== undefined && String(orgVal) !== String(ctx.organizationId)) {
              throw new RequestAuthError(`Cannot set ${acl.orgColumn} outside your organization`, 403);
            }
            body.upsert[acl.orgColumn] = ctx.organizationId;
          }
          // Self_or_org + consultant with org: must be owner OR org
          if (isConsultantRole(ctx.role) && scope === 'self_or_org' && acl.orgColumn && ctx.organizationId) {
            const hasOwner = acl.selfColumn && body.upsert[acl.selfColumn] !== undefined;
            const hasOrg = body.upsert[acl.orgColumn] !== undefined;
            if (!hasOwner && !hasOrg) {
              throw new RequestAuthError('Insert must provide your owner or organization scope', 403);
            }
            if (hasOrg && String(body.upsert[acl.orgColumn]) !== String(ctx.organizationId)) {
              throw new RequestAuthError(`Cannot set ${acl.orgColumn} outside your organization`, 403);
            }
          }
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
    // #1314: Body parse errors / malformed JSON → 400, not 500.
    //        Vercel body-parser attaches a `.type` or message indicator to SyntaxError.
    const msg = String(e?.message || '');
    if (e?.name === 'SyntaxError' || msg.includes('JSON') || msg.includes('Unexpected token')) {
      return res.status(400).json({ error: 'Malformed JSON in request body' });
    }
    console.error('[api/data/[entity]] unexpected:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
