/**
 * services/assessmentLifecycleHooks.ts — #1345 / #1348 Batch 4 wiring.
 *
 * Two convenience entry points for UI to call:
 *
 *  1. onAssessmentCompleted(result, viewer)
 *       → enqueue auto trigger: ai:summary_and_highlights
 *       → enqueue auto trigger: scheduled:3day-checkin
 *       → if viewer.email, enqueue email:assessment_complete (send the "your result
 *         is ready" notification). Caller can pass skip_own_email=true to suppress.
 *
 *  2. shareResultByEmail({ result, sender, recipient_email, recipient_name, note })
 *       → create share link via createShareLink(…)
 *       → enqueue email:share_result with sender note + share_url
 *
 * Both functions accept a supabase write adapter for enqueueing jobs. When no
 * adapter is passed, a default Supabase client row-writer is used. This means
 * the function also works in unauthenticated in-memory tests with a stub.
 */

import {
  AUTO_TRIGGERS,
  MANUAL_TRIGGERS,
  SCHEDULED_TRIGGERS,
  enqueueAiJob,
} from '@/services/aiTriggers';
import type { AiJobKind, ShareResultPayload, AssessmentCompletePayload } from '@/services/aiTriggers';
import {
  buildShareUrl,
  createShareLink,
  type AssessmentResultContract,
} from '@/services/assessmentShareService';
import type { TierKey } from '@/config/tierConfig';
import type { DiagnosticSlug } from '@/types/assessment';
import { supabase } from '@/lib/supabase/client';

export interface Viewer {
  user_id: string;
  tier: TierKey;
  email?: string | null;
  name?: string | null;
}

/* ── Write adapter — ai_job_queue row insert via Supabase client ─── */

function makeSbWriteAdapter(overrideTenant?: string) {
  return {
    async insert(row: {
      kind: string;
      payload: unknown;
      available_at: Date;
      priority: number;
      tenant_user_id?: string;
      created_by_user?: string;
    }) {
      const { data, error } = await supabase
        .from('ai_job_queue')
        .insert({
          kind: row.kind,
          payload: row.payload as any,
          available_at: row.available_at.toISOString(),
          priority: row.priority,
          tenant_user_id: overrideTenant ?? row.tenant_user_id ?? null,
          created_by_user: row.created_by_user ?? null,
        })
        .select('job_id')
        .single();
      if (error) throw error;
      return { job_id: (data as any).job_id };
    },
  };
}

/* ── 1. Assessment completion hook ────────────────────────────────── */

export interface OnCompletedOptions {
  skip_own_email?: boolean;
  /** If a share URL has already been pre-computed, reuse it. */
  override_share_url?: string;
}

export interface OnCompletedResult {
  ai_summary_job?: { job_id: string; kind: AiJobKind; estimated_ready_at: string };
  checkin_job?: { job_id: string; kind: AiJobKind; estimated_ready_at: string };
  email_job?: { job_id: string; kind: AiJobKind; estimated_ready_at: string };
  share_url?: string;
}

/**
 * Run completion hook — enqueues AI summary auto-trigger and the
 * "Your result is ready" email (unless viewer.email missing).
 */
export async function onAssessmentCompleted(
  result: AssessmentResultContract,
  viewer: Viewer,
  opts: OnCompletedOptions = {},
): Promise<OnCompletedResult> {
  if (!result?.result_id) throw new Error('onAssessmentCompleted: result.result_id is required');

  const write = makeSbWriteAdapter(viewer.user_id);
  const out: OnCompletedResult = {};
  const share_url = opts.override_share_url ?? buildShareUrl(result.result_id);
  out.share_url = share_url;

  // AI summary auto trigger
  try {
    const summary = AUTO_TRIGGERS.new_assessment_complete({
      result_id: result.result_id,
      assessment_id: result.assessment_code.toLowerCase() as DiagnosticSlug,
      user_tier: viewer.tier,
      user_id: viewer.user_id,
      run_synchronously_if_template_enabled: true,
    });
    out.ai_summary_job = await enqueueAiJob(summary, write);
  } catch (e) {
    console.warn('[lifecycle] summary enqueue failed:', e);
  }

  // 3-day check-in scheduled
  try {
    const completedAt = result.completed_at ? new Date(result.completed_at) : new Date();
    const threeDay = SCHEDULED_TRIGGERS.three_day_checkin(completedAt, {
      user_id: viewer.user_id,
      user_tier: viewer.tier,
      result_id: result.result_id,
      assessment_id: result.assessment_code.toLowerCase() as DiagnosticSlug,
    });
    out.checkin_job = await enqueueAiJob(threeDay, write);
  } catch (e) {
    console.warn('[lifecycle] 3day-checkin enqueue failed:', e);
  }

  // Email to owner
  if (!opts.skip_own_email && viewer.email) {
    try {
      const payload: AssessmentCompletePayload = {
        result_id: result.result_id,
        assessment_id: result.assessment_code.toLowerCase() as DiagnosticSlug,
        overall_score: result.overall_score,
        recipient_name: viewer.name ?? 'there',
        recipient_email: viewer.email,
        share_url,
        user_tier: viewer.tier,
      };
      // This job kind is 'email:assessment_complete' → handled by worker email-send.
      // MANUAL_TRIGGERS doesn't export it, so build the AiJobBase inline.
      const job = {
        kind: 'email:assessment_complete' as AiJobKind,
        priority: 20 as const,
        tenant_user_id: viewer.user_id,
        created_by_user: viewer.user_id,
        payload,
      };
      out.email_job = await enqueueAiJob(job, write);
    } catch (e) {
      console.warn('[lifecycle] complete email enqueue failed:', e);
    }
  }

  return out;
}

/* ── 2. Share by email hook ──────────────────────────────────────── */

export interface ShareEmailOptions {
  result: AssessmentResultContract;
  sender: Viewer;
  /** Recipient email (required). */
  recipient_email: string;
  /** Optional recipient display name. */
  recipient_name?: string;
  /** Optional sender note (appears top of email body). */
  sender_note?: string;
  /** If caller already created a share link with specific expiry/views, pass it — otherwise we create a default. */
  pre_existing_share?: { share_token: string; max_views?: number };
}

export interface ShareEmailResult {
  share_url: string;
  enqueue_result: { job_id: string; kind: AiJobKind; estimated_ready_at: string };
  created_share_link: boolean;
}

export async function shareResultByEmail(opts: ShareEmailOptions): Promise<ShareEmailResult> {
  const { result, sender, recipient_email, recipient_name, sender_note } = opts;
  const write = makeSbWriteAdapter(sender.user_id);
  let share_url: string;
  let created_share_link = false;
  if (opts.pre_existing_share?.share_token) {
    share_url = buildShareUrl(opts.pre_existing_share.share_token);
  } else {
    const share = await createShareLink(result, opts.pre_existing_share?.max_views);
    if (!share) throw new Error('Failed to create share link');
    share_url = buildShareUrl(share.share_token);
    created_share_link = true;
  }

  const payload: ShareResultPayload = {
    result_id: result.result_id,
    assessment_id: result.assessment_code.toLowerCase() as DiagnosticSlug,
    sender_name: sender.name ?? sender.email ?? 'A LYC Partner',
    sender_email: sender.email ?? '',
    recipient_email,
    recipient_name,
    sender_note,
    share_url,
    user_tier: sender.tier,
  };

  const manual = MANUAL_TRIGGERS.share_result_by_email(payload);
  const enqueue_result = await enqueueAiJob(manual, write);
  return { share_url, enqueue_result, created_share_link };
}

export default { onAssessmentCompleted, shareResultByEmail };
