/**
 * api/_lib/automationHandler.ts
 * Routes:
 *   GET  /api/x/automation/rules            → list rules
 *   POST /api/x/automation/rules            → create rule
 *   GET  /api/x/automation/rules/:id        → get rule
 *   PUT  /api/x/automation/rules/:id        → update rule
 *   DELETE /api/x/automation/rules/:id     → delete rule
 *   POST /api/x/automation/rules/:id/test  → test rule
 *   GET  /api/x/automation/executions      → execution history
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as db from './supabaseRest.js';

export async function handler(req: VercelRequest, res: VercelResponse) {
  const pathArr = (req.query.path as string[]) || [];
  const resource = pathArr[0] || '';
  const id = pathArr[1] || '';
  const subAction = pathArr[2] || '';
  const method = req.method || 'GET';

  try {
    // ── Executions ──
    if (resource === 'executions') {
      const { org_id, rule_id, status, limit = '50' } = req.query as Record<string, string>;

      if (!org_id) {
        return res.status(400).json({ error: 'org_id is required' });
      }

      const filters = [{ column: 'org_id', value: org_id }];
      if (rule_id) filters.push({ column: 'rule_id', value: rule_id });
      if (status) filters.push({ column: 'status', value: status });

      const rows = await db.selectMany('automation_executions', {
        select: '*',
        where: filters,
        orderBy: { column: 'executed_at', ascending: false },
        limit: parseInt(limit),
      });

      return res.status(200).json({ success: true, executions: rows });
    }

    // ── Rules ──
    if (resource === 'rules') {
      // GET list
      if (method === 'GET' && !id) {
        const { org_id, is_active, rule_type, limit = '50' } = req.query as Record<string, string>;

        if (!org_id) {
          return res.status(400).json({ error: 'org_id is required' });
        }

        const filters = [{ column: 'org_id', value: org_id }];
        if (is_active !== undefined) filters.push({ column: 'is_active', value: is_active === 'true' });
        if (rule_type) filters.push({ column: 'rule_type', value: rule_type });

        const rows = await db.selectMany('automation_rules', {
          select: '*',
          where: filters,
          orderBy: { column: 'updated_at', ascending: false },
          limit: parseInt(limit),
        });

        return res.status(200).json({ success: true, rules: rows });
      }

      // GET single
      if (method === 'GET' && id) {
        const rule = await db.selectOne('automation_rules', {
          select: '*',
          where: [{ column: 'id', value: id }],
        });

        if (!rule) {
          return res.status(404).json({ error: 'Rule not found' });
        }

        return res.status(200).json({ success: true, rule });
      }

      // POST create
      if (method === 'POST' && !id) {
        const body = req.body || {};
        const { org_id, name, rule_type, trigger_config, action_config, is_active = true } = body;

        if (!org_id || !name || !rule_type || !trigger_config || !action_config) {
          return res.status(400).json({
            error: 'org_id, name, rule_type, trigger_config, and action_config are required',
          });
        }

        const result = await db.insert('automation_rules', {
          org_id,
          name,
          rule_type,
          trigger_config,
          action_config,
          is_active,
          last_triggered_at: null,
        });

        return res.status(201).json({ success: true, rule: result });
      }

      // Test rule
      if (method === 'POST' && id && subAction === 'test') {
        const rule = await db.selectOne('automation_rules', {
          select: '*',
          where: [{ column: 'id', value: id }],
        });

        if (!rule) {
          return res.status(404).json({ error: 'Rule not found' });
        }

        // Log test execution
        await db.insert('automation_executions', {
          rule_id: id,
          org_id: rule.org_id,
          status: 'success',
          executed_at: new Date().toISOString(),
          result: { test: true, triggered_at: new Date().toISOString() },
        });

        return res.status(200).json({ success: true, message: 'Rule test executed' });
      }

      // PUT update
      if ((method === 'PUT' || method === 'PATCH') && id) {
        const body = req.body || {};
        const { name, trigger_config, action_config, is_active } = body;

        const updates: Record<string, unknown> = {};
        if (name !== undefined) updates.name = name;
        if (trigger_config !== undefined) updates.trigger_config = trigger_config;
        if (action_config !== undefined) updates.action_config = action_config;
        if (is_active !== undefined) updates.is_active = is_active;
        updates.updated_at = new Date().toISOString();

        const result = await db.update('automation_rules', updates, id);

        return res.status(200).json({ success: true, rule: result });
      }

      // DELETE
      if (method === 'DELETE' && id) {
        await db.remove('automation_rules', id);
        return res.status(200).json({ success: true });
      }
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (err: any) {
    console.error('[automationHandler]', err);
    return res.status(500).json({ error: err.message });
  }
}
