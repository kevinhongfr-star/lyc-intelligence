import { AssessmentFlow, type AssessmentFlowConfig } from '@/components/assessment/flow';
import { submitPRISMAssessment } from '@/services/prismAnalysis';

const config: AssessmentFlowConfig = {
  code: 'PRISM',
  name: 'PRISM',
  accent: '#C108AB',
  prefix: 'prism-take',
  resultsPath: '/prism/results',
  landingPath: '/prism',
  onSubmit: async (answers) => {
    const response = await submitPRISMAssessment(answers);
    return { resultId: response.result_id };
  },
  questions: [
    // ── Vision (2 questions) ──
    {
      id: 'vision_1',
      type: 'mcq_single',
      dimension: 'vision',
      text: 'When facing a new strategic challenge, your first instinct is to:',
      options: [
        { label: 'Map out the long-term implications and future scenarios', score: 5 },
        { label: 'Identify the immediate actions needed to address it', score: 3 },
        { label: 'Consult with others to gather different perspectives', score: 4 },
        { label: 'Look at what competitors or peers have done in similar situations', score: 2 },
      ],
    },
    {
      id: 'vision_2',
      type: 'likert',
      dimension: 'vision',
      text: 'I can clearly articulate where my organization should be in 5 years.',
      scaleLabels: ['Strongly disagree', 'Strongly agree'],
    },
    // ── Resilience (2 questions) ──
    {
      id: 'resilience_1',
      type: 'mcq_single',
      dimension: 'resilience',
      text: 'When a major project fails, you typically:',
      options: [
        { label: 'Take time to process, then analyze what went wrong', score: 4 },
        { label: 'Immediately start planning the next initiative', score: 5 },
        { label: 'Feel discouraged for days before regaining momentum', score: 2 },
        { label: 'Seek blame and ensure accountability', score: 3 },
      ],
    },
    {
      id: 'resilience_2',
      type: 'likert',
      dimension: 'resilience',
      text: 'I maintain composure and clarity under intense pressure.',
      scaleLabels: ['Rarely', 'Almost always'],
    },
    // ── Influence (2 questions) ──
    {
      id: 'influence_1',
      type: 'mcq_single',
      dimension: 'influence',
      text: 'In a room full of senior leaders, you tend to:',
      options: [
        { label: 'Drive the conversation and shape the outcome', score: 5 },
        { label: 'Contribute when asked, but prefer to listen first', score: 3 },
        { label: 'Build coalitions one-on-one before the meeting', score: 4 },
        { label: 'Take notes and follow up afterward', score: 2 },
      ],
    },
    {
      id: 'influence_2',
      type: 'likert',
      dimension: 'influence',
      text: 'People seek my opinion before making important decisions.',
      scaleLabels: ['Rarely', 'Always'],
    },
    // ── Strategy (2 questions) ──
    {
      id: 'strategy_1',
      type: 'mcq_single',
      dimension: 'strategy',
      text: 'Your approach to decision-making is best described as:',
      options: [
        { label: 'Data-driven — I need evidence before committing', score: 4 },
        { label: 'Intuitive — I trust my gut and move fast', score: 3 },
        { label: 'Collaborative — I build consensus before deciding', score: 5 },
        { label: 'Reactive — I decide when the situation forces it', score: 2 },
      ],
    },
    {
      id: 'strategy_2',
      type: 'likert',
      dimension: 'strategy',
      text: 'I regularly set aside time to think strategically about the future.',
      scaleLabels: ['Never', 'Always'],
    },
    // ── Mastery (2 questions) ──
    {
      id: 'mastery_1',
      type: 'mcq_multi',
      dimension: 'mastery',
      text: 'Which of these describe your approach to professional development?',
      maxSelections: 2,
      options: [
        { label: 'I read books and articles in my field regularly', score: 5 },
        { label: 'I seek out mentors and coaches', score: 4 },
        { label: 'I attend conferences and industry events', score: 4 },
        { label: 'I learn by taking on stretch assignments', score: 5 },
        { label: 'I take online courses and certifications', score: 3 },
        { label: 'I learn primarily from on-the-job experience', score: 2 },
      ],
    },
    {
      id: 'mastery_2',
      type: 'likert',
      dimension: 'mastery',
      text: 'I am recognized as a go-to expert in my core domain.',
      scaleLabels: ['Not yet', 'Absolutely'],
    },
  ],
};

export function PrismTakePage() {
  return <AssessmentFlow config={config} />;
}

export default PrismTakePage;
