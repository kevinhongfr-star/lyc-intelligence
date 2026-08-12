import { create } from 'zustand';
import { SupabaseClient } from '@supabase/supabase-js';
import { supabase as canonicalSupabase, isSupabaseConfigured } from '@/lib/supabase/client';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string | null;
  /** Canonical tier keys — aligned with monetizationService.TierKey */
  tier: 'explorer' | 'starter' | 'pro' | 'executive' | 'council' | string;
  icp: string | null;
  active_surface: string | null;
  organization_id: string | null;
  subtype: string | null;
  notion_profile_id: string | null;
  onboarded_at: string | null;
  // Stripe / billing (S6-T01 / S6-T03)
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_subscription_status: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * #1291 — Fields a user is allowed to update on their own profile via the client.
 * Privileged fields (role, tier, organization_id, stripe_*) are excluded to
 * prevent privilege escalation. Those can only be changed server-side or via
 * admin intervention.
 */
const ALLOWED_PROFILE_FIELDS: ReadonlySet<keyof UserProfile> = new Set([
  'name',
  'icp',
  'active_surface',
  'subtype',
  'onboarded_at',
]);

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
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
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

const createMemberCredits = async (userId: string) => {
  if (!isSupabaseConfigured) return;
  try {
    const { error } = await canonicalSupabase.from('credits').insert({
      user_id: userId,
      balance: 2,
      daily_balance: 2,
      last_daily_reset: new Date().toISOString(),
    });

    if (error) {
      console.warn('[AuthStore] Credits creation error:', error);
    }
  } catch (e) {
    console.warn('[AuthStore] Credits creation error:', e);
  }
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true,
  supabase: isSupabaseConfigured ? canonicalSupabase : null,

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
      
      // Any authenticated user can sign in — role-based access is enforced at route level
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
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: { 
          data: { 
            tier: 'explorer', 
            role: 'leader',
            name 
          } 
        }
      });
      if (error) return { success: false, error: error.message };
      
      if (data.user) {
        const referralCode = generateReferralCode();
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          email,
          name,
          icp: icp,
          tier: 'explorer',
          role: 'leader',
        });
        if (profileError) console.warn('[AuthStore] Profile creation error:', profileError);
        
        // Create credits record for member (2 daily credits)
        await createMemberCredits(data.user.id);
        
        // Get verification URL from Supabase
        const verificationUrl = `${window.location.origin}/verify`;
        
        // Send verification/welcome email
        fetch('/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            type: 'signup', 
            data: { 
              email, 
              name,
              verificationUrl 
            } 
          })
        }).catch(() => {}); // fire and forget
        
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

  resetPassword: async (email: string) => {
    const { supabase } = get();
    if (!supabase) return { success: false, error: 'Supabase not configured' };

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to send reset email' };
    }
  },

  loadProfile: async () => {
    const { supabase, user } = get();
    if (!supabase || !user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
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

    // #1291 — Filter to allowed fields only, preventing privilege escalation
    // via client-side role/tier/organization_id/stripe_* writes.
    const safeUpdates: Record<string, unknown> = {};
    for (const key of Object.keys(updates) as (keyof UserProfile)[]) {
      if (ALLOWED_PROFILE_FIELDS.has(key)) {
        safeUpdates[key] = updates[key];
      }
    }
    if (Object.keys(safeUpdates).length === 0) {
      return { success: false, error: 'No updatable fields provided' };
    }
    safeUpdates.updated_at = new Date().toISOString();

    try {
      const { error } = await supabase
        .from('profiles')
        .update(safeUpdates)
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
