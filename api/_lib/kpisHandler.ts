/**
 * api/_lib/kpisHandler.ts
 * Routes:
 *   GET  /api/x/kpis                         → list KPIs with values
 *   POST /api/x/kpis                         → compute KPIs
 *   GET  /api/x/kpis/alerts                  → get alerts
 *   POST /api/x/kpis/alerts                  → acknowledge alert
 *   GET  /api/x/kpis/:id/history             → KPI history
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as db from './supabaseRest.js';

export async function handler(req: VercelRequest, res: VercelResponse) {
  const pathArr = (req.query.path as string[]) || [];
  const resource = pathArr[0] || ''; // 'alerts'
  const kpiId = pathArr[1] || '';   // for history
  const method = req.method || 'GET';

  try {
    // ── Alerts ──
    if (resource === 'alerts') {
      if (method === 'GET') {
        const { org_id, severity, acknowledged, limit = '50' } = req.query as Record<string, string>;

        if (!org_id) {
          return res.status(400).json({ error: 'org_id is required' });
        }

        const filters: any[] = [{ column: 'org_id', value: org_id }];
        if (severity) filters.push({ column: 'severity', value: severity });
        if (acknowledged === 'false') {
          filters.push({ column: 'acknowledged_at', value: null, op: 'is' });
        } else if (acknowledged === 'true') {
          filters.push({ column: 'acknowledged_at', value: 'not.null', op: 'is' });
        }

        const alerts = await db.selectMany('kpi_alerts', {
          select: '*',
          where: filters,
          orderBy: { column: 'created_at', ascending: false },
          limit: parseInt(limit),
        });

        const activeCount = alerts.filter((a: any) => !a.acknowledged_at).length;
        const criticalCount = alerts.filter((a: any) => !a.acknowledged_at && a.severity === 'critical').length;
        const warningCount = alerts.filter((a: any) => !a.acknowledged_at && a.severity === 'warning').length;

        return res.status(200).json({
          success: true,
          alerts,
          summary: { total: alerts.length, active: activeCount, critical: criticalCount, warning: warningCount },
        });
      }

      if (method === 'POST') {
        const body = req.body || {};
        const { alert_id, org_id, acknowledged_by } = body;

        if (!alert_id || !org_id) {
          return res.status(400).json({ error: 'alert_id and org_id are required' });
        }

        const result = await db.update('kpi_alerts', {
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: acknowledged_by || null,
        }, alert_id);

        return res.status(200).json({ success: true, alert: result });
      }
    }

    // ── KPI History ──
    if (resource && kpiId && method === 'GET') {
      const { org_id, limit = '12' } = req.query as Record<string, string>;

      if (!org_id) {
        return res.status(400).json({ error: 'org_id is required' });
      }

      const history = await db.selectMany('kpi_values', {
        select: '*',
        where: [
          { column: 'org_id', value: org_id },
          { column: 'kpi_id', value: kpiId },
        ],
        orderBy: { column: 'period_end', ascending: false },
        limit: parseInt(limit),
      });

      const dataPoints = history.reverse().map((item: any) => ({
        period_start: item.period_start,
        period_end: item.period_end,
        value: item.value,
        sample_size: item.sample_size,
      }));

      return res.status(200).json({
        success: true,
        data_points: dataPoints,
        count: dataPoints.length,
      });
    }

    // ── GET KPIs (list) ──
    if (method === 'GET') {
      const { org_id, category, dashboard } = req.query as Record<string, string>;

      if (!org_id) {
        return res.status(400).json({ error: 'org_id is required' });
      }

      // Get latest values from DB
      const latestValues = await db.selectMany('kpi_values', {
        select: '*',
        where: [{ column: 'org_id', value: org_id }],
        orderBy: { column: 'period_end', ascending: false },
      });

      // Deduplicate by kpi_id (keep latest)
      const valueMap = new Map<string, any>();
      for (const item of latestValues) {
        if (!valueMap.has(item.kpi_id)) {
          valueMap.set(item.kpi_id, item);
        }
      }

      // Return values (KPI definitions are on frontend)
      return res.status(200).json({
        success: true,
        values: Array.from(valueMap.values()),
        total: valueMap.size,
      });
    }

    // ── POST KPI (compute) ──
    if (method === 'POST') {
      const body = req.body || {};
      const { org_id, period_start, period_end } = body;

      if (!org_id || !period_start || !period_end) {
        return res.status(400).json({
          error: 'org_id, period_start, and period_end are required',
        });
      }

      // For now, return a placeholder — full computation would need kpiComputer service
      return res.status(200).json({
        success: true,
        message: 'KPI computation placeholder — implement computeKpi logic',
        org_id,
        period_start,
        period_end,
      });
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (err: any) {
    console.error('[kpisHandler]', err);
    return res.status(500).json({ error: err.message });
  }
}
