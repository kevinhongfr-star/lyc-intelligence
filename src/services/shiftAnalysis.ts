// SHIFT Assessment AI Analysis Logic

import {
  SHIFTAssessmentType,
  SHIFTIntake,
  SHIFTAnalysisResult,
  SHIFT_CONFIGS,
  getSHIFTArchetype,
  calculateSHIFTComposite,
} from './shiftAssessmentTypes';

export async function analyzeSHIFT(
  intake: SHIFTIntake,
  assessmentType: SHIFTAssessmentType
): Promise<{ result: SHIFTAnalysisResult; tokens: number }> {
  try {
    const response = await fetch('/api/scoring/shift', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intake,
        assessment_type: assessmentType,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'SHIFT analysis failed');
    }

    const data = await response.json();
    return {
      result: data.analysis,
      tokens: 0,
    };
  } catch (error) {
    console.error('[SHIFTAnalysis] Analysis failed:', error);
    
    const config = SHIFT_CONFIGS[assessmentType];
    const fallbackScores: Record<string, number> = {};
    
    for (const dim of config.dimensions) {
      const userScore = intake.dimensions[dim.id] || 5;
      fallbackScores[dim.id] = Math.round(userScore * 10);
    }
    
    const compositeScore = calculateSHIFTComposite(fallbackScores);
    const archetype = getSHIFTArchetype(fallbackScores);
    
    return {
      result: {
        dimension_scores: fallbackScores,
        strengths: [
          { strength: 'Self-awareness', evidence: 'Completed assessment with honest self-reflection' },
          { strength: 'Goal orientation', evidence: intake.goals.short_term || 'Defined clear goals' },
          { strength: 'Experience', evidence: `${intake.context.years_experience} years in ${intake.context.industry}` },
        ],
        development_areas: [
          { area: 'Deepen self-reflection', example: 'Provide more detailed evidence for dimension ratings' },
          { area: 'Expand cross-border experience', example: intake.crossBorder.cultural_experience ? 'Continue building' : 'Consider international opportunities' },
          { area: 'Strengthen measurement', example: 'Track progress on development goals systematically' },
        ],
        recommendations: [
          'Schedule regular self-reflection sessions to deepen awareness',
          'Seek feedback from peers and mentors on development areas',
          'Create a 90-day action plan for your top development priority',
        ],
        composite_score: compositeScore,
        archetype,
        confidence: 0.6,
      },
      tokens: 0,
    };
  }
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