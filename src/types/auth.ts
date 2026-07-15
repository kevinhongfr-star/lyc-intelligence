/**
 * Unified Role & Permission Types
 * 
 * This is the SINGLE source of truth for all role definitions.
 * All other files should import from here, not define their own.
 */

// Canonical role hierarchy (highest to lowest privilege)
export type UserRole =
  | 'super_admin'      // Platform-wide admin (Kevin, Alessio)
  | 'admin'            // Organization admin
  | 'team_lead'        // Team lead within org
  | 'consultant'       // LYC consultant
  | 'client_admin'     // Client company admin
  | 'client_user'      // Client company user
  | 'council_member'   // Council member (PE partners)
  | 'candidate'        // Executive candidate
  | 'member';          // Basic member (B2C)

// Role display labels
export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  team_lead: 'Team Lead',
  consultant: 'Consultant',
  client_admin: 'Client Admin',
  client_user: 'Client User',
  council_member: 'Council Member',
  candidate: 'Candidate',
  member: 'Member',
};

// Role hierarchy for permission checks
export const ROLE_HIERARCHY: UserRole[] = [
  'super_admin',
  'admin',
  'team_lead',
  'consultant',
  'client_admin',
  'client_user',
  'council_member',
  'candidate',
  'member',
];

// Check if role A has equal or higher privilege than role B
export function hasRoleLevel(roleA: UserRole, roleB: UserRole): boolean {
  const indexA = ROLE_HIERARCHY.indexOf(roleA);
  const indexB = ROLE_HIERARCHY.indexOf(roleB);
  return indexA <= indexB; // Lower index = higher privilege
}

// Admin roles (can access admin panel)
export const ADMIN_ROLES: UserRole[] = ['super_admin', 'admin'];

// Org-scoped roles (have organization_id)
export const ORG_ROLES: UserRole[] = [
  'super_admin',
  'admin',
  'team_lead',
  'consultant',
  'client_admin',
  'client_user',
];

// Client portal roles
export const CLIENT_ROLES: UserRole[] = ['client_admin', 'client_user'];

// Permission resources
export type PermissionResource =
  | 'dashboard'
  | 'pipeline'
  | 'mandates'
  | 'candidates'
  | 'companies'
  | 'reports'
  | 'settings'
  | 'admin'
  | 'billing'
  | 'team'
  | 'analytics'
  | 'compliance'
  | 'nexus'
  | 'credits';

// Permission actions
export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'export' | 'admin';

// Permission definition
export interface Permission {
  resource: PermissionResource;
  action: PermissionAction;
}

// Default role permissions
export const DEFAULT_ROLE_PERMISSIONS: Partial<Record<UserRole, Permission[]>> = {
  super_admin: [
    { resource: 'admin', action: 'admin' },
    { resource: 'team', action: 'admin' },
    { resource: 'analytics', action: 'admin' },
    { resource: 'compliance', action: 'admin' },
    { resource: 'billing', action: 'admin' },
    { resource: 'settings', action: 'admin' },
  ],
  admin: [
    { resource: 'admin', action: 'view' },
    { resource: 'team', action: 'admin' },
    { resource: 'analytics', action: 'view' },
    { resource: 'billing', action: 'view' },
    { resource: 'settings', action: 'edit' },
  ],
  team_lead: [
    { resource: 'pipeline', action: 'admin' },
    { resource: 'mandates', action: 'admin' },
    { resource: 'candidates', action: 'admin' },
    { resource: 'reports', action: 'export' },
  ],
  consultant: [
    { resource: 'pipeline', action: 'view' },
    { resource: 'mandates', action: 'edit' },
    { resource: 'candidates', action: 'edit' },
    { resource: 'companies', action: 'view' },
    { resource: 'reports', action: 'view' },
    { resource: 'nexus', action: 'view' },
  ],
  client_admin: [
    { resource: 'dashboard', action: 'view' },
    { resource: 'mandates', action: 'view' },
    { resource: 'candidates', action: 'view' },
    { resource: 'reports', action: 'view' },
    { resource: 'settings', action: 'edit' },
  ],
  client_user: [
    { resource: 'dashboard', action: 'view' },
    { resource: 'mandates', action: 'view' },
    { resource: 'candidates', action: 'view' },
    { resource: 'reports', action: 'view' },
  ],
  council_member: [
    { resource: 'dashboard', action: 'view' },
    { resource: 'nexus', action: 'view' },
    { resource: 'settings', action: 'view' },
  ],
  candidate: [
    { resource: 'dashboard', action: 'view' },
    { resource: 'settings', action: 'view' },
  ],
  member: [
    { resource: 'dashboard', action: 'view' },
    { resource: 'nexus', action: 'view' },
    { resource: 'settings', action: 'view' },
  ],
};

// Credit tier (separate from role)
export type CreditTier = 'free' | 'member' | 'pro' | 'council' | 'enterprise';

export const CREDIT_TIER_LABELS: Record<CreditTier, string> = {
  free: 'Free',
  member: 'Member',
  pro: 'Pro',
  council: 'Council',
  enterprise: 'Enterprise',
};

// User profile interface (matches v2_user_profiles table)
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tier: CreditTier;
  organization_id: string | null;
  organization_name?: string | null;
  avatar_url?: string | null;
  timezone?: string;
  locale?: string;
  created_at: string;
  updated_at: string;
}

// Auth session with JWT claims
export interface AuthSession {
  user: {
    id: string;
    email: string;
  };
  profile: UserProfile | null;
  organization: {
    id: string | null;
    name: string | null;
    role: UserRole | null;
  };
  permissions: Permission[];
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Legacy role map for backwards compatibility
export const LEGACY_ROLE_MAP: Record<string, UserRole> = {
  user: 'member',
  admin: 'admin',
  superadmin: 'super_admin',
  lyc_admin: 'admin',
  lyc_consultant: 'consultant',
  team_lead: 'team_lead',
  client: 'client_user',
  client_admin: 'client_admin',
  client_viewer: 'client_user',
  council: 'council_member',
};