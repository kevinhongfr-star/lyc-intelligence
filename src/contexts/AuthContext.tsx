import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';
import type { UserRole, CreditTier, UserProfile } from '@/types/auth';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = (import.meta.env.VITE_SUPABASE_KEY as string) || (import.meta.env.VITE_SUPABASE_ANON_KEY as string);

const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
}) : null;

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithMagicLink: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  hasPermission: (resource: string, action: string) => boolean;
  supabase: SupabaseClient | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => ({ success: false }),
  loginWithMagicLink: async () => ({ success: false }),
  logout: async () => {},
  signup: async () => ({ success: false }),
  refreshProfile: async () => {},
  hasRole: () => false,
  hasPermission: () => false,
  supabase: null,
});

export function useAuth() { return useContext(AuthContext); }

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!user || !supabase) return;

    try {
      const { data: profileData, error } = await supabase
        .from('v2_user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('[AuthContext] Failed to fetch profile:', error);
        return;
      }

      if (profileData) {
        setProfile({
          id: profileData.id,
          email: profileData.email,
          name: profileData.name || '',
          role: profileData.role as UserRole,
          tier: profileData.tier as CreditTier,
          organization_id: profileData.organization_id,
          avatar_url: profileData.avatar_url || null,
          timezone: profileData.timezone || 'Asia/Shanghai',
          locale: profileData.locale || 'en',
          created_at: profileData.created_at,
          updated_at: profileData.updated_at,
        });
      }
    } catch (e) {
      console.error('[AuthContext] Error refreshing profile:', e);
    }
  }, [user, supabase]);

  const login = useCallback(async (email: string, password: string) => {
    if (!supabase) return { success: false, error: 'Supabase not configured' };

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.session) {
        setUser(data.session.user);
        setSession(data.session);
        await refreshProfile();
        return { success: true };
      }

      return { success: false, error: 'Login failed' };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  }, [supabase, refreshProfile]);

  const loginWithMagicLink = useCallback(async (email: string) => {
    if (!supabase) return { success: false, error: 'Supabase not configured' };

    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  }, [supabase]);

  const signup = useCallback(async (email: string, password: string, name: string) => {
    if (!supabase) return { success: false, error: 'Supabase not configured' };

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        setUser(data.user);
        if (data.session) {
          setSession(data.session);
        }
        return { success: true };
      }

      return { success: false, error: 'Signup failed' };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  }, [supabase]);

  const logout = useCallback(async () => {
    if (!supabase) return;
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setSession(null);
    } catch (e) {
      console.error('[AuthContext] Logout error:', e);
    }
  }, [supabase]);

  const hasRole = useCallback((roles: UserRole | UserRole[]): boolean => {
    if (!profile) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(profile.role);
  }, [profile]);

  const hasPermission = useCallback((resource: string, action: string): boolean => {
    if (!profile) return false;

    const permissions: Record<UserRole, Record<string, string[]>> = {
      super_admin: { admin: ['admin'], team: ['admin'], billing: ['admin'], settings: ['admin'], analytics: ['admin'] },
      admin: { admin: ['view'], team: ['admin'], billing: ['view'], settings: ['edit'], analytics: ['view'] },
      team_lead: { pipeline: ['admin'], mandates: ['admin'], candidates: ['admin'], reports: ['export'] },
      consultant: { pipeline: ['view'], mandates: ['edit'], candidates: ['edit'], companies: ['view'], reports: ['view'], nexus: ['view'] },
      client_admin: { dashboard: ['view'], mandates: ['view'], candidates: ['view'], reports: ['view'], settings: ['edit'] },
      client_user: { dashboard: ['view'], mandates: ['view'], candidates: ['view'], reports: ['view'] },
      council_member: { dashboard: ['view'], nexus: ['view'], settings: ['view'] },
      candidate: { dashboard: ['view'], settings: ['view'] },
      member: { dashboard: ['view'], nexus: ['view'], settings: ['view'] },
    };

    const rolePermissions = permissions[profile.role];
    if (!rolePermissions) return false;

    const resourceActions = rolePermissions[resource];
    if (!resourceActions) return false;

    return resourceActions.includes(action);
  }, [profile]);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUser(session.user);
          setSession(session);
          await refreshProfile();
        }
      } catch (e) {
        console.error('[AuthContext] Failed to get session:', e);
      } finally {
        setIsLoading(false);
      }
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        setSession(session);
        refreshProfile();
      } else {
        setUser(null);
        setProfile(null);
        setSession(null);
      }
    });

    return () => {
      authListener?.unsubscribe();
    };
  }, [supabase, refreshProfile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isAuthenticated: !!user && !!profile,
        login,
        loginWithMagicLink,
        logout,
        signup,
        refreshProfile,
        hasRole,
        hasPermission,
        supabase,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}