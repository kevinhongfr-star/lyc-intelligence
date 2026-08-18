// ═══════════════════════════════════════════════════════════
// COACH Take Page — 26-question, 4-dimension, score-only flow.
// Brand: emerald-green accent "#059669", zero border radius,
// "complimentary assessment" language (never "free").
// ═══════════════════════════════════════════════════════════
import { AssessmentFlow, type AssessmentFlowConfig, type AssessmentQuestion } from '@/components/assessment/flow';
import { scoreAssessment } from '@/services/assessmentEngine';
import { DIMENSIONS as COACH_DIMENSIONS } from '@/services/questions/coach';

const ACCENT = '#059669';

const flowQuestions: AssessmentQuestion[] = COACH_DIMENSIONS.flatMap((dim) =>
  dim.questions.map((q) => ({
    id: q.id,
    type: 'likert' as const,
    dimension: dim.id,
    text: q.text,
    scaleLabels: ['Strongly disagree', 'Strongly agree'] as [string, string],
    scaleMin: 1,
    scaleMax: 5,
  })),
);

const config: AssessmentFlowConfig = {
  code: 'COACH',
  name: 'COACH',
  accent: ACCENT,
  prefix: 'coach-take',
  resultsPath: '/assessment/coach/results',
  landingPath: '/assessment/coach',
  intro: {
    title: 'COACH — Coaching Readiness Assessment',
    body: 'You will answer 26 questions across the four pillars of a coaching leader: Coach Mindset, Coach Skillset, Coach Toolkit, and Coach Discipline. Answer from your actual day-to-day management practice.',
    duration: '~8 minutes',
    expectations: [
      '26 questions across Mindset, Skillset, Toolkit, and Discipline',
      '1–5 Likert scale — answer honestly; some items are reverse-worded on purpose',
      'Your progress auto-saves to this device; resume if interrupted',
      'On completion: composite score, 4-dimension scorecard, and development priorities',
    ],
  },
  onSubmit: async (answers) => {
    try {
      const numericAnswers: Record<string, number> = {};
      for (const [qid, val] of Object.entries(answers)) {
        if (typeof val === 'number') numericAnswers[qid] = val;
      }
      sessionStorage.setItem(
        'assessment_answers_COACH_latest',
        JSON.stringify(numericAnswers),
      );
      const out = await scoreAssessment('COACH', numericAnswers, { persist: false });
      if (out.ok && out.persisted_id) {
        return { resultId: out.persisted_id };
      }
    } catch (e) {
      console.warn('[CoachTakePage] client-side scoring fell back to session-only:', e);
    }
    return { resultId: null };
  },
  questions: flowQuestions,
};

export function CoachTakePage() {
  return <AssessmentFlow config={config} />;
}

export default CoachTakePage;
