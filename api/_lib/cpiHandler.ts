/**
 * CPI Handler — China Leadership Pipeline Diagnostic
 *
 * Brings the legacy client-side CPI/CPD assessment (assessmentEngine.ts)
 * into the portal as a first-class backend product. Follows the shiftHandler
 * pattern exactly: same auth, error handling, persistence, and rate limiting.
 *
 * Scoring logic is ported faithfully from src/services/assessmentEngine.ts:
 *   - 5 dimensions (20 scenario questions, 4 per dimension, scored 2-5)
 *   - 5 cross-border readiness questions (scored 1-5)
 *   - Dimension score = avg(question scores) * 20 → 0-100
 *   - Composite = Σ(dim_score * weight) + (5 bonus if cross_border ≥ 80), capped 100
 *   - 6 archetypes based on top-2 dimensions + cross-border score
 *   - Tiers: Elite (≥80), Advanced (≥65), Established (≥50), Developing (<50)
 *
 * Endpoints (via dispatch /api/x/cpi/...):
 *   POST /score        — scoring only + save (no LLM)
 *   POST /analyze      — scoring + LLM narrative + save (DeepSeek)
 *   GET  /results      — list current user's CPI results
 *   GET  /results/:id  — single result by id (ownership-enforced)
 *   GET  /config       — return CPI config (dimensions, archetypes info)
 *
 * Persistence: reuses the assessment_results table from Phase 11
 * (assessment_type = 'CPI').
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from './adminAuth.js';
import {
  isSupabaseConfigured,
  handleError,
  selectOne,
  selectMany,
  insert,
} from './supabaseRest.js';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/v1/chat/completions';
const ASSESSMENT_TYPE = 'CPI';
const ASSESSMENT_NAME = 'China Leadership Pipeline Diagnostic';

// ── Rate limiting (in-memory, per IP) — same pattern as shiftHandler ──
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60000 });
    return false;
  }
  if (entry.count >= 10) return true;
  entry.count++;
  return false;
}

// ── CPI Configuration (ported from assessmentEngine.ts) ────────────────

type DimensionId =
  | 'strategic_orientation'
  | 'cross_border_adaptability'
  | 'stakeholder_influence'
  | 'execution_discipline'
  | 'leadership_presence';

type CPDArchetype =
  | 'Strategic Architect'
  | 'Cross-Border Catalyst'
  | 'Precision Operator'
  | 'Influential Builder'
  | 'Adaptive Visionary'
  | 'Grounded Executor';

interface DimensionInfo {
  id: DimensionId;
  name: string;
  description: string;
  weight: number;
}

// Question IDs per dimension (CPD_SCENARIOS in assessmentEngine.ts).
// Each dimension has exactly 4 scenario questions.
const DIMENSION_QUESTIONS: Record<DimensionId, string[]> = {
  strategic_orientation: ['so_q1', 'so_q2', 'so_q3', 'so_q4'],
  cross_border_adaptability: ['cb_q1', 'cb_q2', 'cb_q3', 'cb_q4'],
  stakeholder_influence: ['si_q1', 'si_q2', 'si_q3', 'si_q4'],
  execution_discipline: ['ed_q1', 'ed_q2', 'ed_q3', 'ed_q4'],
  leadership_presence: ['lp_q1', 'lp_q2', 'lp_q3', 'lp_q4'],
};

const CROSS_BORDER_QUESTION_IDS = ['cb_read_1', 'cb_read_2', 'cb_read_3', 'cb_read_4', 'cb_read_5'];

export const DIMENSION_WEIGHTS: Record<DimensionId, number> = {
  strategic_orientation: 0.25,
  cross_border_adaptability: 0.25,
  stakeholder_influence: 0.20,
  execution_discipline: 0.15,
  leadership_presence: 0.15,
};

export const DIMENSION_INFO: DimensionInfo[] = [
  { id: 'strategic_orientation', name: 'Strategic Orientation', description: 'Ability to think long-term and set direction', weight: 0.25 },
  { id: 'cross_border_adaptability', name: 'Cross-Border Adaptability', description: 'Ability to adapt across cultures', weight: 0.25 },
  { id: 'stakeholder_influence', name: 'Stakeholder Influence', description: 'Ability to influence and align', weight: 0.20 },
  { id: 'execution_discipline', name: 'Execution Discipline', description: 'Delivering results consistently', weight: 0.15 },
  { id: 'leadership_presence', name: 'Leadership Presence', description: 'Executive presence and trust', weight: 0.15 },
];

interface ArchetypeInfo {
  name: CPDArchetype;
  description: string;
  strengths: string[];
  development: string[];
  tagline: string;
}

export const ARCHETYPE_INFO: Record<CPDArchetype, ArchetypeInfo> = {
  'Strategic Architect': {
    name: 'Strategic Architect',
    description: 'You see the big picture and inspire others to follow. Great at setting direction and building buy-in.',
    strengths: ['Strategic thinking', 'Stakeholder influence', 'Visionary leadership', 'Long-term perspective'],
    development: ['Execution', 'Adaptability'],
    tagline: 'Building leadership that works across borders',
  },
  'Cross-Border Catalyst': {
    name: 'Cross-Border Catalyst',
    description: 'You thrive in diverse, multi-cultural environments.',
    strengths: ['Cultural adaptability', 'Leadership presence', 'Relationship-building', 'Global mindset'],
    development: ['Strategic rigor', 'Execution discipline'],
    tagline: 'Bridging cultures for global impact',
  },
  'Precision Operator': {
    name: 'Precision Operator',
    description: 'You excel at execution and delivering results consistently.',
    strengths: ['Execution discipline', 'Strategic orientation', 'Attention to detail', 'Consistency'],
    development: ['Cross-border adaptability', 'Leadership presence'],
    tagline: 'Delivering results that matter',
  },
  'Influential Builder': {
    name: 'Influential Builder',
    description: 'You build trust and inspire people to follow you.',
    strengths: ['Leadership presence', 'Stakeholder influence', 'Relationships', 'Inspiration'],
    development: ['Strategic thinking', 'Execution discipline'],
    tagline: 'Leading with presence and purpose',
  },
  'Adaptive Visionary': {
    name: 'Adaptive Visionary',
    description: 'You can adapt to any culture while setting inspiring vision.',
    strengths: ['Cross-border adaptability', 'Strategic orientation', 'Vision', 'Cultural intelligence'],
    development: ['Execution', 'Influence'],
    tagline: 'Adapting, innovating, leading',
  },
  'Grounded Executor': {
    name: 'Grounded Executor',
    description: 'You get things done while adapting to circumstances.',
    strengths: ['Execution discipline', 'Cross-border adaptability', 'Resilience', 'Delivery'],
    development: ['Strategic vision', 'Influence'],
    tagline: 'Getting it done, anywhere',
  },
};

const ALL_DIMENSIONS = Object.keys(DIMENSION_WEIGHTS) as DimensionId[];

// ── Scoring (faithful port of assessmentEngine.ts) ─────────────────────

/**
 * Dimension score = avg(question scores) * 20 → 0-100.
 * Missing answers default to 3 (midpoint), matching assessmentEngine.
 */
