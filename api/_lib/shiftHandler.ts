/**
 * SHIFT assessment analysis handler — DeepSeek API calls.
 * Moved from api/shift/analyze.ts into /api/x/ dispatcher.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/v1/chat/completions';

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60000 });
    return false;
  }
  if (entry.count >= 10) return true;
  entry.count++;
  return false;
}

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

interface SHIFTAnalysisInput {
  intake: any;
  assessmentType: string;
}

function buildSHIFTAnalysisPrompt(intake: any, assessmentType: string): string {
  const config: any = {
    SHIFT_LEAP: {
      name: 'SHIFT LEAP',
      dimensions: [
        { id: 'strategic_thinking', name: 'Strategic Thinking', question: 'Describe a strategic decision you made that significantly impacted your organization.' },
        { id: 'execution', name: 'Execution', question: 'Tell me about a time you delivered results under pressure.' },
        { id: 'learning_agility', name: 'Learning Agility', question: 'Describe how you adapted to a major change in your environment.' },
        { id: 'leadership_presence', name: 'Leadership Presence', question: 'How do you build credibility with senior stakeholders?' },
        { id: 'change_navigation', name: 'Change Navigation', question: 'Describe a complex change you led or navigated.' },
      ],
    },
    SHIFT_QUEST: {
      name: 'SHIFT QUEST',
      dimensions: [
        { id: 'analytical_depth', name: 'Analytical Depth', question: 'Describe your approach to solving complex problems.' },
        { id: 'problem_solving', name: 'Problem Solving', question: 'Tell me about a challenging problem you solved.' },
        { id: 'decision_quality', name: 'Decision Quality', question: 'Describe a difficult decision and how you made it.' },
        { id: 'innovation', name: 'Innovation', question: 'How have you driven innovation in your role?' },
        { id: 'collaboration', name: 'Collaboration', question: 'Describe your approach to working with others.' },
      ],
    },
  };

  const config_data = config[assessmentType as keyof typeof config] || config.SHIFT_LEAP;

  return `You are a leadership development expert specializing in SHIFT assessments for LYC Intelligence.
Analyze this ${config_data.name} assessment:

USER PROFILE:
- Role: ${intake.context?.role || 'Not specified'}
- Industry: ${intake.context?.industry || 'Not specified'}
- Experience: ${intake.context?.years_experience || 0} years
- Current challenges: ${intake.context?.challenges || 'Not specified'}
- Improvement goals: ${intake.context?.improvement_goals || 'Not specified'}

ASSESSMENT DIMENSIONS AND RESPONSES:
${config_data.dimensions.map((dim: any) => {
  const score = intake.dimensions?.[dim.id] || 5;
  const evidence = intake.evidence?.[dim.id] || 'No evidence provided';
  return `
${dim.name} (Score: ${score}/10)
- Question: ${dim.question}
- User Response: ${evidence}`;
}).join('\n')}

Provide a comprehensive analysis including:
1. Dimension scores (0-100) for each dimension based on user responses
2. Top 3 strengths with evidence from their responses
3. Top 3 development areas with specific examples
4. 3 actionable recommendations for improvement

Return ONLY this JSON (no markdown, no code fences):
{
  "dimension_scores": { "${config_data.dimensions[0].id}": 75, "${config_data.dimensions[1].id}": 80 },
  "strengths": [
    { "strength": "<strength name>", "evidence": "<evidence>" }
  ],
  "development_areas": [
    { "area": "<area>", "example": "<example>" }
  ],
  "recommendations": ["<recommendation 1>", "<recommendation 2>", "<recommendation 3>"],
  "archetype": "<archetype name>",
  "confidence": 0.85
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
        { role: 'system', content: 'You are a leadership development expert. Always respond with valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 2048,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API error: ${response.status}`);
  }

  const data: DeepSeekResponse = await response.json();
  return { content: data.choices?.[0]?.message?.content || '', tokens: data.usage?.total_tokens || 0 };
}

export async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown';
  if (isRateLimited(ip)) {
    res.status(429).json({ error: 'Rate limit exceeded' });
    return;
  }

  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { intake, assessmentType }: SHIFTAnalysisInput = req.body;

    if (!intake || !assessmentType) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const prompt = buildSHIFTAnalysisPrompt(intake, assessmentType);
    const { content, tokens } = await callDeepSeek(prompt);

    let result: any;
    try {
      result = JSON.parse(content);
    } catch {
      result = {
        dimension_scores: { strategic_thinking: 70, execution: 70, learning_agility: 70, leadership_presence: 70, change_navigation: 70 },
        strengths: [{ strength: 'Self-awareness', evidence: 'Completed assessment' }],
        development_areas: [{ area: 'Deep reflection', example: 'Provide more detail' }],
        recommendations: ['Schedule reflection sessions', 'Seek feedback', 'Create action plan'],
        archetype: 'Balanced Leader',
        confidence: 0.6,
      };
    }

    res.status(200).json({ result, tokens });
    return;
  } catch (err: any) {
    console.error('[shiftHandler]', err);
    res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? String(err?.message || err) : undefined,
    });
    return;
  }
}
