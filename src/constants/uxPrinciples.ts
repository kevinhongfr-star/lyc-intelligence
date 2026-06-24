// Phase 0.5: UX Principles & Accessibility Standards
// Core UX principles and WCAG 2.1 AA compliance guidelines

export const UX_PRINCIPLES = [
  {
    id: 'clarity',
    name: 'Clarity over cleverness',
    description:
      'Every UI element should be self-explanatory. Users should never have to guess what something does.',
    examples: [
      'Use descriptive button labels, not icons alone',
      'Form fields have clear labels and helper text',
      'Navigation items say exactly where they go',
    ],
  },
  {
    id: 'progressive_disclosure',
    name: 'Progressive disclosure',
    description:
      'Show what is needed now, reveal complexity on demand. Reduce cognitive load by default.',
    examples: [
      'Advanced filters collapsed by default',
      'Long forms broken into steps',
      'Details panels expand on demand',
    ],
  },
  {
    id: 'never_lose_work',
    name: 'Never lose work',
    description:
      'Auto-save on every form field change. Confirm before destructive actions.',
    examples: [
      'Auto-save draft every 30 seconds',
      'Confirm modal before deleting data',
      'Warn before navigating away from unsaved changes',
    ],
  },
  {
    id: 'immediate_feedback',
    name: 'Feedback is immediate',
    description:
      'Every action gets a response within 100ms (loading state if longer).',
    examples: [
      'Skeleton loaders for data fetching',
      'Optimistic UI updates followed by server confirmation',
      'Success toast after action completes',
    ],
  },
  {
    id: 'one_primary_action',
    name: 'One primary action per screen',
    description:
      'Reduce cognitive load by making the most important action obvious.',
    examples: [
      'Single primary button, rest are secondary/tertiary',
      'Hero CTA is the most prominent element on landing pages',
      'Form submission is the clear primary action',
    ],
  },
  {
    id: 'consistent_patterns',
    name: 'Consistent patterns',
    description:
      'Same interaction = same behavior everywhere. Build muscle memory.',
    examples: [
      'Delete is always red + confirmation modal',
      'Back button in same position on all pages',
      'Same error state pattern across all lists',
    ],
  },
  {
    id: 'scannable_data',
    name: 'Data is scannable',
    description:
      'Numbers and percentages over paragraphs. Key metrics first, details later.',
    examples: [
      'Dashboards show big numbers, not paragraphs',
      'Tables use zebra striping and clear headers',
      'Charts have clear labels and trends',
    ],
  },
  {
    id: 'respect_context',
    name: 'Respect user context',
    description:
      'Meet users where they are. Mobile-first design. Timezone-aware.',
    examples: [
      'Responsive layout adapts to screen size',
      'Dates/times in users timezone',
      'Keyboard shortcuts for power users',
    ],
  },
] as const;

export type UxPrincipleId = (typeof UX_PRINCIPLES)[number]['id'];

export const ACCESSIBILITY_STANDARDS = {
  wcagVersion: '2.1',
  conformanceLevel: 'AA',
  requirements: {
    colorContrast: {
      normalText: '4.5:1',
      largeText: '3:1',
      description:
        'All text must have sufficient contrast against background',
    },
    keyboardNavigation: {
      description:
        'All interactive elements reachable via Tab. Visible focus indicator.',
    },
    focusIndicators: {
      description:
        'Visible focus ring on all interactive elements. Never remove outline without replacing.',
    },
    screenReader: {
      description:
        'All images have alt text. All form inputs have labels. ARIA labels for icon buttons.',
    },
    motion: {
      description:
        'Respect prefers-reduced-motion. Animations are decorative and skippable.',
    },
    touchTargets: {
      mobileMinSize: '44×44px',
      description: 'Minimum touch target size for mobile devices',
    },
    forms: {
      description:
        'Labels associated with inputs. Error messages programmatically linked. Required fields marked.',
    },
    headings: {
      description:
        'Logical heading hierarchy. One H1 per page. Don\'t skip levels.',
    },
  },
} as const;

export const RESPONSIVE_BREAKPOINTS = {
  mobile: {
    maxWidth: 640,
    layout: 'Single column, stacked layout, bottom navigation',
  },
  tablet: {
    minWidth: 640,
    maxWidth: 1024,
    layout: 'Two column where appropriate, side navigation',
  },
  desktop: {
    minWidth: 1024,
    layout: 'Full layout, side navigation + header',
  },
} as const;

export const INTERACTION_PATTERNS = {
  hover: {
    feedback: 'Subtle scale or color change on hover',
    delay: '0ms immediate',
  },
  click: {
    feedback: '0.95 scale + ripple effect',
    debounce: '300ms to prevent double clicks',
  },
  formSubmit: {
    feedback: 'Button loading state + disable during submission',
    success: 'Toast notification + redirect or refresh',
    error: 'Inline field errors + summary at top',
  },
  deleteAction: {
    pattern: 'Confirmation modal before any destructive action',
    color: 'Red button for final confirmation',
  },
  loading: {
    initial: 'Skeleton loader for first load',
    pagination: 'Spinner at bottom for "load more"',
    action: 'Inline loading state on triggering button',
  },
  empty: {
    zeroState: 'Illustration + primary CTA for new users',
    filtered: 'Icon + clear filters button',
    error: 'Warning icon + retry button',
  },
} as const;

export const NOTIFICATION_PATTERNS = {
  success: {
    duration: 3000,
    color: 'Green',
    icon: 'Checkmark',
  },
  error: {
    duration: 5000,
    color: 'Red',
    icon: 'Alert circle',
  },
  warning: {
    duration: 4000,
    color: 'Amber',
    icon: 'Warning triangle',
  },
  info: {
    duration: 3000,
    color: 'Blue',
    icon: 'Information',
  },
} as const;

export default {
  UX_PRINCIPLES,
  ACCESSIBILITY_STANDARDS,
  RESPONSIVE_BREAKPOINTS,
  INTERACTION_PATTERNS,
  NOTIFICATION_PATTERNS,
};
