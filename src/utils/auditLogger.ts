// Phase 0.5: Audit Logger Utility
// Structured audit logging for all data mutations
// V3-5 / #1345: All third-party sinks are scrubbed of PII before writing.

import type { SupabaseClient } from '@supabase/supabase-js';

const RE_EMAIL = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const RE_UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

function shortHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i) | 0;
  return ('0000000' + Math.abs(h).toString(16)).slice(-8);
}

function scrubPIIString(v: string): string {
  let out = v;
  out = out.replace(RE_EMAIL, '[email scrubbed]');
  out = out.replace(RE_UUID, (m) => `[uuid_${shortHash(m)}]`);
  return out;
}

const PII_KEYS = ['name', 'email', 'phone', 'address', 'company', 'ip', 'session', 'result', 'score', 'profile', 'chat', 'message'];

function scrubObject<T>(v: T): T {
  if (v === null || v === undefined) return v;
  if (typeof v === 'string') return scrubPIIString(v) as unknown as T;
  if (typeof v === 'number' || typeof v === 'boolean') return v;
  if (Array.isArray(v)) return v.map(scrubObject) as unknown as T;
  if (typeof v === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      const lk = k.toLowerCase();
      const isPii = PII_KEYS.some(p => lk.includes(p));
      if (isPii && typeof val === 'string') {
        out[k] = `[${k} scrubbed]`;
      } else {
        out[k] = scrubObject(val);
      }
    }
    return out as unknown as T;
  }
  return v;
}

export interface AuditLogParams {
  userId: string;
  orgId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditLogEntry {
  id: string;
  user_id: string;
  organization_id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: Record<string, unknown>;
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface AuditWriteEntry {
  actor: string | null;
  action: string;
  recordCount?: number;
  timestamp?: string;
  entity?: string;
  metadata?: Record<string, unknown>;
}

let supabaseClientRef: SupabaseClient | null = null;
export function _setAuditSupabaseRef(c: SupabaseClient | null) {
  supabaseClientRef = c;
}

export async function auditWrite(entry: AuditWriteEntry): Promise<void> {
  try {
    const safeMeta = entry.metadata ? scrubObject(entry.metadata) : undefined;
    const ts = entry.timestamp || new Date().toISOString();
    const payload = {
      user_id: entry.actor,
      action: entry.action,
      entity_type: entry.entity || 'unknown',
      entity_id: null,
      organization_id: null,
      details: {
        record_count: entry.recordCount ?? 1,
        ...(safeMeta || {}),
      },
      created_at: ts,
    } as any;
    if (supabaseClientRef) {
      try {
        await supabaseClientRef.from('audit_logs').insert(payload);
      } catch {
        // swallow — audit must never fail endpoint
      }
    }
  } catch (e: any) {
    try {
      console.warn('[auditLogger] auditWrite non-fatal:', (e && e.message) || e);
    } catch { /* noop */ }
  }
}

/**
 * Log an audit event for a data mutation.
 * Every INSERT/UPDATE/DELETE should call this.
 * V3-5: changes, metadata, ip, ua are scrubbed before insert.
 */
export async function logAuditEvent(
  supabase: SupabaseClient,
  params: AuditLogParams
): Promise<void> {
  try {
    const safeMetadata = params.metadata ? scrubObject(params.metadata) : undefined;
    const safeChanges = params.changes ? scrubObject(params.changes) : undefined;
    const details: Record<string, unknown> = {
      ...(safeMetadata || {}),
    };
    if (safeChanges) {
      details.changes = safeChanges;
    }

    const safeIp = params.ipAddress ? scrubPIIString(params.ipAddress) : null;
    const safeUa = params.userAgent ? scrubPIIString(params.userAgent) : null;

    const { error } = await supabase.from('audit_logs').insert({
      user_id: params.userId,
      organization_id: params.orgId,
      action: params.action,
      entity_type: params.resourceType,
      entity_id: params.resourceId,
      details,
      ip_address: safeIp,
      user_agent: safeUa,
    });

    if (error) {
      console.error('[auditLogger] Failed to write audit log:', scrubObject(error));
    }
  } catch (err: any) {
    try {
      console.warn('[auditLogger] Audit log error (swallowed):', scrubPIIString(String(err?.message || err)));
    } catch { /* noop */ }
  }
}

/**
 * Batch log multiple audit events.
 */
export async function logAuditEvents(
  supabase: SupabaseClient,
  events: AuditLogParams[]
): Promise<void> {
  if (events.length === 0) return;

  try {
    const inserts = events.map(params => {
      const safeMetadata = params.metadata ? scrubObject(params.metadata) : undefined;
      const safeChanges = params.changes ? scrubObject(params.changes) : undefined;
      const safeIp = params.ipAddress ? scrubPIIString(params.ipAddress) : null;
      const safeUa = params.userAgent ? scrubPIIString(params.userAgent) : null;
      return {
        user_id: params.userId,
        organization_id: params.orgId,
        action: params.action,
        entity_type: params.resourceType,
        entity_id: params.resourceId || null,
        details: {
          ...(safeMetadata || {}),
          ...(safeChanges ? { changes: safeChanges } : {}),
        },
        ip_address: safeIp,
        user_agent: safeUa,
      };
    });

    const { error } = await supabase.from('audit_logs').insert(inserts);

    if (error) {
      console.error('[auditLogger] Failed to batch write audit logs:', scrubObject(error));
    }
  } catch (err: any) {
    try {
      console.warn('[auditLogger] Batch audit log error (swallowed):', scrubPIIString(String(err?.message || err)));
    } catch { /* noop */ }
  }
}

/**
 * Build action name from resource and operation.
 * Example: buildAction('mandate', 'create') => 'mandate.create'
 */
export function buildAction(
  resource: string,
  operation: 'create' | 'update' | 'delete' | 'archive' | 'restore' | string
): string {
  return `${resource}.${operation}`;
}

/**
 * Compute changes between old and new records.
 * Only includes fields that actually changed.
 */
export function computeChanges<T extends Record<string, unknown>>(
  before: T | null,
  after: T | null
): { before: Partial<T>; after: Partial<T> } | null {
  if (!before && !after) return null;
  if (!before) return { before: {} as Partial<T>, after: after as Partial<T> };
  if (!after) return { before: before as Partial<T>, after: {} as Partial<T> };

  const changedBefore: Partial<T> = {} as Partial<T>;
  const changedAfter: Partial<T> = {} as Partial<T>;

  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const key of allKeys) {
    const beforeVal = before[key as keyof T];
    const afterVal = after[key as keyof T];

    // Skip fields that shouldn't be tracked
    if (
      key === 'updated_at' ||
      key === 'created_at' ||
      key === 'last_synced_at'
    ) {
      continue;
    }

    if (JSON.stringify(beforeVal) !== JSON.stringify(afterVal)) {
      changedBefore[key as keyof T] = beforeVal;
      changedAfter[key as keyof T] = afterVal;
    }
  }

  if (Object.keys(changedBefore).length === 0 && Object.keys(changedAfter).length === 0) {
    return null;
  }

  return { before: changedBefore, after: changedAfter };
}

/**
 * Extract IP address from request headers.
 */
export function getClientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    return xff.split(',')[0].trim();
  }

  const xri = request.headers.get('x-real-ip');
  if (xri) {
    return xri;
  }

  return 'unknown';
}

/**
 * Extract user agent from request headers.
 */
export function getUserAgent(request: Request): string {
  return request.headers.get('user-agent') || 'unknown';
}

export default {
  logAuditEvent,
  logAuditEvents,
  buildAction,
  computeChanges,
  getClientIp,
  getUserAgent,
};
