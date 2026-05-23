import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { fileName, fileType, fileBase64, bucket, mandateId, contactId, visibility } = req.body;
  if (!fileName || !fileBase64 || !bucket) return res.status(400).json({ error: 'Missing required fields' });
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return res.status(500).json({ error: 'Supabase not configured' });

  try {
    const buffer = Buffer.from(fileBase64, 'base64');
    const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${fileName}`, { method: 'POST', headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`, 'Content-Type': fileType || 'application/octet-stream' }, body: buffer });
    if (!uploadRes.ok) { const err = await uploadRes.json(); return res.status(502).json({ error: 'Upload failed', details: err }); }
    const uploadData = await uploadRes.json();
    const filePath = uploadData.path || fileName;
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${filePath}`;
    const docRes = await fetch(`${SUPABASE_URL}/rest/v1/documents`, { method: 'POST', headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify({ mandate_id: mandateId || null, contact_id: contactId || null, name: fileName, type: fileType?.includes('pdf') ? 'cv' : 'report', visibility: visibility || 'internal', storage_path: filePath, public_url: publicUrl }) });
    const docData = await docRes.json();
    return res.status(200).json({ success: true, path: filePath, publicUrl, document: docData?.[0] || null });
  } catch (err: any) { return res.status(500).json({ error: 'Internal server error', message: err.message }); }
}
