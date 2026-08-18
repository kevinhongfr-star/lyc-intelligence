// ═══════════════════════════════════════════════════════════
// SPARK Take Page — canonical 27-question, 3-dimension, 4-archetype flow.
// X2-3: Real content ported from akira_source/spark/.
// Brand: AMBER accent, system serif headings, zero border radius,
// "complimentary assessment" language (never "free").
// ═══════════════════════════════════════════════════════════
import { AssessmentFlow, type AssessmentFlowConfig, type AssessmentQuestion } from '@/components/assessment/flow';
import { scoreAssessment } from '@/services/assessmentEngine';
import { AMBER } from '@/tokens';
import { DIMENSIONS as SPARK_DIMENSIONS } from '@/services/questions/spark';

// ── Flatten the canonical SPARK question bank into flow questions ──
// questions/spark.ts groups questions by dimension (D1/D2/D3). The flow
// needs a flat ordered list with each question tagged to its dimension.
const flowQuestions: AssessmentQuestion[] = SPARK_DIMENSIONS.flatMap((dim) =>
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
  code: 'SPARK',
  name: 'SPARK',
  accent: AMBER,
  prefix: 'spark-take',
  resultsPath: '/assessment/spark/results',
  landingPath: '/assessment/spark',
  intro: {
    title: 'SPARK — AI Leadership Readiness',
    body: 'You will answer 27 questions across three dimensions of AI leadership readiness: your individual adoption, your capability exposure, and your organisational preparedness. Answer as you actually operate today — not as you intend to.',
    duration: '~9 minutes',
    expectations: [
      '27 questions across Individual AI Adoption Readiness, Capability Exposure Assessment, and Organisational Preparedness',
      '1–5 Likert scale — answer honestly; some items are reverse-worded on purpose',
      'Your progress auto-saves to this device; resume if interrupted',
      'On completion: composite score, dimension scorecard, matched archetype, and development priorities',
    ],
  },
  onSubmit: async (answers) => {
    // Client-side scoring via the Akira engine — no backend round-trip
    // required for the complimentary assessment tier. Answers are stashed
    // in sessionStorage so the results page can re-score deterministically.
    try {
      const numericAnswers: Record<string, number> = {};
      for (const [qid, val] of Object.entries(answers)) {
        if (typeof val === 'number') numericAnswers[qid] = val;
      }
      sessionStorage.setItem(
        'assessment_answers_SPARK_latest',
        JSON.stringify(numericAnswers),
      );
      const out = await scoreAssessment('SPARK', numericAnswers, { persist: false });
      if (out.ok && out.persisted_id) {
        return { resultId: out.persisted_id };
      }
    } catch (e) {
      console.warn('[SparkTakePage] client-side scoring fell back to session-only:', e);
    }
    // No persisted id — results page will read from sessionStorage.
    return { resultId: null };
  },
  questions: flowQuestions,
};

export function SparkTakePage() {
  return <AssessmentFlow config={config} />;
}

export default SparkTakePage;
