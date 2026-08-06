export type FrameworkType = 'TRIDENT' | 'SHIFT' | 'CANVAS' | 'STAR' | 'GROWTH' | 'SCALE';

export const FRAMEWORK_DESCRIPTIONS: Record<FrameworkType, { label: string; description: string; useCases: string[] }> = {
  TRIDENT: {
    label: 'TRIDENT',
    description: 'Career transition framework for evaluating trajectory, reach, and impact across roles and organizations.',
    useCases: ['career_transition', 'career_change', 'new_role', 'promotion'],
  },
  SHIFT: {
    label: 'SHIFT',
    description: 'Self-understanding framework for exploring strengths, motivations, and behavioral patterns.',
    useCases: ['self_understanding', 'strengths_assessment', 'career_direction', 'identity_exploration'],
  },
  CANVAS: {
    label: 'CANVAS',
    description: 'Compensation negotiation canvas for structuring salary, equity, benefits, and non-monetary terms.',
    useCases: ['compensation_negotiation', 'salary_review', 'offer_evaluation', 'benefit_review'],
  },
  STAR: {
    label: 'STAR',
    description: 'Situation, Task, Action, Result framework for interview preparation and behavioral storytelling.',
    useCases: ['interview_prep', 'behavioral_interview', 'storytelling', 'self_presentation'],
  },
  GROWTH: {
    label: 'GROWTH',
    description: 'Skill development framework for setting learning goals, identifying gaps, and tracking progress.',
    useCases: ['skill_development', 'learning_plan', 'career_growth', 'competency_building'],
  },
  SCALE: {
    label: 'SCALE',
    description: 'Leadership scaling framework for moving from individual contributor to people management.',
    useCases: ['leadership_development', 'manager_transition', 'team_leadership', 'executive_growth'],
  },
};

export const SCENARIO_FRAMEWORK_MAP: Record<string, { primary: FrameworkType; secondary: FrameworkType[] }> = {
  career_transition: { primary: 'TRIDENT', secondary: ['GROWTH', 'SHIFT'] },
  career_change: { primary: 'TRIDENT', secondary: ['SHIFT', 'GROWTH'] },
  new_role: { primary: 'TRIDENT', secondary: ['STAR', 'GROWTH'] },
  promotion: { primary: 'TRIDENT', secondary: ['CANVAS', 'GROWTH'] },
  self_understanding: { primary: 'SHIFT', secondary: ['GROWTH'] },
  strengths_assessment: { primary: 'SHIFT', secondary: ['TRIDENT'] },
  career_direction: { primary: 'SHIFT', secondary: ['TRIDENT', 'GROWTH'] },
  identity_exploration: { primary: 'SHIFT', secondary: ['GROWTH'] },
  compensation_negotiation: { primary: 'CANVAS', secondary: ['STAR'] },
  salary_review: { primary: 'CANVAS', secondary: ['TRIDENT'] },
  offer_evaluation: { primary: 'CANVAS', secondary: ['TRIDENT', 'STAR'] },
  benefit_review: { primary: 'CANVAS', secondary: [] },
  interview_prep: { primary: 'STAR', secondary: ['GROWTH'] },
  behavioral_interview: { primary: 'STAR', secondary: ['SHIFT'] },
  storytelling: { primary: 'STAR', secondary: ['SHIFT'] },
  self_presentation: { primary: 'STAR', secondary: ['SHIFT'] },
  skill_development: { primary: 'GROWTH', secondary: ['SHIFT'] },
  learning_plan: { primary: 'GROWTH', secondary: ['SCALE'] },
  career_growth: { primary: 'GROWTH', secondary: ['TRIDENT', 'SHIFT'] },
  competency_building: { primary: 'GROWTH', secondary: ['STAR'] },
  leadership_development: { primary: 'SCALE', secondary: ['GROWTH', 'SHIFT'] },
  manager_transition: { primary: 'SCALE', secondary: ['TRIDENT', 'GROWTH'] },
  team_leadership: { primary: 'SCALE', secondary: ['GROWTH'] },
  executive_growth: { primary: 'SCALE', secondary: ['TRIDENT', 'CANVAS'] },
};

const INTENT_FRAMEWORK_HINTS: Record<string, FrameworkType[]> = {
  career_advisory: ['TRIDENT', 'SHIFT'],
  self_understanding: ['SHIFT'],
  compensation: ['CANVAS'],
  opportunity: ['TRIDENT', 'STAR'],
  coaching: ['SHIFT', 'GROWTH'],
  skill_building: ['GROWTH'],
  market_intel: ['CANVAS', 'TRIDENT'],
};

const SENIORITY_FRAMEWORK_PREFERENCE: Record<string, FrameworkType[]> = {
  junior: ['GROWTH', 'STAR'],
  mid: ['TRIDENT', 'SHIFT', 'GROWTH'],
  senior: ['TRIDENT', 'CANVAS', 'SCALE'],
  executive: ['SCALE', 'CANVAS', 'TRIDENT'],
};

export function selectFramework(
  intent: string,
  context: { scenario?: string; seniority?: string; messages?: { content: string }[] },
): FrameworkType {
  if (context?.scenario) {
    const mapping = SCENARIO_FRAMEWORK_MAP[context.scenario];
    if (mapping) {
      return mapping.primary;
    }
  }

  if (context?.seniority) {
    const pref = SENIORITY_FRAMEWORK_PREFERENCE[context.seniority.toLowerCase()];
    if (pref && pref.length > 0) {
      return pref[0];
    }
  }

  const intentHints = INTENT_FRAMEWORK_HINTS[intent];
  if (intentHints && intentHints.length > 0) {
    return intentHints[0];
  }

  if (intent === 'career_advisory' || intent === 'opportunity') {
    return 'TRIDENT';
  }
  if (intent === 'compensation') {
    return 'CANVAS';
  }
  if (intent === 'skill_building') {
    return 'GROWTH';
  }
  if (intent === 'coaching') {
    return 'SHIFT';
  }

  return 'TRIDENT';
}

