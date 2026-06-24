/**
 * api/_lib/talentAlertsHandler.ts
 * Routes:
 *   GET  /api/x/talent-alerts              → list alerts
 *   POST /api/x/talent-alerts              → create alert
 *   PUT  /api/x/talent-alerts/:id          → update alert
 *   DELETE /api/x/talent-alerts/:id       → delete alert
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
      const { org_id, status, alert_type, limit = '50' } = req.query as Record<string, string>;

      if (!org_id) {
        return res.status(400).json({ error: 'org_id is required' });
      }

      const filters = [{ column: 'org_id', value: org_id }];
      if (status) filters.push({ column: 'status', value: status });
      if (alert_type) filters.push({ column: 'alert_type', value: alert_type });

      const rows = await db.selectMany('talent_alerts', {
        select: '*',
        where: filters,
        orderBy: { column: 'created_at', ascending: false },
        limit: parseInt(limit),
      });

      return res.status(200).json({ success: true, alerts: rows });
    }

    // ── GET single ──
    if (method === 'GET' && id) {
      const alert = await db.selectOne('talent_alerts', {
        select: '*',
        where: [{ column: 'id', value: id }],
      });

      if (!alert) {
        return res.status(404).json({ error: 'Alert not found' });
      }

      return res.status(200).json({ success: true, alert });
    }

    // ── POST create ──
    if (method === 'POST' && !id) {
      const body = req.body || {};
      const { org_id, alert_type, title, description, criteria, status = 'active' } = body;

      if (!org_id || !alert_type || !title) {
        return res.status(400).json({
          error: 'org_id, alert_type, and title are required',
        });
      }

      const result = await db.insert('talent_alerts', {
        org_id,
        alert_type,
        title,
        description: description || null,
        criteria: criteria || {},
        status,
      });

      return res.status(201).json({ success: true, alert: result });
    }

    // ── PUT update ──
    if ((method === 'PUT' || method === 'PATCH') && id) {
      const body = req.body || {};
      const { status, title, description, criteria } = body;

      const updates: Record<string, unknown> = {};
      if (status !== undefined) updates.status = status;
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (criteria !== undefined) updates.criteria = criteria;
      updates.updated_at = new Date().toISOString();

      const result = await db.update('talent_alerts', updates, id);

      return res.status(200).json({ success: true, alert: result });
    }

    // ── DELETE ──
    if (method === 'DELETE' && id) {
      await db.remove('talent_alerts', id);
      return res.status(200).json({ success: true });
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (err: any) {
    console.error('[talentAlertsHandler]', err);
    return res.status(500).json({ error: err.message });
  }
}
