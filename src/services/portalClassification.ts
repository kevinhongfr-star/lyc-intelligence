/**
 * Phase 16 — Portal Classification Service
 *
 * Maps roles / user types to the FOUR PORTAL IDENTITIES:
 *   1. Marketing   — public, no auth
 *   2. Leader      — B2C individual executives (/app/*)
 *   3. Consultant  — LYC consultants + B2B client organizations (/portal/*, /client/*)
 *   4. Admin       — internal LYC admin staff (/admin/*)
 *
 * Role hierarchy (sourced from roleUtils.ts ROLE_HIERARCHY):
 *   candidate < member < council < client_viewer < client_admin <
 *   lyc_consultant < team_lead < admin < lyc_admin < super_admin
 *
 * Consultants also get Leader access (can view Leader portal pages).
 * Admins also get Consultant access + Leader access.
 */

export type PortalIdentity = 'marketing' | 'leader' | 'consultant' | 'admin';

/**
 * Primary classification for portal identity from a role string.
 * Returns the HIGHEST-privilege portal the user qualifies for.
 *
 * - null/undefined → marketing (public)
 * - candidate/council/explorer/starter/pro/executive/enterprise (any unknown B2C tier) → leader
 * - client_viewer/client_admin → consultant (client sub-portal)
 * - lyc_consultant/team_lead → consultant
 * - admin/lyc_admin/super_admin → admin
 */
export function classifyPortal(role: string | null | undefined): PortalIdentity {
  if (!role) return 'marketing';
  switch (role) {
    case 'super_admin':
    case 'lyc_admin':
    case 'admin':
      return 'admin';
    case 'team_lead':
    case 'lyc_consultant':
    case 'client_admin':
    case 'client_viewer':
      return 'consultant';
    case 'council':
    case 'candidate':
    case 'explorer':
    case 'starter':
    case 'pro':
    case 'executive':
    case 'enterprise':
    case 'leader':
    default:
      return 'leader';
  }
}

/** True when role qualifies for ADMIN access (admin/lyc_admin/super_admin). */
export function isAdminRole(role: string | null | undefined): boolean {
  if (!role) return false;
  return role === 'super_admin' || role === 'lyc_admin' || role === 'admin';
}

/** True when role qualifies for CONSULTANT access (internal staff + client users). */
export function isConsultantRole(role: string | null | undefined): boolean {
  if (!role) return false;
  switch (role) {
    case 'super_admin':
    case 'lyc_admin':
    case 'admin':
    case 'team_lead':
    case 'lyc_consultant':
    case 'client_admin':
    case 'client_viewer':
      return true;
    default:
      return false;
  }
}

/** True when role is a B2B CLIENT user (not internal consultant). */
export function isClientRole(role: string | null | undefined): boolean {
  if (!role) return false;
  return role === 'client_admin' || role === 'client_viewer';
}

/** True when role is internal staff (not client, not B2C leader). */
export function isInternalStaff(role: string | null | undefined): boolean {
  if (!role) return false;
  switch (role) {
    case 'super_admin':
    case 'lyc_admin':
    case 'admin':
    case 'team_lead':
    case 'lyc_consultant':
      return true;
    default:
      return false;
  }
}

/** True when role qualifies for B2C LEADER portal. */
export function isLeaderRole(role: string | null | undefined): boolean {
  if (!role) return false;
  switch (role) {
    case 'candidate':
    case 'member':
    case 'council':
    case 'explorer':
    case 'basic':
    case 'pro':
    case 'enterprise':
      return true;
    default:
      // Internal staff also count as leaders (can view leader portal if they want)
      return isInternalStaff(role);
  }
}

/**
 * Post-login default destination per role.
 *
 * Admin → /admin/dashboard
 * Internal consultant staff (lyc_consultant/team_lead) → /portal/dashboard
 * Client users → /client/overview
 * Candidate → /candidate/dashboard
 * B2C leaders → /app/nexus
 */
export function getDefaultPortalRoute(role: string | null | undefined): string {
  if (!role) return '/';
  switch (role) {
    case 'super_admin':
    case 'lyc_admin':
    case 'admin':
      return '/admin/dashboard';
    case 'team_lead':
    case 'lyc_consultant':
      return '/portal/dashboard';
    case 'client_admin':
    case 'client_viewer':
      return '/client/overview';
    case 'candidate':
      return '/candidate/dashboard';
    case 'member':
    case 'council':
    case 'explorer':
    case 'basic':
    case 'pro':
    case 'enterprise':
    default:
      return '/app/nexus';
  }
}
