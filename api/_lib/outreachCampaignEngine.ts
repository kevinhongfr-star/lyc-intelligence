/**
 * outreachCampaignEngine.ts — Campaign management and A/B testing
 *
 * Endpoints:
 *   GET    /api/outreach/campaigns         — List campaigns
 *   POST   /api/outreach/campaigns         — Create campaign
 *   GET    /api/outreach/campaigns/:id     — Get campaign with stats
 *   PUT    /api/outreach/campaigns/:id     — Update campaign
 *   DELETE /api/outreach/campaigns/:id     — Delete campaign
 *   POST   /api/outreach/campaigns/:id/start — Start campaign
 *   POST   /api/outreach/campaigns/:id/pause — Pause campaign
 *   POST   /api/outreach/campaigns/:id/ab-test — Create A/B test
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  selectMany,
  selectOne,
  insert,
  update,
  remove,
  isSupabaseConfigured,
  handleError,
} from './supabaseRest.js';
import { getUserFromRequest } from './adminAuth.js';

export const maxDuration = 15;

type CampaignStatus = 'draft' | 'running' | 'paused' | 'completed' | 'archived';
type Channel = 'email' | 'sms' | 'linkedin';

interface Campaign {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  channel: Channel;
  template_ids: string[];
  recipient_segment: string;
  status: CampaignStatus;
  schedule: Record<string, unknown>;
  ab_test_enabled: boolean;
  ab_test_winner: string | null;
  stats: Record<string, number>;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
}

function generateId(): string {
  return `camp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function handleOutreachCampaigns(req: VercelRequest, res: VercelResponse) {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({ success: false, error: 'Server not configured' });
    }

    const { user, error } = await getUserFromRequest(req);
    if (error || !user) return res.status(401).json({ success: false, error });

    const pathArr = (req.query.path as string[]) || [];
    const id = pathArr[0];
    const subAction = pathArr[1];

    if (req.method === 'GET' && !id) {
      return handleList(req, res, user.id);
    }
    if (req.method === 'POST' && !id) {
      return handleCreate(req, res, user.id);
    }
    if (req.method === 'POST' && id && subAction === 'start') {
      return handleStart(req, res, id, user.id);
    }
    if (req.method === 'POST' && id && subAction === 'pause') {
      return handlePause(req, res, id, user.id);
    }
    if (req.method === 'POST' && id && subAction === 'ab-test') {
      return handleABTest(req, res, id, user.id);
    }
    if (req.method === 'GET' && id) {
      return handleGet(req, res, id);
    }
    if (req.method === 'PUT' && id) {
      return handleUpdate(req, res, id, user.id);
    }
    if (req.method === 'DELETE' && id) {
      return handleDelete(req, res, id, user.id);
    }

    return res.status(404).json({ success: false, error: 'Campaign route not found' });
  } catch (err) {
    return handleError(res, 'outreachCampaigns', err);
  }
}

async function handleList(_req: VercelRequest, res: VercelResponse, userId: string) {
  const campaigns = await selectMany(
    'outreach_campaigns',
    { user_id: userId },
    ['created_at DESC'],
    100,
    0,
    'id,name,description,channel,status,recipient_segment,ab_test_enabled,stats,created_at,started_at'
  );
  return res.json({ success: true, campaigns });
}

async function handleCreate(req: VercelRequest, res: VercelResponse, userId: string) {
  const body = req.body as any;
  if (!body?.name || !body?.channel) {
    return res.status(400).json({ success: false, error: 'name and channel required' });
  }

  const campaignId = generateId();
  const campaign = await insert('outreach_campaigns', {
    id: campaignId,
    user_id: userId,
    name: body.name,
    description: body.description || null,
    channel: body.channel,
    template_ids: body.template_ids || [],
    recipient_segment: body.recipient_segment || 'all',
    status: 'draft',
    schedule: body.schedule || {},
    ab_test_enabled: body.ab_test_enabled || false,
    ab_test_winner: null,
    stats: { sent: 0, opened: 0, responded: 0, clicked: 0 },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    started_at: null,
    completed_at: null,
  });

  return res.status(201).json({ success: true, campaign });
}

async function handleGet(_req: VercelRequest, res: VercelResponse, id: string) {
  const campaign = await selectOne('outreach_campaigns', { column: 'id', value: id, select: '*' });
  if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found' });
  return res.json({ success: true, campaign });
}

async function handleUpdate(req: VercelRequest, res: VercelResponse, id: string, userId: string) {
  const existing = await selectOne('outreach_campaigns', { column: 'id', value: id, select: 'id,user_id' });
  if (!existing) return res.status(404).json({ success: false, error: 'Campaign not found' });
  if (existing.user_id !== userId) return res.status(403).json({ success: false, error: 'Forbidden' });

  const body = req.body as any;
  const updated = await update('outreach_campaigns', { column: 'id', value: id }, {
    name: body.name || existing.name,
    description: body.description ?? existing.description,
    template_ids: body.template_ids || existing.template_ids,
    recipient_segment: body.recipient_segment || existing.recipient_segment,
    schedule: body.schedule || existing.schedule,
    updated_at: new Date().toISOString(),
  });

  return res.json({ success: true, campaign: updated });
}

async function handleDelete(_req: VercelRequest, res: VercelResponse, id: string, userId: string) {
  const existing = await selectOne('outreach_campaigns', { column: 'id', value: id, select: 'id,user_id,status' });
  if (!existing) return res.status(404).json({ success: false, error: 'Campaign not found' });
  if (existing.user_id !== userId) return res.status(403).json({ success: false, error: 'Forbidden' });

  await remove('outreach_campaigns', { column: 'id', value: id });
  return res.json({ success: true, id, deleted: true });
}

async function handleStart(_req: VercelRequest, res: VercelResponse, id: string, userId: string) {
  const existing = await selectOne('outreach_campaigns', { column: 'id', value: id, select: 'id,user_id,status' });
  if (!existing) return res.status(404).json({ success: false, error: 'Campaign not found' });
  if (existing.user_id !== userId) return res.status(403).json({ success: false, error: 'Forbidden' });

  await update('outreach_campaigns', { column: 'id', value: id }, {
    status: 'running',
    started_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  return res.json({ success: true, id, status: 'running' });
}

async function handlePause(_req: VercelRequest, res: VercelResponse, id: string, userId: string) {
  const existing = await selectOne('outreach_campaigns', { column: 'id', value: id, select: 'id,user_id,status' });
  if (!existing) return res.status(404).json({ success: false, error: 'Campaign not found' });
  if (existing.user_id !== userId) return res.status(403).json({ success: false, error: 'Forbidden' });

  await update('outreach_campaigns', { column: 'id', value: id }, {
    status: 'paused',
    updated_at: new Date().toISOString(),
  });

  return res.json({ success: true, id, status: 'paused' });
}

async function handleABTest(req: VercelRequest, res: VercelResponse, id: string, userId: string) {
  const existing = await selectOne('outreach_campaigns', { column: 'id', value: id, select: 'id,user_id,status,template_ids' });
  if (!existing) return res.status(404).json({ success: false, error: 'Campaign not found' });
  if (existing.user_id !== userId) return res.status(403).json({ success: false, error: 'Forbidden' });

  const body = req.body as any;
  const variantA = body?.variant_a;
  const variantB = body?.variant_b;
  if (!variantA || !variantB) {
    return res.status(400).json({ success: false, error: 'variant_a and variant_b template IDs required' });
  }

  const testId = `ab_${Date.now()}`;
  const abTest = await insert('ab_tests', {
    id: testId,
    campaign_id: id,
    variant_a: variantA,
    variant_b: variantB,
    split_ratio: body?.split_ratio || 50,
    status: 'running',
    results: { variant_a_sent: 0, variant_b_sent: 0, variant_a_opens: 0, variant_b_opens: 0 },
    created_at: new Date().toISOString(),
  });

  await update('outreach_campaigns', { column: 'id', value: id }, {
    ab_test_enabled: true,
    updated_at: new Date().toISOString(),
  });

  return res.status(201).json({ success: true, ab_test: abTest });
}