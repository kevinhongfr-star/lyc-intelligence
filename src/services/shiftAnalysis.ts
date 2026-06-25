// SHIFT Assessment AI Analysis Logic

import {
  SHIFTAssessmentType,
  SHIFTIntake,
  SHIFTAnalysisResult,
} from './shiftAssessmentTypes';

const API_ENDPOINT = '/api/shift/analyze';

export async function analyzeSHIFT(
  intake: SHIFTIntake,
  assessmentType: SHIFTAssessmentType
): Promise<{ result: SHIFTAnalysisResult; tokens: number }> {
  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ intake, assessmentType }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'SHIFT analysis failed');
  }

  const data = await response.json();
  return {
    result: data.result as SHIFTAnalysisResult,
    tokens: data.tokens || 0,
  };
}

// Client-side function for calling the API
export async function submitSHIFTAssessment(
  intake: SHIFTIntake,
  assessmentType: SHIFTAssessmentType,
  userId?: string
): Promise<{ result: SHIFTAnalysisResult; scoringRunId: string }> {
  const response = await fetch('/api/scoring/shift', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intake,
      assessment_type: assessmentType,
      user_id: userId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'SHIFT assessment failed');
  }

  const data = await response.json();
  return {
    result: data.analysis,
    scoringRunId: data.scoring_run_id,
  };
}