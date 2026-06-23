// Phase 6.4: AI Service - DeepSeek API Integration
// AI-Assisted Features

import type { SupabaseClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface DeepSeekResponse {
  success: boolean;
  content?: string;
  error?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface CVExtractedData {
  name: string | null;
  currentTitle: string | null;
  currentCompany: string | null;
  yearsExperience: number | null;
  keySkills: string[];
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  careerHighlights: string[];
  potentialRedFlags: string[];
}

export interface InterviewQuestion {
  id: string;
  question: string;
  competencyArea: string;
  whatToListenFor: string;
  followUpQuestion: string;
}

export interface OfferSuggestion {
  baseSalaryRange: {
    min: number;
    max: number;
    recommended: number;
  };
  bonusStructure: {
    percentage: number;
    amount: number;
  };
  equity: {
    type: 'rsu' | 'option' | 'none';
    value?: string;
  };
  benefits: string[];
  negotiationStrategy: string;
  rationale: string;
}

// ═══════════════════════════════════════════════════════════════
// DEEPSEEK API
// ═══════════════════════════════════════════════════════════════

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';

function getDeepSeekApiKey(): string {
  return import.meta.env.VITE_DEEPSEEK_API_KEY || import.meta.env.DEEPSEEK_API_KEY || '';
}

/**
 * Call DeepSeek API with a prompt
 */
async function callDeepSeek(
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 0.7
): Promise<DeepSeekResponse> {
  const apiKey = getDeepSeekApiKey();

  if (!apiKey) {
    return {
      success: false,
      error: 'DeepSeek API key not configured',
    };
  }

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
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
      return {
        success: false,
        error: errorData.error?.message || `API error: ${response.status}`,
      };
    }

    const data = await response.json();

    return {
      success: true,
      content: data.choices?.[0]?.message?.content || '',
      usage: data.usage,
    };
  } catch (error) {
    console.error('[AI] DeepSeek API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// CV ANALYSIS
// ═══════════════════════════════════════════════════════════════

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

/**
 * Extract structured data from CV text using DeepSeek
 */
export async function analyzeCV(cvText: string): Promise<{
  success: boolean;
  data?: CVExtractedData;
  error?: string;
}> {
  const response = await callDeepSeek(
    CV_EXTRACTION_SYSTEM,
    CV_EXTRACTION_PROMPT.replace('{cvText}', cvText),
    0.3 // Lower temperature for factual extraction
  );

  if (!response.success || !response.content) {
    return {
      success: false,
      error: response.error || 'Failed to analyze CV',
    };
  }

  try {
    // Parse JSON from response (might be wrapped in markdown)
    let jsonStr = response.content.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1] || jsonMatch[0];
    }

    const data = JSON.parse(jsonStr) as CVExtractedData;

    // Validate and sanitize
    return {
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
    };
  } catch (parseError) {
    console.error('[AI] CV parsing error:', parseError);
    return {
      success: false,
      error: 'Failed to parse CV data',
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// INTERVIEW QUESTION GENERATION
// ═══════════════════════════════════════════════════════════════

interface SuccessProfile {
  id: string;
  required_experience_years: number;
  required_industries: string[];
  target_disc_profile: string;
  personality_indicators: Array<{
    trait: string;
    description: string;
  }>;
}

interface MandateInfo {
  title: string;
  keywords: string;
  location: string;
  seniority_level?: string;
}

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

/**
 * Generate interview questions based on success profile
 */
export async function generateInterviewQuestions(
  mandate: MandateInfo,
  successProfile: SuccessProfile
): Promise<{
  success: boolean;
  data?: InterviewQuestion[];
  error?: string;
}> {
  const competencies = successProfile.personality_indicators
    .map(p => `${p.trait}: ${p.description}`)
    .join('; ');

  const response = await callDeepSeek(
    INTERVIEW_QUESTIONS_SYSTEM,
    INTERVIEW_QUESTIONS_PROMPT
      .replace('{mandateTitle}', mandate.title || 'Executive Position')
      .replace('{industry}', mandate.keywords || 'General')
      .replace('{location}', mandate.location || 'Not specified')
      .replace('{seniority}', mandate.seniority_level || 'Senior')
      .replace('{requiredExperience}', String(successProfile.required_experience_years || 10))
      .replace('{requiredIndustries}', successProfile.required_industries?.join(', ') || 'Various')
      .replace('{targetDisc}', successProfile.target_disc_profile || 'Not specified')
      .replace('{competencies}', competencies || 'General competencies'),
    0.7
  );

  if (!response.success || !response.content) {
    return {
      success: false,
      error: response.error || 'Failed to generate questions',
    };
  }

  try {
    let jsonStr = response.content.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || jsonStr.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1] || jsonMatch[0];
    }

    const data = JSON.parse(jsonStr);

    if (!Array.isArray(data)) {
      return { success: false, error: 'Invalid response format' };
    }

    return {
      success: true,
      data: data.map((q: any, idx: number) => ({
        id: q.id || `generated-${idx + 1}`,
        question: q.question || '',
        competencyArea: q.competencyArea || 'General',
        whatToListenFor: q.whatToListenFor || '',
        followUpQuestion: q.followUpQuestion || '',
      })),
    };
  } catch (parseError) {
    console.error('[AI] Question parsing error:', parseError);
    return {
      success: false,
      error: 'Failed to parse generated questions',
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// OFFER NEGOTIATION
// ═══════════════════════════════════════════════════════════════

interface CandidateProfile {
  title: string;
  yearsExperience: number;
  skills: string[];
  currentCompensation?: {
    base?: number;
    bonus?: number;
    equity?: string;
  };
}

interface MandateCompensation {
  budgetRange?: {
    min: number;
    max: number;
  };
  seniorityLevel?: string;
  location?: string;
}

interface MarketData {
  avgBaseSalary?: number;
  avgTotalComp?: number;
  dataSource?: string;
}

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

/**
 * Generate offer suggestion using AI
 */
export async function suggestOffer(
  candidate: CandidateProfile,
  mandate: MandateCompensation & { title: string; location?: string },
  marketData?: MarketData
): Promise<{
  success: boolean;
  data?: OfferSuggestion;
  error?: string;
}> {
  const marketDataSummary = marketData?.avgBaseSalary
    ? `Market data shows average base salary of $${marketData.avgBaseSalary.toLocaleString()} for similar roles (Source: ${marketData.dataSource || 'Market Research'}). Total compensation including bonuses typically ranges $${((marketData.avgTotalComp || marketData.avgBaseSalary) * 1.2).toLocaleString()}.`
    : 'No specific market data available. Use internal benchmarks and candidate expectations.';

  const currentComp = candidate.currentCompensation
    ? `Base $${candidate.currentCompensation.base?.toLocaleString() || 'Unknown'}, Bonus ${candidate.currentCompensation.bonus || 'Unknown'}%`
    : 'Not disclosed';

  const budgetRange = mandate.budgetRange
    ? `$${mandate.budgetRange.min.toLocaleString()} - $${mandate.budgetRange.max.toLocaleString()}`
    : 'Not specified';

  const response = await callDeepSeek(
    OFFER_NEGOTIATION_SYSTEM,
    OFFER_NEGOTIATION_PROMPT
      .replace('{candidateTitle}', candidate.title || 'Executive')
      .replace('{yearsExperience}', String(candidate.yearsExperience || 0))
      .replace('{skills}', candidate.skills?.join(', ') || 'Various')
      .replace('{currentComp}', currentComp)
      .replace('{mandateTitle}', mandate.title || 'Position')
      .replace('{budgetRange}', budgetRange)
      .replace('{seniority}', mandate.seniorityLevel || 'Senior')
      .replace('{location}', mandate.location || 'Not specified')
      .replace('{marketData}', marketDataSummary),
    0.5 // Lower temperature for more consistent output
  );

  if (!response.success || !response.content) {
    return {
      success: false,
      error: response.error || 'Failed to generate offer suggestion',
    };
  }

  try {
    let jsonStr = response.content.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1] || jsonMatch[0];
    }

    const data = JSON.parse(jsonStr);

    return {
      success: true,
      data: {
        baseSalaryRange: data.baseSalaryRange || { min: 0, max: 0, recommended: 0 },
        bonusStructure: data.bonusStructure || { percentage: 0, amount: 0 },
        equity: data.equity || { type: 'none', value: '' },
        benefits: Array.isArray(data.benefits) ? data.benefits : [],
        negotiationStrategy: data.negotiationStrategy || '',
        rationale: data.rationale || '',
      },
    };
  } catch (parseError) {
    console.error('[AI] Offer parsing error:', parseError);
    return {
      success: false,
      error: 'Failed to parse offer suggestion',
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Check if DeepSeek API is configured
 */
export function isAIConfigured(): boolean {
  return !!getDeepSeekApiKey();
}

/**
 * Get remaining API usage info (if available)
 */
export async function getAIUsageStats(): Promise<{
  success: boolean;
  usage?: DeepSeekResponse['usage'];
}> {
  // In production, this would track usage per organization
  return { success: true };
}

export default {
  analyzeCV,
  generateInterviewQuestions,
  suggestOffer,
  isAIConfigured,
  getAIUsageStats,
};
