import {
  selectMany,
  insert,
  isSupabaseConfigured,
} from '../supabaseRest.js';

export async function handleComputeAnalytics() {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Server configuration error' };
  }

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const hour = now.getHours();

  return {
    success: true,
    computed_at: now.toISOString(),
    snapshot_date: today,
    snapshot_hour: hour,
    message: 'Analytics computation triggered',
    note: 'Live computation is used via analytics endpoints instead of cached snapshots',
  };
}