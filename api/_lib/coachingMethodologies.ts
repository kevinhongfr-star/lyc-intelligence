export type CoachingMethodology = 'GROW' | 'CLEAR' | 'coaching-wheel' | 'OSCAR' | 'FRAME';

export interface MethodologyStep {
  id: string;
  name: string;
  description: string;
  prompts: string[];
  duration: number;
}

export interface Methodology {
  id: CoachingMethodology;
  name: string;
  description: string;
  steps: MethodologyStep[];
  strengths: string[];
  bestFor: string[];
  limitations: string[];
}

export const GROW: Methodology = {
  id: 'GROW',
  name: 'GROW Model',
  description: 'A structured goal-setting and problem-solving framework that moves from the ideal future state to concrete action.',
  steps: [
    {
      id: 'goal',
      name: 'Goal',
      description: 'Clarify the specific, measurable goal the coachee wants to achieve.',
      prompts: [
        'What do you want to achieve in this session?',
        'Describe your goal in specific, measurable terms.',
        'What would success look like for you?',
        'How will you know when you have achieved this goal?',
      ],
      duration: 600,
    },
    {
      id: 'reality',
      name: 'Reality',
      description: 'Explore the current situation, what is happening now, and what the coachee is already doing.',
      prompts: [
        'What is happening currently?',
        'What have you tried so far?',
        'What is working and what is not?',
        'What resources do you already have available?',
      ],
      duration: 600,
    },
    {
      id: 'options',
      name: 'Options',
      description: 'Brainstorm different paths forward without judgment or evaluation.',
      prompts: [
        'What are all the different ways you could approach this?',
        'What would you do if you knew you could not fail?',
        'What would someone you admire do in this situation?',
        'What are the pros and cons of each option?',
      ],
      duration: 900,
    },
    {
      id: 'will',
      name: 'Will',
      description: 'Commit to a specific action plan with clear steps and accountability.',
      prompts: [
        'Which option(s) will you pursue?',
        'What specific actions will you take?',
        'When will you take these actions?',
        'What support do you need?',
      ],
      duration: 600,
    },
  ],
  strengths: ['Structured and easy to learn', 'Promotes self-discovery', 'Creates clear action plans', 'Versatile across contexts'],
  bestFor: ['Goal setting', 'Problem solving', 'Career planning', 'Performance improvement'],
  limitations: ['Can feel mechanical if overused', 'Less effective for deep emotional issues', 'May skip important context'],
};

export const CLEAR: Methodology = {
  id: 'CLEAR',
  name: 'CLEAR Model',
  description: 'A holistic coaching model that emphasizes context, exploration, and action with emotional intelligence.',
  steps: [
    {
      id: 'context',
      name: 'Context',
      description: 'Establish the broader context and framework for the conversation.',
      prompts: [
        'Let\'s set the context for our conversation. What\'s the bigger picture?',
        'How does this issue relate to your broader goals and values?',
        'What\'s happening in your environment that might be relevant?',
        'What timeframe are we working with?',
      ],
      duration: 480,
    },
    {
      id: 'listen',
      name: 'Listen',
      description: 'Deep listening to understand the coachee\'s perspective fully.',
      prompts: [
        'Tell me more about your experience.',
        'How does this make you feel?',
        'What does this situation mean to you?',
        'Can you share a specific example?',
      ],
      duration: 600,
    },
    {
      id: 'explore',
      name: 'Explore',
      description: 'Explore the issue from multiple angles and perspectives.',
      prompts: [
        'What are the different ways to look at this?',
        'What might you be missing or not seeing?',
        'How might others involved view this situation?',
        'What assumptions are you making?',
      ],
      duration: 720,
    },
    {
      id: 'action',
      name: 'Action',
      description: 'Co-create specific, actionable steps forward.',
      prompts: [
        'What one small step could you take this week?',
        'What would be the most impactful action?',
        'How will you overcome potential obstacles?',
        'Who can support you in this?',
      ],
      duration: 480,
    },
    {
      id: 'review',
      name: 'Review',
      description: 'Review insights and establish accountability for follow-through.',
      prompts: [
        'What are your key takeaways from this conversation?',
        'How will you apply these insights?',
        'When should we check in on your progress?',
        'What support do you need going forward?',
      ],
      duration: 300,
    },
  ],
  strengths: ['Emotionally intelligent approach', 'Builds strong rapport', 'Addresses root causes', 'Balances support with challenge'],
  bestFor: ['Career transitions', 'Leadership development', 'Work-life balance', 'Relationship management'],
  limitations: ['Takes longer than GROW', 'Requires high level of coach skill', 'Can be too unstructured for some'],
};

