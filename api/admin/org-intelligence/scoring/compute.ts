/**
 * POST /api/admin/org-intelligence/scoring/compute
 *
 * ─────────────────────────────────────────────────────────────────
 * ADMIN MODE (default):
 *   Body: { talent_id: string, mandate_id: string, force?: boolean, override_summary?: string }
 *   Auth: verifyAdmin required
 *   DB:   persists to org_evaluations + org_evaluation_scores + org_audit_log
 *
 * PUBLIC MODE (legacy candidate matching, opt-in):
 *   Body: { public: true, jd: string, candidates: [{name: string, cv: string}] }
 *   Auth: NONE (open endpoint, used by legacy MatchPage / BatchScoringPage /
 *         Shortlist1Pager / CandidateList / ResultsTable)
 *   DB:   none (pure compute, ephemeral)
 *   Output: legacy 3-dim shape (composite_score, dimension_scores, match_reasons,
 *           risk_factors, approach_strategy) PLUS v1.2 sub_scores (C1-C5) on the side.
 *
 * Public mode exists because Vercel Hobby plan caps serverless functions at 12
 * and legacy /api/score.ts was deleted (commit 91acfb623e) to fit the T3/T4/T6
 * org-intel endpoints. By accepting legacy requests with public:true, we ship one
 * function that serves both the admin org-intel flow AND the public candidate-match flow.
 *
 * Source: docs/org_intelligence_scoring_spec_v1.2.md
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAdmin } from '../../../_lib/adminAuth.js';
import {
  isSupabaseConfigured,
  selectOne,
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
  LLM_MODEL,
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
  public?: boolean;
  jd?: string;
  candidates?: Array<{ name?: string; cv?: string }>;
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

interface PublicCandidateResult {
  candidate_name: string;
  composite_score: number;
  dimension_scores: { experience: number; skills: number; fit: number };
  match_reasons: string[];
  risk_factors: string[];
  approach_strategy: string;
  sub_scores: SubScores;
}

interface PublicSuccessResponse {
  success: true;
  results: PublicCandidateResult[];
  total_tokens: number;
  duration_ms: number;
  model: string;
}

type ComputeErrorResponse = {
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
};

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

    const body = (req.body ?? {}) as ComputeRequestBody;

    // ─── PUBLIC MODE BRANCH (legacy candidate matching) ─────────────
    if (body.public === true) {
      return await handlePublicMode(res, body, start);
    }

    // ─── ADMIN MODE BRANCH (org-intel talent scoring) ───────────────
    return await handleAdminMode(req, res, body, start);
  } catch (e) {
    return handleError(res, 'scoring.compute', e) as VercelResponse;
  }
}

// ─────────────────────────────────────────────────────────────────
// Public mode — legacy candidate matching (no auth, no DB)
// ─────────────────────────────────────────────────────────────────
async function handlePublicMode(
  res: VercelResponse,
  body: ComputeRequestBody,
  start: number
): Promise<VercelResponse> {
  if (!body.jd || typeof body.jd !== 'string' || body.jd.trim().length < 20) {
    return res.status(400).json({
      success: false,
      error: 'public mode requires jd (job description) of at least 20 characters',
    });
  }
  if (!Array.isArray(body.candidates) || body.candidates.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'public mode requires non-empty candidates[] array',
    });
  }
  if (body.candidates.length > 20) {
    return res.status(400).json({
      success: false,
      error: 'public mode supports up to 20 candidates per request (rate-limit guard)',
    });
  }
  for (const [i, c] of body.candidates.entries()) {
    if (!c || typeof c.name !== 'string' || !c.name.trim()) {
      return res.status(400).json({
        success: false,
        error: `candidates[${i}].name is required`,
      });
    }
    if (typeof c.cv !== 'string' || c.cv.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: `candidates[${i}].cv is required (min 10 chars)`,
      });
    }
  }

  let totalTokens = 0;
  let modelUsed = LLM_MODEL;

  try {
    const results = await Promise.all(
      body.candidates!.map(async (cand) => {
        const prompt = buildPublicPrompt(body.jd!, cand.name!, cand.cv!);
        const llm = await callLLM({ prompt });
        const parsed = parsePublicResponse(llm.content);
        totalTokens += llm.totalTokens;
        modelUsed = llm.model;
        return projectToLegacy(parsed, cand.name!);
      })
    );

    const response: PublicSuccessResponse = {
      success: true,
      results,
      total_tokens: totalTokens,
      duration_ms: Date.now() - start,
      model: modelUsed,
    };
    return res.status(200).json(response);
  } catch (e) {
    if (e instanceof LLMError) {
      return res.status(502).json({ success: false, error: e.message });
    }
    if (e instanceof Error && /public response parse/i.test(e.message)) {
      return res.status(502).json({ success: false, error: e.message });
    }
    throw e;
  }
}

interface PublicParsed {
  C1: number;
  C2: number;
  C3: number;
  C4: number;
  C5: number;
  match_reasons: string[];
  risk_factors: string[];
  approach_strategy: string;
}

function buildPublicPrompt(jd: string, name: string, cv: string): string {
  return `You are an executive search consultant evaluating a candidate for a client mandate.

ROLE (job description):
${jd}

CANDIDATE:
Name: ${name}
Background:
${cv}

Apply the 5-criteria executive assessment framework. Each criterion is scored 0-20.

C1 — Tenure & Track Record
  0-7:  Frequent short tenures, employment gaps, limited scope growth
  8-13: Stable progression with some scope growth
  14-20: Long stable tenure with progressive responsibility, leadership roles

C2 — Network & Influence
  0-7:  Limited visibility, narrow industry footprint
  8-13: Known within immediate company or function
  14-20: Recognized authority, speaking/publishing/advisory, well-connected

C3 — Performance & Impact
  0-7:  Vague achievements, limited quantifiable outcomes
  8-13: Some attributable wins, clear business impact
  14-20: Specific, attributable, compounding business outcomes

C4 — Mobility & Adaptability
  0-7:  Deep specialization, geographic or functional constraints
  8-13: Some cross-functional exposure, willing to move within scope
  14-20: Demonstrated pivots, international experience, flexible scope

C5 — Cultural & Mandate Fit
  0-7:  Past roles in very different cultural or governance contexts
  8-13: Some alignment with mandate context
  14-20: Strong alignment with mandate stakeholders, pace, governance

Also provide 3-5 concise match reasons (why this candidate fits), 1-3 risk factors (gaps or
concerns), and a one-sentence approach strategy for engaging this candidate.

Respond with ONLY this JSON (no markdown, no code fences, no prose):
{
  "C1": <integer 0-20>,
  "C2": <integer 0-20>,
  "C3": <integer 0-20>,
  "C4": <integer 0-20>,
  "C5": <integer 0-20>,
  "match_reasons": ["<short reason 1>", "<short reason 2>", "<short reason 3>"],
  "risk_factors": ["<short risk 1>"],
  "approach_strategy": "<1-sentence approach for engaging this candidate>"
}`;
}

/**
 * Extract the first top-level JSON object from a string by tracking
 * brace depth and respecting JSON string boundaries. Tolerant to LLM
 * responses that include prose or commentary before/after the JSON.
 */
