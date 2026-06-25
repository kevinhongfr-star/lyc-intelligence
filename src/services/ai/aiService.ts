// Phase 6.4: AI Service - Backend API Integration
// AI-Assisted Features (calls server-side to protect API keys)

import { authFetch } from '@/utils/authFetch';

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
// BACKEND API CALLS
// ═══════════════════════════════════════════════════════════════

/**
 * Extract structured data from CV text using server-side AI
 */
export async function analyzeCV(cvText: string): Promise<{
  success: boolean;
  data?: CVExtractedData;
  error?: string;
}> {
  try {
    const res = await authFetch('/api/x/ai/analyze-cv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cvText }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to analyze CV' };
    }

    return data;
  } catch (err: any) {
    console.error('[AI] CV analysis error:', err);
    return { success: false, error: err.message || 'Failed to analyze CV' };
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
  try {
    const res = await authFetch('/api/x/ai/generate-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mandate, successProfile }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to generate questions' };
    }

    return data;
  } catch (err: any) {
    console.error('[AI] Question generation error:', err);
    return { success: false, error: err.message || 'Failed to generate questions' };
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
  try {
    const res = await authFetch('/api/x/ai/negotiate-offer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidate, mandate, marketData }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to generate offer suggestion' };
    }

    return data;
  } catch (err: any) {
    console.error('[AI] Offer suggestion error:', err);
    return { success: false, error: err.message || 'Failed to generate offer suggestion' };
  }
}

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Check if AI backend is configured (always true - backend handles this)
 */
export function isAIConfigured(): boolean {
  return true;
}

/**
 * Get remaining API usage info (if available)
 */
export async function getAIUsageStats(): Promise<{
  success: boolean;
  usage?: DeepSeekResponse['usage'];
}> {
  return { success: true };
}

export default {
  analyzeCV,
  generateInterviewQuestions,
  suggestOffer,
  isAIConfigured,
  getAIUsageStats,
};
