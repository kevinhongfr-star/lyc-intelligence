export type ReflectionCategory = 'action' | 'insight' | 'challenge' | 'success' | 'emotion' | 'learning';

export type ReflectionDepth = 'surface' | 'actionable' | 'deep' | 'transformative';

export interface ReflectionPrompt {
  id: string;
  category: ReflectionCategory;
  prompt: string;
  depth: ReflectionDepth;
  context?: string;
}

export interface ReflectionEntry {
  id: string;
  coacheeId: string;
  sessionId: string | null;
  promptId: string;
  prompt: string;
  response: string;
  category: ReflectionCategory;
  depth: ReflectionDepth;
  createdAt: number;
  tags: string[];
  insights: string[];
  actionItems: string[];
}

const REFLECTION_PROMPTS: ReflectionPrompt[] = [
  { id: 'p1', category: 'action', prompt: 'What specific action will you take as a result of this session?', depth: 'actionable' },
  { id: 'p2', category: 'insight', prompt: 'What was the most valuable insight you gained today?', depth: 'deep' },
  { id: 'p3', category: 'challenge', prompt: 'What is one challenge you are still struggling with?', depth: 'surface' },
  { id: 'p4', category: 'success', prompt: 'What went well in this session, and how can you replicate it?', depth: 'actionable' },
  { id: 'p5', category: 'emotion', prompt: 'How did this session make you feel, and what emotions came up?', depth: 'surface' },
  { id: 'p6', category: 'learning', prompt: 'What did you learn about yourself from this conversation?', depth: 'deep' },
  { id: 'p7', category: 'action', prompt: 'What support do you need to follow through on your commitments?', depth: 'actionable' },
  { id: 'p8', category: 'insight', prompt: 'How will you apply what you learned to your current role?', depth: 'deep' },
  { id: 'p9', category: 'challenge', prompt: 'What\'s one question you wish we had more time to explore?', depth: 'surface' },
  { id: 'p10', category: 'success', prompt: 'Describe a moment from this session that felt like a breakthrough.', depth: 'transformative' },
  { id: 'p11', category: 'learning', prompt: 'How has your perspective shifted on the issue we discussed?', depth: 'transformative' },
  { id: 'p12', category: 'action', prompt: 'What\'s one small, daily habit you could adopt to reinforce this learning?', depth: 'actionable' },
];

export function getReflectionPrompts(category?: ReflectionCategory): ReflectionPrompt[] {
  if (!category) return REFLECTION_PROMPTS;
  return REFLECTION_PROMPTS.filter(p => p.category === category);
}

export function getPromptById(id: string): ReflectionPrompt | undefined {
  return REFLECTION_PROMPTS.find(p => p.id === id);
}

