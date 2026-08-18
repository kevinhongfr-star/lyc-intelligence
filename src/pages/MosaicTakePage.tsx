// ═══════════════════════════════════════════════════════════
// MOSAIC Take Page — 25-question, 4-dimension, score-only flow.
// Brand: violet accent "#7C3AED", zero border radius,
// "complimentary assessment" language (never "free").
// ═══════════════════════════════════════════════════════════
import { AssessmentFlow, type AssessmentFlowConfig, type AssessmentQuestion } from '@/components/assessment/flow';
import { scoreAssessment } from '@/services/assessmentEngine';
import { DIMENSIONS as MOSAIC_DIMENSIONS } from '@/services/questions/mosaic';

const ACCENT = '#7C3AED';

const flowQuestions: AssessmentQuestion[] = MOSAIC_DIMENSIONS.flatMap((dim) =>
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
  code: 'MOSAIC',
  name: 'MOSAIC',
  accent: ACCENT,
  prefix: 'mosaic-take',
  resultsPath: '/assessment/mosaic/results',
  landingPath: '/assessment/mosaic',
  intro: {
    title: 'MOSAIC — Cross-Border Partnership Intelligence',
    body: 'You will answer 25 questions across four dimensions of cross-border partnership capability: Institutional Trust, Relationship Velocity, Normative Flexibility, and Conflict Resolution. Answer from your actual practice.',
    duration: '~8 minutes',
    expectations: [
      '25 questions across Institutional Trust, Relationship Velocity, Normative Flexibility, and Conflict Resolution',
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
        'assessment_answers_MOSAIC_latest',
        JSON.stringify(numericAnswers),
      );
      const out = await scoreAssessment('MOSAIC', numericAnswers, { persist: false });
      if (out.ok && out.persisted_id) {
        return { resultId: out.persisted_id };
      }
    } catch (e) {
      console.warn('[MosaicTakePage] client-side scoring fell back to session-only:', e);
    }
    return { resultId: null };
  },
  questions: flowQuestions,
};

export function MosaicTakePage() {
  return <AssessmentFlow config={config} />;
}

export default MosaicTakePage;
