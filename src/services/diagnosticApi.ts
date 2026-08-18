/**
 * diagnosticApi.ts — Assessment data service.
 *
 * #1341: Database tables are the runtime source of truth. localStorage
 * is used as offline cache / progressive enhancement, not the source of truth.
 *
 * Data flow:
 *   1. On assessment start: create attempt in assessment_attempts table
 *      (is_anonymous=true if not logged in)
 *   2. Each answer upserts to assessment_responses table
 *   3. localStorage mirrors for offline/fallback
 *   4. On submit: call scoring function → write to assessment_results +
 *      assessment_result_dimensions
 *   5. Results page reads from assessment_results JOIN assessment_result_dimensions
 *
 * Anonymous mode:
 *   - Results stored in localStorage only
 *   - Results expire after 7 days
 *   - "Create account to save your results" CTA on results page
 */

import { supabase } from '@/lib/supabase/client';
import { getDiagnostic } from '@/data/diagnostics';
import { scoreAttempt, type AnswerMap, type ScoringResult } from '@/services/diagnosticScoring';
import type {
  AssessmentAttempt,
  AssessmentResponse,
  AssessmentResult,
  AssessmentResultDimension,
} from '@/types/assessment';

const ANON_EXPIRY_DAYS = 7;
const LS_PREFIX = 'diagnostic_';

// ── Anonymous localStorage helpers ─────────────────────────────────

function lsKey(slug: string, suffix: string): string {
  return `${LS_PREFIX}${slug}_${suffix}`;
}

function saveAnonResult(slug: string, result: ScoringResult & { result_id: string }): void {
  const key = lsKey(slug, 'result');
  const data = { ...result, expires_at: Date.now() + ANON_EXPIRY_DAYS * 86400000 };
  localStorage.setItem(key, JSON.stringify(data));
}

function getAnonResult(slug: string): (ScoringResult & { result_id: string }) | null {
  const key = lsKey(slug, 'result');
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    if (data.expires_at && Date.now() > data.expires_at) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function saveAnonProgress(slug: string, answers: AnswerMap, currentIndex: number): void {
  const key = lsKey(slug, 'progress');
  localStorage.setItem(key, JSON.stringify({
    answers,
    currentIndex,
    startedAt: Date.now(),
    expires_at: Date.now() + ANON_EXPIRY_DAYS * 86400000,
  }));
}

function getAnonProgress(slug: string): { answers: AnswerMap; currentIndex: number } | null {
  const key = lsKey(slug, 'progress');
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    if (data.expires_at && Date.now() > data.expires_at) {
      localStorage.removeItem(key);
      return null;
    }
    return { answers: data.answers ?? {}, currentIndex: data.currentIndex ?? 0 };
  } catch {
    return null;
  }
}

function clearAnonProgress(slug: string): void {
  localStorage.removeItem(lsKey(slug, 'progress'));
}

// ── Attempt management ─────────────────────────────────────────────

