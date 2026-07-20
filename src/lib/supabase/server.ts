// Supabase Server Client - for server-side / API route usage

import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  '';
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  '';
// Use anon key if service role not available (for client-side fallbacks)
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

let serverClient: SupabaseClient | null = null;

/**
 * Return a cached server-side Supabase client, creating one on first call.
 *
 * Throws when Supabase env vars are missing — never returns a client wired
 * to placeholder credentials. Use `tryGetClient()` for code paths that
 * should gracefully degrade when Supabase is not configured.
 */
export function getClient(): SupabaseClient {
  const client = tryGetClient();
  if (!client) {
    throw new Error(
      '[supabase/server] Supabase is not configured. ' +
        'Set VITE_SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL / SUPABASE_URL) and ' +
        'SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY) in your environment.'
    );
  }
  return client;
}

/**
 * Same as `getClient()` but returns `null` instead of throwing when env
 * vars are missing. Use this from API routes that should return a 503 or
 * graceful fallback rather than crash.
 */
export function tryGetClient(): SupabaseClient | null {
  if (serverClient) return serverClient;
  if (!SUPABASE_URL) return null;

  const key = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
  if (!key) return null;

  serverClient = createSupabaseClient(SUPABASE_URL, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return serverClient;
}

/**
 * Returns true when both SUPABASE_URL and a usable key are configured.
 */
export function isServerConfigured(): boolean {
  return Boolean(SUPABASE_URL && (SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY));
}

/**
 * Reset the cached client. Intended for tests or runtime env-var rotation.
 */
export function resetServerClient(): void {
  serverClient = null;
}

export default { getClient, tryGetClient, isServerConfigured, resetServerClient };
