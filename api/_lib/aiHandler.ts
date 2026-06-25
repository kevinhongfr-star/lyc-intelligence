/**
 * api/_lib/aiHandler.ts
 * Server-side AI endpoints that call DeepSeek securely.
 * Prevents API key exposure in browser bundle.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from './adminAuth.js';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60000 });
    return false;
  }
  if (entry.count >= 5) return true;
  entry.count++;
  return false;
}

async function callDeepSeek(
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 0.7
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
      model: DEEPSEEK_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: 2000,
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

// ── CV Analysis ──────────────────────────────────────────────────────────────

const CV_EXTRACTION_SYSTEM = `You are an expert HR analyst specializing in executive search. Extract structured information from CVs accurately and return ONLY valid JSON. Be precise with names, dates, and facts.`;

const CV_EXTRACTION_PROMPT = `Extract the following information from this CV. Return ONLY a JSON object with these exact fields:
- name: Full name (or null if not found)
- currentTitle: Current job title (or null)
- currentCompany: Current company name (or null)
- yearsExperience: Total years of relevant experience as a number (or null)
- keySkills: Array of 5 most important skills
- education: Array of objects with {degree, institution, year} for each degree
- careerHighlights: Array of 3 bullet points summarizing career achievements
- potentialRedFlags: Array of any concerns (gaps, inconsistencies, red flags) - empty array if none

CV text:
{cvText}

Return ONLY JSON, no markdown or explanation.`;

// ── Interview Questions ───────────────────────────────────────────────────────

const INTERVIEW_QUESTIONS_SYSTEM = `You are an expert executive search consultant specializing in behavioral interviewing. Generate insightful, competency-based interview questions that reveal candidate capabilities and fit.`;

const INTERVIEW_QUESTIONS_PROMPT = `Generate 10 interview questions for this executive search mandate.

Mandate: {mandateTitle}
Industry: {industry}
Location: {location}
Seniority: {seniority}

Success Profile:
- Required experience: {requiredExperience} years
- Required industries: {requiredIndustries}
- Target DISC profile: {targetDisc}
- Key competencies: {competencies}

Generate questions for these competency areas:
1. Technical expertise (3 questions)
2. Leadership (3 questions)
3. Cultural fit (2 questions)
4. Problem-solving (2 questions)

For each question provide:
- id: unique identifier (e.g., "tech-1")
- question: The interview question text
- competencyArea: One of "Technical", "Leadership", "Cultural Fit", "Problem Solving"
- whatToListenFor: Key indicators in a good answer (2-3 bullet points)
- followUpQuestion: A probing follow-up question

Return ONLY a JSON array of questions.`;

// ── Offer Negotiation ────────────────────────────────────────────────────────

const OFFER_NEGOTIATION_SYSTEM = `You are an expert compensation analyst specializing in executive search. Provide data-driven, competitive offer suggestions based on candidate profile, market data, and mandate details.`;

const OFFER_NEGOTIATION_PROMPT = `Suggest a competitive offer for this executive candidate.

Candidate:
- Current title: {candidateTitle}
- Years experience: {yearsExperience}
- Key skills: {skills}
- Current compensation: {currentComp}

Mandate:
- Position: {mandateTitle}
- Budget range: {budgetRange}
- Seniority level: {seniority}
- Location: {location}

Market context:
{marketData}

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

// ── Handler ──────────────────────────────────────────────────────────────────

export async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  // Auth check
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  // Rate limiting
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown';
  if (isRateLimited(ip)) {
    res.status(429).json({ error: 'Rate limit exceeded' });
    return;
  }

  const pathArr = (req.query.path as string[]) || [];
  const action = pathArr[0] || '';

  try {
    if (action === 'analyze-cv') {
      const { cvText } = req.body || {};
      if (!cvText) {
        res.status(400).json({ error: 'Missing cvText' });
        return;
      }

      const result = await callDeepSeek(
        CV_EXTRACTION_SYSTEM,
        CV_EXTRACTION_PROMPT.replace('{cvText}', cvText),
        0.3
      );

      if (result.error) {
        res.status(500).json({ error: result.error });
        return;
      }

      try {
        let jsonStr = result.content?.trim() || '';
        const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || jsonStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) jsonStr = jsonMatch[1] || jsonMatch[0];

        const data = JSON.parse(jsonStr);
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
        return;
      } catch (parseError) {
        res.status(500).json({ error: 'Failed to parse CV data' });
        return;
      }
    }

    if (action === 'generate-questions') {
      const { mandate, successProfile } = req.body || {};
      if (!mandate || !successProfile) {
        res.status(400).json({ error: 'Missing mandate or successProfile' });
        return;
      }

      const competencies = (successProfile.personality_indicators || [])
        .map((p: any) => `${p.trait}: ${p.description}`)
        .join('; ');

      const result = await callDeepSeek(
        INTERVIEW_QUESTIONS_SYSTEM,
        INTERVIEW_QUESTIONS_PROMPT
          .replace('{mandateTitle}', mandate.title || 'Executive Position')
          .replace('{industry}', mandate.keywords || 'General')
          .replace('{location}', mandate.location || 'Not specified')
          .replace('{seniority}', mandate.seniority_level || 'Senior')
          .replace('{requiredExperience}', String(successProfile.required_experience_years || 10))
          .replace('{requiredIndustries}', (successProfile.required_industries || []).join(', '))
          .replace('{targetDisc}', successProfile.target_disc_profile || 'Not specified')
          .replace('{competencies}', competencies || 'General competencies'),
        0.7
      );

      if (result.error) {
        res.status(500).json({ error: result.error });
        return;
      }

      try {
        let jsonStr = result.content?.trim() || '';
        const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || jsonStr.match(/\[[\s\S]*\]/);
        if (jsonMatch) jsonStr = jsonMatch[1] || jsonMatch[0];

        const data = JSON.parse(jsonStr);
        if (!Array.isArray(data)) {
          res.status(500).json({ error: 'Invalid response format' });
          return;
        }

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
        return;
      } catch (parseError) {
        res.status(500).json({ error: 'Failed to parse generated questions' });
        return;
      }
    }

    if (action === 'negotiate-offer') {
      const { candidate, mandate, marketData } = req.body || {};
      if (!candidate || !mandate) {
        res.status(400).json({ error: 'Missing candidate or mandate' });
        return;
      }

      const marketDataSummary = marketData?.avgBaseSalary
        ? `Market data shows average base salary of $${marketData.avgBaseSalary.toLocaleString()} for similar roles (Source: ${marketData.dataSource || 'Market Research'}). Total compensation including bonuses typically ranges $${((marketData.avgTotalComp || marketData.avgBaseSalary) * 1.2).toLocaleString()}.`
        : 'No specific market data available. Use internal benchmarks and candidate expectations.';

      const currentComp = candidate.currentCompensation
        ? `Base $${candidate.currentCompensation.base?.toLocaleString() || 'Unknown'}, Bonus ${candidate.currentCompensation.bonus || 'Unknown'}%`
        : 'Not disclosed';

      const budgetRange = mandate.budgetRange
        ? `$${mandate.budgetRange.min.toLocaleString()} - $${mandate.budgetRange.max.toLocaleString()}`
        : 'Not specified';

      const result = await callDeepSeek(
        OFFER_NEGOTIATION_SYSTEM,
        OFFER_NEGOTIATION_PROMPT
          .replace('{candidateTitle}', candidate.title || 'Executive')
          .replace('{yearsExperience}', String(candidate.yearsExperience || 0))
          .replace('{skills}', (candidate.skills || []).join(', ') || 'Various')
          .replace('{currentComp}', currentComp)
          .replace('{mandateTitle}', mandate.title || 'Position')
          .replace('{budgetRange}', budgetRange)
          .replace('{seniority}', mandate.seniorityLevel || 'Senior')
          .replace('{location}', mandate.location || 'Not specified')
          .replace('{marketData}', marketDataSummary),
        0.5
      );

      if (result.error) {
        res.status(500).json({ error: result.error });
        return;
      }

      try {
        let jsonStr = result.content?.trim() || '';
        const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || jsonStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) jsonStr = jsonMatch[1] || jsonMatch[0];

        const data = JSON.parse(jsonStr);
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
        return;
      } catch (parseError) {
        res.status(500).json({ error: 'Failed to parse offer suggestion' });
        return;
      }
    }

    res.status(404).json({ error: 'Unknown action' });
  } catch (err: any) {
    console.error('[aiHandler]', err);
    res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? String(err?.message || err) : undefined,
    });
  }
}
