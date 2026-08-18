import { AssessmentFlow, type AssessmentFlowConfig, type AssessmentQuestion } from '@/components/assessment/flow';
import { scoreAssessment } from '@/services/assessmentEngine';
import { DIMENSIONS as DRIVE_DIMENSIONS } from '@/services/questions/drive';

const TIGER = '#EA580C';

const flowQuestions: AssessmentQuestion[] = DRIVE_DIMENSIONS.flatMap((dim) =>
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
  code: 'DRIVE',
  name: 'DRIVE',
  accent: TIGER,
  prefix: 'drive-take',
  resultsPath: '/assessment/drive/results',
  landingPath: '/assessment/drive',
  intro: {
    title: 'DRIVE — Motivation Profile & Engagement Risk',
    body: 'You will answer 30 questions across five dimensions of motivational profile: intrinsic motivation, extrinsic motivation, values alignment, confidence & self-efficacy, and growth orientation. Answer with candour — motivational assessments reward honesty.',
    duration: '~10 minutes',
    expectations: [
      '30 questions across Intrinsic Motivation, Extrinsic Motivation, Values Alignment, Confidence & Self-Efficacy, and Growth Orientation',
      '1–5 Likert scale — answer honestly; some items are reverse-worded on purpose',
      'Your progress auto-saves to this device; resume if interrupted',
      'On completion: composite score, dimension scorecard, matched motivation archetype, and engagement-calibrated development priorities',
    ],
  },
  onSubmit: async (answers) => {
    try {
      const numericAnswers: Record<string, number> = {};
      for (const [qid, val] of Object.entries(answers)) {
        if (typeof val === 'number') numericAnswers[qid] = val;
      }
      sessionStorage.setItem(
        'assessment_answers_DRIVE_latest',
        JSON.stringify(numericAnswers),
      );
      const out = await scoreAssessment('DRIVE', numericAnswers, { persist: false });
      if (out.ok && out.persisted_id) {
        return { resultId: out.persisted_id };
      }
    } catch (e) {
      console.warn('[DriveTakePage] client-side scoring fell back to session-only:', e);
    }
    return { resultId: null };
  },
  questions: flowQuestions,
};

export function DriveTakePage() {
  return <AssessmentFlow config={config} />;
}

export default DriveTakePage;
