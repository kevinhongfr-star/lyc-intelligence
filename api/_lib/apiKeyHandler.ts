/**
 * apiKeyHandler.ts — API key management for external integrations
 *
 * Endpoints:
 *   GET    /api/api-keys             — List API keys (masked)
 *   POST   /api/api-keys             — Create new API key
 *   DELETE /api/api-keys/:id         — Revoke API key
 *   GET    /api/api-keys/:id/usage   — Get key usage stats
 *   POST   /api/api-keys/:id/rotate  — Rotate API key
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

const MAX_KEYS_PER_USER = 20;
const MIN_KEY_NAME_LENGTH = 3;

interface ApiKeyRecord {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  key_hash: string;
  scopes: string[];
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

function generateKeyId(): string {
  return `key_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function generateKey(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let prefix = 'sk_';
  for (let i = 0; i < 12; i++) prefix += chars[Math.floor(Math.random() * chars.length)];
  let body = '';
  for (let i = 0; i < 32; i++) body += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}_${body}`;
}

function hashKey(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `hash_${Math.abs(hash).toString(16)}_${key.length}`;
}

function maskKey(key: string): string {
  if (key.length <= 8) return '****';
  return key.slice(0, 6) + '****' + key.slice(-4);
}

export async function handleApiKey(req: VercelRequest, res: VercelResponse) {
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
    if (req.method === 'DELETE' && id) {
      return handleRevoke(req, res, id, user.id);
    }
    if (req.method === 'GET' && id && subAction === 'usage') {
      return handleUsage(req, res, id, user.id);
    }
    if (req.method === 'POST' && id && subAction === 'rotate') {
      return handleRotate(req, res, id, user.id);
    }

    return res.status(404).json({ success: false, error: 'API key route not found' });
  } catch (err) {
    return handleError(res, 'apiKey', err);
  }
}

async function handleList(_req: VercelRequest, res: VercelResponse, userId: string) {
  const keys = await selectMany(
    'api_keys',
    { user_id: userId },
    ['created_at DESC'],
    MAX_KEYS_PER_USER,
    0,
    'id,name,key_prefix,scopes,is_active,last_used_at,expires_at,created_at'
  );
  return res.json({ success: true, keys });
}

async function handleCreate(req: VercelRequest, res: VercelResponse, userId: string) {
  const body = req.body as any;
  const name = body?.name?.trim();
  if (!name || name.length < MIN_KEY_NAME_LENGTH) {
    return res.status(400).json({ success: false, error: `name must be at least ${MIN_KEY_NAME_LENGTH} chars` });
  }

  const existingCount = await countUserKeys(userId);
  if (existingCount >= MAX_KEYS_PER_USER) {
    return res.status(400).json({ success: false, error: `Maximum ${MAX_KEYS_PER_USER} keys allowed` });
  }

  const rawKey = generateKey();
  const keyId = generateKeyId();
  const keyHash = hashKey(rawKey);

  const key = await insert('api_keys', {
    id: keyId,
    user_id: userId,
    name,
    key_prefix: maskKey(rawKey),
    key_hash: keyHash,
    scopes: body?.scopes || ['read'],
    is_active: true,
    expires_at: body?.expires_at || null,
    created_at: new Date().toISOString(),
  });

  return res.status(201).json({
    success: true,
    key: { ...key, raw_key: rawKey },
  });
}

async function handleRevoke(_req: VercelRequest, res: VercelResponse, id: string, userId: string) {
  const existing = await selectOne('api_keys', { column: 'id', value: id, select: 'id,user_id' });
  if (!existing) return res.status(404).json({ success: false, error: 'Key not found' });
  if (existing.user_id !== userId) return res.status(403).json({ success: false, error: 'Forbidden' });

  await update('api_keys', { column: 'id', value: id }, { is_active: false });
  return res.json({ success: true, id, revoked: true });
}

async function handleUsage(_req: VercelRequest, res: VercelResponse, id: string, userId: string) {
  const existing = await selectOne('api_keys', { column: 'id', value: id, select: 'id,user_id' });
  if (!existing) return res.status(404).json({ success: false, error: 'Key not found' });
  if (existing.user_id !== userId) return res.status(403).json({ success: false, error: 'Forbidden' });

  const usage = await selectMany(
    'api_key_usage',
    { key_id: id },
    ['created_at DESC'],
    100,
    0,
    'endpoint,method,status,created_at'
  );

  return res.json({ success: true, usage, total: usage?.length || 0 });
}

async function handleRotate(req: VercelRequest, res: VercelResponse, id: string, userId: string) {
  const existing = await selectOne('api_keys', { column: 'id', value: id, select: 'id,user_id,name,scopes' });
  if (!existing) return res.status(404).json({ success: false, error: 'Key not found' });
  if (existing.user_id !== userId) return res.status(403).json({ success: false, error: 'Forbidden' });

  const rawKey = generateKey();
  const keyHash = hashKey(rawKey);

  await update('api_keys', { column: 'id', value: id }, {
    key_prefix: maskKey(rawKey),
    key_hash: keyHash,
    is_active: true,
    updated_at: new Date().toISOString(),
  });

  return res.json({
    success: true,
    id,
    raw_key: rawKey,
  });
}

async function countUserKeys(userId: string): Promise<number> {
  const keys = await selectMany(
    'api_keys',
    { user_id: userId, is_active: true },
    [],
    MAX_KEYS_PER_USER + 1,
    0,
    'id'
  );
  return keys?.length || 0;
}