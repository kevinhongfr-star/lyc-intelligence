/**
 * POST /api/admin/org-intelligence/scoring/compute
 *
 * Body: { talent_id: string, mandate_id: string, force?: boolean, override_summary?: string }
 *   - talent_id: UUID of the individual to score (org_talent_pools.id)
 *   - mandate_id: UUID of the target mandate (mandates.id)
 *   - force: re-score even if an evaluation already exists for this talent
 *   - override_summary: admin override of the summary (≥30 chars per OVERRIDE_MIN_REASON_LENGTH)
 *
 * Pipeline:
 *   1. verifyAdmin (T2) — reject if not admin
 *   2. Validate body — UUIDs, override length
 *   3. Fetch talent from org_talent_pools
 *   4. Fetch mandate from mandates (existing LYC table, not the new T1 tables)
 *   5. Build sources corpus from talent data + admin attributes
 *   6. Run 5 LLM calls in parallel (one per criterion)
 *   7. Parse sub-scores from LLM responses
 *   8. Compute composite + determine tier
 *   9. Upsert org_evaluation (header) — re-use existing row if (talent_id, eval_type) match
 *  10. Replace 5 org_evaluation_scores rows (delete existing + insert new)
 *  11. Append org_audit_log entry
 *  12. Return 200 with full scoring result
 *
 * Idempotency: re-running with the same (talent_id, mandate_id) overwrites
 * the previous evaluation. Pass `force: true` if you want to bypass
 * "is_final" guards (Phase 2 — currently no guard, force is reserved).
 *
 * Source: docs/org_intelligence_scoring_spec_v1.2.md
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAdmin } from '../../../_lib/adminAuth.js';
import {
  isSupabaseConfigured,
  selectOne,
  selectMany,
  insert,
  update,
  deleteRows,
  handleError,
} from '../../../_lib/supabaseRest.js';
import {
  CRITERIA,
  computeComposite,
  tierFor,
  tierLabel,
  OVERRIDE_MIN_REASON_LENGTH,
  type CriterionId,
  type SubScores,
  type TierId,
} from '../../../_lib/scoringCriteria.js';
import { callLLM, LLMError } from '../../../_lib/llmCall.js';
import { buildCriterionPrompt } from '../../../_lib/promptTemplates.js';
import { parseScoreResponse, ParseScoreError } from '../../../_lib/parseScoreResponse.js';
import { buildCorpus, type Source, type BuildCorpusResult } from '../../../_lib/buildCorpus.js';

// Vercel Hobby default is 10s; need 60s for 5 parallel LLM calls
export const maxDuration = 60;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EVAL_TYPE = 'org_intel_v1';

interface ComputeRequestBody {
  talent_id?: string;
  mandate_id?: string;
  force?: boolean;
  override_summary?: string;
}

interface ComputeSuccessResponse {
  success: true;
  evaluation_id: string;
  talent_id: string;
  mandate_id: string;
  sub_scores: SubScores;
  composite: number;
  tier: TierId;
  tier_label: string;
  rationale: Record<CriterionId, string>;
  source_count: number;
  sources_truncated: boolean;
  total_tokens: number;
  duration_ms: number;
  overridden: boolean;
  model: string;
}

interface ComputeErrorResponse {
  success: false;
  error: string;
  step:
    | 'method'
    | 'config'
    | 'auth'
    | 'validate'
    | 'fetch_talent'
    | 'fetch_mandate'
    | 'corpus'
    | 'llm'
    | 'persist_evaluation'
    | 'persist_scores'
    | 'audit';
  details?: string;
}

function err(
  res: VercelResponse,
  status: number,
  body: ComputeErrorResponse
): VercelResponse {
  return res.status(status).json(body);
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<VercelResponse> {
  const start = Date.now();

  try {
    if (req.method !== 'POST') {
      return err(res, 405, {
        success: false,
        error: 'Method not allowed. Use POST.',
        step: 'method',
      });
    }
    if (!isSupabaseConfigured()) {
      return err(res, 503, {
        success: false,
        error: 'Supabase not configured (SUPABASE_URL or SUPABASE_SERVICE_KEY missing)',
        step: 'config',
      });
    }

    // 1. Auth
    const { user, error: authErr } = await verifyAdmin(req);
    if (authErr || !user) {
      return err(res, 401, {
        success: false,
        error: authErr || 'Unauthorized',
        step: 'auth',
      });
    }

    // 2. Validate body
    const body = (req.body ?? {}) as ComputeRequestBody;
    if (!body.talent_id || !UUID_RE.test(body.talent_id)) {
      return err(res, 400, {
        success: false,
        error: 'talent_id is required and must be a UUID',
        step: 'validate',
      });
    }
    if (!body.mandate_id || !UUID_RE.test(body.mandate_id)) {
      return err(res, 400, {
        success: false,
        error: 'mandate_id is required and must be a UUID',
        step: 'validate',
      });
    }
    if (
      body.override_summary !== undefined &&
      body.override_summary.length < OVERRIDE_MIN_REASON_LENGTH
    ) {
      return err(res, 400, {
        success: false,
        error: `override_summary must be at least ${OVERRIDE_MIN_REASON_LENGTH} characters when provided`,
        step: 'validate',
      });
    }

    const talentId = body.talent_id;
    const mandateId = body.mandate_id;

    // 3. Fetch talent
    const talent = await selectOne('org_talent_pools', {
      column: 'id',
      value: talentId,
    });
    if (!talent) {
      return err(res, 404, {
        success: false,
        error: `Talent ${talentId} not found in org_talent_pools`,
        step: 'fetch_talent',
      });
    }

    // 4. Fetch mandate (from existing LYC `mandates` table, not the new T1 tables)
    const mandate = await selectOne('mandates', {
      column: 'id',
      value: mandateId,
    });
    if (!mandate) {
      return err(res, 404, {
        success: false,
        error: `Mandate ${mandateId} not found in mandates`,
        step: 'fetch_mandate',
      });
    }

    // 5. Build sources corpus
    const sources = buildSourcesFromTalent(talent);
    const corpus = buildCorpus(sources);

    // 6. Build prompt contexts
    const individualContext = buildIndividualContext(talent, corpus);
    const mandateContext = buildMandateContext(mandate);

    // 7. Run 5 LLM calls in parallel
    const subScores: SubScores = { C1: 0, C2: 0, C3: 0, C4: 0, C5: 0 };
    const rationales: Record<CriterionId, string> = {
      C1: '', C2: '', C3: '', C4: '', C5: '',
    };
    let totalTokens = 0;
    let modelUsed = 'deepseek-chat';

    try {
      const results = await Promise.all(
        (Object.keys(CRITERIA) as CriterionId[]).map(async (cId) => {
          const c = CRITERIA[cId];
          const prompt = buildCriterionPrompt(c, individualContext, mandateContext);
          const llm = await callLLM({ prompt });
          const parsed = parseScoreResponse(llm.content);
          return {
            cId,
            score: parsed.score,
            rationale: parsed.rationale,
            tokens: llm.totalTokens,
            model: llm.model,
          };
        })
      );
      for (const r of results) {
        subScores[r.cId] = r.score;
        rationales[r.cId] = r.rationale;
        totalTokens += r.tokens;
        modelUsed = r.model;
      }
    } catch (e) {
      if (e instanceof LLMError || e instanceof ParseScoreError) {
        return err(res, 502, {
          success: false,
          error: e.message,
          step: 'llm',
        });
      }
      throw e;
    }

    // 8. Composite + tier
    const composite = computeComposite(subScores);
    const tier = tierFor(composite);
    const tierL = tierLabel(tier);

    // 9. Upsert org_evaluation (header)
    let evaluationId: string;
    try {
      const existing = await selectOne('org_evaluations', {
        column: 'talent_id',
        value: talentId,
        select: 'id,eval_type,is_final',
      });
      // Filter by eval_type in JS (selectOne only does single-column eq)
      const existingMatch =
        existing && existing.eval_type === EVAL_TYPE ? existing : null;

      if (existingMatch) {
        evaluationId = existingMatch.id;
        await update(
          'org_evaluations',
          { column: 'id', value: evaluationId },
          {
            eval_date: new Date().toISOString().slice(0, 10),
            evaluator_id: user.id,
            overall_score: composite,
            scorecard: {
              sub_scores: subScores,
              tier,
              tier_label: tierL,
              source_count: corpus.sourcesUsed,
              sources_truncated: corpus.truncated,
              total_tokens: totalTokens,
              model: modelUsed,
            },
            notes: body.override_summary ?? null,
            is_final: true,
            updated_at: new Date().toISOString(),
          }
        );
      } else {
        const inserted = await insert('org_evaluations', {
          talent_id: talentId,
          eval_type: EVAL_TYPE,
          eval_date: new Date().toISOString().slice(0, 10),
          evaluator_id: user.id,
          overall_score: composite,
          scorecard: {
            sub_scores: subScores,
            tier,
            tier_label: tierL,
            source_count: corpus.sourcesUsed,
            sources_truncated: corpus.truncated,
            total_tokens: totalTokens,
            model: modelUsed,
          },
          notes: body.override_summary ?? null,
          is_final: true,
        });
        if (!inserted?.id) {
          throw new Error('org_evaluations insert returned no id');
        }
        evaluationId = inserted.id;
      }
    } catch (e) {
      return err(res, 500, {
        success: false,
        error: `Persist org_evaluations failed: ${(e as Error).message}`,
        step: 'persist_evaluation',
      });
    }

    // 10. Replace 5 org_evaluation_scores rows (delete existing + insert new)
    try {
      await deleteRows('org_evaluation_scores', {
        column: 'evaluation_id',
        value: evaluationId,
      });
      const scoreRows = (Object.keys(CRITERIA) as CriterionId[]).map((cId) => ({
        evaluation_id: evaluationId,
        criterion_key: cId,
        criterion_label: CRITERIA[cId].name,
        score: subScores[cId],
        source: modelUsed,
        rationale: rationales[cId],
        confidence: 0.85, // placeholder; future iteration can derive from LLM metadata
      }));
      await insert('org_evaluation_scores', scoreRows);
    } catch (e) {
      return err(res, 500, {
        success: false,
        error: `Persist org_evaluation_scores failed: ${(e as Error).message}`,
        step: 'persist_scores',
      });
    }

    // 11. Audit log (failures here don't fail the call)
    try {
      await insert('org_audit_log', {
        actor_id: user.id,
        action: 'scoring.compute',
        resource_type: 'org_evaluation',
        resource_id: evaluationId,
        after_state: {
          talent_id: talentId,
          mandate_id: mandateId,
          sub_scores: subScores,
          composite,
          tier,
          total_tokens: totalTokens,
          source_count: corpus.sourcesUsed,
        },
        ip_address:
          (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
          req.socket?.remoteAddress ||
          null,
        user_agent: (req.headers['user-agent'] as string) || null,
      });
    } catch (auditErr) {
      // Audit failure is non-fatal — log it and continue
      console.error(
        `[scoring.compute] audit log failed for evaluation ${evaluationId}:`,
        auditErr
      );
    }

    // 12. Success response
    const response: ComputeSuccessResponse = {
      success: true,
      evaluation_id: evaluationId,
      talent_id: talentId,
      mandate_id: mandateId,
      sub_scores: subScores,
      composite,
      tier,
      tier_label: tierL,
      rationale: rationales,
      source_count: corpus.sourcesUsed,
      sources_truncated: corpus.truncated,
      total_tokens: totalTokens,
      duration_ms: Date.now() - start,
      overridden: Boolean(body.override_summary),
      model: modelUsed,
    };
    return res.status(200).json(response);
  } catch (e) {
    return handleError(res, 'scoring.compute', e) as VercelResponse;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

/**
 * Build a Source list from the talent row.
 * Phase 1: use LinkedIn URL + admin-supplied attributes.sources array.
 * Future: integrate sourcing_channels (web scraper) + org_talent_attachments.
 */
