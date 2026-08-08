/**
 * SHIFT Suite Handler — 5 leadership diagnostics: LEAP, QUEST, DRIVE, COACH, IMPACT
 *
 * Endpoints (via dispatch /api/x/shift/...):
 *   POST /analyze         — LLM narrative + score + save to assessment_results
 *   POST /score           — score-only + save (no LLM call)
 *   GET  /results         — list current user's SHIFT results
 *   GET  /results/:id     — single result by id
 *   GET  /configs         — return all 5 diagnostic configs for frontend
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

// ── Rate limiting (in-memory, per IP) ──────────────────────────────────
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

// ── SHIFT Diagnostic Configurations (all 5) ───────────────────────────
// Dimension scores are 1-10 from the user; composite is 0-100.

interface SHIFTDimensionConfig {
  id: string;
  name: string;
  description: string;
  question: string;
}

interface SHIFTDiagnosticConfig {
  key: string;          // 'LEAP', 'QUEST', ...
  name: string;         // user-facing name
  purpose: string;
  credits: number;
  dimensions: SHIFTDimensionConfig[];
}

export const SHIFT_DIAGNOSTICS: Record<string, SHIFTDiagnosticConfig> = {
  LEAP: {
    key: 'LEAP',
    name: 'Learning & Execution Potential',
    purpose: 'Strategic clarity',
    credits: 3,
    dimensions: [
      { id: 'strategic_thinking', name: 'Strategic Thinking', description: 'Ability to see the big picture and set direction', question: 'Describe a strategic decision you made that significantly impacted your organization.' },
      { id: 'execution_speed', name: 'Execution Speed', description: 'Ability to move from idea to implementation quickly', question: 'Tell me about a time you delivered results under pressure.' },
      { id: 'learning_agility', name: 'Learning Agility', description: 'Ability to learn from experience and apply new knowledge', question: 'Describe how you adapted to a major change in your environment.' },
      { id: 'leadership_presence', name: 'Leadership Presence', description: 'Ability to build credibility with senior stakeholders', question: 'How do you build credibility with senior stakeholders?' },
      { id: 'change_navigation', name: 'Change Navigation', description: 'Ability to lead or navigate complex change', question: 'Describe a complex change you led or navigated.' },
    ],
  },
  QUEST: {
    key: 'QUEST',
    name: 'Questioning & Inquiry Skills',
    purpose: 'Inquiry capability',
    credits: 3,
    dimensions: [
      { id: 'analytical_depth', name: 'Analytical Depth', description: 'Depth of analytical thinking', question: 'Describe your approach to solving complex problems.' },
      { id: 'problem_solving', name: 'Problem Solving', description: 'Ability to solve challenging problems', question: 'Tell me about a challenging problem you solved.' },
      { id: 'decision_quality', name: 'Decision Quality', description: 'Quality of decision-making under uncertainty', question: 'Describe a difficult decision and how you made it.' },
      { id: 'innovation', name: 'Innovation', description: 'Drive for innovation in role', question: 'How have you driven innovation in your role?' },
      { id: 'collaboration', name: 'Collaboration', description: 'Approach to working with others', question: 'Describe your approach to working with others.' },
    ],
  },
  DRIVE: {
    key: 'DRIVE',
    name: 'Execution & Delivery Capability',
    purpose: 'Change management',
    credits: 3,
    dimensions: [
      { id: 'results_orientation', name: 'Results Orientation', description: 'Focus on achieving measurable outcomes', question: 'Describe a time when your results focus drove exceptional outcomes.' },
      { id: 'operational_discipline', name: 'Operational Discipline', description: 'Rigor in process and operational execution', question: 'How do you ensure operational discipline in your team?' },
      { id: 'resource_management', name: 'Resource Management', description: 'Effective allocation and management of resources', question: 'Describe how you managed scarce resources to deliver results.' },
      { id: 'stakeholder_alignment', name: 'Stakeholder Alignment', description: 'Aligning stakeholders around shared goals', question: 'Describe a time you aligned divergent stakeholders.' },
      { id: 'continuous_improvement', name: 'Continuous Improvement', description: 'Commitment to ongoing improvement', question: 'How have you driven continuous improvement in your organization?' },
    ],
  },
  COACH: {
    key: 'COACH',
    name: 'Coaching & Leadership Development',
    purpose: 'Team development',
    credits: 3,
    dimensions: [
      { id: 'developing_others', name: 'Developing Others', description: 'Ability to grow and develop team members', question: 'Describe how you developed a team member who achieved significant growth.' },
      { id: 'feedback_orientation', name: 'Feedback Orientation', description: 'Skill in giving constructive, actionable feedback', question: 'Describe a time when your feedback significantly improved performance.' },
      { id: 'emotional_intelligence', name: 'Emotional Intelligence', description: 'Understanding and managing emotions in self and others', question: 'Describe how emotional intelligence helped you resolve a difficult situation.' },
      { id: 'talent_identification', name: 'Talent Identification', description: 'Recognizing and nurturing high-potential talent', question: 'How do you identify and nurture high-potential talent?' },
      { id: 'team_building', name: 'Team Building', description: 'Building cohesive, high-performing teams', question: 'Describe how you built a cohesive, high-performing team.' },
    ],
  },
  IMPACT: {
    key: 'IMPACT',
    name: 'Influence & Executive Presence',
    purpose: 'Composite across all SHIFT',
    credits: 5,
    dimensions: [
      { id: 'communication_impact', name: 'Communication Impact', description: 'Ability to communicate with clarity and influence', question: 'Describe a time your communication drove significant impact.' },
      { id: 'executive_presence', name: 'Executive Presence', description: 'Projecting confidence and credibility at executive level', question: 'How do you build and project executive presence?' },
      { id: 'negotiation', name: 'Negotiation', description: 'Skill in negotiation and persuasion', question: 'Describe a challenging negotiation and its outcome.' },
      { id: 'conflict_resolution', name: 'Conflict Resolution', description: 'Resolving conflicts constructively', question: 'Describe how you resolved a significant conflict.' },
      { id: 'personal_brand', name: 'Personal Brand', description: 'Cultivating a strong professional brand', question: 'How have you built and leveraged your personal brand?' },
    ],
  },
};

const VALID_KEYS = Object.keys(SHIFT_DIAGNOSTICS);

// ── Scoring helpers ────────────────────────────────────────────────────

/**
 * Convert a 1-10 dimension score to 0-100.
 */
