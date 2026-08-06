export type ReflectionDepth = 'surface' | 'specific' | 'reflective' | 'transformative';

export interface ReflectionBreakdown {
  specificity: number;
  selfAwareness: number;
  actionOrientation: number;
  emotionalAwareness: number;
  total: number;
}

const SPECIFICITY_MARKERS = [
  /\b(specific|exact|precise|particular|detailed|in detail)\b/i,
  /\b(i (usually|often|sometimes|always|never|tend to))\b/i,
  /\b(example|for instance|such as|like when|when i|i remember)\b/i,
  /\b(in (the|my) (past|previous|last) \d+|during|while|when)\b/i,
  /\b(\d{1,2}(st|nd|rd|th)?( grade| year| month| week| day)?|years? old)\b/i,
  /\b(i (worked|studied|lived|went|came|moved|started|finished))\b/i,
];

const SELF_AWARENESS_MARKERS = [
  /\b(i (realize|notice|see|recognize|understand|am aware|have come to see))\b/i,
  /\b(my (pattern|tendency|habit|way|style|approach|strength|weakness|issue|problem))\b/i,
  /\b(i (tend to|have a tendency to|am inclined to|typically))\b/i,
  /\b(what i (need|want|desire|wish|hope|crave) is)\b/i,
  /\b(i (am|feel) (stuck|lost|confused|frustrated|overwhelmed|tired|exhausted))\b/i,
  /\b(the (root|source|cause) (of|to) (my|the) (issue|problem|challenge|difficulty))\b/i,
];

const ACTION_MARKERS = [
  /\b(i (will|going to|plan to|intend to|want to|should|need to|must))\b/i,
  /\b(i (can|could|should|would|might) (try|attempt|work on|practice|implement|start))\b/i,
  /\b(my (next|first|immediate|action plan|plan of action|step) is)\b/i,
  /\b(i (am (going to|planning to|ready to)|will (start|begin|take|make)))\b/i,
  /\b(to (improve|fix|change|address|resolve|work on|develop|build))\b/i,
  /\b(strategy|approach|method|plan|action|step|first step|next step)\b/i,
];

const EMOTIONAL_MARKERS = [
  /\b(i (feel|felt|am feeling|have been feeling|experience))\b/i,
  /\b(happy|sad|angry|frustrated|anxious|worried|excited|nervous|calm|peaceful|overwhelmed|relieved|proud|ashamed|guilty|confident|insecure)\b/i,
  /\b(it makes me|i feel|i am|i'm) (feel|feel|very|so|really|quite|somewhat|slightly)?\s*(happy|sad|angry|frustrated|anxious|excited|nervous|calm|peaceful|overwhelmed|relieved|proud|ashamed|guilty|confident|insecure|lonely|connected|motivated|discouraged|hopeful|desperate)\b/i,
  /\b(i (enjoy|love|like|appreciate|value|cherish|dislike|hate|fear|dread|avoid))\b/i,
  /\b(emotion|feeling|feeling|mood|state of mind|mental state)\b/i,
  /\b(i (am|feel) (grateful|thankful|appreciative|hopeful|optimistic|pessimistic))\b/i,
];

export function scoreReflectionDepth(userResponse: string): ReflectionBreakdown {
  if (!userResponse || typeof userResponse !== 'string') {
    return { specificity: 0, selfAwareness: 0, actionOrientation: 0, emotionalAwareness: 0, total: 0 };
  }

  const text = userResponse.trim();
  if (!text) {
    return { specificity: 0, selfAwareness: 0, actionOrientation: 0, emotionalAwareness: 0, total: 0 };
  }

  const specificity = scoreDimension(text, SPECIFICITY_MARKERS);
  const selfAwareness = scoreDimension(text, SELF_AWARENESS_MARKERS);
  const actionOrientation = scoreDimension(text, ACTION_MARKERS);
  const emotionalAwareness = scoreDimension(text, EMOTIONAL_MARKERS);

  const total = specificity + selfAwareness + actionOrientation + emotionalAwareness;

  return { specificity, selfAwareness, actionOrientation, emotionalAwareness, total };
}

function scoreDimension(text: string, markers: RegExp[]): number {
  let count = 0;
  for (const marker of markers) {
    if (marker.test(text)) {
      count++;
    }
  }
  if (count === 0) return 0;
  if (count === 1) return 1;
  return 2;
}

export function getReflectionDepth(userResponse: string): ReflectionDepth {
  const breakdown = scoreReflectionDepth(userResponse);
  const total = breakdown.total;

  if (total <= 1) return 'surface';
  if (total <= 3) return 'specific';
  if (total <= 5) return 'reflective';
  return 'transformative';
}

const NEXT_LEVEL_PROMPTS: Record<ReflectionDepth, string[]> = {
  surface: [
    'Can you share a specific situation or example that illustrates this?',
    'Tell me more about what this looks like in your daily experience.',
    'What makes this situation particularly meaningful or challenging for you?',
  ],
  specific: [
    'What patterns do you notice in how you typically respond to these situations?',
    'How do you feel when this happens, and what do you think drives that reaction?',
    'What do you think might be the root cause of this pattern?',
  ],
  reflective: [
    'Based on what you\'ve shared, what is one small step you could take to address this?',
    'How might things be different if you approached this differently?',
    'What support or resources might help you move forward?',
  ],
  transformative: [
    'What would a measurable success look like for you in this area?',
    'How will you know when you\'ve achieved the change you want?',
    'What commitment can you make to yourself to sustain this progress?',
  ],
};

export function getReflectionPrompts(currentDepth: ReflectionDepth): string[] {
  return NEXT_LEVEL_PROMPTS[currentDepth] || NEXT_LEVEL_PROMPTS.surface;
}

export interface ReflectionTrend {
  depths: ReflectionDepth[];
  improving: boolean;
  averageDepth: number;
  trajectory: 'deepening' | 'stable' | 'shallowing';
}

const DEPTH_ORDER: ReflectionDepth[] = ['surface', 'specific', 'reflective', 'transformative'];

function depthToNumeric(depth: ReflectionDepth): number {
  return DEPTH_ORDER.indexOf(depth);
}

export function trackReflectionProgress(sessionResponses: string[]): ReflectionTrend {
  if (!sessionResponses || sessionResponses.length === 0) {
    return { depths: [], improving: false, averageDepth: 0, trajectory: 'stable' };
  }

  const depths = sessionResponses.map(r => getReflectionDepth(r));
  const numericDepths = depths.map(depthToNumeric);

  const averageDepth = numericDepths.reduce((sum, d) => sum + d, 0) / numericDepths.length;

  let improving = false;
  let trajectory: 'deepening' | 'stable' | 'shallowing' = 'stable';

  if (numericDepths.length >= 2) {
    const firstHalf = numericDepths.slice(0, Math.floor(numericDepths.length / 2));
    const secondHalf = numericDepths.slice(Math.floor(numericDepths.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const diff = secondAvg - firstAvg;

    if (diff > 0.3) {
      trajectory = 'deepening';
      improving = true;
    } else if (diff < -0.3) {
      trajectory = 'shallowing';
    } else {
      trajectory = 'stable';
    }
  }

  return { depths, improving, averageDepth, trajectory };
}
