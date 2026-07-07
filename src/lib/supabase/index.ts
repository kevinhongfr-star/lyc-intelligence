/**
 * Supabase module barrel export
 * Re-exports the client-side supabase instance for use throughout the app
 */

export { supabase, onAuthStateChange, getPortalRedirect } from './client';
export type { PortalRole, UserProfile } from './client';

export * as supabaseAuth from './auth';
export * as realtime from './realtime';