function calculateDimensionScore(
  dimension: DimensionId,
  answers: Record<string, number>
): number {
  const questionIds = DIMENSION_QUESTIONS[dimension];
  const scores = questionIds.map((id) => answers[id] ?? 3);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.round(avg * 20); // 0-100
}

/**
 * Cross-border score = avg(5 readiness answers) * 20 → 0-100.
 */
function calculateCrossBorderScore(crossBorderAnswers: Record<string, number>): number {
  const scores = CROSS_BORDER_QUESTION_IDS.map((id) => crossBorderAnswers[id] ?? 3);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.round(avg * 20);
}

function getDimensionScores(answers: Record<string, number>): Record<DimensionId, number> {
  const out = {} as Record<DimensionId, number>;
  for (const dim of ALL_DIMENSIONS) {
    out[dim] = calculateDimensionScore(dim, answers);
  }
  return out;
}

/**
 * Composite = Σ(dim_score * weight) + (5 bonus if cross_border ≥ 80), capped 100.
 */
function getCompositeScore(
  dimensionScores: Record<DimensionId, number>,
  crossBorderScore: number
): number {
  let composite = 0;
  for (const dim of ALL_DIMENSIONS) {
    composite += dimensionScores[dim] * DIMENSION_WEIGHTS[dim];
  }
  if (crossBorderScore >= 80) composite += 5;
  return Math.min(100, Math.round(composite));
}

