import { AssessmentLanding, type AssessmentLandingConfig } from '@/components/assessment/landing';
import { ASSESSMENT_CATALOG } from '@/assessments/catalog';
import { SEO } from '@/components/seo/SEO';
import { getAssessmentMeta } from '@/seo/pageMetadata';
import { DS } from '@/tokens';

const config: AssessmentLandingConfig = {
  code: 'PRISM',
  name: 'PRISM',
  tagline: 'Career & Professional Branding',
  heroDescription:
    'Discover your leadership profile across five core dimensions. Benchmark against real executives. Get a personalized development plan in fifteen minutes.',
  accent: DS.accent,
  prefix: 'prism',
  ctaLabel: 'Start the assessment',
  ctaHref: '/prism/take',
  ctaSecondaryLabel: 'See how it works',
  ctaSecondaryHref: '#how-it-works',
  dimensions: ASSESSMENT_CATALOG.PRISM.dimensions,
  howItWorks: [
    {
      step: '01',
      title: 'Answer 40 questions',
      desc: 'Scenario-based questions benchmarked against real executive populations. No right or wrong answers — just honest ones.',
    },
    {
      step: '02',
      title: 'Get your profile',
      desc: 'See your scores across five dimensions, with clear low-to-high labels. Understand where you stand today.',
    },
    {
      step: '03',
      title: 'Receive your plan',
      desc: 'A personalized development report with archetype insights, blind spots, and concrete next steps for growth.',
    },
  ],
  personas: [
    {
      title: 'Senior executives',
      desc: 'Leaders who want an honest, data-driven snapshot of where they stand — and what to work on next.',
    },
    {
      title: 'Aspiring leaders',
      desc: 'Managers preparing for the next step. Understand your strengths and gaps before the promotion conversation.',
    },
    {
      title: 'Career transitioners',
      desc: 'Professionals managing a pivot. Get clarity on transferable strengths and development priorities.',
    },
  ],
  deliverables: [
    {
      title: 'Dimension scorecard',
      desc: 'Five dimension scores with low-to-high labels, benchmarked against executive populations.',
    },
    {
      title: 'Archetype profile',
      desc: 'Which of four leadership archetypes you align with most — and what it means for your career.',
    },
    {
      title: 'Development plan',
      desc: 'Concrete, prioritized actions based on your lowest-scoring dimensions and archetype traits.',
    },
    {
      title: 'NEXUS integration',
      desc: 'Your results feed directly into NEXUS, so your AI coach always knows your profile.',
    },
  ],
  sampleResult:
    'You align most strongly with the Strategic Architect archetype. Your Vision and Strategy scores place you in the top quartile of senior executives, while Mastery shows room for growth.',
};

export function PrismLanding() {
  const info = ASSESSMENT_CATALOG['PRISM'];
  return (
    <>
      <SEO assessment={getAssessmentMeta(
        info.code, info.name, info.b2cName, info.tagline,
        info.priceMiles, info.duration_minutes, info.total_questions,
      )} />
      <AssessmentLanding config={config} />
    </>
  );
}

export default PrismLanding;
