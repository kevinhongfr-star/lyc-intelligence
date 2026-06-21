// src/services/auth/orgScopedQueries.ts
// Phase 0.2: Organization-scoped data access helpers

import { createClient } from '@/lib/supabaseClient';
import type { UserRole } from '@/types';

const supabase = createClient();

export async function getOrgId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', userId)
    .single();

  if (error || !data) {
    console.error('Error fetching organization ID:', error);
    return null;
  }

  return data.organization_id;
}

export async function getUserRole(userId: string): Promise<UserRole | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (error || !data) {
    console.error('Error fetching user role:', error);
    return null;
  }

  return data.role as UserRole;
}

export function getOrgScopedMandates(
  userId: string,
  userRole: UserRole,
  orgId: string
) {
  let query = supabase.from('mandates').select('*');

  switch (userRole) {
    case 'candidate':
    case 'member':
    case 'council':
      query = query.eq('user_id', userId);
      break;
    case 'client_admin':
    case 'client_viewer':
      query = query.eq('organization_id', orgId);
      break;
    case 'lyc_consultant':
      query = query
        .eq('organization_id', orgId)
        .in(
          'id',
          supabase
            .from('mandate_members')
            .select('mandate_id')
            .eq('user_id', userId)
        );
      break;
    case 'lyc_admin':
      query = query.eq('organization_id', orgId);
      break;
    case 'super_admin':
      // No filter - access to all mandates
      break;
    default:
      query = query.eq('user_id', userId);
  }

  return query;
}

export function getOrgScopedCandidates(
  userId: string,
  userRole: UserRole,
  orgId: string
) {
  let query = supabase.from('candidates_pipeline').select('*');

  switch (userRole) {
    case 'candidate':
      query = query.eq('user_id', userId);
      break;
    case 'member':
    case 'council':
      query = query.eq('organization_id', orgId);
      break;
    case 'client_admin':
    case 'client_viewer':
      query = query.eq('organization_id', orgId);
      break;
    case 'lyc_consultant':
      query = query
        .eq('organization_id', orgId)
        .in(
          'mandate_id',
          supabase
            .from('mandate_members')
            .select('mandate_id')
            .eq('user_id', userId)
        );
      break;
    case 'lyc_admin':
      query = query.eq('organization_id', orgId);
      break;
    case 'super_admin':
      // No filter - access to all candidates
      break;
    default:
      query = query.eq('user_id', userId);
  }

  return query;
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
