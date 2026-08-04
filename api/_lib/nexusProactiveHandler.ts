/**
 * api/_lib/nexusProactiveHandler.ts — S7-T05 (N5)
 *
 * Proactive Suggestions: context-aware nudges generated from trigger events
 * (pipeline stage change, new matching mandate, assessment milestone reached,
 * profile strength detected, stale conversation).
 *
 * Spec (TRAEE_NEXT_SPRINTS.md — S7-T05):
 *   - Context-aware suggestions:
 *     "You applied to X — here's what to expect next"
 *     "Based on your profile, Y role might interest you"
 *     "Your assessment shows strength in Z — consider this path"
 *   - Triggered by: stage change, new matching mandate, assessment completion
 *   - Delivered via: in-app notification, email (optional)
 *   - Acceptance: Users receive relevant proactive suggestions
 *
 * Routes (via nexusHandler → /api/nexus/suggestions):
 *   GET    /api/nexus/suggestions                → list user's pending suggestions
 *   POST   /api/nexus/suggestions/:id/dismiss    → dismiss a suggestion
 *   POST   /api/nexus/suggestions/:id/act        → mark suggestion as acted on
 *   POST   /api/nexus/suggestions/generate       → admin/cron: evaluate triggers
 *
 * The cron job (api/_lib/cron/generateProactiveSuggestions.ts) imports
 * `evaluateAllTriggers` directly to avoid an HTTP round-trip.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  selectMany,
  selectOne,
  insert,
  update,
  isSupabaseConfigured,
} from './supabaseRest.js';
import { createNotification } from './notificationService.js';

// ── Types ──

export type SuggestionTrigger =
  | 'stage_change'
  | 'new_match'
  | 'assessment_complete'
  | 'profile_strength'
  | 'stale_conversation';

export interface ProactiveSuggestion {
  id: string;
  user_id: string;
  trigger_type: SuggestionTrigger;
  trigger_resource_type: string | null;
  trigger_resource_id: string | null;
  title: string;
  body: string;
  cta_label: string | null;
  cta_link: string | null;
  status: 'pending' | 'dismissed' | 'acted_on' | 'expired';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  expires_at: string | null;
  notification_id: string | null;
  delivered_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface SuggestionSeed {
  trigger_type: SuggestionTrigger;
  trigger_resource_type?: string;
  trigger_resource_id?: string;
  title: string;
  body: string;
  cta_label?: string;
  cta_link?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  expires_at?: string;
  metadata?: Record<string, any>;
}

// How recently a trigger event must have occurred to generate a suggestion.
const STAGE_CHANGE_WINDOW_HOURS = 24;
const NEW_MATCH_WINDOW_HOURS = 24;
const STALE_CONVERSATION_DAYS = 7;

// ── Deduplication ──
// A user shouldn't receive the same suggestion twice. We dedupe on
// (user_id, trigger_type, trigger_resource_type, trigger_resource_id) within
// the last 7 days. Implemented as a pre-insert check.

async function alreadySuggestedRecently(
  userId: string,
  triggerType: SuggestionTrigger,
  triggerResourceType?: string,
  triggerResourceId?: string,
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const where: any[] = [
      { column: 'user_id', value: userId, op: 'eq' },
      { column: 'trigger_type', value: triggerType, op: 'eq' },
      { column: 'created_at', value: cutoff, op: 'gte' },
    ];
    if (triggerResourceType) {
      where.push({ column: 'trigger_resource_type', value: triggerResourceType, op: 'eq' });
    }
    if (triggerResourceId) {
      where.push({ column: 'trigger_resource_id', value: triggerResourceId, op: 'eq' });
    }
    const existing = await selectMany(
      'nexus_proactive_suggestions',
      { select: 'id', where, limit: 1 },
      5000,
    );
    return Array.isArray(existing) && existing.length > 0;
  } catch {
    return false;
  }
}

// ── Suggestion creation ──

async function createSuggestion(userId: string, seed: SuggestionSeed): Promise<ProactiveSuggestion | null> {
  if (!isSupabaseConfigured()) return null;

  // Dedupe: skip if an identical suggestion was created in the last 7 days.
  const dupe = await alreadySuggestedRecently(
    userId,
    seed.trigger_type,
    seed.trigger_resource_type,
    seed.trigger_resource_id,
  );
  if (dupe) return null;

  try {
    const row = await insert('nexus_proactive_suggestions', {
      user_id: userId,
      trigger_type: seed.trigger_type,
      trigger_resource_type: seed.trigger_resource_type || null,
      trigger_resource_id: seed.trigger_resource_id || null,
      title: seed.title.slice(0, 300),
      body: seed.body.slice(0, 2000),
      cta_label: seed.cta_label ? seed.cta_label.slice(0, 100) : null,
      cta_link: seed.cta_link ? seed.cta_link.slice(0, 500) : null,
      status: 'pending',
      priority: seed.priority || 'normal',
      expires_at: seed.expires_at || null,
      delivered_at: new Date().toISOString(),
      metadata: seed.metadata || {},
    });

    if (!row || !row.id) return null;

    // Emit a notification through the standard notifications system so the
    // bell badge lights up. Best-effort — failure here doesn't break the
    // suggestion itself.
    const notif = await createNotification({
      recipient_id: userId,
      type: 'nexus_suggestion',
      priority: seed.priority || 'normal',
      title: seed.title,
      content: seed.body,
      resource_type: 'nexus_suggestion',
      resource_id: row.id,
      channels: { in_app: true, email: false },
    });

    // Link the notification back to the suggestion (for sync between bell + panel).
    if (notif && notif.id) {
      try {
        await update(
          'nexus_proactive_suggestions',
          { column: 'id', value: row.id },
          { notification_id: notif.id },
        );
        row.notification_id = notif.id;
      } catch {
        // Non-critical.
      }
    }

    return row as ProactiveSuggestion;
  } catch (err) {
    console.warn('[nexusProactiveHandler] createSuggestion failed:', err);
    return null;
  }
}

// ── Trigger evaluators ──
// Each evaluator scans recent trigger events and emits suggestions. They return
// the number of suggestions created. All are non-blocking-safe (catch + log).

/**
 * Stage-change trigger: when a candidate's pipeline stage advances, suggest
 * next-step preparation. Sources from `pipeline_stage_history` (recent rows).
 */
