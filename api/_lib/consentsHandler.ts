/**
 * api/_lib/consentsHandler.ts
 * Routes:
 *   GET  /api/x/consents                    → list consents
 *   POST /api/x/consents                    → create consent
 *   GET  /api/x/consents/withdraw          → not used directly
 *   POST /api/x/consents/withdraw           → withdraw consent
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as db from './supabaseRest.js';

export async function handler(req: VercelRequest, res: VercelResponse) {
  const pathArr = (req.query.path as string[]) || [];
  const resource = pathArr[0] || ''; // 'withdraw'
  const method = req.method || 'GET';

  try {
    // ── Withdraw consent ──
    if (resource === 'withdraw' && method === 'POST') {
      const body = req.body || {};
      const { org_id, consent_id, reason } = body;

      if (!org_id || !consent_id) {
        return res.status(400).json({
          error: 'org_id and consent_id are required',
        });
      }

      const now = new Date().toISOString();

      // Update consent to withdrawn
      await db.update('data_consents', {
        consent_given: false,
        withdrawn_at: now,
        updated_at: now,
      }, consent_id);

      // Get the consent record for subject info
      const consent = await db.selectOne('data_consents', {
        select: 'data_subject_type, data_subject_id, purpose',
        where: [{ column: 'id', value: consent_id }],
      });

      // Create data subject request record
      if (consent) {
        await db.insert('data_subject_requests', {
          org_id,
          request_type: 'withdraw_consent',
          data_subject_type: consent.data_subject_type,
          data_subject_id: consent.data_subject_id,
          status: 'completed',
          request_details: {
            consent_id,
            purpose: consent.purpose,
            withdrawal_reason: reason || 'User-initiated withdrawal',
          },
          response_details: {
            processed_at: now,
            result: 'consent_withdrawn',
          },
          completed_at: now,
        });
      }

      return res.status(200).json({
        success: true,
        status: 'withdrawn',
      });
    }

    // ── GET consents ──
    if (method === 'GET') {
      const { org_id, subject_type, subject_id, purpose, active_only } = req.query as Record<string, string>;

      if (!org_id || !subject_type || !subject_id) {
        return res.status(400).json({
          error: 'org_id, subject_type, and subject_id are required',
        });
      }

      const filters = [
        { column: 'org_id', value: org_id },
        { column: 'data_subject_type', value: subject_type },
        { column: 'data_subject_id', value: subject_id },
      ];

      if (purpose) {
        filters.push({ column: 'purpose', value: purpose });
      }

      if (active_only === 'true') {
        filters.push({ column: 'consent_given', value: true });
        filters.push({ column: 'withdrawn_at', value: null, operator: 'is' });
      }

      const rows = await db.selectMany('data_consents', {
        select: '*',
        where: filters,
        orderBy: { column: 'created_at', ascending: false },
      });

      return res.status(200).json({ success: true, consents: rows });
    }

    // ── POST consent ──
    if (method === 'POST') {
      const body = req.body || {};
      const {
        org_id,
        data_subject_type,
        data_subject_id,
        purpose,
        legal_basis,
        consent_text,
        consent_given = true,
        consent_version = 1,
        expires_at,
      } = body;

      if (!org_id || !data_subject_type || !data_subject_id || !purpose || !legal_basis || !consent_text) {
        return res.status(400).json({
          error: 'Missing required fields: org_id, data_subject_type, data_subject_id, purpose, legal_basis, consent_text',
        });
      }

      const now = new Date().toISOString();
      let expiryDate = expires_at;

      // Calculate expiry if not provided
      if (!expiryDate && consent_given) {
        expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      }

      // Check for existing consent
      const existing = await db.selectOne('data_consents', {
        select: 'id',
        where: [
          { column: 'org_id', value: org_id },
          { column: 'data_subject_type', value: data_subject_type },
          { column: 'data_subject_id', value: data_subject_id },
          { column: 'purpose', value: purpose },
        ],
      });

      let result;
      if (existing) {
        // Update existing
        result = await db.update('data_consents', {
          legal_basis,
          consent_text,
          consent_version,
          consent_given,
          granted_at: consent_given ? now : null,
          withdrawn_at: consent_given ? null : now,
          expires_at: expiryDate || null,
          updated_at: now,
        }, existing.id);
      } else {
        // Insert new
        result = await db.insert('data_consents', {
          org_id,
          data_subject_type,
          data_subject_id,
          purpose,
          legal_basis,
          consent_text,
          consent_version,
          consent_given,
          granted_at: consent_given ? now : null,
          withdrawn_at: consent_given ? null : now,
          expires_at: expiryDate || null,
        });
      }

      return res.status(201).json({ success: true, consent: result });
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (err: any) {
    console.error('[consentsHandler]', err);
    return res.status(500).json({ error: err.message });
  }
}