function extractFirstJsonObject(text: string): string | null {
  let depth = 0;
  let start = -1;
  let inString = false;
  let escape = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (ch === '"') { inString = false; }
      continue;
    }
    if (ch === '"') { inString = true; continue; }
    if (ch === '{') {
      if (start === -1) start = i;
      depth++;
    } else if (ch === '}') {
      if (depth === 0) continue;
      depth--;
      if (depth === 0 && start !== -1) {
        return text.slice(start, i + 1);
      }
    }
  }
  return null;
}

function parsePublicResponse(raw: string): PublicParsed {
  let text = raw.trim();
  text = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  let obj: any = null;
  // 1. Try as-is
  try { obj = JSON.parse(text); } catch {}
  // 2. Try extracting first balanced JSON object (handles trailing prose)
  if (!obj) {
    const extracted = extractFirstJsonObject(text);
    if (extracted) {
      try { obj = JSON.parse(extracted); } catch {}
    }
  }
  if (!obj) {
    throw new Error(`public response parse: no JSON object found: ${raw.slice(0, 200)}`);
  }

  const clamp20 = (v: any) => {
    const n = Math.round(Number(v));
    if (!Number.isFinite(n)) {
      throw new Error('public response parse: non-numeric sub-score');
    }
    return Math.max(0, Math.min(20, n));
  };

  const reasons = Array.isArray(obj.match_reasons)
    ? obj.match_reasons.slice(0, 5).map((s: any) => String(s).slice(0, 200))
    : [];
  const risks = Array.isArray(obj.risk_factors)
    ? obj.risk_factors.slice(0, 5).map((s: any) => String(s).slice(0, 200))
    : [];
  const approach =
    typeof obj.approach_strategy === 'string'
      ? obj.approach_strategy.slice(0, 500)
      : '';

  return {
    C1: clamp20(obj.C1),
    C2: clamp20(obj.C2),
    C3: clamp20(obj.C3),
    C4: clamp20(obj.C4),
    C5: clamp20(obj.C5),
    match_reasons: reasons,
    risk_factors: risks,
    approach_strategy: approach,
  };
}