async function evaluateStageChangeTriggers(): Promise<number> {
  if (!isSupabaseConfigured()) return 0;
  try {
    const cutoff = new Date(Date.now() - STAGE_CHANGE_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
    // Recent stage transitions. We join contact → profile user_id via the
    // contacts table. The pipeline_stage_history table records from_stage/to_stage.
    const recent = await selectMany(
      'pipeline_stage_history',
      {
        select: 'id,pipeline_id,from_stage,to_stage,created_by,created_at',
        where: [{ column: 'created_at', value: cutoff, op: 'gte' }],
        orderBy: { column: 'created_at', ascending: false },
        limit: 100,
      },
      8000,
    );
    if (!recent || recent.length === 0) return 0;

    let created = 0;
    for (const event of recent) {
      // The pipeline_id links to candidates_pipeline; we need the contact_id +
      // the contact's linked user_id. created_by is the user who triggered it
      // (often the consultant, sometimes the candidate themselves).
      // For candidate-facing suggestions, we want the candidate's user_id.
      const pipelineRow = await selectOne(
        'candidates_pipeline',
        { column: 'id', value: event.pipeline_id, select: 'id,contact_id,mandate_id,stage' },
        5000,
      ).catch(() => null);
      if (!pipelineRow || !pipelineRow.contact_id) continue;

      const contact = await selectOne(
        'contacts',
        { column: 'id', value: pipelineRow.contact_id, select: 'id,user_id,full_name' },
        5000,
      ).catch(() => null);
      if (!contact || !contact.user_id) continue;

      // Skip terminal stages — no actionable next step.
      const toStage = String(event.to_stage || '').toUpperCase();
      if (['REJECTED', 'WITHDRAWN', 'HIRED'].includes(toStage)) continue;

      const suggestion = stageChangeSuggestion(toStage, pipelineRow.mandate_id);
      if (!suggestion) continue;

      const result = await createSuggestion(contact.user_id, {
        trigger_type: 'stage_change',
        trigger_resource_type: 'candidates_pipeline',
        trigger_resource_id: pipelineRow.id,
        title: suggestion.title,
        body: suggestion.body,
        cta_label: suggestion.cta_label,
        cta_link: suggestion.cta_link,
        priority: suggestion.priority,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
          from_stage: event.from_stage,
          to_stage: event.to_stage,
          mandate_id: pipelineRow.mandate_id,
          pipeline_event_id: event.id,
        },
      });
      if (result) created++;
    }
    return created;
  } catch (err) {
    console.warn('[nexusProactiveHandler] stage_change evaluation failed:', err);
    return 0;
  }
}

