/**
 * POST /api/admin/org-intelligence/companies/upload
 *
 * Admin-only CSV upload → batch insert into `target_companies`.
 *
 * Auth: verified via `verifyAdmin` (T2). Non-admins get 401.
 *
 * Request:
 *   - Method: POST
 *   - Content-Type: multipart/form-data
 *   - Body: a single file part named `file` (any field name works — the
 *           server grabs the first part with a `filename=` attribute).
 *   - Max size: 5 MB
 *
 * CSV format (RFC 4180-ish; header row required, comma-separated, double-quote
 * escape with `""` for embedded quotes):
 *
 *   name,name_cn,industry,hq_city,hq_country,website,brief_description,mandate_id,is_comparator
 *   Codelco China,智利国家铜业中国,Bulk commodities,Shanghai,China,https://www.codelco.com,State-owned copper producer,1f3a57d9-e3fe-4e96-b761-e769d94f26ae,true
 *   ...
 *
 * Required columns:
 *   - name        (text, non-empty)
 *   - mandate_id  (uuid, must exist in `mandates` table — enforced by FK)
 *
 * Optional columns (default null / false):
 *   - name_cn, industry, hq_city, hq_country, website, brief_description
 *   - is_comparator  (accepts: true/1/yes — anything else is false)
 *
 * Response (200):
 *   {
 *     success:   boolean,        // true if all rows inserted with no errors
 *     total:     number,         // total data rows in CSV
 *     inserted:  number,         // rows that landed in target_companies
 *     skipped:   number,         // validation + insert failures
 *     errors:    [{ row, reason }],
 *     filename:  string,
 *     uploaded_by: string        // admin email
 *   }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { insert, isSupabaseConfigured, handleError } from '../../../_lib/supabaseRest.js';
import { verifyAdmin } from '../../../_lib/adminAuth.js';

// 5 MB cap is more than enough for a 50-company list (typical ~10 KB).
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

// CSV parsing can run a few seconds for large files — extend Vercel timeout.
export const maxDuration = 60;

interface ParsedRow {
  name: string;
  name_cn: string | null;
  industry: string | null;
  hq_city: string | null;
  hq_country: string | null;
  website: string | null;
  brief_description: string | null;
  mandate_id: string;
  is_comparator: boolean;
}

/**
 * Minimal RFC 4180 CSV parser. Handles:
 *   - double-quoted fields
 *   - escaped quotes ("" inside a quoted field)
 *   - \r\n, \n, and \r line endings
 *   - trailing newline (no spurious empty row)
 */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\r' || c === '\n') {
      row.push(field);
      field = '';
      if (c === '\r' && text[i + 1] === '\n') i++;
      if (!(row.length === 1 && row[0] === '')) {
        rows.push(row);
      }
      row = [];
    } else {
      field += c;
    }
  }

  if (field !== '' || row.length > 0) {
    row.push(field);
    if (!(row.length === 1 && row[0] === '')) {
      rows.push(row);
    }
  }

  return rows;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateRow(headers: string[], values: string[]):
  | { ok: true; row: ParsedRow }
  | { ok: false; reason: string } {

  const map: Record<string, string> = {};
  for (let i = 0; i < headers.length; i++) {
    map[headers[i].trim().toLowerCase()] = (values[i] ?? '').trim();
  }

  const name = map['name'];
  const mandate_id = map['mandate_id'];

  if (!name) return { ok: false, reason: 'name is required' };
  if (!mandate_id) return { ok: false, reason: 'mandate_id is required' };
  if (!UUID_RE.test(mandate_id)) {
    return { ok: false, reason: `mandate_id is not a valid UUID: "${mandate_id}"` };
  }

  const website = map['website'] || null;
  if (website) {
    try {
      new URL(website);
    } catch {
      return { ok: false, reason: `website is not a valid URL: "${website}"` };
    }
  }

  const isCompStr = (map['is_comparator'] || '').toLowerCase();
  const is_comparator = isCompStr === 'true' || isCompStr === '1' || isCompStr === 'yes';

  return {
    ok: true,
    row: {
      name,
      name_cn: map['name_cn'] || null,
      industry: map['industry'] || null,
      hq_city: map['hq_city'] || null,
      hq_country: map['hq_country'] || null,
      website,
      brief_description: map['brief_description'] || null,
      mandate_id,
      is_comparator,
    },
  };
}

