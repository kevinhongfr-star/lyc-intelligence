// ═══════════════════════════════════════════════════════════
// FORGE Take Page — canonical 36-question, 4-dimension, 4-quadrant flow.
// X2-3: Real content ported from akira_source/forge/.
// Brand: Teal (#0D9488) accent, system serif headings, zero border radius,
// "complimentary assessment" language (never "free").
// ═══════════════════════════════════════════════════════════
import { AssessmentFlow, type AssessmentFlowConfig, type AssessmentQuestion } from '@/components/assessment/flow';
import { scoreAssessment } from '@/services/assessmentEngine';
import { DIMENSIONS as FORGE_DIMENSIONS } from '@/services/questions/forge';

const TEAL = '#0D9488';

const flowQuestions: AssessmentQuestion[] = FORGE_DIMENSIONS.flatMap((dim) =>
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
  code: 'FORGE',
  name: 'FORGE',
  accent: TEAL,
  prefix: 'forge-take',
  resultsPath: '/assessment/forge/results',
  landingPath: '/assessment/forge',
  intro: {
    title: 'FORGE — Strengths Orientation Assessment',
    body: 'You will answer 36 questions across four dimensions of strengths orientation: Adaptive Learning, Three Forces Awareness, Development Agency, and Bilateral Context Navigation. Your responses map to a 2×2 strengths matrix: Selling Acumen vs. System Leadership. Answer as you actually operate today — not as you intend to.',
    duration: '~12 minutes',
    expectations: [
      '36 questions across Adaptive Learning Orientation, Three Forces Awareness, Development Agency, and Bilateral Context Navigation',
      '1–5 Likert scale — answer honestly; some items are reverse-worded on purpose',
      'Your progress auto-saves to this device; resume if interrupted',
      'On completion: composite score, dimension scorecard, matched 2×2 quadrant archetype, and development priorities',
    ],
  },
  onSubmit: async (answers) => {
    try {
      const numericAnswers: Record<string, number> = {};
      for (const [qid, val] of Object.entries(answers)) {
        if (typeof val === 'number') numericAnswers[qid] = val;
      }
      sessionStorage.setItem(
        'assessment_answers_FORGE_latest',
        JSON.stringify(numericAnswers),
      );
      const out = await scoreAssessment('FORGE', numericAnswers, { persist: false });
      if (out.ok && out.persisted_id) {
        return { resultId: out.persisted_id };
      }
    } catch (e) {
      console.warn('[ForgeTakePage] client-side scoring fell back to session-only:', e);
    }
    return { resultId: null };
  },
  questions: flowQuestions,
};

export function ForgeTakePage() {
  return <AssessmentFlow config={config} />;
}

export default ForgeTakePage;
