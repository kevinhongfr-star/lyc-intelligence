import { RequestAuthError } from "./auth.js";
const RE_COLUMN_NAME = /^[a-z_][a-z0-9_]{0,62}$/;
const RE_ENTITY_NAME = /^[a-z_][a-z0-9_]{0,62}$/;
const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RE_EMAIL = /^[^\s@<>]{1,64}@[^\s@<>]{1,253}\.[^\s@<>]{2,63}$/;
const RE_CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
const DEFAULT_BODY_LIMIT = 256 * 1024;
const DEFAULT_STRING_LIMIT = 8 * 1024;
const DEFAULT_ARRAY_LIMIT = 500;
function assertColumnName(name) {
  if (typeof name !== "string" || !RE_COLUMN_NAME.test(name)) {
    throw new RequestAuthError(`Invalid column name: "${name}"`, 422);
  }
}
function assertEntityName(name) {
  if (typeof name !== "string" || !RE_ENTITY_NAME.test(name)) {
    throw new RequestAuthError(`Invalid entity name: "${name}"`, 422);
  }
}
function assertUuid(value, field = "id") {
  if (typeof value !== "string" || !RE_UUID.test(value)) {
    throw new RequestAuthError(`Invalid ${field}: must be a UUID`, 422);
  }
}
function assertEmail(value) {
  if (typeof value !== "string" || !RE_EMAIL.test(value)) {
    throw new RequestAuthError("Invalid email address", 422);
  }
}
function assertOneOf(value, allowed, field = "value") {
  if (!allowed.includes(value)) {
    throw new RequestAuthError(
      `Invalid ${field}: must be one of ${allowed.join(", ")}`,
      422
    );
  }
  return value;
}
function sanitizeString(value, maxLength = DEFAULT_STRING_LIMIT) {
  if (typeof value !== "string") return "";
  const stripped = value.replace(RE_CONTROL_CHARS, "");
  const normalized = stripped.normalize("NFC");
  return normalized.length > maxLength ? normalized.slice(0, maxLength) : normalized;
}
function sanitizeObject(value, opts = {}) {
  const maxDepth = opts.maxDepth ?? 12;
  const maxStringLength = opts.maxStringLength ?? DEFAULT_STRING_LIMIT;
  const maxArrayLength = opts.maxArrayLength ?? DEFAULT_ARRAY_LIMIT;
  function walk(v, depth) {
    if (depth > maxDepth) return null;
    if (v === null || v === void 0) return v;
    if (typeof v === "string") {
      return sanitizeString(v, maxStringLength);
    }
    if (typeof v === "number") {
      return Number.isFinite(v) ? v : null;
    }
    if (typeof v === "boolean") return v;
    if (Array.isArray(v)) {
      return v.slice(0, maxArrayLength).map((item) => walk(item, depth + 1));
    }
    if (typeof v === "object") {
      const out = {};
      for (const [k, val] of Object.entries(v)) {
        if (!RE_COLUMN_NAME.test(k) || k.startsWith("__")) continue;
        if (k === "__proto__" || k === "constructor" || k === "prototype") continue;
        out[k] = walk(val, depth + 1);
      }
      return out;
    }
    return null;
  }
  return walk(value, 0);
}
function clampInt(value, min, max, fallback = 0) {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(n)) return fallback;
  const i = Math.trunc(n);
  return Math.max(min, Math.min(max, i));
}
function assertBodySize(body, limit = DEFAULT_BODY_LIMIT) {
  let size;
  if (body === void 0 || body === null) {
    size = 0;
  } else if (typeof body === "string") {
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
      413
    );
  }
}
function parseJsonBody(req, opts = {}) {
  const raw = req.body;
  if (raw !== null && raw !== void 0 && typeof raw === "object" && !Array.isArray(raw)) {
    return sanitizeObject(raw, opts);
  }
  if (Array.isArray(raw)) {
    return sanitizeObject(raw, opts);
  }
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (trimmed === "") return {};
    try {
      const parsed = JSON.parse(trimmed);
      return sanitizeObject(parsed, opts);
    } catch {
      throw new RequestAuthError("Malformed JSON body", 400);
    }
  }
  if (raw === void 0 || raw === null) return {};
  throw new RequestAuthError("Invalid request body", 400);
}
const DEFAULT_MAX_URL_LENGTH = 4096;
function assertUrlLength(req, max = DEFAULT_MAX_URL_LENGTH) {
  const url = req.url ?? "";
  if (url.length > max) {
    throw new RequestAuthError("URI too long", 414);
  }
}
function handleApiError(res, err, context, req) {
  if (err instanceof RequestAuthError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  logServerError(context, err, req);
  res.status(500).json({ error: "Internal server error" });
}
function parseFilters(query, allowedOps = ["eq", "neq", "gt", "lt", "gte", "lte", "in", "like"]) {
  const out = [];
  for (const op of allowedOps) {
    const raw = query[op];
    if (!raw) continue;
    const pairs = Array.isArray(raw) ? raw : [raw];
    for (const pair of pairs) {
      const sep = pair.indexOf(":");
      if (sep <= 0) continue;
      const col = pair.slice(0, sep);
      const val = pair.slice(sep + 1);
      assertColumnName(col);
      out.push({
        column: col,
        op,
        value: sanitizeString(val, 1024)
      });
    }
  }
  return out;
}
function parseOrderParam(raw) {
  if (!raw) return null;
  const [col, dir] = raw.split(":");
  assertColumnName(col);
  return { column: col, ascending: (dir ?? "asc") === "asc" };
}
function parseSelectList(raw) {
  if (!raw) return ["*"];
  const s = Array.isArray(raw) ? raw[0] : raw;
  const cols = s.split(",").map((c) => c.trim()).filter(Boolean);
  if (cols.length === 0) return ["*"];
  for (const c of cols) {
    if (c === "*") continue;
    assertColumnName(c);
  }
  return cols;
}
const SUPABASE_ERROR_MAP = {
  // PostgREST error codes (https://postgrest.org/en/stable/api.html#errors)
  "PGRST116": "Resource not found",
  "PGRST204": "No content available",
  "PGRST301": "Invalid request parameters",
  "PGRST302": "Invalid filter syntax",
  // Postgres SQLSTATE codes (subset that surface to clients)
  "23505": "Resource already exists",
  // unique_violation
  "23503": "Referenced resource does not exist",
  // foreign_key_violation
  "23502": "Missing required field",
  // not_null_violation
  "23514": "Invalid input",
  // check_violation
  "42501": "Permission denied",
  // insufficient_privilege
  "42601": "Invalid request",
  // syntax_error
  "22001": "Input too long",
  // string_data_right_truncation
  "22003": "Numeric value out of range",
  // numeric_value_out_of_range
  "22008": "Invalid datetime",
  // datetime_field_overflow
  "22023": "Invalid parameter type",
  // invalid_parameter_value
  "42P01": "Service unavailable",
  // undefined_table (config issue)
  "42703": "Service unavailable",
  // undefined_column (config issue)
  "40001": "Conflict, please retry",
  // serialization_failure
  "40P01": "Conflict, please retry"
  // deadlock_detected
};
function safeErrorMessage(err, fallback = "Internal server error") {
  if (!err) return fallback;
  if (err instanceof RequestAuthError) {
    return err.message;
  }
  const any = err;
  if (any?.code && typeof any.code === "string") {
    const mapped = SUPABASE_ERROR_MAP[any.code];
    if (mapped) return mapped;
    if (any.code.startsWith("PGRST") || any.code.match(/^[0-9A-Z]{5}$/)) {
      return fallback;
    }
  }
  if (err instanceof Error) {
    const msg = err.message || "";
    if (/^Network error|^Failed to fetch|^Timeout|^Invalid\b|^Missing\b/i.test(msg)) {
      return msg;
    }
  }
  return fallback;
}
function safeErrorStatus(err, fallback = 500) {
  if (err instanceof RequestAuthError) return err.status;
  const code = err?.code;
  if (typeof code === "string") {
    if (code === "23505") return 409;
    if (code === "23503") return 400;
    if (code === "23502") return 422;
    if (code === "42501") return 403;
    if (code === "PGRST116") return 404;
    if (code?.startsWith("PGRST")) return 400;
    if (code?.match(/^22/)) return 422;
    if (code?.match(/^23/)) return 409;
    if (code?.match(/^42/)) return 500;
  }
  return fallback;
}
const SENSITIVE_HEADER_KEYS = /* @__PURE__ */ new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
  "x-anonymous-id",
  "x-supabase-key",
  "api-key"
]);
function logServerError(context, err, req) {
  const scrubbedHeaders = {};
  if (req?.headers) {
    for (const [k, v] of Object.entries(req.headers)) {
      if (SENSITIVE_HEADER_KEYS.has(k.toLowerCase())) {
        scrubbedHeaders[k] = "[REDACTED]";
      } else if (typeof v === "string") {
        scrubbedHeaders[k] = v.slice(0, 256);
      }
    }
  }
  const payload = {
    ts: (/* @__PURE__ */ new Date()).toISOString(),
    context,
    error: err instanceof Error ? {
      name: err.name,
      message: err.message,
      stack: err.stack?.split("\n").slice(0, 10).join("\n"),
      code: err?.code,
      status: err?.status
    } : { message: String(err).slice(0, 1024) },
    req: req ? {
      method: req.method,
      url: req.url ? String(req.url).slice(0, 512) : void 0,
      headers: scrubbedHeaders
    } : void 0
  };
  try {
    process.stderr.write(JSON.stringify(payload) + "\n");
  } catch {
    console.error(payload);
  }
}
class RateLimiter {
  constructor(windowMs, maxRequests) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }
  windowMs;
  maxRequests;
  buckets = /* @__PURE__ */ new Map();
  lastCleanup = Date.now();
  check(key) {
    const now = Date.now();
    if (now - this.lastCleanup > 3e5) {
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
        resetAt: oldestInWindow + this.windowMs
      };
    }
    fresh.push(now);
    this.buckets.set(key, fresh);
    return {
      allowed: true,
      remaining: this.maxRequests - fresh.length,
      resetAt: now + this.windowMs
    };
  }
  cleanup(now) {
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
function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].trim();
  }
  const realIp = req.headers["x-real-ip"];
  if (typeof realIp === "string") return realIp.trim();
  return "unknown";
}
function setRateLimitHeaders(res, rl, maxRequests) {
  res.setHeader("X-RateLimit-Limit", String(maxRequests));
  res.setHeader("X-RateLimit-Remaining", String(Math.max(0, rl.remaining)));
  res.setHeader("X-RateLimit-Reset", String(Math.ceil(rl.resetAt / 1e3)));
  if (!rl.allowed) {
    const retryAfter = Math.ceil((rl.resetAt - Date.now()) / 1e3);
    res.setHeader("Retry-After", String(Math.max(1, retryAfter)));
  }
}
export {
  DEFAULT_ARRAY_LIMIT,
  DEFAULT_BODY_LIMIT,
  DEFAULT_MAX_URL_LENGTH,
  DEFAULT_STRING_LIMIT,
  RateLimiter,
  assertBodySize,
  assertColumnName,
  assertEmail,
  assertEntityName,
  assertOneOf,
  assertUrlLength,
  assertUuid,
  clampInt,
  getClientIp,
  handleApiError,
  logServerError,
  parseFilters,
  parseJsonBody,
  parseOrderParam,
  parseSelectList,
  safeErrorMessage,
  safeErrorStatus,
  sanitizeObject,
  sanitizeString,
  setRateLimitHeaders,
  // ── V3-7 / #1346 Write rate limiter + Zod validator + strict CORS ───────
  // Added during Batch1 security pass. Missing in prior compiled artifact;
  // these exports are referenced by /assessments/run, /assessments/meta,
  // /reports/pdf, /events, /data/[entity], /chat. Without these symbols the
  // serverless handler fails to import at cold-start → 404 on every route.
  // Implementation is line-for-line behavior-compatible with _lib_src/validate.ts.
  WRITE_RATE_LIMITER_internal,
  rateLimit,
  validateWrite,
  applyStrictCors,
};

