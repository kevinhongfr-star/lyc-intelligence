import { AssessmentFlow, type AssessmentFlowConfig, type AssessmentQuestion } from '@/components/assessment/flow';
import { scoreAssessment } from '@/services/assessmentEngine';
import { DIMENSIONS as BRIDGE_DIMENSIONS } from '@/services/questions/bridge';

const INDIGO = '#1D4ED8';

const flowQuestions: AssessmentQuestion[] = BRIDGE_DIMENSIONS.flatMap((dim) =>
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
  code: 'BRIDGE',
  name: 'BRIDGE',
  accent: INDIGO,
  prefix: 'bridge-take',
  resultsPath: '/assessment/bridge/results',
  landingPath: '/assessment/bridge',
  intro: {
    title: 'BRIDGE — Cross-Border Mandate Readiness',
    body: 'You will answer 36 questions across six dimensions of APAC cross-border mandate readiness: mandate clarity, stakeholder navigation, communication alignment, pressure resilience, long-game thinking, and cultural fluency. Answer as you actually operate today — not as you intend to.',
    duration: '~12 minutes',
    expectations: [
      '36 questions across Mandate Clarity, Stakeholder Navigation, Communication Alignment, Pressure Resilience, Long-Game Thinking, and Cultural Fluency',
      '1–5 Likert scale — answer honestly; some items are reverse-worded on purpose',
      'Your progress auto-saves to this device; resume if interrupted',
      'On completion: composite score, dimension scorecard, matched mandate archetype, and targeted development priorities',
    ],
  },
  onSubmit: async (answers) => {
    try {
      const numericAnswers: Record<string, number> = {};
      for (const [qid, val] of Object.entries(answers)) {
        if (typeof val === 'number') numericAnswers[qid] = val;
      }
      sessionStorage.setItem(
        'assessment_answers_BRIDGE_latest',
        JSON.stringify(numericAnswers),
      );
      const out = await scoreAssessment('BRIDGE', numericAnswers, { persist: false });
      if (out.ok && out.persisted_id) {
        return { resultId: out.persisted_id };
      }
    } catch (e) {
      console.warn('[BridgeTakePage] client-side scoring fell back to session-only:', e);
    }
    return { resultId: null };
  },
  questions: flowQuestions,
};

export function BridgeTakePage() {
  return <AssessmentFlow config={config} />;
}

export default BridgeTakePage;
