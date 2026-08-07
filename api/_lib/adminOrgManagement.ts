/**
 * adminOrgManagement.ts — Organization management, billing, plan changes.
 *
 * CRUD for organizations (workspaces): create, update, suspend,
 * change billing plans, manage organization-wide settings.
 */

import {
  selectOne,
  selectMany,
  insert,
  update,
  remove,
  isSupabaseConfigured,
} from './supabaseRest.js';

export type PlanTier = 'free' | 'starter' | 'growth' | 'enterprise';
export type OrgStatus = 'active' | 'suspended' | 'archived';

export interface OrganizationRecord {
  id: string;
  name: string;
  slug: string;
  status: OrgStatus;
  plan: PlanTier;
  seats_used: number;
  seats_limit: number;
  billing_email: string | null;
  created_at: string;
  updated_at: string;
  settings: Record<string, any> | null;
}

export interface CreateOrgInput {
  name: string;
  slug?: string;
  plan?: PlanTier;
  billing_email?: string;
  seats_limit?: number;
}

export interface UpdateOrgInput {
  name?: string;
  billing_email?: string;
  seats_limit?: number;
  settings?: Record<string, any>;
}

export interface ChangePlanInput {
  plan: PlanTier;
  effective_date?: string;
}

const PLAN_LIMITS: Record<PlanTier, number> = {
  free: 3,
  starter: 10,
  growth: 50,
  enterprise: 500,
};

const PLAN_FEATURES: Record<PlanTier, string[]> = {
  free: ['basic_candidates', 'basic_mandates'],
  starter: ['basic_candidates', 'basic_mandates', 'advanced_search', 'export'],
  growth: [
    'basic_candidates',
    'basic_mandates',
    'advanced_search',
    'export',
    'analytics',
    'campaigns',
    'api_access',
  ],
  enterprise: [
    'basic_candidates',
    'basic_mandates',
    'advanced_search',
    'export',
    'analytics',
    'campaigns',
    'api_access',
    'custom_branding',
    'sla_support',
    'audit_logs',
  ],
};

export function getPlanSeats(plan: PlanTier): number {
  return PLAN_LIMITS[plan];
}

export function getPlanFeatures(plan: PlanTier): string[] {
  return [...PLAN_FEATURES[plan]];
}

export async function listOrganizations(
  filters: { status?: OrgStatus; plan?: PlanTier; search?: string; limit?: number; offset?: number } = {}
): Promise<{ orgs: OrganizationRecord[]; total: number }> {
  if (!isSupabaseConfigured()) {
    return { orgs: [], total: 0 };
  }

  const where: { column: string; value: any; op?: string }[] = [];
  if (filters.status) where.push({ column: 'status', value: filters.status, op: 'eq' });
  if (filters.plan) where.push({ column: 'plan', value: filters.plan, op: 'eq' });
  if (filters.search) {
    const term = `%${filters.search}%`;
    where.push({ column: 'name', value: term, op: 'ilike' });
  }

  const orgs = await selectMany('organizations', {
    select: 'id,name,slug,status,plan,seats_used,seats_limit,billing_email,created_at,updated_at,settings',
    where: where.length > 0 ? where : undefined,
    orderBy: { column: 'created_at', ascending: false },
    limit: filters.limit ?? 50,
    offset: filters.offset ?? 0,
  });

  return { orgs: orgs as OrganizationRecord[], total: orgs.length };
}

export async function getOrganization(orgId: string): Promise<OrganizationRecord | null> {
  if (!isSupabaseConfigured()) return null;
  const org = await selectOne('organizations', {
    column: 'id',
    value: orgId,
    select: 'id,name,slug,status,plan,seats_used,seats_limit,billing_email,created_at,updated_at,settings',
  });
  return org as OrganizationRecord | null;
}

