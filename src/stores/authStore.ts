import { create } from 'zustand';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = (import.meta.env.VITE_SUPABASE_KEY as string) || (import.meta.env.VITE_SUPABASE_ANON_KEY as string);

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  current_title: string | null;
  company: string | null;
  country: string | null;
  goal_short: string | null;
  goal_long: string | null;
  target_geography: string | null;
  icp_selector: 'leader' | 'job_seeker' | 'hiring' | 'search_professional' | null;
  tier: 'free' | 'pro' | 'council' | 'enterprise';
  referral_code: string | null;
  referred_by: string | null;
  streak_days: number;
  last_active_date: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthStore {
  user: any | null;
  profile: UserProfile | null;
  isLoading: boolean;
  supabase: SupabaseClient | null;
  initialize: () => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<{ success: boolean; error?: string }>;
  signInWithPassword: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, icp: string, name: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  loadProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  generateReferralCode: () => string;
}

const generateReferralCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true,
  supabase: SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null,

  initialize: async () => {
    const { supabase } = get();
    if (!supabase) { set({ isLoading: false }); return; }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        set({ user: session.user });
        await get().loadProfile();
      }

      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          set({ user: session.user });
          await get().loadProfile();
        } else if (event === 'SIGNED_OUT') {
          set({ user: null, profile: null });
        }
      });
    } catch (e) {
      console.error('[AuthStore] init error:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  signInWithMagicLink: async (email: string) => {
    const { supabase } = get();
    if (!supabase) return { success: false, error: 'Supabase not configured' };

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` }
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to send magic link' };
    }
  },

  signInWithPassword: async (email: string, password: string) => {
    const { supabase } = get();
    if (!supabase) return { success: false, error: 'Supabase not configured' };

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };
      set({ user: data.user });
      await get().loadProfile();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to sign in' };
    }
  },

  signUp: async (email: string, password: string, icp: string, name: string) => {
    const { supabase } = get();
    if (!supabase) return { success: false, error: 'Supabase not configured' };

    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return { success: false, error: error.message };
      
      if (data.user) {
        const referralCode = generateReferralCode();
        const { error: profileError } = await supabase.from('user_profiles').insert({
          id: data.user.id,
          email,
          name,
          icp_selector: icp,
          tier: 'free',
          referral_code: referralCode,
          streak_days: 0,
        });
        if (profileError) console.warn('[AuthStore] Profile creation error:', profileError);
        
        set({ user: data.user });
        await get().loadProfile();
      }
      
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to create account' };
    }
  },

  signOut: async () => {
    const { supabase } = get();
    if (supabase) await supabase.auth.signOut();
    set({ user: null, profile: null });
  },

  loadProfile: async () => {
    const { supabase, user } = get();
    if (!supabase || !user) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('[AuthStore] loadProfile error:', error);
        return;
      }
      
      if (data) set({ profile: data as UserProfile });
    } catch (e) {
      console.error('[AuthStore] loadProfile error:', e);
    }
  },

  updateProfile: async (updates: Partial<UserProfile>) => {
    const { supabase, user } = get();
    if (!supabase || !user) return { success: false, error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      
      if (error) return { success: false, error: error.message };
      await get().loadProfile();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to update profile' };
    }
  },

  generateReferralCode,
}));
