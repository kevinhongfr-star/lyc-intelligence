/**
 * adminAuditLog.ts — Audit trail for admin actions.
 *
 * Records and retrieves a comprehensive audit log of all significant
 * admin actions across the platform: user management, config changes,
 * moderation, billing, RBAC changes, etc.
 */

import { selectOne, selectMany, insert, isSupabaseConfigured } from './supabaseRest.js';

export interface AuditLogEntry {
  id: string;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface CreateAuditEntry {
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  metadata?: Record<string, any> | null;
  ip_address?: string | null;
  user_agent?: string | null;
}

export interface ListAuditFilters {
  actor_id?: string;
  action?: string;
  entity_type?: string;
  entity_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export const ADMIN_ACTIONS = {
  USER_CREATE: 'user.create',
  USER_UPDATE: 'user.update',
  USER_DEACTIVATE: 'user.deactivate',
  USER_REACTIVATE: 'user.reactivate',
  USER_PASSWORD_RESET: 'user.password_reset',
  USER_DELETE: 'user.delete',
  ORG_CREATE: 'org.create',
  ORG_UPDATE: 'org.update',
  ORG_SUSPEND: 'org.suspend',
  ORG_REACTIVATE: 'org.reactivate',
  ORG_PLAN_CHANGE: 'org.plan_change',
  ORG_DELETE: 'org.delete',
  MODERATION_FLAG: 'moderation.flag',
  MODERATION_APPROVE: 'moderation.approve',
  MODERATION_REJECT: 'moderation.reject',
  MODERATION_REMOVE: 'moderation.remove',
  MODERATION_RESTORE: 'moderation.restore',
  CONFIG_UPDATE: 'config.update',
  FEATURE_FLAG_TOGGLE: 'feature_flag.toggle',
  BILLING_INVOICE_CREATE: 'billing.invoice.create',
  BILLING_PAYMENT_RECORD: 'billing.payment.record',
  RBAC_ROLE_CHANGE: 'rbac.role_change',
  RBAC_PERMISSION_UPDATE: 'rbac.permission.update',
  AUDIT_EXPORT: 'audit.export',
} as const;

export type AdminAction = (typeof ADMIN_ACTIONS)[keyof typeof ADMIN_ACTIONS];

export async function createAuditEntry(
  input: CreateAuditEntry
): Promise<AuditLogEntry> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

  const entry = await insert('audit_logs', {
    actor_id: input.actor_id,
    action: input.action,
    entity_type: input.entity_type,
    entity_id: input.entity_id || null,
    metadata: input.metadata || null,
    ip_address: input.ip_address || null,
    user_agent: input.user_agent || null,
    created_at: new Date().toISOString(),
  });

  return entry as AuditLogEntry;
}

export async function listAuditLogs(
  filters: ListAuditFilters = {}
): Promise<{ entries: AuditLogEntry[]; total: number }> {
  if (!isSupabaseConfigured()) {
    return { entries: [], total: 0 };
  }

  const where: { column: string; value: any; op?: string }[] = [];

  if (filters.actor_id) where.push({ column: 'actor_id', value: filters.actor_id, op: 'eq' });
  if (filters.action) where.push({ column: 'action', value: filters.action, op: 'eq' });
  if (filters.entity_type) where.push({ column: 'entity_type', value: filters.entity_type, op: 'eq' });
  if (filters.entity_id) where.push({ column: 'entity_id', value: filters.entity_id, op: 'eq' });
  if (filters.date_from) where.push({ column: 'created_at', value: filters.date_from, op: 'gte' });
  if (filters.date_to) where.push({ column: 'created_at', value: filters.date_to, op: 'lte' });

  const entries = await selectMany('audit_logs', {
    select: 'id,actor_id,action,entity_type,entity_id,metadata,ip_address,user_agent,created_at',
    where: where.length > 0 ? where : undefined,
    orderBy: { column: 'created_at', ascending: false },
    limit: filters.limit ?? 50,
    offset: filters.offset ?? 0,
  });

  return { entries: entries as AuditLogEntry[], total: entries.length };
}

export async function getAuditEntry(id: string): Promise<AuditLogEntry | null> {
  if (!isSupabaseConfigured()) return null;
  const entry = await selectOne('audit_logs', {
    column: 'id',
    value: id,
    select: 'id,actor_id,action,entity_type,entity_id,metadata,ip_address,user_agent,created_at',
  });
  return entry as AuditLogEntry | null;
}

export async function getAuditStats(): Promise<{
  total_entries: number;
  unique_actors: number;
  actions_today: number;
  most_common_actions: Array<{ action: string; count: number }>;
}> {
  if (!isSupabaseConfigured()) {
    return { total_entries: 0, unique_actors: 0, actions_today: 0, most_common_actions: [] };
  }

  const entries = await selectMany('audit_logs', { select: 'id,actor_id,action,created_at' });
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const actionCounts = new Map<string, number>();
  for (const e of entries) {
    actionCounts.set(e.action, (actionCounts.get(e.action) || 0) + 1);
  }

  const mostCommon = Array.from(actionCounts.entries())
    .map(([action, count]) => ({ action, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    total_entries: entries.length,
    unique_actors: new Set(entries.map((e: any) => e.actor_id)).size,
    actions_today: entries.filter((e: any) => new Date(e.created_at) >= today).length,
    most_common_actions: mostCommon,
  };
}

export function exportAuditToCSV(entries: AuditLogEntry[]): string {
  const headers = ['id', 'actor_id', 'action', 'entity_type', 'entity_id', 'metadata', 'ip_address', 'user_agent', 'created_at'];
  const rows = entries.map(e => [
    e.id,
    e.actor_id,
    e.action,
    e.entity_type,
    e.entity_id || '',
    e.metadata ? JSON.stringify(e.metadata).replace(/"/g, '""') : '',
    e.ip_address || '',
    e.user_agent || '',
    e.created_at,
  ]);
  return [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
}
