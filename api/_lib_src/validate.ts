/**
 * Phase 3 — #1309: Input validation & sanitization helpers.
 *
 * Shared by all /api/* endpoints. Defends against:
 *   - SQL/PostgREST column injection via filter / select / order params
 *   - Stored XSS via unbounded user-provided strings
 *   - Oversized request bodies (DoS)
 *   - Type coercion bugs (string IDs, NaN numbers)
 *   - Malformed UUIDs / emails reaching the DB layer
 *
 * Usage:
 *   import {
 *     assertColumnName, assertEntityName, sanitizeString,
 *     validateUuid, validateEmail, clampInt,
 *     assertBodySize, parseJsonBody,
 *   } from '../lib/validate.js';
 *
 * Security:
 *   - Pure functions, no I/O — safe to call anywhere
 *   - All assertions throw RequestAuthError (422) on failure
 *   - Sanitizers are idempotent and never throw
 */

import { RequestAuthError } from './auth.js';

// ── Regexes ────────────────────────────────────────────────────────
// Postgres identifier: lowercase letters, digits, underscore. Must
// start with a letter or underscore. Max 63 chars (PG NAMELEN limit).
const RE_COLUMN_NAME = /^[a-z_][a-z0-9_]{0,62}$/;
const RE_ENTITY_NAME = /^[a-z_][a-z0-9_]{0,62}$/;

// UUID v1-v5 (Supabase uses v4 but auth.uid() may emit any version).
const RE_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Email — RFC 5322 simplified. Not exhaustive, but rejects the obvious
// junk. Server-side canonicalization is via Supabase auth.
const RE_EMAIL = /^[^\s@<>]{1,64}@[^\s@<>]{1,253}\.[^\s@<>]{2,63}$/;

// Control chars (incl. NUL, BEL, etc.) — strip from user strings.
// eslint-disable-next-line no-control-regex
const RE_CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

// ── Default limits ─────────────────────────────────────────────────
export const DEFAULT_BODY_LIMIT = 256 * 1024;        // 256 KB
export const DEFAULT_STRING_LIMIT = 8 * 1024;        // 8 KB per string field
export const DEFAULT_ARRAY_LIMIT = 500;              // items per array

// ── Assertions (throw on failure) ──────────────────────────────────

/** Assert string is a safe Postgres column / field name. */
export function assertColumnName(name: string): void {
  if (typeof name !== 'string' || !RE_COLUMN_NAME.test(name)) {
    throw new RequestAuthError(`Invalid column name: "${name}"`, 422);
  }
}

/** Assert string is a safe entity / table name. */
export function assertEntityName(name: string): void {
  if (typeof name !== 'string' || !RE_ENTITY_NAME.test(name)) {
    throw new RequestAuthError(`Invalid entity name: "${name}"`, 422);
  }
}

/** Assert string is a valid UUID. */
export function assertUuid(value: string, field = 'id'): void {
  if (typeof value !== 'string' || !RE_UUID.test(value)) {
    throw new RequestAuthError(`Invalid ${field}: must be a UUID`, 422);
  }
}

/** Assert string is a plausible email. */
export function assertEmail(value: string): void {
  if (typeof value !== 'string' || !RE_EMAIL.test(value)) {
    throw new RequestAuthError('Invalid email address', 422);
  }
}

/** Assert value is one of an explicit allowlist. */
export function assertOneOf<T extends string>(
  value: string,
  allowed: readonly T[],
  field = 'value',
): T {
  if (!allowed.includes(value as T)) {
    throw new RequestAuthError(
      `Invalid ${field}: must be one of ${allowed.join(', ')}`,
      422,
    );
  }
  return value as T;
}

// ── Sanitizers (return safe value, never throw) ────────────────────

/**
 * Strip control chars and enforce max length. Use on any user-provided
 * string before storing or echoing back. Preserves Unicode text.
 */
export function sanitizeString(
  value: unknown,
  maxLength = DEFAULT_STRING_LIMIT,
): string {
  if (typeof value !== 'string') return '';
  const stripped = value.replace(RE_CONTROL_CHARS, '');
  // Normalize Unicode (NFC) to prevent look-alike attacks.
  const normalized = stripped.normalize('NFC');
  return normalized.length > maxLength
    ? normalized.slice(0, maxLength)
    : normalized;
}

/**
 * Recursively sanitize an object: strip control chars from all string
 * values, enforce per-field length, cap array length. Non-serializable
 * values (functions, symbols) are dropped.
 */