export async function createOrganization(
  input: CreateOrgInput,
  adminId: string
): Promise<OrganizationRecord> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  if (!input.name?.trim()) throw new Error('Organization name is required');

  const plan = input.plan || 'free';
  const slug =
    input.slug ||
    input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const existing = await selectOne('organizations', {
    column: 'slug',
    value: slug,
    select: 'id,slug',
  });
  if (existing) throw new Error(`Organization with slug "${slug}" already exists`);

  const org = await insert('organizations', {
    name: input.name.trim(),
    slug,
    status: 'active',
    plan,
    seats_used: 0,
    seats_limit: input.seats_limit ?? PLAN_LIMITS[plan],
    billing_email: input.billing_email || null,
    settings: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  return org as OrganizationRecord;
}

export async function updateOrganization(
  orgId: string,
  input: UpdateOrgInput,
  adminId: string
): Promise<OrganizationRecord> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

  const updates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (input.name !== undefined) updates.name = input.name;
  if (input.billing_email !== undefined) updates.billing_email = input.billing_email;
  if (input.seats_limit !== undefined) updates.seats_limit = input.seats_limit;
  if (input.settings !== undefined) updates.settings = input.settings;

  if (Object.keys(updates).length <= 1) {
    const current = await getOrganization(orgId);
    if (!current) throw new Error('Organization not found');
    return current;
  }

  const result = await update('organizations', { column: 'id', value: orgId }, updates);
  const updated = result[0];
  if (!updated) throw new Error('Organization not found');

  return updated as OrganizationRecord;
}

export async function suspendOrganization(
  orgId: string,
  adminId: string
): Promise<OrganizationRecord> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

  const result = await update(
    'organizations',
    { column: 'id', value: orgId },
    { status: 'suspended', updated_at: new Date().toISOString() }
  );
  const updated = result[0];
  if (!updated) throw new Error('Organization not found');
  return updated as OrganizationRecord;
}

export async function reactivateOrganization(
  orgId: string,
  adminId: string
): Promise<OrganizationRecord> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

  const result = await update(
    'organizations',
    { column: 'id', value: orgId },
    { status: 'active', updated_at: new Date().toISOString() }
  );
  const updated = result[0];
  if (!updated) throw new Error('Organization not found');
  return updated as OrganizationRecord;
}

export async function changePlan(
  orgId: string,
  input: ChangePlanInput,
  adminId: string
): Promise<OrganizationRecord> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

  const org = await getOrganization(orgId);
  if (!org) throw new Error('Organization not found');

  const newSeatsLimit = PLAN_LIMITS[input.plan];
  const updates: Record<string, any> = {
    plan: input.plan,
    seats_limit: newSeatsLimit,
    updated_at: new Date().toISOString(),
  };

  const result = await update('organizations', { column: 'id', value: orgId }, updates);
  const updated = result[0];
  if (!updated) throw new Error('Failed to change plan');

  return updated as OrganizationRecord;
}

export async function deleteOrganization(
  orgId: string,
  adminId: string
): Promise<{ success: boolean }> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

  await update(
    'organizations',
    { column: 'id', value: orgId },
    { status: 'archived', updated_at: new Date().toISOString() }
  );

  return { success: true };
}

export async function getOrganizationStats(orgId: string): Promise<{
  total_users: number;
  active_users: number;
  total_candidates: number;
  total_mandates: number;
  seats_remaining: number;
}> {
  if (!isSupabaseConfigured()) {
    return {
      total_users: 0,
      active_users: 0,
      total_candidates: 0,
      total_mandates: 0,
      seats_remaining: 0,
    };
  }

  const org = await getOrganization(orgId);
  if (!org) throw new Error('Organization not found');

  const users = await selectMany('profiles', {
    where: [{ column: 'org_id', value: orgId, op: 'eq' }],
  });

  const activeUsers = users.filter((u: any) => u.status === 'active');

  return {
    total_users: users.length,
    active_users: activeUsers.length,
    total_candidates: 0,
    total_mandates: 0,
    seats_remaining: Math.max(0, (org.seats_limit || 0) - users.length),
  };
}
