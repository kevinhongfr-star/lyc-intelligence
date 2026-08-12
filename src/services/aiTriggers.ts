/**
 * services/aiTriggers.ts — #100/#1345 B2C Assessment AI Triggers
 *
 * Trigger taxonomy (per amendment #1345):
 *
 * MANUAL — user-initiated UI buttons on the result page:
 *   generate_insight    → enqueue ai-trigger kind=ai:generate_insight
 *   refresh_dimension   → enqueue ai-trigger kind=ai:refresh_dimension
 *   nexus_discuss       → enqueue ai-trigger kind=ai:nexus_discuss_promptseed
 *   export_pdf          → enqueue async ai-trigger (delegates to #89 worker, sends email link)
 *   email_share_result  → enqueue email-send kind=email:share_result
 *
 * AUTO — triggered by database events (Supabase pg_net webhook) or app hooks:
 *   assessment_complete → immediately enqueue ai-trigger kind=ai:summary_and_highlights
 *                           + if 2+ results exist, enqueue ai-trigger kind=ai:cross_assessment_pattern
 *   nexus_chat_reference → when user references a result by slug inside chat, enqueue
 *                           ai-trigger kind=ai:nexus_refresh_bundle (context pre-load)
 *
 * SCHEDULED — handled via Schedule tool in companion app, or db cron extension
 *   weekly_digest      Monday 9am local → ai-trigger kind=scheduled:weekly-digest
 *   monthly_summary    1st of month → scheduled:monthly-summary
 *   3day_checkin       3 days after each completed assessment → scheduled:3day-checkin
 *
 * All manual and auto enqueue calls go through enqueueAiJob(), which writes
 * to the ai_job_queue table and returns a { job_id } payload. The same
 * consolidated worker route (api/workers/[job].ts) dequeues both ai-trigger
 * and email-send jobs to stay under the Vercel Hobby 12 fn cap.
 */

import { randomUUID } from 'crypto';
import type { TierKey } from '@/config/tierConfig';
import type { DiagnosticSlug } from '@/types/assessment';

export const AI_JOB_KINDS = [
  'ai:generate_insight',
  'ai:refresh_dimension',
  'ai:nexus_discuss_promptseed',
  'ai:summary_and_highlights',
  'ai:cross_assessment_pattern',
  'ai:nexus_refresh_bundle',
  'scheduled:weekly-digest',
  'scheduled:monthly-summary',
  'scheduled:3day-checkin',
  'email:share_result',
  'email:assessment_complete',
  'email:weekly_digest',
  'email:export_pdf_complete',
] as const;
export type AiJobKind = (typeof AI_JOB_KINDS)[number];

export interface AiJobBase<Kind extends AiJobKind, P = unknown> {
  kind: Kind;
  payload: P;
  available_at?: Date;
  priority?: 10 | 20 | 50 | 80 | 100;
  tenant_user_id?: string;
  created_by_user?: string;
}

/* ── Per-kind payload types ───────────────────────────────────────── */

export interface GenerateInsightPayload {
  intent: 'summary' | 'strengths' | 'growth' | 'next_steps' | 'all';
  result_id: string;
  assessment_id: DiagnosticSlug;
  user_tier: TierKey;
  user_id: string;
}
export interface RefreshDimensionPayload extends GenerateInsightPayload {
  dimension_key: string;
}
export interface DiscussPromptseedPayload {
  result_id: string;
  assessment_id: DiagnosticSlug;
  user_tier: TierKey;
  user_id: string;
  suggested_prompt: string;
}
export interface SummaryAndHighlightsPayload {
  result_id: string;
  assessment_id: DiagnosticSlug;
  user_tier: TierKey;
  user_id: string;
  run_synchronously_if_template_enabled?: boolean;
}
export interface CrossAssessmentPayload {
  user_id: string;
  user_tier: TierKey;
  result_ids: string[];
  requested_at?: Date;
}
export interface ScheduledDigestPayload {
  user_id: string;
  user_tier: TierKey;
  window_start: string; // ISO
  window_end: string;   // ISO
  timezone?: string;
}
export interface ShareResultPayload {
  result_id: string;
  assessment_id: DiagnosticSlug;
  sender_name: string;
  sender_email: string;
  recipient_email: string;
  recipient_name?: string;
  sender_note?: string;
  share_url: string;
  user_tier: TierKey;
}
export interface AssessmentCompletePayload {
  result_id: string;
  assessment_id: DiagnosticSlug;
  overall_score: number;
  recipient_name: string;
  recipient_email: string;
  share_url: string;
  user_tier: TierKey;
}
export interface ExportPdfCompletePayload {
  result_id: string;
  assessment_id: DiagnosticSlug;
  user_id: string;
  user_tier: TierKey;
  download_url: string;
  filename: string;
}

