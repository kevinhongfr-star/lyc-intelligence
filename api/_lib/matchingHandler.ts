/**
 * AI Matching Engine — DEX AI Technical Blueprint 08
 *
 * Combined handler with:
 * - Mandate matching (find candidates for a mandate)
 * - Candidate reverse matching (find mandates for a candidate)
 * - Match management (run status, override, link to pipeline)
 * - DeepSeek AI analysis integration
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
import { getUserFromRequest, getUserRole } from './adminAuth.js';

export const maxDuration = 120;

// ── DeepSeek AI Analysis ───────────────────────────────────────────────

interface MatchAnalysisInput {
  candidate: {
    name: string;
    current_title: string;
    company: string;
    industry: string;
    location: string;
    years_of_experience: number;
    pipeline_stage: string;
    motivation_overall: string;
    skills: string[];
    languages: string[];
    trident_d1: number;
    trident_d2: number;
    trident_d3: number;
    trident_composite: number;
    trident_verdict: string;
  };
  mandate: {
    title: string;
    company_name: string;
    industry: string;
    location: string;
    salary_range: string;
    requirements: string;
    phase: string;
  };
}

function buildMatchAnalysisPrompt(input: MatchAnalysisInput): string {
  return `You are a senior executive search analyst at LYC Partners. Evaluate the fit between this candidate and this mandate.

CANDIDATE PROFILE:
- Name: ${input.candidate.name}
- Current: ${input.candidate.current_title} at ${input.candidate.company}
- Industry: ${input.candidate.industry || 'Not specified'}
- Location: ${input.candidate.location || 'Not specified'}
- Years Experience: ${input.candidate.years_of_experience || 'Not specified'}
- TRIDENT Scores: D1=${input.candidate.trident_d1}/10 (Capability), D2=${input.candidate.trident_d2}/10 (Behavioral), D3=${input.candidate.trident_d3}/10 (Cultural Fit)
- TRIDENT Composite: ${input.candidate.trident_composite}/10 (${input.candidate.trident_verdict})
- Pipeline Stage: ${input.candidate.pipeline_stage}
- Motivation: ${input.candidate.motivation_overall}
- Skills: ${input.candidate.skills?.join(', ') || 'Not specified'}
- Languages: ${input.candidate.languages?.join(', ') || 'Not specified'}

MANDATE REQUIREMENTS:
- Title: ${input.mandate.title}
- Company: ${input.mandate.company_name}
- Industry: ${input.mandate.industry || 'Not specified'}
- Location: ${input.mandate.location || 'Not specified'}
- Salary Range: ${input.mandate.salary_range || 'Not specified'}
- Key Requirements: ${input.mandate.requirements || 'Not specified'}
- Phase: ${input.mandate.phase}

Provide your analysis as a valid JSON object with these exact fields:
{
  "match_summary": "2-3 sentence overall assessment of fit",
  "key_strengths": ["strength 1", "strength 2", "strength 3"],
  "key_risks": ["risk 1", "risk 2"],
  "compensation_fit": "aligned|slightly_above|above|risk",
  "location_fit": "good|relocatable|concern",
  "recommendation": "prioritize|interview|consider|pass",
  "talking_points": ["talking point 1 for consultant outreach", "talking point 2"]
}

Be specific and evidence-based. Reference the TRIDENT scores and candidate data.
Do NOT use markdown — return raw JSON only.`;
}

function parseMatchAnalysis(response: string): any {
  try {
    let cleaned = response.trim();
    if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
    if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
    if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
    cleaned = cleaned.trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('Failed to parse DeepSeek match analysis:', e);
    return {
      match_summary: 'AI analysis unavailable — score based on algorithmic matching only.',
      key_strengths: [],
      key_risks: [],
      compensation_fit: 'unknown',
      location_fit: 'unknown',
      recommendation: 'consider',
      talking_points: [],
    };
  }
}

async function getAIMatchAnalysis(input: MatchAnalysisInput): Promise<any> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return {
      match_summary: 'DeepSeek API not configured. Algorithmic score only.',
      key_strengths: [],
      key_risks: [],
      compensation_fit: 'unknown',
      location_fit: 'unknown',
      recommendation: 'consider',
      talking_points: [],
    };
  }

  const prompt = buildMatchAnalysisPrompt(input);

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are an expert executive search analyst. Return JSON only.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    return parseMatchAnalysis(content);
  } catch (error: any) {
    console.error('DeepSeek analysis error:', error.message);
    return {
      match_summary: 'AI analysis failed. Algorithmic score only.',
      key_strengths: [],
      key_risks: [],
      compensation_fit: 'unknown',
      location_fit: 'unknown',
      recommendation: 'consider',
      talking_points: [],
    };
  }
}

// ── Core Matching Engine ───────────────────────────────────────────────

async function runMandateMatch(
  mandateId: string,
  params: any,
  userId: string
): Promise<string> {
  const run = await insert('match_runs', {
    mandate_id: mandateId,
    run_type: params.run_type || 'mandate_match',
    triggered_by: userId,
    status: 'running',
    parameters: JSON.stringify(params),
  });

  // Fire and forget — don't await the long-running match
  executeMandateMatch(mandateId, run.id, params, userId).catch(err => {
    console.error('Match run failed:', err);
  });

  return run.id;
}

async function executeMandateMatch(
  mandateId: string,
  runId: string,
  params: any,
  userId: string
) {
  try {
    const minScore = params.min_score || 30;
    const maxResults = params.max_results || 50;
    const deepseekTopN = params.deepseek_top_n || 20;
    const useDeepSeek = params.deepseek_analysis !== false;

    // Get mandate
    const mandate = await selectOne('mandates', { column: 'id', value: mandateId, select: '*' }, 10000);
    if (!mandate) throw new Error('Mandate not found');

    // Get eligible candidates
    const allContacts = await selectMany('contacts', {
      is_archived: false,
    }, [], 500, 0, '*');

    const candidates = allContacts.filter((c: any) => c.classification !== 'ELIMINATE');

    if (!candidates?.length) {
      await update('match_runs', runId, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        candidates_evaluated: 0,
        matches_found: 0,
      });
      return;
    }

    let evaluated = 0;
    let matchesFound = 0;
    let exceptionalCount = 0;
    let strongCount = 0;

    // Score each candidate using the SQL function
    for (const candidate of candidates) {
      evaluated++;

      try {
        const scoreResult = await computeMatchScore(candidate.id, mandateId);
        if (!scoreResult || scoreResult.match_score < minScore) continue;

        matchesFound++;
        if (scoreResult.match_grade === 'EXCEPTIONAL') exceptionalCount++;
        if (scoreResult.match_grade === 'STRONG') strongCount++;

        // Upsert match record
        await upsertMatch({
          contact_id: candidate.id,
          mandate_id: mandateId,
          match_score: scoreResult.match_score,
          match_grade: scoreResult.match_grade,
          trident_component: scoreResult.trident_component,
          pipeline_component: scoreResult.pipeline_component,
          heuristic_component: scoreResult.heuristic_component,
          trident_composite: candidate.trident_composite,
          trident_verdict: candidate.trident_verdict,
          dimension_scores: JSON.stringify(scoreResult.dimension_scores || {}),
          pipeline_compatibility: JSON.stringify(scoreResult.pipeline_compatibility || {}),
          match_source: params.run_type === 'sweep' ? 'ai_sweep' : 'ai_suggest',
          generated_by: userId,
          is_stale: false,
          stale_reason: null,
        });
      } catch (e) {
        console.error(`Error scoring candidate ${candidate.id}:`, e);
      }
    }

    // DeepSeek analysis for top N
    if (useDeepSeek && matchesFound > 0) {
      const topMatches = await selectMany(
        'candidate_mandate_matches',
        { mandate_id: mandateId },
        ['match_score DESC'],
        deepseekTopN,
        0,
        '*'
      );

      for (const match of topMatches) {
        try {
          const candidate = await selectOne('contacts', { column: 'id', value: match.contact_id, select: '*' }, 5000);
          if (!candidate) continue;

          const aiAnalysis = await getAIMatchAnalysis({
            candidate: {
              name: candidate.full_name || candidate.name || '',
              current_title: candidate.current_title || '',
              company: candidate.company_name || '',
              industry: candidate.industry || '',
              location: candidate.city || candidate.location || '',
              years_of_experience: candidate.years_of_experience || 0,
              pipeline_stage: candidate.pipeline_stage || '',
              motivation_overall: candidate.motivation_overall || '',
              skills: candidate.skills || [],
              languages: candidate.languages || [],
              trident_d1: match.dimension_scores?.d1?.score || 0,
              trident_d2: match.dimension_scores?.d2?.score || 0,
              trident_d3: match.dimension_scores?.d3?.score || 0,
              trident_composite: match.trident_composite || 0,
              trident_verdict: match.trident_verdict || '',
            },
            mandate: {
              title: mandate.title || '',
              company_name: mandate.company_name || '',
              industry: mandate.industry || '',
              location: mandate.location || '',
              salary_range: mandate.salary_range || '',
              requirements: JSON.stringify(mandate.requirements || {}),
              phase: mandate.phase || mandate.status || '',
            },
          });

          await update('candidate_mandate_matches', match.id, {
            ai_analysis: JSON.stringify(aiAnalysis),
          });
        } catch (err) {
          console.error(`DeepSeek analysis failed for match ${match.id}:`, err);
        }
      }
    }

    // Update run record
    await update('match_runs', runId, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      candidates_evaluated: evaluated,
      matches_found: matchesFound,
      exceptional_count: exceptionalCount,
      strong_count: strongCount,
    });
  } catch (error: any) {
    console.error('Match execution failed:', error);
    await update('match_runs', runId, {
      status: 'failed',
      completed_at: new Date().toISOString(),
      error_message: error.message,
    });
  }
}

async function runCandidateMatch(
  contactId: string,
  params: any,
  userId: string
): Promise<string> {
  const run = await insert('match_runs', {
    contact_id: contactId,
    run_type: 'candidate_match',
    triggered_by: userId,
    status: 'running',
    parameters: JSON.stringify(params),
  });

  executeCandidateMatch(contactId, run.id, params, userId).catch(err => {
    console.error('Candidate match run failed:', err);
  });

  return run.id;
}

async function executeCandidateMatch(
  contactId: string,
  runId: string,
  params: any,
  userId: string
) {
  try {
    const mandates = await selectMany('mandates', {}, [], 100, 0, '*');
    const activeMandates = mandates.filter((m: any) =>
      m.status === 'active' || m.status === 'paused'
    );

    if (!activeMandates?.length) {
      await update('match_runs', runId, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        candidates_evaluated: 0,
        matches_found: 0,
      });
      return;
    }

    let evaluated = 0;
    let matchesFound = 0;

    for (const mandate of activeMandates) {
      evaluated++;
      try {
        const scoreResult = await computeMatchScore(contactId, mandate.id);
        if (!scoreResult || scoreResult.match_score < 30) continue;

        matchesFound++;

        await upsertMatch({
          contact_id: contactId,
          mandate_id: mandate.id,
          match_score: scoreResult.match_score,
          match_grade: scoreResult.match_grade,
          trident_component: scoreResult.trident_component,
          pipeline_component: scoreResult.pipeline_component,
          heuristic_component: scoreResult.heuristic_component,
          dimension_scores: JSON.stringify(scoreResult.dimension_scores || {}),
          pipeline_compatibility: JSON.stringify(scoreResult.pipeline_compatibility || {}),
          match_source: 'ai_suggest',
          generated_by: userId,
          is_stale: false,
        });
      } catch (e) {
        console.error(`Error scoring mandate ${mandate.id}:`, e);
      }
    }

    await update('match_runs', runId, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      candidates_evaluated: evaluated,
      matches_found: matchesFound,
    });
  } catch (error: any) {
    console.error('Candidate match failed:', error);
    await update('match_runs', runId, {
      status: 'failed',
      completed_at: new Date().toISOString(),
      error_message: error.message,
    });
  }
}

// ── Helper: Compute match score via RPC-like call ──────────────────────
async function computeMatchScore(contactId: string, mandateId: string): Promise<any | null> {
  try {
    // Since we don't have a direct RPC wrapper, we use the function via select
    // For now, compute it manually in JS (mirroring the SQL logic)
    const candidate = await selectOne('contacts', { column: 'id', value: contactId, select: '*' }, 5000);
    const mandate = await selectOne('mandates', { column: 'id', value: mandateId, select: '*' }, 5000);
    const scorecard = await selectOne('trident_scorecards',
      { column: 'contact_id', value: contactId, select: '*' }, 5000);

    if (!candidate || !mandate) return null;

    // ── TRIDENT component (60%) ──
    let tridentScore = 0;
    let d1 = 0, d2 = 0, d3 = 0;
    let dimScores: any = {};

    if (scorecard && scorecard.composite_score) {
      tridentScore = scorecard.composite_score * 10;
      d1 = scorecard.d1_score || 0;
      d2 = scorecard.d2_score || 0;
      d3 = scorecard.d3_score || 0;
      dimScores = {
        d1: { score: d1, fit_notes: d1 >= 7 ? 'Strong capability fit' : d1 >= 5 ? 'Moderate capability fit' : 'Weak capability fit' },
        d2: { score: d2, fit_notes: d2 >= 7 ? 'Strong behavioral fit' : d2 >= 5 ? 'Moderate behavioral fit' : 'Weak behavioral fit' },
        d3: { score: d3, fit_notes: d3 >= 7 ? 'Strong cultural fit' : d3 >= 5 ? 'Moderate cultural fit' : 'Weak cultural fit' },
      };
    } else {
      const dataConf = candidate.data_confidence || 0;
      const tierBonus = candidate.tier === 'A' ? 30 : candidate.tier === 'B' ? 20 : candidate.tier === 'C' ? 10 : 0;
      tridentScore = Math.min(dataConf * 0.5 + tierBonus, 70);
      dimScores = {
        d1: { score: null, fit_notes: 'No TRIDENT score — heuristic proxy used' },
        d2: { score: null, fit_notes: 'No TRIDENT score — heuristic proxy used' },
        d3: { score: null, fit_notes: 'No TRIDENT score — heuristic proxy used' },
      };
    }

    // ── Pipeline component (20%) ──
    let pipelineScore = 50;
    const stage = candidate.pipeline_stage;

    if (['S2_Screened', 'S5_Responded', 'S6_WeChat_Added', 'S7_Interested', 'S9_Call_Positive', 'S11_Internal_Interview'].includes(stage)) {
      pipelineScore += 30;
    } else if (stage === 'S1_Sourced') {
      pipelineScore += 10;
    } else if (['S4_No_Response', 'S8_Not_Interested', 'S10_Call_Negative'].includes(stage)) {
      pipelineScore -= 30;
    } else if (['S12_Presented_to_Client', 'S13_Client_Int_Scheduled', 'S14_Client_Interviewed', 'S15_Client_2nd_Interview', 'S16_Offer_Extended', 'S17_Offer_Accepted'].includes(stage)) {
      pipelineScore += 20;
    }

    const mot = candidate.motivation_overall;
    if (mot === 'GREEN') pipelineScore += 15;
    else if (mot === 'YELLOW') pipelineScore += 5;
    else if (mot === 'RED') pipelineScore -= 20;

    if (candidate.reachability_verified) pipelineScore += 5;
    else if ((candidate.reachability_unknowns || 5) >= 2) pipelineScore -= 10;

    pipelineScore = Math.max(0, Math.min(100, pipelineScore));

    const pipelineCompat = {
      stage_compatible: !['S4_No_Response', 'S8_Not_Interested', 'S10_Call_Negative'].includes(stage),
      stage,
      motivation_fit: mot,
      reachability_ok: candidate.reachability_verified || (candidate.reachability_unknowns || 5) <= 1,
      available: !['S16_Offer_Extended', 'S17_Offer_Accepted', 'S19_Closed'].includes(stage),
      notes: ['S7_Interested', 'S9_Call_Positive'].includes(stage)
        ? 'Candidate is engaged and responsive'
        : stage === 'S1_Sourced'
          ? 'Not yet contacted — needs initial screening'
          : mot === 'RED'
            ? 'Motivation concern — DO NOT CONTACT'
            : 'Standard availability',
    };

    // ── Heuristic component (20%) ──
    let heuristicScore = 50;

    if (candidate.industry && mandate.industry &&
        candidate.industry.toLowerCase() === mandate.industry.toLowerCase()) {
      heuristicScore += 25;
    }

    const candLoc = candidate.city || candidate.location || '';
    const mandLoc = mandate.location || '';
    if (candLoc && mandLoc) {
      if (candLoc.toLowerCase() === mandLoc.toLowerCase()) {
        heuristicScore += 20;
      } else {
        const mandFirst = mandLoc.split(' ')[0]?.toLowerCase() || '';
        if (mandFirst && candLoc.toLowerCase().includes(mandFirst)) {
          heuristicScore += 10;
        }
      }
    }

    if (candidate.current_title && mandate.title) {
      const mandFirst = mandate.title.split(' ')[0]?.toLowerCase() || '';
      if (mandFirst && candidate.current_title.toLowerCase().includes(mandFirst)) {
        heuristicScore += 15;
      }
    }

    const years = candidate.years_of_experience;
    if (years !== null && years !== undefined) {
      if (years >= 10) heuristicScore += 10;
      else if (years < 5) heuristicScore -= 10;
    }

    heuristicScore = Math.max(0, Math.min(100, heuristicScore));

    // ── Final weighted score ──
    const finalScore = Math.round(
      (tridentScore * 0.60 + pipelineScore * 0.20 + heuristicScore * 0.20) * 100
    ) / 100;

    let grade = 'MISMATCH';
    if (finalScore >= 85) grade = 'EXCEPTIONAL';
    else if (finalScore >= 70) grade = 'STRONG';
    else if (finalScore >= 50) grade = 'MODERATE';
    else if (finalScore >= 30) grade = 'WEAK';

    return {
      match_score: finalScore,
      match_grade: grade,
      trident_component: Math.round(tridentScore * 100) / 100,
      pipeline_component: pipelineScore,
      heuristic_component: heuristicScore,
      dimension_scores: dimScores,
      pipeline_compatibility: pipelineCompat,
    };
  } catch (e) {
    console.error('computeMatchScore error:', e);
    return null;
  }
}

async function upsertMatch(data: any): Promise<any> {
  const existing = await selectMany(
    'candidate_mandate_matches',
    { contact_id: data.contact_id, mandate_id: data.mandate_id },
    [], 1, 0, '*'
  );

  if (existing.length > 0) {
    return update('candidate_mandate_matches', existing[0].id, data);
  } else {
    return insert('candidate_mandate_matches', data);
  }
}

// ── API Handler ────────────────────────────────────────────────────────

export async function handleMatching(req: VercelRequest, res: VercelResponse) {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    const pathArr = (req.query.path as string[]) || [];
    const resource = pathArr[0]; // mandate | candidate | runs | matches
    const id = pathArr[1];
    const subResource = pathArr[2];
    const subId = pathArr[3];

    const { user, error } = await getUserFromRequest(req);
    if (error || !user) return res.status(401).json({ success: false, error });

    // M-1: POST /api/matching/mandate/:mandate_id — trigger match
    if (resource === 'mandate' && id && req.method === 'POST' && !subResource) {
      const runId = await runMandateMatch(id, req.body || {}, user.id);
      return res.status(202).json({
        success: true,
        run_id: runId,
        status: 'running',
        message: 'Matching started — evaluating candidates for mandate',
      });
    }

    // M-2: GET /api/matching/mandate/:mandate_id/matches — list matches
    if (resource === 'mandate' && id && subResource === 'matches' && req.method === 'GET') {
      return handleListMandateMatches(req, res, id);
    }

    // M-3: GET /api/matching/mandate/:mandate_id/matches/:contact_id — detail
    if (resource === 'mandate' && id && subResource === 'matches' && subId && req.method === 'GET') {
      return handleMatchDetail(req, res, id, subId);
    }

    // M-4: POST /api/matching/candidate/:contact_id — reverse match
    if (resource === 'candidate' && id && req.method === 'POST' && !subResource) {
      const runId = await runCandidateMatch(id, req.body || {}, user.id);
      return res.status(202).json({
        success: true,
        run_id: runId,
        status: 'running',
        message: 'Reverse matching started — finding mandates for candidate',
      });
    }

    // M-5: GET /api/matching/candidate/:contact_id/matches — list mandate matches
    if (resource === 'candidate' && id && subResource === 'matches' && req.method === 'GET') {
      return handleListCandidateMatches(req, res, id);
    }

    // M-6: GET /api/matching/runs/:run_id — run status
    if (resource === 'runs' && id && req.method === 'GET') {
      return handleRunStatus(req, res, id);
    }

    // M-7: POST /api/matching/runs/:run_id/cancel — cancel run
    if (resource === 'runs' && id && subResource === 'cancel' && req.method === 'POST') {
      return handleCancelRun(req, res, id);
    }

    // M-8: PATCH /api/matching/matches/:id — override score
    if (resource === 'matches' && id && req.method === 'PATCH') {
      return handleOverrideMatch(req, res, id, user.id);
    }

    // M-9: POST /api/matching/matches/:id/link — link to pipeline
    if (resource === 'matches' && id && subResource === 'link' && req.method === 'POST') {
      return handleLinkToPipeline(req, res, id, user.id);
    }

    return res.status(404).json({ success: false, error: 'Matching route not found' });
  } catch (err) {
    return handleError(res, 'matching', err);
  }
}

async function handleListMandateMatches(req: VercelRequest, res: VercelResponse, mandateId: string) {
  const { min_score = '0', limit = '20', offset = '0', grade, include_stale = 'true', sort_by = 'match_score' } =
    req.query as Record<string, string>;

  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offsetNum = Math.max(0, parseInt(offset));
  const minScore = parseFloat(min_score);

  let matches = await selectMany(
    'candidate_mandate_matches',
    { mandate_id: mandateId },
    [`${sort_by} DESC`],
    100,
    0,
    '*'
  );

  // Filter in JS since our helper is simple
  matches = matches.filter((m: any) => {
    if (m.match_score < minScore) return false;
    if (grade && m.match_grade !== grade) return false;
    if (include_stale === 'false' && m.is_stale) return false;
    return true;
  });

  const total = matches.length;
  const paginated = matches.slice(offsetNum, offsetNum + limitNum);

  // Fetch candidate names
  const candidates = await selectMany('contacts', {}, [], 500, 0, 'id, full_name, current_title, company_name, pipeline_stage, motivation_overall');
  const candMap = new Map(candidates.map((c: any) => [c.id, c]));

  const result = paginated.map((m: any) => ({
    ...m,
    candidate: candMap.get(m.contact_id) || null,
  }));

  return res.json({
    success: true,
    mandate_id: mandateId,
    total_matches: total,
    matches: result,
  });
}

async function handleMatchDetail(req: VercelRequest, res: VercelResponse, mandateId: string, contactId: string) {
  const matches = await selectMany(
    'candidate_mandate_matches',
    { mandate_id: mandateId, contact_id: contactId },
    [], 1, 0, '*'
  );

  if (matches.length === 0) {
    return res.status(404).json({ success: false, error: 'Match not found' });
  }

  const candidate = await selectOne('contacts', { column: 'id', value: contactId, select: '*' }, 5000);
  const mandate = await selectOne('mandates', { column: 'id', value: mandateId, select: '*' }, 5000);

  return res.json({
    success: true,
    match: matches[0],
    candidate,
    mandate,
  });
}

async function handleListCandidateMatches(req: VercelRequest, res: VercelResponse, contactId: string) {
  const matches = await selectMany(
    'candidate_mandate_matches',
    { contact_id: contactId },
    ['match_score DESC'],
    50,
    0,
    '*'
  );

  const mandates = await selectMany('mandates', {}, [], 100, 0, 'id, title, company_name, industry, location, status, phase');
  const mandMap = new Map(mandates.map((m: any) => [m.id, m]));

  const result = matches.map((m: any) => ({
    ...m,
    mandate: mandMap.get(m.mandate_id) || null,
  }));

  return res.json({
    success: true,
    contact_id: contactId,
    total_matches: matches.length,
    matches: result,
  });
}

async function handleRunStatus(req: VercelRequest, res: VercelResponse, runId: string) {
  const run = await selectOne('match_runs', { column: 'id', value: runId, select: '*' }, 5000);
  if (!run) return res.status(404).json({ success: false, error: 'Run not found' });

  return res.json({ success: true, run });
}

async function handleCancelRun(req: VercelRequest, res: VercelResponse, runId: string) {
  const run = await selectOne('match_runs', { column: 'id', value: runId, select: '*' }, 5000);
  if (!run) return res.status(404).json({ success: false, error: 'Run not found' });

  if (run.status !== 'running') {
    return res.status(400).json({ success: false, error: `Cannot cancel run with status: ${run.status}` });
  }

  const updated = await update('match_runs', runId, {
    status: 'cancelled',
    completed_at: new Date().toISOString(),
  });

  return res.json({ success: true, run: updated });
}

async function handleOverrideMatch(req: VercelRequest, res: VercelResponse, matchId: string, userId: string) {
  const role = await getUserRole(userId);
  if (role !== 'admin' && role !== 'team_lead') {
    return res.status(403).json({ success: false, error: 'Team Lead+ required to override matches' });
  }

  const { override_score, override_grade, override_reason } = req.body || {};

  const match = await selectOne('candidate_mandate_matches', { column: 'id', value: matchId, select: '*' }, 5000);
  if (!match) return res.status(404).json({ success: false, error: 'Match not found' });

  const updated = await update('candidate_mandate_matches', matchId, {
    override_score,
    override_grade,
    override_reason,
    override_by: userId,
  });

  return res.json({ success: true, match: updated });
}

async function handleLinkToPipeline(req: VercelRequest, res: VercelResponse, matchId: string, userId: string) {
  const match = await selectOne('candidate_mandate_matches', { column: 'id', value: matchId, select: '*' }, 5000);
  if (!match) return res.status(404).json({ success: false, error: 'Match not found' });

  const { priority = 'P3', notes = '' } = req.body || {};

  // Try to insert into candidate_mandate_links if table exists
  try {
    const existing = await selectMany(
      'candidate_mandate_links',
      { contact_id: match.contact_id, mandate_id: match.mandate_id },
      [], 1, 0, '*'
    );

    if (existing.length > 0) {
      return res.json({ success: true, link: existing[0], message: 'Already linked to pipeline' });
    }

    const link = await insert('candidate_mandate_links', {
      contact_id: match.contact_id,
      mandate_id: match.mandate_id,
      status: 'identified',
      priority,
      notes,
      added_by: userId,
      added_at: new Date().toISOString(),
    });

    return res.json({ success: true, link });
  } catch (e) {
    // Table may not exist yet — return success with match info
    return res.json({
      success: true,
      message: 'Match ready for pipeline (candidate_mandate_links table not yet available)',
      match_id: matchId,
    });
  }
}