export function getFrameworkPrompts(
  framework: FrameworkType,
  context?: { scenario?: string; seniority?: string },
): { systemPrompt: string; userPrompt: string; followUpPrompts: string[] } {
  const desc = FRAMEWORK_DESCRIPTIONS[framework];
  const scenario = context?.scenario || 'general';
  const seniority = context?.seniority || 'mid';

  const systemPrompts: Record<FrameworkType, string> = {
    TRIDENT: `You are guiding the user through the TRIDENT framework for career transition. Help them evaluate Trajectory (long-term direction), Reach (network and influence), and Impact (tangible outcomes). Structure responses around these three dimensions.`,
    SHIFT: `You are guiding the user through the SHIFT framework for self-understanding. Help them explore their Strengths, Motivations, Interests, Fit, and Transferable skills. Use reflective questioning to deepen self-awareness.`,
    CANVAS: `You are guiding the user through the CANVAS framework for compensation negotiation. Help them structure their ask across salary, equity, benefits, bonus structure, and non-monetary terms. Focus on anchoring, justifying, and packaging strategies.`,
    STAR: `You are guiding the user through the STAR framework for interview preparation. Help them structure responses around Situation, Task, Action, and Result. Use concrete examples and quantify outcomes.`,
    GROWTH: `You are guiding the user through the GROWTH framework for skill development. Help them set Goals, identify Gaps, plan Resources, define Ownership, and establish Timelines. Create a structured learning plan.`,
    SCALE: `You are guiding the user through the SCALE framework for leadership development. Help them transition from individual contributor to people management, covering Strategy, Communication, Accountability, Leadership, and Execution.`,
  };

  const userPrompts: Record<FrameworkType, string> = {
    TRIDENT: `Let's explore your ${scenario} using the TRIDENT framework. I'll ask about your Trajectory (where you're headed), Reach (your network and influence), and Impact (your tangible achievements). Shall we begin with Trajectory?`,
    SHIFT: `Let's explore your ${scenario} using the SHIFT framework. I'll help you uncover your Strengths, Motivations, Interests, Fit, and Transferable skills. Shall we start by exploring your core strengths?`,
    CANVAS: `Let's structure your ${scenario} using the CANVAS framework. We'll map out salary, equity, benefits, and non-monetary terms to build a comprehensive negotiation strategy. Shall we begin with your anchor position?`,
    STAR: `Let's prepare for your ${scenario} using the STAR framework. We'll craft compelling stories around Situation, Task, Action, and Result. Shall we start with a key situation you've faced?`,
    GROWTH: `Let's plan your ${scenario} using the GROWTH framework. We'll set clear Goals, identify skill Gaps, map Resources, establish Ownership, and set Timelines. Shall we start with your development goals?`,
    SCALE: `Let's develop your ${scenario} using the SCALE framework. We'll cover Strategy, Communication, Accountability, Leadership, and Execution. Shall we begin with your current leadership challenges?`,
  };

  const followUpPrompts: Record<FrameworkType, string[]> = {
    TRIDENT: [
      'How does this align with your 3-5 year trajectory?',
      'What network or reach do you need to develop for this move?',
      'What tangible impact have you delivered in your current role?',
    ],
    SHIFT: [
      'What strengths have others consistently recognized in you?',
      'What motivates you most in your work?',
      'What interests energize you vs. drain you?',
    ],
    CANVAS: [
      'What is your anchor salary position based on market data?',
      'What non-monetary terms are most valuable to you?',
      'How would you package this into a compelling ask?',
    ],
    STAR: [
      'Can you describe a specific situation where you faced this challenge?',
      'What task were you responsible for in that scenario?',
      'What was the measurable result of your actions?',
    ],
    GROWTH: [
      'What specific skill gaps do you need to address?',
      'What resources (courses, mentors, projects) can support this?',
      'What timeline makes sense for this development?',
    ],
    SCALE: [
      'What is your current leadership challenge?',
      'How do you communicate strategy to your team?',
      'How do you hold others accountable effectively?',
    ],
  };

  return {
    systemPrompt: systemPrompts[framework],
    userPrompt: userPrompts[framework],
    followUpPrompts: followUpPrompts[framework],
  };
}

const FRAMEWORK_INTENT_MATCH: Record<FrameworkType, string[]> = {
  TRIDENT: ['career_advisory', 'opportunity', 'market_intel'],
  SHIFT: ['self_understanding', 'coaching', 'career_advisory'],
  CANVAS: ['compensation', 'market_intel'],
  STAR: ['opportunity', 'skill_building'],
  GROWTH: ['skill_building', 'coaching'],
  SCALE: ['coaching', 'career_advisory'],
};

export function getRecommendedFrameworks(intent: string): FrameworkType[] {
  const result: FrameworkType[] = [];

  for (const fw of Object.keys(FRAMEWORK_INTENT_MATCH) as FrameworkType[]) {
    if (FRAMEWORK_INTENT_MATCH[fw].includes(intent)) {
      result.push(fw);
    }
  }

  if (result.length === 0) {
    return ['TRIDENT', 'SHIFT'];
  }

  return result;
}
