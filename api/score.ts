import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

// Weights are hidden from client-side - only used internally
const DIMENSION_WEIGHTS = {
  experience: 0.40,
  skills: 0.35,
  fit: 0.25
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { jd, candidates, userId } = req.body;

  if (!jd || !candidates || candidates.length === 0) {
    return res.status(400).json({ error: 'Missing JD or candidates' });
  }

  // Rate limiting check
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  if (ip) {
    const rateLimitKey = `rate_limit:${ip}`;
    // In production, check Redis or Supabase for rate limiting
    // For now, skip rate limiting in this implementation
  }

  try {
    const results: ScoreResult[] = [];

    // Process each candidate
    for (const candidate of candidates) {
      const scoreResult = await scoreCandidate(jd, candidate.cv);
      
      if (scoreResult) {
        results.push({
          candidate_name: candidate.name,
          composite_score: scoreResult.composite,
          dimension_scores: scoreResult.dimensions,
          match_reasons: scoreResult.reasons,
          risk_factors: scoreResult.risks,
          approach_strategy: scoreResult.strategy
        });
      }
    }

    // Save match history for authenticated users
    if (userId && supabase) {
      await saveMatchHistory(userId, jd, results);
    }

    return res.status(200).json({ results });
  } catch (e) {
    console.error('[Score API] Error:', e);
    return res.status(500).json({ error: 'Scoring failed' });
  }
}

async function scoreCandidate(jd: string, cv: string): Promise<ScoreResult | null> {
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

  try {
    if (DEEPSEEK_API_KEY) {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'user', content: scoringPrompt }
          ],
          max_tokens: 800,
          temperature: 0.3,
          response_format: { type: 'json_object' }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (content) {
          const parsed = JSON.parse(content);
          
          // Calculate composite score using hidden weights
          const composite = Math.round(
            parsed.experience_score * DIMENSION_WEIGHTS.experience +
            parsed.skills_score * DIMENSION_WEIGHTS.skills +
            parsed.fit_score * DIMENSION_WEIGHTS.fit
          );

          return {
            dimensions: {
              experience: parsed.experience_score,
              skills: parsed.skills_score,
              fit: parsed.fit_score
            },
            composite,
            reasons: parsed.match_reasons || [],
            risks: parsed.risk_factors || [],
            strategy: parsed.approach_strategy || ''
          };
        }
      }
    }
  } catch (e) {
    console.error('[Score] DeepSeek error:', e);
  }

  return null;
}

async function saveMatchHistory(
  userId: string,
  jd: string,
  results: ScoreResult[]
) {
  if (!supabase) return;

  try {
    await supabase.from('match_history').insert({
      user_id: userId,
      jd_text: jd.substring(0, 1000), // Store first 1000 chars
      results: results,
      candidate_count: results.length,
      average_score: results.reduce((sum, r) => sum + r.composite_score, 0) / results.length
    });
  } catch (e) {
    console.error('[Score] Failed to save history:', e);
  }
}
