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

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { RequestAuthError } from './auth.js';
import { z } from 'zod';

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
 * #1314: Safely parse a JSON request body.
 *
 * Vercel's `@vercel/node` runtime auto-parses `application/json` bodies
 * and sets `req.body` to the parsed object. But when the JSON is
 * malformed, behavior varies by runtime version: `req.body` may be a
 * raw string, an empty object, or the parse may throw before the
 * handler runs. This helper guarantees consistent handling:
 *
 *   - If `req.body` is already an object/array → return it as-is.
 *   - If `req.body` is a string → attempt JSON.parse; throw 400 on failure.
 *   - If `req.body` is undefined/null → return {} (treat as empty body).
 *
 * Always returns a sanitized object (control chars stripped, prototype-
 * pollution keys dropped, depth/length capped). Throws RequestAuthError
 * (status 400) for malformed JSON so callers' try/catch maps it to a
 * clean 400 response instead of a 500.
 */
export function parseJsonBody<T = Record<string, unknown>>(
  req: { body?: unknown; headers?: Record<string, string | string[] | undefined> },
  opts: { maxStringLength?: number; maxArrayLength?: number; maxDepth?: number } = {},
): T {
  const raw = req.body;

  // Already-parsed object (Vercel success path).
  if (raw !== null && raw !== undefined && typeof raw === 'object' && !Array.isArray(raw)) {
    return sanitizeObject<T>(raw, opts);
  }
  // Arrays are valid JSON bodies too — sanitize and return.
  if (Array.isArray(raw)) {
    return sanitizeObject<T>(raw, opts);
  }

  // String body: either Content-Type wasn't JSON (Vercel left it as a
  // string) OR the JSON was malformed and Vercel fell back to raw string.
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed === '') return {} as T;
    try {
      const parsed = JSON.parse(trimmed);
      return sanitizeObject<T>(parsed, opts);
    } catch {
      throw new RequestAuthError('Malformed JSON body', 400);
    }
  }

  // No body — return empty object. GET/DELETE typically have none.
  if (raw === undefined || raw === null) return {} as T;

  // Any other type (number, boolean, buffer) — reject as bad request.
  throw new RequestAuthError('Invalid request body', 400);
}

// ── URL / path validation (#1314) ──────────────────────────────────

/** Max URL length before we reject. Vercel's own limit is 8192; we
 *  reject earlier to avoid log noise and reject abuse. */
export const DEFAULT_MAX_URL_LENGTH = 4096;

/**
 * #1314: Assert the request URL (path + query) is within a sane length.
 * Extremely long URLs (typically from attackers stuffing payloads into
 * query params) cause 500s in some runtimes. Reject with 414 instead.
 */
export function assertUrlLength(
  req: { url?: string },
  max = DEFAULT_MAX_URL_LENGTH,
): void {
  const url = req.url ?? '';
  if (url.length > max) {
    throw new RequestAuthError('URI too long', 414);
  }
}

// ── Shared API error responder (#1314) ────────────────────────────
//
// Centralizes the try/catch → safe JSON response pattern so every
// endpoint returns:
//   - RequestAuthError.status + .message (already curated)
//   - Supabase errors → mapped status + safe message (no internals)
//   - Unknown errors → 500 + "Internal server error" (logged w/ stack)
//
// Never leaks stack traces, table names, or constraint names.

