/**
 * Portal layout system — role / user-type helpers.
 *
 * The hierarchy is enforced by `ROLE_HIERARCHY` (lowest → highest). All
 * helpers accept `V1AuthUser | null` and short-circuit to `false` for a
 * null user so call sites never need a separate null check.
 */
import type { UserRole } from '@/types';
import type { UserType, V1AuthUser } from '@/hooks/v1/types';

/**
 * Role hierarchy, lowest → highest (index = privilege level).
 *
 *   candidate < member < council < client_viewer < client_admin <
 *   lyc_consultant < team_lead < admin < lyc_admin < super_admin
 */
export const ROLE_HIERARCHY: UserRole[] = [
  'candidate',
  'member',
  'council',
  'client_viewer',
  'client_admin',
  'lyc_consultant',
  'team_lead',
  'admin',
  'lyc_admin',
  'super_admin',
];

/** Index of `role` in the hierarchy, or -1 when unknown. */
export function roleLevel(role: UserRole): number {
  return ROLE_HIERARCHY.indexOf(role);
}

/** True when `user.role` is at or above `required` privilege level. */
export function hasRole(user: V1AuthUser | null, required: UserRole): boolean {
  if (!user) return false;
  const userLevel = roleLevel(user.role);
  const requiredLevel = roleLevel(required);
  if (userLevel === -1 || requiredLevel === -1) return false;
  return userLevel >= requiredLevel;
}

/** True when `user.role` matches ANY of `roles`. */
export function hasAnyRole(user: V1AuthUser | null, roles: UserRole[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

/** True when `user.user_type` matches `type`. */
export function hasUserType(user: V1AuthUser | null, type: UserType): boolean {
  if (!user) return false;
  return user.user_type === type;
}

/** True when `user.user_type` matches ANY of `types`. */
export function hasAnyUserType(
  user: V1AuthUser | null,
  types: UserType[],
): boolean {
  if (!user) return false;
  return types.includes(user.user_type);
}

/**
 * True for internal staff: user_type `internal` OR a role in
 * `[super_admin, lyc_admin, admin, team_lead, lyc_consultant]`.
 */
export function isInternalUser(user: V1AuthUser | null): boolean {
  if (!user) return false;
  if (user.user_type === 'internal') return true;
  return hasAnyRole(user, [
    'super_admin',
    'lyc_admin',
    'admin',
    'team_lead',
    'lyc_consultant',
  ]);
}
