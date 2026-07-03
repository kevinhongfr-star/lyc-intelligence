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

/** GET single row matching the filter. Returns the first element or null.
 * Supports both new and legacy filter formats with additional options.
 */
export async function selectOne(
  table: string,
  filter: any,
  timeoutMs?: number
): Promise<any | null> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured (missing SUPABASE_URL or SUPABASE_SERVICE_KEY)');
  }
  const select = filter.select || '*';
  let query = `select=${encodeURIComponent(select)}`;

  if (filter.where && Array.isArray(filter.where)) {
    for (const w of filter.where) {
      query += '&' + buildWherePart(w);
    }
  } else if (filter.column && filter.value) {
    query += `&${filter.column}=eq.${encodeURIComponent(String(filter.value))}`;
  }
  query += '&limit=1';

  // Add orderBy if present
  if (filter.orderBy) {
    const ob = filter.orderBy;
    query += `&order=${encodeURIComponent(ob.column)}.${ob.ascending === false ? 'desc' : 'asc'}`;
  }

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

type WhereOp = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'ilike' | 'is';
type WhereFilter = {
  column: string;
  value: string | number | boolean | any[] | null;
  op?: WhereOp;
  operator?: WhereOp;
};

function buildWherePart(w: WhereFilter): string {
  const op = w.op || w.operator || 'eq';
  if (op === 'in' && Array.isArray(w.value)) {
    const escaped = (w.value as any[]).map(v => String(v).replace(/,/g, '\\,'));
    return `${w.column}=in.(${escaped.join(',')})`;
  }
  if (op === 'is') {
    if (w.value === null) return `${w.column}=is.null`;
    if (w.value === true) return `${w.column}=is.true`;
    if (w.value === false) return `${w.column}=is.false`;
    return `${w.column}=is.${w.value}`;
  }
  return `${w.column}=${op}.${encodeURIComponent(String(w.value))}`;
}

/** GET multiple rows. Supports both new object-based and legacy positional calling conventions.
 *
 * New: selectMany(table, { select?, where?, or?, orderBy?, limit?, offset? }, timeoutMs?)
 * Legacy: selectMany(table, filters, orderBy?, limit?, offset?, select?)
 */