function stageChangeSuggestion(
  toStage: string,
  mandateId: string | null,
): { title: string; body: string; cta_label: string; cta_link: string; priority: 'normal' | 'high' } | null {
  const ctx = mandateId ? ` for mandate ${mandateId.slice(0, 8)}` : '';
  switch (toStage) {
    case 'INTERVIEW':
      return {
        title: 'You advanced to the interview stage',
        body: `Congratulations — your application moved to the interview stage${ctx}. Prepare with a mock interview, review the mandate context, and align your talking points with the role's success profile.`,
        cta_label: 'Prepare for interview',
        cta_link: '/dex/chat?topic=interview_prep',
        priority: 'high',
      };
    case 'OFFER':
      return {
        title: 'An offer is being extended to you',
        body: `Your application moved to the offer stage${ctx}. Review compensation benchmarks and prepare your negotiation stance before the offer call.`,
        cta_label: 'Review compensation benchmarks',
        cta_link: '/dex/chat?topic=compensation',
        priority: 'high',
      };
    case 'SHORTLISTED':
    case 'PRESENTED':
      return {
        title: 'You were shortlisted',
        body: `You're on the shortlist presented to the client${ctx}. This is a good moment to refine your narrative and confirm your references are briefed.`,
        cta_label: 'Refine your narrative',
        cta_link: '/dex/chat?topic=narrative',
        priority: 'normal',
      };
    case 'ASSESS':
      return {
        title: 'You moved to the assessment stage',
        body: `You've been invited to assess${ctx}. Complete the SHIFT assessment so your profile is calibrated before the next gate.`,
        cta_label: 'Start assessment',
        cta_link: '/assess',
        priority: 'normal',
      };
    default:
      // SWEEP, QUALIFY — informational only, skip to avoid noise.
      return null;
  }
}

/**
 * New-match trigger: when a candidate's pipeline row has a high match_score
 * and was created recently, surface it as a "this role might interest you".
 */
async function evaluateNewMatchTriggers(): Promise<number> {
  if (!isSupabaseConfigured()) return 0;
  try {
    const cutoff = new Date(Date.now() - NEW_MATCH_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
    const recent = await selectMany(
      'candidates_pipeline',
      {
        select: 'id,contact_id,mandate_id,match_score,stage,created_at',
        where: [
          { column: 'created_at', value: cutoff, op: 'gte' },
          { column: 'match_score', value: 75, op: 'gte' },
        ],
        orderBy: { column: 'match_score', ascending: false },
        limit: 50,
      },
      8000,
    );
    if (!recent || recent.length === 0) return 0;

    let created = 0;
    for (const row of recent) {
      if (!row.contact_id) continue;
      const contact = await selectOne(
        'contacts',
        { column: 'id', value: row.contact_id, select: 'id,user_id,full_name' },
        5000,
      ).catch(() => null);
      if (!contact || !contact.user_id) continue;

      const result = await createSuggestion(contact.user_id, {
        trigger_type: 'new_match',
        trigger_resource_type: 'candidates_pipeline',
        trigger_resource_id: row.id,
        title: 'A new high-fit role matched your profile',
        body: `We surfaced a mandate with a ${(row.match_score || 0).toFixed(0)}% match to your profile. Review the role details and decide whether to express interest.`,
        cta_label: 'Review the match',
        cta_link: '/candidates/applications',
        priority: 'normal',
        expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
          mandate_id: row.mandate_id,
          match_score: row.match_score,
          stage: row.stage,
        },
      });
      if (result) created++;
    }
    return created;
  } catch (err) {
    console.warn('[nexusProactiveHandler] new_match evaluation failed:', err);
    return 0;
  }
}

/**
 * Assessment-completion trigger: when a Nexus conversation reaches a diagnostic
 * milestone (diagnostic_progress >= 100) or a milestone memory is stored,
 * suggest the natural next step.
 */
async function evaluateAssessmentCompleteTriggers(): Promise<number> {
  if (!isSupabaseConfigured()) return 0;
  try {
    // Conversations that recently hit full diagnostic progress.
    const cutoff = new Date(Date.now() - NEW_MATCH_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
    const recent = await selectMany(
      'nexus_conversations',
      {
        select: 'id,user_id,diagnostic_progress,updated_at',
        where: [
          { column: 'diagnostic_progress', value: 100, op: 'gte' },
          { column: 'updated_at', value: cutoff, op: 'gte' },
        ],
        orderBy: { column: 'updated_at', ascending: false },
        limit: 50,
      },
      8000,
    );
    if (!recent || recent.length === 0) return 0;

    let created = 0;
    for (const conv of recent) {
      if (!conv.user_id) continue;
      const result = await createSuggestion(conv.user_id, {
        trigger_type: 'assessment_complete',
        trigger_resource_type: 'nexus_conversation',
        trigger_resource_id: conv.id,
        title: 'Your diagnostic is complete',
        body: 'Nexus has finished mapping your 5 diagnostic dimensions. Review your development plan and pick the first action to execute this week.',
        cta_label: 'View development plan',
        cta_link: '/dex/plan',
        priority: 'normal',
        expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
          conversation_id: conv.id,
          diagnostic_progress: conv.diagnostic_progress,
        },
      });
      if (result) created++;
    }
    return created;
  } catch (err) {
    console.warn('[nexusProactiveHandler] assessment_complete evaluation failed:', err);
    return 0;
  }
}

