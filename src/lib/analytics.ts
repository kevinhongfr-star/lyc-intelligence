
import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = 'https://app.posthog.com';

export let analyticsEnabled = false;

export function initAnalytics() {
  if (POSTHOG_KEY) {
    try {
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        autocapture: true,
        capture_pageview: false,
        persistence: 'localStorage'
      });
      analyticsEnabled = true;
    } catch (e) {
      console.warn('Failed to initialize PostHog:', e);
    }
  }
}

export function trackPageView(page: string, userTier?: string) {
  if (!analyticsEnabled) return;
  posthog.capture('page_viewed', {
    page,
    user_tier: userTier
  });
}

export function trackEmailCaptured(source: string, messageCount?: number) {
  if (!analyticsEnabled) return;
  posthog.capture('email_captured', {
    source,
    message_count: messageCount
  });
}

export function trackLeadFormSubmitted(flow: 'b2b' | 'b2c', source: string) {
  if (!analyticsEnabled) return;
  posthog.capture('lead_form_submitted', {
    flow,
    source
  });
}

export function trackNexusMessageSent(isAuthenticated: boolean, messageCount: number) {
  if (!analyticsEnabled) return;
  posthog.capture('nexus_message_sent', {
    is_authenticated: isAuthenticated,
    message_count: messageCount
  });
}

export function trackAssessmentStarted(source: string) {
  if (!analyticsEnabled) return;
  posthog.capture('assessment_started', {
    source
  });
}

export function trackAssessmentCompleted(archetype: string, timeSeconds: number) {
  if (!analyticsEnabled) return;
  posthog.capture('assessment_completed', {
    archetype,
    time_seconds: timeSeconds
  });
}

export function trackTridentMatchRun(candidateCount: number, source: string) {
  if (!analyticsEnabled) return;
  posthog.capture('trident_match_run', {
    candidate_count: candidateCount,
    source
  });
}

export function trackUpgradePromptShown(trigger: string, currentTier: string) {
  if (!analyticsEnabled) return;
  posthog.capture('upgrade_prompt_shown', {
    trigger,
    current_tier: currentTier
  });
}

export function trackSubscriptionStarted(tier: string, mrr: number) {
  if (!analyticsEnabled) return;
  posthog.capture('subscription_started', {
    tier,
    mrr
  });
}

export function trackShareCardCreated(type: 'assessment' | 'trident' | 'progress', archetype?: string) {
  if (!analyticsEnabled) return;
  posthog.capture('share_card_created', {
    type,
    archetype
  });
}

export function trackReferralLinkCopied() {
  if (!analyticsEnabled) return;
  posthog.capture('referral_link_copied');
}

export function trackShareCardViewed(source: string, shareId: string) {
  if (!analyticsEnabled) return;
  posthog.capture('share_card_viewed', {
    source,
    share_id: shareId
  });
}
