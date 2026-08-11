// Supabase Server Client - for server-side / API route usage

import { createClient as supabaseCreateClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

// Use anon key if service role not available (for client-side fallbacks)
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

let serverClient: SupabaseClient | null = null;

export function createServerClient(): SupabaseClient {
  if (serverClient) return serverClient;

  if (!SUPABASE_URL) {
    console.warn('[supabase/server] SUPABASE_URL not configured');
    // Return a placeholder client to avoid crashes
    serverClient = supabaseCreateClient('https://placeholder.supabase.co', 'placeholder-key');
    return serverClient;
  }

  const key = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
  if (!key) {
    console.warn('[supabase/server] No Supabase key configured');
    serverClient = supabaseCreateClient(SUPABASE_URL, 'placeholder-key');
    return serverClient;
  }

  serverClient = supabaseCreateClient(SUPABASE_URL, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return serverClient;
}

// Legacy alias — existing code in repo imports `{ createClient }` from
// @/lib/supabase/server; preserve that name while avoiding shadow conflict
// with the @supabase/supabase-js `createClient` import above.
export { createServerClient as createClient };

export default { createClient: createServerClient };
