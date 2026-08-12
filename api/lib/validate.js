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
export {
  DEFAULT_ARRAY_LIMIT,
  DEFAULT_BODY_LIMIT,
  DEFAULT_STRING_LIMIT,
  assertBodySize,
  assertColumnName,
  assertEmail,
  assertEntityName,
  assertOneOf,
  assertUuid,
  clampInt,
  logServerError,
  parseFilters,
  parseOrderParam,
  parseSelectList,
  safeErrorMessage,
  safeErrorStatus,
  sanitizeObject,
  sanitizeString
};
