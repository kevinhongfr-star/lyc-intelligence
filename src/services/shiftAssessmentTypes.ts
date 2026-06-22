// SHIFT Assessment Types and Configuration

export type SHIFTAssessmentType = 'LEAP' | 'QUEST' | 'DRIVE' | 'COACH' | 'IMPACT';

export interface SHIFTAssessmentConfig {
  type: SHIFTAssessmentType;
  name: string;
  purpose: string;
  credits: number;
  dimensions: SHIFTDimension[];
}

export interface SHIFTDimension {
  id: string;
  name: string;
  description: string;
  question: string;
  scaleMin: number;
  scaleMax: number;
  scaleLabels: string[];
  evidencePrompt: string;
}

export interface SHIFTIntake {
  gate: {
    name: string;
    email: string;
    title?: string;
    company?: string;
    country?: string;
  };
  context: {
    role: string;
    industry: string;
    years_experience: number;
    challenges: string;
    improvement_goals: string;
  };
  dimensions: Record<string, number>; // dimensionId → score (1-10)
  evidence: Record<string, string>; // dimensionId → evidence text
  crossBorder: {
    cultural_experience: boolean;
    international_teams: number;
    global_projects: string;
  };
  style: {
    disc_profile: 'D' | 'I' | 'S' | 'C' | null;
    work_style: string;
  };
  goals: {
    short_term: string;
    long_term: string;
    success_definition: string;
  };
}

export interface SHIFTAnalysisResult {
  dimension_scores: Record<string, number>; // 0-100
  strengths: Array<{ strength: string; evidence: string }>;
  development_areas: Array<{ area: string; example: string }>;
  recommendations: string[];
  composite_score: number;
  archetype: string;
  confidence: number;
}

// SHIFT Assessment Configurations

