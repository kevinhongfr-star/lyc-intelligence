/**
 * Organization-scoped query helpers — simplified for current schema.
 * 
 * Current DB schema notes:
 * - profiles.organization_id is null for all users (multi-tenant not yet active)
 * - mandates has no organization_id column (uses client_id → companies.id)
 * - companies has no organization_id column
 * - roles: 'admin' maps to super_admin, 'user' maps to member
 * 
 * Until multi-tenant is implemented, all authenticated users get full access.
 */

import type { UserRole } from '../../src/types/index.js';
import { selectOne, selectMany } from './supabaseRest.js';

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

export async function getOrgScopedMandates(userId: string, userRole: UserRole, orgId: string | null): Promise<any[]> {
  // No org filtering yet — return all mandates
  return selectMany('mandates', {
    select: 'id, title, status, priority, client_id, jd_description, search_definition, skills_requirements',
    orderBy: { column: 'updated_at', ascending: false },
  }, 15000);
}

export async function getOrgScopedPipeline(userId: string, userRole: UserRole, orgId: string | null, mandateId?: string): Promise<any[]> {
  const where: Array<{ column: string; value: string | number | boolean; op?: string }> = [];
  if (mandateId) {
    where.push({ column: 'mandate_id', value: mandateId });
  }
  return selectMany('candidates_pipeline', {
    select: '*, contact:contacts(id, name, current_title, email, company:companies(id, name)), mandate:mandates(id, title)',
    where,
    orderBy: { column: 'match_score', ascending: false },
  }, 15000);
}

export async function getOrgScopedContacts(userId: string, userRole: UserRole, orgId: string | null): Promise<any[]> {
  return selectMany('contacts', {
    select: 'id, name, email, current_title, company_id, location, country, seniority, skills, headline, summary, career_history, trident_composite, trident_d1, trident_d2, trident_d3, company:companies(id, name)',
    orderBy: { column: 'updated_at', ascending: false },
    limit: 1000,
  }, 15000);
}

export function hasOrgAccess(userRole: UserRole): boolean {
  // All authenticated users have access in single-tenant mode
  return true;
}

export function isOrgAdmin(userRole: UserRole): boolean {
  return userRole === 'super_admin';
}

export function isReadOnly(userRole: UserRole): boolean {
  return userRole === 'client_viewer';
}

export async function getOrgScopedCompanies(userId: string, userRole: UserRole, orgId: string | null): Promise<any[]> {
  return selectMany('companies', {
    select: 'id, name, industry, stain_group, stain_tier, proximity, country, city, region, headcount_range, website, linkedin_url, description',
    orderBy: { column: 'engagement_score', ascending: false },
    limit: 500,
  }, 15000);
}
