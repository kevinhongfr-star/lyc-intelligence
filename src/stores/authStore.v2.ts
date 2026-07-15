import { create } from 'zustand';
import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';
import type { UserRole, CreditTier, UserProfile, Permission, LEGACY_ROLE_MAP } from '@/types/auth';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = (import.meta.env.VITE_SUPABASE_KEY as string) || (import.meta.env.VITE_SUPABASE_ANON_KEY as string);

// Legacy role map inline (in case import fails during initial load)
const ROLE_MAP: Record<string, UserRole> = {
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

// Normalize role from DB
function normalizeRole(role: string | null): UserRole {
  if (!role) return 'member';
  if (ROLE_MAP[role]) return ROLE_MAP[role];
  return role as UserRole;
}

// Normalize tier from DB
function normalizeTier(tier: string | null): CreditTier {
  const validTiers: CreditTier[] = ['free', 'member', 'pro', 'council', 'enterprise'];
  if (!tier) return 'free';
  return validTiers.includes(tier as CreditTier) ? tier as CreditTier : 'free';
}

interface Organization {
  id: string;
  name: string;
  role: UserRole;
}

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  organization: Organization | null;
  permissions: Permission[];
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;
  supabase: SupabaseClient | null;
  
  // Actions
  initialize: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInWithMagicLink: (email: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  switchOrganization: (orgId: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasPermission: (resource: string, action: string) => boolean;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  organization: null,
  permissions: [],
  session: null,
  isLoading: true,
  isInitialized: false,
  supabase: SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }) : null,

  initialize: async () => {
    const { supabase } = get();
    if (!supabase) {
      set({ isLoading: false, isInitialized: true });
      return;
    }

    try {
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        set({ user: session.user, session });
        await get().refreshProfile();
      }

      // Listen for auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (event === 'SIGNED_IN' && newSession?.user) {
          set({ user: newSession.user, session: newSession });
          await get().refreshProfile();
        } else if (event === 'SIGNED_OUT') {
          set({
            user: null,
            profile: null,
            organization: null,
            permissions: [],
            session: null,
          });
        } else if (event === 'TOKEN_REFRESHED' && newSession) {
          set({ session: newSession });
        }
      });

      set({ isInitialized: true, isLoading: false });
    } catch (error) {
      console.error('[AuthStore] Initialize error:', error);
      set({ isLoading: false, isInitialized: true });
    }
  },

  signInWithPassword: async (email: string, password: string) => {
    const { supabase } = get();
    if (!supabase) return { success: false, error: 'Supabase not configured' };

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };

      set({ user: data.user, session: data.session });
      await get().refreshProfile();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to sign in' };
    }
  },

  signInWithMagicLink: async (email: string) => {
    const { supabase } = get();
    if (!supabase) return { success: false, error: 'Supabase not configured' };

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to send magic link' };
    }
  },

  signUp: async (email: string, password: string, name: string) => {
    const { supabase } = get();
    if (!supabase) return { success: false, error: 'Supabase not configured' };

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, tier: 'free', role: 'member' },
        },
      });
      
      if (error) return { success: false, error: error.message };
      if (!data.user) return { success: false, error: 'User creation failed' };

      // Create profile via RPC (handles defaults)
      await supabase.rpc('create_user_profile', {
        user_id: data.user.id,
        user_email: email,
        user_name: name,
      });

      // Create initial credits
      await supabase.from('credits').insert({
        user_id: data.user.id,
        balance: 2,
        daily_balance: 2,
        tier: 'free',
        last_daily_reset: new Date().toISOString(),
      }).catch(() => {}); // Ignore if table doesn't exist

      if (data.session) {
        set({ user: data.user, session: data.session });
        await get().refreshProfile();
      }

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to create account' };
    }
  },

  signOut: async () => {
    const { supabase } = get();
    if (supabase) {
      await supabase.auth.signOut();
    }
    set({
      user: null,
      profile: null,
      organization: null,
      permissions: [],
      session: null,
    });
  },

  switchOrganization: async (orgId: string) => {
    const { supabase, profile } = get();
    if (!supabase || !profile) return;

    try {
      // Get user's role in the new org
      const { data: membership } = await supabase
        .from('v2_org_memberships')
        .select('role, organizations(id, name)')
        .eq('user_id', profile.id)
        .eq('organization_id', orgId)
        .single();

      if (membership) {
        set({
          organization: {
            id: orgId,
            name: (membership as any).organizations?.name || 'Unknown',
            role: normalizeRole((membership as any).role),
          },
        });
      }
    } catch (error) {
      console.error('[AuthStore] Switch organization error:', error);
    }
  },

  refreshProfile: async () => {
    const { supabase, user } = get();
    if (!supabase || !user) return;

    try {
      // Try v2_user_profiles first, fall back to profiles
      let profile: UserProfile | null = null;

      // Check v2_user_profiles
      const { data: v2Profile } = await supabase
        .from('v2_user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (v2Profile) {
        profile = {
          id: v2Profile.id,
          email: v2Profile.email || user.email || '',
          name: v2Profile.name || user.user_metadata?.name || '',
          role: normalizeRole(v2Profile.role),
          tier: normalizeTier(v2Profile.tier),
          organization_id: v2Profile.organization_id,
          avatar_url: v2Profile.avatar_url,
          timezone: v2Profile.timezone,
          locale: v2Profile.locale,
          created_at: v2Profile.created_at,
          updated_at: v2Profile.updated_at,
        };
      } else {
        // Fall back to profiles table
        const { data: legacyProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (legacyProfile) {
          profile = {
            id: legacyProfile.id,
            email: legacyProfile.email || user.email || '',
            name: legacyProfile.name || legacyProfile.full_name || user.user_metadata?.name || '',
            role: normalizeRole(legacyProfile.role),
            tier: normalizeTier(legacyProfile.tier),
            organization_id: legacyProfile.organization_id,
            created_at: legacyProfile.created_at,
            updated_at: legacyProfile.updated_at,
          };
        }
      }

      if (profile) {
        // Get organization if user belongs to one
        let organization: Organization | null = null;

        if (profile.organization_id) {
          const { data: org } = await supabase
            .from('v2_organizations')
            .select('id, name')
            .eq('id', profile.organization_id)
            .single();

          if (org) {
            // Get user's role in org
            const { data: membership } = await supabase
              .from('v2_org_memberships')
              .select('role')
              .eq('user_id', user.id)
              .eq('organization_id', profile.organization_id)
              .single();

            organization = {
              id: org.id,
              name: org.name,
              role: membership ? normalizeRole(membership.role) : profile.role,
            };
          }
        }

        // Get permissions
        const { data: rolePerms } = await supabase
          .from('role_permissions')
          .select('resource, action')
          .eq('role', profile.role)
          .eq('allowed', true);

        const permissions: Permission[] = (rolePerms || []).map((p: any) => ({
          resource: p.resource,
          action: p.action,
        }));

        set({ profile, organization, permissions });
      }
    } catch (error) {
      console.error('[AuthStore] Refresh profile error:', error);
    }
  },

  hasPermission: (resource: string, action: string): boolean => {
    const { permissions, profile } = get();
    if (!profile) return false;

    // Super admin has all permissions
    if (profile.role === 'super_admin') return true;

    return permissions.some(
      (p) => p.resource === resource && (p.action === action || p.action === 'admin')
    );
  },

  hasRole: (roles: UserRole | UserRole[]): boolean => {
    const { profile } = get();
    if (!profile) return false;

    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(profile.role);
  },
}));

// Export convenience hook
export function useAuth() {
  const store = useAuthStore();
  return {
    user: store.user,
    profile: store.profile,
    organization: store.organization,
    permissions: store.permissions,
    isLoading: store.isLoading,
    isAuthenticated: !!store.user && !!store.profile,
    signInWithPassword: store.signInWithPassword,
    signInWithMagicLink: store.signInWithMagicLink,
    signUp: store.signUp,
    signOut: store.signOut,
    switchOrganization: store.switchOrganization,
    hasPermission: store.hasPermission,
    hasRole: store.hasRole,
  };
}