/**
 * pluginHandler.ts — Plugin/extension system
 *
 * Endpoints:
 *   GET    /api/plugins              — List available plugins
 *   POST   /api/plugins              — Register new plugin
 *   GET    /api/plugins/:id          — Get plugin details
 *   PUT    /api/plugins/:id          — Update plugin
 *   DELETE /api/plugins/:id          — Remove plugin
 *   POST   /api/plugins/:id/enable   — Enable plugin
 *   POST   /api/plugins/:id/disable  — Disable plugin
 *   GET    /api/plugins/catalog      — Get public plugin catalog
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

const PLUGIN_SOURCES = ['official', 'community', 'custom'] as const;
const PLUGIN_STATUSES = ['active', 'inactive', 'deprecated', 'pending_review'] as const;

type PluginSource = (typeof PLUGIN_SOURCES)[number];
type PluginStatus = (typeof PLUGIN_STATUSES)[number];

interface Plugin {
  id: string;
  user_id: string;
  name: string;
  description: string;
  version: string;
  source: PluginSource;
  status: PluginStatus;
  config: Record<string, unknown>;
  hooks: string[];
  permissions: string[];
  installed_at: string;
  updated_at: string;
}

function generateId(): string {
  return `plug_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function validatePluginSource(source: string): source is PluginSource {
  return PLUGIN_SOURCES.includes(source as PluginSource);
}

function validatePluginStatus(status: string): status is PluginStatus {
  return PLUGIN_STATUSES.includes(status as PluginStatus);
}

export async function handlePlugin(req: VercelRequest, res: VercelResponse) {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({ success: false, error: 'Server not configured' });
    }

    const { user, error } = await getUserFromRequest(req);
    if (error || !user) return res.status(401).json({ success: false, error });

    const pathArr = (req.query.path as string[]) || [];
    const id = pathArr[0];
    const subAction = pathArr[1];

    if (id === 'catalog' && req.method === 'GET') {
      return handleCatalog(req, res);
    }
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
    if (req.method === 'POST' && id && subAction === 'enable') {
      return handleEnable(req, res, id, user.id);
    }
    if (req.method === 'POST' && id && subAction === 'disable') {
      return handleDisable(req, res, id, user.id);
    }

    return res.status(404).json({ success: false, error: 'Plugin route not found' });
  } catch (err) {
    return handleError(res, 'plugin', err);
  }
}

async function handleList(_req: VercelRequest, res: VercelResponse, userId: string) {
  const plugins = await selectMany(
    'plugins',
    { user_id: userId },
    ['name'],
    100,
    0,
    'id,name,description,version,source,status,config,hooks,permissions,installed_at'
  );
  return res.json({ success: true, plugins });
}

async function handleCatalog(_req: VercelRequest, res: VercelResponse) {
  const catalog = await selectMany(
    'plugin_catalog',
    { status: 'active' },
    ['name'],
    200,
    0,
    'id,name,description,version,source,hooks,permissions,icon,author'
  );
  return res.json({ success: true, catalog });
}

async function handleCreate(req: VercelRequest, res: VercelResponse, userId: string) {
  const body = req.body as any;
  if (!body?.name || !body?.description || !body?.version) {
    return res.status(400).json({ success: false, error: 'name, description, and version required' });
  }

  const source = body.source || 'custom';
  if (!validatePluginSource(source)) {
    return res.status(400).json({ success: false, error: `Invalid source: ${source}` });
  }

  const pluginId = generateId();
  const plugin = await insert('plugins', {
    id: pluginId,
    user_id: userId,
    name: body.name,
    description: body.description,
    version: body.version,
    source,
    status: 'inactive',
    config: body.config || {},
    hooks: body.hooks || [],
    permissions: body.permissions || [],
    installed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  return res.status(201).json({ success: true, plugin });
}

async function handleGet(_req: VercelRequest, res: VercelResponse, id: string) {
  const plugin = await selectOne('plugins', { column: 'id', value: id, select: '*' });
  if (!plugin) return res.status(404).json({ success: false, error: 'Plugin not found' });
  return res.json({ success: true, plugin });
}

async function handleUpdate(req: VercelRequest, res: VercelResponse, id: string, userId: string) {
  const existing = await selectOne('plugins', { column: 'id', value: id, select: 'id,user_id' });
  if (!existing) return res.status(404).json({ success: false, error: 'Plugin not found' });
  if (existing.user_id !== userId) return res.status(403).json({ success: false, error: 'Forbidden' });

  const body = req.body as any;
  const updated = await update('plugins', { column: 'id', value: id }, {
    name: body.name || existing.name,
    description: body.description ?? existing.description,
    version: body.version || existing.version,
    config: body.config || existing.config,
    hooks: body.hooks || existing.hooks,
    permissions: body.permissions || existing.permissions,
    updated_at: new Date().toISOString(),
  });

  return res.json({ success: true, plugin: updated });
}

async function handleDelete(_req: VercelRequest, res: VercelResponse, id: string, userId: string) {
  const existing = await selectOne('plugins', { column: 'id', value: id, select: 'id,user_id' });
  if (!existing) return res.status(404).json({ success: false, error: 'Plugin not found' });
  if (existing.user_id !== userId) return res.status(403).json({ success: false, error: 'Forbidden' });

  await remove('plugins', { column: 'id', value: id });
  return res.json({ success: true, id, deleted: true });
}

async function handleEnable(_req: VercelRequest, res: VercelResponse, id: string, userId: string) {
  const existing = await selectOne('plugins', { column: 'id', value: id, select: 'id,user_id' });
  if (!existing) return res.status(404).json({ success: false, error: 'Plugin not found' });
  if (existing.user_id !== userId) return res.status(403).json({ success: false, error: 'Forbidden' });

  await update('plugins', { column: 'id', value: id }, {
    status: 'active',
    updated_at: new Date().toISOString(),
  });

  return res.json({ success: true, id, status: 'active' });
}

async function handleDisable(_req: VercelRequest, res: VercelResponse, id: string, userId: string) {
  const existing = await selectOne('plugins', { column: 'id', value: id, select: 'id,user_id' });
  if (!existing) return res.status(404).json({ success: false, error: 'Plugin not found' });
  if (existing.user_id !== userId) return res.status(403).json({ success: false, error: 'Forbidden' });

  await update('plugins', { column: 'id', value: id }, {
    status: 'inactive',
    updated_at: new Date().toISOString(),
  });

  return res.json({ success: true, id, status: 'inactive' });
}