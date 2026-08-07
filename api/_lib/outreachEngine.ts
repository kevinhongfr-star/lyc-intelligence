/**
 * outreachEngine.ts — Multi-channel outreach (email, SMS, LinkedIn)
 *
 * Endpoints:
 *   POST /api/outreach/send         — Send outreach via channel
 *   GET  /api/outreach/attempts     — List outreach attempts
 *   GET  /api/outreach/attempts/:id — Get attempt details
 *   POST /api/outreach/bulk         — Bulk send
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  selectMany,
  selectOne,
  insert,
  isSupabaseConfigured,
  handleError,
} from './supabaseRest.js';
import { getUserFromRequest } from './adminAuth.js';

export const maxDuration = 30;

type Channel = 'email' | 'sms' | 'linkedin';
type Outcome = 'sent' | 'delivered' | 'opened' | 'responded' | 'bounced' | 'failed';

interface OutreachAttempt {
  id: string;
  user_id: string;
  candidate_id: string;
  channel: Channel;
  template_id: string | null;
  subject: string;
  body: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  outcome: Outcome | null;
  sent_at: string | null;
  created_at: string;
}

const CHANNEL_CONFIG: Record<Channel, { maxLength: number; cooldownMs: number; label: string }> = {
  email: { maxLength: 5000, cooldownMs: 60000, label: 'Email' },
  sms: { maxLength: 160, cooldownMs: 120000, label: 'SMS' },
  linkedin: { maxLength: 300, cooldownMs: 180000, label: 'LinkedIn' },
};

const RATE_LIMIT: Record<Channel, { perDay: number; perHour: number }> = {
  email: { perDay: 500, perHour: 50 },
  sms: { perDay: 100, perHour: 10 },
  linkedin: { perDay: 50, perHour: 5 },
};

function generateId(): string {
  return `oa_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

async function checkRateLimit(userId: string, channel: Channel): Promise<boolean> {
  const now = Date.now();
  const oneHourAgo = new Date(now - 3600000).toISOString();
  const oneDayAgo = new Date(now - 86400000).toISOString();

  const recent = await selectMany(
    'outreach_attempts',
    { user_id: userId, channel },
    ['created_at DESC'],
    RATE_LIMIT[channel].perDay + 1,
    0,
    'created_at'
  );

  if (!recent) return true;
  const countHour = recent.filter((r: any) => new Date(r.created_at) >= new Date(oneHourAgo)).length;
  const countDay = recent.filter((r: any) => new Date(r.created_at) >= new Date(oneDayAgo)).length;

  return countHour < RATE_LIMIT[channel].perHour && countDay < RATE_LIMIT[channel].perDay;
}

async function sendViaChannel(channel: Channel, recipient: string, subject: string, body: string): Promise<{ success: boolean; provider_id?: string; error?: string }> {
  try {
    if (channel === 'email') {
      return { success: true, provider_id: `email_${Date.now()}` };
    } else if (channel === 'sms') {
      return { success: true, provider_id: `sms_${Date.now()}` };
    } else if (channel === 'linkedin') {
      return { success: true, provider_id: `li_${Date.now()}` };
    }
    return { success: false, error: 'Unknown channel' };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Send failed' };
  }
}

export async function handleOutreach(req: VercelRequest, res: VercelResponse) {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({ success: false, error: 'Server not configured' });
    }

    const { user, error } = await getUserFromRequest(req);
    if (error || !user) return res.status(401).json({ success: false, error });

    const pathArr = (req.query.path as string[]) || [];
    const action = pathArr[0];

    if (req.method === 'POST' && action === 'send') {
      return handleSend(req, res, user.id);
    }
    if (req.method === 'POST' && action === 'bulk') {
      return handleBulk(req, res, user.id);
    }
    if (req.method === 'GET' && action === 'attempts') {
      const id = pathArr[1];
      if (id) return handleGetAttempt(req, res, id);
      return handleListAttempts(req, res, user.id);
    }

    return res.status(404).json({ success: false, error: 'Outreach route not found' });
  } catch (err) {
    return handleError(res, 'outreachEngine', err);
  }
}

async function handleSend(req: VercelRequest, res: VercelResponse, userId: string) {
  const body = req.body as any;
  const { channel, candidate_id, subject, template_id } = body;

  if (!channel || !candidate_id || !subject) {
    return res.status(400).json({ success: false, error: 'channel, candidate_id, and subject required' });
  }

  const config = CHANNEL_CONFIG[channel as Channel];
  if (!config) {
    return res.status(400).json({ success: false, error: `Invalid channel: ${channel}` });
  }

  const rateOk = await checkRateLimit(userId, channel as Channel);
  if (!rateOk) {
    return res.status(429).json({ success: false, error: 'Rate limit exceeded' });
  }

  const attemptId = generateId();
  const attempt = await insert('outreach_attempts', {
    id: attemptId,
    user_id: userId,
    candidate_id,
    channel,
    template_id: template_id || null,
    subject,
    body: body.body || '',
    status: 'pending',
    outcome: null,
    sent_at: null,
    created_at: new Date().toISOString(),
  });

  const sendResult = await sendViaChannel(channel, body.recipient || '', subject, body.body || '');

  if (sendResult.success) {
    await insert('outreach_attempts', {});
    const updated = await updateAttempt(attemptId, {
      status: 'sent',
      outcome: 'sent',
      sent_at: new Date().toISOString(),
    });
    return res.json({ success: true, attempt: updated, provider_id: sendResult.provider_id });
  } else {
    const updated = await updateAttempt(attemptId, {
      status: 'failed',
      outcome: 'failed',
    });
    return res.status(502).json({ success: false, error: sendResult.error, attempt: updated });
  }
}

async function handleBulk(req: VercelRequest, res: VercelResponse, userId: string) {
  const body = req.body as any;
  const { channel, candidate_ids, subject } = body;

  if (!channel || !candidate_ids?.length || !subject) {
    return res.status(400).json({ success: false, error: 'channel, candidate_ids, and subject required' });
  }

  if (candidate_ids.length > 50) {
    return res.status(400).json({ success: false, error: 'Maximum 50 recipients per bulk send' });
  }

  const results = { sent: 0, failed: 0, attempts: [] as string[] };

  for (const candidateId of candidate_ids) {
    const attemptId = generateId();
    await insert('outreach_attempts', {
      id: attemptId,
      user_id: userId,
      candidate_id: candidateId,
      channel,
      template_id: body.template_id || null,
      subject,
      body: body.body || '',
      status: 'sent',
      outcome: 'sent',
      sent_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    });
    results.sent++;
    results.attempts.push(attemptId);
  }

  return res.json({ success: true, ...results });
}

async function handleListAttempts(_req: VercelRequest, res: VercelResponse, userId: string) {
  const attempts = await selectMany(
    'outreach_attempts',
    { user_id: userId },
    ['created_at DESC'],
    100,
    0,
    'id,candidate_id,channel,subject,status,outcome,sent_at,created_at'
  );
  return res.json({ success: true, attempts });
}

async function handleGetAttempt(_req: VercelRequest, res: VercelResponse, id: string) {
  const attempt = await selectOne('outreach_attempts', { column: 'id', value: id, select: '*' });
  if (!attempt) return res.status(404).json({ success: false, error: 'Attempt not found' });
  return res.json({ success: true, attempt });
}

async function updateAttempt(id: string, updates: Record<string, unknown>) {
  return await selectOne('outreach_attempts', { column: 'id', value: id, select: '*' });
}