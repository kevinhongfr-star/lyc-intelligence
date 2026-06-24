// Phase 0.5: Brand Voice & Tone Guidelines
// Copy templates and voice principles for consistent messaging

export const VOICE_PRINCIPLES = {
  expert: {
    meaning: "We know our stuff but don't lecture",
    example:
      'Your shortlist is strong — 3 candidates above 85% fit',
    avoid:
      'Based on multivariate analysis of candidate parameters, the system has determined...',
  },
  direct: {
    meaning: 'Clear without being cold',
    example: 'This candidate withdrew',
    avoid:
      'Regrettably, the candidate in question has elected to discontinue their participation',
  },
  confident: {
    meaning: 'We trust our system',
    example: 'The match score reflects a strong alignment',
    avoid: 'Our AI is the best in the industry',
  },
  human: {
    meaning: 'Professional warmth',
    example: 'Congratulations on the successful placement',
    avoid: 'Woo you nailed it!!',
  },
} as const;

export type VoicePrinciple = keyof typeof VOICE_PRINCIPLES;

export const TONE_BY_CONTEXT = {
  success: {
    tone: 'Warm + professional',
    example: 'Mandate created. Your search is live.',
  },
  error: {
    tone: 'Calm + reassuring',
    example: "Something went wrong. We're on it. Try again in a moment.",
  },
  empty: {
    tone: 'Encouraging + clear',
    example: "No mandates yet. Let's set up your first search.",
  },
  loading: {
    tone: 'Transparent',
    example: 'Loading your dashboard... this should take a few seconds.',
  },
  confirmation: {
    tone: 'Clear + final',
    example: 'Candidate added to shortlist. Moving to the next step.',
  },
  warning: {
    tone: 'Honest + actionable',
    example:
      'This mandate has been open 45 days. Consider refreshing the search sweep.',
  },
  data_heavy: {
    tone: 'Scannable',
    example:
      'Use numbers, percentages, comparisons — not paragraphs',
  },
} as const;

export type ToneContext = keyof typeof TONE_BY_CONTEXT;

export const COPY_TEMPLATES = {
  success: {
    mandateCreated: 'Mandate created. Your search is live.',
    candidateAdded: 'Candidate added to {listStatus}. {nextStep}.',
    reportReady: 'Your {reportType} report is ready.',
    interviewScheduled:
      'Interview booked for {candidateName} on {date} at {time}.',
    assessmentCompleted:
      '{assessmentType} complete for {candidateName}. View results.',
    offerAccepted: 'Offer accepted by {candidateName}. Congratulations!',
    placementConfirmed:
      'Placement confirmed for {candidateName} at {company}.',
    shortlistReady:
      'Shortlist ready: {count} candidates above {threshold}% fit.',
  },
  error: {
    generic:
      'Something went wrong. We\'ve been notified. Please try again.',
    network: 'Connection lost. Check your internet and try again.',
    validation: 'Please fix the highlighted fields before continuing.',
    permission:
      "You don't have access to this. Contact your admin if you believe this is a mistake.",
    notFound: "This page doesn't exist or has been moved.",
    rateLimited:
      'Too many requests. Please wait a moment and try again.',
  },
  empty: {
    noMandates:
      'No mandates yet. Create your first search to get started.',
    noCandidates:
      'No candidates in this pipeline. Run a search sweep to populate.',
    noResults: 'No results match your filters. Try broadening your criteria.',
    noAssessments:
      'No assessments yet. Send invitations to get started.',
    noInterviews: 'No interviews scheduled yet.',
    noPlacements: 'No placements yet. Keep building the pipeline.',
  },
  warning: {
    staleMandate:
      'This mandate has been open {days} days. Consider refreshing the search.',
    lowPipeline:
      'Only {count} candidates in pipeline. Consider expanding your search sweep.',
    interviewSoon:
      'Interview with {candidateName} in {hours} hours. Prep notes attached.',
    expiringConsent:
      '{count} consent records expire in 30 days. Request renewal.',
    slaAtRisk:
      'Mandate "{mandateTitle}" SLA is at risk. {days} days remaining.',
  },
  info: {
    autoSaved: 'Draft saved at {time}',
    processing: 'Processing... this usually takes 10-30 seconds.',
    syncInProgress: 'Syncing with NEXUS... your data will update shortly.',
    updatedAt: 'Last updated {timeAgo}',
  },
} as const;

export type CopyCategory = keyof typeof COPY_TEMPLATES;
export type CopyTemplate<T extends CopyCategory> = keyof (typeof COPY_TEMPLATES)[T];

/**
 * Interpolate a template string with variables.
 * Example: formatTemplate("Hello {name}", { name: "World" }) => "Hello World"
 */
export function formatTemplate(
  template: string,
  variables: Record<string, string | number>
): string {
  return template.replace(/{(\w+)}/g, (match, key: string) => {
    return variables[key] !== undefined ? String(variables[key]) : match;
  });
}

/**
 * Get a copy template and interpolate it with variables.
 */
export function getCopy<T extends CopyCategory>(
  category: T,
  key: string,
  variables?: Record<string, string | number>
): string {
  const categoryTemplates = COPY_TEMPLATES[category] as Record<string, string>;
  const template = categoryTemplates[key] || '';

  if (variables) {
    return formatTemplate(template, variables);
  }

  return template;
}

export const COPY_RULES = {
  noJargonWithoutExplanation:
    'If a term is methodology-specific, show it once with a tooltip',
  numbersOverAdjectives:
    '"3 of 5 candidates scored" not "Most candidates scored well"',
  activeVoice:
    '"The system matched 12 candidates" not "12 candidates were matched by the system"',
  frontLoadImportant:
    '"Search completed: 47 candidates found" not "We have completed your search and found 47 candidates"',
  oneIdeaPerSentence: 'No run-ons',
  localizeDateTime: 'Date/time in users timezone always',
} as const;

export default {
  VOICE_PRINCIPLES,
  TONE_BY_CONTEXT,
  COPY_TEMPLATES,
  COPY_RULES,
  formatTemplate,
  getCopy,
};
