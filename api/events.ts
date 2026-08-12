/**
 * Phase 17 / T02 (#1288) — Single event ingestion endpoint.
 *
 * Receives POST /api/events with:
 *   { events: BaseEvent[], v: 1 }
 *
 * Behavior:
 *   1. Validates payload shape and drops malformed events.
 *   2. Logs structured JSON to stdout so Vercel Runtime Logs captures them.
 *      (Vercel forwards logs to configured log drains; no extra infra needed.)
 *   3. Keeps a rolling in-memory summary (per-event counts) for lightweight
 *      `GET /api/events?stats=1` inspection in admin dashboards.
 *   4. Returns 204 No Content to the client.
 *
 * Critical error rate check: when `client_error_critical` rate in a sliding
 * 1-minute window exceeds 1% of page_view events in that same window, the
 * admin team gets a console-level marker (CRITICAL_ERR_SPIKE). This surfaces
 * in log drains / alerting integrations without needing webhooks here.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { assertBodySize, sanitizeObject, DEFAULT_BODY_LIMIT, DEFAULT_ARRAY_LIMIT } from './lib/validate.js';

interface EventShape {
  name: string;
  timestamp: string;
  props?: Record<string, unknown>;
  user?: { id?: string; role?: string };
  ctx?: {
    url?: string;
    path?: string;
    referrer?: string;
    sessionId?: string;
  };
  funnel?: Record<string, unknown>;
}

interface WindowStat {
  pageViews: number;
  criticalErrors: number;
  bucketStart: number;
}

const WINDOW_MS = 60 * 1000;
let window: WindowStat = { pageViews: 0, criticalErrors: 0, bucketStart: Date.now() };

function rotateWindow(now: number): void {
  if (now - window.bucketStart > WINDOW_MS) {
    // If threshold was breached, log spike marker
    const errRate =
      window.pageViews > 0 ? window.criticalErrors / window.pageViews : 0;
    if (errRate > 0.01 && window.pageViews >= 10) {
      console.log(
        '[LYC][CRITICAL_ERR_SPIKE] 1-min window: rate=' +
          errRate.toFixed(3) +
          ' pageviews=' +
          window.pageViews +
          ' critical_errors=' +
          window.criticalErrors,
      );
    }
    window = { pageViews: 0, criticalErrors: 0, bucketStart: now };
  }
}

function isEventShape(o: unknown): o is EventShape {
  return (
    typeof o === 'object' &&
    o !== null &&
    typeof (o as EventShape).name === 'string' &&
    typeof (o as EventShape).timestamp === 'string'
  );
}

export default function handler(req: VercelRequest, res: VercelResponse): void {
  if (req.method === 'GET') {
    const { stats } = req.query;
    if (stats === '1') {
      res.status(200).json({
        ok: true,
        window: {
          ...window,
          ageMs: Date.now() - window.bucketStart,
          criticalRate:
            window.pageViews > 0 ? window.criticalErrors / window.pageViews : 0,
        },
      });
      return;
    }
    res.status(404).json({ ok: false, error: 'not found' });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method not allowed' });
    return;
  }

  const body = req.body;
  // #1309: enforce body size limit + sanitize. Events are logged to stdout
  // and forwarded to log drains — strip control chars and cap array length
  // to prevent log injection and DoS.
  try {
    assertBodySize(body, DEFAULT_BODY_LIMIT);
  } catch {
    res.status(413).json({ ok: false, error: 'payload too large' });
    return;
  }
  const sanitizedBody = sanitizeObject(body, {
    maxDepth: 6,
    maxStringLength: 4096,
    maxArrayLength: 200,  // cap events per request
  }) as { events?: unknown[] } | null;
  const events: unknown[] = Array.isArray(sanitizedBody?.events)
    ? sanitizedBody!.events.slice(0, DEFAULT_ARRAY_LIMIT)
    : [];

  const now = Date.now();
  rotateWindow(now);

  for (const raw of events) {
    if (!isEventShape(raw)) continue;
    const name = raw.name;
    if (name === 'page_view') window.pageViews += 1;
    if (name === 'client_error_critical') window.criticalErrors += 1;

    // Structured log: [LYC] <name> userRole=.. path=.. sessionId=.. props={..}
    const safe = {
      name,
      ts: raw.timestamp,
      uid: raw.user?.id ?? null,
      role: raw.user?.role ?? null,
      path: raw.ctx?.path ?? null,
      ref: raw.ctx?.referrer ?? null,
      sid: raw.ctx?.sessionId ?? null,
      funnel: raw.funnel ?? null,
      props: raw.props ?? null,
    };
    console.log(`[LYC][evt] ${name} ` + JSON.stringify(safe));
  }

  res.status(204).end();
}
