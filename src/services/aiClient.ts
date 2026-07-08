import { authFetch } from '@/utils/authFetch';

export interface CVExtractedData {
  name: string | null;
  currentTitle: string | null;
  currentCompany: string | null;
  yearsExperience: number | null;
  keySkills: string[];
  education: Array<{ degree: string; institution: string; year: string }>;
  careerHighlights: string[];
  potentialRedFlags: string[];
}

export interface InterviewQuestion {
  id: string;
  question: string;
  category: string;
  timeLimit: number;
  expectedFramework: string;
}

export interface InterviewAnswerScore {
  scores: {
    Structure: number;
    Specificity: number;
    Impact: number;
    Leadership: number;
    Relevance: number;
    Depth: number;
  };
  feedback: {
    Strengths: string[];
    AreasForImprovement: string[];
  };
  overallScore: number;
}

export interface InterviewReport {
  overallRating: string;
  overallScore: number;
  strengths: string[];
  improvementAreas: string[];
  dimensionsSummary: Array<{ dimension: string; score: number; feedback: string }>;
  recommendations: string[];
}

export interface CQAssessmentQuestion {
  id: string;
  dimension: string;
  question: string;
  type: 'rating' | 'scenario';
}

export interface CQEvaluation {
  scores: {
    CulturalAwareness: number;
    CulturalAdaptation: number;
    CulturalNavigation: number;
    CulturalInfluence: number;
    CulturalIntegration: number;
  };
  overallScore: number;
  analysis: {
    strengths: string[];
    developmentAreas: string[];
  };
}

export interface InvisibleRulesMap {
  culturalContext: string;
  keyRules: Array<{ category: string; rule: string; whyImportant: string }>;
  commonMistakes: string[];
  successStrategies: string[];
}

export interface CQBlindSpots {
  blindSpots: Array<{ area: string; evidence: string; impact: string }>;
  developmentPlan: string[];
}

export interface OrgHealthScore {
  overallScore: number;
  dimensions: {
    TurnoverRisk: { score: number; analysis: string };
    Engagement: { score: number; analysis: string };
    StructureEfficiency: { score: number; analysis: string };
    TalentDensity: { score: number; analysis: string };
    GrowthReadiness: { score: number; analysis: string };
  };
  risks: Array<{ risk: string; severity: 'high' | 'medium' | 'low'; mitigation: string }>;
  recommendations: string[];
}

export interface OrgRiskAnalysis {
  riskSummary: string;
  risks: Array<{ category: string; description: string; probability: number; impact: number; mitigation: string }>;
}

export interface OrgBenchmark {
  comparison: Array<{ metric: string; companyValue: string; industryValue: string; percentile: number }>;
  strengths: string[];
  improvementAreas: string[];
}

export interface TalentDeepDiveReport {
  sections: Array<{ title: string; content: string; order: number }>;
  overallRecommendation: 'Hire' | 'Strong Hire' | 'No Hire';
  confidenceScore: number;
}

export interface LENSReport {
  overallScore: number;
  dimensions: {
    Vision: { score: number; analysis: string };
    Execution: { score: number; analysis: string };
    Influence: { score: number; analysis: string };
    Learning: { score: number; analysis: string };
    Resilience: { score: number; analysis: string };
  };
  executiveSummary: string;
  recommendations: string[];
}

export interface OfferSuggestion {
  baseSalaryRange: { min: number; max: number; recommended: number };
  bonusStructure: { percentage: number; amount: number };
  equity: { type: 'rsu' | 'option' | 'none'; value?: string };
  benefits: string[];
  negotiationStrategy: string;
  rationale: string;
}

export interface AIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

