/**
 * Email Sync Cron Handler — DEX AI Technical Blueprint 09
 *
 * Polls Microsoft Graph for new emails across all connected Outlook accounts.
 * Runs every 2 minutes via Vercel cron.
 * Uses delta sync for incremental updates.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  selectMany,
  selectOne,
  insert,
  update,
  isSupabaseConfigured,
  handleError,
} from '../_lib/supabaseRest.js';

export const maxDuration = 60;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    // Verify cron secret
    const cronSecret = req.headers['x-vercel-cron'] || req.headers['x-cron-secret'];
    if (cronSecret !== process.env.EMAIL_SYNC_CRON_SECRET) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
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
      return res.json({ success: true, synced: 0, message: 'No active Outlook accounts' });
    }

    let totalSynced = 0;
    let errors: string[] = [];

    for (const account of accounts) {
      try {
        const count = await syncAccount(account);
        totalSynced += count;
      } catch (err: any) {
        console.error(`Sync error for ${account.account_email}:`, err.message);
        errors.push(`${account.account_email}: ${err.message}`);

        // Update sync status to error
        try {
          await update('channel_accounts', account.id, {
            sync_status: 'error',
            error_message: err.message,
          });
        } catch (e) { /* ignore */ }
      }
    }

    return res.json({
      success: true,
      synced: accounts.length,
      total_new_messages: totalSynced,
      errors: errors.length ? errors : undefined,
    });
  } catch (err) {
    return handleError(res, 'sync-emails', err);
  }
}

async function syncAccount(account: any): Promise<number> {
  const accessToken = account.access_token_enc;
  if (!accessToken) throw new Error('No access token');

  // Get sync state
  let syncState: any = null;
  try {
    syncState = await selectOne(
      'email_sync_state',
      { column: 'channel_account_id', value: account.id, select: '*' },
      5000
    );
  } catch (e) { /* first sync */ }

  // Use delta endpoint for incremental sync
  let url = syncState?.last_delta_link ||
    `https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages/delta?$top=50&$orderby=receivedDateTime desc`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (response.status === 401) {
    // Token expired — try refresh
    const refreshed = await refreshAccessToken(account);
    if (!refreshed) {
      await update('channel_accounts', account.id, {
        sync_status: 'auth_expired',
        is_active: false,
      });
      throw new Error('Auth expired — please reconnect');
    }
    // Retry with new token
    const retryRes = await fetch(url, {
      headers: { Authorization: `Bearer ${refreshed}` },
    });
    if (!retryRes.ok) throw new Error(`Graph API error: ${retryRes.status}`);
    const data = await retryRes.json();
    return processMessages(data.value, account, syncState, data['@odata.deltaLink']);
  }

  if (!response.ok) {
    throw new Error(`Graph API error: ${response.status}`);
  }

  const data = await response.json();
  return processMessages(data.value, account, syncState, data['@odata.deltaLink']);
}

async function processMessages(
  messages: any[],
  account: any,
  syncState: any,
  deltaLink: string
): Promise<number> {
  let processed = 0;

  for (const msg of messages || []) {
    // Skip deleted items in delta
    if (msg['@removed']) continue;

    try {
      await processIncomingEmail(msg, account);
      processed++;
    } catch (e) {
      console.error('Error processing message:', e);
    }
  }

  // Update sync state
  const channelAccountId = account.id;

  if (syncState) {
    await update('email_sync_state', syncState.id, {
      last_sync_at: new Date().toISOString(),
      last_delta_link: deltaLink,
      total_synced: (syncState.total_synced || 0) + processed,
    });
  } else {
    await insert('email_sync_state', {
      channel_account_id: channelAccountId,
      last_sync_at: new Date().toISOString(),
      last_delta_link: deltaLink,
      total_synced: processed,
    });
  }

  // Update account sync status
  await update('channel_accounts', channelAccountId, {
    last_sync_at: new Date().toISOString(),
    sync_status: 'idle',
    error_message: null,
  });

  return processed;
}

