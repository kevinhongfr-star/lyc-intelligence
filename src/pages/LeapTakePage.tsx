// ═══════════════════════════════════════════════════════════
// LEAP Take Page — 16 DISC forced-choice + 15 Career Readiness Likert.
// X2-2: Real content ported from akira_source/leap2_config.json.
// 5 CR dimensions, 17 archetypes (16 DISC×CR-band + 1 mixed profile).
// Brand: OCEAN accent, system serif headings, zero border radius.
// ═══════════════════════════════════════════════════════════
import { AssessmentFlow, type AssessmentFlowConfig, type AssessmentQuestion } from '@/components/assessment/flow';
import { OCEAN } from '@/tokens';
import { DIMENSIONS as LEAP_CR_DIMENSIONS } from '@/services/scoring/leap';

// ── DISC forced-choice item sets (source: leap2_config.json disc.item_sets) ──
// 16 adjective sets; user picks the one that most describes them.
// The answer is stored as the DISC letter ("D"/"I"/"S"/"C").
const DISC_ITEM_SETS: Array<{ id: string; D: string; I: string; S: string; C: string }> = [
  { id: 'LEAP_DQ01', D: 'Decisive', I: 'Enthusiastic', S: 'Patient', C: 'Analytical' },
  { id: 'LEAP_DQ02', D: 'Direct', I: 'Optimistic', S: 'Reliable', C: 'Precise' },
  { id: 'LEAP_DQ03', D: 'Competitive', I: 'Persuasive', S: 'Supportive', C: 'Systematic' },
  { id: 'LEAP_DQ04', D: 'Results-oriented', I: 'Sociable', S: 'Steady', C: 'Thorough' },
  { id: 'LEAP_DQ05', D: 'Assertive', I: 'Expressive', S: 'Cooperative', C: 'Detail-oriented' },
  { id: 'LEAP_DQ06', D: 'Bold', I: 'Inspiring', S: 'Loyal', C: 'Careful' },
  { id: 'LEAP_DQ07', D: 'Driven', I: 'Charming', S: 'Calm', C: 'Accurate' },
  { id: 'LEAP_DQ08', D: 'Independent', I: 'Outgoing', S: 'Accommodating', C: 'Diplomatic' },
  { id: 'LEAP_DQ09', D: 'Commanding', I: 'Spirited', S: 'Gentle', C: 'Formal' },
  { id: 'LEAP_DQ10', D: 'Firm', I: 'Lively', S: 'Easygoing', C: 'Reserved' },
  { id: 'LEAP_DQ11', D: 'Demanding', I: 'Animated', S: 'Kind', C: 'Cautious' },
  { id: 'LEAP_DQ12', D: 'Strong-willed', I: 'Popular', S: 'Considerate', C: 'Logical' },
  { id: 'LEAP_DQ13', D: 'Enterprising', I: 'Talkative', S: 'Tolerant', C: 'Perfectionist' },
  { id: 'LEAP_DQ14', D: 'Pioneering', I: 'Playful', S: 'Sympathetic', C: 'Orderly' },
  { id: 'LEAP_DQ15', D: 'Risk-taking', I: 'Magnetic', S: 'Stable', C: 'Objective' },
  { id: 'LEAP_DQ16', D: 'Forceful', I: 'Spontaneous', S: 'Harmonious', C: 'Methodical' },
];

// ── Build DISC forced-choice questions ──
const discQuestions: AssessmentQuestion[] = DISC_ITEM_SETS.map((set, i) => ({
  id: set.id,
  type: 'forced_choice',
  dimension: 'DISC',
  text: `Which adjective best describes you?`,
  hint: `Set ${i + 1} of ${DISC_ITEM_SETS.length} — choose the one that feels most natural, not the one you aspire to.`,
  options: [
    { label: set.D, score: 0, value: 'D' },
    { label: set.I, score: 0, value: 'I' },
    { label: set.S, score: 0, value: 'S' },
    { label: set.C, score: 0, value: 'C' },
  ],
}));

// ── Build CR Likert questions from the scoring config dimensions ──
// Each CR dimension (Positioning, Proof, Visibility, Move, Alignment) has
// 3 items with full text. Flatten into ordered Likert questions tagged to
// their dimension name.
const crQuestions: AssessmentQuestion[] = LEAP_CR_DIMENSIONS.flatMap((dim) => {
  const items = (dim as { items?: Array<{ id: string; text: string }> }).items || [];
  return items.map((item) => ({
    id: item.id,
    type: 'likert' as const,
    dimension: dim.name,
    text: item.text,
    scaleLabels: ['Strongly disagree', 'Strongly agree'] as [string, string],
    scaleMin: 1,
    scaleMax: 5,
  }));
});

// DISC first (behavioral), then CR (readiness) — matches source section order.
const flowQuestions: AssessmentQuestion[] = [...discQuestions, ...crQuestions];

const config: AssessmentFlowConfig = {
  code: 'LEAP',
  name: 'LEAP',
  accent: OCEAN,
  prefix: 'leap-take',
  resultsPath: '/assessment/leap/results',
  landingPath: '/assessment/leap',
  intro: {
    title: 'LEAP — Leadership Evaluation & Psychological Profiling',
    body: 'A two-part diagnostic: 16 forced-choice adjective sets reveal your behavioural drive (Dominance, Influence, Steadiness, or Conscientiousness), followed by 15 Likert items across five Career Readiness dimensions. Your DISC profile × readiness band determines your archetype.',
    duration: '~12 minutes',
    expectations: [
      '16 DISC forced-choice items — pick the adjective that feels most natural, not aspirational',
      '15 Career Readiness items across Positioning, Proof, Visibility, Move, and Alignment',
      '1–5 Likert scale for the readiness section; forced choice for DISC',
      'Your progress auto-saves to this device; resume if interrupted',
      'On completion: DISC profile, readiness band, matched archetype, and development priorities',
    ],
  },
  onSubmit: async (answers) => {
    // Store all answers (DISC strings + CR numbers) in sessionStorage.
    // The results page handles DISC primary determination and CR scoring.
    try {
      sessionStorage.setItem(
        'assessment_answers_LEAP_latest',
        JSON.stringify(answers),
      );
    } catch (e) {
      console.warn('[LeapTakePage] sessionStorage write failed:', e);
    }
    return { resultId: null };
  },
  questions: flowQuestions,
};

export function LeapTakePage() {
  return <AssessmentFlow config={config} />;
}

export default LeapTakePage;