/* ── Enqueue helper (SQL adapter contract) ────────────────────────── */

export interface EnqueueResult {
  job_id: string;
  kind: AiJobKind;
  estimated_ready_at: string;
}

/**
 * Enqueue function — accepts a SQL writer so the same pipeline works in
 * Vercel serverless routes (direct Supabase client) and unit tests (in-memory).
 */
export async function enqueueAiJob<Kind extends AiJobKind, P>(
  job: AiJobBase<Kind, P>,
  writer: {
    insert: (row: {
      kind: string;
      payload: unknown;
      available_at: Date;
      priority: number;
      tenant_user_id?: string;
      created_by_user?: string;
    }) => Promise<{ job_id: string }>;
    now?: () => Date;
  },
): Promise<EnqueueResult> {
  const now = writer.now ? writer.now() : new Date();
  const available_at = job.available_at ?? now;
  const priority = job.priority ?? 50;
  const { job_id } = await writer.insert({
    kind: job.kind,
    payload: job.payload,
    available_at,
    priority,
    tenant_user_id: job.tenant_user_id,
    created_by_user: job.created_by_user,
  });
  // Rough SLA: priority 10 (urgent) < 10s; 20 < 60s; 50 < 5min; 80/100 scheduled
  const delayMs =
    priority === 10 ? 10_000 :
    priority === 20 ? 60_000 :
    priority === 50 ? 5 * 60_000 :
    Math.max(0, +available_at - +now);
  return {
    job_id,
    kind: job.kind,
    estimated_ready_at: new Date(+now + delayMs).toISOString(),
  };
}

/* ── Manual trigger constructors ──────────────────────────────────── */

export const MANUAL_TRIGGERS = {
  generate_insight(opts: {
    result_id: string;
    assessment_id: DiagnosticSlug;
    user_tier: TierKey;
    user_id: string;
    intent?: GenerateInsightPayload['intent'];
  }): AiJobBase<'ai:generate_insight', GenerateInsightPayload> {
    return {
      kind: 'ai:generate_insight',
      priority: 10,
      created_by_user: opts.user_id,
      tenant_user_id: opts.user_id,
      payload: {
        result_id: opts.result_id,
        assessment_id: opts.assessment_id,
        user_tier: opts.user_tier,
        user_id: opts.user_id,
        intent: opts.intent ?? 'all',
      },
    };
  },

  refresh_dimension(opts: GenerateInsightPayload & { dimension_key: string }): AiJobBase<'ai:refresh_dimension', RefreshDimensionPayload> {
    return {
      kind: 'ai:refresh_dimension',
      priority: 20,
      created_by_user: opts.user_id,
      tenant_user_id: opts.user_id,
      payload: opts,
    };
  },

  nexus_discuss(opts: {
    result_id: string;
    assessment_id: DiagnosticSlug;
    user_tier: TierKey;
    user_id: string;
    suggested_prompt: string;
  }): AiJobBase<'ai:nexus_discuss_promptseed', DiscussPromptseedPayload> {
    return {
      kind: 'ai:nexus_discuss_promptseed',
      priority: 20,
      created_by_user: opts.user_id,
      tenant_user_id: opts.user_id,
      payload: opts,
    };
  },

  /** Export PDF: worker runs pdfExport, then enqueues email-send on completion. */
  share_result_by_email(opts: ShareResultPayload): AiJobBase<'email:share_result', ShareResultPayload> {
    return {
      kind: 'email:share_result',
      priority: 20,
      created_by_user: opts.sender_email || opts.sender_name ? undefined : undefined,
      tenant_user_id: undefined,
      payload: opts,
    };
  },
} as const;

/* ── Auto trigger constructors ────────────────────────────────────── */

export const AUTO_TRIGGERS = {
  new_assessment_complete(
    opts: SummaryAndHighlightsPayload,
  ): AiJobBase<'ai:summary_and_highlights', SummaryAndHighlightsPayload> {
    return {
      kind: 'ai:summary_and_highlights',
      priority: 10,
      tenant_user_id: opts.user_id,
      created_by_user: opts.user_id,
      payload: opts,
    };
  },
  cross_assessment_pattern(
    opts: CrossAssessmentPayload,
  ): AiJobBase<'ai:cross_assessment_pattern', CrossAssessmentPayload> {
    return {
      kind: 'ai:cross_assessment_pattern',
      priority: 80,
      tenant_user_id: opts.user_id,
      created_by_user: opts.user_id,
      payload: opts,
    };
  },
  nexus_chat_references_assessment(
    opts: { user_id: string; user_tier: TierKey; result_id: string; assessment_id: DiagnosticSlug },
  ): AiJobBase<'ai:nexus_refresh_bundle', SummaryAndHighlightsPayload> {
    return {
      kind: 'ai:nexus_refresh_bundle',
      priority: 50,
      tenant_user_id: opts.user_id,
      created_by_user: opts.user_id,
      payload: {
        user_id: opts.user_id,
        user_tier: opts.user_tier,
        result_id: opts.result_id,
        assessment_id: opts.assessment_id,
      },
    };
  },
} as const;

