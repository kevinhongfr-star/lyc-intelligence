import { AssessmentFlow, type AssessmentFlowConfig } from '@/components/assessment/flow';
import { submitPRISMAssessment } from '@/services/prismAnalysis';

const config: AssessmentFlowConfig = {
  code: 'PRISM',
  name: 'PRISM',
  accent: '#C108AB',
  prefix: 'prism-take',
  resultsPath: '/prism/results',
  landingPath: '/prism',
  // #1323: Entry expectation screen — sets time, count, and deliverable expectations.
  intro: {
    title: 'PRISM — Professional Brand & Visibility Diagnostic',
    body: 'You will answer 10 questions across five dimensions of executive brand and market visibility. Each is scenario-based or behavioral — answer as you actually decide, not as you think you should.',
    duration: '~4 minutes',
    expectations: [
      '10 questions across Vision, Resilience, Influence, Strategy, and Mastery',
      'Scenario-based and behavioral items — no abstract self-rating',
      'Your progress auto-saves; resume on your next login if interrupted',
      'On completion: executive summary, dimension scorecard, archetype, and development roadmap',
    ],
  },
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
      // #1323: Scenario-based question — answer in context, not in theory.
      scenario: 'A board member asks you, unprompted, where you see your function in three years. You have 90 seconds to answer.',
      text: 'What shapes your response most?',
      options: [
        { label: 'A clear, pre-articulated vision you have been refining for months', score: 5 },
        { label: 'The immediate priorities and risks on your desk today', score: 3 },
        { label: 'What you have heard peers and competitors articulating', score: 2 },
        { label: 'A directional sense, but you would want to think before committing', score: 4 },
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
      id: 'resilience_2',
      type: 'likert',
      dimension: 'resilience',
      text: 'I maintain composure and clarity under intense pressure.',
      scaleLabels: ['Rarely', 'Almost always'],
    },
    {
      id: 'resilience_1',
      type: 'mcq_single',
      dimension: 'resilience',
      // #1323: Skip logic — this scenario follow-up only shows if the gate
      // question (resilience_2, answered above) indicates the respondent
      // already operates under pressure. Respondents who rarely face pressure
      // skip the scenario, reducing total questions and completion time.
      skipIf: (answers) => (answers['resilience_2'] as number) <= 2,
      scenario: 'A major initiative you championed publicly has missed its target by 40%. The executive team is meeting in 48 hours to review.',
      text: 'In the 48 hours before that meeting, you primarily:',
      options: [
        { label: 'Reframe the narrative around what was learned and what to adjust', score: 5 },
        { label: 'Go quiet and prepare a defensive case', score: 2 },
        { label: 'Schedule one-on-ones with key stakeholders before the meeting', score: 4 },
        { label: 'Focus on identifying who is accountable and why', score: 3 },
      ],
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
