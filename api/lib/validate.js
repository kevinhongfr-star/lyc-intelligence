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
  parseFilters,
  parseOrderParam,
  parseSelectList,
  sanitizeObject,
  sanitizeString
};