export function generateStructuredReflection(
  coacheeId: string,
  sessionId: string | null,
  response: string,
  selectedPromptIds: string[] = [],
): ReflectionEntry[] {
  const prompts = selectedPromptIds.length > 0
    ? selectedPromptIds.map(id => getPromptById(id)).filter(Boolean) as ReflectionPrompt[]
    : selectPrompts(response);
  const entries: ReflectionEntry[] = prompts.map(prompt => {
    const tailoredResponse = tailorResponseToPrompt(response, prompt);
    return {
      id: `reflection-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      coacheeId,
      sessionId,
      promptId: prompt.id,
      prompt: prompt.prompt,
      response: tailoredResponse,
      category: prompt.category,
      depth: prompt.depth,
      createdAt: Date.now(),
      tags: extractTags(tailoredResponse),
      insights: extractInsights(tailoredResponse),
      actionItems: extractActionItems(tailoredResponse),
    };
  });
  return entries;
}

export function getReflectionDepthScore(entry: ReflectionEntry): number {
  const depthScores: Record<ReflectionDepth, number> = {
    surface: 0.25,
    actionable: 0.5,
    deep: 0.75,
    transformative: 1.0,
  };
  let score = depthScores[entry.depth];
  if (entry.insights.length > 0) score += 0.1;
  if (entry.actionItems.length > 0) score += 0.1;
  if (entry.tags.length >= 2) score += 0.05;
  return Math.min(score, 1);
}

export function aggregateReflectionDepth(entries: ReflectionEntry[]): {
  averageDepth: number;
  deepestEntry: ReflectionEntry | null;
  distribution: Record<ReflectionDepth, number>;
  totalInsights: number;
  totalActions: number;
} {
  if (entries.length === 0) {
    return {
      averageDepth: 0,
      deepestEntry: null,
      distribution: { surface: 0, actionable: 0, deep: 0, transformative: 0 },
      totalInsights: 0,
      totalActions: 0,
    };
  }
  const scores = entries.map(getReflectionDepthScore);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const deepestIdx = scores.indexOf(Math.max(...scores));
  const distribution: Record<ReflectionDepth, number> = { surface: 0, actionable: 0, deep: 0, transformative: 0 };
  entries.forEach(e => { distribution[e.depth]++; });
  return {
    averageDepth: Math.round(avg * 100) / 100,
    deepestEntry: entries[deepestIdx],
    distribution,
    totalInsights: entries.reduce((s, e) => s + e.insights.length, 0),
    totalActions: entries.reduce((s, e) => s + e.actionItems.length, 0),
  };
}

function selectPrompts(response: string): ReflectionPrompt[] {
  const lowerResponse = response.toLowerCase();
  const scoredPrompts = REFLECTION_PROMPTS.map(prompt => {
    let score = 0;
    const categoryKeywords: Record<ReflectionCategory, string[]> = {
      action: ['will', 'action', 'do', 'plan', 'step', 'try', 'implement', 'execute'],
      insight: ['insight', 'realized', 'understand', 'see', 'learn', 'discover', 'awareness'],
      challenge: ['challenge', 'struggl', 'difficult', 'hard', 'issue', 'problem', 'block'],
      success: ['success', 'win', 'good', 'great', 'achieve', 'accomplish', 'breakthrough'],
      emotion: ['feel', 'emotion', 'frustrat', 'excited', 'happy', 'stressed', 'anxious'],
      learning: ['learn', 'grow', 'develop', 'change', 'transform', 'shift', 'perspective'],
    };
    const keywords = categoryKeywords[prompt.category];
    keywords.forEach(kw => { if (lowerResponse.includes(kw)) score += 1; });
    return { prompt, score };
  });
  scoredPrompts.sort((a, b) => b.score - a.score);
  return scoredPrompts.slice(0, 3).map(s => s.prompt);
}

function tailorResponseToPrompt(response: string, prompt: ReflectionPrompt): string {
  const segments: string[] = [];
  const lowerResponse = response.toLowerCase();
  const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const categorySentences: Record<ReflectionCategory, string[]> = {
    action: sentences.filter(s => /will|action|plan|step|do|try|implement/i.test(s)),
    insight: sentences.filter(s => /insight|realiz|understand|learn|discover|awareness/i.test(s)),
    challenge: sentences.filter(s => /challenge|struggl|difficult|hard|issue|problem|block/i.test(s)),
    success: sentences.filter(s => /success|win|good|great|achieve|breakthrough|progress/i.test(s)),
    emotion: sentences.filter(s => /feel|emotion|frustrat|excited|happy|stress|anxious|worry/i.test(s)),
    learning: sentences.filter(s => /learn|grow|develop|change|transform|shift|perspective/i.test(s)),
  };
  const relevant = categorySentences[prompt.category];
  if (relevant.length > 0) {
    segments.push(relevant.join('. ') + '.');
  } else {
    segments.push(sentences.slice(0, 2).join('. ') + '.');
  }
  segments.push(`\n\nFor prompt "${prompt.prompt.replace(/^/, '')}": Based on this reflection, the key takeaway is that ${extractCoreInsight(response).toLowerCase()}.`);
  return segments.join(' ');
}

function extractCoreInsight(response: string): string {
  const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 10);
  if (sentences.length === 0) return 'further reflection is needed';
  const longest = sentences.reduce((a, b) => a.length > b.length ? a : b);
  return longest.trim();
}

function extractTags(response: string): string[] {
  const tagKeywords = ['leadership', 'communication', 'strategy', 'teamwork', 'emotion', 'growth', 'career', 'performance', 'confidence', 'resilience'];
  const lower = response.toLowerCase();
  const tags: string[] = [];
  tagKeywords.forEach(kw => { if (lower.includes(kw)) tags.push(kw); });
  return tags.slice(0, 4);
}

function extractInsights(response: string): string[] {
  const insightPatterns = [
    /(?:i realize|i now understand|the key insight is|what i learned is|i discovered)/gi,
    /(?:this taught me|i can see that|it\'s clear that|i recognize that)/gi,
  ];
  const insights: string[] = [];
  const sentences = response.split(/[.!?]+/);
  sentences.forEach(s => {
    if (insightPatterns.some(p => p.test(s))) {
      insights.push(s.trim());
    }
  });
  if (insights.length === 0 && response.length > 50) {
    insights.push(response.split(/[.!?]+/).reduce((a, b) => a.length > b.length ? a : b, '').trim());
  }
  return insights.slice(0, 3);
}

function extractActionItems(response: string): string[] {
  const actionPattern = /(?:i will|i\'ll|i\'m going to|i plan to|i should|i need to|my next step is)/gi;
  const sentences = response.split(/[.!?]+/);
  const actions: string[] = [];
  sentences.forEach(s => {
    if (actionPattern.test(s)) {
      actions.push(s.trim());
    }
  });
  return actions.slice(0, 3);
}

export function getReflectionPromptsForSession(methodology: string, sessionFocus: string): ReflectionPrompt[] {
  const basePrompts = REFLECTION_PROMPTS;
  const methodologyPrompts: Record<string, string[]> = {
    GROW: ['p1', 'p2', 'p7', 'p8'],
    CLEAR: ['p2', 'p5', 'p6', 'p10'],
    'coaching-wheel': ['p5', 'p6', 'p10', 'p11'],
  };
  const focusPrompts: Record<string, string[]> = {
    leadership: ['p1', 'p3', 'p8'],
    'career-transition': ['p2', 'p6', 'p11'],
    performance: ['p1', 'p4', 'p12'],
  };
  const selectedIds = [
    ...(methodologyPrompts[methodology] ?? []),
    ...(focusPrompts[sessionFocus] ?? []),
  ];
  const uniqueIds = [...new Set(selectedIds)];
  return uniqueIds.map(id => getPromptById(id)).filter(Boolean) as ReflectionPrompt[];
}
