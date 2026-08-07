/**
 * dataResidencyHandler.ts — GDPR, data residency, deletion
 *
 * Endpoints:
 *   GET    /api/data-residency/regions        — List available data residency regions
 *   GET    /api/data-residency/config         — Get data residency config
 *   PUT    /api/data-residency/config         — Update config
 *   POST   /api/data-residency/export        — Request data export (GDPR)
 *   POST   /api/data-residency/delete        — Request data deletion (GDPR)
 *   GET    /api/data-residency/requests/:id   — Get request status
 *   GET    /api/data-residency/retention      — Get retention policies
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  selectMany,
  selectOne,
  insert,
  update,
  isSupabaseConfigured,
  handleError,
} from './supabaseRest.js';
import { getUserFromRequest } from './adminAuth.js';

export const maxDuration = 30;

const AVAILABLE_REGIONS = [
  { code: 'us-east', label: 'US East (Virginia)', jurisdiction: 'US' },
  { code: 'us-west', label: 'US West (Oregon)', jurisdiction: 'US' },
  { code: 'eu-west', label: 'EU West (Ireland)', jurisdiction: 'EU' },
  { code: 'eu-central', label: 'EU Central (Frankfurt)', jurisdiction: 'EU' },
  { code: 'ap-south', label: 'Asia Pacific (Mumbai)', jurisdiction: 'IN' },
  { code: 'ap-northeast', label: 'Asia Pacific (Tokyo)', jurisdiction: 'JP' },
];

const DEFAULT_RETENTION_POLICIES = [
  { data_type: 'user_account', retention_days: 365, legal_basis: 'contract' },
  { data_type: 'outreach_attempts', retention_days: 2555, legal_basis: 'legitimate_interest' },
  { data_type: 'documents', retention_days: 1825, legal_basis: 'consent' },
  { data_type: 'analytics_logs', retention_days: 90, legal_basis: 'legitimate_interest' },
  { data_type: 'audit_logs', retention_days: 2555, legal_basis: 'legal_obligation' },
  { data_type: 'api_keys', retention_days: 365, legal_basis: 'contract' },
];

export async function handleDataResidency(req: VercelRequest, res: VercelResponse) {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({ success: false, error: 'Server not configured' });
    }

    const { user, error } = await getUserFromRequest(req);
    if (error || !user) return res.status(401).json({ success: false, error });

    const pathArr = (req.query.path as string[]) || [];
    const action = pathArr[0];
    const id = pathArr[1];

    if (action === 'regions' && req.method === 'GET') {
      return handleRegions(req, res);
    }
    if (action === 'config' && req.method === 'GET') {
      return handleGetConfig(req, res);
    }
    if (action === 'config' && req.method === 'PUT') {
      return handleUpdateConfig(req, res, user.id);
    }
    if (action === 'export' && req.method === 'POST') {
      return handleExport(req, res, user.id);
    }
    if (action === 'delete' && req.method === 'POST') {
      return handleDelete(req, res, user.id);
    }
    if (action === 'requests' && id && req.method === 'GET') {
      return handleGetRequest(req, res, id);
    }
    if (action === 'retention' && req.method === 'GET') {
      return handleRetention(req, res);
    }

    return res.status(404).json({ success: false, error: 'Data residency route not found' });
  } catch (err) {
    return handleError(res, 'dataResidency', err);
  }
}

async function handleRegions(_req: VercelRequest, res: VercelResponse) {
  return res.json({ success: true, regions: AVAILABLE_REGIONS });
}

async function handleGetConfig(_req: VercelRequest, res: VercelResponse) {
  const config = await selectOne('data_residency_config', { column: 'id', value: 'default', select: '*' });
  return res.json({
    success: true,
    config: config || {
      primary_region: 'us-east',
      secondary_region: 'eu-west',
      data_residency_enabled: true,
      gdpr_compliant: true,
      ccpa_compliant: true,
      updated_at: new Date().toISOString(),
    },
  });
}

async function handleUpdateConfig(req: VercelRequest, res: VercelResponse, userId: string) {
  const body = req.body as any;
  const configData = {
    primary_region: body.primary_region || 'us-east',
    secondary_region: body.secondary_region || 'eu-west',
    data_residency_enabled: body.data_residency_enabled ?? true,
    gdpr_compliant: body.gdpr_compliant ?? true,
    ccpa_compliant: body.ccpa_compliant ?? true,
    updated_at: new Date().toISOString(),
    updated_by: userId,
  };

  const existing = await selectOne('data_residency_config', { column: 'id', value: 'default', select: 'id' });
  if (existing) {
    await update('data_residency_config', { column: 'id', value: 'default' }, configData);
  } else {
    await insert('data_residency_config', { id: 'default', ...configData });
  }

  return res.json({ success: true, config: configData });
}

async function handleExport(req: VercelRequest, res: VercelResponse, userId: string) {
  const body = req.body as any;
  const requestId = `dpa_${Date.now()}`;

  const exportRequest = await insert('data_subject_requests', {
    id: requestId,
    user_id: userId,
    type: 'export',
    status: 'pending',
    requested_data: body?.data_types || ['all'],
    format: body?.format || 'json',
    completed_at: null,
    created_at: new Date().toISOString(),
    due_at: new Date(Date.now() + 7 * 86400000).toISOString(),
  });

  return res.status(201).json({
    success: true,
    request: exportRequest,
    message: 'Data export request submitted. Will be ready within 7 days.',
  });
}

async function handleDelete(req: VercelRequest, res: VercelResponse, userId: string) {
  const body = req.body as any;
  const requestId = `dpa_${Date.now()}`;

  const deleteRequest = await insert('data_subject_requests', {
    id: requestId,
    user_id: userId,
    type: 'deletion',
    status: 'pending',
    requested_data: body?.data_types || ['all'],
    format: null,
    completed_at: null,
    created_at: new Date().toISOString(),
    due_at: new Date(Date.now() + 30 * 86400000).toISOString(),
  });

  return res.status(201).json({
    success: true,
    request: deleteRequest,
    message: 'Data deletion request submitted. Will be completed within 30 days.',
  });
}

async function handleGetRequest(_req: VercelRequest, res: VercelResponse, id: string) {
  const request = await selectOne('data_subject_requests', { column: 'id', value: id, select: '*' });
  if (!request) return res.status(404).json({ success: false, error: 'Request not found' });
  return res.json({ success: true, request });
}

async function handleRetention(_req: VercelRequest, res: VercelResponse) {
  const policies = await selectMany(
    'retention_policies',
    {},
    ['data_type'],
    100,
    0,
    'data_type,retention_days,legal_basis,auto_delete'
  );

  return res.json({
    success: true,
    policies: policies || DEFAULT_RETENTION_POLICIES,
  });
}