/**
 * Project 5-criteria sub-scores (each 0-20) to legacy 3-dim shape (each 0-100).
 *   experience = (C1*0.6 + C3*0.4) * 5    [Tenure-heavy + Performance]
 *   skills     = (C3*0.7 + C2*0.3) * 5    [Performance-heavy + Network]
 *   fit        = (C5*0.7 + C2*0.3) * 5    [Cultural-heavy + Network]
 *   composite  = 0.40*experience + 0.35*skills + 0.25*fit  (legacy weights)
 */
function projectToLegacy(parsed: PublicParsed, name: string): PublicCandidateResult {
  const sub_scores: SubScores = {
    C1: parsed.C1,
    C2: parsed.C2,
    C3: parsed.C3,
    C4: parsed.C4,
    C5: parsed.C5,
  };
  const experience = Math.round((parsed.C1 * 0.6 + parsed.C3 * 0.4) * 5);
  const skills = Math.round((parsed.C3 * 0.7 + parsed.C2 * 0.3) * 5);
  const fit = Math.round((parsed.C5 * 0.7 + parsed.C2 * 0.3) * 5);
  const composite = Math.round(0.40 * experience + 0.35 * skills + 0.25 * fit);
  return {
    candidate_name: name,
    composite_score: composite,
    dimension_scores: { experience, skills, fit },
    match_reasons: parsed.match_reasons,
    risk_factors: parsed.risk_factors,
    approach_strategy: parsed.approach_strategy,
    sub_scores,
  };
}

// ─────────────────────────────────────────────────────────────────
// Admin mode — org-intel talent scoring (original flow)
// ─────────────────────────────────────────────────────────────────
async function handleAdminMode(
  req: VercelRequest,
  res: VercelResponse,
  body: ComputeRequestBody,
  start: number
): Promise<VercelResponse> {
  const { user, error: authErr } = await verifyAdmin(req);
  if (authErr || !user) {
    return err(res, 401, {
      success: false,
      error: authErr || 'Unauthorized',
      step: 'auth',
    });
  }

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

  const sources = buildSourcesFromTalent(talent);
  const corpus = buildCorpus(sources);
  const individualContext = buildIndividualContext(talent, corpus);
  const mandateContext = buildMandateContext(mandate);

  const subScores: SubScores = { C1: 0, C2: 0, C3: 0, C4: 0, C5: 0 };
  const rationales: Record<CriterionId, string> = {
    C1: '',
    C2: '',
    C3: '',
    C4: '',
    C5: '',
  };
  let totalTokens = 0;
  let modelUsed = LLM_MODEL;

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

  const composite = computeComposite(subScores);
  const tier = tierFor(composite);
  const tierL = tierLabel(tier);

  let evaluationId: string;
  try {
    const existing = await selectOne('org_evaluations', {
      column: 'talent_id',
      value: talentId,
      select: 'id,eval_type,is_final',
    });
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
      confidence: 0.85,
    }));
    await insert('org_evaluation_scores', scoreRows);
  } catch (e) {
    return err(res, 500, {
      success: false,
      error: `Persist org_evaluation_scores failed: ${(e as Error).message}`,
      step: 'persist_scores',
    });
  }

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
    console.error(
      `[scoring.compute] audit log failed for evaluation ${evaluationId}:`,
      auditErr
    );
  }

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
}

// ─────────────────────────────────────────────────────────────────
// Admin-mode helpers
// ─────────────────────────────────────────────────────────────────
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
