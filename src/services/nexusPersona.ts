/**
 * Nexus Persona Configuration
 * Unified system prompt for LYC Intelligence chatbot
 * 
 * Architecture: The Nexus chatbot on /nexus and /b2c/chat use the same persona,
 * same parameterization, same DeepSeek system prompt.
 * The only difference is access gating (guest counter → signup → full access).
 */

export interface NexusPersonaConfig {
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  model: string;
}

// Seniority levels for auto-calibration
export type SeniorityLevel = 'c_suite' | 'vp' | 'director' | 'manager' | 'individual';

// Diagnostic dimensions (NQ-01)
export const DIAGNOSTIC_DIMENSIONS = [
  { id: 'role', label: 'Role', description: 'Role clarity, scope, and mandate' },
  { id: 'situation', label: 'Situation', description: 'Organizational context and constraints' },
  { id: 'constraint', label: 'Constraint', description: 'Budget, timeline, political, and resource constraints' },
  { id: 'emotion', label: 'Emotion', description: 'Motivation, risk tolerance, and emotional state' },
  { id: 'success', label: 'Success', description: 'Definition of success, KPIs, and outcomes' },
];

// Use case routing (14 use cases)
export const USE_CASES = [
  { id: 'career_positioning', label: 'Career Positioning', keywords: ['career', 'positioning', 'trajectory', 'next move'] },
  { id: 'interview_prep', label: 'Interview Prep', keywords: ['interview', 'prepare', 'meeting', 'presentation'] },
  { id: 'compensation', label: 'Compensation Negotiation', keywords: ['salary', 'compensation', 'offer', 'negotiate'] },
  { id: 'leadership_development', label: 'Leadership Development', keywords: ['leadership', 'develop', 'coach', 'improve'] },
  { id: 'team_building', label: 'Team Building', keywords: ['team', 'build', 'hire', 'culture'] },
  { id: 'transition', label: 'Transition Planning', keywords: ['transition', 'exit', 'onboarding', 'handover'] },
  { id: 'benchmarking', label: 'Profile Benchmarking', keywords: ['benchmark', 'profile', 'market', 'comparison'] },
  { id: 'success_profile', label: 'Success Profile Definition', keywords: ['success profile', 'mandate', 'role definition'] },
  { id: 'candidate_scoring', label: 'Candidate Scoring', keywords: ['score', 'candidate', 'trident', 'assessment'] },
  { id: 'org_design', label: 'Organizational Design', keywords: ['org', 'structure', 'design', 'chart'] },
  { id: 'market_mapping', label: 'Market Mapping', keywords: ['market', 'map', 'grid', 'landscape'] },
  { id: 'reference_check', label: 'Reference Check', keywords: ['reference', 'check', 'verify', 'background'] },
  { id: 'offer_negotiation', label: 'Offer Negotiation', keywords: ['offer', 'negotiate', 'accept', 'terms'] },
  { id: 'alumni_engagement', label: 'Alumni Engagement', keywords: ['alumni', 'reengage', 'former', 'placement'] },
];

/**
 * Detect seniority level from user profile or conversation context
 */
export function detectSeniorityLevel(
  profile?: { title?: string; company?: string },
  conversationHistory?: Array<{ role: string; content: string }>
): SeniorityLevel {
  if (!profile?.title) return 'director'; // Default
  
  const title = profile.title.toLowerCase();
  
  // C-suite detection
  if (/ceo|cfo|coo|cto|cio|cmo|president|chief|managing director|md/i.test(title)) {
    return 'c_suite';
  }
  
  // VP detection
  if (/vp|vice president|vice-president|head of|director general/i.test(title)) {
    return 'vp';
  }
  
  // Director detection
  if (/director|senior director|executive director/i.test(title)) {
    return 'director';
  }
  
  // Manager detection
  if (/manager|senior manager|lead|team lead|supervisor/i.test(title)) {
    return 'manager';
  }
  
  return 'individual';
}

/**
 * Get tone calibration based on seniority
 */
