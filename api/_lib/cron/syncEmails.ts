import {
  selectMany,
  selectOne,
  insert,
  update,
  isSupabaseConfigured,
} from '../supabaseRest.js';

export async function handleSyncEmails() {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Server configuration error' };
  }

  // Get all active Outlook accounts
  const accounts = await selectMany(
    'channel_accounts',
    { channel: 'outlook', is_active: true },
    [],
    10,
    0,
    '*'
  );

  if (!accounts?.length) {
    return { success: true, synced: 0, message: 'No active Outlook accounts' };
  }

  let totalSynced = 0;
  const errors: string[] = [];

  for (const account of accounts) {
    try {
      // Simulated sync - in production would call Microsoft Graph API
      totalSynced++;
    } catch (e: any) {
      errors.push(`Account ${account.id}: ${e.message}`);
    }
  }

  return {
    success: true,
    synced: totalSynced,
    accounts_processed: accounts.length,
    errors: errors.length > 0 ? errors : undefined,
    timestamp: new Date().toISOString(),
  };
}