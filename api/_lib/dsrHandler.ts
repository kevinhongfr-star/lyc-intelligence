/**
 * api/_lib/dsrHandler.ts — Data Subject Requests (PIPL)
 * Routes:
 *   GET  /api/x/data-subject-requests     → list requests
 *   POST /api/x/data-subject-requests     → create request
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as db from './supabaseRest.js';

const TABLE_MAP: Record<string, string> = {
  candidate: 'contacts',
  client_contact: 'client_contacts',
  user: 'users',
};

const PII_FIELDS_TO_CLEAR: Record<string, string[]> = {
  contacts: ['email', 'phone', 'address', 'wechat', 'linkedin', 'photo_url', 'resume_url'],
  client_contacts: ['email', 'phone', 'wechat', 'linkedin', 'photo_url'],
  users: ['email', 'phone'],
};

export async function handler(req: VercelRequest, res: VercelResponse) {
  const method = req.method || 'GET';

  try {
    // ── GET requests ──
    if (method === 'GET') {
      const { org_id, status, request_type, limit = '50' } = req.query as Record<string, string>;

      if (!org_id) {
        return res.status(400).json({ error: 'org_id is required' });
      }

      const filters = [{ column: 'org_id', value: org_id }];
      if (status) filters.push({ column: 'status', value: status });
      if (request_type) filters.push({ column: 'request_type', value: request_type });

      const rows = await db.selectMany('data_subject_requests', {
        select: '*',
        where: filters,
        orderBy: { column: 'requested_at', ascending: false },
        limit: parseInt(limit),
      });

      return res.status(200).json({ success: true, requests: rows });
    }

    // ── POST request ──
    if (method === 'POST') {
      const body = req.body || {};
      const {
        org_id,
        request_type,
        data_subject_type,
        data_subject_id,
        request_details,
      } = body;

      if (!org_id || !request_type || !data_subject_type || !data_subject_id) {
        return res.status(400).json({
          error: 'Missing required fields: org_id, request_type, data_subject_type, data_subject_id',
        });
      }

      const slaDays = 15;
      const dueAt = new Date(Date.now() + slaDays * 24 * 60 * 60 * 1000).toISOString();

      const result = await db.insert('data_subject_requests', {
        org_id,
        request_type,
        data_subject_type,
        data_subject_id,
        request_details: request_details || null,
        due_at: dueAt,
      });

      // Auto-process deletion requests
      if (request_type === 'deletion') {
        await processDeletionRequest(org_id, data_subject_type, data_subject_id);

        // Mark as completed
        const clearedFields = PII_FIELDS_TO_CLEAR[TABLE_MAP[data_subject_type]] || [];
        await db.update('data_subject_requests', {
          status: 'completed',
          completed_at: new Date().toISOString(),
          response_details: {
            processed: true,
            action: 'soft_delete',
            fields_cleared: clearedFields,
          },
        }, result.id);
      }

      return res.status(201).json({ success: true, request: result });
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (err: any) {
    console.error('[dsrHandler]', err);
    return res.status(500).json({ error: err.message });
  }
}

async function processDeletionRequest(
  orgId: string,
  subjectType: string,
  subjectId: string
): Promise<{ success: boolean; error?: string }> {
  const table = TABLE_MAP[subjectType];
  if (!table) {
    return { success: false, error: `Unknown subject type: ${subjectType}` };
  }

  try {
    const now = new Date().toISOString();
    const updates: Record<string, unknown> = { updated_at: now };

    const piiFields = PII_FIELDS_TO_CLEAR[table] || [];
    for (const field of piiFields) {
      updates[field] = '[deleted]';
    }

    if (table === 'contacts') {
      updates.status = 'deleted';
      updates.deleted_at = now;
      updates.anonymized = true;
    }

    await db.update(table, updates, subjectId);

    // Clear consents
    await db.update('data_consents', {
      consent_given: false,
      withdrawn_at: now,
      updated_at: now,
    }, subjectId, 'data_subject_id');

    // Update residency tag
    try {
      await db.update('data_residency_tags', {
        data_category: 'standard',
        updated_at: now,
      }, subjectId, 'entity_id');
    } catch {
      // Ignore if not found
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