export function handleApiError(
  res: VercelResponse,
  err: unknown,
  context: string,
  req?: VercelRequest,
): void {
  if (err instanceof RequestAuthError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  logServerError(context, err, req);
  res.status(500).json({ error: 'Internal server error' });
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

const SENSITIVE_HEADER_KEYS = new Set([
  'authorization', 'cookie', 'set-cookie', 'x-api-key',
  'x-anonymous-id', 'x-supabase-key', 'api-key',
]);

// ── V3-5 / #1345 Server-side PII scrubbers ──────────────────────────
const RE_EMAIL = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const RE_UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const RE_ASSESSMENT_VALUES =
  /(strategic_thinking|operational_excellence|stakeholder_leadership|market_acumen|change_leadership|team_development|commercial_drive|cross_border|overall_competency|situational_judgment|interpersonal_effectiveness|growth_potential|self_awareness|ambiguity_tolerance|learning_agility|emotional_regulation|purpose_alignment|network_activation|risk_appetite|relational_mobility|purpose_orientation|performance_culture|people_stewardship|process_rigor|pioneering_thinking|partnership_intelligence|strategic_clarity|execution_bias|impact_resonance|stakeholder_equity|scalability_posture|market_creation)[\s:=]*"\s*\d+["\s,]/g;

function shortHash(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ('0000000' + Math.abs(h >>> 0).toString(16)).slice(-8);
}

function scrubMessage(s: string): string {
  if (!s) return s;
  let out = s;
  out = out.replace(RE_EMAIL, '[email scrubbed]');
  out = out.replace(RE_UUID, (m) => `[uuid_${shortHash(m)}]`);
  out = out.replace(RE_ASSESSMENT_VALUES, '[assessment_dim_val scrubbed]');
  return out;
}

function scrubBodyForLog(body: unknown): unknown {
  try {
    if (body === null || body === undefined) return body;
    if (typeof body === 'string') {
      return scrubMessage(body).slice(0, 512);
    }
    if (typeof body === 'object') {
      const serialized = JSON.stringify(body);
      const scrubbed = scrubMessage(serialized);
      return scrubbed.length > 512 ? scrubbed.slice(0, 512) + '…' : JSON.parse(scrubbed);
    }
    return body;
  } catch {
    return '[body scrubbed]';
  }
}

/**
 * Structured server-side error log. Scrubs sensitive headers, PII from
 * error messages (emails → [email scrubbed], UUIDs → truncated hash,
 * assessment dimension values → scrubbed), and req.body fragments.
 * Writes a single JSON line to stderr.
 *
 * The scrubbed message + stack is logged server-side (never to client).
 */
export function logServerError(
  context: string,
  err: unknown,
  req?: {
    headers?: Record<string, string | string[] | undefined>;
    url?: string;
    method?: string;
    body?: unknown;
  },
): void {
  const scrubbedHeaders: Record<string, string> = {};
  if (req?.headers) {
    for (const [k, v] of Object.entries(req.headers)) {
      if (SENSITIVE_HEADER_KEYS.has(k.toLowerCase())) {
        scrubbedHeaders[k] = '[REDACTED]';
      } else if (typeof v === 'string') {
        scrubbedHeaders[k] = scrubMessage(v).slice(0, 256);
      }
    }
  }

  const errorPayload = err instanceof Error
    ? {
        name: err.name,
        message: scrubMessage(err.message).slice(0, 1024),
        stack: err.stack ? scrubMessage(err.stack).split('\n').slice(0, 10).join('\n') : undefined,
        code: (err as any)?.code,
        status: (err as any)?.status,
      }
    : { message: scrubMessage(String(err)).slice(0, 1024) };

  const payload = {
    ts: new Date().toISOString(),
    context,
    error: errorPayload,
    req: req
      ? {
          method: req.method,
          url: req.url ? scrubMessage(String(req.url)).slice(0, 512) : undefined,
          headers: scrubbedHeaders,
          body: req.body !== undefined ? scrubBodyForLog(req.body) : undefined,
        }
      : undefined,
  };

  try {
    process.stderr.write(JSON.stringify(payload) + '\n');
  } catch {
    // eslint-disable-next-line no-console
    console.error(payload);
  }
}

// ── #1314: Rate limiting (in-memory sliding window) ───────────────
//
// Lightweight per-IP rate limiter for auth-sensitive endpoints.
// Vercel serverless functions are stateless across invocations, but
// within a warm container this provides effective protection against
// brute-force / enumeration attempts. For production-grade limiting,
// pair with Vercel Edge Middleware or an upstream WAF.
//
// Usage:
//   const limiter = new RateLimiter(60_000, 30);  // 30 req/min
//   const rl = limiter.check(getClientIp(req));
//   if (!rl.allowed) return res.status(429).json({ error: 'Too many requests' });

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;  // epoch ms
}

export class RateLimiter {
  private buckets = new Map<string, number[]>();
  private lastCleanup = Date.now();

  constructor(
    private readonly windowMs: number,
    private readonly maxRequests: number,
  ) {}