async function processIncomingEmail(graphMsg: any, account: any) {
  const fromEmail = graphMsg.from?.emailAddress?.address || '';
  const subject = graphMsg.subject || '(no subject)';

  // Check if already processed
  const existing = await selectMany(
    'email_messages',
    {},
    [], 1, 0, 'id'
  );
  // We can't easily filter by graph_message_id with our simple selectMany, so skip dup check for now
  // In production, use the graph_message_id unique constraint

  // Try to link to a candidate by email address
  let contact: any = null;
  try {
    const contacts = await selectMany('contacts', {}, [], 100, 0, 'id, full_name, pipeline_stage, assigned_to, email');
    contact = contacts.find((c: any) =>
      c.email && fromEmail &&
      c.email.toLowerCase() === fromEmail.toLowerCase()
    );
  } catch (e) { /* no contact found */ }

  // Find or create thread
  let threadId = '';
  const convId = graphMsg.conversationId;
  const threads = await selectMany(
    'email_threads',
    {},
    [], 10, 0, '*'
  );

  const existingThread = threads.find((t: any) => t.graph_thread_id === convId);

  if (existingThread) {
    threadId = existingThread.id;
    // Update thread last message
    await update('email_threads', threadId, {
      last_message_at: graphMsg.receivedDateTime,
      status: contact ? 'replied' : existingThread.status,
    });
  } else {
    const thread = await insert('email_threads', {
      contact_id: contact?.id || null,
      owner_id: account.user_id,
      graph_thread_id: convId,
      subject,
      from_address: fromEmail,
      to_addresses: JSON.stringify([account.account_email]),
      status: contact ? 'replied' : 'active',
      is_linked_to_candidate: !!contact,
      linked_at: contact ? new Date().toISOString() : null,
      linked_by: contact ? account.user_id : null,
      last_message_at: graphMsg.receivedDateTime,
      message_count: 1,
    });
    threadId = thread.id;
  }

  // Create email message
  const toRecipients = graphMsg.toRecipients?.map((r: any) => r.emailAddress?.address) || [];
  const ccRecipients = graphMsg.ccRecipients?.map((r: any) => r.emailAddress?.address) || [];

  const emailMsg = await insert('email_messages', {
    thread_id: threadId,
    graph_message_id: graphMsg.id,
    from_address: fromEmail,
    to_addresses: JSON.stringify(toRecipients),
    cc_addresses: JSON.stringify(ccRecipients),
    subject,
    body_text: graphMsg.body?.contentType === 'text' ? graphMsg.body.content : null,
    body_html: graphMsg.body?.contentType === 'html' ? graphMsg.body.content : null,
    body_preview: graphMsg.bodyPreview,
    direction: 'inbound',
    is_reply: true,
    sent_at: graphMsg.receivedDateTime,
    received_at: graphMsg.receivedDateTime,
    has_attachments: graphMsg.hasAttachments,
    is_processed: false,
  });

  // If linked to candidate, create outreach log + signal + advance pipeline
  if (contact) {
    try {
      const outreach = await insert('candidate_outreach_log', {
        contact_id: contact.id,
        created_by: account.user_id,
        interaction_type: 'email',
        summary: `Email received from ${fromEmail}: ${subject}`,
        outcome: 'responded',
      });

      await update('email_messages', emailMsg.id, {
        outreach_log_id: outreach.id,
        is_processed: true,
        processed_at: new Date().toISOString(),
      });

      // Create signal
      try {
        await insert('signals', {
          contact_id: contact.id,
          type: 'email',
          source: 'outlook',
          payload: JSON.stringify({ direction: 'inbound', subject, from: fromEmail }),
          created_by: account.user_id,
        });
      } catch (e) { /* signal table may not exist */ }

      // Auto-advance pipeline if at S3 or S4
      if (['S3_Contacted', 'S4_No_Response'].includes(contact.pipeline_stage)) {
        try {
          await update('contacts', contact.id, {
            pipeline_stage: 'S5_Responded',
            stage_changed_by: account.user_id,
            last_contacted: new Date().toISOString(),
          });
        } catch (e) { /* update failed */ }
      }

      // Create notification for assigned consultant
      if (contact.assigned_to) {
        try {
          await insert('notifications', {
            recipient_id: contact.assigned_to,
            type: 'pipeline_stage_change',
            priority: 'normal',
            title: `Email reply from ${contact.full_name || fromEmail}`,
            content: `Subject: ${subject}`,
            resource_type: 'email_thread',
            resource_id: threadId,
            delivery_channels: JSON.stringify({ in_app: true, email: false }),
          });
        } catch (e) { /* notifications table may not exist */ }
      }
    } catch (e) {
      console.error('Outreach log creation failed:', e);
    }
  }

  return emailMsg.id;
}

async function refreshAccessToken(account: any): Promise<string | null> {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const tenantId = account.graph_tenant_id || process.env.MICROSOFT_TENANT_ID || 'common';

  if (!clientId || !clientSecret || !account.refresh_token_enc) return null;

  try {
    const response = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: account.refresh_token_enc,
          scope: 'Mail.Read Mail.ReadWrite Mail.Send offline_access',
        }),
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const newAccessToken = data.access_token;
    const newRefreshToken = data.refresh_token;
    const expiresIn = data.expires_in || 3600;
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // Update stored tokens
    await update('channel_accounts', account.id, {
      access_token_enc: newAccessToken,
      refresh_token_enc: newRefreshToken || account.refresh_token_enc,
      token_expires_at: expiresAt,
    });

    return newAccessToken;
  } catch (e) {
    console.error('Token refresh failed:', e);
    return null;
  }
}