export async function selectMany(
  table: string,
  optionsOrFilters?: any,
  orderByOrLimit?: any,
  limitOrOffset?: any,
  offsetOrSelect?: any,
  selectOrTimeout?: any,
  maybeTimeout?: number
): Promise<any[]> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured (missing SUPABASE_URL or SUPABASE_SERVICE_KEY)');
  }

  // Detect calling convention
  const isNewStyle = (x: any): boolean =>
    x && typeof x === 'object' && !Array.isArray(x) &&
    ('select' in x || 'where' in x || 'or' in x || 'orderBy' in x || 'limit' in x || 'offset' in x);

  let options: {
    select?: string;
    where?: WhereFilter[];
    or?: string;
    orderBy?: { column: string; ascending?: boolean };
    limit?: number;
    offset?: number;
  };
  let timeoutMs: number | undefined;

  if (isNewStyle(optionsOrFilters)) {
    options = optionsOrFilters;
    timeoutMs = typeof orderByOrLimit === 'number' ? orderByOrLimit : undefined;
  } else {
    // Legacy positional args: table, filters, orderBy, limit, offset, select
    const filters = optionsOrFilters || {};
    const orderByArr = Array.isArray(orderByOrLimit) ? orderByOrLimit : [];
    const limit = typeof limitOrOffset === 'number' ? limitOrOffset : undefined;
    const offset = typeof offsetOrSelect === 'number' ? offsetOrSelect : undefined;
    const select = typeof selectOrTimeout === 'string' ? selectOrTimeout : '*';
    timeoutMs = typeof selectOrTimeout === 'number' ? selectOrTimeout : (typeof maybeTimeout === 'number' ? maybeTimeout : undefined);

    // Convert legacy filters (object with column: value) to where array
    const where: WhereFilter[] = [];
    for (const [col, val] of Object.entries(filters)) {
      if (val !== undefined && val !== null) {
        where.push({ column: col, value: val as any, op: 'eq' });
      }
    }

    // Parse orderBy array like ['changed_at DESC'] -> { column: 'changed_at', ascending: false }
    let orderBy: { column: string; ascending?: boolean } | undefined;
    if (orderByArr.length > 0) {
      const first = orderByArr[0];
      if (typeof first === 'string') {
        const parts = first.trim().split(/\s+/);
        orderBy = {
          column: parts[0],
          ascending: parts[1]?.toUpperCase() !== 'DESC',
        };
      }
    }

    options = { select, where, orderBy, limit, offset };
  }

  const parts: string[] = [];
  parts.push(`select=${encodeURIComponent(options.select || '*')}`);
  if (options.where) {
    for (const w of options.where) {
      parts.push(buildWherePart(w));
    }
  }
  if (options.or) {
    parts.push(`or=(${options.or})`);
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

/**
 * UPDATE rows matching the filter. Returns the updated row array.
 *
 * Supports multiple calling conventions:
 *   update(table, { column, value }, data, timeout?)  — filter object first
 *   update(table, data, value, columnName?, timeout?)  — data first (legacy)
 *   update(table, { column, value, ...data }, timeout?)  — combined filter+data
 */
export async function update(
  table: string,
  filterOrData: any,
  dataOrValue?: any,
  columnNameOrTimeout?: string | number,
  maybeTimeout?: number
): Promise<any[]> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured (missing SUPABASE_URL or SUPABASE_SERVICE_KEY)');
  }

  let filter: { column: string; value: any } | { where: WhereFilter[] };
  let data: Record<string, any>;
  let timeoutMs: number | undefined;

  // Case 1: Combined filter+data object (has column, value, and other data fields like 'updates')
  if (filterOrData && typeof filterOrData === 'object' && 'column' in filterOrData && 'value' in filterOrData) {
    const { column, value, ...restData } = filterOrData;
    filter = { column, value };
    data = restData;
    timeoutMs = dataOrValue as number | undefined;
  }
  // Case 2: Filter object with where array
  else if (filterOrData && typeof filterOrData === 'object' && 'where' in filterOrData) {
    filter = filterOrData;
    data = dataOrValue || {};
    timeoutMs = columnNameOrTimeout as number | undefined;
  }
  // Case 3: Data-first (legacy)
  else {
    data = filterOrData;
    const columnName = (typeof columnNameOrTimeout === 'string') ? columnNameOrTimeout : 'id';
    filter = { column: columnName, value: dataOrValue };
    if (typeof columnNameOrTimeout === 'number') timeoutMs = columnNameOrTimeout;
    if (typeof maybeTimeout === 'number') timeoutMs = maybeTimeout;
  }

  const parts: string[] = [];
  if ('where' in filter && Array.isArray(filter.where)) {
    for (const w of filter.where) {
      parts.push(buildWherePart(w));
    }
  } else if ('column' in filter) {
    parts.push(`${filter.column}=eq.${encodeURIComponent(String((filter as any).value))}`);
  }
  const query = parts.join('&');
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
 * Create a Supabase Auth user via the Admin API (GoTrue).
 * This creates an auth.users record so the user can log in.
 * Returns the created user object (with id, email, etc.).
 */
export async function createAuthUser(
  email: string,
  password: string,
  options: { email_confirm?: boolean; user_metadata?: Record<string, any> } = {}
): Promise<any> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured (missing SUPABASE_URL or SUPABASE_SERVICE_KEY)');
  }

  const url = `${SUPABASE_URL}/auth/v1/admin/users`;
  const body: Record<string, any> = {
    email,
    password,
    email_confirm: options.email_confirm !== false, // default true
  };
  if (options.user_metadata) {
    body.user_metadata = options.user_metadata;
  }

  const res = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    },
    15000
  );

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    // If user already exists in auth, that's OK — try to find them
    if (res.status === 422 || text.includes('already')) {
      const existing = await selectOne('profiles', {
        select: 'id',
        column: 'email',
        value: email.toLowerCase(),
      });
      if (existing) {
        throw new Error(`Auth user already exists for ${email}. Profile may already be linked.`);
      }
    }
    throw new Error(`Supabase Auth create user failed: ${res.status} ${text}`);
  }

  return await res.json();
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

