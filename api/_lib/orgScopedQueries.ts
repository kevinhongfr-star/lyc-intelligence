/**
 * Organization-scoped query helpers for multi-tenant authorization.
 * 
 * Role-based access control:
 * - super_admin: all orgs (global)
 * - lyc_admin: all mandates in their org
 * - lyc_consultant: only mandates assigned via mandate_members
 * - client_admin / client_viewer: only their org's data
 * - member / council / candidate: only their own data
 */

import type { UserRole } from '@/types';
import { selectOne, selectMany } from './supabaseRest';

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
  const role = profile?.role as UserRole;
  return role || 'member';
}

export async function getOrgScopedMandates(userId: string, userRole: UserRole, orgId: string): Promise<any[]> {
  if (userRole === 'super_admin') {
    return selectMany('mandates', {
      select: 'id, title, status, priority, client_id, jd_description, search_definition, skills_requirements, company:companies(id, name)',
      orderBy: { column: 'updated_at', ascending: false },
    }, 15000);
  }

  if (userRole === 'lyc_admin') {
    return selectMany('mandates', {
      select: 'id, title, status, priority, client_id, jd_description, search_definition, skills_requirements, company:companies(id, name)',
      where: [{ column: 'organization_id', value: orgId }],
      orderBy: { column: 'updated_at', ascending: false },
    }, 15000);
  }

  if (userRole === 'lyc_consultant') {
    const assignments = await selectMany('mandate_members', {
      select: 'mandate_id',
      where: [{ column: 'user_id', value: userId }],
    }, 15000);
    const mandateIds = assignments?.map((a: any) => a.mandate_id) || [];
    
    if (mandateIds.length === 0) return [];
    
    return selectMany('mandates', {
      select: 'id, title, status, priority, client_id, jd_description, search_definition, skills_requirements, company:companies(id, name)',
      where: [
        { column: 'organization_id', value: orgId },
        { column: 'id', value: `(${mandateIds.join(',')})`, op: 'in' },
      ],
      orderBy: { column: 'updated_at', ascending: false },
    }, 15000);
  }

  if (['client_admin', 'client_viewer'].includes(userRole)) {
    return selectMany('mandates', {
      select: 'id, title, status, priority, client_id, jd_description, search_definition, skills_requirements, company:companies(id, name)',
      where: [{ column: 'organization_id', value: orgId }],
      orderBy: { column: 'updated_at', ascending: false },
    }, 15000);
  }

  return [];
}

export async function getOrgScopedPipeline(userId: string, userRole: UserRole, orgId: string, mandateId?: string): Promise<any[]> {
  const where: Array<{ column: string; value: string | number | boolean; op?: string }> = [];
  
  if (mandateId) {
    where.push({ column: 'mandate_id', value: mandateId });
  }

  if (['member', 'council', 'candidate'].includes(userRole)) {
    const mandates = await getOrgScopedMandates(userId, userRole, orgId);
    const mandateIds = mandates.map((m: any) => m.id);
    
    if (mandateIds.length === 0) return [];
    where.push({ column: 'mandate_id', value: `(${mandateIds.join(',')})`, op: 'in' });
  } else if (userRole !== 'super_admin') {
    const mandates = await getOrgScopedMandates(userId, userRole, orgId);
    const mandateIds = mandates.map((m: any) => m.id);
    
    if (mandateIds.length === 0) return [];
    where.push({ column: 'mandate_id', value: `(${mandateIds.join(',')})`, op: 'in' });
  }

  return selectMany('candidates_pipeline', {
    select: '*, contact:contacts(id, name, current_title, email, company:companies(id, name)), mandate:mandates(id, title)',
    where,
    orderBy: { column: 'match_score', ascending: false },
  }, 15000);
}

export async function getOrgScopedContacts(userId: string, userRole: UserRole, orgId: string): Promise<any[]> {
  if (['member', 'council', 'candidate'].includes(userRole)) {
    const mandates = await getOrgScopedMandates(userId, userRole, orgId);
    const mandateIds = mandates.map((m: any) => m.id);
    
    if (mandateIds.length === 0) return [];

    const pipelineEntries = await selectMany('candidates_pipeline', {
      select: 'contact_id',
      where: [{ column: 'mandate_id', value: `(${mandateIds.join(',')})`, op: 'in' }],
    }, 15000);
    
    const contactIds = [...new Set(pipelineEntries.map((p: any) => p.contact_id))];
    
    if (contactIds.length === 0) return [];

    return selectMany('contacts', {
      select: 'id, name, email, current_title, company_id, location, country, seniority, skills, headline, summary, career_history, trident_composite, trident_d1, trident_d2, trident_d3, company:companies(id, name)',
      where: [{ column: 'id', value: `(${contactIds.join(',')})`, op: 'in' }],
      orderBy: { column: 'updated_at', ascending: false },
    }, 15000);
  }

  if (userRole === 'super_admin') {
    return selectMany('contacts', {
      select: 'id, name, email, current_title, company_id, location, country, seniority, skills, headline, summary, career_history, trident_composite, trident_d1, trident_d2, trident_d3, company:companies(id, name)',
      orderBy: { column: 'updated_at', ascending: false },
      limit: 1000,
    }, 15000);
  }

  const mandates = await getOrgScopedMandates(userId, userRole, orgId);
  const mandateIds = mandates.map((m: any) => m.id);
  
  if (mandateIds.length === 0) return [];

  const pipelineEntries = await selectMany('candidates_pipeline', {
    select: 'contact_id',
    where: [{ column: 'mandate_id', value: `(${mandateIds.join(',')})`, op: 'in' }],
  }, 15000);
  
  const contactIds = [...new Set(pipelineEntries.map((p: any) => p.contact_id))];
  
  if (contactIds.length === 0) return [];

  return selectMany('contacts', {
    select: 'id, name, email, current_title, company_id, location, country, seniority, skills, headline, summary, career_history, trident_composite, trident_d1, trident_d2, trident_d3, company:companies(id, name)',
    where: [{ column: 'id', value: `(${contactIds.join(',')})`, op: 'in' }],
    orderBy: { column: 'updated_at', ascending: false },
  }, 15000);
}

export function hasOrgAccess(userRole: UserRole): boolean {
  return ['client_admin', 'client_viewer', 'lyc_consultant', 'lyc_admin', 'super_admin'].includes(userRole);
}

export function isOrgAdmin(userRole: UserRole): boolean {
  return ['client_admin', 'lyc_admin', 'super_admin'].includes(userRole);
}

export function isReadOnly(userRole: UserRole): boolean {
  return userRole === 'client_viewer';
}

export async function getOrgScopedCompanies(userId: string, userRole: UserRole, orgId: string): Promise<any[]> {
  if (userRole === 'super_admin') {
    return selectMany('companies', {
      select: 'id, name, industry, stain_group, stain_tier, proximity, country, city, region, headcount_range, website, linkedin_url, description',
      orderBy: { column: 'engagement_score', ascending: false },
      limit: 500,
    }, 15000);
  }

  if (!hasOrgAccess(userRole)) {
    return [];
  }

  const mandates = await getOrgScopedMandates(userId, userRole, orgId);
  const companyIds = [...new Set(mandates.map((m: any) => m.client_id).filter(Boolean))];
  
  if (companyIds.length === 0) return [];

  return selectMany('companies', {
    select: 'id, name, industry, stain_group, stain_tier, proximity, country, city, region, headcount_range, website, linkedin_url, description',
    where: [{ column: 'id', value: `(${companyIds.join(',')})`, op: 'in' }],
    orderBy: { column: 'engagement_score', ascending: false },
  }, 15000);
}