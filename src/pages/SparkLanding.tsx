import { AssessmentLanding, type AssessmentLandingConfig } from '@/components/assessment/landing';
import { ASSESSMENT_CATALOG } from '@/assessments/catalog';
import { SEO } from '@/components/seo/SEO';
import { getAssessmentMeta } from '@/seo/pageMetadata';
import { DS, TEAL } from '@/tokens';

const config: AssessmentLandingConfig = {
  code: 'SPARK',
  name: 'SPARK',
  tagline: 'AI Leadership Readiness',
  heroDescription:
    'Assess your readiness to lead in the age of AI. Discover how you score across five dimensions of AI leadership — from vision to ethics. Get a personalized readiness profile in fifteen minutes.',
  accent: TEAL,
  prefix: 'spark',
  ctaLabel: 'Start the assessment',
  ctaHref: '/spark/take',
  ctaSecondaryLabel: 'See how it works',
  ctaSecondaryHref: '#how-it-works',
  dimensions: ASSESSMENT_CATALOG.SPARK.dimensions,
  howItWorks: [
    {
      step: '01',
      title: 'Answer 10 questions',
      desc: 'Scenario-based questions about AI adoption, data fluency, and ethical leadership. No technical knowledge required.',
    },
    {
      step: '02',
      title: 'Get your readiness profile',
      desc: 'See your scores across five AI leadership dimensions, with clear labels from skeptical to visionary.',
    },
    {
      step: '03',
      title: 'Receive your action plan',
      desc: 'A personalized development report with your AI leadership archetype and concrete next steps.',
    },
  ],
  personas: [
    {
      title: 'Senior leaders',
      desc: 'Executives navigating AI transformation. Understand your readiness gaps before they become competitive disadvantages.',
    },
    {
      title: 'Aspiring AI leaders',
      desc: 'Managers preparing to lead AI initiatives. Identify which leadership dimensions to develop first.',
    },
    {
      title: 'Transformation drivers',
      desc: 'Change agents responsible for AI adoption. Benchmark your readiness and build your case for resources.',
    },
  ],
  deliverables: [
    {
      title: 'Readiness scorecard',
      desc: 'Five dimension scores benchmarked against AI-ready executive populations.',
    },
    {
      title: 'AI leadership archetype',
      desc: 'Which of four AI leadership archetypes you align with — and what it means for your strategy.',
    },
    {
      title: 'Development plan',
      desc: 'Prioritized actions focused on your weakest AI readiness dimensions.',
    },
    {
      title: 'NEXUS integration',
      desc: 'Your results feed directly into NEXUS, so your AI coach knows your readiness profile.',
    },
  ],
  sampleResult:
    'You align most strongly with the AI Strategist archetype. Your AI Vision and Innovation scores place you in the top quartile, while Ethics shows room for deeper consideration.',
};

export function SparkLanding() {
  const info = ASSESSMENT_CATALOG['SPARK'];
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

export default SparkLanding;