function buildSourcesFromTalent(talent: any): Source[] {
  const sources: Source[] = [];

  if (talent.linkedin_url) {
    sources.push({
      url: talent.linkedin_url,
      title: `${talent.name} — LinkedIn profile`,
      snippet: [
        talent.title && `Title: ${talent.title}.`,
        talent.bu && `Business Unit: ${talent.bu}.`,
        talent.level != null && `Level: ${talent.level}.`,
        talent.location && `Location: ${talent.location}.`,
        talent.tenure_years != null && `Tenure: ${talent.tenure_years} years.`,
        talent.is_leadership && 'Leadership role.',
      ]
        .filter(Boolean)
        .join(' '),
      sourceType: 'professional_network',
    });
  }

  if (
    talent.attributes &&
    Array.isArray(talent.attributes.sources) &&
    talent.attributes.sources.length > 0
  ) {
    for (const s of talent.attributes.sources) {
      if (s && typeof s === 'object' && s.url && s.title) {
        sources.push({
          url: String(s.url),
          title: String(s.title),
          snippet: String(s.snippet ?? ''),
          publishedAt: s.publishedAt,
          sourceType: 'admin_supplied',
        });
      }
    }
  }

  if (talent.email) {
    sources.push({
      url: `mailto:${talent.email}`,
      title: `Direct contact — ${talent.email}`,
      snippet: `Admin-verified direct contact for ${talent.name}.`,
      sourceType: 'admin_supplied',
    });
  }

  return sources;
}

