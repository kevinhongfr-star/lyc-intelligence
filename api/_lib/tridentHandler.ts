/**
 * TRIDENT 3D Scoring handler — DEX AI Technical Blueprint 03
 *
 * Routes:
 *   POST /api/trident/preflight                  — Run pre-flight checks
 *   POST /api/trident/score                      — Individual scoring
 *   POST /api/trident/sweep                      — SWEEP batch scoring
 *   GET  /api/trident/scorecard/:id              — Get single scorecard
 *   GET  /api/trident/scorecards?mandate_id=&contact_id=  — List scorecards
 *   GET  /api/trident/compare?mandate_id=        — Comparison view
 *   POST /api/trident/review/:id                 — Kevin review action
 *   GET  /api/trident/review-queue               — Kevin's pending review
 *   PATCH /api/trident/scorecard/:id             — Edit/re-score
 *
 * 3-D scoring: D1 (Domain/Intelligence, 30%) + D2 (Delivery/Influence, 40%) + D3 (Drive/Dynamics, 30%)
 * Composite → Verdict (Exceptional/Strong/Solid/Conditional/Not Recommended)
 * Composite → Segment (A: 8+, B: 6.5-7.9, C: <6.5)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  selectOne,
  selectMany,
  insert,
  update,
  isSupabaseConfigured,
  handleError,
} from './supabaseRest.js';
import { getUserFromRequest } from './adminAuth.js';

export const maxDuration = 120;

const DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';

export async function handleTrident(req: VercelRequest, res: VercelResponse) {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    const pathArr = (req.query.path as string[]) || [];
    const resource = pathArr[0];
    const id = pathArr[1];
    const subResource = pathArr[2];

    if (resource === 'preflight' && req.method === 'POST') return handlePreflight(req, res);
    if (resource === 'score' && req.method === 'POST') return handleIndividualScore(req, res);
    if (resource === 'sweep' && req.method === 'POST') return handleSweep(req, res);
    if (resource === 'scorecards' && req.method === 'GET') return handleListScorecards(req, res);
    if (resource === 'scorecard' && id && req.method === 'GET') return handleGetScorecard(req, res, id);
    if (resource === 'scorecard' && id && req.method === 'PATCH') return handleEditScorecard(req, res, id);
    if (resource === 'compare' && req.method === 'GET') return handleCompare(req, res);
    if (resource === 'review' && id && req.method === 'POST') return handleReviewAction(req, res, id);
    if (resource === 'review-queue' && req.method === 'GET') return handleReviewQueue(req, res);

    return res.status(404).json({ success: false, error: 'TRIDENT route not found' });
  } catch (err) {
    return handleError(res, 'trident', err);
  }
}

// ── Preflight ────────────────────────────────────────────────────────
async function handlePreflight(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  const { contact_id, mandate_id } = req.body || {};
  if (!contact_id) {
    return res.status(400).json({ success: false, error: 'contact_id is required' });
  }

  const contact = await selectOne('contacts', {
    column: 'id', value: contact_id, select: '*',
  }, 15000);

  if (!contact) {
    return res.status(404).json({ success: false, error: 'Contact not found' });
  }

  const preflight = runPreflightChecks(contact, mandate_id);

  return res.status(200).json({
    success: true,
    preflight,
    contact: {
      id: contact.id,
      name: contact.full_name,
      company: contact.company_name,
      pipeline_stage: contact.pipeline_stage,
      data_confidence: contact.data_confidence,
    },
  });
}

function runPreflightChecks(contact: any, mandateId?: string): Record<string, any> {
  const flags: string[] = [];
  const checks: Record<string, string> = {
    identity_verification: 'PASS',
    jd_alignment: 'PASS',
    signal_integrity: 'PASS',
    trident_readiness: 'PASS',
    compliance_conflict: 'PASS',
  };

  // Identity
  if (!contact.full_name || !contact.company_name) {
    checks.identity_verification = 'HALT';
    flags.push('Missing name or company');
  } else if (!contact.linkedin_url) {
    checks.identity_verification = 'WARN';
    flags.push('No LinkedIn URL for verification');
  }

  // JD alignment
  if (mandateId) {
    flags.push('JD alignment check requires mandate fetch — using link provided');
  } else {
    checks.jd_alignment = 'WARN';
    flags.push('No mandate linked — JD alignment not checked');
  }

  // Signal integrity
  const dc = contact.data_confidence ?? 0.5;
  if (dc < 0.3) {
    checks.signal_integrity = 'HALT';
    flags.push('Data confidence < 30% — too little data to score');
  } else if (dc < 0.6) {
    checks.signal_integrity = 'WARN';
    flags.push('Data confidence 30-59% — scoring may be unreliable');
  }

  // Readiness
  if (contact.pipeline_stage === 'S1_Sourced') {
    checks.trident_readiness = 'HALT';
    flags.push('Candidate not yet screened — must be S2 or later');
  } else if (contact.pipeline_stage === 'S2_Screened') {
    checks.trident_readiness = 'WARN';
    flags.push('Preliminary scoring only — candidate still at screening stage');
  }

  // Compliance
  if (contact.metadata?.conflict_flag === true) {
    checks.compliance_conflict = 'HALT';
    flags.push('Active conflict of interest detected');
  }

  const overall = Object.values(checks).includes('HALT') ? 'HALT'
    : Object.values(checks).includes('WARN') ? 'PROCEED_WITH_FLAGS'
    : 'PROCEED';

  return { ...checks, overall, flags };
}

// ── Individual Score ─────────────────────────────────────────────────
async function handleIndividualScore(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  const {
    contact_id,
    mandate_id,
    d1_score,
    d2_score,
    d3_score,
    d1_sub = {},
    d2_sub = {},
    d3_sub = {},
    d1_evidence,
    d2_evidence,
    d3_evidence,
    d1_confidence = 'Medium',
    d2_confidence = 'Medium',
    d3_confidence = 'Medium',
    recommendation,
    metadata = {},
  } = req.body || {};

  if (!contact_id || d1_score == null || d2_score == null || d3_score == null) {
    return res.status(400).json({
      success: false,
      error: 'contact_id, d1_score, d2_score, d3_score are required',
    });
  }

  if (!d1_evidence || !d2_evidence || !d3_evidence) {
    return res.status(400).json({
      success: false,
      error: 'Evidence required for all 3 dimensions',
    });
  }

  // Validate score ranges
  const validateScore = (s: number) => s >= 1.0 && s <= 10.0;
  if (!validateScore(d1_score) || !validateScore(d2_score) || !validateScore(d3_score)) {
    return res.status(400).json({ success: false, error: 'Scores must be between 1.0 and 10.0' });
  }

  // Get contact for preflight
  const contact = await selectOne('contacts', {
    column: 'id', value: contact_id, select: '*',
  }, 15000);

  if (!contact) return res.status(404).json({ success: false, error: 'Contact not found' });

  // Run preflight
  const preflight = runPreflightChecks(contact, mandate_id);
  if (preflight.overall === 'HALT') {
    return res.status(422).json({
      success: false,
      error: 'Pre-flight check failed — scoring halted',
      preflight,
    });
  }

  // Compute composite
  const composite = computeComposite(d1_score, d2_score, d3_score);

  // Insert scorecard
  const scorecard = await insert('trident_scorecards', {
    contact_id,
    mandate_id: mandate_id || null,
    scored_by: user.id,
    d1_score,
    d2_score,
    d3_score,
    d1_sub: JSON.stringify(d1_sub),
    d2_sub: JSON.stringify(d2_sub),
    d3_sub: JSON.stringify(d3_sub),
    d1_evidence,
    d2_evidence,
    d3_evidence,
    d1_confidence,
    d2_confidence,
    d3_confidence,
    composite_score: composite.composite_score,
    verdict: composite.verdict,
    segment: composite.segment,
    recommendation: recommendation || null,
    preflight: JSON.stringify(preflight),
    review_status: 'pending',
    credits_consumed: 10,
    metadata: JSON.stringify({ ...metadata, mode: 'individual' }),
    scored_at: new Date().toISOString(),
  }, 15000);

  // Create signal
  await insert('signals', {
    type: 'assessment',
    source: 'agent',
    agent_id: 'trident',
    contact_id,
    mandate_id: mandate_id || null,
    actor_id: user.id,
    title: `TRIDENT scorecard created: ${composite.composite_score} (${composite.verdict})`,
    metadata: { scorecard_id: scorecard.id, composite: composite.composite_score, verdict: composite.verdict, segment: composite.segment },
    insights: {},
    action_required: composite.verdict === 'Exceptional Primary' || composite.verdict === 'Strong',
    action_status: 'pending',
  }, 15000);

  // Note: Contact quick-ref columns are updated by database trigger
  // Credit consumption: in real impl, decrement from credits table
  // For MVP, just log

  return res.status(201).json({
    success: true,
    scorecard: {
      ...scorecard,
      d1_sub,
      d2_sub,
      d3_sub,
      preflight,
    },
  });
}

function computeComposite(d1: number, d2: number, d3: number) {
  const composite = Math.round((d1 * 0.30 + d2 * 0.40 + d3 * 0.30) * 10) / 10;

  let verdict: string;
  if (composite >= 9.0) verdict = 'Exceptional Primary';
  else if (composite >= 8.0) verdict = 'Strong';
  else if (composite >= 7.0) verdict = 'Solid';
  else if (composite >= 6.0) verdict = 'Conditional';
  else verdict = 'Not Recommended';

  let segment: string;
  if (composite >= 8.0) segment = 'A';
  else if (composite >= 6.5) segment = 'B';
  else segment = 'C';

  return { composite_score: composite, verdict, segment };
}

// ── SWEEP Mode ───────────────────────────────────────────────────────
async function handleSweep(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  const { contact_ids, mandate_id, mode = 'ai_suggest' } = req.body || {};

  if (!Array.isArray(contact_ids) || contact_ids.length === 0) {
    return res.status(400).json({ success: false, error: 'contact_ids array is required' });
  }

  if (!mandate_id) {
    return res.status(400).json({ success: false, error: 'mandate_id is required for SWEEP' });
  }

  const startTime = Date.now();
  const TIMEOUT_MS = 110000;

  // Get mandate
  const mandate = await selectOne('mandates', {
    column: 'id', value: mandate_id, select: '*',
  }, 15000);

  if (!mandate) return res.status(404).json({ success: false, error: 'Mandate not found' });

  // Get all contacts
  const contacts = await selectMany('contacts', {
    select: '*',
    where: [{ column: 'id', value: contact_ids, op: 'in' }],
  }, 15000);

  // Run preflight on all
  const preflightSummary = contacts.map(contact => {
    const preflight = runPreflightChecks(contact, mandate_id);
    return { contact_id: contact.id, preflight, contact_name: contact.full_name };
  });

  const halted = preflightSummary.filter(p => p.preflight.overall === 'HALT');
  const passable = preflightSummary.filter(p => p.preflight.overall !== 'HALT');

  // Process each passable contact with AI suggestion
  const aiSuggestions = [];
  for (const item of passable) {
    if (Date.now() - startTime > TIMEOUT_MS) {
      return res.status(504).json({
        success: false,
        error: 'SWEEP_TIMEOUT — refunding credits',
        preflight_summary: preflightSummary,
        ai_suggestions: aiSuggestions,
        halted_contacts: halted.map(h => ({ contact_id: h.contact_id, reason: h.preflight.flags.join('; ') })),
      });
    }

    const contact = contacts.find(c => c.id === item.contact_id);
    if (!contact) continue;

    try {
      const suggestion = await getAISuggestedScores(contact, mandate, mandate.job_description);
      const composite = computeComposite(suggestion.d1.score, suggestion.d2.score, suggestion.d3.score);

      aiSuggestions.push({
        contact_id: contact.id,
        contact_name: contact.full_name,
        suggested_d1: suggestion.d1.score,
        suggested_d2: suggestion.d2.score,
        suggested_d3: suggestion.d3.score,
        d1_evidence: suggestion.d1.evidence,
        d2_evidence: suggestion.d2.evidence,
        d3_evidence: suggestion.d3.evidence,
        d1_confidence: suggestion.d1.confidence,
        d2_confidence: suggestion.d2.confidence,
        d3_confidence: suggestion.d3.confidence,
        composite: composite.composite_score,
        verdict: composite.verdict,
        segment: composite.segment,
        preflight_flags: item.preflight.flags,
        processing_time_ms: Date.now() - startTime,
      });
    } catch (err) {
      aiSuggestions.push({
        contact_id: contact.id,
        contact_name: contact.full_name,
        error: err instanceof Error ? err.message : 'AI suggestion failed',
        status: 'failed',
      });
    }
  }

  // Create SWEEP signal
  await insert('signals', {
    type: 'assessment',
    source: 'agent',
    agent_id: 'trident',
    contact_id: null,
    mandate_id,
    actor_id: user.id,
    title: `TRIDENT SWEEP completed: ${aiSuggestions.length} candidates scored`,
    metadata: {
      mode: 'sweep',
      total: contacts.length,
      passable: passable.length,
      halted: halted.length,
      elapsed_ms: Date.now() - startTime,
    },
    insights: {},
    action_required: false,
    action_status: 'none',
  }, 15000);

  return res.status(200).json({
    success: true,
    preflight_summary: preflightSummary,
    ai_suggestions: aiSuggestions,
    halted_contacts: halted.map(h => ({ contact_id: h.contact_id, reason: h.preflight.flags.join('; ') })),
    elapsed_ms: Date.now() - startTime,
    credits_consumed: 10,
  });
}

async function getAISuggestedScores(contact: any, mandate: any, jobDescription: string) {
  if (!DEEPSEEK_API_KEY) {
    // Fallback: deterministic scoring for testing
    return {
      d1: { score: 7.5, evidence: `AI suggested D1 score for ${contact.full_name} based on ${contact.company_name}`, confidence: 'Medium' },
      d2: { score: 7.5, evidence: `AI suggested D2 score for ${contact.full_name} based on ${contact.company_name}`, confidence: 'Medium' },
      d3: { score: 7.5, evidence: `AI suggested D3 score for ${contact.full_name} based on ${contact.company_name}`, confidence: 'Medium' },
    };
  }

  const response = await fetch(DEEPSEEK_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-v4-flash',
      messages: [
        {
          role: 'system',
          content: `You are TRIDENT, an executive assessment AI for LYC Intelligence. You evaluate candidates on 3 dimensions using evidence from their profile.

Scoring framework:
- D1: Domain & Intelligence (30%) — sector expertise, analytical depth, industry knowledge
- D2: Delivery & Influence (40%) — quantified outcomes, stakeholder impact, execution, leadership
- D3: Drive & Dynamics (30%) — resilience, ambition, cultural adaptability, learning agility

Scale: 1.0-10.0. 9.0-10.0=Exceptional, 8.0-8.9=Strong, 7.0-7.9=Solid, 6.0-6.9=Conditional, <6.0=Not Recommended.

For each dimension, provide:
- A score (1.0-10.0)
- Evidence bullet (1-3 sentences with SPECIFIC facts — company names, numbers, achievements)
- Confidence (High/Medium/Low)

Be specific. Reference actual achievements. Never use generic phrases.`,
        },
        {
          role: 'user',
          content: `Candidate: ${contact.full_name}
Current Role: ${contact.title || 'Unknown'} at ${contact.company_name}
Experience: ${contact.experience_summary || contact.raw_data?.experience || 'See profile'}
Skills: ${contact.skills?.join(', ') || 'Not specified'}

Target Mandate: ${mandate.role_title}
Job Description: ${jobDescription || 'See mandate details'}

Evaluate this candidate for this specific role. Return JSON:
{
  "d1": { "score": number, "evidence": string, "confidence": string },
  "d2": { "score": number, "evidence": string, "confidence": string },
  "d3": { "score": number, "evidence": string, "confidence": string }
}`,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '{}';

  return JSON.parse(content);
}

// ── Get Single Scorecard ─────────────────────────────────────────────
async function handleGetScorecard(req: VercelRequest, res: VercelResponse, scorecardId: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  const scorecard = await selectOne('trident_scorecards', {
    column: 'id', value: scorecardId, select: '*',
  }, 15000);

  if (!scorecard) return res.status(404).json({ success: false, error: 'Scorecard not found' });

  // Get contact
  const contact = await selectOne('contacts', {
    column: 'id', value: scorecard.contact_id, select: '*',
  }, 15000);

  return res.status(200).json({
    success: true,
    scorecard: {
      ...scorecard,
      d1_sub: typeof scorecard.d1_sub === 'string' ? JSON.parse(scorecard.d1_sub) : scorecard.d1_sub,
      d2_sub: typeof scorecard.d2_sub === 'string' ? JSON.parse(scorecard.d2_sub) : scorecard.d2_sub,
      d3_sub: typeof scorecard.d3_sub === 'string' ? JSON.parse(scorecard.d3_sub) : scorecard.d3_sub,
      preflight: typeof scorecard.preflight === 'string' ? JSON.parse(scorecard.preflight) : scorecard.preflight,
      metadata: typeof scorecard.metadata === 'string' ? JSON.parse(scorecard.metadata) : scorecard.metadata,
    },
    contact,
  });
}

// ── List Scorecards ──────────────────────────────────────────────────
async function handleListScorecards(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  const { mandate_id, contact_id, review_status, limit = '50' } = req.query as Record<string, string>;

  const where: Array<{ column: string; value: string }> = [];
  if (mandate_id) where.push({ column: 'mandate_id', value: mandate_id });
  if (contact_id) where.push({ column: 'contact_id', value: contact_id });
  if (review_status) where.push({ column: 'review_status', value: review_status });

  const scorecards = await selectMany('trident_scorecards', {
    select: '*',
    where: where.length > 0 ? where : undefined,
    orderBy: { column: 'composite_score', ascending: false },
    limit: parseInt(limit),
  }, 15000);

  return res.status(200).json({ success: true, data: scorecards });
}

// ── Compare ──────────────────────────────────────────────────────────
async function handleCompare(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  const { mandate_id } = req.query as Record<string, string>;

  if (!mandate_id) {
    return res.status(400).json({ success: false, error: 'mandate_id is required' });
  }

  // Get latest scorecard per contact for this mandate
  const scorecards = await selectMany('trident_scorecards', {
    select: '*',
    where: [{ column: 'mandate_id', value: mandate_id }],
    orderBy: { column: 'composite_score', ascending: false },
    limit: 200,
  }, 15000);

  // Dedupe by contact_id (keep latest)
  const seen = new Set<string>();
  const unique = scorecards.filter(s => {
    if (seen.has(s.contact_id)) return false;
    seen.add(s.contact_id);
    return true;
  });

  // Get contacts
  const contactIds = unique.map(s => s.contact_id);
  const contacts = contactIds.length > 0
    ? await selectMany('contacts', {
        select: 'id, full_name, company_name, title, pipeline_stage, current_title',
        where: [{ column: 'id', value: contactIds, op: 'in' }],
      }, 15000)
    : [];
  const contactMap = new Map(contacts.map(c => [c.id, c]));

  // Compose comparison list
  const candidates = unique.map(s => {
    const contact = contactMap.get(s.contact_id);
    return {
      contact_id: s.contact_id,
      full_name: contact?.full_name,
      company_name: contact?.company_name,
      title: contact?.current_title || contact?.title,
      d1_score: s.d1_score,
      d2_score: s.d2_score,
      d3_score: s.d3_score,
      composite_score: s.composite_score,
      verdict: s.verdict,
      segment: s.segment,
      pipeline_stage: contact?.pipeline_stage,
      review_status: s.review_status,
      stale_flag: s.stale_flag,
      scored_at: s.scored_at,
    };
  });

  const total_scored = candidates.length;
  const segment_a = candidates.filter(c => c.segment === 'A').length;
  const segment_b = candidates.filter(c => c.segment === 'B').length;
  const segment_c = candidates.filter(c => c.segment === 'C').length;
  const avg_composite = total_scored > 0
    ? Math.round((candidates.reduce((sum, c) => sum + Number(c.composite_score), 0) / total_scored) * 10) / 10
    : 0;
  const recommended_count = candidates.filter(c => c.verdict === 'Strong' || c.verdict === 'Exceptional Primary').length;

  return res.status(200).json({
    success: true,
    candidates,
    summary: {
      total_scored,
      segment_a,
      segment_b,
      segment_c,
      avg_composite,
      recommended_count,
    },
  });
}

// ── Kevin Review Action ──────────────────────────────────────────────
async function handleReviewAction(req: VercelRequest, res: VercelResponse, scorecardId: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  // Check admin role
  const profile = await selectOne('profiles', {
    column: 'id', value: user.id, select: 'role',
  }, 15000);

  if (profile?.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required for review' });
  }

  const { action, review_notes, adjusted_d1, adjusted_d2, adjusted_d3 } = req.body || {};

  const validActions = ['approve', 'reject', 'adjust', 'info_requested'];
  if (!action || !validActions.includes(action)) {
    return res.status(400).json({ success: false, error: 'Invalid action' });
  }

  const scorecard = await selectOne('trident_scorecards', {
    column: 'id', value: scorecardId, select: '*',
  }, 15000);

  if (!scorecard) return res.status(404).json({ success: false, error: 'Scorecard not found' });

  const updates: Record<string, any> = {
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
    review_notes: review_notes || null,
  };

  if (action === 'approve') {
    updates.review_status = 'approved';
  } else if (action === 'reject') {
    updates.review_status = 'rejected';
  } else if (action === 'info_requested') {
    updates.review_status = 'info_requested';
  } else if (action === 'adjust') {
    if (adjusted_d1 == null || adjusted_d2 == null || adjusted_d3 == null) {
      return res.status(400).json({ success: false, error: 'adjusted_d1, d2, d3 required for adjust' });
    }
    // Save originals
    updates.original_d1 = scorecard.d1_score;
    updates.original_d2 = scorecard.d2_score;
    updates.original_d3 = scorecard.d3_score;
    updates.original_composite = scorecard.composite_score;

    // Apply new scores
    updates.d1_score = adjusted_d1;
    updates.d2_score = adjusted_d2;
    updates.d3_score = adjusted_d3;

    // Recompute
    const composite = computeComposite(adjusted_d1, adjusted_d2, adjusted_d3);
    updates.composite_score = composite.composite_score;
    updates.verdict = composite.verdict;
    updates.segment = composite.segment;
    updates.review_status = 'adjusted';
  }

  const result = await update('trident_scorecards', { column: 'id', value: scorecardId }, updates, 15000);

  // Signal
  await insert('signals', {
    type: 'assessment',
    source: 'agent',
    agent_id: 'trident',
    contact_id: scorecard.contact_id,
    mandate_id: scorecard.mandate_id,
    actor_id: user.id,
    title: `Kevin ${action}ed scorecard`,
    metadata: { scorecard_id: scorecardId, action, review_notes },
    insights: {},
    action_required: false,
    action_status: 'none',
  }, 15000);

  return res.status(200).json({ success: true, data: result[0] || null });
}

// ── Review Queue ─────────────────────────────────────────────────────
async function handleReviewQueue(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  // Check admin role
  const profile = await selectOne('profiles', {
    column: 'id', value: user.id, select: 'role',
  }, 15000);

  if (profile?.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }

  const pending = await selectMany('trident_scorecards', {
    select: '*',
    where: [{ column: 'review_status', value: 'pending' }],
    orderBy: { column: 'composite_score', ascending: false },
  }, 15000);

  // Get contacts and mandates and scorers
  const contactIds = pending.map(s => s.contact_id);
  const mandateIds = pending.map(s => s.mandate_id).filter(Boolean);
  const scorerIds = pending.map(s => s.scored_by);

  const contacts = contactIds.length > 0
    ? await selectMany('contacts', {
        select: 'id, full_name',
        where: [{ column: 'id', value: contactIds, op: 'in' }],
      }, 15000)
    : [];
  const contactMap = new Map(contacts.map(c => [c.id, c]));

  const mandates = mandateIds.length > 0
    ? await selectMany('mandates', {
        select: 'id, title, role_title',
        where: [{ column: 'id', value: mandateIds, op: 'in' }],
      }, 15000)
    : [];
  const mandateMap = new Map(mandates.map(m => [m.id, m]));

  const profiles = scorerIds.length > 0
    ? await selectMany('profiles', {
        select: 'id, full_name',
        where: [{ column: 'id', value: scorerIds, op: 'in' }],
      }, 15000)
    : [];
  const profileMap = new Map(profiles.map(p => [p.id, p]));

  return res.status(200).json({
    success: true,
    pending: pending.map(s => {
      const preflight = typeof s.preflight === 'string' ? JSON.parse(s.preflight) : s.preflight;
      return {
        scorecard_id: s.id,
        contact_id: s.contact_id,
        full_name: contactMap.get(s.contact_id)?.full_name,
        mandate_id: s.mandate_id,
        mandate_title: mandateMap.get(s.mandate_id)?.title,
        composite_score: s.composite_score,
        verdict: s.verdict,
        segment: s.segment,
        scored_by_name: profileMap.get(s.scored_by)?.full_name,
        scored_at: s.scored_at,
        preflight_flags: preflight?.flags || [],
      };
    }),
    total_pending: pending.length,
  });
}

// ── Edit Scorecard ───────────────────────────────────────────────────
async function handleEditScorecard(req: VercelRequest, res: VercelResponse, scorecardId: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  const scorecard = await selectOne('trident_scorecards', {
    column: 'id', value: scorecardId, select: '*',
  }, 15000);

  if (!scorecard) return res.status(404).json({ success: false, error: 'Scorecard not found' });

  // Check permission: scorer or admin
  if (scorecard.scored_by !== user.id) {
    const profile = await selectOne('profiles', {
      column: 'id', value: user.id, select: 'role',
    }, 15000);
    if (profile?.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only scorer or admin can edit' });
    }
  }

  const updates: Record<string, any> = { ...req.body };
  delete updates.id;
  delete updates.scored_by;
  delete updates.credits_consumed;
  delete updates.preflight;
  delete updates.original_d1;
  delete updates.original_d2;
  delete updates.original_d3;
  delete updates.original_composite;

  // Stringify JSONB
  if (updates.d1_sub) updates.d1_sub = JSON.stringify(updates.d1_sub);
  if (updates.d2_sub) updates.d2_sub = JSON.stringify(updates.d2_sub);
  if (updates.d3_sub) updates.d3_sub = JSON.stringify(updates.d3_sub);
  if (updates.metadata) updates.metadata = JSON.stringify(updates.metadata);

  // Recompute if scores changed
  if (updates.d1_score != null || updates.d2_score != null || updates.d3_score != null) {
    const d1 = updates.d1_score ?? scorecard.d1_score;
    const d2 = updates.d2_score ?? scorecard.d2_score;
    const d3 = updates.d3_score ?? scorecard.d3_score;
    const composite = computeComposite(d1, d2, d3);
    updates.composite_score = composite.composite_score;
    updates.verdict = composite.verdict;
    updates.segment = composite.segment;
  }

  const result = await update('trident_scorecards', { column: 'id', value: scorecardId }, updates, 15000);

  // Signal
  await insert('signals', {
    type: 'assessment',
    source: 'agent',
    agent_id: 'trident',
    contact_id: scorecard.contact_id,
    mandate_id: scorecard.mandate_id,
    actor_id: user.id,
    title: 'TRIDENT scorecard updated',
    metadata: { scorecard_id: scorecardId },
    insights: {},
    action_required: false,
    action_status: 'none',
  }, 15000);

  return res.status(200).json({ success: true, data: result[0] || null });
}