function to100(score: number): number {
  const s = Math.max(1, Math.min(10, Number(score) || 5));
  return Math.round(((s - 1) / 9) * 100); // 1→0, 10→100
}

/**
 * Compute dimension_scores (0-100) from intake.dimensions (1-10).
 */
function computeDimensionScores(
  dimensions: Record<string, number>,
  config: SHIFTDiagnosticConfig
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const dim of config.dimensions) {
    out[dim.id] = to100(dimensions[dim.id] ?? 5);
  }
  return out;
}

/**
 * Composite is the mean of dimension scores (0-100).
 */
function computeComposite(dimensionScores: Record<string, number>): number {
  const values = Object.values(dimensionScores);
  if (values.length === 0) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

/**
 * Tier label from composite score (0-100).
 */
function tierLabel(composite: number): string {
  if (composite >= 85) return 'Exceptional';
  if (composite >= 70) return 'Advanced';
  if (composite >= 55) return 'Proficient';
  if (composite >= 40) return 'Developing';
  return 'Emerging';
}

// ── Archetype resolution (mirrors frontend shiftAssessmentTypes) ───────
function resolveArchetype(dimensionScores: Record<string, number>, configKey: string): string {
  const sorted = Object.entries(dimensionScores).sort(([, a], [, b]) => b - a);
  const top = sorted.slice(0, 2).map(([k]) => k);

  if (configKey === 'LEAP' && (top.includes('strategic_thinking') || top.includes('execution_speed'))) {
    return 'Strategic Catalyst';
  }
  if (configKey === 'QUEST' && (top.includes('analytical_depth') || top.includes('innovation'))) {
    return 'Inquiry Leader';
  }
  if (configKey === 'DRIVE' && (top.includes('results_orientation') || top.includes('operational_discipline'))) {
    return 'Results Driver';
  }
  if (configKey === 'COACH' && (top.includes('developing_others') || top.includes('emotional_intelligence'))) {
    return 'Development Champion';
  }
  if (configKey === 'IMPACT' && (top.includes('communication_impact') || top.includes('executive_presence'))) {
    return 'Impact Architect';
  }
  return 'Balanced Leader';
}

// ── DeepSeek narrative ─────────────────────────────────────────────────

interface DeepSeekResponse {
  choices: Array<{ message: { content: string } }>;
  usage?: { total_tokens: number };
}

function buildSHIFTAnalysisPrompt(intake: any, config: SHIFTDiagnosticConfig): string {
  return `You are a leadership development expert specializing in SHIFT assessments for LYC Intelligence.
Analyze this ${config.name} (${config.key}) assessment:

USER PROFILE:
- Role: ${intake.context?.role || 'Not specified'}
- Industry: ${intake.context?.industry || 'Not specified'}
- Experience: ${intake.context?.years_experience || 0} years
- Current challenges: ${intake.context?.challenges || 'Not specified'}
- Improvement goals: ${intake.context?.improvement_goals || 'Not specified'}

ASSESSMENT DIMENSIONS AND RESPONSES:
${config.dimensions.map((dim: SHIFTDimensionConfig) => {
  const score = intake.dimensions?.[dim.id] ?? 5;
  const evidence = intake.evidence?.[dim.id] || 'No evidence provided';
  return `
${dim.name} (Score: ${score}/10)
- Question: ${dim.question}
- User Response: ${evidence}`;
}).join('\n')}

Provide a comprehensive analysis including:
1. Dimension scores (0-100) for each dimension based on user responses
2. Top 3 strengths with evidence from their responses
3. Top 3 development areas with specific examples
4. 3 actionable recommendations for improvement

Return ONLY this JSON (no markdown, no code fences):
{
  "dimension_scores": { "${config.dimensions[0].id}": 75, "${config.dimensions[1].id}": 80 },
  "strengths": [
    { "strength": "<strength name>", "evidence": "<evidence>" }
  ],
  "development_areas": [
    { "area": "<area>", "example": "<example>" }
  ],
  "recommendations": ["<recommendation 1>", "<recommendation 2>", "<recommendation 3>"],
  "archetype": "<archetype name>",
  "confidence": 0.85
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
        { role: 'system', content: 'You are a leadership development expert. Always respond with valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 2048,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  });
  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status}`);
  }
  const data: DeepSeekResponse = await response.json();
  return { content: data.choices?.[0]?.message?.content || '', tokens: data.usage?.total_tokens || 0 };
}