function getTopDimensions(dimensionScores: Record<DimensionId, number>): [DimensionId, DimensionId] {
  const sorted = ALL_DIMENSIONS.map((id) => ({ id, score: dimensionScores[id] })).sort((a, b) => b.score - a.score);
  return [sorted[0].id, sorted[1].id];
}

/**
 * Archetype resolution — exact port of assessmentEngine.getArchetype.
 * Falls back to 'Precision Operator' (matches the source engine).
 */
function getArchetype(
  dimensionScores: Record<DimensionId, number>,
  crossBorderScore: number
): CPDArchetype {
  const [top1, top2] = getTopDimensions(dimensionScores);

  if (top1 === 'strategic_orientation' && top2 === 'stakeholder_influence' && crossBorderScore >= 70) {
    return 'Strategic Architect';
  }
  if (top1 === 'cross_border_adaptability' && top2 === 'leadership_presence' && crossBorderScore >= 75) {
    return 'Cross-Border Catalyst';
  }
  if (top1 === 'execution_discipline' && top2 === 'strategic_orientation') {
    return 'Precision Operator';
  }
  if (top1 === 'leadership_presence' && top2 === 'stakeholder_influence' && crossBorderScore >= 60) {
    return 'Influential Builder';
  }
  if (top1 === 'cross_border_adaptability' && top2 === 'strategic_orientation' && crossBorderScore >= 80) {
    return 'Adaptive Visionary';
  }
  if (top1 === 'execution_discipline' && top2 === 'cross_border_adaptability') {
    return 'Grounded Executor';
  }
  return 'Precision Operator'; // Fallback (matches assessmentEngine)
}

/**
 * Tier label from composite score (0-100).
 */
function tierLabel(composite: number): string {
  if (composite >= 80) return 'Elite';
  if (composite >= 65) return 'Advanced';
  if (composite >= 50) return 'Established';
  return 'Developing';
}

// ── DeepSeek narrative (same pattern as shiftHandler) ──────────────────

interface DeepSeekResponse {
  choices: Array<{ message: { content: string } }>;
  usage?: { total_tokens: number };
}

function buildCpiNarrativePrompt(
  intake: any,
  dimensionScores: Record<DimensionId, number>,
  crossBorderScore: number,
  composite: number,
  archetype: CPDArchetype
): string {
  const archetypeInfo = ARCHETYPE_INFO[archetype];
  const ctx = intake.professionalContext || {};
  const topDims = getTopDimensions(dimensionScores);

  return `You are an executive leadership coach at LYC Intelligence, specializing in the China Leadership Pipeline Diagnostic (CPI).

CANDIDATE PROFILE:
- Name: ${intake.gate?.name || 'Candidate'}
- Career situation: ${ctx.situation || 'senior_leader'}
- Geography: ${ctx.geography || 'single_market'}
- Primary function: ${ctx.function || 'Other'}
- Writing style preference: ${intake.writingStyle || 'pragmatic'}
- Career goals: ${(intake.careerGoals || []).join(', ') || 'Not specified'}

ASSESSMENT RESULTS:
- Composite score: ${composite}/100 (${tierLabel(composite)})
- Archetype: ${archetype} — ${archetypeInfo.tagline}
- Cross-Border Readiness score: ${crossBorderScore}/100

DIMENSION SCORES (0-100):
${ALL_DIMENSIONS.map((d) => {
  const info = DIMENSION_INFO.find((x) => x.id === d)!;
  return `- ${info.name}: ${dimensionScores[d]}`;
}).join('\n')}

TOP TWO DIMENSIONS: ${topDims.map((d) => DIMENSION_INFO.find((x) => x.id === d)!.name).join(', ')}

Provide a personalized narrative analysis. Return ONLY valid JSON (no markdown, no code fences) with this exact shape:
{
  "executive_summary": "<2-3 sentence overview of leadership profile>",
  "strengths": [
    { "strength": "<name>", "evidence": "<specific evidence from scores>" }
  ],
  "development_areas": [
    { "area": "<name>", "example": "<actionable development suggestion>" }
  ],
  "cross_border_analysis": "<paragraph analyzing cross-border readiness at ${crossBorderScore}/100>",
  "career_recommendations": ["<rec 1>", "<rec 2>", "<rec 3>"],
  "action_plan_90_day": ["<priority action 1>", "<priority action 2>", "<priority action 3>"]
}`;
}