/** COUNT rows matching the filter. Returns the count number. */
export async function countRows(
  table: string,
  options: {
    where?: WhereFilter[];
  } = {},
  timeoutMs?: number
): Promise<number> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured (missing SUPABASE_URL or SUPABASE_SERVICE_KEY)');
  }
  const parts: string[] = [];
  parts.push('select=count');
  if (options.where) {
    for (const w of options.where) {
      parts.push(buildWherePart(w));
    }
  }
  const res = await fetchWithTimeout(
    `${buildUrl(table, parts.join('&'))}`,
    {
      method: 'HEAD',
      headers: getHeaders({ Prefer: 'count=exact' }),
    },
    timeoutMs
  );
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Supabase COUNT ${table} failed: ${res.status} ${text}`);
  }
  const count = res.headers.get('content-range');
  if (count) {
    const match = count.match(/\/(\d+)/);
    if (match) return parseInt(match[1], 10);
  }
  return 0;
}

/** DELETE rows matching the filter. Returns the count of deleted rows. */
export async function deleteRows(
  table: string,
  filter: { column: string; value: string | number | boolean } | { where: WhereFilter[] },
  timeoutMs?: number
): Promise<number> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured (missing SUPABASE_URL or SUPABASE_SERVICE_KEY)');
  }
  const parts: string[] = [];
  if ('where' in filter && Array.isArray(filter.where)) {
    for (const w of filter.where) {
      parts.push(buildWherePart(w));
    }
  } else if ('column' in filter) {
    parts.push(`${filter.column}=eq.${encodeURIComponent(String(filter.value))}`);
  }
  const res = await fetchWithTimeout(
    buildUrl(table, parts.join('&')),
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

/** Alias for deleteRows — legacy naming convention used by many handlers.
 * Supports: remove(table, id) -> delete by id
 * Supports: remove(table, { column, value }) -> delete by filter
 */
export async function remove(
  table: string,
  filterOrId: string | number | { column: string; value: string | number | boolean } | { where: WhereFilter[] },
  timeoutMs?: number
): Promise<number> {
  // Handle legacy `remove(table, id)` -> delete by 'id' column
  if (typeof filterOrId === 'string' || typeof filterOrId === 'number') {
    return deleteRows(table, { column: 'id', value: filterOrId }, timeoutMs);
  }
  return deleteRows(table, filterOrId, timeoutMs);
}

/**
 * Execute a raw SQL query via Supabase RPC or PostgREST.
 * NOTE: This is a stub implementation. For complex queries, consider
 * rewriting them using selectMany/update/insert/deleteRows.
 *
 * Returns PostgreSQL-style result object: { rows: any[], rowCount: number }
 * Stub returns empty result with warning.
 *
 * @param sql - The SQL query string (parameterized with $1, $2, etc.)
 * @param params - Array of parameter values
 * @param timeoutMs - Optional timeout in milliseconds
 * @returns Query result object (stub returns { rows: [], rowCount: 0 })
 */
export async function query(
  sql: string,
  params?: any[],
  timeoutMs?: number
): Promise<{ rows: any[]; rowCount: number }> {
  console.warn('[supabaseRest] query() stub called - raw SQL not supported via REST API:', sql.slice(0, 100));
  // Stub: return PostgreSQL-style empty result. Real implementation would need Supabase RPC endpoint.
  return { rows: [], rowCount: 0 };
}

// Re-export types for use in other modules
export type { WhereFilter, WhereOp };

/**
 * Legacy `select` function - wraps selectMany with backward compatibility.
 * Handles: select(table, { column, value }) -> returns multiple rows filtered by column=value
 * Handles: select(table, { where: [...] }) -> new style
 */
export async function select(
  table: string,
  filterOrOptions: any,
  ...rest: any[]
): Promise<any[]> {
  // If filter has `column` and `value` but no `where`, convert to selectMany format
  if (filterOrOptions && typeof filterOrOptions === 'object' && 'column' in filterOrOptions && 'value' in filterOrOptions && !('where' in filterOrOptions)) {
    return selectMany(table, { where: [{ column: filterOrOptions.column, value: filterOrOptions.value, op: 'eq' }] }, ...rest);
  }
  return selectMany(table, filterOrOptions, ...rest);
}