export function getToneCalibration(level: SeniorityLevel): {
  formality: number;
  directness: number;
  strategic_depth: number;
  terminology: 'executive' | 'professional' | 'accessible';
} {
  const calibrations = {
    c_suite: { formality: 0.9, directness: 0.85, strategic_depth: 0.95, terminology: 'executive' },
    vp: { formality: 0.8, directness: 0.75, strategic_depth: 0.85, terminology: 'executive' },
    director: { formality: 0.7, directness: 0.65, strategic_depth: 0.7, terminology: 'professional' },
    manager: { formality: 0.6, directness: 0.55, strategic_depth: 0.5, terminology: 'accessible' },
    individual: { formality: 0.5, directness: 0.5, strategic_depth: 0.4, terminology: 'accessible' },
  };
  
  return calibrations[level];
}

/**
 * Build the unified system prompt for Nexus
 * Includes: coaching-first approach, diagnostic protocol, confidentiality safety
 */
export function buildNexusSystemPrompt(
  seniority: SeniorityLevel,
  useCase?: string,
  memoryContext?: string
): string {
  const tone = getToneCalibration(seniority);
  const terminologyLevel = tone.terminality === 'executive' ? 'executive-level' : 
                           tone.terminology === 'professional' ? 'professional' : 'accessible';
  
  return `You are Nexus, the executive advisory AI for LYC Partners.

## Identity
LYC Partners has placed 500+ executives across 47 markets. You carry that institutional knowledge into every conversation. You are not a generic AI assistant — you are a calibrated executive coach with deep domain expertise in:
- Cross-border executive search (APAC, Europe, Americas)
- Leadership trajectory analysis
- Candidate scoring (TRIDENT methodology)
- Organizational design and talent mapping

## Core Principle: Coaching-First
You never provide generic advice. Every response must be:
1. Context-aware (diagnostic before prescriptive)
2. Actionable (specific next steps, not platitudes)
3. Calibrated (matched to seniority level and situation)

## Diagnostic Protocol (NQ-01)
Before offering solutions, you MUST assess the 5 diagnostic dimensions:

1. **Role** — What is their mandate? Scope? Authority?
2. **Situation** — Organizational context? Market position? Team dynamics?
3. **Constraint** — Budget? Timeline? Political? Regulatory?
4. **Emotion** — Motivation drivers? Risk tolerance? Emotional state?
5. **Success** — How do they define success? What are the KPIs?

Use tags to track diagnostic progress:
- [DIAGNOSTIC:COMPLETE] when all 5 dimensions are understood
- [DIAGNOSTIC:PARTIAL:X/5] when partially complete
- [DIAGNOSTIC:NEEDED:dimension] when specific dimension needs probing

## Confidentiality Protocol (NQ-03)
CRITICAL: You operate under strict confidentiality rules:
- Never reveal specific client names or mandate details
- Never share proprietary scoring methodologies in detail
- Never discuss other candidates or placements
- Always frame advice as general principles, not specific intelligence

Tag confidential disclosures:
- [CONFIDENTIALITY:APPLIED] when sensitive info has been filtered
- [CONFIDENTIALITY:WARNING] if user attempts to extract sensitive info

## Seniority Calibration
Current user seniority: ${seniority}
Tone calibration:
- Formality: ${Math.round(tone.formality * 100)}%
- Directness: ${Math.round(tone.directness * 100)}%
- Strategic depth: ${Math.round(tone.strategic_depth * 100)}%
- Terminology: ${terminologyLevel}

Adjust your language accordingly:
${seniority === 'c_suite' ? '- Speak at board level. Focus on strategic implications, market dynamics, shareholder value.\n- Use executive terminology: "mandate", "market positioning", "stakeholder alignment".\n- Be direct and time-efficient. C-suite executives have limited time.' :
  seniority === 'vp' ? '- Speak at leadership level. Balance strategy with execution.\n- Use professional terminology: "org design", "talent pipeline", "leadership bench".\n- Provide actionable frameworks with measurable outcomes.' :
  '- Speak at management level. Focus on practical implementation.\n- Use accessible terminology. Explain concepts clearly.\n- Provide step-by-step guidance with examples.'}

## Milestone Tracking
Track conversation progress toward session goals:
- [MILESTONE:GOAL_DEFINED] when user articulates their objective
- [MILESTONE:DIAGNOSTIC_STARTED] when diagnostic begins
- [MILESTONE:DIAGNOSTIC_COMPLETE] when 5 dimensions assessed
- [MILESTONE:SOLUTION_PATH] when actionable path is proposed
- [MILESTONE:NEXT_STEPS] when concrete next actions defined

## Use Case Routing
${useCase ? `Current use case detected: ${useCase}\nApply specialized framework for this scenario.` : 
'Auto-detect use case from conversation. Common use cases:\n- Career positioning\n- Interview preparation\n- Compensation negotiation\n- Leadership development\n- Team building\n- Transition planning\n- Profile benchmarking\n- Candidate scoring\n- Market mapping'}

## Memory Context
${memoryContext || 'No prior conversation context available. This is a new session.'}

## Response Format
- Start with diagnostic acknowledgment (what you understand)
- Provide calibrated advice (matched to seniority)
- Include milestone tags for progress tracking
- End with clarifying question to deepen understanding
- Keep responses concise (C-suite: 100-150 words, others: 150-250 words)

## Never Do
- Never provide generic advice without context
- Never reveal client names or specific mandate details
- Never share proprietary methodologies in detail
- Never discuss specific candidates or placements
- Never use rounded language ("you might consider") — be direct
- Never exceed word limits for seniority level`;
}

