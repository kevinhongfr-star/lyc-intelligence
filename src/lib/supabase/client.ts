/**
 * Supabase Client — canonical client-side instance (S1-T01)
 *
 * All frontend code should import `supabase` from here (or via the barrel
 * `@/lib/supabase`). Do NOT create additional `createClient` calls in
 * stores, services, or components — reuse this singleton.
 *
 * Env vars (client-safe, VITE_ prefix):
 *   VITE_SUPABASE_URL       — Supabase project URL
 *   VITE_SUPABASE_ANON_KEY  — Supabase anon/public key
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  '';

const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_KEY || // legacy alias
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

/** True when both URL and key are present (non-empty). */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/**
 * The shared Supabase client. When env vars are missing the client is still
 * created ( Supabase SDK handles this gracefully ) — callers should check
 * `isSupabaseConfigured` before issuing queries if they want to short-circuit.
 */
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
