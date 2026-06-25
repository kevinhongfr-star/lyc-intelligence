/**
 * Canonical user roles across the LYC Intelligence platform.
 *
 * This file defines the single source of truth for role names.
 * All frontend and backend code should import from here instead of
 * using hardcoded string literals.
 *
 * Role hierarchy (from most privileged to least):
 *   - super_admin:  Full system access, can manage all users and roles
 *   - lyc_admin:    LYC staff admin, can manage consultants and view all orgs
 *   - lyc_consultant: Individual contributor at LYC, can see assigned work
 *   - client_admin:  Client organization admin, can manage their org users
 *   - client_viewer: Read-only access to client organization data
 *   - member:        Standard user, limited access
 *   - council:       Premium tier user with additional credits
 *   - candidate:     Job candidate, can access candidate portal
 */

export type UserRole =
  | 'super_admin'
  | 'lyc_admin'
  | 'lyc_consultant'
  | 'client_admin'
  | 'client_viewer'
  | 'member'
  | 'council'
  | 'candidate';

/**
 * All valid role values in a single array for validation.
 */
export const VALID_ROLES: UserRole[] = [
  'super_admin',
  'lyc_admin',
  'lyc_consultant',
  'client_admin',
  'client_viewer',
  'member',
  'council',
  'candidate',
];

/**
 * Check if a role string is a valid canonical role.
 */
export function isValidRole(role: string): role is UserRole {
  return VALID_ROLES.includes(role as UserRole);
}

/**
 * Roles that can access admin functionality.
 */
export const ADMIN_ROLES: UserRole[] = ['super_admin', 'lyc_admin'];

/**
 * Roles that can access LYC internal data.
 */
export const LYC_INTERNAL_ROLES: UserRole[] = ['super_admin', 'lyc_admin', 'lyc_consultant'];

/**
 * Roles that belong to a client organization (not LYC staff).
 */
export const CLIENT_ROLES: UserRole[] = ['client_admin', 'client_viewer', 'member', 'council'];

/**
 * Check if a role has admin access.
 */
export function isAdminRole(role: string | undefined): boolean {
  return role === 'super_admin' || role === 'lyc_admin';
}

/**
 * Check if a role is a client organization role.
 */
export function isClientRole(role: string | undefined): boolean {
  return CLIENT_ROLES.includes(role as UserRole);
}

/**
 * Check if a role is a LYC internal role.
 */
export function isLyCInternalRole(role: string | undefined): boolean {
  return LYC_INTERNAL_ROLES.includes(role as UserRole);
}