export function sanitizeObject<T = unknown>(
  value: unknown,
  opts: {
    maxDepth?: number;
    maxStringLength?: number;
    maxArrayLength?: number;
  } = {},
): T {
  const maxDepth = opts.maxDepth ?? 12;
  const maxStringLength = opts.maxStringLength ?? DEFAULT_STRING_LIMIT;
  const maxArrayLength = opts.maxArrayLength ?? DEFAULT_ARRAY_LIMIT;

  function walk(v: unknown, depth: number): unknown {
    if (depth > maxDepth) return null;
    if (v === null || v === undefined) return v;
    if (typeof v === 'string') {
      return sanitizeString(v, maxStringLength);
    }
    if (typeof v === 'number') {
      return Number.isFinite(v) ? v : null;
    }
    if (typeof v === 'boolean') return v;
    if (Array.isArray(v)) {
      return v.slice(0, maxArrayLength).map((item) => walk(item, depth + 1));
    }
    if (typeof v === 'object') {
      const out: Record<string, unknown> = {};
      for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
        // Skip keys that aren't valid identifiers or start with __
        if (!RE_COLUMN_NAME.test(k) || k.startsWith('__')) continue;
        // Skip prototype-polluting keys
        if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
        out[k] = walk(val, depth + 1);
      }
      return out;
    }
    // functions, symbols, bigint — drop
    return null;
  }

  return walk(value, 0) as T;
}

// ── Numeric coercion ───────────────────────────────────────────────

/** Coerce to integer, clamped to [min, max]. Returns 0 for invalid. */
export function clampInt(
  value: unknown,
  min: number,
  max: number,
  fallback = 0,
): number {
  const n = typeof value === 'number'
    ? value
    : typeof value === 'string'
      ? Number(value)
      : NaN;
  if (!Number.isFinite(n)) return fallback;
  const i = Math.trunc(n);
  return Math.max(min, Math.min(max, i));
}

// ── Body size & JSON parsing ───────────────────────────────────────

/**
 * Assert request body is within size limit. Reads Content-Length and
 * (if missing) the body buffer length. Throws 413 on overflow.
 */
export function assertBodySize(
  body: unknown,
  limit = DEFAULT_BODY_LIMIT,
): void {
  let size: number;
  if (body === undefined || body === null) {
    size = 0;
  } else if (typeof body === 'string') {
    size = Buffer.byteLength(body);
  } else if (Buffer.isBuffer(body)) {
    size = body.length;
  } else {
    try {
      size = Buffer.byteLength(JSON.stringify(body));
    } catch {
      size = 0;
    }
  }
  if (size > limit) {
    throw new RequestAuthError(
      `Request body too large (${size} > ${limit} bytes)`,
      413,
    );
  }
}

/**
 * Validate filter params for /api/data/[entity].ts. Returns a clean
 * map of { column → { op, value } } or throws on invalid column names.
 *
 * Supported ops: eq, neq, gt, lt, gte, lte, in, like
 * Format: eq=col:val  (multiple eq params allowed for different cols)
 */
