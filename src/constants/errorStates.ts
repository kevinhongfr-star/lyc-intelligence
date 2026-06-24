// Phase 0.5: Error States & Empty States
// Standardized error and empty state definitions for all UI components

export type ErrorState =
  | 'error_network'
  | 'error_unauthorized'
  | 'error_not_found'
  | 'error_validation'
  | 'error_server'
  | 'error_permission'
  | 'empty_zero_state'
  | 'empty_filtered'
  | 'empty_loading'
  | 'empty_error'
  | 'partial_success'
  | 'rate_limited';

export type EmptyState =
  | 'empty_zero_state'
  | 'empty_filtered'
  | 'empty_loading'
  | 'empty_error';

export interface ErrorStateConfig {
  title: string;
  description: string;
  action: string;
  icon: string;
  severity: 'info' | 'warning' | 'error' | 'success';
}

export const ERROR_MESSAGES: Record<ErrorState, ErrorStateConfig> = {
  error_network: {
    title: 'Connection lost',
    description:
      'Your internet connection may be unstable. Please try again.',
    action: 'Retry',
    icon: 'wifi_off',
    severity: 'warning',
  },
  error_unauthorized: {
    title: 'Session expired',
    description: 'Your session has ended. Please sign in again.',
    action: 'Sign In',
    icon: 'lock',
    severity: 'error',
  },
  error_not_found: {
    title: 'Page not found',
    description:
      "The page you're looking for doesn't exist or has been moved.",
    action: 'Go Home',
    icon: 'search',
    severity: 'info',
  },
  error_validation: {
    title: 'Please fix the errors below',
    description: 'Some fields need your attention before we can continue.',
    action: 'Review',
    icon: 'alert_circle',
    severity: 'warning',
  },
  error_server: {
    title: 'Something went wrong',
    description:
      "We've been notified and are working on it. Please try again in a moment.",
    action: 'Try Again',
    icon: 'bug_report',
    severity: 'error',
  },
  error_permission: {
    title: 'Access denied',
    description:
      "You don't have permission to view this. Contact your admin if you believe this is a mistake.",
    action: 'Go Back',
    icon: 'block',
    severity: 'error',
  },
  empty_zero_state: {
    title: 'Welcome to DEX AI',
    description: 'Your executive search command center.',
    action: 'Create Your First Mandate',
    icon: 'rocket_launch',
    severity: 'info',
  },
  empty_filtered: {
    title: 'No results found',
    description: 'Try adjusting your filters or search terms.',
    action: 'Clear Filters',
    icon: 'filter_list',
    severity: 'info',
  },
  empty_loading: {
    title: 'Loading...',
    description: '',
    action: '',
    icon: 'hourglass_empty',
    severity: 'info',
  },
  empty_error: {
    title: "Couldn't load",
    description: "We couldn't load this data. This might be temporary.",
    action: 'Try Again',
    icon: 'error_outline',
    severity: 'warning',
  },
  partial_success: {
    title: 'Partially completed',
    description:
      'Some items were processed successfully, others encountered errors.',
    action: 'View Details',
    icon: 'check_circle_outline',
    severity: 'warning',
  },
  rate_limited: {
    title: 'Too many requests',
    description: 'Please wait a moment before trying again.',
    action: 'Wait',
    icon: 'timer',
    severity: 'warning',
  },
} as const;

// Specific empty state templates by context
export const EMPTY_STATES = {
  mandates: {
    zero: {
      title: 'No mandates yet',
      description:
        'Create your first search mandate to start building your candidate pipeline.',
      action: 'Create Mandate',
      icon: 'assignment',
    },
    filtered: {
      title: 'No mandates match',
      description: 'Try adjusting your search filters or status selection.',
      action: 'Clear Filters',
      icon: 'filter_list',
    },
  },
  candidates: {
    zero: {
      title: 'No candidates yet',
      description: 'Run a search sweep to populate your candidate pipeline.',
      action: 'Run Search',
      icon: 'people',
    },
    filtered: {
      title: 'No candidates match your criteria',
      description: 'Try broadening your filters or search terms.',
      action: 'Clear Filters',
      icon: 'filter_list',
    },
  },
  assessments: {
    zero: {
      title: 'No assessments yet',
      description:
        'Send assessment invitations to candidates to get started with TRIDENT, GRID, or SHIFT.',
      action: 'Send Assessment',
      icon: 'psychology',
    },
    filtered: {
      title: 'No assessments found',
      description: 'Try adjusting your filters.',
      action: 'Clear Filters',
      icon: 'filter_list',
    },
  },
  shortlist: {
    zero: {
      title: 'Shortlist is empty',
      description:
        'Add strong candidates to your shortlist to keep them top of mind.',
      action: 'Browse Candidates',
      icon: 'star',
    },
    filtered: {
      title: 'No shortlisted candidates match',
      description: 'Try adjusting your filters.',
      action: 'Clear Filters',
      icon: 'filter_list',
    },
  },
} as const;

export type EmptyStateContext = keyof typeof EMPTY_STATES;

/**
 * Get error state config with safe fallback.
 */
export function getErrorState(state: ErrorState): ErrorStateConfig {
  return ERROR_MESSAGES[state] ?? ERROR_MESSAGES.error_server;
}

/**
 * Get empty state for a specific context and type.
 */
export function getEmptyState(
  context: EmptyStateContext,
  type: 'zero' | 'filtered' = 'zero'
) {
  const ctx = EMPTY_STATES[context];
  return ctx?.[type] ?? ERROR_MESSAGES.empty_zero_state;
}

export default ERROR_MESSAGES;