export const COACHING_WHEEL: Methodology = {
  id: 'coaching-wheel',
  name: 'Coaching Wheel',
  description: 'An integrated framework that balances thinking, feeling, doing, and being across four quadrants of personal and professional development.',
  steps: [
    {
      id: 'thinking',
      name: 'Thinking',
      description: 'Explore the cognitive dimension — thoughts, beliefs, and mental models.',
      prompts: [
        'What are you thinking about this situation?',
        'What beliefs might be limiting you?',
        'How could you reframe this challenge?',
        'What story are you telling yourself?',
      ],
      duration: 600,
    },
    {
      id: 'feeling',
      name: 'Feeling',
      description: 'Explore the emotional dimension — feelings, intuitions, and emotional intelligence.',
      prompts: [
        'How does this make you feel?',
        'What emotions are coming up for you?',
        'What is your intuition telling you?',
        'How might these emotions be serving you?',
      ],
      duration: 600,
    },
    {
      id: 'doing',
      name: 'Doing',
      description: 'Explore the behavioral dimension — actions, habits, and patterns.',
      prompts: [
        'What are you currently doing?',
        'What behaviors are helping or hindering you?',
        'What new action could you try?',
        'What would a different approach look like?',
      ],
      duration: 600,
    },
    {
      id: 'being',
      name: 'Being',
      description: 'Explore the identity dimension — values, purpose, and self-concept.',
      prompts: [
        'Who do you want to be in this situation?',
        'What values are most important to you here?',
        'What does this situation say about who you are?',
        'How does this align with your deeper purpose?',
      ],
      duration: 600,
    },
  ],
  strengths: ['Holistic approach', 'Addresses all dimensions of being', 'Integrates head, heart, and hand', 'Deepens self-awareness'],
  bestFor: ['Leadership development', 'Personal transformation', 'Career reinvention', 'Values alignment'],
  limitations: ['Complex and requires experience', 'Can be overwhelming', 'Needs commitment from coachee'],
};

export const OSCAR: Methodology = {
  id: 'OSCAR',
  name: 'OSCAR Model',
  description: 'A solution-focused coaching model that concentrates on the desired future and practical steps to achieve it.',
  steps: [
    { id: 'outcome', name: 'Outcome', description: 'Define the desired future state.', prompts: ['What do you want?', 'What would the ideal future look like?', 'Describe your desired outcome clearly.'], duration: 480 },
    { id: 'scaling', name: 'Scaling', description: 'Assess current position on a scale.', prompts: ['On a scale of 1-10, where are you now?', 'What would a 10/10 look like?', 'What\'s keeping you at your current score?'], duration: 480 },
    { id: 'counting', name: 'Counting', description: 'Identify what is already working.', prompts: ['What have you already tried?', 'What successes can you build on?', 'What resources are already available?'], duration: 480 },
    { id: 'actions', name: 'Actions', description: 'Define specific next steps.', prompts: ['What small step would move you forward?', 'What would make the biggest impact?', 'When will you take this action?'], duration: 480 },
    { id: 'review', name: 'Review', description: 'Commit to review and accountability.', prompts: ['When will you review progress?', 'How will you measure success?', 'What support do you need?'], duration: 240 },
  ],
  strengths: ['Positive and solution-focused', 'Quick to implement', 'Builds confidence through small wins'],
  bestFor: ['Performance improvement', 'Quick wins', 'Building momentum'],
  limitations: ['May avoid deeper issues', 'Can feel superficial', 'Less effective for complex problems'],
};

export const FRAME: Methodology = {
  id: 'FRAME',
  name: 'FRAME Model',
  description: 'A cognitive reframing approach that helps coachees shift perspectives and find new meaning in challenges.',
  steps: [
    { id: 'focus', name: 'Focus', description: 'Identify the specific issue to address.', prompts: ['What issue would you like to focus on?', 'When does this issue most often arise?', 'What triggers this situation?'], duration: 480 },
    { id: 'reframe', name: 'Reframe', description: 'Explore alternative perspectives.', prompts: ['How else could you view this?', 'What\'s another interpretation?', 'How would someone else see this?'], duration: 600 },
    { id: 'action', name: 'Action', description: 'Choose a new behavior or approach.', prompts: ['What new action could you take?', 'What would support this new perspective?', 'How will you practice this?'], duration: 480 },
    { id: 'meaning', name: 'Meaning', description: 'Connect to deeper purpose and values.', prompts: ['What does this mean for you?', 'How does this align with your values?', 'What\'s the deeper learning here?'], duration: 480 },
    { id: 'evolution', name: 'Evolution', description: 'Plan for ongoing growth and development.', prompts: ['How will you sustain this change?', 'What support do you need?', 'How will you know you\'ve evolved?'], duration: 300 },
  ],
  strengths: ['Powerful for mindset shifts', 'Addresses limiting beliefs', 'Connects to deeper purpose'],
  bestFor: ['Mindset change', 'Overcoming obstacles', 'Career transitions'],
  limitations: ['Requires willingness to be vulnerable', 'May bring up difficult emotions', 'Takes time to integrate'],
};