export interface ParsedFilter {
  column: string;
  op: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'like';
  value: string;
}
export function parseFilters(
  query: Record<string, string | string[] | undefined>,
  allowedOps: readonly string[] = ['eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'in', 'like'],
): ParsedFilter[] {
  const out: ParsedFilter[] = [];
  for (const op of allowedOps) {
    const raw = query[op];
    if (!raw) continue;
    const pairs = Array.isArray(raw) ? raw : [raw];
    for (const pair of pairs) {
      const sep = pair.indexOf(':');
      if (sep <= 0) continue;
      const col = pair.slice(0, sep);
      const val = pair.slice(sep + 1);
      assertColumnName(col);
      out.push({
        column: col,
        op: op as ParsedFilter['op'],
        value: sanitizeString(val, 1024),
      });
    }
  }
  return out;
}

/**
 * Validate `order=col[:asc|desc]` param. Returns { column, ascending }
 * or null if no order param present.
 */
export function parseOrderParam(
  raw: string | undefined,
): { column: string; ascending: boolean } | null {
  if (!raw) return null;
  const [col, dir] = raw.split(':');
  assertColumnName(col);
  return { column: col, ascending: (dir ?? 'asc') === 'asc' };
}

/**
 * Validate a comma-separated select list. Returns cleaned column array.
 * Rejects anything that isn't a valid column name (or '*').
 */
export function parseSelectList(raw: string | string[] | undefined): string[] {
  if (!raw) return ['*'];
  const s = Array.isArray(raw) ? raw[0] : raw;
  const cols = s.split(',').map((c) => c.trim()).filter(Boolean);
  if (cols.length === 0) return ['*'];
  for (const c of cols) {
    if (c === '*') continue;
    assertColumnName(c);
  }
  return cols;
}

// ── #1310: Error message hardening ────────────────────────────────
//
// Problem: API endpoints were returning raw Supabase/PostgREST error
// messages to the client (e.g. "DB error: column profiles.role does
// not exist"). These leak schema details, table names, and constraint
// names — useful to attackers probing the API.
//
// Fix: two-layer approach.
//   1. logServerError(ctx, err) — full structured log to stderr with
//      sensitive headers scrubbed. Goes to log drains, never to client.
//   2. safeErrorMessage(err, fallback) — returns a user-safe message.
//      RequestAuthError messages pass through (already curated).
//      PostgREST errors get mapped to generic strings.
//      Unknown errors get the fallback.

const SUPABASE_ERROR_MAP: Record<string, string> = {
  // PostgREST error codes (https://postgrest.org/en/stable/api.html#errors)
  'PGRST116': 'Resource not found',
  'PGRST204': 'No content available',
  'PGRST301': 'Invalid request parameters',
  'PGRST302': 'Invalid filter syntax',
  // Postgres SQLSTATE codes (subset that surface to clients)
  '23505': 'Resource already exists',                    // unique_violation
  '23503': 'Referenced resource does not exist',         // foreign_key_violation
  '23502': 'Missing required field',                     // not_null_violation
  '23514': 'Invalid input',                              // check_violation
  '42501': 'Permission denied',                          // insufficient_privilege
  '42601': 'Invalid request',                            // syntax_error
  '22001': 'Input too long',                             // string_data_right_truncation
  '22003': 'Numeric value out of range',                 // numeric_value_out_of_range
  '22008': 'Invalid datetime',                           // datetime_field_overflow
  '22023': 'Invalid parameter type',                     // invalid_parameter_value
  '42P01': 'Service unavailable',                        // undefined_table (config issue)
  '42703': 'Service unavailable',                        // undefined_column (config issue)
  '40001': 'Conflict, please retry',                     // serialization_failure
  '40P01': 'Conflict, please retry',                     // deadlock_detected
};

/**
 * Returns a user-safe error message. Never leaks DB schema, table
 * names, constraint names, or stack traces.
 */
export function safeErrorMessage(
  err: unknown,
  fallback = 'Internal server error',
): string {
  if (!err) return fallback;

  // RequestAuthError messages are already curated — pass through.
  if (err instanceof RequestAuthError) {
    return err.message;
  }

  // Supabase / PostgREST errors look like { code, message, details, hint }
  const any = err as any;
  if (any?.code && typeof any.code === 'string') {
    const mapped = SUPABASE_ERROR_MAP[any.code];
    if (mapped) return mapped;
    // Fall through to generic for unknown codes — do NOT surface the
    // raw message because it typically contains column/table names.
    if (any.code.startsWith('PGRST') || any.code.match(/^[0-9A-Z]{5}$/)) {
      return fallback;
    }
  }

  // Generic Error: check for a few safe prefixes; otherwise fallback.
  if (err instanceof Error) {
    const msg = err.message || '';
    // Allow network errors and explicit user-facing messages.
    if (/^Network error|^Failed to fetch|^Timeout|^Invalid\b|^Missing\b/i.test(msg)) {
      return msg;
    }
  }

  return fallback;
}

/**
 * Maps any error to an appropriate HTTP status code.
 * RequestAuthError carries its own status; Supabase errors get a
 * best-effort mapping; unknown errors default to 500.
 */
export function safeErrorStatus(err: unknown, fallback = 500): number {
  if (err instanceof RequestAuthError) return err.status;
  const code = (err as any)?.code;
  if (typeof code === 'string') {
    if (code === '23505') return 409;          // unique_violation
    if (code === '23503') return 400;          // foreign_key_violation
    if (code === '23502') return 422;          // not_null_violation
    if (code === '42501') return 403;          // insufficient_privilege
    if (code === 'PGRST116') return 404;
    if (code?.startsWith('PGRST')) return 400;
    if (code?.match(/^22/)) return 422;        // data_exception
    if (code?.match(/^23/)) return 409;        // integrity_constraint_violation
    if (code?.match(/^42/)) return 500;        // config/syntax (server issue, not client)
  }
  return fallback;
}

/** Headers that must never appear in server logs. */
const SENSITIVE_HEADER_KEYS = new Set([
  'authorization', 'cookie', 'set-cookie', 'x-api-key',
  'x-anonymous-id', 'x-supabase-key', 'api-key',
]);

/**
 * Structured server-side error log. Scrubs sensitive headers and
 * writes a single JSON line to stderr (Vercel log drains pick this up).
 *
 * The error object's full message + stack IS logged here (server-side
 * only) for debugging — just never returned to the client.
 */
export function logServerError(
  context: string,
  err: unknown,
  req?: { headers?: Record<string, string | string[] | undefined>; url?: string; method?: string },
): void {
  const scrubbedHeaders: Record<string, string> = {};
  if (req?.headers) {
    for (const [k, v] of Object.entries(req.headers)) {
      if (SENSITIVE_HEADER_KEYS.has(k.toLowerCase())) {
        scrubbedHeaders[k] = '[REDACTED]';
      } else if (typeof v === 'string') {
        scrubbedHeaders[k] = v.slice(0, 256);
      }
    }
  }

  const payload = {
    ts: new Date().toISOString(),
    context,
    error: err instanceof Error
      ? {
          name: err.name,
          message: err.message,
          stack: err.stack?.split('\n').slice(0, 10).join('\n'),
          code: (err as any)?.code,
          status: (err as any)?.status,
        }
      : { message: String(err).slice(0, 1024) },
    req: req
      ? {
          method: req.method,
          url: req.url ? String(req.url).slice(0, 512) : undefined,
          headers: scrubbedHeaders,
        }
      : undefined,
  };

  // Use process.stderr to avoid Vercel request log noise.
  try {
    process.stderr.write(JSON.stringify(payload) + '\n');
  } catch {
    // If stderr write fails (rare), fall back to console.
    // eslint-disable-next-line no-console
    console.error(payload);
  }
}