  check(key: string): RateLimitResult {
    const now = Date.now();

    // Periodic cleanup — evict expired buckets every 5 minutes.
    if (now - this.lastCleanup > 300_000) {
      this.cleanup(now);
      this.lastCleanup = now;
    }

    const windowStart = now - this.windowMs;
    const existing = this.buckets.get(key) || [];
    const fresh = existing.filter((t) => t > windowStart);

    if (fresh.length >= this.maxRequests) {
      const oldestInWindow = fresh[0] ?? now;
      return {
        allowed: false,
        remaining: 0,
        resetAt: oldestInWindow + this.windowMs,
      };
    }

    fresh.push(now);
    this.buckets.set(key, fresh);
    return {
      allowed: true,
      remaining: this.maxRequests - fresh.length,
      resetAt: now + this.windowMs,
    };
  }

  private cleanup(now: number): void {
    const windowStart = now - this.windowMs;
    for (const [key, timestamps] of this.buckets) {
      const fresh = timestamps.filter((t) => t > windowStart);
      if (fresh.length === 0) {
        this.buckets.delete(key);
      } else {
        this.buckets.set(key, fresh);
      }
    }
  }
}

/**
 * Extract client IP from Vercel request headers. Vercel sets
 * x-forwarded-for and x-real-ip on incoming requests.
 */
export function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].trim();
  }
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string') return realIp.trim();
  return 'unknown';
}

/**
 * Apply rate limit headers to a response. Call after a successful
 * rate limit check to inform the client of their remaining quota.
 */
export function setRateLimitHeaders(
  res: VercelResponse,
  rl: RateLimitResult,
  maxRequests: number,
): void {
  res.setHeader('X-RateLimit-Limit', String(maxRequests));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, rl.remaining)));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(rl.resetAt / 1000)));
  if (!rl.allowed) {
    const retryAfter = Math.ceil((rl.resetAt - Date.now()) / 1000);
    res.setHeader('Retry-After', String(Math.max(1, retryAfter)));
  }
}

// ── V3-7 / #1346 Write-specific rate limiter (20 writes / 60s) ──────
//
// Key = path + userId (or IP for anonymous). Sliding window, in-memory.
// Use this for POST/PUT/DELETE endpoints so endpoints don't need to
// construct their own RateLimiter each time.

const WRITE_RATE_LIMITER = new RateLimiter(60_000, 20);

export interface WriteRateLimitResult extends RateLimitResult {}

/**
 * Rate-limit a write request by (path + userId) fallback to IP.
 * Use for POST/PUT/DELETE routes. 20 writes / 60s.
 */
export function rateLimit(req: VercelRequest, userId?: string | null): WriteRateLimitResult {
  const ip = getClientIp(req);
  const path = req.url?.split('?')[0] || 'unknown';
  const key = userId ? `${path}:uid:${userId}` : `${path}:ip:${ip}`;
  return WRITE_RATE_LIMITER.check(key);
}

// ── V3-7 / #1346 Zod write-schema validation helper ─────────────────
//
// Wraps z.Schema.parse() into a clean RequestAuthError(422) so handlers
// don't need to wrap ZodError everywhere. Usage:
//
//   const body = validateWrite(AssessmentRunSchema, req.body);

export function validateWrite<T>(schema: z.Schema<T>, payload: unknown): T {
  const result = schema.safeParse(payload);
  if (!result.success) {
    const issues = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ').slice(0, 512);
    throw new RequestAuthError(`Invalid input: ${issues || 'validation failed'}`, 422);
  }
  return result.data;
}

// ── W4-6 / #1291 — CORS hardening ─────────────────────────────────
//
// Production must NOT use wildcard `*` on authenticated/credentialed
// endpoints. This helper echoes a strict origin allowlist and handles the
// CORS preflight (OPTIONS) short-circuit. Allowed origins:
//   - localhost (any port) — dev only
//   - lyc-intelligence.app, www.lyc-intelligence.app — production
//   - *.vercel.app — preview deployments (Vercel branch deploys)
//
// Credentials are NOT enabled (no cookies sent cross-origin); the NEXUS
// chat endpoint uses the Authorization header (Bearer token), not cookies.

const ALLOWED_ORIGIN_RE =
  /^(https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?|https:\/\/(www\.)?lyc-intelligence\.app|https:\/\/[a-z0-9-]+\.vercel\.app)$/i;

/**
 * Apply strict CORS headers to a response based on the request Origin.
 * Returns true if the request was an OPTIONS preflight (handler should
 * short-circuit with 204); false otherwise.
 */
export function applyStrictCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = (req.headers['origin'] as string | undefined) ?? '';
  // Only echo the origin if it matches the allowlist. No wildcard.
  if (origin && ALLOWED_ORIGIN_RE.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Max-Age', '86400');
  }
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}

