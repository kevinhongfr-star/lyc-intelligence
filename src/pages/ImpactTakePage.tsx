// ═══════════════════════════════════════════════════════════
// IMPACT Take Page — canonical 30-question, 5-dimension, 8-archetype flow.
// X2-4: Real content ported from akira_source/impact/.
// Team / board effectiveness framing — bridges individual leadership
// and organisational governance. Brand: FOREST_GREEN accent, system
// serif headings, zero border radius, "complimentary assessment" language.
// ═══════════════════════════════════════════════════════════
import { AssessmentFlow, type AssessmentFlowConfig, type AssessmentQuestion } from '@/components/assessment/flow';
import { scoreAssessment } from '@/services/assessmentEngine';
import { FOREST_GREEN } from '@/tokens';
import { DIMENSIONS as IMPACT_DIMENSIONS } from '@/services/questions/impact';

// ── Flatten the canonical IMPACT question bank into flow questions ──
// questions/impact.ts groups questions by dimension (D1–D5). The flow
// needs a flat ordered list with each question tagged to its dimension.
const flowQuestions: AssessmentQuestion[] = IMPACT_DIMENSIONS.flatMap((dim) =>
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
  code: 'IMPACT',
  name: 'IMPACT',
  accent: FOREST_GREEN,
  prefix: 'impact-take',
  resultsPath: '/assessment/impact/results',
  landingPath: '/assessment/impact',
  intro: {
    title: 'IMPACT — Board Effectiveness',
    body: 'You will answer 30 questions across five dimensions of board and organisational effectiveness: strategic oversight, governance rigour, stakeholder intelligence, mandate legacy, and APAC mandate credibility. Answer as you actually operate in the boardroom today — not as you intend to.',
    duration: '~15 minutes',
    expectations: [
      '30 questions across Strategic Oversight, Governance Rigour, Stakeholder Intelligence, Mandate Legacy, and APAC Mandate Credibility',
      '1–5 Likert scale — answer honestly; some items are reverse-worded on purpose',
      'Your progress auto-saves to this device; resume if interrupted',
      'On completion: composite mandate score, five dimension verdicts, board archetype, and development priorities',
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
        'assessment_answers_IMPACT_latest',
        JSON.stringify(numericAnswers),
      );
      const out = await scoreAssessment('IMPACT', numericAnswers, { persist: false });
      if (out.ok && out.persisted_id) {
        return { resultId: out.persisted_id };
      }
    } catch (e) {
      console.warn('[ImpactTakePage] client-side scoring fell back to session-only:', e);
    }
    // No persisted id — results page will read from sessionStorage.
    return { resultId: null };
  },
  questions: flowQuestions,
};

export function ImpactTakePage() {
  return <AssessmentFlow config={config} />;
}

export default ImpactTakePage;
