export type QualityDimension =
  | 'diagnostic_depth'
  | 'framework_activation'
  | 'deliverable_quality'
  | 'coaching_depth'
  | 'reflection_quality'
  | 'milestone_progress'
  | 'seniority_calibration'
  | 'safety_compliance';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface QualityScoreResult {
  overall: number;
  dimensions: Record<QualityDimension, number>;
  rating: string;
  improvements: string[];
}

const DIAGNOSTIC_TAG_PATTERN = /\[DIAGNOSTIC:\s*([^\]]+)\]/gi;
const MILESTONE_TAG_PATTERN = /\[MILESTONE:\s*([^\]]+)\]/gi;
const FRAMEWORK_PATTERN = /\b(TRIDENT|SHIFT|CANVAS|STAR|GROWTH|SCALE)\b/gi;
const DELIVERABLE_PATTERN = /\b(deliverable|template|export|report|document|worksheet|canvas)\b/i;
const SOCRATIC_PATTERN = /\b(what|how|why|when|where|who|which)\b/i;
const REFLECTION_PROMPT_PATTERN = /\b(reflect|consider|think about|notice|realize|explore|examine)\b/i;
const SAFETY_VIOLATION_PATTERN = /\b(diagnose|prescription|lawsuit|sue|hack|forge|steal|cheat|illegal)\b/i;
const SENIORITY_TONE_PATTERN = /\b(dear|sir|madam|you must|you should|obviously|clearly)\b/i;

const ALL_DIMENSIONS: QualityDimension[] = [
  'diagnostic_depth',
  'framework_activation',
  'deliverable_quality',
  'coaching_depth',
  'reflection_quality',
  'milestone_progress',
  'seniority_calibration',
  'safety_compliance',
];

export function scoreChatQuality(
  session: { id?: string; user_id?: string; messages?: ChatMessage[] },
  messages: ChatMessage[],
): QualityScoreResult {
  const msgs = messages || [];
  const dimensions: Record<QualityDimension, number> = {
    diagnostic_depth: scoreDiagnosticDepth(msgs),
    framework_activation: scoreFrameworkActivation(msgs),
    deliverable_quality: scoreDeliverableQuality(msgs),
    coaching_depth: scoreCoachingDepth(msgs),
    reflection_quality: scoreReflectionQualityDim(msgs),
    milestone_progress: scoreMilestoneProgressDim(msgs),
    seniority_calibration: scoreSeniorityCalibration(msgs),
    safety_compliance: scoreSafetyCompliance(msgs),
  };

  const values = Object.values(dimensions);
  const overall = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
  const rating = getQualityRating(overall);
  const improvements = getQualityImprovement(overall, dimensions);

  return { overall, dimensions, rating, improvements };
}

function scoreDiagnosticDepth(messages: ChatMessage[]): number {
  let score = 0;
  const combined = messages.map(m => m.content).join(' ');

  const tags = combined.match(DIAGNOSTIC_TAG_PATTERN);
  if (tags) {
    score = Math.min(5, tags.length);
  }

  const dimensions_found = new Set<string>();
  let match;
  const re = /\[DIAGNOSTIC:\s*([^\]]+)\]/gi;
  while ((match = re.exec(combined)) !== null) {
    dimensions_found.add(match[1].trim().toLowerCase());
  }

  const expected = ['role', 'situation', 'constraint', 'emotion', 'success'];
  const covered = expected.filter(d => dimensions_found.has(d));

  if (covered.length >= 4) {
    score = Math.max(score, 5);
  } else if (covered.length >= 3) {
    score = Math.max(score, 4);
  } else if (covered.length >= 2) {
    score = Math.max(score, 3);
  } else if (covered.length >= 1) {
    score = Math.max(score, 2);
  }

  return Math.min(5, score);
}

function scoreFrameworkActivation(messages: ChatMessage[]): number {
  const combined = messages.map(m => m.content).join(' ');
  const frameworkRefs = combined.match(FRAMEWORK_PATTERN);
  if (!frameworkRefs) return 0;

  let score = Math.min(5, frameworkRefs.length);

  const structuredPatterns = [
    /\b(dimension|assessment|scoring|score|profile|archetype)\b/i,
    /\b(strength|weakness|opportunity|threat|action plan|next step)\b/i,
  ];

  for (const p of structuredPatterns) {
    if (p.test(combined)) score = Math.min(5, score + 1);
  }

  return Math.min(5, score);
}

function scoreDeliverableQuality(messages: ChatMessage[]): number {
  const combined = messages.map(m => m.content).join(' ');
  const matches = combined.match(DELIVERABLE_PATTERN);
  if (!matches) return 0;

  let score = Math.min(5, matches.length);

  const exportPatterns = [
    /\b(export|download|save|generate|create)\b/i,
    /\b(PDF|Word|Excel|document|report)\b/i,
  ];

  for (const p of exportPatterns) {
    if (p.test(combined)) score = Math.min(5, score + 1);
  }

  return Math.min(5, score);
}

function scoreCoachingDepth(messages: ChatMessage[]): number {
  const assistantMsgs = messages.filter(m => m.role === 'assistant');
  if (assistantMsgs.length === 0) return 0;

  let socraticCount = 0;
  let reflectionCount = 0;

  for (const msg of assistantMsgs) {
    const words = msg.content.split(/\s+/);
    const questions = words.filter(w => SOCRATIC_PATTERN.test(w)).length;
    socraticCount += questions;

    const reflections = msg.content.match(REFLECTION_PROMPT_PATTERN);
    if (reflections) reflectionCount += reflections.length;
  }

  const totalAssistantWords = assistantMsgs.reduce((sum, m) => sum + m.content.split(/\s+/).length, 0);
  if (totalAssistantWords === 0) return 0;

  const ratio = socraticCount / totalAssistantWords;
  let score = 0;

  if (ratio > 0.15) score = 5;
  else if (ratio > 0.10) score = 4;
  else if (ratio > 0.05) score = 3;
  else if (ratio > 0.02) score = 2;
  else if (ratio > 0) score = 1;

  if (reflectionCount >= 10) score = Math.max(score, 5);
  else if (reflectionCount >= 5) score = Math.max(score, 4);
  else if (reflectionCount >= 2) score = Math.max(score, 3);
  else if (reflectionCount >= 1) score = Math.max(score, 2);

  return Math.min(5, score);
}

