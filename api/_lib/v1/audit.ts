/**
 * v1 Audit logging — records permission-scoped actions to permission_audit_log.
 *
 * Every mutating v1 endpoint should call logAuditEvent() so we have a
 * trail of who did what, when, and from where.
 */

import { isSupabaseConfigured, insert } from '../supabaseRest.js';

export interface AuditEvent {
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
}

export async function logAuditEvent(event: AuditEvent): Promise<boolean> {
  try {
    if (!isSupabaseConfigured()) return false;

    await insert('permission_audit_log', {
      user_id: event.user_id,
      action: event.action,
      resource_type: event.resource_type,
      resource_id: event.resource_id || null,
      details: event.details || {},
      ip_address: event.ip_address || null,
      user_agent: event.user_agent || null,
      created_at: new Date().toISOString(),
    });
    return true;
  } catch {
    // Never let audit log failures break the API response
    console.warn('[v1/audit] Failed to log event:', event.action);
    return false;
  }
}

/** Helper — extract IP from Vercel request headers. */
export function getClientIp(req: { headers?: Record<string, string | string[] | undefined> }): string {
  const h = req.headers || {};
  const forwarded = h['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = h['x-real-ip'];
  if (typeof realIp === 'string') return realIp;
  return 'unknown';
}

/** Helper — extract user-agent from request. */
export function getUserAgent(req: { headers?: Record<string, string | string[] | undefined> }): string {
  const h = req.headers || {};
  const ua = h['user-agent'];
  return typeof ua === 'string' ? ua : 'unknown';
}
