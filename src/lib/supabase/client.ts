/**
 * Supabase Client - for client-side usage
 * Exports a pre-configured supabase client instance
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase: SupabaseClient = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : createClient('https://placeholder.supabase.co', 'placeholder-key');

export type PortalRole = 'admin' | 'b2b_client' | 'b2c_leader' | 'candidate';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  name: string;
  portal_role: PortalRole;
  role: string;
  company_id: string | null;
  avatar_url: string | null;
  phone: string | null;
  headline: string | null;
  onboarded_at: string | null;
  tier: string;
  icp: string | null;
  organization_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const onAuthStateChange = (
  callback: (session: any, profile: UserProfile | null) => void
) => {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        callback(session, profile as UserProfile);
      } catch {
        callback(session, null);
      }
    } else {
      callback(session, null);
    }
  });
};

export const getPortalRedirect = (portalRole: PortalRole | string): string => {
  switch (portalRole) {
    case 'admin':
      return '/platform';
    case 'b2b_client':
      return '/client-portal';
    case 'b2c_leader':
      return '/leader-portal';
    case 'candidate':
      return '/candidate';
    default:
      return '/dashboard';
  }
};
