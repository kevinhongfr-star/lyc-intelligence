/**
 * Supabase Auth Helpers (S1-T01)
 *
 * Standalone functions wrapping Supabase Auth operations. These can be
 * imported directly or used via the Zustand `useAuthStore` (which delegates
 * to these internally).
 *
 * All functions reference the canonical `supabase` client from `./client`.
 */

import { supabase } from './client';

export interface AuthResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

// ── Sign in ──

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function signInWithMagicLink(email: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${window.location.origin}/dashboard` },
  });
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

// ── Sign up ──

export async function signUp(
  email: string,
  password: string,
  name: string,
  metadata?: Record<string, unknown>,
): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        tier: 'explorer',
        role: 'leader',
        ...metadata,
      },
    },
  });
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

// ── Sign out ──

export async function signOut(): Promise<AuthResult> {
  const { error } = await supabase.auth.signOut();
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ── Password reset ──

export async function resetPassword(email: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function updatePassword(newPassword: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

// ── Session ──

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) return { session: null, user: null, error: error.message };
  return {
    session: data.session,
    user: data.session?.user ?? null,
    error: null,
  };
}

export async function getCurrentUserId(): Promise<string | null> {
  const { session } = await getSession();
  return session?.user?.id ?? null;
}

export function onAuthStateChange(
  callback: Parameters<typeof supabase.auth.onAuthStateChange>[0],
) {
  return supabase.auth.onAuthStateChange(callback);
}

// ── Profile helpers ──

export async function loadProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error && error.code !== 'PGRST116') {
    return { profile: null, error: error.message };
  }
  return { profile: data, error: null };
}

export async function updateProfile(
  userId: string,
  updates: Record<string, unknown>,
) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();
  if (error) return { profile: null, error: error.message };
  return { profile: data, error: null };
}
