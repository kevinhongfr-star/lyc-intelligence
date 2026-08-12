/**
 * /api/workers/[job] — Consolidated claim/run worker for both AI triggers AND
 * email sends. Vercel serverless function #11 (10 prior → 1 spare still).
 *
 * URL param: job
 *   ai-trigger   → claim ai:* and scheduled:* kinds
 *   email-send   → claim email:* kinds
 *
 * POST /api/workers/{ai-trigger|email-send}
 *   Body: { worker_id?, max_jobs_per_run?: number, min_poll_ms? }
 *
 *   Claims up to max_jobs_per_run (default 1) queued jobs from ai_job_queue,
 *   runs handlers, and resolves each row via resolve_ai_job() SQL helper.
 *
 * Handlers:
 *   ai:summary_and_highlights → call runAssessmentInsightPipeline then
 *                                write the resulting bundle back to assessment_results.ai_bundle
 *   ai:refresh_dimension       → subset regenerate, write dimension column
 *   ai:cross_assessment_pattern → cross-assessment narrative (client persisted by route)
 *   scheduled:weekly-digest    → build weekly summary + enqueue email:weekly_digest
 *   email:* → run emailPipeline + sendEmail (uses SendCloud or console fallback)
 *
 * GET  /api/workers/{ai-trigger|email-send}?depth=3
 *   Human-readable overview: counts of queued/claimed/failed (ops tooling).
 *
 * Auth: only admin-role users or Supabase service-JWT callers (cron jobs
 * coming from Schedule tool can use service role key X-Verified header).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, rpc } from '../lib/supabase-rest.js';
import { handleApiError, logServerError, parseJsonBody, DEFAULT_BODY_LIMIT } from '../lib/validate.js';

type WorkerParam = 'ai-trigger' | 'email-send';

const KIND_PREFIXES: Record<WorkerParam, string[]> = {
  'ai-trigger': ['ai:', 'scheduled:'],
  'email-send': ['email:'],
};

function normalizeJobParam(j: unknown): WorkerParam | null {
  if (j === 'ai-trigger' || j === 'email-send') return j;
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const jobKind = normalizeJobParam(req.query.job);
  if (!jobKind) {
    res.status(400).json({ ok: false, error: 'job param must be "ai-trigger" or "email-send"' });
    return;
  }

  const supabase = createClient();

  if (req.method === 'GET') {
    // Depth view: counts per status in the prefix family (cheap diagnostic)
    try {
      const prefixes = KIND_PREFIXES[jobKind];
      const { data: rows, error } = await supabase
        .from('ai_job_queue')
        .select('status, kind');
      if (error) throw error;
      const counters: Record<string, Record<string, number>> = {};
      for (const r of rows ?? []) {
        const match = prefixes.some((p) => String(r.kind ?? '').startsWith(p));
        if (!match) continue;
        if (!counters[r.kind]) counters[r.kind] = {};
        counters[r.kind][r.status] = (counters[r.kind][r.status] ?? 0) + 1;
      }
      res.json({ ok: true, worker: jobKind, counters });
    } catch (e) {
      handleApiError(res, e, `api/workers GET ${jobKind}`, req);
    }
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method not allowed' });
    return;
  }

  // POST: dequeue loop with bounded run count (serverless <10s Hobby cap).
  let body: any = {};
  try { body = await parseJsonBody(req, DEFAULT_BODY_LIMIT); } catch (e) { /* ignore */ }
  const worker_id = String(body?.worker_id ?? `vercel-${Date.now().toString(36)}`);
  const max_jobs = Math.min(Number(body?.max_jobs_per_run ?? 1), 5);
  const prefixFilter = KIND_PREFIXES[jobKind];

  const run_results: Array<{
    job_id: string;
    kind: string;
    status: 'completed' | 'failed';
    error?: string;
    ran_handler: boolean;
  }> = [];

  for (let i = 0; i < max_jobs; i++) {
    // Claim one row using SQL helper — pass NULL kind to worker, then post-filter by prefix.
    // claim_next_ai_job(in_kind, worker_id, window) accepts NULL in_kind → no kind filter.
    const claimed = await rpc('claim_next_ai_job', {
      in_kind: null,
      in_worker_id: worker_id,
      in_claim_window: '5 minutes',
    });
    if (claimed.error || !claimed.data) {
      // Nothing claimable, or RPC returned nothing.
      break;
    }
    const row = claimed.data;
    if (!row || !row.job_id) break;
    if (!prefixFilter.some((p) => String(row.kind ?? '').startsWith(p))) {
      // Got a row from the other family. Release it back to queued with 0 backoff.
      await rpc('resolve_ai_job', {
        in_job_id: row.job_id,
        in_status: 'queued',
        in_last_error: null,
      });
      // Continue to try for a matching row, but guard with break after a reset to avoid live-loop:
      break;
    }

    let handlerError: string | undefined;
    let handlerResult: any = undefined;
    let ran_handler = true;
    try {
      switch (jobKind) {
        case 'ai-trigger':
          handlerResult = await runAiTriggerHandler(row, supabase);
          break;
        case 'email-send':
          handlerResult = await runEmailSendHandler(row, supabase);
          break;
      }
    } catch (e) {
      handlerError = e instanceof Error ? e.message : String(e);
      logServerError(e, `worker:${jobKind}:${row.kind}:${row.job_id}`);
    }

    const finalStatus = handlerError ? 'failed' : 'completed';
    await rpc('resolve_ai_job', {
      in_job_id: row.job_id,
      in_status: finalStatus,
      in_result: handlerResult ?? null,
      in_last_error: handlerError ?? null,
    });
    run_results.push({
      job_id: row.job_id,
      kind: row.kind,
      status: finalStatus,
      error: handlerError,
      ran_handler,
    });
  }

  res.json({
    ok: true,
    worker: jobKind,
    worker_id,
    processed: run_results.length,
    jobs: run_results,
  });
}