export const SHIFT_CONFIGS: Record<SHIFTAssessmentType, SHIFTAssessmentConfig> = {
  LEAP: {
    type: 'LEAP',
    name: 'Learning & Execution Potential',
    purpose: 'Strategic clarity',
    credits: 3,
    dimensions: [
      {
        id: 'strategic_thinking',
        name: 'Strategic Thinking',
        description: 'Ability to see the big picture and set direction',
        question: 'How would you rate your strategic thinking capability?',
        scaleMin: 1,
        scaleMax: 10,
        scaleLabels: ['Reactive', 'Developing', 'Competent', 'Strong', 'Expert'],
        evidencePrompt: 'Describe a time when you set a strategic direction that drove significant results.',
      },
      {
        id: 'execution_speed',
        name: 'Execution Speed',
        description: 'Ability to move from idea to implementation quickly',
        question: 'How quickly do you typically move from strategy to execution?',
        scaleMin: 1,
        scaleMax: 10,
        scaleLabels: ['Slow', 'Moderate', 'Average', 'Fast', 'Exceptional'],
        evidencePrompt: 'Describe a project where you executed rapidly and the outcomes achieved.',
      },
      {
        id: 'learning_agility',
        name: 'Learning Agility',
        description: 'Ability to learn from experience and apply new knowledge',
        question: 'How do you rate your ability to learn and adapt from new situations?',
        scaleMin: 1,
        scaleMax: 10,
        scaleLabels: ['Resistant', 'Slow', 'Average', 'Quick', 'Exceptional'],
        evidencePrompt: 'Describe a situation where you had to learn something new quickly and apply it.',
      },
    ],
  },
  QUEST: {
    type: 'QUEST',
    name: 'Questioning & Inquiry Skills',
    purpose: 'Inquiry capability',
    credits: 3,
    dimensions: [
      {
        id: 'curiosity_level',
        name: 'Curiosity Level',
        description: 'Natural drive to explore and understand',
        question: 'How would you rate your natural curiosity and drive to explore?',
        scaleMin: 1,
        scaleMax: 10,
        scaleLabels: ['Low', 'Moderate', 'Average', 'High', 'Exceptional'],
        evidencePrompt: 'Describe how your curiosity led to a significant discovery or improvement.',
      },
      {
        id: 'inquiry_depth',
        name: 'Inquiry Depth',
        description: 'Ability to ask probing, meaningful questions',
        question: 'How deeply do you typically probe when investigating issues?',
        scaleMin: 1,
        scaleMax: 10,
        scaleLabels: ['Surface', 'Moderate', 'Average', 'Deep', 'Exceptional'],
        evidencePrompt: 'Describe a time when deep questioning led to breakthrough insights.',
      },
      {
        id: 'open_ended_questioning',
        name: 'Open-Ended Questioning',
        description: 'Skill in asking questions that open up possibilities',
        question: 'How skilled are you at asking open-ended questions that expand thinking?',
        scaleMin: 1,
        scaleMax: 10,
        scaleLabels: ['Closed', 'Developing', 'Average', 'Skilled', 'Master'],
        evidencePrompt: 'Describe how open-ended questioning improved a decision or outcome.',
      },
    ],
  },
  DRIVE: {
    type: 'DRIVE',
    name: 'Driving Change & Results',
    purpose: 'Change management',
    credits: 3,
    dimensions: [
      {
        id: 'results_orientation',
        name: 'Results Orientation',
        description: 'Focus on achieving measurable outcomes',
        question: 'How strongly are you oriented toward achieving tangible results?',
        scaleMin: 1,
        scaleMax: 10,
        scaleLabels: ['Process-focused', 'Balanced', 'Results-aware', 'Results-driven', 'Exceptional'],
        evidencePrompt: 'Describe a time when your results focus drove exceptional outcomes.',
      },
      {
        id: 'change_tolerance',
        name: 'Change Tolerance',
        description: 'Comfort with ambiguity and change',
        question: 'How comfortable are you with ambiguity and organizational change?',
        scaleMin: 1,
        scaleMax: 10,
        scaleLabels: ['Resistant', 'Tolerant', 'Accepting', 'Embracing', 'Leading'],
        evidencePrompt: 'Describe how you navigated a significant organizational change.',
      },
      {
        id: 'persistence',
        name: 'Persistence',
        description: 'Ability to sustain effort through challenges',
        question: 'How persistent are you when facing obstacles?',
        scaleMin: 1,
        scaleMax: 10,
        scaleLabels: ['Gives up easily', 'Moderate', 'Average', 'Persistent', 'Exceptional'],
        evidencePrompt: 'Describe a challenging situation where your persistence led to success.',
      },
    ],
  },
  COACH: {
    type: 'COACH',
    name: 'Coaching & Team Development',
    purpose: 'Team development',
    credits: 3,
    dimensions: [
      {
        id: 'team_development',
        name: 'Team Development',
        description: 'Ability to grow and develop team members',
        question: 'How effective are you at developing your team members?',
        scaleMin: 1,
        scaleMax: 10,
        scaleLabels: ['Minimal', 'Basic', 'Average', 'Strong', 'Exceptional'],
        evidencePrompt: 'Describe how you developed a team member who achieved significant growth.',
      },
      {
        id: 'feedback_quality',
        name: 'Feedback Quality',
        description: 'Skill in giving constructive, actionable feedback',
        question: 'How would you rate the quality of feedback you provide?',
        scaleMin: 1,
        scaleMax: 10,
        scaleLabels: ['Avoids', 'Basic', 'Average', 'Skilled', 'Master'],
        evidencePrompt: 'Describe a time when your feedback significantly improved someone\'s performance.',
      },
      {
        id: 'empathy',
        name: 'Empathy',
        description: 'Understanding and connecting with others\' perspectives',
        question: 'How would you rate your empathy and emotional intelligence?',
        scaleMin: 1,
        scaleMax: 10,
        scaleLabels: ['Low', 'Developing', 'Average', 'High', 'Exceptional'],
        evidencePrompt: 'Describe how empathy helped you resolve a difficult team situation.',
      },
    ],
  },
  IMPACT: {
    type: 'IMPACT',
    name: 'Impact Measurement & Accountability',
    purpose: 'Composite across all SHIFT',
    credits: 5,
    dimensions: [
      {
        id: 'accountability',
        name: 'Accountability',
        description: 'Taking ownership of outcomes and responsibilities',
        question: 'How strongly do you take ownership of outcomes?',
        scaleMin: 1,
        scaleMax: 10,
        scaleLabels: ['Deflects', 'Accepts', 'Owns', 'Models', 'Exceptional'],
        evidencePrompt: 'Describe a situation where you took accountability for a challenging outcome.',
      },
      {
        id: 'measurement_rigor',
        name: 'Measurement Rigor',
        description: 'Commitment to tracking and measuring impact',
        question: 'How rigorous are you in measuring outcomes and impact?',
        scaleMin: 1,
        scaleMax: 10,
        scaleLabels: ['Intuitive', 'Basic', 'Average', 'Rigorous', 'Exceptional'],
        evidencePrompt: 'Describe how measurement rigor improved decision-making in your organization.',
      },
      {
        id: 'strategic_thinking',
        name: 'Strategic Thinking (Composite)',
        description: 'From LEAP assessment',
        question: 'Rate your strategic thinking (from LEAP)',
        scaleMin: 1,
        scaleMax: 10,
        scaleLabels: ['Reactive', 'Developing', 'Competent', 'Strong', 'Expert'],
        evidencePrompt: 'Describe your strategic thinking approach and outcomes.',
      },
      {
        id: 'team_development',
        name: 'Team Development (Composite)',
        description: 'From COACH assessment',
        question: 'Rate your team development capability (from COACH)',
        scaleMin: 1,
        scaleMax: 10,
        scaleLabels: ['Minimal', 'Basic', 'Average', 'Strong', 'Exceptional'],
        evidencePrompt: 'Describe your team development approach and outcomes.',
      },
      {
        id: 'results_orientation',
        name: 'Results Orientation (Composite)',
        description: 'From DRIVE assessment',
        question: 'Rate your results orientation (from DRIVE)',
        scaleMin: 1,
        scaleMax: 10,
        scaleLabels: ['Process-focused', 'Balanced', 'Results-aware', 'Results-driven', 'Exceptional'],
        evidencePrompt: 'Describe your results orientation and outcomes.',
      },
    ],
  },
};