async function aiFetch<T = unknown>(
  path: string,
  body: Record<string, unknown>
): Promise<AIResponse<T>> {
  try {
    const res = await authFetch(`/api/ai/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      return { success: false, error: data.error || 'AI request failed' };
    }

    return data;
  } catch (err: any) {
    console.error('[aiClient] Error:', err);
    return { success: false, error: err.message || 'AI request failed' };
  }
}

export const aiClient = {
  analyzeCV: (cvText: string): Promise<AIResponse<CVExtractedData>> => {
    return aiFetch('analyze-cv', { cvText });
  },

  generateInterviewQuestions: (
    company: string,
    role: string,
    difficulty: string,
    count: number = 5
  ): Promise<AIResponse<InterviewQuestion[]>> => {
    return aiFetch('interview/generate-questions', { company, role, difficulty, count });
  },

  evaluateAnswer: (question: string, answer: string): Promise<AIResponse<InterviewAnswerScore>> => {
    return aiFetch('interview/evaluate-answer', { question, answer });
  },

  generateInterviewReport: (
    company: string,
    role: string,
    sessionData: unknown
  ): Promise<AIResponse<InterviewReport>> => {
    return aiFetch('interview/generate-report', { company, role, date: new Date().toISOString(), sessionData });
  },

  generateCQAssessment: (targetCulture: string, targetRole: string): Promise<AIResponse<CQAssessmentQuestion[]>> => {
    return aiFetch('cq/assess', { targetCulture, targetRole });
  },

  evaluateCQ: (
    role: string,
    responses: unknown,
    culture?: string,
    experience?: string
  ): Promise<AIResponse<CQEvaluation>> => {
    return aiFetch('cq/evaluate', { role, culture, experience, responses });
  },

  generateInvisibleRules: (targetCulture: string, targetRole: string): Promise<AIResponse<InvisibleRulesMap>> => {
    return aiFetch('cq/invisible-rules', { targetCulture, targetRole });
  },

  analyzeBlindSpots: (scores: unknown, selfReported?: unknown[]): Promise<AIResponse<CQBlindSpots>> => {
    return aiFetch('cq/blind-spots', { scores, selfReported });
  },

  orgHealthScore: (params: {
    companyName: string;
    industry?: string;
    employeeCount?: string | number;
    turnoverRate?: number;
    engagementScore?: number;
    avgTenure?: number;
    promotionRate?: number;
    criticalRoleCoverage?: number;
  }): Promise<AIResponse<OrgHealthScore>> => {
    return aiFetch('org/health-score', params);
  },

  orgRiskAnalysis: (companyData: unknown): Promise<AIResponse<OrgRiskAnalysis>> => {
    return aiFetch('org/risk-analysis', { companyData });
  },

  orgBenchmark: (company: string, companyMetrics: unknown, industry?: string): Promise<AIResponse<OrgBenchmark>> => {
    return aiFetch('org/benchmark', { company, industry, companyMetrics });
  },

  talentDeepDive: (params: {
    candidateName: string;
    currentRole?: string;
    yearsExperience?: string | number;
    assessmentData?: unknown;
    interviewFeedback?: string;
    resumeHighlights?: string;
  }): Promise<AIResponse<TalentDeepDiveReport>> => {
    return aiFetch('reports/talent-deep-dive', params);
  },

  lensReport: (params: {
    candidateName: string;
    tridentScores?: unknown;
    assessmentResults?: unknown;
  }): Promise<AIResponse<LENSReport>> => {
    return aiFetch('reports/lens-report', params);
  },

  orgHealthReport: (params: {
    company: string;
    healthScores?: unknown;
    riskAnalysis?: string;
    recommendations?: unknown[];
  }): Promise<AIResponse<{ sections: Array<{ title: string; content: string; score?: number; order: number }> }>> => {
    return aiFetch('reports/org-health-report', params);
  },

  suggestOffer: (
    candidate: unknown,
    mandate: unknown,
    marketData?: unknown
  ): Promise<AIResponse<OfferSuggestion>> => {
    return aiFetch('negotiate-offer', { candidate, mandate, marketData });
  },

  generateInterviewQuestionsLegacy: (
    mandate: unknown,
    successProfile: unknown
  ): Promise<AIResponse<InterviewQuestion[]>> => {
    return aiFetch('generate-questions', { mandate, successProfile });
  },

  analyze: (inputData: unknown, task: string): Promise<AIResponse<unknown>> => {
    return aiFetch('analyze', { inputData, task });
  },

  score: (item: unknown, criteria: unknown): Promise<AIResponse<{ score: number; breakdown: unknown[]; summary: string }>> => {
    return aiFetch('score', { item, criteria });
  },

  generate: (prompt: string, systemPrompt?: string, temperature?: number): Promise<AIResponse<{ content: string }>> => {
    return aiFetch('generate', { prompt, systemPrompt, temperature });
  },
};

export default aiClient;