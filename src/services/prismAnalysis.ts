// ── PRISM Assessment API Service ───────────────────────────────────
// Mirrors shiftAnalysis.ts pattern: POST to /api/scoring/prism

export interface PRISMAnalysisResult {
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

export interface PRISMSubmitResponse {
  success: boolean;
  analysis: PRISMAnalysisResult;
  result_id: string | null;
  assessment_type: string;
  total_tokens: number;
  duration_ms: number;
}

/**
 * Submit PRISM assessment answers for scoring.
 * POST /api/scoring/prism
 */
export async function submitPRISMAssessment(
  answers: Record<string, number | number[]>,
  context?: { role?: string; industry?: string; yearsExperience?: number },
  userId?: string
): Promise<PRISMSubmitResponse> {
  const response = await fetch('/api/scoring/prism', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers, context, user_id: userId }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PRISM scoring failed: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Fetch PRISM results by result ID.
 * GET /api/scoring/prism/result?id=<result_id>
 * (Uses assessment_results table via selectOne)
 */
export async function getPRISMResult(resultId: string): Promise<PRISMAnalysisResult | null> {
  try {
    const response = await fetch(`/api/scoring/prism/result?id=${encodeURIComponent(resultId)}`);
    if (!response.ok) return null;
    const data = await response.json();
    if (!data.success || !data.analysis) return null;
    return data.analysis;
  } catch {
    return null;
  }
}
