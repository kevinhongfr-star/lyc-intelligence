/**
 * AI Features Handler — All new AI endpoints for EO-8
 * Routes: /api/ai/interview/*, /api/ai/cq/*, /api/ai/org/*, /api/ai/reports/*, /api/ai/analyze, /api/ai/score, /api/ai/generate
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from './adminAuth.js';
import { PROMPTS, buildPrompt } from './prompts.js';

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

async function callDeepSeek(
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 0.7,
  maxTokens: number = 2000
): Promise<{ content?: string; error?: string; usage?: any }> {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DeepSeek API key not configured');
  }

  const response = await fetch(DEEPSEEK_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-v4-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    content: data.choices?.[0]?.message?.content || '',
    usage: data.usage,
  };
}

function parseJSONResponse(content: string, res: VercelResponse) {
  try {
    let jsonStr = content.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) jsonStr = jsonMatch[1] || jsonMatch[0];
    return JSON.parse(jsonStr);
  } catch (e) {
    res.status(500).json({ error: 'Failed to parse AI response' });
    return null;
  }
}

export async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown';
  if (isRateLimited(ip)) {
    res.status(429).json({ error: 'Rate limit exceeded' });
    return;
  }

  const pathArr = (req.query.path as string[]) || [];
  const domain = pathArr[0] || '';
  const action = pathArr[1] || '';

  try {
    // ── Interview AI ──────────────────────────────────────────────────────
    if (domain === 'interview') {
      if (action === 'generate-questions') {
        const { company, role, difficulty, count = 5 } = req.body || {};
        if (!company || !role) {
          res.status(400).json({ error: 'Missing company or role' });
          return;
        }
        const prompt = buildPrompt('interview', 'generateQuestions', {
          company, role, difficulty, count: String(count),
        });
        const result = await callDeepSeek('You are an expert executive interviewer', prompt, 0.7);
        const data = parseJSONResponse(result.content || '', res);
        if (data) res.status(200).json({ success: true, data, usage: result.usage });
        return;
      }

      if (action === 'evaluate-answer') {
        const { question, answer } = req.body || {};
        if (!question || !answer) {
          res.status(400).json({ error: 'Missing question or answer' });
          return;
        }
        const prompt = buildPrompt('interview', 'evaluateAnswer', { question, answer });
        const result = await callDeepSeek('You are an expert interview evaluator', prompt, 0.3);
        const data = parseJSONResponse(result.content || '', res);
        if (data) res.status(200).json({ success: true, data, usage: result.usage });
        return;
      }

      if (action === 'generate-report') {
        const { company, role, date, sessionData } = req.body || {};
        if (!company || !role || !sessionData) {
          res.status(400).json({ error: 'Missing required parameters' });
          return;
        }
        const prompt = buildPrompt('interview', 'generateReport', {
          company, role, date: date || new Date().toISOString(),
          sessionData: JSON.stringify(sessionData),
        });
        const result = await callDeepSeek('You are an expert interview report writer', prompt, 0.5);
        const data = parseJSONResponse(result.content || '', res);
        if (data) res.status(200).json({ success: true, data, usage: result.usage });
        return;
      }
    }

    // ── CQ Intelligence ──────────────────────────────────────────────────
    if (domain === 'cq') {
      if (action === 'assess') {
        const { targetCulture, targetRole } = req.body || {};
        if (!targetCulture || !targetRole) {
          res.status(400).json({ error: 'Missing targetCulture or targetRole' });
          return;
        }
        const prompt = buildPrompt('cq', 'assess', { targetCulture, targetRole });
        const result = await callDeepSeek('You are a cross-cultural leadership expert', prompt, 0.7);
        const data = parseJSONResponse(result.content || '', res);
        if (data) res.status(200).json({ success: true, data, usage: result.usage });
        return;
      }

      if (action === 'evaluate') {
        const { role, culture, experience, responses } = req.body || {};
        if (!role || !responses) {
          res.status(400).json({ error: 'Missing role or responses' });
          return;
        }
        const prompt = buildPrompt('cq', 'evaluate', {
          role, culture: culture || 'Not specified', experience: experience || 'None',
          responses: JSON.stringify(responses),
        });
        const result = await callDeepSeek('You are a cross-cultural leadership expert', prompt, 0.3);
        const data = parseJSONResponse(result.content || '', res);
        if (data) res.status(200).json({ success: true, data, usage: result.usage });
        return;
      }

      if (action === 'invisible-rules') {
        const { targetCulture, targetRole } = req.body || {};
        if (!targetCulture || !targetRole) {
          res.status(400).json({ error: 'Missing targetCulture or targetRole' });
          return;
        }
        const prompt = buildPrompt('cq', 'invisibleRules', { targetCulture, targetRole });
        const result = await callDeepSeek('You are an expert in cultural business norms', prompt, 0.6);
        const data = parseJSONResponse(result.content || '', res);
        if (data) res.status(200).json({ success: true, data, usage: result.usage });
        return;
      }

      if (action === 'blind-spots') {
        const { scores, selfReported } = req.body || {};
        if (!scores) {
          res.status(400).json({ error: 'Missing scores' });
          return;
        }
        const prompt = buildPrompt('cq', 'blindSpots', {
          scores: JSON.stringify(scores),
          selfReported: JSON.stringify(selfReported || []),
        });
        const result = await callDeepSeek('You are a cross-cultural assessment expert', prompt, 0.4);
        const data = parseJSONResponse(result.content || '', res);
        if (data) res.status(200).json({ success: true, data, usage: result.usage });
        return;
      }
    }

    // ── Org Health ───────────────────────────────────────────────────────
    if (domain === 'org') {
      if (action === 'health-score') {
        const { companyName, industry, employeeCount, turnoverRate, engagementScore, avgTenure, promotionRate, criticalRoleCoverage } = req.body || {};
        if (!companyName) {
          res.status(400).json({ error: 'Missing companyName' });
          return;
        }
        const prompt = buildPrompt('org', 'healthScore', {
          companyName,
          industry: industry || 'Not specified',
          employeeCount: employeeCount || 'Unknown',
          turnoverRate: turnoverRate || 0,
          engagementScore: engagementScore || 0,
          avgTenure: avgTenure || 0,
          promotionRate: promotionRate || 0,
          criticalRoleCoverage: criticalRoleCoverage || 0,
        });
        const result = await callDeepSeek('You are an organizational health expert', prompt, 0.3);
        const data = parseJSONResponse(result.content || '', res);
        if (data) res.status(200).json({ success: true, data, usage: result.usage });
        return;
      }

      if (action === 'risk-analysis') {
        const { companyData } = req.body || {};
        if (!companyData) {
          res.status(400).json({ error: 'Missing companyData' });
          return;
        }
        const prompt = buildPrompt('org', 'riskAnalysis', { companyData: JSON.stringify(companyData) });
        const result = await callDeepSeek('You are a corporate risk analyst', prompt, 0.4);
        const data = parseJSONResponse(result.content || '', res);
        if (data) res.status(200).json({ success: true, data, usage: result.usage });
        return;
      }

      if (action === 'benchmark') {
        const { company, industry, companyMetrics } = req.body || {};
        if (!company || !companyMetrics) {
          res.status(400).json({ error: 'Missing company or companyMetrics' });
          return;
        }
        const prompt = buildPrompt('org', 'benchmark', {
          company,
          industry: industry || 'Not specified',
          companyMetrics: JSON.stringify(companyMetrics),
        });
        const result = await callDeepSeek('You are a benchmarking expert', prompt, 0.3);
        const data = parseJSONResponse(result.content || '', res);
        if (data) res.status(200).json({ success: true, data, usage: result.usage });
        return;
      }
    }

    // ── Reports ──────────────────────────────────────────────────────────
    if (domain === 'reports') {
      if (action === 'talent-deep-dive') {
        const { candidateName, currentRole, yearsExperience, assessmentData, interviewFeedback, resumeHighlights } = req.body || {};
        if (!candidateName) {
          res.status(400).json({ error: 'Missing candidateName' });
          return;
        }
        const prompt = buildPrompt('reports', 'talentDeepDive', {
          candidateName,
          currentRole: currentRole || 'Unknown',
          yearsExperience: yearsExperience || 'Unknown',
          assessmentData: JSON.stringify(assessmentData || {}),
          interviewFeedback: interviewFeedback || 'None',
          resumeHighlights: resumeHighlights || 'None',
        });
        const result = await callDeepSeek('You are an executive search expert', prompt, 0.5, 3000);
        const data = parseJSONResponse(result.content || '', res);
        if (data) res.status(200).json({ success: true, data, usage: result.usage });
        return;
      }

      if (action === 'lens-report') {
        const { candidateName, tridentScores, assessmentResults } = req.body || {};
        if (!candidateName) {
          res.status(400).json({ error: 'Missing candidateName' });
          return;
        }
        const prompt = buildPrompt('reports', 'lensReport', {
          candidateName,
          tridentScores: JSON.stringify(tridentScores || {}),
          assessmentResults: JSON.stringify(assessmentResults || {}),
        });
        const result = await callDeepSeek('You are a leadership assessment expert', prompt, 0.3);
        const data = parseJSONResponse(result.content || '', res);
        if (data) res.status(200).json({ success: true, data, usage: result.usage });
        return;
      }

      if (action === 'org-health-report') {
        const { company, healthScores, riskAnalysis, recommendations } = req.body || {};
        if (!company) {
          res.status(400).json({ error: 'Missing company' });
          return;
        }
        const prompt = buildPrompt('reports', 'orgHealthReport', {
          company,
          healthScores: JSON.stringify(healthScores || {}),
          riskAnalysis: riskAnalysis || 'None',
          recommendations: JSON.stringify(recommendations || []),
        });
        const result = await callDeepSeek('You are an organizational health expert', prompt, 0.4, 2500);
        const data = parseJSONResponse(result.content || '', res);
        if (data) res.status(200).json({ success: true, data, usage: result.usage });
        return;
      }
    }

    // ── Legacy AI Endpoints (from aiHandler) ──────────────────────────
    if (domain === 'analyze-cv') {
      const { cvText } = req.body || {};
      if (!cvText) {
        res.status(400).json({ error: 'Missing cvText' });
        return;
      }
      const prompt = buildPrompt('analyze', 'cv', { cvText });
      const result = await callDeepSeek('You are an expert HR analyst specializing in executive search', prompt, 0.3);
      const data = parseJSONResponse(result.content || '', res);
      if (data) {
        res.status(200).json({
          success: true,
          data: {
            name: data.name || null,
            currentTitle: data.currentTitle || null,
            currentCompany: data.currentCompany || null,
            yearsExperience: typeof data.yearsExperience === 'number' ? data.yearsExperience : null,
            keySkills: Array.isArray(data.keySkills) ? data.keySkills.slice(0, 10) : [],
            education: Array.isArray(data.education) ? data.education : [],
            careerHighlights: Array.isArray(data.careerHighlights) ? data.careerHighlights.slice(0, 5) : [],
            potentialRedFlags: Array.isArray(data.potentialRedFlags) ? data.potentialRedFlags : [],
          },
          usage: result.usage,
        });
      }
      return;
    }

    if (domain === 'generate-questions') {
      const { mandate, successProfile } = req.body || {};
      if (!mandate || !successProfile) {
        res.status(400).json({ error: 'Missing mandate or successProfile' });
        return;
      }

      const competencies = (successProfile.personality_indicators || [])
        .map((p: any) => `${p.trait}: ${p.description}`)
        .join('; ');

      const prompt = `Generate 10 interview questions for this executive search mandate.

Mandate: ${mandate.title || 'Executive Position'}
Industry: ${mandate.keywords || 'General'}
Location: ${mandate.location || 'Not specified'}
Seniority: ${mandate.seniority_level || 'Senior'}

Success Profile:
- Required experience: ${successProfile.required_experience_years || 10} years
- Required industries: ${(successProfile.required_industries || []).join(', ')}
- Target DISC profile: ${successProfile.target_disc_profile || 'Not specified'}
- Key competencies: ${competencies || 'General competencies'}

Generate questions for these competency areas:
1. Technical expertise (3 questions)
2. Leadership (3 questions)
3. Cultural fit (2 questions)
4. Problem-solving (2 questions)

For each question provide:
- id: unique identifier
- question: The interview question text
- competencyArea: One of "Technical", "Leadership", "Cultural Fit", "Problem Solving"
- whatToListenFor: Key indicators in a good answer
- followUpQuestion: A probing follow-up question

Return ONLY a JSON array.`;

      const result = await callDeepSeek('You are an expert executive search consultant', prompt, 0.7);
      const data = parseJSONResponse(result.content || '', res);
      if (data && Array.isArray(data)) {
        res.status(200).json({
          success: true,
          data: data.map((q: any, idx: number) => ({
            id: q.id || `generated-${idx + 1}`,
            question: q.question || '',
            competencyArea: q.competencyArea || 'General',
            whatToListenFor: q.whatToListenFor || '',
            followUpQuestion: q.followUpQuestion || '',
          })),
          usage: result.usage,
        });
      }
      return;
    }

    if (domain === 'negotiate-offer') {
      const { candidate, mandate, marketData } = req.body || {};
      if (!candidate || !mandate) {
        res.status(400).json({ error: 'Missing candidate or mandate' });
        return;
      }

      const marketDataSummary = marketData?.avgBaseSalary
        ? `Market data shows average base salary of $${marketData.avgBaseSalary.toLocaleString()} for similar roles.`
        : 'No specific market data available.';

      const currentComp = candidate.currentCompensation
        ? `Base $${candidate.currentCompensation.base?.toLocaleString() || 'Unknown'}, Bonus ${candidate.currentCompensation.bonus || 'Unknown'}%`
        : 'Not disclosed';

      const budgetRange = mandate.budgetRange
        ? `$${mandate.budgetRange.min.toLocaleString()} - $${mandate.budgetRange.max.toLocaleString()}`
        : 'Not specified';

      const prompt = `Suggest a competitive offer for this executive candidate.

Candidate:
- Current title: ${candidate.title || 'Executive'}
- Years experience: ${candidate.yearsExperience || 0}
- Key skills: ${(candidate.skills || []).join(', ') || 'Various'}
- Current compensation: ${currentComp}

Mandate:
- Position: ${mandate.title || 'Position'}
- Budget range: ${budgetRange}
- Seniority level: ${mandate.seniorityLevel || 'Senior'}
- Location: ${mandate.location || 'Not specified'}

Market context:
${marketDataSummary}

Provide a suggestion with this JSON structure:
{
  "baseSalaryRange": { "min": number, "max": number, "recommended": number },
  "bonusStructure": { "percentage": number, "amount": number },
  "equity": { "type": "rsu" | "option" | "none", "value": string },
  "benefits": [list of benefit suggestions],
  "negotiationStrategy": "How to present and negotiate this offer",
  "rationale": "Why this offer is appropriate"
}

Return ONLY JSON.`;

      const result = await callDeepSeek('You are an expert compensation analyst', prompt, 0.5);
      const data = parseJSONResponse(result.content || '', res);
      if (data) {
        res.status(200).json({
          success: true,
          data: {
            baseSalaryRange: data.baseSalaryRange || { min: 0, max: 0, recommended: 0 },
            bonusStructure: data.bonusStructure || { percentage: 0, amount: 0 },
            equity: data.equity || { type: 'none', value: '' },
            benefits: Array.isArray(data.benefits) ? data.benefits : [],
            negotiationStrategy: data.negotiationStrategy || '',
            rationale: data.rationale || '',
          },
          usage: result.usage,
        });
      }
      return;
    }

    // ── General AI ──────────────────────────────────────────────────────
    if (domain === 'analyze') {
      const { inputData, task } = req.body || {};
      if (!inputData || !task) {
        res.status(400).json({ error: 'Missing inputData or task' });
        return;
      }
      const prompt = buildPrompt('analyze', 'general', {
        inputData: JSON.stringify(inputData),
        task,
      });
      const result = await callDeepSeek('You are an analytical assistant', prompt, 0.5);
      const data = parseJSONResponse(result.content || '', res);
      if (data) res.status(200).json({ success: true, data, usage: result.usage });
      return;
    }

    if (domain === 'score') {
      const { item, criteria } = req.body || {};
      if (!item || !criteria) {
        res.status(400).json({ error: 'Missing item or criteria' });
        return;
      }
      const prompt = buildPrompt('analyze', 'score', {
        item: JSON.stringify(item),
        criteria: JSON.stringify(criteria),
      });
      const result = await callDeepSeek('You are a scoring expert', prompt, 0.2);
      const data = parseJSONResponse(result.content || '', res);
      if (data) res.status(200).json({ success: true, data, usage: result.usage });
      return;
    }

    if (domain === 'generate') {
      const { prompt: userPrompt, systemPrompt = 'You are a helpful assistant', temperature = 0.7 } = req.body || {};
      if (!userPrompt) {
        res.status(400).json({ error: 'Missing prompt' });
        return;
      }
      const result = await callDeepSeek(systemPrompt, userPrompt, temperature, 3000);
      res.status(200).json({ success: true, content: result.content, usage: result.usage });
      return;
    }

    res.status(404).json({ error: 'Unknown AI endpoint' });
  } catch (err: any) {
    console.error('[aiFeaturesHandler]', err);
    res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? String(err?.message || err) : undefined,
    });
  }
}
