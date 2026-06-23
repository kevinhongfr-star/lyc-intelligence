// Supabase Server Client - for server-side / API route usage

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

// Use anon key if service role not available (for client-side fallbacks)
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

let serverClient: ReturnType<typeof createClient> | null = null;

export function createClient() {
  if (serverClient) return serverClient;

  if (!SUPABASE_URL) {
    console.warn('[supabase/server] SUPABASE_URL not configured');
    // Return a placeholder client to avoid crashes
    serverClient = createClient('https://placeholder.supabase.co', 'placeholder-key');
    return serverClient;
  }

  const key = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
  if (!key) {
    console.warn('[supabase/server] No Supabase key configured');
    serverClient = createClient(SUPABASE_URL, 'placeholder-key');
    return serverClient;
  }

  serverClient = createClient(SUPABASE_URL, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return serverClient;
}

export default { createClient };