function buildIndividualContext(talent: any, corpus: BuildCorpusResult): string {
  const lines = [
    `Name: ${talent.name ?? 'Unknown'}`,
    `Title: ${talent.title ?? 'Unknown'}`,
    `Business Unit: ${talent.bu ?? 'Unknown'}`,
    `Level: ${talent.level ?? 'Unknown'}`,
    `Location: ${talent.location ?? 'Unknown'}`,
    `Tenure (years): ${talent.tenure_years ?? 'Unknown'}`,
    `Is Leadership: ${talent.is_leadership ? 'Yes' : 'No'}`,
    `Status: ${talent.status ?? 'Unknown'}`,
    '',
    'Admin attributes (free-form JSON):',
    JSON.stringify(talent.attributes ?? {}, null, 2),
    '',
    `Sources used in evaluation (${corpus.sourcesUsed} of ${corpus.sourcesTotal} available${corpus.truncated ? ', truncated to fit' : ''}):`,
    corpus.context || '(no sources available — base assessment on admin attributes only)',
  ];
  return lines.join('\n');
}

function buildMandateContext(mandate: any): string {
  return [
    `Mandate title: ${mandate.title ?? 'Unknown'}`,
    `Client: ${mandate.client ?? 'Unknown'}`,
    `Sector: ${mandate.sector ?? 'Unknown'}`,
    `Geography: ${mandate.geography ?? 'Unknown'}`,
    `Engagement type: ${mandate.engagement_type ?? 'Unknown'}`,
    `Role description: ${mandate.role_description ?? 'Not provided'}`,
    `Engagement notes: ${mandate.notes ?? 'None'}`,
  ].join('\n');
}
