/**
 * Candidate Portal handler — Messaging & Documents
 * Issue #14: Candidate Portal v2.1
 *
 * Routes:
 *   GET    /api/candidate-portal/messages              — List message threads
 *   POST   /api/candidate-portal/messages              — Send message
 *   PATCH  /api/candidate-portal/messages/:id/read     — Mark as read
 *   GET    /api/candidate-portal/messages/unread-count — Unread count
 *   GET    /api/candidate-portal/documents             — List documents
 *   POST   /api/candidate-portal/documents             — Upload document
 *   DELETE /api/candidate-portal/documents/:id         — Delete document
 *   PATCH  /api/candidate-portal/documents/:id         — Update document
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { selectMany, selectOne, insert, update, deleteRows, handleError, isSupabaseConfigured } from './supabaseRest.js';
import { getUserFromRequest } from './adminAuth.js';

export const handler = handleCandidatePortal;

async function handleCandidatePortal(req: VercelRequest, res: VercelResponse) {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    const { user, error: authError } = await getUserFromRequest(req);
    if (authError || !user) {
      return res.status(401).json({ success: false, error: authError || 'Unauthorized' });
    }

    const path = (req.query as any).path || [];
    const resource = path[0];
    const id = path[1];
    const action = path[2];

    // Messages
    if (resource === 'messages' && !id && req.method === 'GET') return handleListMessages(req, res, user);
    if (resource === 'messages' && !id && req.method === 'POST') return handleSendMessage(req, res, user);
    if (resource === 'messages' && id === 'unread-count' && req.method === 'GET') return handleUnreadCount(req, res, user);
    if (resource === 'messages' && id && action === 'read' && req.method === 'PATCH') return handleMarkRead(req, res, id, user);

    // Documents
    if (resource === 'documents' && !id && req.method === 'GET') return handleListDocuments(req, res, user);
    if (resource === 'documents' && !id && req.method === 'POST') return handleUploadDocument(req, res, user);
    if (resource === 'documents' && id && !action && req.method === 'DELETE') return handleDeleteDocument(req, res, id, user);
    if (resource === 'documents' && id && !action && req.method === 'PATCH') return handleUpdateDocument(req, res, id, user);

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    return handleError(res, 'candidate-portal', err);
  }
}

// ── Messages ────────────────────────────────────────────────────────────

async function handleListMessages(req: VercelRequest, res: VercelResponse, user: any) {
  const { searchParams } = new URL(req.url || '', 'http://localhost');
  const limit = parseInt(searchParams.get('limit') || '50');

  const messages = await selectMany(
    'candidate_messages',
    {
      select: '*',
      where: [{ column: 'candidate_id', value: user.id }],
    },
    ['created_at DESC'],
    limit,
    0,
    '*',
  );

  // Group by thread
  const threads: Record<string, any[]> = {};
  for (const msg of messages || []) {
    if (!threads[msg.thread_id]) threads[msg.thread_id] = [];
    threads[msg.thread_id].push(msg);
  }

  const threadList = Object.entries(threads).map(([threadId, msgs]) => {
    const sorted = msgs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const lastMsg = sorted[sorted.length - 1];
    const unreadCount = sorted.filter(m => !m.is_read && m.sender_type !== 'candidate').length;
    return {
      thread_id: threadId,
      subject: lastMsg.subject || msgs[0].subject || 'Conversation',
      last_message: lastMsg.content,
      last_message_at: lastMsg.created_at,
      unread_count: unreadCount,
      messages: sorted,
    };
  });

  return res.status(200).json({ success: true, threads: threadList });
}

async function handleSendMessage(req: VercelRequest, res: VercelResponse, user: any) {
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  const { thread_id, consultant_id, subject, content, message_type } = body;

  if (!content) {
    return res.status(400).json({ success: false, error: 'Content required' });
  }

  const message = await insert('candidate_messages', {
    thread_id: thread_id || crypto.randomUUID(),
    candidate_id: user.id,
    consultant_id: consultant_id || null,
    sender_type: 'candidate',
    sender_id: user.id,
    subject: subject || null,
    content,
    message_type: message_type || 'general',
    is_read: false,
  });

  return res.status(201).json({ success: true, message });
}

async function handleUnreadCount(req: VercelRequest, res: VercelResponse, user: any) {
  const unread = await selectMany(
    'candidate_messages',
    {
      select: 'id',
      where: [
        { column: 'candidate_id', value: user.id },
        { column: 'is_read', value: false },
        { column: 'sender_type', value: 'consultant' },
      ],
    },
    [],
    1000,
    0,
    '*',
  );

  return res.status(200).json({ success: true, unread_count: unread?.length || 0 });
}

async function handleMarkRead(req: VercelRequest, res: VercelResponse, id: string, user: any) {
  const existing = await selectOne('candidate_messages', {
    select: 'id,candidate_id',
    column: 'id',
    value: id,
  });

  if (!existing || existing.candidate_id !== user.id) {
    return res.status(404).json({ success: false, error: 'Not found' });
  }

  await update('candidate_messages', id, {
    is_read: true,
    read_at: new Date().toISOString(),
  });

  return res.status(200).json({ success: true });
}

// ── Documents ───────────────────────────────────────────────────────────

async function handleListDocuments(req: VercelRequest, res: VercelResponse, user: any) {
  const { searchParams } = new URL(req.url || '', 'http://localhost');
  const docType = searchParams.get('type');

  const where: any[] = [{ column: 'candidate_id', value: user.id }];
  if (docType) where.push({ column: 'document_type', value: docType });

  const documents = await selectMany(
    'candidate_documents',
    { select: '*', where },
    ['created_at DESC'],
    100,
    0,
    '*',
  );

  return res.status(200).json({ success: true, documents: documents || [] });
}

async function handleUploadDocument(req: VercelRequest, res: VercelResponse, user: any) {
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  const { document_type, title, file_name, file_url, file_size, mime_type, tags, visibility } = body;

  if (!title || !file_name || !file_url) {
    return res.status(400).json({ success: false, error: 'title, file_name, and file_url required' });
  }

  const document = await insert('candidate_documents', {
    candidate_id: user.id,
    document_type: document_type || 'other',
    title,
    file_name,
    file_url,
    file_size: file_size || null,
    mime_type: mime_type || null,
    tags: tags || [],
    visibility: visibility || 'private',
  });

  return res.status(201).json({ success: true, document });
}

async function handleDeleteDocument(req: VercelRequest, res: VercelResponse, id: string, user: any) {
  const existing = await selectOne('candidate_documents', {
    select: 'id,candidate_id',
    column: 'id',
    value: id,
  });

  if (!existing || existing.candidate_id !== user.id) {
    return res.status(404).json({ success: false, error: 'Not found' });
  }

  await deleteRows('candidate_documents', id);

  return res.status(200).json({ success: true });
}

async function handleUpdateDocument(req: VercelRequest, res: VercelResponse, id: string, user: any) {
  const existing = await selectOne('candidate_documents', {
    select: 'id,candidate_id',
    column: 'id',
    value: id,
  });

  if (!existing || existing.candidate_id !== user.id) {
    return res.status(404).json({ success: false, error: 'Not found' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};

  const updated = await update('candidate_documents', id, {
    title: body.title !== undefined ? body.title : undefined,
    document_type: body.document_type !== undefined ? body.document_type : undefined,
    tags: body.tags !== undefined ? body.tags : undefined,
    visibility: body.visibility !== undefined ? body.visibility : undefined,
    expiry_date: body.expiry_date !== undefined ? body.expiry_date : undefined,
  });

  return res.status(200).json({ success: true, document: updated });
}