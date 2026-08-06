import { v1Client } from '@/hooks/v1/v1Client';
import type { QualityDimensionId } from '@/components/nexus/QualityScoreCard';

export interface QualityDimensionScore {
  id: QualityDimensionId;
  label: string;
  score: number;
}

export interface QualityImprovement {
  id: string;
  text: string;
  dimension: QualityDimensionId;
  priority: 'low' | 'medium' | 'high';
}

export interface QualityScoreData {
  overallScore: number;
  letterGrade: string;
  dimensions: QualityDimensionScore[];
  improvements: QualityImprovement[];
  sessionId: string;
  timestamp: string;
}

export interface QualityHistoryPoint {
  date: string;
  score: number;
  letterGrade: string;
}

export interface MilestoneItem {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  dueDate?: string;
  completedDate?: string;
  framework?: string;
}

export type TrustTier = 'cold' | 'warm' | 'trusted' | 'veteran';

export interface TrustLevelData {
  tier: TrustTier;
  score: number;
  sessionsCount: number;
  lastActiveDate: string;
  progressionDate?: string;
}

export interface ReflectionScores {
  surfaceLevel: number;
  depthLevel: number;
  transformativeLevel: number;
  overallDepth: number;
  suggestions: string[];
}

export async function fetchQualityScore(
  sessionId: string,
): Promise<QualityScoreData> {
  return v1Client.get<QualityScoreData>(`/quality/sessions/${sessionId}`);
}

export async function fetchQualityHistory(
  userId: string,
): Promise<QualityHistoryPoint[]> {
  return v1Client.get<QualityHistoryPoint[]>(`/quality/users/${userId}/history`);
}

export async function fetchDiagnosticState(
  sessionId: string,
): Promise<{
  dimensions: Array<{ id: string; label: string; status: string }>;
  coverage: number;
  activeSuggestion?: string;
}> {
  return v1Client.get(`/quality/sessions/${sessionId}/diagnostic`);
}

export async function fetchMilestones(
  userId: string,
): Promise<MilestoneItem[]> {
  return v1Client.get<MilestoneItem[]>(`/quality/users/${userId}/milestones`);
}

export async function fetchTrustLevel(
  userId: string,
): Promise<TrustLevelData> {
  return v1Client.get<TrustLevelData>(`/quality/users/${userId}/trust`);
}

export async function fetchReflectionDepth(
  sessionId: string,
): Promise<ReflectionScores> {
  return v1Client.get<ReflectionScores>(`/quality/sessions/${sessionId}/reflection`);
}