/**
 * Profile-strength trigger: when a semantic memory of type 'strength' with high
 * importance is stored, suggest leveraging it.
 */
async function evaluateProfileStrengthTriggers(): Promise<number> {
  if (!isSupabaseConfigured()) return 0;
  try {
    const cutoff = new Date(Date.now() - NEW_MATCH_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
    const recent = await selectMany(
      'nexus_memory',
      {
        select: 'id,user_id,content,importance,memory_type,created_at',
        where: [
          { column: 'memory_type', value: 'strength', op: 'eq' },
          { column: 'importance', value: 0.75, op: 'gte' },
          { column: 'created_at', value: cutoff, op: 'gte' },
          { column: 'is_active', value: true, op: 'eq' },
        ],
        orderBy: { column: 'importance', ascending: false },
        limit: 30,
      },
      8000,
    );
    if (!recent || recent.length === 0) return 0;

    let created = 0;
    for (const mem of recent) {
      if (!mem.user_id) continue;
      const strength = String(mem.content || '').slice(0, 120);
      const result = await createSuggestion(mem.user_id, {
        trigger_type: 'profile_strength',
        trigger_resource_type: 'nexus_memory',
        trigger_resource_id: mem.id,
        title: 'A strength was identified in your profile',
        body: `Nexus flagged a strength worth leveraging: "${strength}". Consider how this differentiator positions you for your next move — and which mandates would amplify it.`,
        cta_label: 'Explore aligned roles',
        cta_link: '/candidates/mandates',
        priority: 'low',
        expires_at: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
          memory_id: mem.id,
          importance: mem.importance,
        },
      });
      if (result) created++;
    }
    return created;
  } catch (err) {
    console.warn('[nexusProactiveHandler] profile_strength evaluation failed:', err);
    return 0;
  }
}

/**
 * Stale-conversation trigger: when a user hasn't returned to Nexus in 7+ days
 * but has an active mandate or pending assessment, nudge them back.
 */
async function evaluateStaleConversationTriggers(): Promise<number> {
  if (!isSupabaseConfigured()) return 0;
  try {
    const cutoff = new Date(Date.now() - STALE_CONVERSATION_DAYS * 24 * 60 * 60 * 1000).toISOString();
    // Users whose most recent conversation is older than the cutoff.
    const stale = await selectMany(
      'nexus_conversations',
      {
        select: 'user_id,max_updated_at',
        or: 'user_id.eq.user_id',
        orderBy: { column: 'updated_at', ascending: false },
        limit: 100,
      },
      8000,
    ).catch(() => []);

    if (!stale || stale.length === 0) return 0;

    // Group by user_id and find each user's latest conversation timestamp.
    const latestByUser = new Map<string, string>();
    for (const row of stale) {
      const uid = row.user_id;
      const ts = row.updated_at || row.max_updated_at;
      if (!uid || !ts) continue;
      if (!latestByUser.has(uid) || new Date(ts) > new Date(latestByUser.get(uid)!)) {
        latestByUser.set(uid, ts);
      }
    }

    let created = 0;
    for (const [userId, lastTs] of latestByUser.entries()) {
      if (new Date(lastTs) > new Date(cutoff)) continue; // active within 7 days

      const result = await createSuggestion(userId, {
        trigger_type: 'stale_conversation',
        title: 'Your next move is waiting',
        body: `It's been a while since your last Nexus session. Pick up where you left off — your diagnostic context is preserved and ready.`,
        cta_label: 'Resume your session',
        cta_link: '/dex/chat',
        priority: 'low',
        expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: { last_conversation_at: lastTs },
      });
      if (result) created++;
    }
    return created;
  } catch (err) {
    console.warn('[nexusProactiveHandler] stale_conversation evaluation failed:', err);
    return 0;
  }
}

// ── Master evaluator (called by cron + admin route) ──

