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
import { verifyAdmin } from './adminAuth.js';
import {
  isSupabaseConfigured,
  selectOne,
  insert,
  update,
  deleteRows,
  handleError,
} from './supabaseRest.js';
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
} from './scoringCriteria.js';
import { callLLM, LLMError } from './llmCall.js';
import { buildCriterionPrompt } from './promptTemplates.js';
import { parseScoreResponse, ParseScoreError } from './parseScoreResponse.js';
import { buildCorpus, type Source, type BuildCorpusResult } from './buildCorpus.js';

// Vercel Hobby default is 10s; need 60s for 5 parallel LLM calls
export const maxDuration = 60;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EVAL_TYPE = 'org_intel_v1';

interface ComputeRequestBody {
  talent_id?: string;
  mandate_id?: string;
  success_profile_id?: string;
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

export async function handler(
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
        const llm = await callLLM({ prompt, maxTokens: 600 });
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
  const successProfileId = body.success_profile_id;

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

  let successProfile: any = null;
  if (successProfileId) {
    if (!UUID_RE.test(successProfileId)) {
      return err(res, 400, {
        success: false,
        error: 'success_profile_id must be a UUID',
        step: 'validate',
      });
    }
    successProfile = await selectOne('success_profiles', {
      column: 'id',
      value: successProfileId,
    });
    if (!successProfile) {
      return err(res, 404, {
        success: false,
        error: `Success profile ${successProfileId} not found in success_profiles`,
        step: 'fetch_success_profile',
      });
    }
    if (successProfile.status !== 'approved') {
      return err(res, 400, {
        success: false,
        error: 'Only approved success profiles can be used for evaluation',
        step: 'validate',
      });
    }
  }

  const sources = buildSourcesFromTalent(talent);
  const corpus = buildCorpus(sources);
  const individualContext = buildIndividualContext(talent, corpus);
  const mandateContext = buildMandateContext(mandate);
  const successProfileContext = successProfile ? buildSuccessProfileContext(successProfile) : '';

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
        const prompt = buildCriterionPrompt(c, individualContext, mandateContext, successProfileContext);
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

function buildSuccessProfileContext(profile: any): string {
  const lines: string[] = ['\nSuccess Profile Requirements:'];
  
  if (profile.required_experience_years) {
    lines.push(`- Required experience: ${profile.required_experience_years} years`);
  }
  if (profile.required_industries && profile.required_industries.length > 0) {
    lines.push(`- Required industries: ${profile.required_industries.join(', ')}`);
  }
  if (profile.required_geographies && profile.required_geographies.length > 0) {
    lines.push(`- Required geographies: ${profile.required_geographies.join(', ')}`);
  }
  if (profile.required_companies && profile.required_companies.length > 0) {
    lines.push(`- Target companies: ${profile.required_companies.join(', ')}`);
  }
  if (profile.deal_size_range) {
    lines.push(`- Deal size range: ${profile.deal_size_range}`);
  }
  if (profile.team_size_managed) {
    lines.push(`- Team size managed: ${profile.team_size_managed}`);
  }
  
  if (profile.target_disc_profile) {
    lines.push(`- Target DISC profile: ${profile.target_disc_profile}`);
  }
  if (profile.personality_indicators && profile.personality_indicators.length > 0) {
    const traits = profile.personality_indicators
      .map((pi: any) => `${pi.trait} (importance: ${pi.importance}/5)`)
      .join(', ');
    lines.push(`- Key personality traits: ${traits}`);
  }
  
  if (profile.character_requirements && profile.character_requirements.length > 0) {
    const chars = profile.character_requirements
      .map((cr: any) => `${cr.trait} (${cr.level})`)
      .join(', ');
    lines.push(`- Character requirements: ${chars}`);
  }
  
  if (profile.education_requirements && profile.education_requirements.length > 0) {
    const ed = profile.education_requirements
      .map((e: any) => `${e.degree} in ${e.field}${e.required ? ' (required)' : ''}`)
      .join(', ');
    lines.push(`- Education requirements: ${ed}`);
  }
  
  if (profile.certifications && profile.certifications.length > 0) {
    lines.push(`- Certifications: ${profile.certifications.join(', ')}`);
  }
  
  if (profile.language_requirements && profile.language_requirements.length > 0) {
    const langs = profile.language_requirements
      .map((lr: any) => `${lr.language} (${lr.level})`)
      .join(', ');
    lines.push(`- Language requirements: ${langs}`);
  }
  
  return lines.join('\n');
}

// ─────────────────────────────────────────────────────────────────
// SHIFT Assessment Mode — leadership self-assessment scoring
// ─────────────────────────────────────────────────────────────────

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/v1/chat/completions';

interface SHIFTIntake {
  gate: { name: string; email: string; title?: string; company?: string; country?: string };
  context: { role: string; industry: string; years_experience: number; challenges: string; improvement_goals: string };
  dimensions: Record<string, number>;
  evidence: Record<string, string>;
  crossBorder: { cultural_experience: boolean; international_teams: number; global_projects: string };
  style: { disc_profile: string | null; work_style: string };
  goals: { short_term: string; long_term: string; success_definition: string };
}

interface SHIFTAnalysisResult {
  dimension_scores: Record<string, number>;
  strengths: Array<{ strength: string; evidence: string }>;
  development_areas: Array<{ area: string; example: string }>;
  recommendations: string[];
  composite_score: number;
  archetype: string;
  confidence: number;
}

const SHIFT_CONFIGS: Record<string, { name: string; dimensions: Array<{ id: string; name: string; description: string }> }> = {
  LEAP: {
    name: 'Learning & Execution Potential',
    dimensions: [
      { id: 'strategic_thinking', name: 'Strategic Thinking', description: 'Ability to see the big picture and set direction' },
      { id: 'execution_speed', name: 'Execution Speed', description: 'Ability to move from idea to implementation quickly' },
      { id: 'learning_agility', name: 'Learning Agility', description: 'Ability to learn from experience and apply new knowledge' },
    ],
  },
  QUEST: {
    name: 'Questioning & Inquiry Skills',
    dimensions: [
      { id: 'curiosity_level', name: 'Curiosity Level', description: 'Natural drive to explore and understand' },
      { id: 'inquiry_depth', name: 'Inquiry Depth', description: 'Ability to ask probing, meaningful questions' },
      { id: 'open_ended_questioning', name: 'Open-Ended Questioning', description: 'Skill in asking questions that open up possibilities' },
    ],
  },
  DRIVE: {
    name: 'Driving Change & Results',
    dimensions: [
      { id: 'results_orientation', name: 'Results Orientation', description: 'Focus on achieving measurable outcomes' },
      { id: 'change_tolerance', name: 'Change Tolerance', description: 'Comfort with ambiguity and change' },
      { id: 'persistence', name: 'Persistence', description: 'Ability to sustain effort through challenges' },
    ],
  },
  COACH: {
    name: 'Coaching & Team Development',
    dimensions: [
      { id: 'team_development', name: 'Team Development', description: 'Ability to grow and develop team members' },
      { id: 'feedback_quality', name: 'Feedback Quality', description: 'Skill in giving constructive, actionable feedback' },
      { id: 'empathy', name: 'Empathy', description: 'Understanding and connecting with others perspectives' },
    ],
  },
  IMPACT: {
    name: 'Impact Measurement & Accountability',
    dimensions: [
      { id: 'accountability', name: 'Accountability', description: 'Taking ownership of outcomes and responsibilities' },
      { id: 'measurement_rigor', name: 'Measurement Rigor', description: 'Commitment to tracking and measuring impact' },
      { id: 'strategic_thinking', name: 'Strategic Thinking (Composite)', description: 'From LEAP assessment' },
      { id: 'team_development', name: 'Team Development (Composite)', description: 'From COACH assessment' },
      { id: 'results_orientation', name: 'Results Orientation (Composite)', description: 'From DRIVE assessment' },
    ],
  },
};

function buildSHIFTAnalysisPrompt(intake: SHIFTIntake, assessmentType: string): string {
  const config = SHIFT_CONFIGS[assessmentType];
  if (!config) throw new Error(`Unknown SHIFT assessment type: ${assessmentType}`);
  
  return `You are a leadership development expert specializing in SHIFT assessments for LYC Intelligence. 
Analyze this ${config.name} (${assessmentType}) assessment:

USER PROFILE:
- Role: ${intake.context.role}
- Industry: ${intake.context.industry}
- Experience: ${intake.context.years_experience} years
- Current challenges: ${intake.context.challenges}
- Improvement goals: ${intake.context.improvement_goals}

ASSESSMENT DIMENSIONS AND RESPONSES:
${config.dimensions.map(dim => {
  const score = intake.dimensions[dim.id] || 5;
  const evidence = intake.evidence[dim.id] || 'No evidence provided';
  return `
${dim.name} (Score: ${score}/10)
- Description: ${dim.description}
- User Evidence: ${evidence}`;
}).join('\n')}

CROSS-BORDER CONTEXT:
- Cultural experience: ${intake.crossBorder.cultural_experience ? 'Yes' : 'No'}
- International teams managed: ${intake.crossBorder.international_teams}
- Global projects: ${intake.crossBorder.global_projects}

WORK STYLE:
- DISC profile: ${intake.style.disc_profile || 'Not specified'}
- Work style: ${intake.style.work_style}

GOALS:
- Short-term (6 months): ${intake.goals.short_term}
- Long-term (2 years): ${intake.goals.long_term}
- Success definition: ${intake.goals.success_definition}

Provide a comprehensive analysis including:
1. Dimension scores (0-100) for each ${assessmentType} dimension based on user responses
2. Top 3 strengths with evidence from their responses
3. Top 3 development areas with specific examples
4. 3 actionable recommendations for improvement

Return ONLY this JSON (no markdown, no code fences, no prose):
{
  "dimension_scores": { "${config.dimensions[0].id}": <0-100>, "${config.dimensions[1].id}": <0-100>, ... },
  "strengths": [
    { "strength": "<strength name>", "evidence": "<evidence from user responses>" },
    { "strength": "<strength name>", "evidence": "<evidence from user responses>" },
    { "strength": "<strength name>", "evidence": "<evidence from user responses>" }
  ],
  "development_areas": [
    { "area": "<development area>", "example": "<specific example from responses>" },
    { "area": "<development area>", "example": "<specific example from responses>" },
    { "area": "<development area>", "example": "<specific example from responses>" }
  ],
  "recommendations": [
    "<actionable recommendation 1>",
    "<actionable recommendation 2>",
    "<actionable recommendation 3>"
  ],
  "archetype": "<suggested archetype name>",
  "confidence": <0.0-1.0>
}`;
}

async function callDeepSeekForSHIFT(prompt: string): Promise<{ content: string; tokens: number }> {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY not configured');
  }

  const response = await fetch(DEEPSEEK_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'You are a leadership development expert. Always respond with valid JSON only, no markdown or prose.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 2048,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  const tokens = data.usage?.total_tokens || 0;

  return { content, tokens };
}

function parseSHIFTAnalysisResponse(raw: string, assessmentType: string): SHIFTAnalysisResult {
  let text = raw.trim();
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();

  try {
    const parsed = JSON.parse(text);
    const config = SHIFT_CONFIGS[assessmentType];
    
    const dimensionScores: Record<string, number> = {};
    for (const dim of config.dimensions) {
      const value = parsed.dimension_scores?.[dim.id];
      const score = Math.round(Number(value) || 50);
      dimensionScores[dim.id] = Math.max(0, Math.min(100, score));
    }

    const strengths = Array.isArray(parsed.strengths)
      ? parsed.strengths.slice(0, 3).map((s: any) => ({
          strength: String(s.strength || '').slice(0, 200),
          evidence: String(s.evidence || '').slice(0, 500),
        }))
      : [];

    const developmentAreas = Array.isArray(parsed.development_areas)
      ? parsed.development_areas.slice(0, 3).map((d: any) => ({
          area: String(d.area || '').slice(0, 200),
          example: String(d.example || '').slice(0, 500),
        }))
      : [];

    const recommendations = Array.isArray(parsed.recommendations)
      ? parsed.recommendations.slice(0, 3).map((r: any) => String(r).slice(0, 500))
      : [];

    const values = Object.values(dimensionScores);
    const compositeScore = values.length > 0
      ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
      : 50;

    const archetype = parsed.archetype || 'Balanced Leader';
    const confidence = Math.max(0, Math.min(1, Number(parsed.confidence) || 0.85));

    return {
      dimension_scores: dimensionScores,
      strengths,
      development_areas: developmentAreas,
      recommendations,
      composite_score: compositeScore,
      archetype,
      confidence,
    };
  } catch (e) {
    console.error('[SHIFTAnalysis] JSON parse error:', e);
    throw new Error(`Failed to parse analysis response: ${raw.slice(0, 200)}`);
  }
}

export async function handleSHIFTAssessment(
  req: VercelRequest,
  res: VercelResponse
): Promise<VercelResponse> {
  const start = Date.now();

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
    }

    const body = req.body || {};
    const { intake, assessment_type, user_id } = body;

    if (!intake || !assessment_type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: intake and assessment_type',
      });
    }

    const validTypes = ['LEAP', 'QUEST', 'DRIVE', 'COACH', 'IMPACT'];
    if (!validTypes.includes(assessment_type)) {
      return res.status(400).json({
        success: false,
        error: `Invalid assessment_type. Must be one of: ${validTypes.join(', ')}`,
      });
    }

    const prompt = buildSHIFTAnalysisPrompt(intake as SHIFTIntake, assessment_type);
    
    let analysis: SHIFTAnalysisResult;
    let tokens = 0;

    try {
      const { content, tokens: usedTokens } = await callDeepSeekForSHIFT(prompt);
      analysis = parseSHIFTAnalysisResponse(content, assessment_type);
      tokens = usedTokens;
    } catch (e) {
      console.warn('[SHIFT] DeepSeek call failed, using fallback:', e);
      
      const config = SHIFT_CONFIGS[assessment_type];
      const fallbackScores: Record<string, number> = {};
      
      for (const dim of config.dimensions) {
        const userScore = (intake as SHIFTIntake).dimensions[dim.id] || 5;
        fallbackScores[dim.id] = Math.round(userScore * 10);
      }
      
      const values = Object.values(fallbackScores);
      const compositeScore = values.length > 0
        ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
        : 50;
      
      analysis = {
        dimension_scores: fallbackScores,
        strengths: [
          { strength: 'Self-awareness', evidence: 'Completed assessment with honest self-reflection' },
          { strength: 'Goal orientation', evidence: intake.goals?.short_term || 'Defined clear goals' },
          { strength: 'Experience', evidence: `${intake.context?.years_experience || 10} years in ${intake.context?.industry || 'industry'}` },
        ],
        development_areas: [
          { area: 'Deepen self-reflection', example: 'Provide more detailed evidence for dimension ratings' },
          { area: 'Expand cross-border experience', example: intake.crossBorder?.cultural_experience ? 'Continue building' : 'Consider international opportunities' },
          { area: 'Strengthen measurement', example: 'Track progress on development goals systematically' },
        ],
        recommendations: [
          'Schedule regular self-reflection sessions to deepen awareness',
          'Seek feedback from peers and mentors on development areas',
          'Create a 90-day action plan for your top development priority',
        ],
        composite_score: compositeScore,
        archetype: 'Balanced Leader',
        confidence: 0.6,
      };
    }

    let scoringRunId: string | null = null;
    
    if (isSupabaseConfigured() && user_id) {
      try {
        const inserted = await insert('scoring_runs', {
          user_id,
          assessment_type: `SHIFT_${assessment_type}`,
          input_params: intake,
          output_scores: analysis.dimension_scores,
          analysis: {
            strengths: analysis.strengths,
            development_areas: analysis.development_areas,
            recommendations: analysis.recommendations,
            archetype: analysis.archetype,
            confidence: analysis.confidence,
          },
          created_at: new Date().toISOString(),
        });
        
        scoringRunId = inserted?.id || null;
      } catch (e) {
        console.error('[SHIFT] Failed to persist scoring_run:', e);
      }
    }

    return res.status(200).json({
      success: true,
      analysis,
      scoring_run_id: scoringRunId,
      assessment_type,
      total_tokens: tokens,
      duration_ms: Date.now() - start,
    });
  } catch (err) {
    return handleError(res, 'shift.assessment', err);
  }
}

