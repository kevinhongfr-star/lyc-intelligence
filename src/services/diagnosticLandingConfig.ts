/**
 * diagnosticLandingConfig.ts — Builds AssessmentLandingConfig from a
 * DiagnosticDefinition JSON file.
 *
 * #1276: The existing shared landing components (AssessmentHero,
 * WhatItMeasures, HowItWorks, DimensionsDetail, WhoItsFor, WhatYouGet,
 * AssessmentCTA) already accept AssessmentLandingConfig props. This builder
 * bridges the new #1342 diagnostic JSON format to the existing component
 * system.
 */

import type { DiagnosticDefinition } from '@/types/assessment';
import type { AssessmentLandingConfig } from '@/components/assessment/landing/shared';
import { getComplimentaryCTA, getLockedCTA, isAnonymousAllowed, tierDisplayName, DIAGNOSTIC_TIER_REQUIREMENT } from '@/config/tierConfig';

/**
 * Generate "how it works" steps (same for all diagnostics).
 * Premium 3-step process with staggered reveal.
 */
function buildHowItWorks(): AssessmentLandingConfig['howItWorks'] {
  return [
    {
      step: '01',
      title: 'Complete the Assessment',
      desc: 'Answer targeted questions designed to map your capabilities across five core dimensions.',
    },
    {
      step: '02',
      title: 'Receive Your Profile',
      desc: 'Get a detailed scorecard with dimension scores, archetype identification, and key insights.',
    },
    {
      step: '03',
      title: 'Discuss with NEXUS',
      desc: 'Connect with NEXUS AI to explore your results, identify development priorities, and build a growth plan.',
    },
  ];
}

/**
 * Generate persona cards from the diagnostic definition.
 */
function buildPersonas(def: DiagnosticDefinition): AssessmentLandingConfig['personas'] {
  const title = def.meta.title;
  return [
    {
      title: 'Emerging Leaders',
      desc: `Professionals early in their leadership journey who want to understand their ${title} baseline.`,
    },
    {
      title: 'Mid-Career Executives',
      desc: `Leaders seeking to validate their strengths and identify development areas in ${title}.`,
    },
    {
      title: 'Senior Practitioners',
      desc: `Experienced executives who want a structured framework to benchmark their ${title} capabilities.`,
    },
  ];
}

/**
 * Generate deliverables list.
 */
function buildDeliverables(def: DiagnosticDefinition): AssessmentLandingConfig['deliverables'] {
  return [
    {
      title: 'Dimension Scorecard',
      desc: `Detailed scores across all ${def.meta.total_dimensions} dimensions with level indicators.`,
    },
    {
      title: 'Archetype Identification',
      desc: `Your primary archetype with description and key traits that define your profile.`,
    },
    {
      title: 'Key Insights',
      desc: 'Development priorities and strength areas translated into actionable insights.',
    },
    {
      title: 'NEXUS Integration',
      desc: 'Direct link to discuss your results with NEXUS AI for personalized coaching.',
    },
  ];
}

/**
 * Generate a sample result preview.
 */
function buildSampleResult(def: DiagnosticDefinition): string {
  return `Your ${def.meta.title} profile shows a balanced distribution across ${def.meta.total_dimensions} dimensions, with your strongest area being ${def.dimensions[0]?.name ?? 'your top dimension'} and your primary archetype being ${def.archetypes[0]?.name ?? 'your dominant archetype'}.`;
}

/**
 * Build a complete AssessmentLandingConfig from a DiagnosticDefinition.
 *
 * This is the main entry point for #1276 — it converts the canonical
 * diagnostic JSON format into the config that the existing shared landing
 * components consume.
 */
export function buildLandingConfig(
  def: DiagnosticDefinition,
  userTier: string | null | undefined = null
): AssessmentLandingConfig {
  const slug = def.meta.id;
  const isAccessible = isAnonymousAllowed(slug) ||
    (userTier ? true : isAnonymousAllowed(slug)); // simplified check

  const ctaLabel = isAnonymousAllowed(slug)
    ? getComplimentaryCTA().label
    : `Start ${def.meta.title} Assessment`;

  const ctaHref = `/diagnostics/${slug}/take`;

  return {
    code: def.meta.title,
    name: def.meta.title,
    tagline: def.meta.subtitle,
    heroDescription: `${def.meta.subtitle}. ${def.meta.total_questions} questions across ${def.meta.total_dimensions} dimensions. Available on the ${tierDisplayName(def.meta.tier_key)} tier.`,
    accent: def.meta.accent_color,
    prefix: slug,
    ctaLabel,
    ctaHref,
    ctaSecondaryLabel: 'Talk to NEXUS',
    ctaSecondaryHref: `/app/nexus?q=Tell me about ${def.meta.title}`,
    dimensions: def.dimensions.map((d) => ({
      id: d.key,
      name: d.name,
      description: d.description,
      lowLabel: d.low_label,
      highLabel: d.high_label,
    })),
    howItWorks: buildHowItWorks(),
    personas: buildPersonas(def),
    deliverables: buildDeliverables(def),
    sampleResult: buildSampleResult(def),
  };
}
