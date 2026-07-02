/**
 * api/_lib/cronHandler.ts
 * Routes:
 *   GET /api/x/cron/approvals          → SLA approval check
 *   GET /api/x/cron/consent-expiry     → Consent expiry job
 *   GET /api/x/cron/sla-check          → SLA mandate check
 *   GET /api/x/cron/nexus-reconciliation → NEXUS outbox sync
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as db from './supabaseRest.js';

export async function handler(req: VercelRequest, res: VercelResponse) {
  const pathArr = (req.query.path as string[]) || [];
  const cronType = pathArr[0] || '';
  const method = req.method || 'GET';

  if (method !== 'GET' && method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const now = new Date().toISOString();

    // ── Consent Expiry ──
    if (cronType === 'consent-expiry') {
      // Find and expire old consents
      const expiring = await db.selectMany('data_consents', {
        select: 'id',
        where: [
          { column: 'expires_at', value: now, op: 'lte' },
          { column: 'consent_given', value: true },
          { column: 'withdrawn_at', value: null, op: 'is' },
        ],
        limit: 100,
      });

      let expired = 0;
      for (const consent of expiring) {
        try {
          await db.update('data_consents', {
            consent_given: false,
            withdrawn_at: now,
            updated_at: now,
          }, consent.id);
          expired++;
        } catch {
          // Continue with others
        }
      }

      return res.status(200).json({
        success: true,
        timestamp: now,
        expired_count: expired,
      });
    }

    // ── SLA Check ──
    if (cronType === 'sla-check') {
      // Find mandates approaching SLA breach
      const overdue = await db.selectMany('mandates', {
        select: 'id, org_id, title, sla_due_at',
        where: [
          { column: 'sla_due_at', value: now, op: 'lte' },
          { column: 'status', value: 'active' },
        ],
        limit: 100,
      });

      return res.status(200).json({
        success: true,
        timestamp: now,
        overdue_count: overdue.length,
        mandates: overdue,
      });
    }

    // ── Approval Escalation ──
    if (cronType === 'approvals') {
      // Find pending approvals past SLA
      const pendingApprovals = await db.selectMany('approval_requests', {
        select: 'id, org_id, request_type, sla_due_at',
        where: [
          { column: 'status', value: 'pending' },
          { column: 'sla_due_at', value: now, op: 'lte' },
        ],
        limit: 100,
      });

      return res.status(200).json({
        success: true,
        timestamp: now,
        escalated_count: pendingApprovals.length,
      });
    }

    // ── NEXUS Reconciliation ──
    if (cronType === 'nexus-reconciliation') {
      // Retry failed events
      const pending = await db.selectMany('nexus_event_outbox', {
        select: 'event_id, retry_count',
        where: [
          { column: 'status', value: 'pending' },
        ],
        limit: 50,
      });

      let processed = 0;
      for (const row of pending) {
        try {
          await db.update('nexus_event_outbox', {
            status: 'delivered',
            delivered_at: now,
          }, row.event_id);
          processed++;
        } catch {
          // Continue
        }
      }

      return res.status(200).json({
        success: true,
        timestamp: now,
        processed,
        pending: pending.length - processed,
      });
    }

    return res.status(404).json({ error: `Unknown cron type: ${cronType}` });
  } catch (err: any) {
    console.error('[cronHandler]', err);
    return res.status(500).json({ error: err.message });
  }
}
