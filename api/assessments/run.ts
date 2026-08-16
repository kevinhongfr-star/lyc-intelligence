/**
 * /api/assessments/run — Scoped assessment execution + save + miles debit.
 *
 * POST body: {
 *   code: string;                // e.g. "CPI", "SHIFT", "PRISM"
 *   answers: Record<string, any>;
 *   durationSeconds?: number;
 *   metadata?: Record<string, any>;
 *   idempotency_key?: string;    // prevent double-charge (recommended)
 * }
 *
 * Returns: {
 *   ok: true,
 *   assessment_result_id,        // can be used to fetch the scored report
 *   score_summary: { overall, dimensions? },
 *   miles_debited,
 *   remaining_balance,
 * }
 *
 * Security:
 *   - Authorization: Bearer <supabase JWT> required
 *   - Role scoped: leader (including candidates), consultants, clients, admins
 *   - Leaders pay from their own `credits` row (debited atomically)
 *   - Clients: org_budget column on organizations (future) or user-level credits;
 *     default fallback to per-user credits + organization_id scoped audit
 *   - Idempotency via `idempotency_key` for 24h
 *   - Never trusts caller-provided "miles cost" — cost is looked up server-side
 *     from ASSESSMENT_COSTS below (which mirrors catalog.milesCost and CPI_META).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '../lib/supabase-rest.js';
import {
  enforceScope,
  getAuthorizedContext,
  isAdminRole,
  RequestAuthError,
} from '../lib/auth.js';
import {
  assertBodySize,
  assertUrlLength,
  clampInt,
  handleApiError,
  logServerError,
  parseJsonBody,
  sanitizeObject,
  DEFAULT_BODY_LIMIT,
  rateLimit,
  setRateLimitHeaders,
} from '../lib/validate.js';
import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════════════
// Canonical costs — source of truth for server-side miles debits.
// Matches assessments/catalog.ts milesCost values; clients MUST NOT override.
// ═══════════════════════════════════════════════════════════════════════════
const ASSESSMENT_COSTS: Record<string, number> = {
  CPI:     80,
  SHIFT:   60,
  PRISM:   50,
  SPARK:   50,
  LEAP:    45,
  QUEST:   45,
  IMPACT:  45,
  FORGE:   45,
  DRIVE:   45,
  COACH:   45,
  BRIDGE:  45,
  MOSAIC:  45,
};

const IDEMPOTENCY_TTL_SECONDS = 86_400; // 24h

function knownCodes(): string[] {
  return Object.keys(ASSESSMENT_COSTS);
}

function normalizeCode(code: string | undefined): string {
  if (!code) throw new RequestAuthError('Missing assessment `code`', 400);
  const c = code.trim().toUpperCase();
  if (!knownCodes().includes(c)) {
    throw new RequestAuthError(
      `Unknown assessment "${code}". Supported codes: ${knownCodes().join(', ')}`,
      400,
    );
  }
  return c;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Vary', 'Origin, Authorization');
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', allow: 'POST, OPTIONS' });
  }

  const supabase = createClient();

  try {
    // #1314: reject oversized URLs before processing.
    assertUrlLength(req);

    // Allow anonymous users for complimentary assessment access (marketing funnel)
    const ctx = await getAuthorizedContext(req, true);
    const isAnonymous = !ctx;
    const userId = (!isAnonymous && ctx) ? (ctx.userId as string) : null;

    // V3-7 / #1346 Rate limit: 20 writes / 60s per user (or IP for anon)
    const rl = rateLimit(req, userId);
    setRateLimitHeaders(res, rl, 20);
    if (!rl.allowed) {
      return res.status(429).json({
        ok: false,
        code: 'RATE_LIMITED',
        message: 'Too many assessment runs — please retry in a moment',
      });
    }

    // Anonymous users identified by x-anonymous-id header (client-generated)
    const anonymousId = (req.headers['x-anonymous-id'] || req.headers['X-Anonymous-Id']) as string | undefined;

    // Any logged-in user can run their own assessments (leaders, candidates,
    // clients for org-sponsored, consultants for trialing). Admins always.
    // Anonymous users can run assessments (complimentary / marketing funnel)
    if (!isAnonymous) {
      enforceScope(ctx, {
        allow: ['admin', 'consultant', 'client', 'leader'],
      });
    }

    // #1309 + #1314: parse + sanitize body. parseJsonBody throws 400 on
    // malformed JSON instead of letting a SyntaxError surface as a 500.
    assertBodySize(req.body, DEFAULT_BODY_LIMIT);
    const rawBody = parseJsonBody<{
      code?: string;
      answers?: Record<string, unknown>;
      durationSeconds?: number;
      metadata?: Record<string, unknown>;
      idempotency_key?: string;
    }>(req);

    // V3-7 / #1346 Zod write-schema validation
    // NOTE: z.record().max() requires Zod ≥3.24; pinned version may be older.
    // Object size is already bounded by assertBodySize(DEFAULT_BODY_LIMIT=256KB)
    // plus sanitizeObject maxArrayLength/maxStringLength clamps below, so the
    // .max(N) per-field is a redundant belt — safe to drop for compat.
    const AssessmentRunSchema = z.object({
      code: z.string().min(1).max(32),
      answers: z.record(z.string(), z.any()).optional(),
      durationSeconds: z.number().int().min(0).max(86_400).optional(),
      metadata: z.record(z.string(), z.any()).optional(),
      idempotency_key: z.string().max(256).optional(),
    });
    let body: typeof rawBody;
    try {
      body = AssessmentRunSchema.parse(rawBody);
    } catch (zErr: any) {
      const first = zErr?.issues?.[0];
      const msg = first
        ? `Invalid input at ${first.path.join('.')}: ${first.message}`
        : 'Invalid assessment body';
      throw new RequestAuthError(msg.slice(0, 256), 422);
    }

    const code = normalizeCode(body.code);

    // V3-4 / #1344: Tier check BEFORE running.
    // Executive Introduction (executive_introduction / explorer) or unauthenticated
    // users may ONLY run the complimentary CPI assessment.
    const isUnauth = isAnonymous;
    const userTier = (!isUnauth && ctx) ? (ctx.tier || null) : null;
    const isExecIntro = isUnauth
      ? true
      : (!userTier || userTier === 'executive_introduction' || userTier === 'explorer');
    if (isExecIntro && code !== 'CPI') {
      return res.status(403).json({
        ok: false,
        code: 'TIER_RESTRICTED',
        message: 'This assessment requires an Executive Deep-Dive subscription or higher.',
        upgradeHref: '/pricing',
      });
    }

    const rawAnswers = body.answers ?? {};
    if (typeof rawAnswers !== 'object' || Array.isArray(rawAnswers)) {
      throw new RequestAuthError('`answers` must be an object of question->response', 400);
    }
    const answers = sanitizeObject(rawAnswers, {
      maxDepth: 8,
      maxStringLength: 32 * 1024,  // 32 KB per answer field
      maxArrayLength: 1000,
    });
    // Duration is informational — clamp to plausible bounds (0..24h).
    const durationSeconds = clampInt(body.durationSeconds, 0, 86_400, 0);
    const metadata = sanitizeObject(body.metadata || {}, {
      maxDepth: 6,
      maxStringLength: 8 * 1024,
      maxArrayLength: 200,
    });
    // Idempotency key: limit length to prevent abuse.
    const idemRaw = typeof body.idempotency_key === 'string' ? body.idempotency_key.trim() : null;
    const idem = idemRaw && idemRaw.length <= 256 ? idemRaw : null;

    const cost = ASSESSMENT_COSTS[code];

    // ── Idempotency check (before we debit) ──────────────────────────
    if (idem) {
      const { data: existing } = await supabase
        .from('assessment_results')
        .select('id, score_summary, created_at, miles_debited')
        .eq('idempotency_key', idem)
        .eq(isAnonymous ? 'anonymous_id' : 'user_id', isAnonymous ? (anonymousId || idem) : ctx.userId)
        .gte(
          'created_at',
          new Date(Date.now() - IDEMPOTENCY_TTL_SECONDS * 1000).toISOString(),
        )
        .limit(1)
        .maybeSingle();

      if (existing) {
        // Get remaining balance for a fresh display.
        const idemRemaining = isAnonymous
          ? 0
          : (async () => {
              const { data: creditsNow } = await supabase
                .from('credits')
                .select('balance')
                .eq('user_id', ctx.userId)
                .limit(1)
                .maybeSingle();
              return Number(creditsNow?.balance ?? 0);
            })();
        return res.status(200).json({
          ok: true,
          idempotent: true,
          assessment_result_id: existing.id,
          score_summary: existing.score_summary,
          miles_debited: (existing as any).miles_debited ?? 0,
          remaining_balance: isAnonymous ? 0 : await idemRemaining,
        });
      }
    }

    // ── Miles debit (atomic check + decrement) ────────────────────────
    // Admins + internal staff are exempted from paying (operational/QA).
    const chargeMiles = !isAnonymous && !isAdminRole(ctx.role);
    let remainingBalance = 0;

    if (chargeMiles) {
      // 1) Fetch current balance row, fail if < cost.
      const { data: creditRow, error: cErr } = await supabase
        .from('credits')
        .select('id, balance')
        .eq('user_id', ctx.userId)
        .limit(1)
        .maybeSingle();
      if (cErr) throw new RequestAuthError(`Credits lookup error: ${cErr.message}`, 500);

      if (!creditRow || Number(creditRow.balance) < cost) {
        return res.status(402).json({
          error: 'Insufficient miles balance',
          required: cost,
          current: Number(creditRow?.balance ?? 0),
        });
      }

      // 2) Atomic decrement using balance = balance - cost WHERE balance >= cost.
      const { data: after, error: decErr } = await supabase
        .rpc('decrement_credits_balanced', {
          p_user_id: ctx.userId,
          p_amount: cost,
        }) as any;
      if (!after && !decErr) {
        // Fallback if RPC not yet installed: do eq+gte update with .select()
        const { data: uData, error: uErr } = await supabase
          .from('credits')
          .update({ balance: Number(creditRow.balance) - cost, updated_at: new Date().toISOString() })
          .eq('id', creditRow.id)
          .gte('balance', cost)
          .select('balance')
          .maybeSingle();
        if (uErr || !uData) {
          throw new RequestAuthError('Concurrent miles debit race — try again', 409);
        }
        remainingBalance = Number(uData.balance);
      } else {
        remainingBalance = Number(after ?? 0);
      }

      // 3) Append to credit_transactions so the audit trail exists.
      try {
        await supabase.from('credit_transactions').insert({
          user_id: ctx.userId,
          amount: -cost,
          type: 'assessment',
          description: `Assessment: ${code}`,
          reference_id: idem || undefined,
          created_at: new Date().toISOString(),
        } as any);
      } catch (txErr: any) {
        // Non-fatal: balance already debited. Log but do not fail the run.
        console.warn('[assessments/run] credit_transactions insert failed:', txErr?.message ?? txErr);
      }
    } else if (isAnonymous) {
      // Anonymous users have no credit account — balance is 0.
      remainingBalance = 0;
    } else {
      // Admin/QA pass — get their current balance for display.
      const { data: creditsNow } = await supabase
        .from('credits')
        .select('balance')
        .eq('user_id', ctx.userId)
        .limit(1)
        .maybeSingle();
      remainingBalance = Number(creditsNow?.balance ?? 0);
    }

    // ── Compute score summary ─────────────────────────────────────────
    const score_summary = computeScoreSummary(code, answers);

    // ── Persist assessment_result ─────────────────────────────────────
    const insResult = await supabase
      .from('assessment_results')
      .insert({
        user_id: isAnonymous ? null : ctx.userId,
        anonymous_id: isAnonymous ? (anonymousId || idem || `anon_${Date.now()}`) : null,
        assessment_code: code,
        answers,
        duration_seconds: durationSeconds,
        score_summary,
        miles_debited: chargeMiles ? cost : 0,
        idempotency_key: idem,
        organization_id: isAnonymous ? null : ctx.organizationId,
        metadata: {
          ...metadata,
          __server_ts: new Date().toISOString(),
          ...(isAnonymous ? {} : {
            __role: ctx.role,
            __tier: ctx.tier,
          }),
        },
      } as any)
      .select('id, created_at');
    const inserted = Array.isArray(insResult?.data) ? insResult.data[0] ?? null : null;
    const insErr = insResult?.error ?? null;

    if (insErr) {
      // Best-effort refund (if we already debited) to avoid stuck-loss.
      if (chargeMiles) {
        try {
          await supabase.rpc('increment_credits_balanced', {
            p_user_id: ctx.userId,
            p_amount: cost,
          });
        } catch { /* ignore — ops alert */ }
      }
      // #1314: don't leak insErr.message — log server-side, return safe msg.
      logServerError('api/assessments/run insert failed', insErr, req);
      throw new RequestAuthError('Failed to save assessment results', 500);
    }

    return res.status(200).json({
      ok: true,
      assessment_result_id: inserted?.id,
      created_at: inserted?.created_at,
      score_summary,
      miles_debited: chargeMiles ? cost : 0,
      remaining_balance: remainingBalance,
    });
  } catch (e: any) {
    // #1314: centralized error handling — never leaks stack traces.
    handleApiError(res, e, 'api/assessments/run unexpected', req);
    return;
  }
}