// ═══════════════════════════════════════════════════════════════════════════
// V3-7 / #1346 Write rate limiter (20 writes / 60s, sliding window)
// ═══════════════════════════════════════════════════════════════════════════
const WRITE_RATE_LIMITER_internal = new RateLimiter(60_000, 20);

/**
 * @param {any} req Vercel request
 * @param {string|null|undefined} [userId] authenticated user id (if any)
 * @returns {{ allowed: boolean, remaining: number, resetAt: number }}
 */
function rateLimit(req, userId) {
  const ip = getClientIp(req);
  const path = (req.url && req.url.split('?')[0]) || 'unknown';
  const key = userId ? `${path}:uid:${userId}` : `${path}:ip:${ip}`;
  return WRITE_RATE_LIMITER_internal.check(key);
}

// ═══════════════════════════════════════════════════════════════════════════
// V3-7 / #1346 Zod write-schema validator (throws RequestAuthError 422)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @template T
 * @param {{ safeParse: (p: unknown) => { success: boolean, error?: { issues: Array<{path: Array<string|number>, message: string}> } }, data: T }} schema Zod schema
 * @param {unknown} payload Raw untrusted input
 * @returns {T}
 */
function validateWrite(schema, payload) {
  const result = schema.safeParse(payload);
  if (!result.success) {
    const issues = (result.error?.issues || [])
      .map((i) => `${(i.path || []).join('.')}: ${i.message}`)
      .join('; ')
      .slice(0, 512);
    const err = new Error(`Invalid input: ${issues || 'validation failed'}`);
    // Marker so callers can coerce to a RequestAuthError 422.
    err.name = 'ValidationError';
    err.status = 422;
    err.code = 'VALIDATION';
    throw err;
  }
  return result.data;
}

// ═══════════════════════════════════════════════════════════════════════════
// W4-6 / #1291 — Strict CORS (no wildcard). Matches _lib_src/validate.ts.
// ═══════════════════════════════════════════════════════════════════════════
const ALLOWED_ORIGIN_RE_src =
  /^(https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?|https:\/\/(www\.)?lyc-intelligence\.app|https:\/\/[a-z0-9-]+\.vercel\.app)$/i;

/**
 * Apply strict CORS headers based on request origin.
 * @param {any} req Vercel request
 * @param {any} res Vercel response
 * @returns {boolean} true if caller should short-circuit with 204 (preflight)
 */
function applyStrictCors(req, res) {
  const origin = (req.headers && (req.headers.origin || req.headers.Origin)) || '';
  if (origin && ALLOWED_ORIGIN_RE_src.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-anonymous-id');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Max-Age', '86400');
  }
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}
