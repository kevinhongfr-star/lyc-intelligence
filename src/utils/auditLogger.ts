// Phase 0.5: Audit Logger Utility
// Structured audit logging for all data mutations

import type { SupabaseClient } from '@supabase/supabase-js';

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

/**
 * Log an audit event for a data mutation.
 * Every INSERT/UPDATE/DELETE should call this.
 */
export async function logAuditEvent(
  supabase: SupabaseClient,
  params: AuditLogParams
): Promise<void> {
  try {
    const details: Record<string, unknown> = {
      ...(params.metadata || {}),
    };

    if (params.changes) {
      details.changes = params.changes;
    }

    const { error } = await supabase.from('audit_logs').insert({
      user_id: params.userId,
      organization_id: params.orgId,
      action: params.action,
      entity_type: params.resourceType,
      entity_id: params.resourceId,
      details,
      ip_address: params.ipAddress || null,
      user_agent: params.userAgent || null,
    });

    if (error) {
      console.error('[auditLogger] Failed to write audit log:', error);
    }
  } catch (err) {
    // Never let audit logging fail the main operation
    console.error('[auditLogger] Audit log error:', err);
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
    const inserts = events.map(params => ({
      user_id: params.userId,
      organization_id: params.orgId,
      action: params.action,
      entity_type: params.resourceType,
      entity_id: params.resourceId || null,
      details: {
        ...(params.metadata || {}),
        ...(params.changes ? { changes: params.changes } : {}),
      },
      ip_address: params.ipAddress || null,
      user_agent: params.userAgent || null,
    }));

    const { error } = await supabase.from('audit_logs').insert(inserts);

    if (error) {
      console.error('[auditLogger] Failed to batch write audit logs:', error);
    }
  } catch (err) {
    console.error('[auditLogger] Batch audit log error:', err);
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
