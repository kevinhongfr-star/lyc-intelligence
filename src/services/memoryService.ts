import { getSupabase } from './supabaseApi';
import type { Memory, MemoryType } from '../stores/memoryStore';

export interface MemoryContext {
  memories: Memory[];
  assessmentScores: AssessmentScore | null;
  documentSummaries: string[];
  userGoals: string[];
}

export interface AssessmentScore {
  id: string;
  archetype: string;
  composite_score: number;
  dimension_scores: Record<string, number>;
  adaptability_score: number;
  created_at: string;
}

export async function getMemoryContextForUser(userId: string): Promise<MemoryContext> {
  const sb = getSupabase();
  
  const [memoriesResult, assessmentResult] = await Promise.all([
    sb
      .from('memories')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(20),
    sb
      .from('assessments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
  ]);

  const memories = (memoriesResult.data || []) as Memory[];
  const assessmentScores = assessmentResult.data ? {
    id: assessmentResult.data.id,
    archetype: assessmentResult.data.archetype,
    composite_score: assessmentResult.data.composite_score,
    dimension_scores: JSON.parse(assessmentResult.data.scores || '{}'),
    adaptability_score: assessmentResult.data.adaptability_score || 0,
    created_at: assessmentResult.data.created_at
  } : null;

  const userGoals = memories
    .filter(m => m.memory_type === 'goal')
    .map(m => m.content);

  const documentSummaries: string[] = [];
  
  // Try to get document summaries if documents table exists
  try {
    const docsResult = await sb
      .from('documents')
      .select('name, summary')
      .eq('user_id', userId)
      .limit(5);
    
    if (!docsResult.error && docsResult.data) {
      docsResult.data.forEach((doc: any) => {
        if (doc.summary) {
          documentSummaries.push(`${doc.name}: ${doc.summary}`);
        }
      });
    }
  } catch (e) {
    // Documents table might not exist, ignore
  }

  return {
    memories,
    assessmentScores,
    documentSummaries,
    userGoals
  };
}

export function formatMemoryForInjection(memories: Memory[]): string {
  if (memories.length === 0) return 'No prior memory available.';

  const byType = memories.reduce((acc, m) => {
    if (!acc[m.memory_type]) acc[m.memory_type] = [];
    acc[m.memory_type].push(m);
    return acc;
  }, {} as Record<MemoryType, Memory[]>);

  const sections: string[] = [];

  if (byType.goal?.length) {
    sections.push(`**Career Goals:**\n${byType.goal.map(m => `- ${m.content}`).join('\n')}`);
  }
  if (byType.pain_point?.length) {
    sections.push(`**Challenges/Areas to Develop:**\n${byType.pain_point.map(m => `- ${m.content}`).join('\n')}`);
  }
  if (byType.strength?.length) {
    sections.push(`**Identified Strengths:**\n${byType.strength.map(m => `- ${m.content}`).join('\n')}`);
  }
  if (byType.insight?.length) {
    sections.push(`**Key Insights:**\n${byType.insight.map(m => `- ${m.content}`).join('\n')}`);
  }

  return sections.length > 0 
    ? `User Context (from previous conversations):\n${sections.join('\n\n')}`
    : 'No prior memory available.';
}

export function formatAssessmentForInjection(assessment: AssessmentScore | null): string {
  if (!assessment) return '';

  const date = new Date(assessment.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const dimensions = Object.entries(assessment.dimension_scores || {})
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');

  return `**Current Assessment Profile (as of ${date}):**
- Archetype: ${assessment.archetype}
- Overall Score: ${assessment.composite_score}/100
- Readiness: ${assessment.adaptability_score}/100
- Dimension Scores: ${dimensions || 'N/A'}`;
}

export async function extractGoalFromText(text: string): Promise<string | null> {
  // Simple pattern matching for goal-like statements
  const goalPatterns = [
    /(?:want|looking to|aiming to|planning to|hoping to|trying to)\s+(.+)/i,
    /(?:become|be)\s+(?:a\s+)?(.+?)(?:\s+by|\s+in|\s+within|$)/i,
    /(?:transition to|move to|shift to)\s+(.+?)(?:\s+by|\s+in|\s+within|$)/i,
  ];

  for (const pattern of goalPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return null;
}

export function getMemoryTypeLabel(type: MemoryType): string {
  const labels: Record<MemoryType, string> = {
    goal: 'Career Goal',
    pain_point: 'Challenge',
    strength: 'Strength',
    experience: 'Experience',
    preference: 'Preference',
    insight: 'Insight',
    assessment_note: 'Assessment Note',
    document_note: 'Document Note'
  };
  return labels[type] || type;
}

export function getMemoryTypeColor(type: MemoryType): string {
  const colors: Record<MemoryType, string> = {
    goal: '#10B981',        // green
    pain_point: '#F59E0B',  // amber
    strength: '#00897B',    // teal (replaced indigo)
    experience: '#06B6D4',  // cyan
    preference: '#EC4899',  // pink
    insight: '#8B5CF6',    // violet
    assessment_note: '#14B8A6', // teal
    document_note: '#F97316' // orange
  };
  return colors[type] || '#888888';
}
