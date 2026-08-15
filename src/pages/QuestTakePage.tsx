// ═══════════════════════════════════════════════════════════
// QUEST Take Page — 36-question, 6-dimension, 10-archetype flow.
// Brand: pink-rose accent "#BE185D", zero border radius,
// "complimentary assessment" language (never "free").
// ═══════════════════════════════════════════════════════════
import { AssessmentFlow, type AssessmentFlowConfig, type AssessmentQuestion } from '@/components/assessment/flow';
import { scoreAssessment } from '@/services/assessmentEngine';
import { DIMENSIONS as QUEST_DIMENSIONS } from '@/services/questions/quest';

const ACCENT = '#BE185D';

const flowQuestions: AssessmentQuestion[] = QUEST_DIMENSIONS.flatMap((dim) =>
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
  code: 'QUEST',
  name: 'QUEST',
  accent: ACCENT,
  prefix: 'quest-take',
  resultsPath: '/assessment/quest/results',
  landingPath: '/assessment/quest',
  intro: {
    title: 'QUEST — Executive Performance & Inquiry Rigour',
    body: 'You will answer 36 questions across six dimensions of executive capability: Strategic Thinking, Execution Excellence, Commercial Acumen, People Leadership, Adaptive Capacity, and AI Readiness. Answer as you actually operate today — not as you intend to.',
    duration: '~12 minutes',
    expectations: [
      '36 questions across Strategic Thinking, Execution Excellence, Commercial Acumen, People Leadership, Adaptive Capacity, and AI Readiness',
      '1–5 Likert scale — answer honestly; some items are reverse-worded on purpose',
      'Your progress auto-saves to this device; resume if interrupted',
      'On completion: composite score, 6-dimension scorecard, matched archetype (one of 10), and development priorities',
    ],
  },
  onSubmit: async (answers) => {
    try {
      const numericAnswers: Record<string, number> = {};
      for (const [qid, val] of Object.entries(answers)) {
        if (typeof val === 'number') numericAnswers[qid] = val;
      }
      sessionStorage.setItem(
        'assessment_answers_QUEST_latest',
        JSON.stringify(numericAnswers),
      );
      const out = await scoreAssessment('QUEST', numericAnswers, { persist: false });
      if (out.ok && out.persisted_id) {
        return { resultId: out.persisted_id };
      }
    } catch (e) {
      console.warn('[QuestTakePage] client-side scoring fell back to session-only:', e);
    }
    return { resultId: null };
  },
  questions: flowQuestions,
};

export function QuestTakePage() {
  return <AssessmentFlow config={config} />;
}

export default QuestTakePage;
