/**
 * incidentHandler.ts — Incident management and status pages
 *
 * Endpoints:
 *   GET  /api/incidents              — List incidents
 *   POST /api/incidents              — Create incident
 *   GET  /api/incidents/:id          — Get incident details
 *   PUT  /api/incidents/:id          — Update incident
 *   GET  /api/status                 — Public status page
 *   GET  /api/incidents/:id/updates  — Get incident updates
 *   POST /api/incidents/:id/updates  — Add incident update
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

export const maxDuration = 10;

type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';
type IncidentStatus = 'investigating' | 'identified' | 'monitoring' | 'resolved' | 'postmortem';

interface Incident {
  id: string;
  user_id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  affected_systems: string[];
  impact: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

function generateId(): string {
  return `inc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function handleIncident(req: VercelRequest, res: VercelResponse) {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({ success: false, error: 'Server not configured' });
    }

    const isPublic = req.query.path && req.query.path[0] === 'status';

    if (isPublic) {
      return handleStatusPage(req, res);
    }

    const { user, error } = await getUserFromRequest(req);
    if (error || !user) return res.status(401).json({ success: false, error });

    const pathArr = (req.query.path as string[]) || [];
    const action = pathArr[0];
    const id = pathArr[1];

    if (req.method === 'GET' && !id) {
      return handleList(req, res);
    }
    if (req.method === 'POST' && !id) {
      return handleCreate(req, res, user.id);
    }
    if (req.method === 'GET' && id && action === 'incidents') {
      const subAction = pathArr[2];
      if (subAction === 'updates') return handleGetUpdates(req, res, id);
      return handleGet(req, res, id);
    }
    if (req.method === 'PUT' && id) {
      return handleUpdate(req, res, id, user.id);
    }
    if (req.method === 'POST' && id && pathArr[2] === 'updates') {
      return handleAddUpdate(req, res, id, user.id);
    }

    return res.status(404).json({ success: false, error: 'Incident route not found' });
  } catch (err) {
    return handleError(res, 'incident', err);
  }
}

async function handleStatusPage(_req: VercelRequest, res: VercelResponse) {
  const activeIncidents = await selectMany(
    'incidents',
    { status: 'investigating' },
    ['created_at DESC'],
    10,
    0,
    'id,title,severity,status,affected_systems,impact,created_at'
  );

  const systems = await selectMany(
    'system_components',
    {},
    ['name'],
    100,
    0,
    'id,name,status,description'
  );

  return res.json({
    success: true,
    status: {
      overall: activeIncidents?.length > 0 ? 'degraded' : 'operational',
      last_updated: new Date().toISOString(),
      incidents: activeIncidents || [],
      systems: systems || [
        { name: 'API', status: 'operational', description: 'All endpoints responding' },
        { name: 'Dashboard', status: 'operational', description: 'All dashboards accessible' },
        { name: 'Payments', status: 'operational', description: 'Payment processing normal' },
        { name: 'Calendar', status: 'maintenance', description: 'Scheduled maintenance window' },
      ],
    },
  });
}

async function handleList(_req: VercelRequest, res: VercelResponse) {
  const incidents = await selectMany(
    'incidents',
    {},
    ['created_at DESC'],
    50,
    0,
    'id,title,severity,status,affected_systems,impact,created_at,resolved_at'
  );
  return res.json({ success: true, incidents: incidents || [] });
}

async function handleCreate(req: VercelRequest, res: VercelResponse, userId: string) {
  const body = req.body as any;
  if (!body?.title || !body?.severity) {
    return res.status(400).json({ success: false, error: 'title and severity required' });
  }

  const incidentId = generateId();
  const incident = await insert('incidents', {
    id: incidentId,
    user_id: userId,
    title: body.title,
    description: body.description || '',
    severity: body.severity,
    status: 'investigating',
    affected_systems: body.affected_systems || [],
    impact: body.impact || 'limited',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    resolved_at: null,
  });

  return res.status(201).json({ success: true, incident });
}

async function handleGet(_req: VercelRequest, res: VercelResponse, id: string) {
  const incident = await selectOne('incidents', { column: 'id', value: id, select: '*' });
  if (!incident) return res.status(404).json({ success: false, error: 'Incident not found' });
  return res.json({ success: true, incident });
}

async function handleUpdate(req: VercelRequest, res: VercelResponse, id: string, userId: string) {
  const existing = await selectOne('incidents', { column: 'id', value: id, select: 'id,user_id' });
  if (!existing) return res.status(404).json({ success: false, error: 'Incident not found' });

  const body = req.body as any;
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.status) updateData.status = body.status;
  if (body.title) updateData.title = body.title;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.severity) updateData.severity = body.severity;
  if (body.impact) updateData.impact = body.impact;

  if (body.status === 'resolved') {
    updateData.resolved_at = new Date().toISOString();
  }

  const updated = await update('incidents', { column: 'id', value: id }, updateData);
  return res.json({ success: true, incident: updated });
}

async function handleGetUpdates(_req: VercelRequest, res: VercelResponse, id: string) {
  const updates = await selectMany(
    'incident_updates',
    { incident_id: id },
    ['created_at DESC'],
    50,
    0,
    'id,message,status,created_at'
  );
  return res.json({ success: true, updates: updates || [] });
}

async function handleAddUpdate(req: VercelRequest, res: VercelResponse, id: string, userId: string) {
  const body = req.body as any;
  if (!body?.message) {
    return res.status(400).json({ success: false, error: 'message required' });
  }

  const updateId = `upd_${Date.now()}`;
  const update = await insert('incident_updates', {
    id: updateId,
    incident_id: id,
    user_id: userId,
    message: body.message,
    status: body.status || 'update',
    created_at: new Date().toISOString(),
  });

  return res.status(201).json({ success: true, update });
}