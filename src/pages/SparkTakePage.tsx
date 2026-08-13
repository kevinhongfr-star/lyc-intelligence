import { AssessmentFlow, type AssessmentFlowConfig } from '@/components/assessment/flow';
import { submitSPARKAssessment } from '@/services/sparkAnalysis';
import { DS } from '@/tokens';

const config: AssessmentFlowConfig = {
  code: 'SPARK',
  name: 'SPARK',
  accent: DS.accent,
  prefix: 'spark-take',
  resultsPath: '/spark/results',
  landingPath: '/spark',
  onSubmit: async (answers) => {
    const response = await submitSPARKAssessment(answers);
    return { resultId: response.result_id };
  },
  questions: [
    // ── AI Vision (2 questions) ──
    {
      id: 'ai_vision_1',
      type: 'mcq_single',
      dimension: 'ai_vision',
      text: 'When you hear about a new AI capability, your first reaction is:',
      options: [
        { label: 'How can this transform our business model?', score: 5 },
        { label: 'What problem could this solve for us?', score: 4 },
        { label: 'Is this hype or real?', score: 3 },
        { label: 'Another tech trend we can ignore', score: 2 },
      ],
    },
    {
      id: 'ai_vision_2',
      type: 'likert',
      dimension: 'ai_vision',
      text: 'I can clearly articulate how AI will impact my industry in the next 3 years.',
      scaleLabels: ['Strongly disagree', 'Strongly agree'],
    },
    // ── Data Fluency (2 questions) ──
    {
      id: 'data_fluency_1',
      type: 'mcq_single',
      dimension: 'data_fluency',
      text: 'When making a critical decision, you typically:',
      options: [
        { label: 'Build a data model to test hypotheses', score: 5 },
        { label: 'Pull together relevant data and analyze it', score: 4 },
        { label: 'Ask the analytics team for a summary', score: 3 },
        { label: 'Rely on experience and intuition', score: 2 },
      ],
    },
    {
      id: 'data_fluency_2',
      type: 'likert',
      dimension: 'data_fluency',
      text: 'I am comfortable interpreting data visualizations and statistical concepts.',
      scaleLabels: ['Not comfortable', 'Very comfortable'],
    },
    // ── Change Leadership (2 questions) ──
    {
      id: 'change_leadership_1',
      type: 'mcq_single',
      dimension: 'change_leadership',
      text: 'Your team is resistant to adopting a new AI tool. You:',
      options: [
        { label: 'Run a pilot, share early wins, build momentum', score: 5 },
        { label: 'Address concerns directly, provide training', score: 4 },
        { label: 'Mandate adoption from the top', score: 3 },
        { label: 'Wait for them to come around', score: 2 },
      ],
    },
    {
      id: 'change_leadership_2',
      type: 'likert',
      dimension: 'change_leadership',
      text: 'I have successfully led teams through a major technology change.',
      scaleLabels: ['Never', 'Multiple times'],
    },
    // ── Ethics (2 questions) ──
    {
      id: 'ethics_1',
      type: 'mcq_single',
      dimension: 'ethics',
      text: 'When deploying AI in your organization, ethics is:',
      options: [
        { label: 'A core design principle, not an afterthought', score: 5 },
        { label: 'Important — we have guidelines and reviews', score: 4 },
        { label: 'Something legal handles', score: 3 },
        { label: 'Not really on my radar', score: 2 },
      ],
    },
    {
      id: 'ethics_2',
      type: 'likert',
      dimension: 'ethics',
      text: 'I actively consider bias, fairness, and transparency when evaluating AI systems.',
      scaleLabels: ['Rarely', 'Always'],
    },
    // ── Innovation (2 questions) ──
    {
      id: 'innovation_1',
      type: 'mcq_multi',
      dimension: 'innovation',
      text: 'Which of these describe your approach to new AI tools?',
      maxSelections: 2,
      options: [
        { label: 'I experiment with new tools before they are mainstream', score: 5 },
        { label: 'I encourage my team to explore and prototype', score: 5 },
        { label: 'I follow industry trends and adopt proven solutions', score: 4 },
        { label: 'I wait for case studies before investing', score: 3 },
        { label: 'I prefer sticking with what works', score: 2 },
        { label: 'I find AI tools overhyped', score: 1 },
      ],
    },
    {
      id: 'innovation_2',
      type: 'likert',
      dimension: 'innovation',
      text: 'I actively seek out opportunities to experiment with AI in my work.',
      scaleLabels: ['Never', 'Always'],
    },
  ],
};

export function SparkTakePage() {
  return <AssessmentFlow config={config} />;
}

export default SparkTakePage;
