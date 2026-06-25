/**
 * CSVUploader — drag-and-drop CSV upload for Org Intelligence target companies.
 *
 * Phase 1 scope (T5 scaffold):
 *   - Drag-drop or click-to-pick a CSV file (5 MB cap, enforced client-side)
 *   - Parse the first 5 rows client-side to show a preview
 *   - POST the raw file as multipart/form-data to
 *     /api/admin/org-intelligence/companies/upload
 *   - Display the response summary (inserted / skipped / errors)
 *   - Auth: relies on the caller's session (the Supabase JS session token
 *     is read by the Vercel endpoint via verifyAdmin)
 *
 * Server contract (matches T3 upload.ts):
 *   POST /api/admin/org-intelligence/companies/upload
 *   Body: multipart/form-data with a single `file` part (any field name
 *         with a filename= attribute also works)
 *   Required CSV columns: name, mandate_id
 *   Optional: name_cn, industry, hq_city, hq_country, website,
 *             brief_description, is_comparator
 */
import React, { useCallback, useRef, useState } from 'react';
import { authFetch } from '@/utils/authFetch';
import { Upload, FileText, X, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

interface PreviewRow {
  cells: string[];
}

interface UploadResponse {
  success: boolean;
  total?: number;
  inserted?: number;
  skipped?: number;
  errors?: Array<{ row: number; reason: string }>;
  filename?: string;
  uploaded_by?: string;
  error?: string;
}

const REQUIRED_COLUMNS = ['name', 'mandate_id'];

function parseCsvPreview(text: string, maxRows = 5): { header: string[]; rows: PreviewRow[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { header: [], rows: [] };

  // Naive RFC 4180-ish parse (handles quoted fields with embedded commas).
  // For preview only — server is the source of truth on insert.
  const splitLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inQuotes) {
        if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (c === '"') inQuotes = false;
        else cur += c;
      } else {
        if (c === ',') { out.push(cur); cur = ''; }
        else if (c === '"') inQuotes = true;
        else cur += c;
      }
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };

  const header = splitLine(lines[0]);
  const rows = lines.slice(1, 1 + maxRows).map((l) => ({ cells: splitLine(l) }));
  return { header, rows };
}

export function CSVUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ header: string[]; rows: PreviewRow[] } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [response, setResponse] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = useCallback(async (f: File) => {
    setError(null);
    setResponse(null);

    if (!f.name.toLowerCase().endsWith('.csv')) {
      setError('Please pick a .csv file.');
      return;
    }
    if (f.size > MAX_FILE_SIZE_BYTES) {
      setError(`File is ${(f.size / 1024 / 1024).toFixed(2)} MB; max is 5 MB.`);
      return;
    }

    setFile(f);
    const text = await f.text();
    const parsed = parseCsvPreview(text);

    // Server-side required columns check (client-side mirror for fast feedback)
    const missing = REQUIRED_COLUMNS.filter((c) => !parsed.header.includes(c));
    if (missing.length > 0) {
      setError(`Missing required column(s): ${missing.join(', ')}. Server will reject.`);
    }
    setPreview(parsed);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = e.dataTransfer.files?.[0];
      if (dropped) handleFile(dropped);
    },
    [handleFile]
  );

  const onSubmit = useCallback(async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setResponse(null);

    try {
      const sb = useAuthStore.getState().supabase;
      const { data: sess } = sb ? await sb.auth.getSession() : { data: { session: null } };
      const token = sess.session?.access_token;
      if (!token) {
        setError('No active session. Please sign in again.');
        setUploading(false);
        return;
      }

      const form = new FormData();
      form.append('file', file);

      const res = await authFetch('/api/admin/org-intelligence/companies/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const json = (await res.json()) as UploadResponse;
      if (!res.ok) {
        setError(json.error || `Upload failed (HTTP ${res.status})`);
      } else {
        setResponse(json);
      }
    } catch (e: any) {
      setError(e?.message || 'Network error');
    } finally {
      setUploading(false);
    }
  }, [file]);

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResponse(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          cursor-pointer border-2 border-dashed rounded-lg p-8
          flex flex-col items-center justify-center text-center
          transition-colors
          ${isDragging
            ? 'border-accent bg-accent-5'
            : 'border-bg-hover hover:border-text-muted hover:bg-bg-secondary'}
        `}
        role="button"
        tabIndex={0}
      >
        <Upload className="w-10 h-10 text-text-muted mb-2" />
        <p className="text-text-primary font-medium">
          {file ? file.name : 'Drop a CSV here, or click to pick'}
        </p>
        <p className="text-text-muted text-sm mt-1">
          {file
            ? `${(file.size / 1024).toFixed(1)} KB — click to replace`
            : 'Max 5 MB · UTF-8 · required columns: name, mandate_id'}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>

      {/* Preview */}
      {preview && preview.header.length > 0 && (
        <div className="border border-bg-hover rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-bg-secondary text-sm font-medium flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Preview (first {preview.rows.length} of data rows)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-tertiary">
                <tr>
                  {preview.header.map((h, i) => (
                    <th
                      key={i}
                      className={`
                        px-3 py-2 text-left font-medium
                        ${REQUIRED_COLUMNS.includes(h) ? 'text-accent' : 'text-text-secondary'}
                      `}
                    >
                      {h}
                      {REQUIRED_COLUMNS.includes(h) && (
                        <span className="text-accent ml-1">*</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((r, i) => (
                  <tr key={i} className="border-t border-bg-hover">
                    {r.cells.map((c, j) => (
                      <td key={j} className="px-3 py-2 text-text-secondary">
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="px-3 py-2 text-xs text-text-muted border-t border-bg-hover">
            * required column. Server validates + inserts per row.
          </p>
        </div>
      )}

      {/* Action row */}
      {file && (
        <div className="flex items-center gap-3">
          <button
            onClick={onSubmit}
            disabled={uploading}
            className="px-4 py-2 bg-accent text-white rounded-md font-medium
                       hover:bg-accent-light disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload {preview?.rows.length ? 'CSV' : ''}
              </>
            )}
          </button>
          <button
            onClick={reset}
            disabled={uploading}
            className="px-3 py-2 text-text-muted hover:text-text-primary flex items-center gap-1"
          >
            <X className="w-4 h-4" /> Clear
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="border border-red-200 bg-red-50 text-red-800 rounded-md p-3 flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm">{error}</div>
        </div>
      )}

      {/* Success summary */}
      {response?.success && (
        <div className="border border-green-200 bg-green-50 text-green-800 rounded-md p-3 space-y-2">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-5 h-5" />
            Upload complete — {response.inserted} of {response.total} rows inserted
            {response.skipped ? `, ${response.skipped} skipped` : ''}.
          </div>
          {response.uploaded_by && (
            <div className="text-xs text-green-700">
              Uploaded by {response.uploaded_by}
            </div>
          )}
          {response.errors && response.errors.length > 0 && (
            <details className="text-xs">
              <summary className="cursor-pointer">
                {response.errors.length} row error(s) — show details
              </summary>
              <ul className="mt-1 space-y-1 font-mono">
                {response.errors.map((e, i) => (
                  <li key={i}>
                    Row {e.row}: {e.reason}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
