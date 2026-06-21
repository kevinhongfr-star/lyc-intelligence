// src/types/index.ts
// Phase 0.2: Multi-Tenant Organization Support

// User roles with organization-scoping
export type UserRole = 
  | 'candidate'      // Self only - Candidate Portal
  | 'member'         // Self only - B2C Chat
  | 'council'        // Self only - paid, 5 credits/day
  | 'client_admin'   // Org-scoped - B2B Dashboard
  | 'client_viewer'  // Org-scoped - read-only
  | 'lyc_consultant' // Cross-org - assigned mandates only
  | 'lyc_admin'      // Cross-org - all mandates
  | 'super_admin';   // Global - all surfaces

// Legacy role mapping for backward compatibility
export const LEGACY_ROLE_MAP: Record<string, UserRole> = {
  user: 'member',
  admin: 'super_admin',
};

// Organization types
export interface Organization {
  id: string;
  name: string;
  domain: string | null;
  stripe_customer_id: string | null;
  credit_balance: number;
  plan: 'member' | 'council' | 'enterprise';
  created_at: string;
  updated_at: string;
}

// Extended user interface with organization support
export interface User {
  id: string;
  email: string;
  name: string;
  icp: ICP;
  role: UserRole;
  organization_id: string;
  organization?: Organization;
}

// Keep existing types for backward compatibility
export type ICP = 'client' | 'consultant' | 'leader' | 'candidate';

// Organization-scoped query parameters
export interface OrgScopedQuery {
  organization_id: string;
  user_id: string;
  role: UserRole;
}

// Permission check result
export interface PermissionCheck {
  allowed: boolean;
  scope: 'self' | 'org' | 'cross-org' | 'global';
  reason?: string;
}

// Role hierarchy for permission inheritance
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  candidate: 0,
  member: 1,
  council: 2,
  client_viewer: 3,
  client_admin: 4,
  lyc_consultant: 5,
  lyc_admin: 6,
  super_admin: 7,
};

// Role scopes for quick reference
export const ROLE_SCOPES: Record<UserRole, 'self' | 'org' | 'cross-org' | 'global'> = {
  candidate: 'self',
  member: 'self',
  council: 'self',
  client_admin: 'org',
  client_viewer: 'org',
  lyc_consultant: 'cross-org',
  lyc_admin: 'cross-org',
  super_admin: 'global',
};

// Helper function to check if role has sufficient permissions
export function hasSufficientRole(
  userRole: UserRole,
  requiredRole: UserRole
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

// Helper function to get role scope
export function getRoleScope(role: UserRole): 'self' | 'org' | 'cross-org' | 'global' {
  return ROLE_SCOPES[role];
}

// Helper function to check if role can write data
export function canWriteData(role: UserRole): boolean {
  return role !== 'client_viewer' && role !== 'candidate';
}

// Helper function to check if role can delete data
export function canDeleteData(role: UserRole): boolean {
  return ['lyc_admin', 'super_admin'].includes(role);
}
