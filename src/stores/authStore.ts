import { create } from 'zustand';
import { SupabaseClient } from '@supabase/supabase-js';
import { supabase as canonicalSupabase, isSupabaseConfigured } from '@/lib/supabase/client';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string | null;
  tier: 'explorer' | 'starter' | 'pro' | 'executive' | 'council';
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

interface AuthStore {
  user: any | null;
  profile: UserProfile | null;
  isLoading: boolean;
  /** #1312: True when the active session was established via a PASSWORD_RECOVERY
   *  flow (email reset link clicked). UI uses this to render the "set new
   *  password" form instead of the "send reset email" form. */
  isPasswordRecovery: boolean;
  supabase: SupabaseClient | null;
  initialize: () => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<{ success: boolean; error?: string }>;
  signInWithPassword: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, icp: string, name: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  /** #1312: Set a new password using the active recovery session.
   *  Caller must enforce password policy before calling — but we also
   *  re-check server-side via Supabase auth strength settings. */
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  /** #1312: Clear the recovery flag after the new password is set. */
  clearPasswordRecovery: () => void;
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
  isPasswordRecovery: false,
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
        } else if (event === 'PASSWORD_RECOVERY') {
          // #1312: User clicked the reset link in the email. Supabase
          // establishes a temporary recovery session — surface the
          // "set new password" UI. The session is short-lived; once
          // they set a new password we clear the flag and refresh.
          set({ user: session?.user ?? get().user, isPasswordRecovery: true });
        } else if (event === 'SIGNED_OUT') {
          set({ user: null, profile: null, isPasswordRecovery: false });
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
            tier: 'member', 
            role: 'member',
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
          tier: 'member',
          role: 'member',
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
    set({ user: null, profile: null, isPasswordRecovery: false });
  },

  resetPassword: async (email: string) => {
    const { supabase } = get();
    if (!supabase) return { success: false, error: 'Supabase not configured' };

    try {
      // #1312: Always return success-shaped response to the caller — even
      // if the email doesn't exist. This prevents user-enumeration via
      // the reset endpoint. The actual Supabase error (if any) is logged
      // server-side but not surfaced to the client.
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        // Rate-limit / network errors are still surfaced as user-safe.
        if (error.status === 429) {
          return { success: false, error: 'Too many reset attempts. Please wait a few minutes and try again.' };
        }
        // For all other errors (user not found, etc.) return success so we
        // don't leak account existence.
        console.warn('[AuthStore] resetPassword error (suppressed for user):', error.message);
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to send reset email' };
    }
  },

  updatePassword: async (newPassword: string) => {
    const { supabase, user } = get();
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    if (!user) return { success: false, error: 'Recovery session expired. Please request a new reset link.' };

    try {
      const { data, error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        // Map common auth errors to user-safe messages.
        const msg = error.message?.toLowerCase() ?? '';
        if (msg.includes('weak') || msg.includes('strength') || msg.includes('common')) {
          return { success: false, error: 'Password is too weak. Please choose a stronger password.' };
        }
        if (msg.includes('session') || msg.includes('token') || msg.includes('expired')) {
          return { success: false, error: 'Recovery session expired. Please request a new reset link.' };
        }
        if (error.status === 429) {
          return { success: false, error: 'Too many attempts. Please wait a few minutes and try again.' };
        }
        return { success: false, error: 'Unable to update password. Please try again.' };
      }
      // Clear the recovery flag and refresh the loaded user/profile.
      set({ isPasswordRecovery: false, user: data.user ?? user });
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to update password' };
    }
  },

  clearPasswordRecovery: () => set({ isPasswordRecovery: false }),

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

    // #1308: strip privileged columns before they reach the DB.
    // role/tier/organization_id/subtype/miles_balance/billing fields are
    // server-managed. The DB trigger is the second line of defense.
    const PRIVILEGED = new Set([
      'role', 'tier', 'organization_id', 'subtype', 'miles_balance',
      'stripe_customer_id', 'stripe_subscription_id',
      'advisory_tier', 'council_tier', 'notion_profile_id', 'advisory_lane',
      'id', 'created_at',
    ]);
    const safeUpdates: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(updates)) {
      if (!PRIVILEGED.has(k)) safeUpdates[k] = v;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ ...safeUpdates, updated_at: new Date().toISOString() })
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
