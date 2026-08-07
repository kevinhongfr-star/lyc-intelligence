/**
 * outreachTemplates.ts — Template library and personalization
 *
 * Endpoints:
 *   GET    /api/outreach/templates           — List templates
 *   POST   /api/outreach/templates           — Create template
 *   GET    /api/outreach/templates/:id       — Get template
 *   PUT    /api/outreach/templates/:id       — Update template
 *   DELETE /api/outreach/templates/:id       — Delete template
 *   POST   /api/outreach/templates/:id/preview — Personalize preview
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

export const maxDuration = 10;

interface OutreachTemplate {
  id: string;
  user_id: string;
  name: string;
  channel: 'email' | 'sms' | 'linkedin';
  subject: string;
  body: string;
  variables: string[];
  is_default: boolean;
  category: string;
  version: number;
  created_at: string;
  updated_at: string;
}

function generateId(): string {
  return `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function extractVariables(text: string): string[] {
  const matches = text.match(/\{(\w+(?:\.\w+)*)\}/g);
  return matches ? [...new Set(matches.map(m => m.slice(1, -1)))] : [];
}

function personalizeTemplate(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  result = result.replace(/\{\w+\}/g, '[unresolved]');
  return result;
}

export async function handleOutreachTemplates(req: VercelRequest, res: VercelResponse) {
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
    if (req.method === 'POST' && id && subAction === 'preview') {
      return handlePreview(req, res, id);
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

    return res.status(404).json({ success: false, error: 'Template route not found' });
  } catch (err) {
    return handleError(res, 'outreachTemplates', err);
  }
}

async function handleList(_req: VercelRequest, res: VercelResponse, userId: string) {
  const templates = await selectMany(
    'outreach_templates',
    { user_id: userId },
    ['channel', 'name'],
    100,
    0,
    'id,name,channel,subject,body,variables,is_default,category,version'
  );
  return res.json({ success: true, templates });
}

async function handleCreate(req: VercelRequest, res: VercelResponse, userId: string) {
  const body = req.body as any;
  if (!body?.name || !body?.channel || !body?.body) {
    return res.status(400).json({ success: false, error: 'name, channel, and body required' });
  }

  const variables = extractVariables(body.body + (body.subject || ''));
  const templateId = generateId();

  const template = await insert('outreach_templates', {
    id: templateId,
    user_id: userId,
    name: body.name,
    channel: body.channel,
    subject: body.subject || '',
    body: body.body,
    variables,
    is_default: body.is_default || false,
    category: body.category || 'general',
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  return res.status(201).json({ success: true, template });
}

async function handleGet(_req: VercelRequest, res: VercelResponse, id: string) {
  const template = await selectOne('outreach_templates', { column: 'id', value: id, select: '*' });
  if (!template) return res.status(404).json({ success: false, error: 'Template not found' });
  return res.json({ success: true, template });
}

async function handleUpdate(req: VercelRequest, res: VercelResponse, id: string, userId: string) {
  const existing = await selectOne('outreach_templates', { column: 'id', value: id, select: 'id,user_id,version' });
  if (!existing) return res.status(404).json({ success: false, error: 'Template not found' });
  if (existing.user_id !== userId) return res.status(403).json({ success: false, error: 'Forbidden' });

  const body = req.body as any;
  const variables = extractVariables((body.body || '') + (body.subject || ''));

  const updated = await update('outreach_templates', { column: 'id', value: id }, {
    name: body.name || existing.name,
    subject: body.subject ?? existing.subject,
    body: body.body || existing.body,
    variables,
    version: (existing.version || 1) + 1,
    updated_at: new Date().toISOString(),
  });

  return res.json({ success: true, template: updated });
}

async function handleDelete(_req: VercelRequest, res: VercelResponse, id: string, userId: string) {
  const existing = await selectOne('outreach_templates', { column: 'id', value: id, select: 'id,user_id' });
  if (!existing) return res.status(404).json({ success: false, error: 'Template not found' });
  if (existing.user_id !== userId) return res.status(403).json({ success: false, error: 'Forbidden' });

  await remove('outreach_templates', { column: 'id', value: id });
  return res.json({ success: true, id, deleted: true });
}

async function handlePreview(req: VercelRequest, res: VercelResponse, id: string) {
  const template = await selectOne('outreach_templates', { column: 'id', value: id, select: '*' });
  if (!template) return res.status(404).json({ success: false, error: 'Template not found' });

  const body = req.body as any;
  const variables = body?.variables || {};

  const personalizedSubject = personalizeTemplate(template.subject || '', variables);
  const personalizedBody = personalizeTemplate(template.body || '', variables);

  return res.json({
    success: true,
    preview: {
      subject: personalizedSubject,
      body: personalizedBody,
      unresolved: (personalizedSubject.match(/\[unresolved\]/g) || []).length +
                  (personalizedBody.match(/\[unresolved\]/g) || []).length,
    },
  });
}