export async function evaluateAllTriggers(): Promise<{
  stage_change: number;
  new_match: number;
  assessment_complete: number;
  profile_strength: number;
  stale_conversation: number;
  total: number;
}> {
  const [stageChange, newMatch, assessment, strength, stale] = await Promise.all([
    evaluateStageChangeTriggers(),
    evaluateNewMatchTriggers(),
    evaluateAssessmentCompleteTriggers(),
    evaluateProfileStrengthTriggers(),
    evaluateStaleConversationTriggers(),
  ]);

  return {
    stage_change: stageChange,
    new_match: newMatch,
    assessment_complete: assessment,
    profile_strength: strength,
    stale_conversation: stale,
    total: stageChange + newMatch + assessment + strength + stale,
  };
}

// ── HTTP handler: /api/nexus/suggestions ──

export async function handleNexusSuggestions(req: VercelRequest, res: VercelResponse) {
  const pathArr = (req.query.path as string[]) || [];
  // pathArr[0] === 'suggestions'
  const action = pathArr[1] || '';
  const method = req.method || 'GET';

  const authUser = (req as any).__authenticatedUser as { id: string; email: string; role: string } | undefined;
  if (!authUser) {
    return res.status(401).json({ error: 'Unauthorized', success: false });
  }

  const isAdmin = authUser.role === 'super_admin' || authUser.role === 'lyc_admin';

  try {
    // GET /api/nexus/suggestions — list the caller's pending suggestions
    if (action === '' && method === 'GET') {
      const limit = Math.min(Number(req.query.limit) || 20, 50);
      const includeDismissed = req.query.include_dismissed === 'true';
      const where: any[] = [{ column: 'user_id', value: authUser.id, op: 'eq' }];
      if (!includeDismissed) {
        where.push({ column: 'status', value: 'pending', op: 'eq' });
      }
      const rows = await selectMany(
        'nexus_proactive_suggestions',
        {
          select: 'id,trigger_type,trigger_resource_type,trigger_resource_id,title,body,cta_label,cta_link,status,priority,expires_at,notification_id,metadata,created_at,updated_at',
          where,
          orderBy: { column: 'created_at', ascending: false },
          limit,
        },
        8000,
      );
      return res.status(200).json({ success: true, suggestions: rows || [] });
    }

    // POST /api/nexus/suggestions/generate — admin/cron: evaluate triggers now
    if (action === 'generate' && method === 'POST') {
      if (!isAdmin) {
        return res.status(403).json({ error: 'Admin access required', success: false });
      }
      const result = await evaluateAllTriggers();
      return res.status(200).json({ success: true, generated: result });
    }

    // POST /api/nexus/suggestions/:id/dismiss — dismiss a suggestion
    if (action && pathArr[2] === 'dismiss' && method === 'POST') {
      const updated = await update(
        'nexus_proactive_suggestions',
        { column: 'id', value: action },
        {
          status: 'dismissed',
          dismissed_at: new Date().toISOString(),
        },
      ).catch(() => null);

      if (!updated || (Array.isArray(updated) && updated.length === 0)) {
        // Verify ownership — the row may not exist or belong to another user.
        const existing = await selectOne(
          'nexus_proactive_suggestions',
          { column: 'id', value: action, select: 'id,user_id' },
          5000,
        ).catch(() => null);
        if (!existing) return res.status(404).json({ error: 'Suggestion not found', success: false });
        if (existing.user_id !== authUser.id) {
          return res.status(403).json({ error: 'Not your suggestion', success: false });
        }
      }
      return res.status(200).json({ success: true });
    }

    // POST /api/nexus/suggestions/:id/act — mark suggestion as acted on
    if (action && pathArr[2] === 'act' && method === 'POST') {
      const updated = await update(
        'nexus_proactive_suggestions',
        { column: 'id', value: action },
        {
          status: 'acted_on',
          acted_on_at: new Date().toISOString(),
        },
      ).catch(() => null);

      if (!updated || (Array.isArray(updated) && updated.length === 0)) {
        const existing = await selectOne(
          'nexus_proactive_suggestions',
          { column: 'id', value: action, select: 'id,user_id' },
          5000,
        ).catch(() => null);
        if (!existing) return res.status(404).json({ error: 'Suggestion not found', success: false });
        if (existing.user_id !== authUser.id) {
          return res.status(403).json({ error: 'Not your suggestion', success: false });
        }
      }
      return res.status(200).json({ success: true });
    }

    return res.status(404).json({
      error: `Unknown suggestions action: ${method} ${action || '(root)'}`,
      success: false,
    });
  } catch (err: any) {
    console.error('[nexusProactiveHandler] error:', err);
    return res.status(500).json({
      error: 'Suggestion operation failed',
      details: err?.message,
      success: false,
    });
  }
}