// Archetypes for SHIFT assessments
export const SHIFT_ARCHETYPES: Record<string, { name: string; description: string; strengths: string[]; development: string[] }> = {
  'Strategic Catalyst': {
    name: 'Strategic Catalyst',
    description: 'You combine strategic vision with rapid execution, driving change through clarity of purpose.',
    strengths: ['Strategic thinking', 'Execution speed', 'Change leadership'],
    development: ['Team development', 'Measurement rigor'],
  },
  'Inquiry Leader': {
    name: 'Inquiry Leader',
    description: 'You lead through questions, opening up possibilities and driving deeper understanding.',
    strengths: ['Curiosity', 'Inquiry depth', 'Open-ended questioning'],
    development: ['Execution speed', 'Accountability'],
  },
  'Results Driver': {
    name: 'Results Driver',
    description: 'You deliver outcomes consistently, persisting through challenges and embracing change.',
    strengths: ['Results orientation', 'Persistence', 'Change tolerance'],
    development: ['Strategic thinking', 'Empathy'],
  },
  'Development Champion': {
    name: 'Development Champion',
    description: 'You grow teams through feedback and empathy, building capability across the organization.',
    strengths: ['Team development', 'Feedback quality', 'Empathy'],
    development: ['Results orientation', 'Strategic thinking'],
  },
  'Impact Architect': {
    name: 'Impact Architect',
    description: 'You measure what matters and take accountability, creating lasting organizational impact.',
    strengths: ['Accountability', 'Measurement rigor', 'Strategic thinking'],
    development: ['Execution speed', 'Curiosity'],
  },
  'Balanced Leader': {
    name: 'Balanced Leader',
    description: 'You demonstrate balanced capability across multiple dimensions, adaptable to various contexts.',
    strengths: ['Versatility', 'Adaptability', 'Balance'],
    development: ['Depth in specific areas'],
  },
};

export function getSHIFTArchetype(scores: Record<string, number>): string {
  const sorted = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2);
  
  const topDimensions = sorted.map(([dim]) => dim);
  
  if (topDimensions.includes('strategic_thinking') && topDimensions.includes('execution_speed')) {
    return 'Strategic Catalyst';
  }
  if (topDimensions.includes('curiosity_level') || topDimensions.includes('inquiry_depth')) {
    return 'Inquiry Leader';
  }
  if (topDimensions.includes('results_orientation') || topDimensions.includes('persistence')) {
    return 'Results Driver';
  }
  if (topDimensions.includes('team_development') || topDimensions.includes('empathy')) {
    return 'Development Champion';
  }
  if (topDimensions.includes('accountability') || topDimensions.includes('measurement_rigor')) {
    return 'Impact Architect';
  }
  return 'Balanced Leader';
}

export function calculateSHIFTComposite(scores: Record<string, number>): number {
  const values = Object.values(scores);
  if (values.length === 0) return 0;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.round(avg * 10); // Convert 1-10 scale to 0-100
}