export async function createAttempt(slug: string, userId: string | null): Promise<string> {
  // Anonymous: generate a UUID-like ID and store in localStorage
  if (!userId || !supabase) {
    const attemptId = `anon_${slug}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    return attemptId;
  }

  // Authenticated: create in DB
  const { data, error } = await supabase
    .from('assessment_attempts')
    .insert({
      assessment_id: slug,
      user_id: userId,
      status: 'in_progress',
      is_anonymous: false,
    })
    .select('attempt_id')
    .single();

  if (error || !data) {
    // Fallback to localStorage
    return `local_${slug}_${Date.now()}`;
  }

  return data.attempt_id;
}

export async function saveResponse(
  attemptId: string,
  questionKey: string,
  answer: unknown,
  slug: string,
  userId: string | null
): Promise<void> {
  // Anonymous or local fallback: localStorage
  if (!userId || !supabase || attemptId.startsWith('anon_') || attemptId.startsWith('local_')) {
    const progress = getAnonProgress(slug);
    const answers = progress?.answers ?? {};
    answers[questionKey] = answer as any;
    saveAnonProgress(slug, answers, progress?.currentIndex ?? 0);
    return;
  }

  // Authenticated: upsert to DB
  await supabase
    .from('assessment_responses')
    .upsert({
      attempt_id: attemptId,
      question_key: questionKey,
      answer: answer,
    }, { onConflict: 'attempt_id,question_key' });
}

export async function updateProgress(
  attemptId: string,
  currentQuestionKey: string | null,
  slug: string,
  userId: string | null,
  currentIndex: number
): Promise<void> {
  if (!userId || !supabase || attemptId.startsWith('anon_') || attemptId.startsWith('local_')) {
    const progress = getAnonProgress(slug);
    saveAnonProgress(slug, progress?.answers ?? {}, currentIndex);
    return;
  }

  await supabase
    .from('assessment_attempts')
    .update({ current_question_key: currentQuestionKey })
    .eq('attempt_id', attemptId);
}

export async function completeAttempt(
  attemptId: string,
  slug: string,
  userId: string | null,
  answers: AnswerMap
): Promise<{ resultId: string; result: ScoringResult }> {
  const definition = getDiagnostic(slug);
  if (!definition) throw new Error(`Unknown diagnostic: ${slug}`);

  const result = scoreAttempt(definition, answers);
  const resultId = `res_${slug}_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  // Anonymous: store in localStorage
  if (!userId || !supabase || attemptId.startsWith('anon_') || attemptId.startsWith('local_')) {
    saveAnonResult(slug, { ...result, result_id: resultId });
    clearAnonProgress(slug);
    return { resultId, result };
  }

  // Authenticated: write to DB
  // 1. Update attempt status
  await supabase
    .from('assessment_attempts')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('attempt_id', attemptId);

  // 2. Insert result
  const { data: resultData, error: resultError } = await supabase
    .from('assessment_results')
    .insert({
      attempt_id: attemptId,
      assessment_id: slug,
      user_id: userId,
      overall_score: result.overall_score,
      overall_level: result.overall_level,
      archetype_key: result.archetype_key,
      insights: result.insights,
      raw_data: { dimension_scores: result.dimension_scores },
    })
    .select('result_id')
    .single();

  const dbResultId = resultData?.result_id ?? resultId;

  // 3. Insert dimension scores
  if (resultData && !resultError) {
    const dimRows = result.dimension_scores.map((ds) => ({
      result_id: dbResultId,
      dimension_key: ds.dimension_key,
      score: ds.score,
      level: ds.level,
      dimension_name: ds.dimension_name,
      description: ds.description,
    }));
    await supabase.from('assessment_result_dimensions').insert(dimRows);
  }

  return { resultId: dbResultId, result };
}

// ── Result retrieval ───────────────────────────────────────────────

export async function getResult(
  resultId: string,
  slug: string,
  userId: string | null
): Promise<{ result: ScoringResult; resultId: string } | null> {
  // Anonymous: localStorage
  if (!userId || !supabase || resultId.startsWith('res_')) {
    const anon = getAnonResult(slug);
    if (anon && anon.result_id === resultId) {
      return { result: anon, resultId };
    }
    // Try any anon result for this slug
    if (anon) {
      return { result: anon, resultId: anon.result_id };
    }
    return null;
  }

  // Authenticated: read from DB
  const { data: resultRow, error } = await supabase
    .from('assessment_results')
    .select('*')
    .eq('result_id', resultId)
    .eq('user_id', userId)
    .single();

  if (error || !resultRow) return null;

  // Get dimension scores
  const { data: dimRows } = await supabase
    .from('assessment_result_dimensions')
    .select('*')
    .eq('result_id', resultId)
    .order('dimension_key');

  const dimension_scores = (dimRows ?? []).map((d) => ({
    dimension_key: d.dimension_key,
    dimension_name: d.dimension_name,
    score: d.score,
    level: d.level,
    description: d.description,
  }));

  // Get archetype name
  let archetype_name: string | null = null;
  if (resultRow.archetype_key) {
    const { data: arch } = await supabase
      .from('assessment_archetypes')
      .select('name')
      .eq('assessment_id', slug)
      .eq('archetype_key', resultRow.archetype_key)
      .single();
    archetype_name = arch?.name ?? null;
  }

  return {
    result: {
      overall_score: resultRow.overall_score,
      overall_level: resultRow.overall_level,
      dimension_scores,
      archetype_key: resultRow.archetype_key,
      archetype_name,
      insights: resultRow.insights ?? [],
    },
    resultId,
  };
}

// ── Resume support ─────────────────────────────────────────────────

export function resumeAnonAttempt(slug: string): { answers: AnswerMap; currentIndex: number } | null {
  return getAnonProgress(slug);
}
