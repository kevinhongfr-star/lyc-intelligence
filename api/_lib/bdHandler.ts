/**
 * api/_lib/bdHandler.ts
 * Routes:
 *   GET  /api/x/bd/opportunities            → list opportunities
 *   POST /api/x/bd/opportunities           → create opportunity
 *   GET  /api/x/bd/opportunities/:id      → get opportunity
 *   PUT  /api/x/bd/opportunities/:id       → update opportunity
 *   GET  /api/x/bd/opportunities/:id/activities → activities
 *   GET  /api/x/bd/proposals               → list proposals
 *   POST /api/x/bd/proposals              → create proposal
 *   GET  /api/x/bd/proposals/:id          → get proposal
 *   PUT  /api/x/bd/proposals/:id          → update proposal
 *   GET  /api/x/bd/metrics                → BD metrics
 *   GET  /api/x/bd/pipeline               → pipeline overview
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as db from './supabaseRest.js';

export async function handler(req: VercelRequest, res: VercelResponse) {
  const pathArr = (req.query.path as string[]) || [];
  const resource = pathArr[0] || ''; // 'opportunities', 'proposals', 'metrics', 'pipeline'
  const id = pathArr[1] || '';
  const subResource = pathArr[2] || '';
  const method = req.method || 'GET';

  try {
    // ── Opportunities ──
    if (resource === 'opportunities') {
      // GET list
      if (method === 'GET' && !id) {
        const { org_id, stage, owner_id, search, limit = '100', offset = '0' } = req.query as Record<string, string>;

        if (!org_id) {
          return res.status(400).json({ error: 'org_id is required' });
        }

        const filters = [{ column: 'org_id', value: org_id }];
        if (stage) filters.push({ column: 'stage', value: stage });
        if (owner_id) filters.push({ column: 'owner_id', value: owner_id });

        const rows = await db.selectMany('bd_opportunities', {
          select: '*',
          where: filters,
          orderBy: { column: 'updated_at', ascending: false },
          limit: parseInt(limit),
          offset: parseInt(offset),
        });

        return res.status(200).json({ success: true, opportunities: rows });
      }

      // GET single
      if (method === 'GET' && id) {
        const opp = await db.selectOne('bd_opportunities', {
          select: '*',
          where: [{ column: 'id', value: id }],
        });

        if (!opp) {
          return res.status(404).json({ error: 'Opportunity not found' });
        }

        return res.status(200).json({ success: true, opportunity: opp });
      }

      // Activities for opportunity
      if (method === 'GET' && id && subResource === 'activities') {
        const rows = await db.selectMany('bd_activities', {
          select: '*',
          where: [{ column: 'opportunity_id', value: id }],
          orderBy: { column: 'created_at', ascending: false },
          limit: 50,
        });

        return res.status(200).json({ success: true, activities: rows });
      }

      // POST create
      if (method === 'POST' && !id) {
        const body = req.body || {};
        const { org_id, owner_id, company_name, title, stage = 'initial_contact' } = body;

        if (!org_id || !owner_id || !company_name) {
          return res.status(400).json({
            error: 'org_id, owner_id, and company_name are required',
          });
        }

        const result = await db.insert('bd_opportunities', {
          org_id,
          owner_id,
          company_name,
          title: title || null,
          stage,
          estimated_value: body.estimated_value || null,
          probability: body.probability || 10,
        });

        return res.status(201).json({ success: true, opportunity: result });
      }

      // PUT update
      if ((method === 'PUT' || method === 'PATCH') && id) {
        const body = req.body || {};
        const { stage, owner_id, company_name, title, estimated_value, probability, notes } = body;

        const updates: Record<string, unknown> = {};
        if (stage !== undefined) updates.stage = stage;
        if (owner_id !== undefined) updates.owner_id = owner_id;
        if (company_name !== undefined) updates.company_name = company_name;
        if (title !== undefined) updates.title = title;
        if (estimated_value !== undefined) updates.estimated_value = estimated_value;
        if (probability !== undefined) updates.probability = probability;
        if (notes !== undefined) updates.notes = notes;
        updates.updated_at = new Date().toISOString();

        const result = await db.update('bd_opportunities', updates, id);

        return res.status(200).json({ success: true, opportunity: result });
      }

      // DELETE
      if (method === 'DELETE' && id) {
        await db.remove('bd_opportunities', id);
        return res.status(200).json({ success: true });
      }
    }

    // ── Proposals ──
    if (resource === 'proposals') {
      if (method === 'GET' && !id) {
        const { org_id, status, opportunity_id, limit = '50' } = req.query as Record<string, string>;

        if (!org_id) {
          return res.status(400).json({ error: 'org_id is required' });
        }

        const filters = [{ column: 'org_id', value: org_id }];
        if (status) filters.push({ column: 'status', value: status });
        if (opportunity_id) filters.push({ column: 'opportunity_id', value: opportunity_id });

        const rows = await db.selectMany('bd_proposals', {
          select: '*',
          where: filters,
          orderBy: { column: 'created_at', ascending: false },
          limit: parseInt(limit),
        });

        return res.status(200).json({ success: true, proposals: rows });
      }

      if (method === 'GET' && id) {
        const proposal = await db.selectOne('bd_proposals', {
          select: '*',
          where: [{ column: 'id', value: id }],
        });

        if (!proposal) {
          return res.status(404).json({ error: 'Proposal not found' });
        }

        return res.status(200).json({ success: true, proposal });
      }

      if (method === 'POST' && !id) {
        const body = req.body || {};
        const { org_id, opportunity_id, proposed_fee, status = 'draft' } = body;

        if (!org_id || !opportunity_id) {
          return res.status(400).json({
            error: 'org_id and opportunity_id are required',
          });
        }

        const result = await db.insert('bd_proposals', {
          org_id,
          opportunity_id,
          proposed_fee: proposed_fee || null,
          status,
        });

        return res.status(201).json({ success: true, proposal: result });
      }

      if ((method === 'PUT' || method === 'PATCH') && id) {
        const body = req.body || {};
        const { status, proposed_fee, notes } = body;

        const updates: Record<string, unknown> = {};
        if (status !== undefined) updates.status = status;
        if (proposed_fee !== undefined) updates.proposed_fee = proposed_fee;
        if (notes !== undefined) updates.notes = notes;
        updates.updated_at = new Date().toISOString();

        const result = await db.update('bd_proposals', updates, id);

        return res.status(200).json({ success: true, proposal: result });
      }
    }

    // ── Metrics ──
    if (resource === 'metrics') {
      const { org_id, period = '30d' } = req.query as Record<string, string>;

      if (!org_id) {
        return res.status(400).json({ error: 'org_id is required' });
      }

      const now = new Date();
      const periodDays = period === '7d' ? 7 : period === '90d' ? 90 : 30;
      const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000).toISOString();

      // Count by stage
      const opps = await db.selectMany('bd_opportunities', {
        select: 'stage',
        where: [
          { column: 'org_id', value: org_id },
          { column: 'created_at', value: startDate, operator: 'gte' },
        ],
      });

      const stageCounts: Record<string, number> = {};
      for (const o of opps) {
        stageCounts[o.stage] = (stageCounts[o.stage] || 0) + 1;
      }

      return res.status(200).json({
        success: true,
        metrics: {
          period,
          total_opportunities: opps.length,
          by_stage: stageCounts,
        },
      });
    }

    // ── Pipeline ──
    if (resource === 'pipeline') {
      const { org_id } = req.query as Record<string, string>;

      if (!org_id) {
        return res.status(400).json({ error: 'org_id is required' });
      }

      const stages = ['initial_contact', 'discovery', 'proposal', 'negotiation', 'won', 'lost'];
      const pipeline: Record<string, { count: number; value: number }> = {};

      for (const stage of stages) {
        const opps = await db.selectMany('bd_opportunities', {
          select: 'estimated_value',
          where: [
            { column: 'org_id', value: org_id },
            { column: 'stage', value: stage },
          ],
        });

        const totalValue = opps.reduce((sum: number, o: any) => sum + (o.estimated_value || 0), 0);
        pipeline[stage] = { count: opps.length, value: totalValue };
      }

      return res.status(200).json({
        success: true,
        pipeline,
      });
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (err: any) {
    console.error('[bdHandler]', err);
    return res.status(500).json({ error: err.message });
  }
}
