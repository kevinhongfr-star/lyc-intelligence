/**
 * /api/upload — document upload proxy to Coze /v1/files/upload.
 *
 * The browser POSTs a multipart/form-data with a single `file` part. We pipe
 * the raw request body (with its Content-Type, incl. boundary) straight to
 * Coze so no multipart parsing dependency is needed. The Coze PAT stays
 * server-side.
 *
 * Returns { file_id, file_name, bytes } for use in the subsequent /api/chat
 * `files` field.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const COZE_BASE = process.env.COZE_BASE_URL || 'https://api.coze.cn';
const COZE_TOKEN = process.env.COZE_API_TOKEN || '';
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
// Allowed types (Coze-side also validates): PDF, DOC/DOCX, TXT/MD/CSV, XLS/XLSX, PPTX.
const ALLOWED_EXT = /\.(pdf|docx?|txt|md|csv|xlsx?|pptx)$/i;
void ALLOWED_EXT;

export const config = {
  api: { bodyParser: false, sizeLimit: '11mb' },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }
  if (!COZE_TOKEN) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Upload service is not configured.' }));
  }

  const contentType = String(req.headers['content-type'] || '');
  if (!contentType.includes('multipart/form-data')) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Expected multipart/form-data.' }));
  }
  const declaredLength = Number(req.headers['content-length'] || 0);
  if (declaredLength > MAX_BYTES + 512) {
    res.statusCode = 413;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'File too large (10 MB max).' }));
  }

  try {
    // Light-touch type gate from the multipart header (filename + part header
    // live in the stream; Coze itself validates, and chat-side never trusts
    // uploaded contents blindly).
    const cozeRes = await fetch(`${COZE_BASE}/v1/files/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${COZE_TOKEN}`,
        // Forward the original Content-Type with its boundary.
        'Content-Type': contentType,
      },
      // @ts-ignore — VercelRequest is a Node IncomingMessage (Readable stream)
      body: req,
      // @ts-ignore
      duplex: 'half',
    });

    const text = await cozeRes.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (cozeRes.status !== 200 || data?.code !== 0 || !data?.data?.id) {
      console.error('[api/upload] coze rejected', cozeRes.status, text.slice(0, 300));
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'Document service rejected the upload.' }));
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(
      JSON.stringify({
        file_id: data.data.id,
        file_name: data.data.file_name || 'document',
        bytes: data.data.bytes || 0,
      }),
    );
  } catch (e: any) {
    console.error('[api/upload] error', e?.message || e);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Upload failed. Please retry.' }));
  }
}
