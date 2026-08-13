/**
 * Phase 17 / T02 (#1288) — Error monitoring.
 *
 * Client-side error capture:
 *   • React error boundary reporting (via reportError())
 *   • window.onerror (script errors)
 *   • window.onunhandledrejection (unhandled promise rejections)
 *   • API error wrapping for fetch() / authFetch() calls
 *
 * All errors go through `reportError()` which:
 *   1. Mirrors to trackEvent('client_error', ...) → /api/events buffer
 *   2. Logs to console.error for local debugging
 *   3. Samples low-severity errors to avoid flooding logs
 *
 * Error severity buckets used by alerting:
 *   critical  — errors impacting >10% DAU or fatal crash
 *   error     — standard unhandled / boundary / unhandled rejection
 *   warning   — non-fatal (API 4xx under load, failed secondary call)
 */

import { trackEvent, scrubPII } from './eventTracker';

export type ErrorSeverity = 'critical' | 'error' | 'warning';

export interface ReportedErrorContext {
  scope?: string;
  componentStack?: string;
  api?: { url: string; status?: number; method?: string };
  user?: { id?: string; role?: string };
  extra?: Record<string, unknown>;
  severity?: ErrorSeverity;
}

// ── V3-5 / #1345 Error-message PII scrubbers ────────────────────────
const RE_EMAIL = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const RE_UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const RE_LONG_ASSESSMENT_BLOB = /\b(assessment|result|profile|answers|dimension)[:\s]*["']?\{[^]{120,}\}/gi;

function shortHash(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ('0000000' + Math.abs(h >>> 0).toString(16)).slice(-8);
}

export function scrubErrorMessage(raw: string): string {
  if (!raw) return raw;
  let out = String(raw);
  out = out.replace(RE_EMAIL, '[email scrubbed]');
  out = out.replace(RE_UUID, (m) => `[uuid_${shortHash(m)}]`);
  out = out.replace(RE_LONG_ASSESSMENT_BLOB, (m) => `[assessment_results len=${m.length} scrubbed]`);
  return out;
}

function normalizeError(err: unknown): { name: string; message: string; stack?: string } {
  if (err instanceof Error) {
    const msg = scrubErrorMessage(err.message);
    const stack = err.stack ? scrubErrorMessage(err.stack) : undefined;
    return { name: err.name, message: msg, stack };
  }
  const str = typeof err === 'string' ? err : JSON.stringify(err ?? null);
  return { name: 'UnknownError', message: scrubErrorMessage(str) };
}

/** Sampled reporting — warning-level errors only fire on ~10% of sessions. */
const WARNING_SAMPLE_RATE = 0.1;
function shouldSample(severity: ErrorSeverity): boolean {
  if (severity !== 'warning') return true;
  try {
    let v = sessionStorage.getItem('lyc:sample_w');
    if (!v) {
      v = Math.random().toString(36).slice(2, 6);
      sessionStorage.setItem('lyc:sample_w', v);
    }
    // Deterministic per-session: hash string to bool by first byte
    return (v.charCodeAt(0) % 10) < Math.ceil(WARNING_SAMPLE_RATE * 10);
  } catch {
    return false;
  }
}

/**
 * Report a caught or uncaught error to the analytics/error sink.
 * Safe to call from anywhere (React render, event handlers, fetch catch).
 */
export function reportError(err: unknown, ctx: ReportedErrorContext = {}): void {
  const severity: ErrorSeverity = ctx.severity ?? 'error';
  if (!shouldSample(severity)) return;

  const { name, message, stack } = normalizeError(err);

  if (severity === 'warning') {
    console.warn('[lyc:warn]', name, message, scrubPII(ctx));
  } else {
    console.error('[lyc:error]', name, message, scrubPII(ctx));
  }

  const safeCtx = scrubPII(ctx);
  const safeApi = ctx.api
    ? {
        url: scrubErrorMessage(ctx.api.url || ''),
        status: ctx.api.status,
        method: ctx.api.method,
      }
    : undefined;
  const safeUser = ctx.user
    ? {
        id: ctx.user.id ? `[user_${shortHash(ctx.user.id)}]` : undefined,
        role: ctx.user.role,
      }
    : undefined;

  const props: Record<string, unknown> = {
    error_name: name,
    error_message: message,
    stack,
    severity,
  };
  if (safeCtx.scope) props.scope = safeCtx.scope;
  if (ctx.componentStack) props.component_stack = scrubErrorMessage(ctx.componentStack);
  if (safeApi) props.api = safeApi;
  if (safeCtx.extra) props.extra = safeCtx.extra;
  if (safeUser) props.user = safeUser;

  trackEvent(
    severity === 'critical' ? 'client_error_critical' : 'client_error',
    props,
    { mirrorToVercelAnalytics: severity === 'critical' || severity === 'error' },
  );
}

/**
 * Wrap an async function (typically an API call) with a try/catch that
 * reports 4xx/5xx responses as errors. Returns [ok, data, error] tuple
 * so callers can handle gracefully without throwing.
 *
 *   const [ok, data, err] = await wrapApiCall('/api/foo', () => fetchJSON('/api/foo'));
 */
export async function wrapApiCall<T>(
  url: string,
  fn: () => Promise<T>,
  scope = 'api',
): Promise<[ok: true, data: T, err: null] | [ok: false, data: null, err: unknown]> {
  try {
    const result = await fn();
    return [true, result, null] as const;
  } catch (e) {
    const status =
      e && typeof e === 'object' && 'status' in e
        ? (e as { status?: number }).status
        : undefined;
    const severity: ErrorSeverity =
      status && status >= 500 ? 'error' : status && status >= 400 ? 'warning' : 'error';
    reportError(e, { scope, severity, api: { url, status } });
    return [false, null, e] as const;
  }
}

// ── Global error / rejection wiring (idempotent, safe in SSR) ───────

let wired = false;

export function installGlobalErrorHandlers(): void {
  if (wired || typeof window === 'undefined') return;
  wired = true;

  window.addEventListener('error', (ev) => {
    // Ignore cross-origin script errors without detail (ad blockers, etc.)
    if (ev.message && ev.message.includes('Script error') && !ev.lineno) return;
    reportError(new Error(`${ev.message} (${ev.filename}:${ev.lineno}:${ev.colno})`), {
      scope: 'window:error',
      severity: ev.error ? 'error' : 'warning',
    });
  });

  window.addEventListener('unhandledrejection', (ev) => {
    reportError(ev.reason ?? 'Unhandled promise rejection', {
      scope: 'window:unhandledrejection',
      severity: 'error',
    });
  });
}
