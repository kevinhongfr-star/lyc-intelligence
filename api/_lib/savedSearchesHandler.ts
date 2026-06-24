/**
 * api/_lib/savedSearchesHandler.ts
 * Routes:
 *   GET  /api/x/saved-searches              → list searches
 *   POST /api/x/saved-searches              → create search
 *   PUT  /api/x/saved-searches/:id         → update search
 *   DELETE /api/x/saved-searches/:id        → delete search
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as db from './supabaseRest.js';

export async function handler(req: VercelRequest, res: VercelResponse) {
  const pathArr = (req.query.path as string[]) || [];
  const id = pathArr[0] || '';
  const method = req.method || 'GET';

  try {
    // ── GET list ──
    if (method === 'GET' && !id) {
      const { org_id, owner_id, is_shared, limit = '50' } = req.query as Record<string, string>;

      if (!org_id) {
        return res.status(400).json({ error: 'org_id is required' });
      }

      const filters = [{ column: 'org_id', value: org_id }];
      if (owner_id) filters.push({ column: 'owner_id', value: owner_id });
      if (is_shared === 'true') filters.push({ column: 'is_shared', value: true });

      const rows = await db.selectMany('saved_searches', {
        select: '*',
        where: filters,
        orderBy: { column: 'updated_at', ascending: false },
        limit: parseInt(limit),
      });

      return res.status(200).json({ success: true, searches: rows });
    }

    // ── GET single ──
    if (method === 'GET' && id) {
      const search = await db.selectOne('saved_searches', {
        select: '*',
        where: [{ column: 'id', value: id }],
      });

      if (!search) {
        return res.status(404).json({ error: 'Search not found' });
      }

      return res.status(200).json({ success: true, search });
    }

    // ── POST create ──
    if (method === 'POST' && !id) {
      const body = req.body || {};
      const { org_id, owner_id, name, search_params, filters, is_shared = false } = body;

      if (!org_id || !owner_id || !name || !search_params) {
        return res.status(400).json({
          error: 'org_id, owner_id, name, and search_params are required',
        });
      }

      const result = await db.insert('saved_searches', {
        org_id,
        owner_id,
        name,
        search_params,
        filters: filters || {},
        is_shared,
        last_run_at: null,
        result_count: 0,
      });

      return res.status(201).json({ success: true, search: result });
    }

    // ── PUT update ──
    if ((method === 'PUT' || method === 'PATCH') && id) {
      const body = req.body || {};
      const { name, search_params, filters, is_shared } = body;

      const updates: Record<string, unknown> = {};
      if (name !== undefined) updates.name = name;
      if (search_params !== undefined) updates.search_params = search_params;
      if (filters !== undefined) updates.filters = filters;
      if (is_shared !== undefined) updates.is_shared = is_shared;
      updates.updated_at = new Date().toISOString();

      const result = await db.update('saved_searches', updates, id);

      return res.status(200).json({ success: true, search: result });
    }

    // ── DELETE ──
    if (method === 'DELETE' && id) {
      await db.remove('saved_searches', id);
      return res.status(200).json({ success: true });
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (err: any) {
    console.error('[savedSearchesHandler]', err);
    return res.status(500).json({ error: err.message });
  }
}
