// ── SPARK Assessment API Service ───────────────────────────────────
// Mirrors prismAnalysis.ts pattern: POST to /api/scoring/spark

export interface SPARKAnalysisResult {
  dimension_scores: Record<string, number>;
  composite_score: number;
  archetype: string;
  archetype_description: string;
  archetype_traits: string[];
  strengths: Array<{ title: string; text: string; type: 'strength' }>;
  gaps: Array<{ title: string; text: string; type: 'gap' }>;
  development_actions: Array<{ priority: number; dimension: string; action: string; timeline: string }>;
  confidence: number;
}

export interface SPARKSubmitResponse {
  success: boolean;
  analysis: SPARKAnalysisResult;
  result_id: string | null;
  assessment_type: string;
  total_tokens: number;
  duration_ms: number;
}

/**
 * Submit SPARK assessment answers for scoring.
 * POST /api/scoring/spark
 */
export async function submitSPARKAssessment(
  answers: Record<string, number | number[]>,
  context?: { role?: string; industry?: string; yearsExperience?: number },
  userId?: string
): Promise<SPARKSubmitResponse> {
  const response = await fetch('/api/scoring/spark', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers, context, user_id: userId }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SPARK scoring failed: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Fetch SPARK results by result ID.
 * GET /api/scoring/spark/result?id=<result_id>
 */
export async function getSPARKResult(resultId: string): Promise<SPARKAnalysisResult | null> {
  try {
    const response = await fetch(`/api/scoring/spark/result?id=${encodeURIComponent(resultId)}`);
    if (!response.ok) return null;
    const data = await response.json();
    if (!data.success || !data.analysis) return null;
    return data.analysis;
  } catch {
    return null;
  }
}
