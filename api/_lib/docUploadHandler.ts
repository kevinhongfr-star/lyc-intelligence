/**
 * docUploadHandler.ts — Document upload, parsing, and extraction
 *
 * Endpoints:
 *   POST /api/documents/upload        — Upload + parse document
 *   GET  /api/documents/:id          — Get document metadata
 *   GET  /api/documents/:id/preview  — Get document preview content
 *   DELETE /api/documents/:id        — Delete document
 *   GET  /api/documents              — List user's documents
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  selectMany,
  selectOne,
  insert,
  update,
  remove,
  isSupabaseConfigured,
  handleError,
} from './supabaseRest.js';
import { getUserFromRequest } from './adminAuth.js';

export const maxDuration = 60;

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv',
];

interface ParsedDocument {
  id: string;
  user_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  parsed_content: string | null;
  extracted_text: string | null;
  metadata: Record<string, unknown>;
  status: 'uploaded' | 'parsed' | 'error';
  created_at: string;
  updated_at: string;
}

function generateId(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function validateFileType(fileType: string): boolean {
  return ALLOWED_TYPES.includes(fileType);
}

function extractTextFromBuffer(buffer: ArrayBuffer, fileType: string): string {
  if (fileType === 'text/plain' || fileType === 'text/csv') {
    return Buffer.from(buffer).toString('utf-8');
  }
  if (fileType === 'application/pdf') {
    try {
      return Buffer.from(buffer).toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ').slice(0, 50000);
    } catch {
      return '';
    }
  }
  return '';
}

export async function handleDocUpload(req: VercelRequest, res: VercelResponse) {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({ success: false, error: 'Server not configured' });
    }

    const { user, error } = await getUserFromRequest(req);
    if (error || !user) return res.status(401).json({ success: false, error });

    const pathArr = (req.query.path as string[]) || [];
    const action = pathArr[0];
    const id = pathArr[1];
    const subAction = pathArr[2];

    if (action === 'upload' && req.method === 'POST') {
      return handleUpload(req, res, user.id);
    }
    if (req.method === 'GET' && (!action || action === 'documents') && !id) {
      return handleList(req, res, user.id);
    }
    if (req.method === 'GET' && action === 'documents' && id && subAction === 'preview') {
      return handlePreview(req, res, id);
    }
    if (req.method === 'GET' && action === 'documents' && id) {
      return handleGet(req, res, id);
    }
    if (req.method === 'DELETE' && action === 'documents' && id) {
      return handleDelete(req, res, id, user.id);
    }

    return res.status(404).json({ success: false, error: 'Document route not found' });
  } catch (err) {
    return handleError(res, 'docUpload', err);
  }
}

async function handleUpload(req: VercelRequest, res: VercelResponse, userId: string) {
  const body = req.body as any;
  if (!body?.fileName || !body?.fileType) {
    return res.status(400).json({ success: false, error: 'fileName and fileType required' });
  }

  if (!validateFileType(body.fileType)) {
    return res.status(400).json({ success: false, error: `File type not allowed: ${body.fileType}` });
  }

  const fileSize = body.fileSize || 0;
  if (fileSize > MAX_FILE_SIZE) {
    return res.status(400).json({ success: false, error: 'File exceeds 25MB limit' });
  }

  const docId = generateId();
  const buffer = body.fileBase64
    ? Buffer.from(body.fileBase64, 'base64')
    : new ArrayBuffer(0);

  const extractedText = buffer.byteLength > 0
    ? extractTextFromBuffer(buffer, body.fileType)
    : '';

  const doc = await insert('documents', {
    id: docId,
    user_id: userId,
    filename: body.fileName,
    file_type: body.fileType,
    file_size: fileSize,
    parsed_content: extractedText,
    extracted_text: extractedText,
    metadata: body.metadata || {},
    status: 'parsed',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  return res.json({
    success: true,
    document: doc,
    extracted_length: extractedText.length,
  });
}

async function handleList(req: VercelRequest, res: VercelResponse, userId: string) {
  const docs = await selectMany(
    'documents',
    { user_id: userId },
    ['created_at DESC'],
    50,
    0,
    'id,filename,file_type,file_size,status,created_at'
  );
  return res.json({ success: true, documents: docs });
}

async function handleGet(_req: VercelRequest, res: VercelResponse, id: string) {
  const doc = await selectOne('documents', { column: 'id', value: id, select: '*' });
  if (!doc) return res.status(404).json({ success: false, error: 'Document not found' });
  return res.json({ success: true, document: doc });
}

async function handlePreview(_req: VercelRequest, res: VercelResponse, id: string) {
  const doc = await selectOne('documents', { column: 'id', value: id, select: 'id,parsed_content,extracted_text,metadata' });
  if (!doc) return res.status(404).json({ success: false, error: 'Document not found' });
  return res.json({
    success: true,
    preview: {
      content: doc.extracted_text || doc.parsed_content || '',
      metadata: doc.metadata || {},
    },
  });
}

async function handleDelete(_req: VercelRequest, res: VercelResponse, id: string, userId: string) {
  const doc = await selectOne('documents', { column: 'id', value: id, select: 'id,user_id' });
  if (!doc) return res.status(404).json({ success: false, error: 'Document not found' });
  if (doc.user_id !== userId) return res.status(403).json({ success: false, error: 'Forbidden' });

  await remove('documents', { column: 'id', value: id });
  return res.json({ success: true, id, deleted: true });
}