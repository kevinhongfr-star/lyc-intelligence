/**
 * api/_lib/approvalsHandler.ts
 * Routes:
 *   GET  /api/x/approvals/requests         → list requests
 *   POST /api/x/approvals/requests         → create request
 *   GET  /api/x/approvals/requests/:id     → get request
 *   PUT  /api/x/approvals/requests/:id     → approve/reject
 *   GET  /api/x/approvals/workflows        → list workflows
 *   GET  /api/x/approvals/my-pending       → my pending approvals
 *   GET  /api/x/approvals/audit           → audit log
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as db from './supabaseRest.js';

export async function handler(req: VercelRequest, res: VercelResponse) {
  const pathArr = (req.query.path as string[]) || [];
  const resource = pathArr[0] || '';
  const subResource = pathArr[1] || '';
  const id = pathArr[2] || '';
  const method = req.method || 'GET';

  try {
    // ── My Pending Approvals ──
    if (resource === 'my-pending') {
      const { approver_id, org_id } = req.query as Record<string, string>;

      if (!org_id || !approver_id) {
        return res.status(400).json({ error: 'org_id and approver_id are required' });
      }

      const requests = await db.selectMany('approval_requests', {
        select: '*',
        where: [
          { column: 'org_id', value: org_id },
          { column: 'approver_id', value: approver_id },
          { column: 'status', value: 'pending' },
        ],
        orderBy: { column: 'requested_at', ascending: false },
      });

      return res.status(200).json({ success: true, requests });
    }

    // ── Audit Log ──
    if (resource === 'audit') {
      const { org_id, limit = '100' } = req.query as Record<string, string>;

      if (!org_id) {
        return res.status(400).json({ error: 'org_id is required' });
      }

      const requests = await db.selectMany('approval_requests', {
        select: '*',
        where: [{ column: 'org_id', value: org_id }],
        orderBy: { column: 'requested_at', ascending: false },
        limit: parseInt(limit),
      });

      return res.status(200).json({ success: true, audit_log: requests });
    }

    // ── Workflows ──
    if (resource === 'workflows') {
      const { org_id } = req.query as Record<string, string>;

      if (!org_id) {
        return res.status(400).json({ error: 'org_id is required' });
      }

      const workflows = await db.selectMany('approval_workflows', {
        select: '*',
        where: [{ column: 'org_id', value: org_id }],
        orderBy: { column: 'name', ascending: true },
      });

      return res.status(200).json({ success: true, workflows });
    }

    // ── Requests ──
    if (resource === 'requests') {
      // GET list
      if (method === 'GET' && !id) {
        const { org_id, status, approver_id, request_type, limit = '50' } = req.query as Record<string, string>;

        if (!org_id) {
          return res.status(400).json({ error: 'org_id is required' });
        }

        const filters = [{ column: 'org_id', value: org_id }];
        if (status) filters.push({ column: 'status', value: status });
        if (approver_id) filters.push({ column: 'approver_id', value: approver_id });
        if (request_type) filters.push({ column: 'request_type', value: request_type });

        const rows = await db.selectMany('approval_requests', {
          select: '*',
          where: filters,
          orderBy: { column: 'requested_at', ascending: false },
          limit: parseInt(limit),
        });

        return res.status(200).json({ success: true, requests: rows });
      }

      // GET single
      if (method === 'GET' && id) {
        const request = await db.selectOne('approval_requests', {
          select: '*',
          where: [{ column: 'id', value: id }],
        });

        if (!request) {
          return res.status(404).json({ error: 'Request not found' });
        }

        return res.status(200).json({ success: true, request });
      }

      // POST create
      if (method === 'POST' && !id) {
        const body = req.body || {};
        const { org_id, request_type, requester_id, approver_id, resource_type, resource_id, details } = body;

        if (!org_id || !request_type || !requester_id || !approver_id) {
          return res.status(400).json({
            error: 'org_id, request_type, requester_id, and approver_id are required',
          });
        }

        const now = new Date().toISOString();
        const slaDays = 2;
        const slaDueAt = new Date(Date.now() + slaDays * 24 * 60 * 60 * 1000).toISOString();

        const result = await db.insert('approval_requests', {
          org_id,
          request_type,
          requester_id,
          approver_id,
          resource_type: resource_type || null,
          resource_id: resource_id || null,
          status: 'pending',
          details: details || {},
          requested_at: now,
          sla_due_at: slaDueAt,
        });

        return res.status(201).json({ success: true, request: result });
      }

      // PUT update (approve/reject)
      if ((method === 'PUT' || method === 'PATCH') && id) {
        const body = req.body || {};
        const { status, approver_comments } = body;

        if (!status || !['approved', 'rejected'].includes(status)) {
          return res.status(400).json({ error: 'status must be "approved" or "rejected"' });
        }

        const updates: Record<string, unknown> = {
          status,
          approver_comments: approver_comments || null,
          decided_at: new Date().toISOString(),
        };

        const result = await db.update('approval_requests', updates, id);

        return res.status(200).json({ success: true, request: result });
      }
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (err: any) {
    console.error('[approvalsHandler]', err);
    return res.status(500).json({ error: err.message });
  }
}