async function extractFileFromMultipart(req: VercelRequest): Promise<
  { csv: string; filename: string } | { error: string }
> {
  const contentType = req.headers['content-type'];
  if (!contentType || !contentType.includes('multipart/form-data')) {
    return { error: 'Content-Type must be multipart/form-data' };
  }
  const boundary = contentType.split('boundary=')[1];
  if (!boundary) return { error: 'Missing boundary in Content-Type' };

  const rawBody = await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    (req as any).on('data', (chunk: Buffer) => chunks.push(chunk));
    (req as any).on('end', () => resolve(Buffer.concat(chunks)));
    (req as any).on('error', reject);
  });

  if (rawBody.length > MAX_FILE_SIZE_BYTES) {
    return { error: `File size exceeds ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB limit` };
  }

  const parts = rawBody.toString('utf-8').split(`--${boundary}`);
  for (const part of parts) {
    if (part.includes('Content-Disposition') && part.includes('filename=')) {
      const filenameMatch = part.match(/filename="([^"]+)"/);
      const filename = filenameMatch ? filenameMatch[1] : 'upload.csv';
      const contentStart = part.indexOf('\r\n\r\n');
      if (contentStart === -1) continue;
      let content = part.substring(contentStart + 4);
      if (content.endsWith('\r\n')) content = content.slice(0, -2);
      return { csv: content, filename };
    }
  }
  return { error: 'No file part found in multipart body' };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    // 1. Admin auth
    const { user, error: authErr } = await verifyAdmin(req);
    if (authErr || !user) {
      return res.status(401).json({ success: false, error: authErr || 'Unauthorized' });
    }

    if (!isSupabaseConfigured()) {
      return res.status(500).json({ success: false, error: 'Supabase not configured on server' });
    }

    // 2. Extract CSV from multipart
    const extracted = await extractFileFromMultipart(req);
    if ('error' in extracted) {
      return res.status(400).json({ success: false, error: extracted.error });
    }
    if (!extracted.filename.toLowerCase().endsWith('.csv')) {
      return res.status(400).json({
        success: false,
        error: `File must be .csv (got "${extracted.filename}")`,
      });
    }

    // 3. Parse CSV
    const rows = parseCsv(extracted.csv);
    if (rows.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'CSV must have a header row + at least 1 data row',
      });
    }
    const headers = rows[0];
    const dataRows = rows.slice(1);

    // 4. Validate rows
    const valid: { rowNumber: number; row: ParsedRow }[] = [];
    const validationErrors: { row: number; reason: string }[] = [];
    for (let i = 0; i < dataRows.length; i++) {
      const result = validateRow(headers, dataRows[i]);
      if (result.ok) {
        valid.push({ rowNumber: i + 2, row: result.row });
      } else {
        validationErrors.push({ row: i + 2, reason: result.reason });
      }
    }

    // 5. Insert valid rows one at a time
    const inserted: any[] = [];
    const insertErrors: { row: number; reason: string }[] = [...validationErrors];

    for (const { rowNumber, row } of valid) {
      try {
        const result = await insert('target_companies', {
          ...row,
          uploaded_by: user.id,
        });
        inserted.push(result);
      } catch (err: any) {
        insertErrors.push({
          row: rowNumber,
          reason: err?.message || 'Insert failed',
        });
      }
    }

    return res.status(200).json({
      success: insertErrors.length === 0,
      total: dataRows.length,
      inserted: inserted.length,
      skipped: insertErrors.length,
      errors: insertErrors,
      filename: extracted.filename,
      uploaded_by: user.email,
    });
  } catch (err) {
    return handleError(res, 'org-intel/companies/upload', err);
  }
}