/* ── Scheduled trigger constructors + cron expressions ───────────── */

/**
 * Cron expressions for each scheduled job.
 *   weekly_digest      → Monday 09:00 local (timezone handled by scheduler input)
 *   monthly_summary    → 1st of month 09:00 local
 *   3day_checkin       → no cron (per-result, offset scheduler). Builder below
 *                         returns a Date N days after the provided completedAt.
 *
 * All passed to the Schedule tool via Schedule(action='create', cron_expression, message=…)
 * when the scheduler wires them up.
 */
export const SCHEDULED_CRON = {
  weekly_digest:   '0 9 * * 1',
  monthly_summary: '0 9 1 * *',
} as const;

export const SCHEDULED_TRIGGERS = {
  weekly_digest(
    window: { start: Date; end: Date },
    audience: { user_id: string; user_tier: TierKey; timezone?: string },
    availableAt?: Date,
  ): AiJobBase<'scheduled:weekly-digest', ScheduledDigestPayload> {
    return {
      kind: 'scheduled:weekly-digest',
      priority: 80,
      tenant_user_id: audience.user_id,
      available_at: availableAt ?? new Date(),
      payload: {
        user_id: audience.user_id,
        user_tier: audience.user_tier,
        window_start: window.start.toISOString(),
        window_end: window.end.toISOString(),
        timezone: audience.timezone,
      },
    };
  },
  monthly_summary(
    window: { start: Date; end: Date },
    audience: { user_id: string; user_tier: TierKey; timezone?: string },
    availableAt?: Date,
  ): AiJobBase<'scheduled:monthly-summary', ScheduledDigestPayload> {
    return {
      kind: 'scheduled:monthly-summary',
      priority: 100,
      tenant_user_id: audience.user_id,
      available_at: availableAt ?? new Date(),
      payload: {
        user_id: audience.user_id,
        user_tier: audience.user_tier,
        window_start: window.start.toISOString(),
        window_end: window.end.toISOString(),
        timezone: audience.timezone,
      },
    };
  },
  three_day_checkin(
    completedAt: Date,
    audience: { user_id: string; user_tier: TierKey; result_id: string; assessment_id: DiagnosticSlug },
  ): AiJobBase<'scheduled:3day-checkin', ScheduledDigestPayload & { result_id: string; assessment_id: DiagnosticSlug }> {
    const available_at = new Date(+completedAt + 3 * 24 * 60 * 60 * 1000);
    return {
      kind: 'scheduled:3day-checkin',
      priority: 80,
      tenant_user_id: audience.user_id,
      available_at,
      payload: {
        user_id: audience.user_id,
        user_tier: audience.user_tier,
        window_start: completedAt.toISOString(),
        window_end: available_at.toISOString(),
        result_id: audience.result_id,
        assessment_id: audience.assessment_id,
      },
    };
  },
} as const;

/* ── Consolidated worker contract (single api/workers/[job].ts route) ─ */

/**
 * WorkerKind maps URL [job] param → ai_job_queue.kind filter.
 *   ai-trigger    → claim any ai:* kind
 *   email-send    → claim any email:* kind (and also scheduled:* once AI completes)
 */
export type WorkerKind = 'ai-trigger' | 'email-send';
export const WORKER_KIND_TO_KIND_PREFIXES: Record<WorkerKind, string[]> = {
  'ai-trigger':  ['ai:', 'scheduled:'],
  'email-send':  ['email:'],
};

export interface WorkerRunOptions {
  workerId: string;
  /** Default 100ms between polls, up to 15s backoff. */
  minPollMs?: number;
  maxPollMs?: number;
  /** Halt after N jobs — 0 = run forever (until signal). */
  maxJobsPerRun?: number;
  /** AbortSignal (serverless timeout). */
  signal?: AbortSignal;
  /** Callback when a job is claimed but before handler runs. */
  onClaim?: (job: { job_id: string; kind: AiJobKind }) => void;
  /** Handler resolved per-job. */
  handlers: Partial<Record<AiJobKind, (job: { job_id: string; payload: unknown }) => Promise<{ result?: unknown } | { error: string }>>>;
}

/**
 * Stable job-id generator (not crypto-secure, fine for test/logger keys).
 * Exposed to avoid pulling `crypto` into tests.
 */
export function makeJobId(): string {
  return randomUUID();
}
