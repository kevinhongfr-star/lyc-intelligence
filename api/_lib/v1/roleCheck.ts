/**
 * v1 RBAC — role hierarchy + user_type checks.
 *
 * Role hierarchy (highest to lowest):
 *   super_admin > lyc_admin > admin > team_lead > lyc_consultant >
 *   client_admin > client_viewer > council > member > candidate
 *
 * hasRole(user, required) returns true if the user's role is at or above
 * the required level in the hierarchy.
 *
 * hasUserType checks the portal segment (candidate/client/b2c/council/etc.).
 */

import type { UserRole } from '../../../src/types/index.js';
import type { UserType, V1AuthUser } from './auth.js';

const ROLE_HIERARCHY: UserRole[] = [
  'candidate',
  'member',
  'council',
  'team_lead',
  'client_viewer',
  'client_admin',
  'lyc_consultant',
  'admin',
  'lyc_admin',
  'super_admin',
];

function roleLevel(role: UserRole): number {
  const idx = ROLE_HIERARCHY.indexOf(role);
  return idx === -1 ? -1 : idx;
}

/** True if user's role is at or above the required role level. */
export function hasRole(user: V1AuthUser | null, required: UserRole): boolean {
  if (!user) return false;
  return roleLevel(user.role) >= roleLevel(required);
}

/** True if user's role matches any in the list. */
export function hasAnyRole(user: V1AuthUser | null, roles: UserRole[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

/** True if user_type matches. */
export function hasUserType(user: V1AuthUser | null, type: UserType): boolean {
  if (!user) return false;
  return user.user_type === type;
}

/** True if user_type matches any in the list. */
export function hasAnyUserType(user: V1AuthUser | null, types: UserType[]): boolean {
  if (!user) return false;
  return types.includes(user.user_type);
}

/**
 * Combined check: user must be authenticated AND satisfy either
 * a role requirement OR a user_type requirement.
 */
export function isAuthorized(
  user: V1AuthUser | null,
  opts: { role?: UserRole; roles?: UserRole[]; userType?: UserType; userTypes?: UserType[] }
): boolean {
  if (!user) return false;
  if (opts.role && hasRole(user, opts.role)) return true;
  if (opts.roles && hasAnyRole(user, opts.roles)) return true;
  if (opts.userType && hasUserType(user, opts.userType)) return true;
  if (opts.userTypes && hasAnyUserType(user, opts.userTypes)) return true;
  return false;
}

/** Shortcut — is this an internal LYC user (admin/consultant/team_lead)? */
export function isInternalUser(user: V1AuthUser | null): boolean {
  if (!user) return false;
  return (
    user.user_type === 'internal' ||
    ['super_admin', 'lyc_admin', 'admin', 'team_lead', 'lyc_consultant'].includes(user.role)
  );
}
