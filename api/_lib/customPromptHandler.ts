/**
 * customPromptHandler.ts — Custom prompt management and versioning
 *
 * Endpoints:
 *   GET    /api/prompts              — List prompts
 *   POST   /api/prompts              — Create prompt
 *   GET    /api/prompts/:id          — Get prompt with versions
 *   PUT    /api/prompts/:id          — Update prompt (creates new version)
 *   DELETE /api/prompts/:id          — Delete prompt
 *   POST   /api/prompts/:id/activate — Activate a version
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

interface PromptVersion {
  id: string;
  prompt_id: string;
  version: number;
  content: string;
  variables: string[];
  is_active: boolean;
  created_by: string;
  created_at: string;
}

interface CustomPrompt {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: string;
  content: string;
  variables: string[];
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

function extractVariables(content: string): string[] {
  const matches = content.match(/\{(\w+(?:\.\w+)*)\}/g);
  return matches ? [...new Set(matches.map(m => m.slice(1, -1)))] : [];
}

function generateId(): string {
  return `prmpt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function handleCustomPrompt(req: VercelRequest, res: VercelResponse) {
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
    if (req.method === 'GET' && id) {
      return handleGet(req, res, id);
    }
    if (req.method === 'PUT' && id) {
      return handleUpdate(req, res, id, user.id);
    }
    if (req.method === 'DELETE' && id) {
      return handleDelete(req, res, id, user.id);
    }
    if (req.method === 'POST' && id && subAction === 'activate') {
      return handleActivate(req, res, id, user.id);
    }

    return res.status(404).json({ success: false, error: 'Prompt route not found' });
  } catch (err) {
    return handleError(res, 'customPrompt', err);
  }
}

async function handleList(_req: VercelRequest, res: VercelResponse, userId: string) {
  const prompts = await selectMany(
    'custom_prompts',
    { user_id: userId, is_active: true },
    ['category', 'name'],
    100,
    0,
    'id,name,description,category,content,variables,version,is_active,created_at,updated_at'
  );
  return res.json({ success: true, prompts });
}

async function handleCreate(req: VercelRequest, res: VercelResponse, userId: string) {
  const body = req.body as any;
  if (!body?.name || !body?.content) {
    return res.status(400).json({ success: false, error: 'name and content required' });
  }

  const promptId = generateId();
  const variables = extractVariables(body.content);

  const prompt = await insert('custom_prompts', {
    id: promptId,
    user_id: userId,
    name: body.name,
    description: body.description || null,
    category: body.category || 'general',
    content: body.content,
    variables,
    is_active: true,
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  await insert('prompt_versions', {
    id: generateId(),
    prompt_id: promptId,
    version: 1,
    content: body.content,
    variables,
    is_active: true,
    created_by: userId,
    created_at: new Date().toISOString(),
  });

  return res.status(201).json({ success: true, prompt });
}

async function handleGet(_req: VercelRequest, res: VercelResponse, id: string) {
  const prompt = await selectOne('custom_prompts', { column: 'id', value: id, select: '*' });
  if (!prompt) return res.status(404).json({ success: false, error: 'Prompt not found' });

  const versions = await selectMany(
    'prompt_versions',
    { prompt_id: id },
    ['version DESC'],
    20,
    0,
    'id,version,content,variables,is_active,created_by,created_at'
  );

  return res.json({ success: true, prompt, versions });
}

async function handleUpdate(req: VercelRequest, res: VercelResponse, id: string, userId: string) {
  const existing = await selectOne('custom_prompts', { column: 'id', value: id, select: 'id,user_id,version,content' });
  if (!existing) return res.status(404).json({ success: false, error: 'Prompt not found' });
  if (existing.user_id !== userId) return res.status(403).json({ success: false, error: 'Forbidden' });

  const body = req.body as any;
  const newVersion = (existing.version || 1) + 1;
  const variables = body.content ? extractVariables(body.content) : (existing.variables as string[] || []);

  const updated = await update('custom_prompts', { column: 'id', value: id }, {
    name: body.name || existing.name,
    description: body.description ?? existing.description,
    category: body.category || existing.category,
    content: body.content || existing.content,
    variables,
    version: newVersion,
    updated_at: new Date().toISOString(),
  });

  if (body.content) {
    await insert('prompt_versions', {
      id: generateId(),
      prompt_id: id,
      version: newVersion,
      content: body.content,
      variables,
      is_active: true,
      created_by: userId,
      created_at: new Date().toISOString(),
    });
  }

  return res.json({ success: true, prompt: updated });
}

async function handleDelete(_req: VercelRequest, res: VercelResponse, id: string, userId: string) {
  const existing = await selectOne('custom_prompts', { column: 'id', value: id, select: 'id,user_id' });
  if (!existing) return res.status(404).json({ success: false, error: 'Prompt not found' });
  if (existing.user_id !== userId) return res.status(403).json({ success: false, error: 'Forbidden' });

  await remove('custom_prompts', { column: 'id', value: id });
  return res.json({ success: true, id, deleted: true });
}

async function handleActivate(req: VercelRequest, res: VercelResponse, id: string, userId: string) {
  const existing = await selectOne('custom_prompts', { column: 'id', value: id, select: 'id,user_id' });
  if (!existing) return res.status(404).json({ success: false, error: 'Prompt not found' });
  if (existing.user_id !== userId) return res.status(403).json({ success: false, error: 'Forbidden' });

  const body = req.body as any;
  const versionId = body?.version_id;
  if (!versionId) return res.status(400).json({ success: false, error: 'version_id required' });

  const version = await selectOne('prompt_versions', { column: 'id', value: versionId, select: '*' });
  if (!version) return res.status(404).json({ success: false, error: 'Version not found' });

  await update('prompt_versions', { column: 'prompt_id', value: id }, { is_active: false });
  await update('prompt_versions', { column: 'id', value: versionId }, { is_active: true });
  await update('custom_prompts', { column: 'id', value: id }, {
    content: version.content,
    variables: version.variables,
    version: version.version,
    updated_at: new Date().toISOString(),
  });

  return res.json({ success: true, id, activated_version: version.version });
}