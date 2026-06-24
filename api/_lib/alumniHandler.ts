/**
 * api/_lib/alumniHandler.ts
 * Routes:
 *   GET  /api/x/alumni                      → list alumni
 *   POST /api/x/alumni                      → create alumni record
 *   GET  /api/x/alumni/:id                  → get alumni
 *   PUT  /api/x/alumni/:id                 → update alumni
 *   DELETE /api/x/alumni/:id               → delete alumni
 *   GET  /api/x/alumni/guarantee           → guarantee status
 *   GET  /api/x/alumni/reengage            → reengagement candidates
 *   GET  /api/x/alumni/referrals          → referral tracking
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as db from './supabaseRest.js';

export async function handler(req: VercelRequest, res: VercelResponse) {
  const pathArr = (req.query.path as string[]) || [];
  const resource = pathArr[0] || '';
  const id = pathArr[1] || '';
  const method = req.method || 'GET';

  try {
    // ── Guarantee status ──
    if (resource === 'guarantee' && method === 'GET') {
      const { org_id, mandate_id } = req.query as Record<string, string>;

      if (!org_id) {
        return res.status(400).json({ error: 'org_id is required' });
      }

      const filters = [{ column: 'org_id', value: org_id }];
      if (mandate_id) filters.push({ column: 'mandate_id', value: mandate_id });

      const records = await db.selectMany('alumni_placements', {
        select: '*',
        where: filters,
        orderBy: { column: 'placement_date', ascending: false },
      });

      return res.status(200).json({ success: true, guarantee_records: records });
    }

    // ── Reengagement candidates ──
    if (resource === 'reengage' && method === 'GET') {
      const { org_id, min_tenure_months = '6' } = req.query as Record<string, string>;

      if (!org_id) {
        return res.status(400).json({ error: 'org_id is required' });
      }

      // Find alumni who left > min_tenure_months ago
      const cutoffDate = new Date(Date.now() - parseInt(min_tenure_months) * 30 * 24 * 60 * 60 * 1000).toISOString();

      const alumni = await db.selectMany('alumni_placements', {
        select: '*',
        where: [
          { column: 'org_id', value: org_id },
          { column: 'status', value: 'inactive' },
          { column: 'end_date', value: cutoffDate, operator: 'lte' },
        ],
        orderBy: { column: 'end_date', ascending: false },
      });

      return res.status(200).json({ success: true, candidates: alumni });
    }

    // ── Referrals ──
    if (resource === 'referrals' && method === 'GET') {
      const { org_id, status } = req.query as Record<string, string>;

      if (!org_id) {
        return res.status(400).json({ error: 'org_id is required' });
      }

      const filters = [{ column: 'org_id', value: org_id }];
      if (status) filters.push({ column: 'referral_status', value: status });

      const referrals = await db.selectMany('alumni_referrals', {
        select: '*',
        where: filters,
        orderBy: { column: 'created_at', ascending: false },
      });

      return res.status(200).json({ success: true, referrals });
    }

    // ── GET list ──
    if (method === 'GET' && !id && resource !== 'guarantee' && resource !== 'reengage' && resource !== 'referrals') {
      const { org_id, status, skills, limit = '50' } = req.query as Record<string, string>;

      if (!org_id) {
        return res.status(400).json({ error: 'org_id is required' });
      }

      const filters = [{ column: 'org_id', value: org_id }];
      if (status) filters.push({ column: 'status', value: status });

      const rows = await db.selectMany('alumni', {
        select: '*',
        where: filters,
        orderBy: { column: 'updated_at', ascending: false },
        limit: parseInt(limit),
      });

      return res.status(200).json({ success: true, alumni: rows });
    }

    // ── GET single ──
    if (method === 'GET' && id) {
      const alumni = await db.selectOne('alumni', {
        select: '*',
        where: [{ column: 'id', value: id }],
      });

      if (!alumni) {
        return res.status(404).json({ error: 'Alumni not found' });
      }

      return res.status(200).json({ success: true, alumni });
    }

    // ── POST create ──
    if (method === 'POST' && !resource) {
      const body = req.body || {};
      const { org_id, contact_id, original_mandate_id, placement_date, end_date, status = 'active', skills, notes } = body;

      if (!org_id || !contact_id) {
        return res.status(400).json({
          error: 'org_id and contact_id are required',
        });
      }

      const result = await db.insert('alumni', {
        org_id,
        contact_id,
        original_mandate_id: original_mandate_id || null,
        placement_date: placement_date || null,
        end_date: end_date || null,
        status,
        skills: skills || [],
        notes: notes || null,
      });

      return res.status(201).json({ success: true, alumni: result });
    }

    // ── PUT update ──
    if ((method === 'PUT' || method === 'PATCH') && id) {
      const body = req.body || {};
      const { status, end_date, skills, notes, reengagement_score } = body;

      const updates: Record<string, unknown> = {};
      if (status !== undefined) updates.status = status;
      if (end_date !== undefined) updates.end_date = end_date;
      if (skills !== undefined) updates.skills = skills;
      if (notes !== undefined) updates.notes = notes;
      if (reengagement_score !== undefined) updates.reengagement_score = reengagement_score;
      updates.updated_at = new Date().toISOString();

      const result = await db.update('alumni', updates, id);

      return res.status(200).json({ success: true, alumni: result });
    }

    // ── DELETE ──
    if (method === 'DELETE' && id) {
      await db.remove('alumni', id);
      return res.status(200).json({ success: true });
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (err: any) {
    console.error('[alumniHandler]', err);
    return res.status(500).json({ error: err.message });
  }
}
