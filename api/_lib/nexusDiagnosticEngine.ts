export type DiagnosticDimension = 'role' | 'situation' | 'constraint' | 'emotion' | 'success';

export const DIAGNOSTIC_DIMENSIONS: DiagnosticDimension[] = [
  'role',
  'situation',
  'constraint',
  'emotion',
  'success',
];

export interface DiagnosticState {
  dimensions_collected: Set<DiagnosticDimension>;
  turns_completed: number;
  confidence: number;
  phase: 'collecting' | 'complete' | 'deepening';
}

const DIMENSION_KEYWORDS: Record<DiagnosticDimension, string[]> = {
  role: [
    'role', 'position', 'title', 'job', 'function', 'responsibility',
    'manager', 'leader', 'director', 'head of', 'reports to',
    'team', 'department', 'division', 'level', 'rank',
  ],
  situation: [
    'situation', 'context', 'background', 'scenario', 'circumstance',
    'happening', 'going on', 'current state', 'at the moment',
    'recently', 'lately', 'now', 'currently', 'presently',
  ],
  constraint: [
    'constraint', 'limitation', 'challenge', 'obstacle', 'barrier',
    'issue', 'problem', 'difficulty', 'blocker', 'hindrance',
    'time', 'budget', 'resource', 'headcount', 'deadline', 'pressure',
    'stuck', 'struggling', 'struggle',
  ],
  emotion: [
    'feel', 'feeling', 'frustrated', 'excited', 'happy', 'sad',
    'anxious', 'worried', 'overwhelmed', 'motivated', 'disappointed',
    'concerned', 'confident', 'nervous', 'hopeful', 'discouraged',
    'stressed', 'burned out', 'burnout',
  ],
  success: [
    'success', 'goal', 'objective', 'outcome', 'achievement', 'target',
    'want', 'desire', 'wish', 'hope', 'aspire', 'aim', 'intend',
    'milestone', 'win', 'achieve', 'accomplish', 'deliver',
  ],
};

const DIMENSION_QUESTIONS: Record<DiagnosticDimension, string[]> = {
  role: [
    'What is your current role and level in the organization?',
    'Can you describe your key responsibilities in your current position?',
    'How long have you been in your current role, and what path led you here?',
  ],
  situation: [
    'Can you walk me through the current situation you are facing?',
    'What specific context or background should I understand about this scenario?',
    'When did this situation begin, and how has it evolved?',
  ],
  constraint: [
    'What are the key constraints or limitations you are working with?',
    'What challenges or obstacles are preventing you from moving forward?',
    'Are there specific resource, timing, or organizational constraints at play?',
  ],
  emotion: [
    'How does this situation make you feel, and what emotions come up for you?',
    'What is your emotional reaction to these challenges?',
    'How motivated or energized do you feel about addressing this?',
  ],
  success: [
    'What would a successful outcome look like for you in this situation?',
    'What specific goals or outcomes are you hoping to achieve?',
    'How will you know when you have succeeded?',
  ],
};

export function analyzeDiagnosticCoverage(
  messages: { role: string; content: string }[],
): { covered: DiagnosticDimension[]; missing: DiagnosticDimension[]; state: DiagnosticState } {
  if (!messages || messages.length === 0) {
    const emptyState: DiagnosticState = {
      dimensions_collected: new Set(),
      turns_completed: 0,
      confidence: 0,
      phase: 'collecting',
    };
    return { covered: [], missing: [...DIAGNOSTIC_DIMENSIONS], state: emptyState };
  }

  const text = messages.map(m => m.content).join(' ').toLowerCase();

  const covered = new Set<DiagnosticDimension>();

  for (const dim of DIAGNOSTIC_DIMENSIONS) {
    const keywords = DIMENSION_KEYWORDS[dim];
    let keywordHits = 0;
    for (const kw of keywords) {
      if (text.includes(kw)) {
        keywordHits++;
      }
    }

    const threshold = 2;
    if (keywordHits >= threshold) {
      covered.add(dim);
    }
  }

  const missing = DIAGNOSTIC_DIMENSIONS.filter(d => !covered.has(d));
  const turns_completed = messages.filter(m => m.role === 'user').length;

  const coverageRatio = covered.size / DIAGNOSTIC_DIMENSIONS.length;
  let confidence = 0;
  if (coverageRatio >= 1) confidence = 0.9;
  else if (coverageRatio >= 0.8) confidence = 0.75;
  else if (coverageRatio >= 0.6) confidence = 0.55;
  else if (coverageRatio >= 0.4) confidence = 0.35;
  else confidence = 0.15;

  let phase: 'collecting' | 'complete' | 'deepening';
  if (covered.size >= DIAGNOSTIC_DIMENSIONS.length) {
    phase = turns_completed >= 6 ? 'deepening' : 'complete';
  } else {
    phase = 'collecting';
  }

  const state: DiagnosticState = {
    dimensions_collected: covered,
    turns_completed,
    confidence,
    phase,
  };

  return { covered: Array.from(covered), missing, state };
}

export function suggestDiagnosticQuestion(
  missingDimension: DiagnosticDimension,
  context?: { messages?: { role: string; content: string }[] },
): string {
  const questions = DIMENSION_QUESTIONS[missingDimension];
  const seed = context?.messages?.length || 0;
  const index = seed % questions.length;
  return questions[index];
}

export function shouldProceedToSolution(state: DiagnosticState): boolean {
  return state.dimensions_collected.size >= DIAGNOSTIC_DIMENSIONS.length;
}

export function computeDiagnosticProgress(state: DiagnosticState): number {
  const ratio = state.dimensions_collected.size / DIAGNOSTIC_DIMENSIONS.length;
  return Math.round(ratio * 100);
}
