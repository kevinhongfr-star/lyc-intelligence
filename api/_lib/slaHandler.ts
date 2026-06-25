/**
 * api/_lib/slaHandler.ts
 * Routes:
 *   GET  /api/x/sla/config                  → get SLA config
 *   PUT  /api/x/sla/config                 → update SLA config
 *   GET  /api/x/sla/dashboard              → SLA dashboard metrics
 *   GET  /api/x/sla/escalations             → escalation queue
 *   GET  /api/x/sla/mandates                → mandate SLA status
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as db from './supabaseRest.js';

export async function handler(req: VercelRequest, res: VercelResponse) {
  const pathArr = (req.query.path as string[]) || [];
  const resource = pathArr[0] || '';
  const id = pathArr[1] || '';
  const method = req.method || 'GET';

  try {
    // ── SLA Config ──
    if (resource === 'config') {
      if (method === 'GET') {
        const { org_id } = req.query as Record<string, string>;

        if (!org_id) {
          return res.status(400).json({ error: 'org_id is required' });
        }

        const config = await db.selectOne('sla_configurations', {
          select: '*',
          where: [{ column: 'org_id', value: org_id }],
        });

        return res.status(200).json({ success: true, config: config || {} });
      }

      if (method === 'PUT' || method === 'POST') {
        const body = req.body || {};
        const { org_id, shortlist_sla_days, hire_sla_days, escalation_email } = body;

        if (!org_id) {
          return res.status(400).json({ error: 'org_id is required' });
        }

        const updates = {
          shortlist_sla_days: shortlist_sla_days || 7,
          hire_sla_days: hire_sla_days || 30,
          escalation_email: escalation_email || null,
          updated_at: new Date().toISOString(),
        };

        const existing = await db.selectOne('sla_configurations', {
          select: 'id',
          where: [{ column: 'org_id', value: org_id }],
        });

        let result;
        if (existing) {
          result = await db.update('sla_configurations', updates, existing.id);
        } else {
          result = await db.insert('sla_configurations', { org_id, ...updates });
        }

        return res.status(200).json({ success: true, config: result });
      }
    }

    // ── SLA Dashboard ──
    if (resource === 'dashboard') {
      const { org_id } = req.query as Record<string, string>;

      if (!org_id) {
        return res.status(400).json({ error: 'org_id is required' });
      }

      const now = new Date().toISOString();

      // Get active mandates with SLA info
      const mandates = await db.selectMany('mandates', {
        select: 'id, title, status, sla_due_at, created_at',
        where: [
          { column: 'organization_id', value: org_id },
          { column: 'status', value: 'active' },
        ],
        orderBy: { column: 'sla_due_at', ascending: true },
        limit: 100,
      });

      // Categorize by SLA status
      const at_risk = [];
      const on_track = [];
      const breached = [];

      for (const m of mandates) {
        if (!m.sla_due_at) continue;

        const dueDate = new Date(m.sla_due_at);
        const daysUntil = Math.ceil((dueDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));

        if (daysUntil < 0) {
          breached.push({ ...m, days_overdue: Math.abs(daysUntil) });
        } else if (daysUntil <= 3) {
          at_risk.push({ ...m, days_remaining: daysUntil });
        } else {
          on_track.push({ ...m, days_remaining: daysUntil });
        }
      }

      return res.status(200).json({
        success: true,
        dashboard: {
          total_active: mandates.length,
          on_track: on_track.length,
          at_risk: at_risk.length,
          breached: breached.length,
          mandates: { at_risk, on_track, breached },
        },
      });
    }

    // ── Escalations ──
    if (resource === 'escalations') {
      const { org_id } = req.query as Record<string, string>;

      if (!org_id) {
        return res.status(400).json({ error: 'org_id is required' });
      }

      const now = new Date().toISOString();

      const escalations = await db.selectMany('sla_escalations', {
        select: '*',
        where: [
          { column: 'org_id', value: org_id },
          { column: 'escalation_date', value: now, operator: 'lte' },
          { column: 'acknowledged', value: false },
        ],
        orderBy: { column: 'escalation_date', ascending: true },
      });

      return res.status(200).json({ success: true, escalations });
    }

    // ── Mandate SLA status ──
    if (resource === 'mandates') {
      const { org_id, status } = req.query as Record<string, string>;

      if (!org_id) {
        return res.status(400).json({ error: 'org_id is required' });
      }

      const filters = [
        { column: 'organization_id', value: org_id },
      ];
      if (status) filters.push({ column: 'status', value: status });

      const mandates = await db.selectMany('mandates', {
        select: 'id, title, status, sla_due_at, created_at, updated_at',
        where: filters,
        orderBy: { column: 'sla_due_at', ascending: true },
        limit: 100,
      });

      return res.status(200).json({ success: true, mandates });
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (err: any) {
    console.error('[slaHandler]', err);
    return res.status(500).json({ error: err.message });
  }
}