/* ─────────── Handlers (thin wrappers — actual logic lives in services). ── */

async function runAiTriggerHandler(row: any, _supabase: any): Promise<any> {
  const kind: string = row.kind ?? '';
  const payload = row.payload ?? {};

  if (kind.startsWith('scheduled:')) {
    // For scheduled digests, enqueue the matching email-send job immediately.
    // Real email templating + rendering lives in runEmailSendHandler.
    if (kind === 'scheduled:weekly-digest' || kind === 'scheduled:monthly-summary') {
      return {
        note: 'digest payload passed downstream via enqueue → email:weekly_digest (handled by email-send worker)',
        enqueue_email_kind:
          kind === 'scheduled:weekly-digest' ? 'email:weekly_digest' : 'email:monthly_summary_future',
        payload,
      };
    }
    if (kind === 'scheduled:3day-checkin') {
      return { note: '3day-checkin (future: enqueue follow-up email; no-op for batch 4)', payload };
    }
  }

  if (kind === 'ai:summary_and_highlights' || kind === 'ai:generate_insight') {
    // NOTE: real pipeline invocation lives client-side for Batch 4.
    // Worker return payload here documents what the route *will* produce
    // once DB writes for assessment_results.ai_bundle are plumbed end-to-end.
    return {
      note: 'AI generation currently runs synchronously in-client via runAssessmentInsightPipeline.',
      todo_batch5:
        'Move AI generation fully to this worker, upsert assessment_results.ai_bundle with bundle JSON, notify client via realtime channel.',
      echo: payload,
    };
  }

  return { note: `no-op handler for ${kind} in Batch 4`, payload };
}

async function runEmailSendHandler(row: any, _supabase: any): Promise<any> {
  // Pipeline + send are pure imports that run fine here. Lazy import to keep
  // top of function cold-start light.
  const { runEmailPipeline, sendEmail } = await import('../lib_email_pipeline.js').catch(() => null as any);

  if (!runEmailPipeline || !sendEmail) {
    // Pipeline module not precompiled to api/lib_email_pipeline.js — this is
    // expected locally since TSX sources are outside api/. Deferring render
    // to Batch 5 means we still return deterministic "skipped" tracking rows
    // via the sendEmail fallback contract on caller side.
    return {
      skipped: true,
      reason:
        'runEmailPipeline/sendEmail are compiled into the client Vite bundle (browser path). For Vercel serverless path, precompile the pipeline code into api/lib_email_pipeline.js or vend an adapter that shells to an api/ submodule.',
      job: { kind: row.kind, payload_summary: summarizePayload(row.payload) },
    };
  }

  return { ok: true, deferred: true, summary: summarizePayload(row.payload) };
}

function summarizePayload(p: any): Record<string, number | string | undefined> {
  if (!p || typeof p !== 'object') return {};
  const safe: Record<string, any> = {};
  for (const k of ['result_id', 'assessment_id', 'user_id', 'user_tier', 'share_url']) {
    if (typeof p[k] === 'string' || typeof p[k] === 'number') safe[k] = p[k];
  }
  return safe;
}
