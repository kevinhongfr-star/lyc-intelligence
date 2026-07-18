/**
 * Client Portal v2 handler — mandate detail, shortlists, interviews, collaboration
 * Issue #13: Client Portal v2
 *
 * Routes:
 *   GET    /api/client-portal/mandates                    — List mandates (client-visible)
 *   GET    /api/client-portal/mandates/:id                — Mandate detail with timeline
 *   GET    /api/client-portal/mandates/:id/shortlist      — Shortlisted candidates
 *   POST   /api/client-portal/mandates/:id/feedback       — Submit candidate feedback
 *   GET    /api/client-portal/mandates/:id/interviews     — Upcoming interviews
 *   POST   /api/client-portal/mandates/:id/interviews     — Request interview
 *
 *   GET    /api/client-portal/notifications               — List client notifications
 *   GET    /api/client-portal/notifications/unread-count   — Unread count
 *   PATCH  /api/client-portal/notifications/:id/read       — Mark as read
 *   PATCH  /api/client-portal/notifications/read-all       — Mark all as read
 *
 *   GET    /api/client-portal/collaboration/:mandate_id    — Threaded collaboration messages
 *   POST   /api/client-portal/collaboration/:mandate_id    — Post message
 *
 *   GET    /api/client-portal/overview                     — Dashboard overview stats
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  selectOne,
  selectMany,
  insert,
  update,
  isSupabaseConfigured,
  handleError,
} from './supabaseRest.js';
import { getUserFromRequest } from './adminAuth.js';

export const maxDuration = 60;

export const handler = handleClientPortalV2;

async function handleClientPortalV2(req: VercelRequest, res: VercelResponse) {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    const { user, error: authError } = await getUserFromRequest(req);
    if (authError || !user) {
      return res.status(401).json({ success: false, error: authError || 'Unauthorized' });
    }

    // Resolve client account from user
    const clientAccount = await selectOne('client_accounts', {
      select: 'id,name,email,organization,role,is_active',
      column: 'auth_user_id',
      value: user.id,
    });

    // Admin bypass
    const isAdmin = user.role && ['super_admin', 'admin'].includes(user.role);
    if (!clientAccount && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Client account not found' });
    }

    const path = (req.query as any).path || [];
    const resource = path[0];
    const id = path[1];
    const subResource = path[2];
    const subId = path[3];

    // ── Overview ──
    if (resource === 'overview' && req.method === 'GET') {
      return handleOverview(req, res, clientAccount, isAdmin);
    }

    // ── Mandates ──
    if (resource === 'mandates') {
      if (!id && req.method === 'GET') return handleListMandates(req, res, clientAccount, isAdmin);
      if (id && !subResource && req.method === 'GET') return handleMandateDetail(req, res, id, clientAccount, isAdmin);
      if (id && subResource === 'shortlist' && req.method === 'GET') return handleShortlist(req, res, id, clientAccount, isAdmin);
      if (id && subResource === 'feedback' && req.method === 'POST') return handleSubmitFeedback(req, res, id, clientAccount, isAdmin);
      if (id && subResource === 'interviews' && !subId && req.method === 'GET') return handleListInterviews(req, res, id, clientAccount, isAdmin);
      if (id && subResource === 'interviews' && !subId && req.method === 'POST') return handleRequestInterview(req, res, id, clientAccount, isAdmin);
      return res.status(404).json({ success: false, error: 'Unknown mandate route' });
    }

    // ── Notifications ──
    if (resource === 'notifications') {
      if (!id && req.method === 'GET') return handleListNotifications(req, res, clientAccount, isAdmin);
      if (id === 'unread-count' && req.method === 'GET') return handleUnreadCount(req, res, clientAccount, isAdmin);
      if (id === 'read-all' && req.method === 'PATCH') return handleMarkAllRead(req, res, clientAccount, isAdmin);
      if (id && subResource === 'read' && req.method === 'PATCH') return handleMarkNotificationRead(req, res, id, clientAccount, isAdmin);
      return res.status(404).json({ success: false, error: 'Unknown notification route' });
    }

    // ── Collaboration ──
    if (resource === 'collaboration') {
      const mandateId = id;
      if (mandateId && !subResource && req.method === 'GET') return handleListCollaboration(req, res, mandateId, clientAccount, isAdmin);
      if (mandateId && !subResource && req.method === 'POST') return handlePostCollaboration(req, res, mandateId, clientAccount, user, isAdmin);
      return res.status(404).json({ success: false, error: 'Unknown collaboration route' });
    }

    return res.status(404).json({ success: false, error: 'Unknown client-portal route' });
  } catch (err) {
    return handleError(res, 'client-portal-v2', err);
  }
}

// ── Helpers ────────────────────────────────────────────────────────────

function parseBody(req: VercelRequest): any {
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return req.body || {};
}

function getClientAccountId(clientAccount: any, isAdmin: boolean): string | null {
  if (clientAccount) return clientAccount.id;
  if (isAdmin) return null; // Admin mode — caller must specify
  return null;
}

// ── Overview ───────────────────────────────────────────────────────────

async function handleOverview(
  req: VercelRequest,
  res: VercelResponse,
  clientAccount: any,
  isAdmin: boolean,
) {
  const clientAccountId = getClientAccountId(clientAccount, isAdmin);

  // Get accessible mandates
  const mandateIds: string[] = [];
  if (clientAccountId) {
    const access = await selectMany(
      'client_mandate_access',
      { select: 'mandate_id', where: [{ column: 'client_account_id', value: clientAccountId }] },
      [],
      200,
      0,
      '*',
    );
    mandateIds.push(...(access || []).map((a: any) => a.mandate_id));
  }

  let mandates: any[] = [];
  if (mandateIds.length > 0 || isAdmin) {
    const where = isAdmin && mandateIds.length === 0
      ? undefined
      : [{ column: 'id', value: `(${mandateIds.join(',')})`, op: 'in' }];
    mandates = await selectMany(
      'mandates',
      {
        select: 'id,title,status,client_visible,client_summary,created_at,updated_at,target_close_date',
        where,
      },
      ['updated_at DESC'],
      100,
      0,
      '*',
    );
  }

  const activeMandates = (mandates || []).filter((m: any) => m.status === 'active').length;
  const totalCandidates = mandates.length * 3; // Estimate — real count would need joins

  // Get unread notification count
  let unreadCount = 0;
  if (clientAccountId) {
    const notifications = await selectMany(
      'client_notifications',
      {
        select: 'id',
        where: [
          { column: 'client_account_id', value: clientAccountId },
          { column: 'read', value: false },
        ],
      },
      [],
      100,
      0,
      '*',
    );
    unreadCount = notifications?.length || 0;
  }

  // Get recent activity (from feedback and notifications)
  const recentActivity: any[] = [];
  if (clientAccountId) {
    const recentNotifications = await selectMany(
      'client_notifications',
      { select: '*', where: [{ column: 'client_account_id', value: clientAccountId }] },
      ['created_at DESC'],
      10,
      0,
      '*',
    );
    recentActivity.push(...(recentNotifications || []).map((n: any) => ({
      id: n.id,
      type: 'notification',
      title: n.title,
      message: n.message,
      created_at: n.created_at,
    })));
  }

  return res.status(200).json({
    success: true,
    data: {
      total_mandates: mandates.length,
      active_mandates: activeMandates,
      total_candidates_estimate: totalCandidates,
      unread_notifications: unreadCount,
      recent_activity: recentActivity,
    },
  });
}

// ── Mandates ───────────────────────────────────────────────────────────

async function handleListMandates(
  req: VercelRequest,
  res: VercelResponse,
  clientAccount: any,
  isAdmin: boolean,
) {
  const { searchParams } = new URL(req.url || '', 'http://localhost');
  const status = searchParams.get('status') || '';
  const search = searchParams.get('search') || '';

  const clientAccountId = getClientAccountId(clientAccount, isAdmin);

  const mandateIds: string[] = [];
  if (clientAccountId) {
    const access = await selectMany(
      'client_mandate_access',
      { select: 'mandate_id', where: [{ column: 'client_account_id', value: clientAccountId }] },
      [],
      200,
      0,
      '*',
    );
    mandateIds.push(...(access || []).map((a: any) => a.mandate_id));
  }

  if (!isAdmin && mandateIds.length === 0) {
    return res.status(200).json({ success: true, data: [], total: 0 });
  }

  const where: any[] = [];
  if (!isAdmin || mandateIds.length > 0) {
    where.push({ column: 'id', value: `(${mandateIds.join(',')})`, op: 'in' });
  }
  where.push({ column: 'client_visible', value: true });
  if (status) where.push({ column: 'status', value: status });

  const mandates = await selectMany(
    'mandates',
    {
      select: 'id,title,status,client_summary,department,seniority_level,location,created_at,updated_at,target_close_date',
      where,
    },
    ['updated_at DESC'],
    100,
    0,
    '*',
  );

  // Filter by search in-memory
  let filtered = mandates || [];
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter((m: any) =>
      m.title?.toLowerCase().includes(q) || m.client_summary?.toLowerCase().includes(q),
    );
  }

  // Add candidate count per mandate (from client_presented flag)
  const mandateIdsList = filtered.map((m: any) => m.id);
  let candidateCounts: Record<string, number> = {};
  if (mandateIdsList.length > 0) {
    const links = await selectMany(
      'candidate_mandate_links',
      {
        select: 'mandate_id,status',
        where: [{ column: 'mandate_id', value: `(${mandateIdsList.join(',')})`, op: 'in' }],
      },
      [],
      10000,
      0,
      '*',
    );
    for (const l of links || []) {
      candidateCounts[l.mandate_id] = (candidateCounts[l.mandate_id] || 0) + 1;
    }
  }

  const data = filtered.map((m: any) => ({
    ...m,
    candidate_count: candidateCounts[m.id] || 0,
  }));

  return res.status(200).json({ success: true, data, total: data.length });
}

async function handleMandateDetail(
  req: VercelRequest,
  res: VercelResponse,
  mandateId: string,
  clientAccount: any,
  isAdmin: boolean,
) {
  const mandate = await selectOne('mandates', {
    select: '*',
    column: 'id',
    value: mandateId,
  });

  if (!mandate) {
    return res.status(404).json({ success: false, error: 'Mandate not found' });
  }

  // Check access
  if (!isAdmin && clientAccount) {
    const hasAccess = await selectOne('client_mandate_access', {
      select: 'id',
      where: [
        { column: 'client_account_id', value: clientAccount.id },
        { column: 'mandate_id', value: mandateId },
      ],
    });
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
  }

  if (!isAdmin && !mandate.client_visible) {
    return res.status(403).json({ success: false, error: 'Mandate not visible' });
  }

  // Get candidate count
  const candidates = await selectMany(
    'candidate_mandate_links',
    {
      select: 'id,status,stage',
      where: [{ column: 'mandate_id', value: mandateId }],
    },
    [],
    1000,
    0,
    '*',
  );

  // Build timeline from transitions + updates
  const timeline: any[] = [];

  // Mandate creation
  timeline.push({
    id: `created-${mandate.id}`,
    type: 'mandate_created',
    title: 'Mandate Started',
    description: 'Engagement initiated',
    timestamp: mandate.created_at,
    actor: 'system',
  });

  // Pipeline stage counts
  const stageCounts: Record<string, number> = {};
  const candidatesList = candidates || [];
  for (const c of candidatesList) {
    stageCounts[c.stage || c.status || 'unknown'] = (stageCounts[c.stage || c.status || 'unknown'] || 0) + 1;
  }

  // Add key milestones
  if (mandate.target_close_date) {
    timeline.push({
      id: 'target-close',
      type: 'milestone',
      title: 'Target Close Date',
      description: new Date(mandate.target_close_date).toLocaleDateString(),
      timestamp: mandate.target_close_date,
      actor: 'system',
    });
  }

  if (mandate.updated_at && mandate.updated_at !== mandate.created_at) {
    timeline.push({
      id: 'last-update',
      type: 'update',
      title: 'Last Update',
      description: 'Mandate information updated',
      timestamp: mandate.updated_at,
      actor: 'consultant',
    });
  }

  // Sort timeline chronologically (newest first)
  timeline.sort((a: any, b: any) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return res.status(200).json({
    success: true,
    data: {
      ...mandate,
      candidate_count: candidatesList.length,
      stage_distribution: stageCounts,
      timeline,
    },
  });
}

async function handleShortlist(
  req: VercelRequest,
  res: VercelResponse,
  mandateId: string,
  clientAccount: any,
  isAdmin: boolean,
) {
  // Check access
  if (!isAdmin && clientAccount) {
    const hasAccess = await selectOne('client_mandate_access', {
      select: 'id',
      where: [
        { column: 'client_account_id', value: clientAccount.id },
        { column: 'mandate_id', value: mandateId },
      ],
    });
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
  }

  // Get candidates linked to this mandate with 'shortlist' or similar status
  const links = await selectMany(
    'candidate_mandate_links',
    {
      select: 'contact_id,status,stage,notes,market_position,priority,created_at,updated_at',
      where: [{ column: 'mandate_id', value: mandateId }],
    },
    ['created_at DESC'],
    200,
    0,
    '*',
  );

  const contactIds = (links || []).map((l: any) => l.contact_id).filter(Boolean);
  let contacts: any[] = [];
  if (contactIds.length > 0) {
    contacts = await selectMany(
      'contacts',
      {
        select: 'id,name,current_title,company_id,city,country,linkedin_url,summary,client_presented,client_presented_at',
        where: [{ column: 'id', value: `(${contactIds.join(',')})`, op: 'in' }],
      },
      [],
      500,
      0,
      '*',
    );
  }

  const contactMap = new Map(contacts.map((c: any) => [c.id, c]));

  // Get existing feedback from this client
  let feedbackMap: Record<string, any> = {};
  if (clientAccount) {
    const feedback = await selectMany(
      'client_feedback',
      {
        select: 'contact_id,feedback_type,reason,additional_info,status,created_at',
        where: [
          { column: 'client_account_id', value: clientAccount.id },
          { column: 'mandate_id', value: mandateId },
        ],
      },
      [],
      200,
      0,
      '*',
    );
    for (const f of feedback || []) {
      feedbackMap[f.contact_id] = f;
    }
  }

  const shortlist = (links || []).map((l: any) => ({
    ...l,
    candidate: contactMap.get(l.contact_id) || null,
    feedback: feedbackMap[l.contact_id] || null,
  }));

  return res.status(200).json({ success: true, data: shortlist, total: shortlist.length });
}

async function handleSubmitFeedback(
  req: VercelRequest,
  res: VercelResponse,
  mandateId: string,
  clientAccount: any,
  isAdmin: boolean,
) {
  if (!clientAccount) {
    return res.status(403).json({ success: false, error: 'Client account required' });
  }

  const body = parseBody(req);
  const { contact_id, feedback_type, reason, additional_info } = body;

  if (!contact_id || !feedback_type) {
    return res.status(400).json({ success: false, error: 'contact_id and feedback_type required' });
  }

  const validTypes = ['interested', 'not_interested', 'need_more_info', 'hold'];
  if (!validTypes.includes(feedback_type)) {
    return res.status(400).json({ success: false, error: 'Invalid feedback_type' });
  }

  // Check access to mandate
  const hasAccess = await selectOne('client_mandate_access', {
    select: 'id',
    where: [
      { column: 'client_account_id', value: clientAccount.id },
      { column: 'mandate_id', value: mandateId },
    ],
  });
  if (!hasAccess) {
    return res.status(403).json({ success: false, error: 'Access denied' });
  }

  // Check for existing feedback and update, or create new
  const existing = await selectOne('client_feedback', {
    select: 'id',
    where: [
      { column: 'client_account_id', value: clientAccount.id },
      { column: 'mandate_id', value: mandateId },
      { column: 'contact_id', value: contact_id },
    ],
  });

  let feedback;
  if (existing) {
    feedback = await update('client_feedback', existing.id, {
      feedback_type,
      reason: reason || null,
      additional_info: additional_info || null,
      status: 'new',
    });
  } else {
    feedback = await insert('client_feedback', {
      client_account_id: clientAccount.id,
      mandate_id: mandateId,
      contact_id,
      feedback_type,
      reason: reason || null,
      additional_info: additional_info || null,
      status: 'new',
    });
  }

  return res.status(existing ? 200 : 201).json({ success: true, data: feedback });
}

// ── Interviews ────────────────────────────────────────────────────────

async function handleListInterviews(
  req: VercelRequest,
  res: VercelResponse,
  mandateId: string,
  clientAccount: any,
  isAdmin: boolean,
) {
  // Check access
  if (!isAdmin && clientAccount) {
    const hasAccess = await selectOne('client_mandate_access', {
      select: 'id',
      where: [
        { column: 'client_account_id', value: clientAccount.id },
        { column: 'mandate_id', value: mandateId },
      ],
    });
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
  }

  // Use interviews table if it exists
  let interviews: any[] = [];
  try {
    interviews = await selectMany(
      'interviews',
      {
        select: 'id,mandate_id,contact_id,interview_type,status,scheduled_at,location,interviewer,notes,created_at',
        where: [{ column: 'mandate_id', value: mandateId }],
      },
      ['scheduled_at ASC'],
      100,
      0,
      '*',
    );
  } catch {
    // Table may not exist — return empty
  }

  // Hydrate candidate names
  const contactIds = (interviews || []).map((i: any) => i.contact_id).filter(Boolean);
  if (contactIds.length > 0) {
    const contacts = await selectMany(
      'contacts',
      {
        select: 'id,name,current_title',
        where: [{ column: 'id', value: `(${contactIds.join(',')})`, op: 'in' }],
      },
      [],
      500,
      0,
      '*',
    );
    const contactMap = new Map((contacts || []).map((c: any) => [c.id, c]));
    interviews = (interviews || []).map((i: any) => ({
      ...i,
      candidate: contactMap.get(i.contact_id) || null,
    }));
  }

  return res.status(200).json({ success: true, data: interviews || [], total: (interviews || []).length });
}

async function handleRequestInterview(
  req: VercelRequest,
  res: VercelResponse,
  mandateId: string,
  clientAccount: any,
  isAdmin: boolean,
) {
  if (!clientAccount) {
    return res.status(403).json({ success: false, error: 'Client account required' });
  }

  const body = parseBody(req);
  const { contact_id, interview_type, preferred_date, preferred_time, notes } = body;

  if (!contact_id) {
    return res.status(400).json({ success: false, error: 'contact_id required' });
  }

  // Check access
  const hasAccess = await selectOne('client_mandate_access', {
    select: 'id',
    where: [
      { column: 'client_account_id', value: clientAccount.id },
      { column: 'mandate_id', value: mandateId },
    ],
  });
  if (!hasAccess) {
    return res.status(403).json({ success: false, error: 'Access denied' });
  }

  // Create interview request notification
  const notification = await insert('client_notifications', {
    client_account_id: clientAccount.id,
    mandate_id: mandateId,
    contact_id,
    type: 'interview_scheduled',
    title: 'Interview Request Submitted',
    message: `Interview request for ${interview_type || 'interview'} on ${preferred_date || 'TBD'}. Our team will confirm shortly.`,
    read: false,
    metadata: {
      interview_type,
      preferred_date,
      preferred_time,
      notes,
      requested_by: clientAccount.id,
    },
  });

  return res.status(201).json({
    success: true,
    message: 'Interview request submitted. Our team will confirm shortly.',
    data: notification,
  });
}

// ── Notifications ─────────────────────────────────────────────────────

async function handleListNotifications(
  req: VercelRequest,
  res: VercelResponse,
  clientAccount: any,
  isAdmin: boolean,
) {
  if (!clientAccount) {
    return res.status(200).json({ success: true, data: [], total: 0 });
  }

  const { searchParams } = new URL(req.url || '', 'http://localhost');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
  const offset = parseInt(searchParams.get('offset') || '0');

  const notifications = await selectMany(
    'client_notifications',
    {
      select: '*',
      where: [{ column: 'client_account_id', value: clientAccount.id }],
    },
    ['created_at DESC'],
    limit,
    offset,
    '*',
  );

  return res.status(200).json({
    success: true,
    data: notifications || [],
    total: (notifications || []).length,
  });
}

async function handleUnreadCount(
  req: VercelRequest,
  res: VercelResponse,
  clientAccount: any,
  isAdmin: boolean,
) {
  if (!clientAccount) {
    return res.status(200).json({ success: true, unread_count: 0 });
  }

  const notifications = await selectMany(
    'client_notifications',
    {
      select: 'id',
      where: [
        { column: 'client_account_id', value: clientAccount.id },
        { column: 'read', value: false },
      ],
    },
    [],
    100,
    0,
    '*',
  );

  return res.status(200).json({ success: true, unread_count: notifications?.length || 0 });
}

async function handleMarkNotificationRead(
  req: VercelRequest,
  res: VercelResponse,
  notificationId: string,
  clientAccount: any,
  isAdmin: boolean,
) {
  if (!clientAccount) {
    return res.status(403).json({ success: false, error: 'Client account required' });
  }

  const existing = await selectOne('client_notifications', {
    select: 'id,client_account_id',
    column: 'id',
    value: notificationId,
  });

  if (!existing || existing.client_account_id !== clientAccount.id) {
    return res.status(404).json({ success: false, error: 'Notification not found' });
  }

  await update('client_notifications', notificationId, { read: true });
  return res.status(200).json({ success: true });
}

async function handleMarkAllRead(
  req: VercelRequest,
  res: VercelResponse,
  clientAccount: any,
  isAdmin: boolean,
) {
  if (!clientAccount) {
    return res.status(200).json({ success: true, count: 0 });
  }

  const notifications = await selectMany(
    'client_notifications',
    {
      select: 'id',
      where: [
        { column: 'client_account_id', value: clientAccount.id },
        { column: 'read', value: false },
      ],
    },
    [],
    200,
    0,
    '*',
  );

  // Update each (bulk would be better but Supabase REST requires individual updates)
  let count = 0;
  for (const n of notifications || []) {
    try {
      await update('client_notifications', n.id, { read: true });
      count++;
    } catch {
      // continue
    }
  }

  return res.status(200).json({ success: true, count });
}

// ── Collaboration ─────────────────────────────────────────────────────

async function handleListCollaboration(
  req: VercelRequest,
  res: VercelResponse,
  mandateId: string,
  clientAccount: any,
  isAdmin: boolean,
) {
  if (!clientAccount && !isAdmin) {
    return res.status(403).json({ success: false, error: 'Access denied' });
  }

  // Check access
  if (!isAdmin && clientAccount) {
    const hasAccess = await selectOne('client_mandate_access', {
      select: 'id',
      where: [
        { column: 'client_account_id', value: clientAccount.id },
        { column: 'mandate_id', value: mandateId },
      ],
    });
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
  }

  // Use client_notifications as a simple message store, or look for a dedicated table
  // For now, use feedback + notifications as a basic collaboration thread
  const messages: any[] = [];

  if (clientAccount) {
    const feedback = await selectMany(
      'client_feedback',
      {
        select: 'id,contact_id,feedback_type,reason,additional_info,status,consultant_note,created_at,processed_at',
        where: [
          { column: 'client_account_id', value: clientAccount.id },
          { column: 'mandate_id', value: mandateId },
        ],
      },
      ['created_at DESC'],
      50,
      0,
      '*',
    );

    for (const f of feedback || []) {
      messages.push({
        id: `fb-${f.id}`,
        type: 'feedback',
        direction: 'client_to_consultant',
        subject: `Candidate feedback: ${f.feedback_type}`,
        body: f.additional_info || f.reason || `${f.feedback_type} feedback`,
        timestamp: f.created_at,
        status: f.status,
        contact_id: f.contact_id,
        reply: f.consultant_note,
        replied_at: f.processed_at,
      });
    }
  }

  // Sort by timestamp
  messages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return res.status(200).json({ success: true, data: messages, total: messages.length });
}

async function handlePostCollaboration(
  req: VercelRequest,
  res: VercelResponse,
  mandateId: string,
  clientAccount: any,
  user: any,
  isAdmin: boolean,
) {
  if (!clientAccount) {
    return res.status(403).json({ success: false, error: 'Client account required' });
  }

  const body = parseBody(req);
  const { subject, message, contact_id } = body;

  if (!message) {
    return res.status(400).json({ success: false, error: 'message required' });
  }

  // Check access
  const hasAccess = await selectOne('client_mandate_access', {
    select: 'id',
    where: [
      { column: 'client_account_id', value: clientAccount.id },
      { column: 'mandate_id', value: mandateId },
    ],
  });
  if (!hasAccess) {
    return res.status(403).json({ success: false, error: 'Access denied' });
  }

  // Create as a client notification to consultant (stored as notification for simplicity)
  const notification = await insert('client_notifications', {
    client_account_id: clientAccount.id,
    mandate_id: mandateId,
    contact_id: contact_id || null,
    type: 'status_change',
    title: subject || 'New Message',
    message,
    read: false,
    metadata: {
      direction: 'client_to_consultant',
      from_name: clientAccount.name,
      from_email: clientAccount.email,
    },
  });

  return res.status(201).json({ success: true, data: notification });
}
