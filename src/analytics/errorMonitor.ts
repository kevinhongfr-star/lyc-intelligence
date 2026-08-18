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

import { trackEvent } from './eventTracker';

export type ErrorSeverity = 'critical' | 'error' | 'warning';

export interface ReportedErrorContext {
  /** Where the error happened (component name, function, api path) */
  scope?: string;
  /** React component stack — populated by error boundary */
  componentStack?: string;
  /** Fetch URL / status when applicable */
  api?: { url: string; status?: number; method?: string };
  /** Role / user id snapshot (if available) */
  user?: { id?: string; role?: string };
  /** Free-form context */
  extra?: Record<string, unknown>;
  /** Severity override. Default: 'error' */
  severity?: ErrorSeverity;
}

function normalizeError(err: unknown): { name: string; message: string; stack?: string } {
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack };
  }
  const str = typeof err === 'string' ? err : JSON.stringify(err ?? null);
  return { name: 'UnknownError', message: str };
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

  // Always log for local debugging (filtered by browser)
  if (severity === 'warning') {
    console.warn('[lyc:warn]', name, message, ctx);
  } else {
    console.error('[lyc:error]', name, message, ctx);
  }

  const props: Record<string, unknown> = {
    error_name: name,
    error_message: message,
    stack,
    severity,
  };
  if (ctx.scope) props.scope = ctx.scope;
  if (ctx.componentStack) props.component_stack = ctx.componentStack;
  if (ctx.api) props.api = ctx.api;
  if (ctx.extra) props.extra = ctx.extra;

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