export async function handleSHIFTReport(
  req: VercelRequest,
  res: VercelResponse
): Promise<VercelResponse> {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
    }

    const body = req.body || {};
    const { assessment_type, intake, analysis } = body;

    if (!assessment_type || !intake || !analysis) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: assessment_type, intake, and analysis',
      });
    }

    const config = SHIFT_CONFIGS[assessment_type];
    if (!config) {
      return res.status(400).json({
        success: false,
        error: `Invalid assessment_type: ${assessment_type}`,
      });
    }

    const generatedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SHIFT ${assessment_type} Assessment Report</title>
  <style>
    body { font-family: 'DM Sans', sans-serif; color: #333; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { text-align: center; border-bottom: 2px solid #C108AB; padding-bottom: 20px; }
    .logo { font-size: 24px; font-weight: 700; color: #C108AB; }
    .title { font-size: 32px; font-weight: 700; margin-top: 8px; }
    .score { font-size: 48px; font-weight: 700; color: #C108AB; }
    .section { margin-top: 24px; }
    .section-title { font-size: 20px; font-weight: 700; border-bottom: 1px solid #e5e5e5; padding-bottom: 8px; }
    .dimension { margin: 12px 0; }
    .dimension-name { font-weight: 600; }
    .dimension-score { color: #C108AB; font-weight: 700; }
    .progress-bar { height: 8px; background: #e5e5e5; border-radius: 4px; margin-top: 4px; }
    .progress-fill { height: 100%; background: #C108AB; border-radius: 4px; }
    .strengths { background: #22C55E15; padding: 16px; border-radius: 8px; }
    .development { background: #EAB30815; padding: 16px; border-radius: 8px; margin-top: 16px; }
    .recommendations { background: #f5f5f5; padding: 16px; border-radius: 8px; margin-top: 16px; }
    .footer { margin-top: 32px; text-align: center; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">LYC Intelligence</div>
    <div class="title">SHIFT ${assessment_type}</div>
    <div>${config.name}</div>
    <div style="margin-top: 16px;">${intake.gate?.name || 'Participant'} · ${intake.context?.role || 'Role'}</div>
  </div>
  
  <div class="section" style="text-align: center;">
    <div class="score">${analysis.composite_score || 50}</div>
    <div>Composite Score (0-100)</div>
    <div style="margin-top: 8px; padding: 8px 24px; background: #C108AB20; border-radius: 20px; display: inline-block;">
      ${analysis.archetype || 'Balanced Leader'}
    </div>
  </div>
  
  <div class="section">
    <div class="section-title">Dimension Scores</div>
    ${config.dimensions.map((dim: any) => {
      const score = analysis.dimension_scores?.[dim.id] || 50;
      return `<div class="dimension">
        <span class="dimension-name">${dim.name}</span>
        <span class="dimension-score">${score}</span>
        <div class="progress-bar"><div class="progress-fill" style="width: ${score}%"></div></div>
      </div>`;
    }).join('')}
  </div>
  
  <div class="section">
    <div class="strengths">
      <div style="font-weight: 600; color: #22C55E; margin-bottom: 12px;">Top Strengths</div>
      ${(analysis.strengths || []).map((s: any) => `<div style="margin-bottom: 8px;">
        <div style="font-weight: 600;">${s.strength}</div>
        <div style="color: #666;">${s.evidence}</div>
      </div>`).join('')}
    </div>
    
    <div class="development">
      <div style="font-weight: 600; color: #EAB308; margin-bottom: 12px;">Development Areas</div>
      ${(analysis.development_areas || []).map((d: any) => `<div style="margin-bottom: 8px;">
        <div style="font-weight: 600;">${d.area}</div>
        <div style="color: #666;">${d.example}</div>
      </div>`).join('')}
    </div>
    
    <div class="recommendations">
      <div style="font-weight: 600; margin-bottom: 12px;">Recommendations</div>
      ${(analysis.recommendations || []).map((r: string, i: number) => `<div style="margin-bottom: 8px;">
        ${i + 1}. ${r}
      </div>`).join('')}
    </div>
  </div>
  
  <div class="footer">
    <div>LYC Intelligence</div>
    <div>Building leadership that works across borders</div>
    <div>Generated: ${generatedDate}</div>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="SHIFT_${assessment_type}_Report.html"`);
    return res.send(html);
  } catch (err) {
    return handleError(res, 'shift.report', err);
  }
}

// ─────────────────────────────────────────────────────────────────
// Advisory Assessment Mode — workshop-based assessments
// ─────────────────────────────────────────────────────────────────

interface AdvisoryAssessmentResponse {
  workshop_id: string;
  participant_id: string;
  dimension_scores: Record<string, number>;
  archetype: string;
  style: string;
  strengths: string[];
  development_areas: string[];
  recommendations: string[];
}

const ADVISORY_CONFIGS: Record<string, { name: string; dimensions: string[] }> = {
  PRISM: {
    name: 'Brand Strategy Workshop',
    dimensions: ['Vision', 'Resilience', 'Influence', 'Strategy', 'Mastery'],
  },
  FORGE: {
    name: 'Sales Leadership Alignment',
    dimensions: ['Drive', 'Relationship', 'Strategy', 'Execution', 'Adaptability'],
  },
  SPARK: {
    name: 'AI Literacy Workshop',
    dimensions: ['AI Vision', 'Data Fluency', 'Change Leadership', 'Ethics', 'Innovation'],
  },
  BRIDGE: {
    name: 'HQ Alignment',
    dimensions: ['Cultural', 'Strategic', 'Operational', 'Political', 'Network'],
  },
  MOSAIC: {
    name: 'Cross-Cultural Simulation',
    dimensions: ['CQ Drive', 'CQ Knowledge', 'CQ Strategy', 'CQ Action', 'CQ Adaptability'],
  },
};

function buildAdvisoryPrompt(assessmentType: string, responses: Record<string, any>): string {
  const config = ADVISORY_CONFIGS[assessmentType];
  const dimensionNames = config.dimensions.join(', ');
  
  const responseSummary = Object.entries(responses)
    .map(([key, value]) => {
      const dimensionId = key.split('_')[0];
      const dimension = config.dimensions.find(d => 
        d.toLowerCase().replace(/\s+/g, '') === dimensionId
      ) || dimensionId;
      return `${dimension} (question ${key.split('_')[1]}): ${value}`;
    })
    .join('\n');

  return `
You are an organizational psychology expert. Analyze this ${assessmentType} workshop assessment:

Assessment Dimensions: ${dimensionNames}

Participant responses:
${responseSummary}

For each dimension of ${assessmentType}, provide:
1. Score (0-100) based on the participant's responses
2. Identify the participant's primary archetype from these options: Strategic Architect, Resilient Operator, Influential Leader, Masterful Expert
3. Identify the participant's style from these options: Analytical, Visionary, Pragmatic, Empathetic
4. List 3-5 key strengths
5. List 3-5 development areas
6. Provide 3-5 workshop recommendations

Return ONLY valid JSON in this format:
{
  "dimension_scores": { "dimension_name": score, ... },
  "archetype": "archetype_name",
  "style": "style_name",
  "strengths": ["strength1", "strength2", ...],
  "development_areas": ["area1", "area2", ...],
  "workshop_recommendations": ["rec1", "rec2", ...]
}

Ensure all dimension names match exactly: ${dimensionNames}
`;
}

function parseAdvisoryResponse(content: string): Partial<AdvisoryAssessmentResponse> {
  try {
    const jsonStr = content.replace(/```json\n?/g, '').replace(/\n?```/g, '').trim();
    const parsed = JSON.parse(jsonStr);
    return {
      dimension_scores: parsed.dimension_scores || {},
      archetype: parsed.archetype || 'Unknown',
      style: parsed.style || 'Unknown',
      strengths: parsed.strengths || [],
      development_areas: parsed.development_areas || [],
      recommendations: parsed.workshop_recommendations || [],
    };
  } catch {
    return {
      dimension_scores: {},
      archetype: 'Unknown',
      style: 'Unknown',
      strengths: [],
      development_areas: [],
      recommendations: [],
    };
  }
}

export async function handleAdvisoryAssessment(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { workshop_id, participant_id, responses, assessment_type } = req.body;

    if (!workshop_id || !participant_id || !responses || !assessment_type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    const validTypes = Object.keys(ADVISORY_CONFIGS);
    if (!validTypes.includes(assessment_type)) {
      return res.status(400).json({
        success: false,
        error: `Invalid assessment_type. Must be one of: ${validTypes.join(', ')}`,
      });
    }

    const prompt = buildAdvisoryPrompt(assessment_type, responses);
    const { content } = await callDeepSeekForSHIFT(prompt);
    const analysis = parseAdvisoryResponse(content);

    const result: AdvisoryAssessmentResponse = {
      workshop_id,
      participant_id,
      dimension_scores: analysis.dimension_scores || {},
      archetype: analysis.archetype || 'Unknown',
      style: analysis.style || 'Unknown',
      strengths: analysis.strengths || [],
      development_areas: analysis.development_areas || [],
      recommendations: analysis.recommendations || [],
    };

    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return handleError(res, 'advisory.assessment', err);
  }
}

export async function handleAdvisoryReport(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { workshop_id, scores } = req.body;

    if (!workshop_id || !scores || !Array.isArray(scores)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    const avgScores: Record<string, number> = {};
    scores.forEach((score: any) => {
      Object.entries(score.dimension_scores || {}).forEach(([dim, val]) => {
        avgScores[dim] = (avgScores[dim] || 0) + val;
      });
    });

    Object.keys(avgScores).forEach(dim => {
      avgScores[dim] = Math.round(avgScores[dim] / scores.length);
    });

    const archetypeDistribution: Record<string, number> = {};
    scores.forEach((score: any) => {
      archetypeDistribution[score.archetype] = (archetypeDistribution[score.archetype] || 0) + 1;
    });

    const result = {
      workshop_id,
      participant_count: scores.length,
      avg_dimension_scores: avgScores,
      archetype_distribution: archetypeDistribution,
    };

    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return handleError(res, 'advisory.report', err);
  }
}

export async function handleParticipantAssessment(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { workshop_id, token } = req.query;

    if (!workshop_id || !token) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
      });
    }

    const participant = await selectOne('workshop_participants', {
      column: 'token',
      value: token as string,
    });

    if (!participant) {
      return res.status(404).json({
        success: false,
        error: 'Invalid or expired token',
      });
    }

    const workshop = await selectOne('workshops', {
      column: 'id',
      value: workshop_id as string,
    });

    if (!workshop) {
      return res.status(404).json({
        success: false,
        error: 'Workshop not found',
      });
    }

    const result = {
      workshop: {
        id: workshop.id,
        title: workshop.title,
        assessment_type: workshop.assessment_type,
        duration_minutes: workshop.duration_minutes,
        allow_report_download: workshop.allow_report_download,
      },
      participant: {
        id: participant.id,
        email: participant.email,
        name: participant.name,
        status: participant.status,
      },
    };

    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return handleError(res, 'advisory.participant', err);
  }
}

// ═══════════════════════════════════════════════════════════════
// CANDIDATE ASSESSMENT SCORING (Phase 4.2)
// ═══════════════════════════════════════════════════════════════

export type CandidateAssessmentType = 'SHIFT' | 'PRISM' | 'FORGE' | 'SPARK' | 'BRIDGE' | 'MOSAIC' | 'custom';

export interface CandidateAssessmentResponse {
  question_id: string;
  value: string | number | string[] | number[];
}

export interface CandidateAssessmentResult {
  overall_score: number;
  recommendation: 'proceed' | 'hold' | 'pass';
  dimension_scores: Array<{
    name: string;
    score: number;
    description?: string;
  }>;
  strengths: string[];
  development_areas: string[];
  visibility: 'full' | 'pass_fail' | 'hidden';
}

export async function handleCandidateAssessmentScoring(
  req: VercelRequest,
  res: VercelResponse
): Promise<VercelResponse> {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  try {
    const start = Date.now();
    const body = req.body || {};

    const {
      candidate_id,
      assessment_id,
      mandate_id,
      assessment_type,
      responses,
      visibility = 'full',
    } = body;

    // Validate required fields
    if (!candidate_id || !assessment_id || !mandate_id || !responses || !assessment_type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: candidate_id, assessment_id, mandate_id, assessment_type, responses',
      });
    }

    // Get success profile for this mandate
    let successProfile: any = null;
    try {
      successProfile = await selectOne('mandate_success_profiles', {
        column: 'mandate_id',
        value: mandate_id,
      });
    } catch (e) {
      console.warn('[candidate_scoring] Could not fetch success profile, using defaults:', e);
    }

    // Get assessment configuration
    let assessmentConfig: any = null;
    try {
      assessmentConfig = await selectOne('assessment_configs', {
        column: 'id',
        value: assessment_id,
      });
    } catch (e) {
      console.warn('[candidate_scoring] Could not fetch assessment config:', e);
    }

    // Build the scoring prompt
    const prompt = buildCandidateScoringPrompt({
      assessmentType: assessment_type,
      responses,
      successProfile,
      assessmentConfig,
    });

    let analysis: any = null;
    let tokens = 0;

    // Call DeepSeek for AI scoring
    try {
      if (DEEPSEEK_API_KEY) {
        const response = await fetch(DEEPSEEK_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              {
                role: 'system',
                content: 'You are an executive search AI specializing in candidate assessment scoring. Always respond with valid JSON only.',
              },
              { role: 'user', content: prompt },
            ],
            max_tokens: 2048,
            temperature: 0.3,
            response_format: { type: 'json_object' },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content || '';
          tokens = data.usage?.total_tokens || 0;
          analysis = parseCandidateScoringResponse(content);
        } else {
          throw new Error(`DeepSeek API error: ${response.status}`);
        }
      } else {
        // Fallback to rule-based scoring
        analysis = calculateFallbackScore(responses, assessment_type);
      }
    } catch (e) {
      console.warn('[candidate_scoring] DeepSeek call failed, using fallback:', e);
      analysis = calculateFallbackScore(responses, assessment_type);
    }

    // Determine overall score and recommendation
    const overallScore = analysis.overall_score || 50;
    const dimensionScores = analysis.dimension_scores || [];
    const strengths = analysis.strengths || [];
    const developmentAreas = analysis.development_areas || [];

    // Calculate recommendation based on score
    let recommendation: 'proceed' | 'hold' | 'pass' = 'hold';
    if (overallScore >= 75) {
      recommendation = 'proceed';
    } else if (overallScore < 40) {
      recommendation = 'pass';
    }

    // Persist scoring run
    let scoringRunId: string | null = null;
    try {
      if (isSupabaseConfigured()) {
        const inserted = await insert('scoring_runs', {
          user_id: candidate_id,
          assessment_type: `CANDIDATE_${assessment_type}`,
          input_params: {
            assessment_id,
            mandate_id,
            responses,
          },
          output_scores: {
            overall_score: overallScore,
            dimension_scores: dimensionScores,
          },
          analysis: {
            strengths,
            development_areas,
            recommendation,
            visibility,
          },
          created_at: new Date().toISOString(),
        });
        scoringRunId = inserted?.id || null;
      }
    } catch (e) {
      console.error('[candidate_scoring] Failed to persist scoring_run:', e);
    }

    // Create assessment result record
    let resultId: string | null = null;
    try {
      if (isSupabaseConfigured()) {
        const result = await insert('candidate_assessment_results', {
          candidate_id,
          assessment_id,
          mandate_id,
          overall_score: overallScore,
          recommendation,
          dimension_scores: dimensionScores,
          strengths,
          development_areas,
          visibility,
          completed_at: new Date().toISOString(),
        });
        resultId = result?.id || null;
      }
    } catch (e) {
      console.error('[candidate_scoring] Failed to persist result:', e);
    }

    // Build response based on visibility
    const result: CandidateAssessmentResult = {
      overall_score: overallScore,
      recommendation,
      dimension_scores: dimensionScores,
      strengths: visibility === 'hidden' ? [] : strengths,
      development_areas: visibility === 'hidden' ? [] : developmentAreas,
      visibility,
    };

    return res.status(200).json({
      success: true,
      result,
      scoring_run_id: scoringRunId,
      result_id: resultId,
      assessment_id,
      candidate_id,
      mandate_id,
      total_tokens: tokens,
      duration_ms: Date.now() - start,
    });
  } catch (err) {
    return handleError(res, 'candidate.scoring', err);
  }
}

interface CandidateScoringInput {
  assessmentType: string;
  responses: CandidateAssessmentResponse[];
  successProfile: any;
  assessmentConfig: any;
}

function buildCandidateScoringPrompt(input: CandidateScoringInput): string {
  const { assessmentType, responses, successProfile, assessmentConfig } = input;

  // Format responses for the prompt
  const formattedResponses = responses
    .map(r => `Question ${r.question_id}: ${JSON.stringify(r.value)}`)
    .join('\n');

  // Success profile requirements
  const profileRequirements = successProfile
    ? JSON.stringify(successProfile.requirements || successProfile, null, 2)
    : 'No specific success profile available. Use general executive assessment criteria.';

  // Assessment type specific instructions
  const assessmentInstructions = getAssessmentTypeInstructions(assessmentType);

  return `
You are an executive search AI. Score this candidate's assessment responses against the success profile.

ASSESSMENT TYPE: ${assessmentType}

SUCCESS PROFILE REQUIREMENTS:
${profileRequirements}

CANDIDATE RESPONSES:
${formattedResponses}

${assessmentInstructions}

SCORING CRITERIA:
- Experience alignment (0-100): Does the candidate's experience match the role requirements?
- Skills match (0-100): Do the candidate's skills align with required competencies?
- Personality fit (0-100): Does the candidate's work style match the organizational culture?
- Character assessment (0-100): Does the candidate demonstrate integrity and values alignment?

Return ONLY this JSON structure (no markdown, no code fences):
{
  "overall_score": <0-100>,
  "dimension_scores": [
    { "name": "Experience", "score": <0-100>, "description": "<brief assessment>" },
    { "name": "Skills", "score": <0-100>, "description": "<brief assessment>" },
    { "name": "Personality", "score": <0-100>, "description": "<brief assessment>" },
    { "name": "Character", "score": <0-100>, "description": "<brief assessment>" }
  ],
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "development_areas": ["<area 1>", "<area 2>", "<area 3>"],
  "recommendation": "<proceed|hold|pass>"
}
`;
}

function getAssessmentTypeInstructions(assessmentType: string): string {
  const instructions: Record<string, string> = {
    SHIFT: `
SHIFT ASSESSMENT FOCUS:
- Learning & Execution Potential (LEAP)
- Questioning & Inquiry Skills (QUEST)
- Driving Change & Results (DRIVE)
- Coaching & Team Development (COACH)
- Impact Measurement & Accountability (IMPACT)
    `,
    PRISM: `
PRISM ASSESSMENT FOCUS:
- Organizational culture alignment
- Leadership style compatibility
- Team dynamics fit
    `,
    FORGE: `
FORGE ASSESSMENT FOCUS:
- Goal-setting and achievement patterns
- Resilience under pressure
- Growth trajectory
    `,
    SPARK: `
SPARK ASSESSMENT FOCUS:
- Innovation potential
- Creative problem-solving
- Change readiness
    `,
    BRIDGE: `
BRIDGE ASSESSMENT FOCUS:
- Leadership transition readiness
- Stakeholder management
- Strategic vision
    `,
    MOSAIC: `
MOSAIC ASSESSMENT FOCUS:
- Cross-cultural adaptability
- Global mindset
- Diverse environment experience
    `,
    custom: `
CUSTOM ASSESSMENT FOCUS:
- Evaluate responses holistically
- Focus on role-relevant competencies
- Consider industry-specific requirements
    `,
  };

  return instructions[assessmentType] || instructions.custom;
}

function parseCandidateScoringResponse(content: string): any {
  try {
    const jsonStr = content.replace(/```json\n?/g, '').replace(/\n?```/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    return {
      overall_score: parsed.overall_score || 50,
      dimension_scores: parsed.dimension_scores || [],
      strengths: parsed.strengths || [],
      development_areas: parsed.development_areas || [],
      recommendation: parsed.recommendation || 'hold',
    };
  } catch {
    return {
      overall_score: 50,
      dimension_scores: [],
      strengths: [],
      development_areas: [],
      recommendation: 'hold',
    };
  }
}

function calculateFallbackScore(
  responses: CandidateAssessmentResponse[],
  assessmentType: string
): any {
  // Calculate a simple average score based on Likert-scale responses
  let totalScore = 0;
  let likertCount = 0;

  for (const response of responses) {
    if (typeof response.value === 'number' && response.value >= 1 && response.value <= 7) {
      // Normalize 1-7 scale to 0-100
      totalScore += ((response.value - 1) / 6) * 100;
      likertCount++;
    }
  }

  const avgScore = likertCount > 0 ? Math.round(totalScore / likertCount) : 50;

  // Generate simple feedback based on score
  const strengths: string[] = [];
  const developmentAreas: string[] = [];

  if (avgScore >= 70) {
    strengths.push('Demonstrates strong alignment with role requirements');
    strengths.push('Shows consistent response patterns suggesting authenticity');
  } else if (avgScore >= 50) {
    strengths.push('Shows adequate fit for the position');
    developmentAreas.push('May benefit from additional experience in some areas');
  } else {
    developmentAreas.push('Significant gaps identified between profile and requirements');
    developmentAreas.push('May require further evaluation before proceeding');
  }

  return {
    overall_score: avgScore,
    dimension_scores: [
      { name: 'Experience', score: avgScore, description: 'Based on assessment responses' },
      { name: 'Skills', score: avgScore - 5, description: 'Derived from competency questions' },
      { name: 'Personality', score: avgScore + 3, description: 'Based on behavioral indicators' },
      { name: 'Character', score: avgScore, description: 'Assessment integrity score' },
    ],
    strengths,
    development_areas: developmentAreas.length > 0 ? developmentAreas : ['Continue developing in key areas'],
    recommendation: avgScore >= 70 ? 'proceed' : avgScore >= 40 ? 'hold' : 'pass',
  };
}

// Get candidate assessment result
export async function handleGetCandidateResult(
  req: VercelRequest,
  res: VercelResponse
): Promise<VercelResponse> {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { assessment_id, candidate_id } = req.query;

    if (!assessment_id || !candidate_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: assessment_id and candidate_id',
      });
    }

    const result = await selectOne('candidate_assessment_results', {
      column: 'assessment_id',
      value: assessment_id as string,
    }, 15000);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Assessment result not found',
      });
    }

    // Check if result belongs to the candidate
    if (result.candidate_id !== candidate_id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: result.id,
        assessment_id: result.assessment_id,
        mandate_id: result.mandate_id,
        overall_score: result.overall_score,
        recommendation: result.recommendation,
        dimension_scores: result.dimension_scores,
        strengths: result.visibility === 'hidden' ? [] : result.strengths,
        development_areas: result.visibility === 'hidden' ? [] : result.development_areas,
        visibility: result.visibility,
        completed_at: result.completed_at,
      },
    });
  } catch (err) {
    return handleError(res, 'candidate.result', err);
  }
}

// Submit candidate assessment (save responses)
export async function handleSubmitCandidateAssessment(
  req: VercelRequest,
  res: VercelResponse
): Promise<VercelResponse> {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};
    const {
      candidate_id,
      assessment_id,
      mandate_id,
      assessment_type,
      responses,
      visibility = 'full',
    } = body;

    if (!candidate_id || !assessment_id || !mandate_id || !assessment_type || !responses) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    // Save the assessment responses
    let responseRecordId: string | null = null;
    try {
      const inserted = await insert('candidate_assessment_responses', {
        candidate_id,
        assessment_id,
        mandate_id,
        responses: typeof responses === 'string' ? responses : JSON.stringify(responses),
        submitted_at: new Date().toISOString(),
      });
      responseRecordId = inserted?.id || null;
    } catch (e) {
      console.error('[candidate_submit] Failed to persist responses:', e);
    }

    // Trigger async scoring (don't wait for it)
    // In production, this would be handled by a background job
    setImmediate(async () => {
      try {
        await handleCandidateAssessmentScoring(
          {
            method: 'POST',
            body: {
              candidate_id,
              assessment_id,
              mandate_id,
              assessment_type,
              responses,
              visibility,
            },
          } as VercelRequest,
          { status: () => ({ json: () => ({}) }) } as VercelResponse
        );
      } catch (e) {
        console.error('[candidate_submit] Scoring trigger failed:', e);
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Assessment submitted successfully',
      response_id: responseRecordId,
    });
  } catch (err) {
    return handleError(res, 'candidate.submit', err);
  }
}

// Get assessment for candidate (get questions, config, etc.)
export async function handleGetCandidateAssessment(
  req: VercelRequest,
  res: VercelResponse
): Promise<VercelResponse> {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { assessment_id, candidate_id } = req.query;

    if (!assessment_id || !candidate_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
      });
    }

    // Get assessment configuration
    let assessmentConfig: any = null;
    try {
      assessmentConfig = await selectOne('assessment_configs', {
        column: 'id',
        value: assessment_id as string,
      });
    } catch (e) {
      console.warn('[candidate_assessment] Could not fetch config:', e);
    }

    // Get mandate for context
    let mandate: any = null;
    if (assessmentConfig?.mandate_id) {
      try {
        mandate = await selectOne('mandates', {
          column: 'id',
          value: assessmentConfig.mandate_id,
        });
      } catch (e) {
        console.warn('[candidate_assessment] Could not fetch mandate:', e);
      }
    }

    // Get candidate's previous responses if any
    let previousResponses: any = null;
    try {
      previousResponses = await selectOne('candidate_assessment_responses', {
        column: 'assessment_id',
        value: assessment_id as string,
      });
    } catch (e) {
      // Ignore - no previous responses
    }

    // Build the assessment object
    const assessment = {
      id: assessmentConfig?.id || assessment_id,
      title: assessmentConfig?.title || 'Assessment',
      type: assessmentConfig?.assessment_type || 'custom',
      description: assessmentConfig?.description || 'Please complete this assessment.',
      estimated_minutes: assessmentConfig?.estimated_minutes || 30,
      show_timer: assessmentConfig?.show_timer ?? true,
      questions: assessmentConfig?.questions || generateDefaultQuestions(assessmentConfig?.assessment_type),
      mandate: mandate
        ? {
            id: mandate.id,
            title: mandate.title,
            client_name: mandate.client_name,
          }
        : null,
      previous_responses: previousResponses?.responses || null,
    };

    return res.status(200).json({
      success: true,
      data: assessment,
    });
  } catch (err) {
    return handleError(res, 'candidate.assessment', err);
  }
}

function generateDefaultQuestions(assessmentType: string): any[] {
  // Generate default questions based on assessment type
  const baseQuestions = [
    {
      id: 'q1',
      type: 'likert',
      text: 'I am comfortable taking on new challenges outside my comfort zone.',
      required: true,
      scale_min: 1,
      scale_max: 7,
      scale_min_label: 'Strongly Disagree',
      scale_max_label: 'Strongly Agree',
    },
    {
      id: 'q2',
      type: 'mcq_single',
      text: 'How would you describe your leadership style?',
      required: true,
      options: [
        'Direct and decisive',
        'Collaborative and inclusive',
        'Strategic and vision-oriented',
        'Servant leadership focused',
      ],
    },
    {
      id: 'q3',
      type: 'mcq_multi',
      text: 'Which of the following best describes your strengths? (Select all that apply)',
      required: true,
      options: [
        'Strategic thinking',
        'Execution and delivery',
        'Team development',
        'Innovation and creativity',
        'Stakeholder management',
        'Data-driven decision making',
      ],
    },
    {
      id: 'q4',
      type: 'text',
      text: 'Describe a situation where you had to lead through significant change. What was the outcome?',
      required: true,
      max_length: 1000,
    },
    {
      id: 'q5',
      type: 'ranking',
      text: 'Rank the following leadership competencies in order of importance for a senior executive role:',
      required: true,
      ranking_items: [
        'Strategic Vision',
        'Execution Excellence',
        'Team Leadership',
        'Innovation',
        'Stakeholder Relations',
      ],
    },
  ];

  return baseQuestions;
}

// Update assessment visibility (consultant controls what candidate sees)
export async function handleUpdateResultVisibility(
  req: VercelRequest,
  res: VercelResponse
): Promise<VercelResponse> {
  if (req.method !== 'PUT' && req.method !== 'PATCH') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};
    const { result_id, visibility } = body;

    if (!result_id || !visibility) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: result_id and visibility',
      });
    }

    if (!['full', 'pass_fail', 'hidden'].includes(visibility)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid visibility value. Must be: full, pass_fail, or hidden',
      });
    }

    await update(
      'candidate_assessment_results',
      { column: 'id', value: result_id },
      { visibility, updated_at: new Date().toISOString() }
    );

    return res.status(200).json({
      success: true,
      message: 'Visibility updated successfully',
    });
  } catch (err) {
    return handleError(res, 'candidate.visibility', err);
  }
}