function scoreReflectionQualityDim(messages: ChatMessage[]): number {
  const userMsgs = messages.filter(m => m.role === 'user');
  if (userMsgs.length === 0) return 0;

  let score = 0;
  const depthPatterns = [
    /\b(i (realize|notice|see|recognize|understand))\b/i,
    /\b(my (pattern|tendency|habit|approach))\b/i,
    /\b(i (will|plan to|intend to|going to))\b/i,
    /\b(i (feel|felt|am feeling|am|feel))\b/i,
  ];

  let matches = 0;
  for (const msg of userMsgs) {
    for (const p of depthPatterns) {
      if (p.test(msg.content)) matches++;
    }
  }

  if (matches >= 12) score = 5;
  else if (matches >= 8) score = 4;
  else if (matches >= 5) score = 3;
  else if (matches >= 2) score = 2;
  else if (matches >= 1) score = 1;

  const uniqueUsers = new Set(userMsgs.map(m => m.content.trim().toLowerCase()));
  if (uniqueUsers.size >= 5 && score < 3) score = 3;

  return Math.min(5, score);
}

function scoreMilestoneProgressDim(messages: ChatMessage[]): number {
  const combined = messages.map(m => m.content).join(' ');
  const tags = combined.match(MILESTONE_TAG_PATTERN);

  const expected = ['goal_defined', 'diagnostic_started', 'diagnostic_complete', 'solution_path', 'next_steps'];

  if (!tags || tags.length === 0) return 0;

  const found = new Set<string>();
  let match;
  const re = /\[MILESTONE:\s*([^\]]+)\]/gi;
  while ((match = re.exec(combined)) !== null) {
    found.add(match[1].trim().toLowerCase());
  }

  const covered = expected.filter(e => found.has(e));
  const ratio = covered.length / expected.length;

  if (ratio >= 0.8) return 5;
  if (ratio >= 0.6) return 4;
  if (ratio >= 0.4) return 3;
  if (ratio >= 0.2) return 2;
  return 1;
}

function scoreSeniorityCalibration(messages: ChatMessage[]): number {
  const combined = messages.map(m => m.content).join(' ');
  const violations = combined.match(SENIORITY_TONE_PATTERN);
  if (!violations) return 5;

  const count = violations.length;
  if (count <= 1) return 4;
  if (count <= 2) return 3;
  if (count <= 3) return 2;
  return 1;
}

function scoreSafetyCompliance(messages: ChatMessage[]): number {
  const combined = messages.map(m => m.content).join(' ');
  const violations = combined.match(SAFETY_VIOLATION_PATTERN);

  if (!violations || violations.length === 0) return 5;

  const count = violations.length;
  if (count <= 1) return 3;
  if (count <= 3) return 2;
  return 1;
}

export function getQualityRating(score: number): string {
  if (score >= 4.5) return 'A';
  if (score >= 3.5) return 'B';
  if (score >= 2.5) return 'C';
  if (score >= 1.5) return 'D';
  return 'F';
}

export function getQualityImprovement(
  score: number,
  dimensions: Record<QualityDimension, number>,
): string[] {
  const improvements: string[] = [];

  for (const dim of ALL_DIMENSIONS) {
    const val = dimensions[dim];
    if (val <= 1) {
      improvements.push(getImprovementForDimension(dim));
    }
  }

  if (score <= 1) {
    improvements.push('Overall chat quality is very low. Consider a full diagnostic reassessment.');
  } else if (score <= 2) {
    improvements.push('Chat quality needs significant improvement. Focus on the lowest-scoring dimensions.');
  } else if (score <= 3) {
    improvements.push('Chat quality is below average. Targeted improvements in specific dimensions will help.');
  } else if (score <= 4) {
    improvements.push('Chat quality is good. Fine-tuning specific dimensions could elevate to excellent.');
  }

  return improvements;
}

function getImprovementForDimension(dim: QualityDimension): string {
  switch (dim) {
    case 'diagnostic_depth':
      return 'Improve diagnostic depth: systematically explore all 5 dimensions (role, situation, constraint, emotion, success).';
    case 'framework_activation':
      return 'Increase framework activation: explicitly reference and apply structured frameworks (TRIDENT, SHIFT, CANVAS, STAR, GROWTH, SCALE).';
    case 'deliverable_quality':
      return 'Enhance deliverable quality: generate concrete templates, reports, and exportable artifacts.';
    case 'coaching_depth':
      return 'Deepen coaching: use more Socratic questioning and reflection prompts to guide user discovery.';
    case 'reflection_quality':
      return 'Improve reflection quality: encourage users to explore patterns, feelings, and action orientation.';
    case 'milestone_progress':
      return 'Track milestone progress: ensure milestones are explicitly marked as the conversation progresses.';
    case 'seniority_calibration':
      return 'Calibrate tone: match communication style to user seniority level, avoiding overly directive or overly formal language.';
    case 'safety_compliance':
      return 'Ensure safety compliance: avoid providing advice in medically, legally, or ethically sensitive areas.';
    default:
      return '';
  }
}
