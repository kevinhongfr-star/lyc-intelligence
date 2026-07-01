import {
  selectMany,
  insert,
  update,
  isSupabaseConfigured,
} from '../supabaseRest.js';

export async function handleProcessEmailQueue() {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Server configuration error' };
  }

  // Get pending emails from queue
  const pending = await selectMany(
    'email_notification_queue',
    { status: 'pending' },
    ['created_at ASC'],
    10,
    0,
    '*'
  );

  let processed = 0;
  let failed = 0;

  for (const email of pending || []) {
    try {
      // Mark as sent (simulated - actual email sending would happen here)
      await update('email_notification_queue', email.id, {
        status: 'sent',
        sent_at: new Date().toISOString(),
      });
      processed++;
    } catch (e) {
      failed++;
    }
  }

  return {
    success: true,
    processed,
    failed,
    remaining: (pending?.length || 0) - processed,
    timestamp: new Date().toISOString(),
  };
}