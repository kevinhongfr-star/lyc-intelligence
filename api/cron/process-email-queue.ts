/**
 * Email Notification Queue Processor — DEX AI Technical Blueprint 07
 *
 * Cron job that processes pending email notifications from email_notification_queue.
 * Sends via Outlook Graph API (kevin.hong@lyc-partners.ai).
 * Intended to run every 5 minutes.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  selectMany,
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

    const cronSecret = req.headers['x-vercel-cron'] || req.headers['x-cron-secret'];
    if (cronSecret !== process.env.EMAIL_QUEUE_CRON_SECRET) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const pending = await selectMany(
      'email_notification_queue',
      { status: 'pending' },
      ['created_at ASC'],
      10,
      0,
      '*'
    );

    if (!pending || pending.length === 0) {
      return res.json({ success: true, processed: 0, message: 'No pending emails' });
    }

    let processed = 0;
    let failed = 0;

    for (const email of pending) {
      if (email.attempts >= 3) continue;

      try {
        await update('email_notification_queue', email.id, {
          status: 'sending',
          attempts: email.attempts + 1,
          last_attempt_at: new Date().toISOString(),
        });

        await sendViaGraphAPI(email);

        await update('email_notification_queue', email.id, {
          status: 'sent',
          sent_at: new Date().toISOString(),
        });

        if (email.notification_id) {
          await update('notifications', email.notification_id, {
            email_sent: true,
            email_sent_at: new Date().toISOString(),
          });
        }

        processed++;
      } catch (err: any) {
        console.error(`Failed to send email ${email.id}:`, err.message);
        failed++;

        const newAttempts = email.attempts + 1;
        await update('email_notification_queue', email.id, {
          status: newAttempts >= 3 ? 'failed' : 'pending',
          error_message: err.message || 'Unknown error',
          last_attempt_at: new Date().toISOString(),
        });
      }
    }

    return res.json({
      success: true,
      processed,
      failed,
      total: pending.length,
    });
  } catch (err) {
    return handleError(res, 'email-queue', err);
  }
}

async function getGraphAccessToken(): Promise<string> {
  const tenantId = process.env.OUTLOOK_TENANT_ID;
  const clientId = process.env.OUTLOOK_CLIENT_ID;
  const clientSecret = process.env.OUTLOOK_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error('Outlook Graph API credentials not configured');
  }

  const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://graph.microsoft.com/.default',
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Graph token error: ${response.status} ${text}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function sendViaGraphAPI(email: any) {
  const token = await getGraphAccessToken();

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(email.to_address)}/sendMail`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          subject: email.subject,
          body: {
            contentType: 'HTML',
            content: email.html_body,
          },
          toRecipients: [
            {
              emailAddress: {
                address: email.to_address,
                name: email.to_name || '',
              },
            },
          ],
        },
        saveToSentItems: true,
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Graph API send error: ${response.status} ${text}`);
  }
}
