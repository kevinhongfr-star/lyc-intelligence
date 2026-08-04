/**
 * Supabase module barrel export (S1-T01)
 * Re-exports the canonical client, auth helpers, and configuration flag.
 */

export { supabase, isSupabaseConfigured } from './client';
export type { AuthResult } from './auth';
export {
  signInWithPassword,
  signInWithMagicLink,
  signUp,
  signOut,
  resetPassword,
  updatePassword,
  getSession,
  getCurrentUserId,
  onAuthStateChange,
  loadProfile,
  updateProfile,
} from './auth';
