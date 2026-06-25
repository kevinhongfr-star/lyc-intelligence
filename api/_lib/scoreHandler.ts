import type { VercelRequest, VercelResponse } from '@vercel/node';
import { insert, isSupabaseConfigured, handleError } from './supabaseRest.js';
import { getUserFromRequest } from './adminAuth.js';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';

// Vercel Hobby default is 10s; multi-candidate scoring can run 5-20s.
export const maxDuration = 60;

const PROVIDER_TIMEOUT_MS = 7000;

async function fetchWithTimeout(url: string, options: any, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

const DIMENSION_WEIGHTS = {
  experience: 0.40,
  skills: 0.35,
  fit: 0.25,
};

interface CandidateInput {
  name: string;
  cv: string;
}

interface ScoreResult {
  candidate_name: string;
  composite_score: number;
  dimension_scores: {
    experience: number;
    skills: number;
    fit: number;
  };
  match_reasons: string[];
  risk_factors: string[];
  approach_strategy: string;
}

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return false;
  }
  if (entry.count >= limit) return true;
  entry.count++;
  return false;
}

export async function handleScore(req: VercelRequest, res: VercelResponse) {
  // Auth check
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(ip, 10, 60 * 1000)) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { jd, candidates, userId } = req.body;

    if (!jd || !candidates || candidates.length === 0) {
      return res.status(400).json({ error: 'Missing JD or candidates' });
    }

    const results: ScoreResult[] = [];
    for (const candidate of candidates as CandidateInput[]) {
      const scoreResult = await scoreCandidate(jd, candidate.cv);
      if (scoreResult) {
        results.push({
          candidate_name: candidate.name,
          composite_score: scoreResult.composite,
          dimension_scores: scoreResult.dimensions,
          match_reasons: scoreResult.reasons,
          risk_factors: scoreResult.risks,
          approach_strategy: scoreResult.strategy,
        });
      }
    }

    // Save match history for authenticated users (best-effort)
    if (userId && isSupabaseConfigured()) {
      try {
        await insert('match_history', {
          user_id: userId,
          jd_text: jd.substring(0, 1000),
          results,
          candidate_count: results.length,
          average_score: results.length > 0
            ? results.reduce((sum, r) => sum + r.composite_score, 0) / results.length
            : 0,
        });
      } catch (e) {
        console.error('[Score] Failed to save history:', e);
      }
    }

    return res.status(200).json({ results });
  } catch (err) {
    return handleError(res, 'score', err);
  }
}

interface InternalScore {
  dimensions: { experience: number; skills: number; fit: number };
  composite: number;
  reasons: string[];
  risks: string[];
  strategy: string;
}

async function scoreCandidate(jd: string, cv: string): Promise<InternalScore | null> {
  const scoringPrompt = `Score this candidate against the job description across three dimensions:

Experience (40%): Relevant years, role seniority, industry context, functional alignment
Skills (35%): Technical capabilities, leadership competencies, language requirements
Organizational Fit (25%): Cultural alignment, team structure fit, reporting line suitability

Return a composite score (0-100) and dimension scores. Provide specific match reasons,
identify 2-3 risk factors, and suggest an approach strategy for recruiting this candidate.

Job Description: ${jd}
Candidate CV: ${cv}

Return ONLY valid JSON in this format:
{
  "experience_score": number (0-100),
  "skills_score": number (0-100),
  "fit_score": number (0-100),
  "match_reasons": ["reason 1", "reason 2", "reason 3"],
  "risk_factors": ["risk 1", "risk 2"],
  "approach_strategy": "strategy text"
}`;

  if (!DEEPSEEK_API_KEY) {
    console.warn('[Score] DEEPSEEK_API_KEY missing — cannot score');
    return null;
  }

  try {
    const response = await fetchWithTimeout('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: scoringPrompt }],
        max_tokens: 800,
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    }, PROVIDER_TIMEOUT_MS);

    if (!response.ok) {
      console.warn('[Score] DeepSeek non-OK:', response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    const composite = Math.round(
      (Number(parsed.experience_score) || 0) * DIMENSION_WEIGHTS.experience +
      (Number(parsed.skills_score) || 0) * DIMENSION_WEIGHTS.skills +
      (Number(parsed.fit_score) || 0) * DIMENSION_WEIGHTS.fit
    );

    return {
      dimensions: {
        experience: Number(parsed.experience_score) || 0,
        skills: Number(parsed.skills_score) || 0,
        fit: Number(parsed.fit_score) || 0,
      },
      composite,
      reasons: Array.isArray(parsed.match_reasons) ? parsed.match_reasons : [],
      risks: Array.isArray(parsed.risk_factors) ? parsed.risk_factors : [],
      strategy: String(parsed.approach_strategy || ''),
    };
  } catch (e) {
    console.error('[Score] DeepSeek error:', e);
    return null;
  }
}