const METHODOLOGIES: Record<CoachingMethodology, Methodology> = {
  GROW,
  CLEAR,
  'coaching-wheel': COACHING_WHEEL,
  OSCAR,
  FRAME,
};

export function getMethodology(id: CoachingMethodology): Methodology {
  return METHODOLOGIES[id];
}

export function getAllMethodologies(): Methodology[] {
  return Object.values(METHODOLOGIES);
}

export function getMethodologyForFocus(focus: string): CoachingMethodology {
  const mapping: Record<string, CoachingMethodology> = {
    leadership: 'coaching-wheel',
    'career-transition': 'CLEAR',
    performance: 'GROW',
    communication: 'FRAME',
    'strategic-thinking': 'GROW',
    'emotional-intelligence': 'coaching-wheel',
  };
  return mapping[focus] ?? 'GROW';
}

export function getStepIndex(methodology: CoachingMethodology, stepId: string): number {
  const m = getMethodology(methodology);
  return m.steps.findIndex(s => s.id === stepId);
}

export function getCurrentStep(methodology: CoachingMethodology, completedSteps: string[]): MethodologyStep {
  const m = getMethodology(methodology);
  for (const step of m.steps) {
    if (!completedSteps.includes(step.id)) return step;
  }
  return m.steps[m.steps.length - 1];
}

export function generatePrompt(methodology: CoachingMethodology, stepId: string, coacheeContext?: string): string {
  const m = getMethodology(methodology);
  const step = m.steps.find(s => s.id === stepId);
  if (!step) return 'Let\'s explore what\'s on your mind.';
  const prompts = step.prompts;
  const idx = coacheeContext ? (coacheeContext.length % prompts.length) : 0;
  return prompts[idx] ?? prompts[0];
}

export function getProgress(methodology: CoachingMethodology, completedSteps: string[]): { percent: number; currentStep: MethodologyStep; nextStep: MethodologyStep | null } {
  const m = getMethodology(methodology);
  const totalSteps = m.steps.length;
  const completedCount = completedSteps.length;
  const percent = Math.round((completedCount / totalSteps) * 100);
  const currentStep = getCurrentStep(methodology, completedSteps);
  const currentIdx = m.steps.findIndex(s => s.id === currentStep.id);
  const nextStep = currentIdx < totalSteps - 1 ? m.steps[currentIdx + 1] : null;
  return { percent, currentStep, nextStep };
}

export function getMethodologyComparison(): { id: CoachingMethodology; name: string; bestFor: string[]; timeToComplete: string }[] {
  return getAllMethodologies().map(m => ({
    id: m.id,
    name: m.name,
    bestFor: m.bestFor,
    timeToComplete: `${Math.round(m.steps.reduce((s, st) => s + st.duration, 0) / 60)} min`,
  }));
}

export function adaptMethodologyResponse(
  methodology: CoachingMethodology,
  stepId: string,
  coacheeInput: string,
): { prompt: string; reflection: string; challenge: string | null } {
  const m = getMethodology(methodology);
  const step = m.steps.find(s => s.id === stepId);
  if (!step) return { prompt: 'Tell me more.', reflection: '', challenge: null };
  const lowerInput = coacheeInput.toLowerCase();
  let reflection = '';
  let challenge: string | null = null;
  if (lowerInput.includes('feel') || lowerInput.includes('frustrat') || lowerInput.includes('stressed')) {
    reflection = 'I hear you\'re feeling some strong emotions around this. That\'s important data.';
    challenge = 'What would it look like to channel this energy constructively?';
  } else if (lowerInput.includes('think') || lowerInput.includes('believe') || lowerInput.includes('idea')) {
    reflection = 'You\'re doing some thoughtful analysis here. Let\'s build on that.';
    challenge = 'What\'s one belief you hold that might be limiting you?';
  } else {
    reflection = 'Thanks for sharing. Let\'s go deeper into this.';
  }
  const prompt = generatePrompt(methodology, stepId, coacheeInput);
  return { prompt, reflection, challenge };
}
