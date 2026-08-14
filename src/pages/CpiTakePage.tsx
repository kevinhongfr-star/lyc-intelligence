// ═══════════════════════════════════════════════════════════
// CPI Take Page — Career Positioning Index (B2C single-rater port).
// X2-1: Flagship executive self-awareness assessment.
// 30 Likert questions across 6 dimensions (5 operational + 1 meta
// self-awareness). Multi-rater / teams version = separate B2B upsell.
// Brand: TEAL accent, system serif headings, zero border radius,
// "complimentary assessment" language (never "free"), "Executive
// Introduction" tier (never "free tier").
// ═══════════════════════════════════════════════════════════
import { AssessmentFlow, type AssessmentFlowConfig, type AssessmentQuestion } from '@/components/assessment/flow';
import { scoreAssessment } from '@/services/assessmentEngine';
import { TEAL } from '@/tokens';
import { DIMENSIONS as CPI_DIMENSIONS } from '@/services/questions/cpi';

// ── Flatten the canonical CPI question bank into flow questions ──
// questions/cpi.ts groups questions by dimension (D1–D6). The flow
// needs a flat ordered list with each question tagged to its dimension.
const flowQuestions: AssessmentQuestion[] = CPI_DIMENSIONS.flatMap((dim) =>
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
  code: 'CPI',
  name: 'CPI',
  accent: TEAL,
  prefix: 'cpi-take',
  resultsPath: '/assessment/cpi/results',
  landingPath: '/assessment/cpi',
  intro: {
    title: 'CPI — Career Positioning Index',
    body: 'You will answer 30 questions across six dimensions of executive positioning: Strategic Orientation, Cross-Border Adaptability, Stakeholder Influence, Execution Discipline, Leadership Presence, and the Self-Awareness Quotient meta-dimension. Answer as you actually operate today — not as you intend to.',
    duration: '~15 minutes',
    expectations: [
      '30 questions across six dimensions, including the Self-Awareness Quotient meta-dimension',
      '1–5 Likert scale — answer honestly; some items are reverse-worded on purpose',
      'Your progress auto-saves to this device; resume if interrupted',
      'On completion: composite 0–100 profile, six dimension verdicts, primary archetype, and development priorities',
      'The Executive Introduction tier includes one complimentary CPI baseline — multi-rater and consultant-debrief layers are separate offerings',
    ],
  },
  onSubmit: async (answers) => {
    // Client-side scoring via the Akira engine — no backend round-trip
    // required for the complimentary baseline. Answers are stashed in
    // sessionStorage so the results page can re-score deterministically.
    try {
      const numericAnswers: Record<string, number> = {};
      for (const [qid, val] of Object.entries(answers)) {
        if (typeof val === 'number') numericAnswers[qid] = val;
      }
      sessionStorage.setItem(
        'assessment_answers_CPI_latest',
        JSON.stringify(numericAnswers),
      );
      const out = await scoreAssessment('CPI', numericAnswers, { persist: false });
      if (out.ok && out.persisted_id) {
        return { resultId: out.persisted_id };
      }
    } catch (e) {
      console.warn('[CpiTakePage] client-side scoring fell back to session-only:', e);
    }
    return { resultId: null };
  },
  questions: flowQuestions,
};

export function CpiTakePage() {
  return <AssessmentFlow config={config} />;
}

export default CpiTakePage;
