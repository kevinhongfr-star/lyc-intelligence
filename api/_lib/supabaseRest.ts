/**
 * Supabase REST client — raw fetch() only.
 *
 * Replaces @supabase/supabase-js in Vercel serverless functions (the SDK
 * crashes on Node 24 with FUNCTION_INVOCATION_FAILED). All outbound HTTP
 * calls use AbortController with a 7s timeout. Vercel function callers must
 * set `export const maxDuration = 60` to extend past the Hobby 10s default.
 *
 * Env vars required:
 *   SUPABASE_URL          — e.g. https://xxx.supabase.co
 *   SUPABASE_SERVICE_KEY  — service role key (server-only)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  '';

const DEFAULT_TIMEOUT_MS = 7000;

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY);
}

function getHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function buildUrl(table: string, query?: string): string {
  const base = `${SUPABASE_URL}/rest/v1/${encodeURIComponent(table)}`;
  return query ? `${base}?${query}` : base;
}

/** GET single row matching the filter. Returns the first element or null. */
export async function selectOne(
  table: string,
  filter: { column: string; value: string | number | boolean } & { select?: string },
  timeoutMs?: number
): Promise<any | null> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured (missing SUPABASE_URL or SUPABASE_SERVICE_KEY)');
  }
  const select = filter.select || '*';
  const query = `select=${encodeURIComponent(select)}&${filter.column}=eq.${encodeURIComponent(String(filter.value))}&limit=1`;
  const res = await fetchWithTimeout(
    buildUrl(table, query),
    { method: 'GET', headers: getHeaders() },
    timeoutMs
  );
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Supabase GET ${table} failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  return Array.isArray(data) && data.length > 0 ? data[0] : null;
}

/** GET multiple rows. `options.where` is an array of `column=value` filters (already URL-encoded strings OK). */
export async function selectMany(
  table: string,
  options: {
    select?: string;
    where?: Array<{ column: string; value: string | number | boolean; op?: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'ilike' }>;
    orderBy?: { column: string; ascending?: boolean };
    limit?: number;
    offset?: number;
  } = {},
  timeoutMs?: number
): Promise<any[]> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured (missing SUPABASE_URL or SUPABASE_SERVICE_KEY)');
  }
  const parts: string[] = [];
  parts.push(`select=${encodeURIComponent(options.select || '*')}`);
  if (options.where) {
    for (const w of options.where) {
      const op = w.op || 'eq';
      parts.push(`${w.column}=${op}.${encodeURIComponent(String(w.value))}`);
    }
  }
  if (options.orderBy) {
    parts.push(`order=${encodeURIComponent(options.orderBy.column)}.${options.orderBy.ascending === false ? 'desc' : 'asc'}`);
  }
  if (typeof options.limit === 'number') parts.push(`limit=${options.limit}`);
  if (typeof options.offset === 'number') parts.push(`offset=${options.offset}`);

  const res = await fetchWithTimeout(
    buildUrl(table, parts.join('&')),
    { method: 'GET', headers: getHeaders() },
    timeoutMs
  );
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Supabase GET ${table} failed: ${res.status} ${text}`);
  }
  return (await res.json()) as any[];
}

/** INSERT a single row. Returns the inserted row (with `Prefer: return=representation`). */
export async function insert(
  table: string,
  data: Record<string, any>,
  timeoutMs?: number
): Promise<any> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured (missing SUPABASE_URL or SUPABASE_SERVICE_KEY)');
  }
  const res = await fetchWithTimeout(
    buildUrl(table),
    {
      method: 'POST',
      headers: getHeaders({ Prefer: 'return=representation' }),
      body: JSON.stringify(data),
    },
    timeoutMs
  );
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Supabase INSERT ${table} failed: ${res.status} ${text}`);
  }
  const out = await res.json();
  return Array.isArray(out) && out.length === 1 ? out[0] : out;
}

/** UPDATE rows matching the filter. Returns the updated row array. */
export async function update(
  table: string,
  filter: { column: string; value: string | number | boolean },
  data: Record<string, any>,
  timeoutMs?: number
): Promise<any[]> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured (missing SUPABASE_URL or SUPABASE_SERVICE_KEY)');
  }
  const query = `${filter.column}=eq.${encodeURIComponent(String(filter.value))}`;
  const res = await fetchWithTimeout(
    buildUrl(table, query),
    {
      method: 'PATCH',
      headers: getHeaders({ Prefer: 'return=representation' }),
      body: JSON.stringify(data),
    },
    timeoutMs
  );
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Supabase UPDATE ${table} failed: ${res.status} ${text}`);
  }
  return (await res.json()) as any[];
}

/**
 * Helper for Vercel handlers: returns a clean 500 JSON when an error escapes
 * the try/catch. Always pair with a top-level try/catch in the handler.
 */
export function handleError(res: VercelResponse, endpoint: string, err: any) {
  console.error(`[${endpoint}] Unhandled error:`, err);
  return res.status(500).json({
    error: 'Internal server error',
    success: false,
    details: process.env.NODE_ENV === 'development' ? String(err?.message || err) : undefined,
  });
}

/** DELETE rows matching the filter. Returns the count of deleted rows. */
export async function deleteRows(
  table: string,
  filter: { column: string; value: string | number | boolean },
  timeoutMs?: number
): Promise<number> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured (missing SUPABASE_URL or SUPABASE_SERVICE_KEY)');
  }
  const query = `${filter.column}=eq.${encodeURIComponent(String(filter.value))}`;
  const res = await fetchWithTimeout(
    buildUrl(table, query),
    {
      method: 'DELETE',
      headers: getHeaders({ Prefer: 'return=representation' }),
    },
    timeoutMs
  );
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Supabase DELETE ${table} failed: ${res.status} ${text}`);
  }
  const out = await res.json().catch(() => []);
  return Array.isArray(out) ? out.length : 0;
}