async function callDeepSeek(prompt: string): Promise<{ content: string; tokens: number }> {
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
        { role: 'system', content: 'You are an executive leadership coach. Always respond with valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 2048,
      temperature: 0.4,
      response_format: { type: 'json_object' },
    }),
  });
  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status}`);
  }
  const data: DeepSeekResponse = await response.json();
  return { content: data.choices?.[0]?.message?.content || '', tokens: data.usage?.total_tokens || 0 };
}

// ── Persistence (reuses assessment_results table from Phase 11) ────────

interface PersistPayload {
  user_id: string;
  dimensions: Record<string, number>;
  composite_score: number;
  tier_label: string;
  narrative?: string | null;
  raw_responses?: any;
  metadata?: any;
}

async function persistResult(payload: PersistPayload): Promise<any> {
  const row: Record<string, any> = {
    user_id: payload.user_id,
    assessment_type: ASSESSMENT_TYPE,
    assessment_name: ASSESSMENT_NAME,
    portal_id: null,
    dimensions: payload.dimensions,
    composite_score: payload.composite_score,
    tier_label: payload.tier_label,
    narrative: payload.narrative ?? null,
    raw_responses: payload.raw_responses ?? null,
    metadata: payload.metadata ?? {},
    completed_at: new Date().toISOString(),
  };
  return insert('assessment_results', row, 15000);
}

// ── Core scoring pipeline (shared by /score and /analyze) ──────────────

interface ScoredResult {
  dimension_scores: Record<DimensionId, number>;
  cross_border_score: number;
  composite_score: number;
  tier_label: string;
  archetype: CPDArchetype;
  top_dimensions: [DimensionId, DimensionId];
}

function scoreIntake(intake: any): ScoredResult {
  const dimensionScores = getDimensionScores(intake.dimensions || {});
  const crossBorderScore = calculateCrossBorderScore(intake.crossBorderQuestions || {});
  const composite = getCompositeScore(dimensionScores, crossBorderScore);
  const tier = tierLabel(composite);
  const archetype = getArchetype(dimensionScores, crossBorderScore);
  const topDimensions = getTopDimensions(dimensionScores);
  return {
    dimension_scores: dimensionScores,
    cross_border_score: crossBorderScore,
    composite_score: composite,
    tier_label: tier,
    archetype,
    top_dimensions: topDimensions,
  };
}

// ── Main handler ───────────────────────────────────────────────────────

export async function handleCpi(req: VercelRequest, res: VercelResponse): Promise<void> {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown';
  if (isRateLimited(ip)) {
    res.status(429).json({ success: false, error: 'Rate limit exceeded' });
    return;
  }

  try {
    if (!isSupabaseConfigured()) {
      res.status(500).json({ success: false, error: 'Server configuration error' });
      return;
    }

    // Auth — every CPI endpoint requires an authenticated user
    const { user, error: authError } = await getUserFromRequest(req);
    if (authError || !user) {
      res.status(401).json({ success: false, error: authError || 'Unauthorized' });
      return;
    }

    const pathArr = ((req.query.path as string[]) || []);
    const resource = pathArr[0];

    // GET /config — return CPI config (dimensions, archetypes info)
    if (resource === 'config' && req.method === 'GET') {
      return res.status(200).json({
        success: true,
        config: {
          assessment_type: ASSESSMENT_TYPE,
          assessment_name: ASSESSMENT_NAME,
          dimensions: DIMENSION_INFO,
          archetypes: Object.values(ARCHETYPE_INFO),
          tier_labels: ['Elite', 'Advanced', 'Established', 'Developing'],
          question_counts: {
            dimensions: 20,        // 4 per dimension × 5
            cross_border: 5,
          },
        },
      });
    }

    // GET /results — list current user's CPI results
    if (resource === 'results' && !pathArr[1] && req.method === 'GET') {
      const rows = await selectMany('assessment_results', {
        where: [
          { column: 'user_id', value: user.id },
          { column: 'assessment_type', value: ASSESSMENT_TYPE },
        ],
        orderBy: { column: 'created_at', ascending: false },
        limit: 100,
      }, 15000);
      return res.status(200).json({ success: true, results: rows });
    }

    // GET /results/:id — single result by id (ownership-enforced)
    if (resource === 'results' && pathArr[1] && req.method === 'GET') {
      const row = await selectOne('assessment_results', {
        column: 'id',
        value: pathArr[1],
      }, 15000);
      if (!row) {
        return res.status(404).json({ success: false, error: 'Result not found' });
      }
      if (row.user_id !== user.id) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
      return res.status(200).json({ success: true, result: row });
    }

    // POST /score — scoring only + save (no LLM)
    if (resource === 'score' && req.method === 'POST') {
      return handleScore(req, res, user);
    }

    // POST /analyze — scoring + LLM narrative + save (DeepSeek)
    if (resource === 'analyze' && req.method === 'POST') {
      return handleAnalyze(req, res, user);
    }

    return res.status(404).json({ success: false, error: 'CPI route not found' });
  } catch (err: any) {
    return handleError(res, 'cpi', err);
  }
}

// ── Score-only (deterministic, no LLM) ─────────────────────────────────

async function handleScore(req: VercelRequest, res: VercelResponse, user: any): Promise<void> {
  const { intake }: { intake: any } = req.body || {};

  if (!intake || !intake.dimensions) {
    res.status(400).json({ success: false, error: 'Missing required field: intake (with dimensions)' });
    return;
  }

  const scored = scoreIntake(intake);

  const saved = await persistResult({
    user_id: user.id,
    dimensions: { ...scored.dimension_scores, cross_border_score: scored.cross_border_score },
    composite_score: scored.composite_score,
    tier_label: scored.tier_label,
    narrative: null,
    raw_responses: intake,
    metadata: {
      archetype: scored.archetype,
      top_dimensions: scored.top_dimensions,
      writing_style: intake.writingStyle || null,
      professional_context: intake.professionalContext || null,
      llm_used: false,
    },
  });

  return res.status(200).json({
    success: true,
    result: {
      dimension_scores: scored.dimension_scores,
      cross_border_score: scored.cross_border_score,
      composite_score: scored.composite_score,
      tier_label: scored.tier_label,
      archetype: scored.archetype,
      top_dimensions: scored.top_dimensions,
    },
    result_id: saved?.id || null,
  });
}

// ── Analyze (LLM narrative + score + save) ─────────────────────────────

async function handleAnalyze(req: VercelRequest, res: VercelResponse, user: any): Promise<void> {
  const { intake }: { intake: any } = req.body || {};

  if (!intake || !intake.dimensions) {
    res.status(400).json({ success: false, error: 'Missing required field: intake (with dimensions)' });
    return;
  }

  const scored = scoreIntake(intake);

  // Call DeepSeek for narrative (best-effort; falls back to deterministic)
  let narrative: any = null;
  let tokens = 0;
  try {
    const prompt = buildCpiNarrativePrompt(
      intake,
      scored.dimension_scores,
      scored.cross_border_score,
      scored.composite_score,
      scored.archetype
    );
    const { content, tokens: t } = await callDeepSeek(prompt);
    tokens = t;
    try {
      narrative = JSON.parse(content);
    } catch {
      narrative = { raw: content };
    }
  } catch {
    // LLM unavailable — continue with deterministic narrative
    narrative = null;
  }

  const saved = await persistResult({
    user_id: user.id,
    dimensions: { ...scored.dimension_scores, cross_border_score: scored.cross_border_score },
    composite_score: scored.composite_score,
    tier_label: scored.tier_label,
    narrative: narrative ? JSON.stringify(narrative) : null,
    raw_responses: intake,
    metadata: {
      archetype: scored.archetype,
      top_dimensions: scored.top_dimensions,
      writing_style: intake.writingStyle || null,
      professional_context: intake.professionalContext || null,
      tokens_used: tokens,
      model: 'deepseek-chat',
      llm_used: narrative !== null,
    },
  });

  return res.status(200).json({
    success: true,
    result: {
      dimension_scores: scored.dimension_scores,
      cross_border_score: scored.cross_border_score,
      composite_score: scored.composite_score,
      tier_label: scored.tier_label,
      archetype: scored.archetype,
      top_dimensions: scored.top_dimensions,
      narrative,
    },
    result_id: saved?.id || null,
    tokens,
  });
}