// ── Persistence ────────────────────────────────────────────────────────

interface PersistPayload {
  user_id: string;
  assessment_type: string;   // e.g. 'SHIFT_LEAP'
  assessment_name: string;   // e.g. 'Learning & Execution Potential'
  portal_id?: string | null;
  dimensions: Record<string, number>;   // 0-100
  composite_score: number;
  tier_label: string;
  narrative?: string | null;
  raw_responses?: any;
  metadata?: any;
}

async function persistResult(payload: PersistPayload): Promise<any> {
  const row: Record<string, any> = {
    user_id: payload.user_id,
    assessment_type: payload.assessment_type,
    assessment_name: payload.assessment_name,
    portal_id: payload.portal_id ?? null,
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

// ── Main handler ───────────────────────────────────────────────────────

export async function handleShift(req: VercelRequest, res: VercelResponse): Promise<void> {
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

    // Auth — every SHIFT endpoint requires an authenticated user
    const { user, error: authError } = await getUserFromRequest(req);
    if (authError || !user) {
      res.status(401).json({ success: false, error: authError || 'Unauthorized' });
      return;
    }

    const pathArr = ((req.query.path as string[]) || []);
    const resource = pathArr[0];

    // GET /configs — return all 5 diagnostic configs
    if (resource === 'configs' && req.method === 'GET') {
      return res.status(200).json({
        success: true,
        configs: Object.values(SHIFT_DIAGNOSTICS),
      });
    }

    // GET /results — list current user's SHIFT results
    if (resource === 'results' && !pathArr[1] && req.method === 'GET') {
      const rows = await selectMany('assessment_results', {
        where: [{ column: 'user_id', value: user.id }],
        orderBy: { column: 'created_at', ascending: false },
        limit: 100,
      }, 15000);
      return res.status(200).json({ success: true, results: rows });
    }

    // GET /results/:id — single result by id
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

    // POST /analyze — LLM narrative + score + save
    if (resource === 'analyze' && req.method === 'POST') {
      return handleAnalyze(req, res, user);
    }

    // POST /score — score-only + save, no LLM
    if (resource === 'score' && req.method === 'POST') {
      return handleScore(req, res, user);
    }

    return res.status(404).json({ success: false, error: 'SHIFT route not found' });
  } catch (err: any) {
    return handleError(res, 'shift', err);
  }
}

// ── Analyze (LLM + score + save) ───────────────────────────────────────

async function handleAnalyze(req: VercelRequest, res: VercelResponse, user: any): Promise<void> {
  const { intake, assessmentType, portal_id }: {
    intake: any;
    assessmentType: string;
    portal_id?: string;
  } = req.body || {};

  if (!intake || !assessmentType) {
    res.status(400).json({ success: false, error: 'Missing required fields: intake, assessmentType' });
    return;
  }

  const config = SHIFT_DIAGNOSTICS[assessmentType];
  if (!config) {
    res.status(400).json({
      success: false,
      error: `Invalid assessmentType. Must be one of: ${VALID_KEYS.join(', ')}`,
    });
    return;
  }

  // 1. Compute scores locally (deterministic, always available)
  const dimensionScores = computeDimensionScores(intake.dimensions || {}, config);
  const composite = computeComposite(dimensionScores);
  const tier = tierLabel(composite);
  const archetype = resolveArchetype(dimensionScores, config.key);

  // 2. Call DeepSeek for narrative (best-effort; tests mock fetch)
  let narrative: any = null;
  let tokens = 0;
  try {
    const prompt = buildSHIFTAnalysisPrompt(intake, config);
    const { content, tokens: t } = await callDeepSeek(prompt);
    tokens = t;
    try {
      narrative = JSON.parse(content);
    } catch {
      narrative = { raw: content };
    }
  } catch (llmErr: any) {
    // LLM unavailable — continue with deterministic narrative
    narrative = null;
  }

  // 3. Merge LLM dimension scores (if present and valid) over deterministic
  let finalDimensionScores = dimensionScores;
  if (narrative?.dimension_scores && typeof narrative.dimension_scores === 'object') {
    const merged: Record<string, number> = { ...dimensionScores };
    for (const dim of config.dimensions) {
      const llmVal = narrative.dimension_scores[dim.id];
      if (typeof llmVal === 'number' && llmVal >= 0 && llmVal <= 100) {
        merged[dim.id] = Math.round(llmVal);
      }
    }
    finalDimensionScores = merged;
  }
  const finalComposite = computeComposite(finalDimensionScores);
  const finalTier = tierLabel(finalComposite);

  // 4. Persist to assessment_results
  const assessmentTypeKey = `SHIFT_${config.key}`;
  const saved = await persistResult({
    user_id: user.id,
    assessment_type: assessmentTypeKey,
    assessment_name: config.name,
    portal_id: portal_id ?? null,
    dimensions: finalDimensionScores,
    composite_score: finalComposite,
    tier_label: finalTier,
    narrative: narrative ? JSON.stringify(narrative) : null,
    raw_responses: intake,
    metadata: {
      archetype: narrative?.archetype || archetype,
      confidence: narrative?.confidence ?? 0.6,
      strengths: narrative?.strengths || [],
      development_areas: narrative?.development_areas || [],
      recommendations: narrative?.recommendations || [],
      tokens,
      llm_used: narrative !== null,
    },
  });

  return res.status(200).json({
    success: true,
    result: {
      dimension_scores: finalDimensionScores,
      composite_score: finalComposite,
      tier_label: finalTier,
      archetype: narrative?.archetype || archetype,
      confidence: narrative?.confidence ?? 0.6,
      strengths: narrative?.strengths || [],
      development_areas: narrative?.development_areas || [],
      recommendations: narrative?.recommendations || [],
    },
    result_id: saved?.id || null,
    tokens,
  });
}

// ── Score-only (no LLM, deterministic) ─────────────────────────────────

async function handleScore(req: VercelRequest, res: VercelResponse, user: any): Promise<void> {
  const { intake, assessmentType, portal_id }: {
    intake: any;
    assessmentType: string;
    portal_id?: string;
  } = req.body || {};

  if (!intake || !assessmentType) {
    res.status(400).json({ success: false, error: 'Missing required fields: intake, assessmentType' });
    return;
  }

  const config = SHIFT_DIAGNOSTICS[assessmentType];
  if (!config) {
    res.status(400).json({
      success: false,
      error: `Invalid assessmentType. Must be one of: ${VALID_KEYS.join(', ')}`,
    });
    return;
  }

  const dimensionScores = computeDimensionScores(intake.dimensions || {}, config);
  const composite = computeComposite(dimensionScores);
  const tier = tierLabel(composite);
  const archetype = resolveArchetype(dimensionScores, config.key);

  const assessmentTypeKey = `SHIFT_${config.key}`;
  const saved = await persistResult({
    user_id: user.id,
    assessment_type: assessmentTypeKey,
    assessment_name: config.name,
    portal_id: portal_id ?? null,
    dimensions: dimensionScores,
    composite_score: composite,
    tier_label: tier,
    narrative: null,
    raw_responses: intake,
    metadata: {
      archetype,
      confidence: 0.6,
      llm_used: false,
    },
  });

  return res.status(200).json({
    success: true,
    result: {
      dimension_scores: dimensionScores,
      composite_score: composite,
      tier_label: tier,
      archetype,
      confidence: 0.6,
    },
    result_id: saved?.id || null,
  });
}
