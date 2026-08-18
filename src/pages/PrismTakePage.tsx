// ═══════════════════════════════════════════════════════════
// PRISM Take Page — canonical 30-question, 5-dimension, 12-archetype flow.
// X2-3: Real content ported from akira_source/prism/.
// Brand: DS.accent (fuchsia), system serif headings, zero border radius,
// "complimentary assessment" language (never "free").
// ═══════════════════════════════════════════════════════════
import { AssessmentFlow, type AssessmentFlowConfig, type AssessmentQuestion } from '@/components/assessment/flow';
import { scoreAssessment } from '@/services/assessmentEngine';
import { DS } from '@/tokens';
import { DIMENSIONS as PRISM_DIMENSIONS } from '@/services/questions/prism';

const flowQuestions: AssessmentQuestion[] = PRISM_DIMENSIONS.flatMap((dim) =>
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
  code: 'PRISM',
  name: 'PRISM',
  accent: DS.accent,
  prefix: 'prism-take',
  resultsPath: '/assessment/prism/results',
  landingPath: '/assessment/prism',
  intro: {
    title: 'PRISM — Professional Brand Legibility Assessment',
    body: 'You will answer 30 questions across five dimensions of professional brand legibility: Brand Clarity, Market Legibility, Identity Consistency, Narrative Power, and Visibility Level. Answer as you actually operate today — not as you intend to.',
    duration: '~10 minutes',
    expectations: [
      '30 questions across Brand Clarity, Market Legibility, Identity Consistency, Narrative Power, and Visibility Level',
      '1–5 Likert scale — answer honestly; some items are reverse-worded on purpose',
      'Your progress auto-saves to this device; resume if interrupted',
      'On completion: composite score, dimension scorecard, matched archetype, and development priorities',
    ],
  },
  onSubmit: async (answers) => {
    try {
      const numericAnswers: Record<string, number> = {};
      for (const [qid, val] of Object.entries(answers)) {
        if (typeof val === 'number') numericAnswers[qid] = val;
      }
      sessionStorage.setItem(
        'assessment_answers_PRISM_latest',
        JSON.stringify(numericAnswers),
      );
      const out = await scoreAssessment('PRISM', numericAnswers, { persist: false });
      if (out.ok && out.persisted_id) {
        return { resultId: out.persisted_id };
      }
    } catch (e) {
      console.warn('[PrismTakePage] client-side scoring fell back to session-only:', e);
    }
    return { resultId: null };
  },
  questions: flowQuestions,
};

export function PrismTakePage() {
  return <AssessmentFlow config={config} />;
}

export default PrismTakePage;