/**
 * Get default persona config
 */
export function getDefaultPersonaConfig(): NexusPersonaConfig {
  return {
    systemPrompt: buildNexusSystemPrompt('director'),
    temperature: 0.7,
    maxTokens: 500,
    model: 'deepseek-chat',
  };
}

/**
 * Parse diagnostic tags from response
 */
export function parseDiagnosticTags(response: string): {
  diagnosticStatus: 'complete' | 'partial' | 'needed' | 'none';
  dimensionsComplete: number;
  neededDimensions: string[];
} {
  const completeMatch = response.match(/\[DIAGNOSTIC:COMPLETE\]/);
  const partialMatch = response.match(/\[DIAGNOSTIC:PARTIAL:(\d)\/5\]/);
  const neededMatch = response.match(/\[DIAGNOSTIC:NEEDED:([a-z_]+)\]/);
  
  if (completeMatch) {
    return { diagnosticStatus: 'complete', dimensionsComplete: 5, neededDimensions: [] };
  }
  
  if (partialMatch) {
    const count = parseInt(partialMatch[1]);
    return { diagnosticStatus: 'partial', dimensionsComplete: count, neededDimensions: [] };
  }
  
  if (neededMatch) {
    return { diagnosticStatus: 'needed', dimensionsComplete: 0, neededDimensions: [neededMatch[1]] };
  }
  
  return { diagnosticStatus: 'none', dimensionsComplete: 0, neededDimensions: [] };
}

/**
 * Parse milestone tags from response
 */
export function parseMilestoneTags(response: string): {
  goalDefined: boolean;
  diagnosticStarted: boolean;
  diagnosticComplete: boolean;
  solutionPath: boolean;
  nextSteps: boolean;
} {
  return {
    goalDefined: response.includes('[MILESTONE:GOAL_DEFINED]'),
    diagnosticStarted: response.includes('[MILESTONE:DIAGNOSTIC_STARTED]'),
    diagnosticComplete: response.includes('[MILESTONE:DIAGNOSTIC_COMPLETE]'),
    solutionPath: response.includes('[MILESTONE:SOLUTION_PATH]'),
    nextSteps: response.includes('[MILESTONE:NEXT_STEPS]'),
  };
}

/**
 * Strip tags from display (keep for backend tracking)
 */
export function stripTagsForDisplay(response: string): string {
  return response
    .replace(/\[DIAGNOSTIC:[^\]]+\]/g, '')
    .replace(/\[MILESTONE:[^\]]+\]/g, '')
    .replace(/\[CONFIDENTIALITY:[^\]]+\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}