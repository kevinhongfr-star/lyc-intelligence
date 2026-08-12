/**
 * Assessment Progress Service — Ticket #1334
 *
 * Manages user assessment progress state via the user_assessment_progress table.
 * RLS enforces user-scoped access (users see only their own progress rows).
 */

import { getSupabase } from '@/services/supabaseApi';

// ── Types ────────────────────────────────────────────────────────

export type ProgressStatus = 'not_started' | 'in_progress' | 'completed' | 'abandoned';

export interface UserAssessmentProgress {
  id: string;
  user_id: string;
  assessment_code: string;
  assessment_id: string | null;
  status: ProgressStatus;
  current_question: number;
  total_questions: number;
  answers: Record<string, any>;
  started_at: string | null;
  completed_at: string | null;
  expires_at: string | null;
  miles_spent: number;
  result_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssessmentCatalogEntry {
  id: string;
  code: string;
  name: string;
  b2c_name: string | null;
  tagline: string | null;
  tier_group: string;
  tier_label: string | null;
  price_miles: number;
  pricing: any[];
  duration_minutes: number;
  total_questions: number;
  scale: string | null;
  version: string;
  dimensions: any[];
  archetypes: any[];
  composite_bands: any[];
  style_count: number;
  archetype_count: number;
  is_cpi: boolean;
  is_shift: boolean;
  is_advisory: boolean;
  is_published: boolean;
  sort_order: number;
}

// ── Public catalog (no auth required, RLS allows published reads) ──

export async function fetchPublishedAssessments(): Promise<AssessmentCatalogEntry[]> {
  const { data, error } = await getSupabase()
    .from('assessments')
    .select('*')
    .eq('is_published', true)
    .order('sort_order', { ascending: true });
  if (error) {
    console.error('[assessmentProgress] fetchPublishedAssessments error:', error);
    return [];
  }
  return (data || []) as AssessmentCatalogEntry[];
}

export async function fetchAssessmentByCode(code: string): Promise<AssessmentCatalogEntry | null> {
  const { data, error } = await getSupabase()
    .from('assessments')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_published', true)
    .maybeSingle();
  if (error || !data) return null;
  return data as AssessmentCatalogEntry;
}

// ── User progress (auth required, RLS enforces user_id = auth.uid()) ──

export async function getUserProgress(assessmentCode: string): Promise<UserAssessmentProgress | null> {
  const { data, error } = await getSupabase()
    .from('user_assessment_progress')
    .select('*')
    .eq('assessment_code', assessmentCode.toUpperCase())
    .maybeSingle();
  if (error || !data) return null;
  return data as UserAssessmentProgress;
}

export async function getAllUserProgress(): Promise<UserAssessmentProgress[]> {
  const { data, error } = await getSupabase()
    .from('user_assessment_progress')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) return [];
  return (data || []) as UserAssessmentProgress[];
}

export async function startAssessment(
  assessmentCode: string,
  totalQuestions: number,
  assessmentId?: string,
): Promise<UserAssessmentProgress | null> {
  const { data: existing } = await getSupabase()
    .from('user_assessment_progress')
    .select('*')
    .eq('assessment_code', assessmentCode.toUpperCase())
    .maybeSingle();

  if (existing) {
    // Resume if in_progress, otherwise reset
    if (existing.status === 'in_progress') return existing as UserAssessmentProgress;
  }

  const { data, error } = await getSupabase()
    .from('user_assessment_progress')
    .upsert({
      assessment_code: assessmentCode.toUpperCase(),
      assessment_id: assessmentId || null,
      status: 'in_progress',
      current_question: 0,
      total_questions: totalQuestions,
      answers: {},
      started_at: new Date().toISOString(),
      completed_at: null,
      miles_spent: 0,
    }, { onConflict: 'user_id,assessment_code' })
    .select()
    .single();

  if (error) {
    console.error('[assessmentProgress] startAssessment error:', error);
    return null;
  }
  return data as UserAssessmentProgress;
}

export async function saveAnswer(
  assessmentCode: string,
  questionId: string,
  answer: any,
  currentQuestion: number,
): Promise<boolean> {
  // Fetch current answers, merge, and update
  const progress = await getUserProgress(assessmentCode);
  if (!progress) return false;

  const updatedAnswers = { ...progress.answers, [questionId]: answer };
  const { error } = await getSupabase()
    .from('user_assessment_progress')
    .update({
      answers: updatedAnswers,
      current_question: currentQuestion,
      updated_at: new Date().toISOString(),
    })
    .eq('id', progress.id);

  return !error;
}

export async function completeAssessment(
  assessmentCode: string,
  resultId: string,
  milesSpent: number,
): Promise<boolean> {
  const { error } = await getSupabase()
    .from('user_assessment_progress')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      result_id: resultId,
      miles_spent: milesSpent,
    })
    .eq('assessment_code', assessmentCode.toUpperCase());

  return !error;
}

export async function abandonAssessment(assessmentCode: string): Promise<boolean> {
  const { error } = await getSupabase()
    .from('user_assessment_progress')
    .update({ status: 'abandoned' })
    .eq('assessment_code', assessmentCode.toUpperCase());
  return !error;
}
