/**
 * Server-side API route for Coze benchmark workflow.
 * Handles Coze API calls securely on the server.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from '../_lib/adminAuth.js';

const COZE_API_KEY = process.env.COZE_API_KEY || '';
const COZE_WORKFLOW_ID = process.env.COZE_BENCHMARK_WORKFLOW_ID || 'benchmark_scoring';

interface CozeBenchmarkInput {
  assessment_type: string;
  team_scores: Array<{
    user_id: string;
    dimension_scores: Record<string, number>;
  }>;
  peer_scores: Array<{
    dimension_scores: Record<string, number>;
  }>;
  peer_sample_size: number;
}

interface CozeBenchmarkOutput {
  insights: string[];
  recommendations: string[];
  team_strengths: string[];
  team_gaps: string[];
}

function generateDefaultInsights(input: CozeBenchmarkInput): CozeBenchmarkOutput {
  const teamAvg: Record<string, number> = {};
  const peerAvg: Record<string, number> = {};

  const dimensions = Object.keys(input.team_scores[0]?.dimension_scores || {});

  for (const dim of dimensions) {
    const teamScores = input.team_scores.map(s => s.dimension_scores[dim] || 0);
    const peerScores = input.peer_scores.map(s => s.dimension_scores[dim] || 0);

    teamAvg[dim] = Math.round(teamScores.reduce((a, b) => a + b, 0) / teamScores.length);
    peerAvg[dim] = Math.round(peerScores.reduce((a, b) => a + b, 0) / peerScores.length);
  }

  const strengths: string[] = [];
  const gaps: string[] = [];
  const insights: string[] = [];

  for (const dim of dimensions) {
    const diff = teamAvg[dim] - peerAvg[dim];
    if (diff >= 10) {
      const label = dim.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      strengths.push(label);
      insights.push(`Your team scores ${diff}% above peer average in ${label}`);
    } else if (diff <= -10) {
      const label = dim.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      gaps.push(label);
      insights.push(`${label} is ${Math.abs(diff)}% below peer average`);
    }
  }

  const recommendations: string[] = [];
  if (gaps.length > 0) {
    recommendations.push(`Invest in ${gaps[0].toLowerCase()} coaching workshops`);
  }
  if (strengths.length > 0) {
    recommendations.push(`Leverage ${strengths[0].toLowerCase()} strength in client-facing roles`);
  }

  return {
    insights: insights.length > 0 ? insights : ['Team performance is within peer range'],
    recommendations: recommendations.length > 0 ? recommendations : ['Continue current development programs'],
    team_strengths: strengths.length > 0 ? strengths : ['Consistent performance'],
    team_gaps: gaps.length > 0 ? gaps : ['No significant gaps identified'],
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Auth check
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const input: CozeBenchmarkInput = req.body;

    if (!input.assessment_type || !input.team_scores) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!COZE_API_KEY) {
      // Return default insights if no API key
      return res.status(200).json(generateDefaultInsights(input));
    }

    try {
      const response = await fetch('https://api.coze.com/v1/workflow/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${COZE_API_KEY}`,
        },
        body: JSON.stringify({
          workflow_id: COZE_WORKFLOW_ID,
          parameters: input,
        }),
      });

      if (!response.ok) {
        console.warn('Coze workflow call failed:', response.status);
        return res.status(200).json(generateDefaultInsights(input));
      }

      const data = await response.json();
      return res.status(200).json(data.data || generateDefaultInsights(input));
    } catch (err) {
      console.warn('Coze workflow error:', err);
      return res.status(200).json(generateDefaultInsights(input));
    }
  } catch (err: any) {
    console.error('[Coze Benchmark API]', err);
    return res.status(500).json({ error: err.message || 'Benchmark failed' });
  }
}
