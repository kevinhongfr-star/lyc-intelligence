/**
 * Organization-scoped query helpers — simplified for current schema.
 * 
 * Current DB schema notes:
 * - profiles.organization_id is null for all users (multi-tenant not yet active)
 * - Until multi-tenant is implemented, all authenticated users get full access.
 * 
 * Performance: All queries now have proper limits and support server-side filtering.
 */

import type { UserRole } from '../../src/types/index.js';
import { selectOne, selectMany, countRows } from './supabaseRest.js';

/** Map DB role to UserRole enum */
function mapRole(dbRole: string | null | undefined): UserRole {
  if (dbRole === 'admin') return 'super_admin';
  if (dbRole === 'user') return 'member';
  return (dbRole as UserRole) || 'member';
}

export async function getOrgId(userId: string): Promise<string | null> {
  const profile = await selectOne('profiles', {
    column: 'id',
    value: userId,
    select: 'organization_id',
  });
  return profile?.organization_id || null;
}

export async function getUserRole(userId: string): Promise<UserRole> {
  const profile = await selectOne('profiles', {
    column: 'id',
    value: userId,
    select: 'role',
  });
  return mapRole(profile?.role);
}

export async function getOrgScopedMandates(
  userId: string, userRole: UserRole, orgId: string | null,
  options?: { limit?: number; offset?: number; search?: string }
): Promise<{ data: any[]; total: number }> {
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;
  const where: Array<{ column: string; value: string | number | boolean | any[]; op?: string }> = [];

  // Server-side search
  if (options?.search) {
    where.push({ column: 'title', value: `%${options.search}%`, op: 'ilike' });
  }

  const [data, total] = await Promise.all([
    selectMany('mandates', {
      select: 'id, title, status, priority, client_id, tier1_count, tier2_count, shortlisted_count, interview_count, placed_count, updated_at',
      where,
      orderBy: { column: 'updated_at', ascending: false },
      limit,
      offset,
    }, 10000),
    countRows('mandates', { where }),
  ]);

  return { data, total };
}

export async function getOrgScopedPipeline(
  userId: string, userRole: UserRole, orgId: string | null, mandateId?: string
): Promise<any[]> {
  const where: Array<{ column: string; value: string | number | boolean | any[]; op?: string }> = [];
  if (mandateId) {
    where.push({ column: 'mandate_id', value: mandateId });
  }
  return selectMany('candidates_pipeline', {
    select: '*, contact:contacts(id, name, current_title, email, company:companies(id, name)), mandate:mandates(id, title)',
    where,
    orderBy: { column: 'match_score', ascending: false },
    limit: 200,
  }, 10000);
}

export async function getOrgScopedContacts(
  userId: string, userRole: UserRole, orgId: string | null,
  options?: { limit?: number; offset?: number; search?: string; seniority?: string[]; country?: string }
): Promise<{ data: any[]; total: number }> {
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;
  const where: Array<{ column: string; value: string | number | boolean | any[]; op?: string }> = [];

  if (options?.search) {
    where.push({ column: 'name', value: `%${options.search}%`, op: 'ilike' });
  }
  if (options?.seniority?.length) {
    where.push({ column: 'seniority', value: options.seniority, op: 'in' });
  }
  if (options?.country) {
    where.push({ column: 'country', value: options.country });
  }

  const [data, total] = await Promise.all([
    selectMany('contacts', {
      select: 'id, name, email, current_title, company_id, country, city, seniority, headline, trident_composite, trident_d1, trident_d2, trident_d3, cxo_stamp, linkedin_url, company:companies(id, name)',
      where,
      orderBy: { column: 'updated_at', ascending: false },
      limit,
      offset,
    }, 10000),
    countRows('contacts', { where }),
  ]);

  return { data, total };
}

export function hasOrgAccess(userRole: UserRole): boolean {
  return true;
}

export function isOrgAdmin(userRole: UserRole): boolean {
  return userRole === 'super_admin';
}

export function isReadOnly(userRole: UserRole): boolean {
  return userRole === 'client_viewer';
}

export async function getOrgScopedCompanies(
  userId: string, userRole: UserRole, orgId: string | null,
  options?: { limit?: number; offset?: number; search?: string }
): Promise<{ data: any[]; total: number }> {
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;
  const where: Array<{ column: string; value: string | number | boolean | any[]; op?: string }> = [];

  if (options?.search) {
    where.push({ column: 'name', value: `%${options.search}%`, op: 'ilike' });
  }

  const [data, total] = await Promise.all([
    selectMany('companies', {
      select: 'id, name, industry, stain_group, stain_tier, country, city, headcount_range, website',
      where,
      orderBy: { column: 'engagement_score', ascending: false },
      limit,
      offset,
    }, 10000),
    countRows('companies', { where }),
  ]);

  return { data, total };
}
