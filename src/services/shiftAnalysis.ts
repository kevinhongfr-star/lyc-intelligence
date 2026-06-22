// SHIFT Assessment AI Analysis Logic

import {
  SHIFTAssessmentType,
  SHIFTIntake,
  SHIFTAnalysisResult,
  SHIFT_CONFIGS,
  getSHIFTArchetype,
  calculateSHIFTComposite,
} from './shiftAssessmentTypes';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/v1/chat/completions';

interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    total_tokens: number;
  };
}

function buildSHIFTAnalysisPrompt(intake: SHIFTIntake, assessmentType: SHIFTAssessmentType): string {
  const config = SHIFT_CONFIGS[assessmentType];
  
  return `You are a leadership development expert specializing in SHIFT assessments for LYC Intelligence. 
Analyze this ${config.name} (${assessmentType}) assessment:

USER PROFILE:
- Role: ${intake.context.role}
- Industry: ${intake.context.industry}
- Experience: ${intake.context.years_experience} years
- Current challenges: ${intake.context.challenges}
- Improvement goals: ${intake.context.improvement_goals}

ASSESSMENT DIMENSIONS AND RESPONSES:
${config.dimensions.map(dim => {
  const score = intake.dimensions[dim.id] || 5;
  const evidence = intake.evidence[dim.id] || 'No evidence provided';
  return `
${dim.name} (Score: ${score}/10)
- Question: ${dim.question}
- User Response: ${evidence}`;
}).join('\n')}

CROSS-BORDER CONTEXT:
- Cultural experience: ${intake.crossBorder.cultural_experience ? 'Yes' : 'No'}
- International teams managed: ${intake.crossBorder.international_teams}
- Global projects: ${intake.crossBorder.global_projects}

WORK STYLE:
- DISC profile: ${intake.style.disc_profile || 'Not specified'}
- Work style: ${intake.style.work_style}

GOALS:
- Short-term (6 months): ${intake.goals.short_term}
- Long-term (2 years): ${intake.goals.long_term}
- Success definition: ${intake.goals.success_definition}

Provide a comprehensive analysis including:
1. Dimension scores (0-100) for each ${assessmentType} dimension based on user responses
2. Top 3 strengths with evidence from their responses
3. Top 3 development areas with specific examples
4. 3 actionable recommendations for improvement

Return ONLY this JSON (no markdown, no code fences, no prose):
{
  "dimension_scores": { "${config.dimensions[0].id}": <0-100>, "${config.dimensions[1].id}": <0-100>, ... },
  "strengths": [
    { "strength": "<strength name>", "evidence": "<evidence from user responses>" },
    { "strength": "<strength name>", "evidence": "<evidence from user responses>" },
    { "strength": "<strength name>", "evidence": "<evidence from user responses>" }
  ],
  "development_areas": [
    { "area": "<development area>", "example": "<specific example from responses>" },
    { "area": "<development area>", "example": "<specific example from responses>" },
    { "area": "<development area>", "example": "<specific example from responses>" }
  ],
  "recommendations": [
    "<actionable recommendation 1>",
    "<actionable recommendation 2>",
    "<actionable recommendation 3>"
  ],
  "archetype": "<suggested archetype name>",
  "confidence": <0.0-1.0>
}`;
}

async function callDeepSeek(prompt: string): Promise<{ content: string; tokens: number }> {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY not configured');
  }

  const response = await fetch(DEEPSEEK_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'You are a leadership development expert. Always respond with valid JSON only, no markdown or prose.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 2048,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
  }

  const data: DeepSeekResponse = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  const tokens = data.usage?.total_tokens || 0;

  return { content, tokens };
}

function parseAnalysisResponse(raw: string): SHIFTAnalysisResult {
  let text = raw.trim();
  
  // Remove markdown code fences if present
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();

  try {
    const parsed = JSON.parse(text);
    
    // Validate and normalize dimension scores (0-100)
    const dimensionScores: Record<string, number> = {};
    for (const [key, value] of Object.entries(parsed.dimension_scores || {})) {
      const score = Math.round(Number(value));
      dimensionScores[key] = Math.max(0, Math.min(100, score));
    }

    // Validate strengths
    const strengths = Array.isArray(parsed.strengths)
      ? parsed.strengths.slice(0, 3).map((s: any) => ({
          strength: String(s.strength || '').slice(0, 200),
          evidence: String(s.evidence || '').slice(0, 500),
        }))
      : [];

    // Validate development areas
    const developmentAreas = Array.isArray(parsed.development_areas)
      ? parsed.development_areas.slice(0, 3).map((d: any) => ({
          area: String(d.area || '').slice(0, 200),
          example: String(d.example || '').slice(0, 500),
        }))
      : [];

    // Validate recommendations
    const recommendations = Array.isArray(parsed.recommendations)
      ? parsed.recommendations.slice(0, 3).map((r: any) => String(r).slice(0, 500))
      : [];

    // Calculate composite score
    const compositeScore = calculateSHIFTComposite(dimensionScores);

    // Get archetype
    const archetype = parsed.archetype || getSHIFTArchetype(dimensionScores);

    // Confidence
    const confidence = Math.max(0, Math.min(1, Number(parsed.confidence) || 0.85));

    return {
      dimension_scores: dimensionScores,
      strengths,
      development_areas: developmentAreas,
      recommendations,
      composite_score: compositeScore,
      archetype,
      confidence,
    };
  } catch (e) {
    console.error('[SHIFTAnalysis] JSON parse error:', e);
    throw new Error(`Failed to parse analysis response: ${raw.slice(0, 200)}`);
  }
}

export async function analyzeSHIFT(
  intake: SHIFTIntake,
  assessmentType: SHIFTAssessmentType
): Promise<{ result: SHIFTAnalysisResult; tokens: number }> {
  const prompt = buildSHIFTAnalysisPrompt(intake, assessmentType);
  
  try {
    const { content, tokens } = await callDeepSeek(prompt);
    const result = parseAnalysisResponse(content);
    
    return { result, tokens };
  } catch (error) {
    console.error('[SHIFTAnalysis] Analysis failed:', error);
    
    // Return fallback result based on user inputs
    const config = SHIFT_CONFIGS[assessmentType];
    const fallbackScores: Record<string, number> = {};
    
    for (const dim of config.dimensions) {
      const userScore = intake.dimensions[dim.id] || 5;
      fallbackScores[dim.id] = Math.round(userScore * 10); // Convert 1-10 to 0-100
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