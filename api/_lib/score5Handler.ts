import type { VercelRequest, VercelResponse } from '@vercel/node';
import { insert, isSupabaseConfigured, handleError } from './supabaseRest.js';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
export const maxDuration = 60;

const PROVIDER_TIMEOUT_MS = 15000;

async function fetchWithTimeout(url: string, options: any, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// 5-Criteria Scoring Model
const CRITERIA = {
  c1_industry_relevance: { label: 'Industry Relevance', weight: 0.20, description: 'Direct experience in the target industry or highly adjacent sectors' },
  c2_functional_expertise: { label: 'Functional Expertise', weight: 0.20, description: 'Depth of expertise in the required functional area (sales, ops, finance, tech, etc.)' },
  c3_leadership_scale: { label: 'Leadership Scale', weight: 0.20, description: 'Team size managed, P&L scope, organizational complexity handled' },
  c4_track_record: { label: 'Track Record', weight: 0.20, description: 'Documented achievements, tenure stability, career progression trajectory' },
  c5_strategic_fit: { label: 'Strategic & Cultural Fit', weight: 0.20, description: 'Alignment with company stage, culture, governance style, and strategic direction' },
};

interface FiveCriteriaResult {
  candidate_name: string;
  composite_score: number;
  dimension_scores: {
    c1_industry_relevance: number;
    c2_functional_expertise: number;
    c3_leadership_scale: number;
    c4_track_record: number;
    c5_strategic_fit: number;
  };
  match_reasons: string[];
  risk_factors: string[];
  approach_strategy: string;
  sub_scores: {
    c1_industry_relevance: { score: number; rationale: string };
    c2_functional_expertise: { score: number; rationale: string };
    c3_leadership_scale: { score: number; rationale: string };
    c4_track_record: { score: number; rationale: string };
    c5_strategic_fit: { score: number; rationale: string };
  };
}

export async function handleScore5(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { jd, candidates, userId, mandateId } = req.body;
    if (!jd || !candidates || candidates.length === 0) {
      return res.status(400).json({ error: 'Missing JD or candidates' });
    }

    const results: FiveCriteriaResult[] = [];
    for (const candidate of candidates) {
      const result = await score5Criteria(jd, candidate.name, candidate.cv);
      if (result) results.push(result);
    }

    // Save to scoring_runs (best-effort)
    if (isSupabaseConfigured()) {
      for (const r of results) {
        try {
          await insert('scoring_runs', {
            user_id: userId || null,
            mandate_id: mandateId || null,
            run_type: '5-criteria',
            input_params: JSON.stringify({ jd: jd.substring(0, 500) }),
            output_scores: JSON.stringify(r.dimension_scores),
            composite_score: r.composite_score,
            verdict: JSON.stringify({ reasons: r.match_reasons, risks: r.risk_factors, strategy: r.approach_strategy, sub_scores: r.sub_scores }),
            model: 'deepseek-v4-flash',
          });
        } catch (e) {
          console.error('[Score5] Failed to save scoring run:', e);
        }
      }
    }

    return res.status(200).json({ results, criteria: CRITERIA });
  } catch (err) {
    return handleError(res, 'score5', err);
  }
}

async function score5Criteria(jd: string, name: string, cv: string): Promise<FiveCriteriaResult | null> {
  if (!DEEPSEEK_API_KEY) {
    console.warn('[Score5] DEEPSEEK_API_KEY missing');
    return null;
  }

  const prompt = `You are an executive search consultant scoring a candidate against a mandate using the LYC 5-Criteria Framework.

Score the candidate on each criterion (0-100) and provide specific rationale:

C1 - Industry Relevance (20%): Direct experience in the target industry or highly adjacent sectors.
C2 - Functional Expertise (20%): Depth of expertise in the required functional area.
C3 - Leadership Scale (20%): Team size managed, P&L scope, organizational complexity.
C4 - Track Record (20%): Achievements, tenure stability, career progression.
C5 - Strategic & Cultural Fit (20%): Alignment with company stage, culture, governance.

MANDATE:
${jd}

CANDIDATE: ${name}
${cv}

Return ONLY valid JSON:
{
  "c1_industry_relevance": { "score": <0-100>, "rationale": "<1-2 sentences>" },
  "c2_functional_expertise": { "score": <0-100>, "rationale": "<1-2 sentences>" },
  "c3_leadership_scale": { "score": <0-100>, "rationale": "<1-2 sentences>" },
  "c4_track_record": { "score": <0-100>, "rationale": "<1-2 sentences>" },
  "c5_strategic_fit": { "score": <0-100>, "rationale": "<1-2 sentences>" },
  "match_reasons": ["<top match reason 1>", "<top match reason 2>", "<top match reason 3>"],
  "risk_factors": ["<risk 1>", "<risk 2>", "<risk 3>"],
  "approach_strategy": "<2-3 sentence approach strategy for engaging this candidate>"
}`;

  try {
    const response = await fetchWithTimeout('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-v4-flash',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1200,
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    }, PROVIDER_TIMEOUT_MS);

    if (!response.ok) {
      console.warn('[Score5] DeepSeek non-OK:', response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);

    const c1 = parsed.c1_industry_relevance || { score: 50, rationale: '' };
    const c2 = parsed.c2_functional_expertise || { score: 50, rationale: '' };
    const c3 = parsed.c3_leadership_scale || { score: 50, rationale: '' };
    const c4 = parsed.c4_track_record || { score: 50, rationale: '' };
    const c5 = parsed.c5_strategic_fit || { score: 50, rationale: '' };

    const composite = Math.round(
      Number(c1.score) * CRITERIA.c1_industry_relevance.weight +
      Number(c2.score) * CRITERIA.c2_functional_expertise.weight +
      Number(c3.score) * CRITERIA.c3_leadership_scale.weight +
      Number(c4.score) * CRITERIA.c4_track_record.weight +
      Number(c5.score) * CRITERIA.c5_strategic_fit.weight
    );

    return {
      candidate_name: name,
      composite_score: composite,
      dimension_scores: {
        c1_industry_relevance: Number(c1.score),
        c2_functional_expertise: Number(c2.score),
        c3_leadership_scale: Number(c3.score),
        c4_track_record: Number(c4.score),
        c5_strategic_fit: Number(c5.score),
      },
      match_reasons: Array.isArray(parsed.match_reasons) ? parsed.match_reasons : [],
      risk_factors: Array.isArray(parsed.risk_factors) ? parsed.risk_factors : [],
      approach_strategy: String(parsed.approach_strategy || ''),
      sub_scores: {
        c1_industry_relevance: { score: Number(c1.score), rationale: String(c1.rationale || '') },
        c2_functional_expertise: { score: Number(c2.score), rationale: String(c2.rationale || '') },
        c3_leadership_scale: { score: Number(c3.score), rationale: String(c3.rationale || '') },
        c4_track_record: { score: Number(c4.score), rationale: String(c4.rationale || '') },
        c5_strategic_fit: { score: Number(c5.score), rationale: String(c5.rationale || '') },
      },
    };
  } catch (e) {
    console.error('[Score5] DeepSeek error:', e);
    return null;
  }
}