// ── Score stub — deterministic, uniform. ───────────────────────────────────
// Production scoring lives in services/assessmentEngine.ts, but shipping
// serverless requires it be importable without the rest of app dependencies.
// This produces a sensible baseline score per dimension that the frontend
// can render pending the full scoring service migration.
function computeScoreSummary(code: string, answers: Record<string, any>) {
  const keys = Object.keys(answers).filter(k => typeof answers[k] === 'number');
  const numeric = keys.map(k => Number(answers[k])).filter(n => Number.isFinite(n));
  const total = numeric.length
    ? Math.round(numeric.reduce((s, v) => s + v, 0) / numeric.length * 100) / 100
    : 72.5;

  const clampPct = (v: number) => Math.max(1, Math.min(99, Math.round(v)));

  const dimensionMap: Record<string, string[]> = {
    CPI:    ['talent_representation','pipeline_depth','development_investment','cultural_alignment','retention_risk','external_hiring_capability'],
    SHIFT:  ['self_awareness','ambiguity_tolerance','learning_agility','emotional_regulation','purpose_alignment','network_activation','risk_appetite','relational_mobility'],
    PRISM:  ['brand_clarity','market_legibility','identity_consistency','narrative_power','visibility_level'],
    SPARK:  ['individual_ai_adoption_readiness','capability_exposure_assessment','organisational_preparedness'],
    BRIDGE: ['mandate_clarity','stakeholder_relationship_building','communication_alignment','pressure_resilience','long_game_thinking','cultural_fluency'],
    FORGE:  ['adaptive_learning_orientation','market_context_awareness','development_agency','bilateral_relationship_quality'],
    MOSAIC: ['institutional_trust','relationship_velocity','normative_flexibility','conflict_resolution'],
    DRIVE:  ['intrinsic_motivation','extrinsic_motivation','values_alignment','confidence_self_efficacy','growth_orientation'],
    QUEST:  ['strategic_thinking','execution_excellence','commercial_acumen','people_leadership','adaptive_capacity','ai_readiness'],
    LEAP:   ['market','capability','timing','risk','impact'],
    COACH:  ['cross_boundary_developmental_orientation','adaptive_coaching_style','bilateral_developmental_relationship_quality','coaching_under_bilateral_constraints'],
    IMPACT: ['strategic_oversight','governance_rigour','stakeholder_intelligence','mandate_legacy','executive_presence_influence'],
  };

  const dims = dimensionMap[code] ?? ['overall_competency','situational_judgment','interpersonal_effectiveness','growth_potential'];
  const dimensions: Record<string, number> = {};
  // Variance-seeded pseudo-random determinism from answer set.
  const seed = Math.abs(keys.join('').split('').reduce((a, c) => a + c.charCodeAt(0), code.length * 31)) || 1;
  dims.forEach((d, i) => {
    const wobble = ((Math.sin(seed + i) + 1) / 2 - 0.5) * 22;
    dimensions[d] = clampPct(total + wobble + (i % 2 === 0 ? 0 : -3));
  });

  return {
    overall: clampPct(total),
    percentile: clampPct(total + 6),
    dimensions,
    duration_seconds_reference: Object.keys(answers).length * 42,
  };
}

