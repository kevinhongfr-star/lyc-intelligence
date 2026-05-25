export interface CandidateInput {
  name: string;
  cv: string;
}

export interface TRIDENTResult {
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

export interface ScoringResponse {
  results: TRIDENTResult[];
}

export async function runTRIDENTScoring(
  jd: string,
  candidates: CandidateInput[],
  userId?: string
): Promise<ScoringResponse> {
  try {
    const response = await fetch('/api/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jd,
        candidates,
        userId
      })
    });

    if (!response.ok) {
      throw new Error('Scoring failed');
    }

    return await response.json();
  } catch (e) {
    console.error('[TRIDENT] Scoring error:', e);
    throw e;
  }
}

export function getTierFromScore(score: number): {
  tier: 'T1' | 'T2' | 'T3';
  label: string;
  color: string;
} {
  if (score >= 75) {
    return { tier: 'T1', label: 'Strong Primary', color: '#22C55E' };
  } else if (score >= 50) {
    return { tier: 'T2', label: 'Strong Secondary', color: '#EAB308' };
  } else {
    return { tier: 'T3', label: 'Reserve', color: '#EF4444' };
  }
}

export function formatScore(score: number): string {
  return score.toString().padStart(2, '0');
}

export function getScoreBarColor(score: number): string {
  if (score >= 75) return '#22C55E';
  if (score >= 50) return '#EAB308';
  return '#EF4444';
}

export function getCreditCost(candidateCount: number, isFirstBatch: boolean): {
  credits: number;
  description: string;
} {
  if (isFirstBatch) {
    return { credits: 0, description: 'First 3 matches free' };
  }

  if (candidateCount >= 5) {
    return { credits: 8, description: 'Batch of 5' };
  }

  return { credits: candidateCount * 2, description: `${candidateCount} matches` };
}
