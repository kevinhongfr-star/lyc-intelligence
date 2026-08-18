/**
 * Phase 17 / T02 (#1288) — Analytics event tracker.
 *
 * Centralized tracking for page views, conversions, CTAs, and funnel stages.
 *
 * Two sinks:
 *   1. @vercel/analytics (window.va) — custom events, page views (server-free)
 *   2. POST /api/events — server log capture + JSON payload (1 function)
 *
 * Events are also buffered in localStorage and flushed on visibility change /
 * beforeunload to avoid losing data on fast navigations.
 *
 * CONVERSION EVENTS TRACKED (per T02 spec):
 *   - nexus_chat_initiation (hero CTA, nav CTA, any entry)
 *   - assessment_start
 *   - assessment_complete
 *   - signup (signup_success)
 *   - login_success (for funnel)
 *   - upgrade_attempt / purchase_initiated
 *   - cta_click (pricing, assessment cards, hero, nav, etc.)
 *
 * FUNNEL — landing → chat → assessment start → complete → signup → upgrade
 *   Each event carries funnel_step index and last_step so funnel progress
 *   can be reconstructed server-side.
 */

import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
// Sink #3: PostHog. Disabled in dev until VITE_POSTHOG_KEY is set (initAnalytics no-ops
// until that env var is populated). Importing side-effect-free module is fine.
import { analyticsEnabled, trackPageView as posthogTrackPageView } from '@/lib/analytics';
import posthog from 'posthog-js';

// ── Event definitions (typed string unions for autocomplete) ─────────

export type ConversionEventName =
  | 'nexus_chat_initiation'
  | 'assessment_start'
  | 'assessment_complete'
  | 'signup_success'
  | 'login_success'
  | 'upgrade_attempt'
  | 'purchase_success'
  | 'cta_click'
  | 'nexus_first_message_sent'
  | 'assessment_purchase'
  | 'billing_view';

export type FunnelStep =
  | 'landing_view'
  | 'nexus_chat_open'
  | 'nexus_chat_message'
  | 'assessment_start'
  | 'assessment_complete'
  | 'signup'
  | 'upgrade';

const FUNNEL_ORDER: FunnelStep[] = [
  'landing_view',
  'nexus_chat_open',
  'nexus_chat_message',
  'assessment_start',
  'assessment_complete',
  'signup',
  'upgrade',
];

const STORAGE_KEY = 'lyc:event_buffer:v1';
const FUNNEL_KEY = 'lyc:funnel_progress:v1';
const FLUSH_INTERVAL_MS = 5000;

interface BaseEvent {
  /** Event name — snake_case */
  name: string;
  /** ISO timestamp */
  timestamp: string;
  /** Arbitrary event properties */
  props?: Record<string, unknown>;
  /** User identity (when known) */
  user?: { id?: string; role?: string };
  /** Browser/session context */
  ctx: {
    url: string;
    path: string;
    referrer: string;
    userAgent: string;
    viewport: string;
    sessionId: string;
  };
  /** Funnel context when relevant */
  funnel?: {
    current_step?: FunnelStep;
    step_index?: number;
    last_step?: FunnelStep;
    last_index?: number;
  };
}

let _sessionId = '';
function getSessionId(): string {
  if (!_sessionId) {
    const existing = sessionStorage.getItem('lyc:session_id');
    if (existing) _sessionId = existing;
    else {
      _sessionId =
        's_' +
        Date.now().toString(36) +
        Math.random().toString(36).slice(2, 8);
      sessionStorage.setItem('lyc:session_id', _sessionId);
    }
  }
  return _sessionId;
}

function currentFunnel(): { last: FunnelStep; lastIndex: number } {
  try {
    const raw = localStorage.getItem(FUNNEL_KEY);
    if (!raw) return { last: 'landing_view', lastIndex: -1 };
    const parsed = JSON.parse(raw);
    return {
      last: parsed.step || 'landing_view',
      lastIndex: typeof parsed.index === 'number' ? parsed.index : -1,
    };
  } catch {
    return { last: 'landing_view', lastIndex: -1 };
  }
}

function advanceFunnel(step: FunnelStep): { current_step: FunnelStep; step_index: number; last_step: FunnelStep; last_index: number } {
  const stepIndex = FUNNEL_ORDER.indexOf(step);
  const prev = currentFunnel();
  if (stepIndex >= 0 && stepIndex > prev.lastIndex) {
    try {
      localStorage.setItem(
        FUNNEL_KEY,
        JSON.stringify({ step, index: stepIndex, updatedAt: new Date().toISOString() }),
      );
    } catch {
      /* ignore */
    }
  }
  return {
    current_step: step,
    step_index: stepIndex,
    last_step: prev.last,
    last_index: prev.lastIndex,
  };
}

function buildCtx(pathOverride?: string): BaseEvent['ctx'] {
  const w = typeof window !== 'undefined' ? window : null;
  return {
    url: w ? location.href : '',
    path: pathOverride || (w ? location.pathname : ''),
    referrer: w ? document.referrer : '',
    userAgent: w ? navigator.userAgent : '',
    viewport: w ? `${window.innerWidth}x${window.innerHeight}` : '',
    sessionId: w ? getSessionId() : '',
  };
}

function getCurrentUser(): BaseEvent['user'] {
  try {
    const raw = localStorage.getItem('lyc:tracker_user');
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

/** Call on auth change (login/logout) to associate events with user id+role. */
export function setTrackingUser(partial: { id?: string | null; role?: string | null } | null): void {
  try {
    if (!partial || (!partial.id && !partial.role)) {
      localStorage.removeItem('lyc:tracker_user');
      try { posthog.reset(); } catch { /* noop */ }
      return;
    }
    const payload: Record<string, string> = {};
    if (partial.id) payload.id = partial.id;
    if (partial.role) payload.role = partial.role;
    localStorage.setItem('lyc:tracker_user', JSON.stringify(payload));

    // Sync identity into PostHog (identify only when the caller provided id).
    if (analyticsEnabled && partial.id) {
      try {
        posthog.identify(partial.id, {
          role: partial.role || undefined,
        });
      } catch { /* ignore posthog transport failures */ }
    }
  } catch {
    /* ignore */
  }
}

// ── Buffering + flush ───────────────────────────────────────────────

const buffer: BaseEvent[] = (() => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
})();

function persistBuffer(): void {
  try {
    if (buffer.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(buffer.slice(-50)));
  } catch {
    /* storage full — drop oldest */
    try {
      buffer.splice(0, buffer.length - 20);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(buffer));
    } catch {
      /* ignore */
    }
  }
}

async function flushBuffer(force = false): Promise<void> {
  if (buffer.length === 0) return;
  const toSend = buffer.splice(0, buffer.length);
  try {
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: toSend, v: 1 }),
      keepalive: !force,
    });
  } catch {
    // Re-enqueue (at most 50 total) and try again later
    buffer.push(...toSend);
    persistBuffer();
  }
}

// Wire flush timers / visibility hooks (safe in SSR)
if (typeof window !== 'undefined') {
  setInterval(() => flushBuffer(false), FLUSH_INTERVAL_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushBuffer(true);
  });
  window.addEventListener('beforeunload', () => flushBuffer(true));
}

// ── Core track function ─────────────────────────────────────────────

export interface TrackOptions {
  /** Funnel step this event represents (advances the stored funnel index when applicable). */
  funnelStep?: FunnelStep;
  /** Path override (useful for tracking events triggered on non-route boundaries). */
  path?: string;
  /** Whether to also mirror to Vercel Analytics window.va(...) when available. */
  mirrorToVercelAnalytics?: boolean;
}

/**
 * Emit one analytics event. Persists to localStorage buffer, then flushes
 * asynchronously to /api/events. Mirrors the event to window.va when the
 * Vercel Analytics runtime is installed.
 */
export function trackEvent(
  name: string,
  props: Record<string, unknown> = {},
  opts: TrackOptions = {},
): void {
  const { funnelStep, path, mirrorToVercelAnalytics = true } = opts;

  const funnel = funnelStep ? advanceFunnel(funnelStep) : undefined;
  const event: BaseEvent = {
    name,
    timestamp: new Date().toISOString(),
    props: Object.keys(props).length ? props : undefined,
    user: getCurrentUser(),
    ctx: buildCtx(path),
    funnel,
  };

  buffer.push(event);
  if (buffer.length >= 50) {
    void flushBuffer(true);
  } else {
    persistBuffer();
  }

  // Mirror to Vercel Analytics window.va (available when Analytics script is mounted).
  if (mirrorToVercelAnalytics && typeof window !== 'undefined') {
    try {
      const wAny = window as unknown as {
        va?: (method: string, event: string, props?: Record<string, unknown>) => void;
      };
      if (typeof wAny.va === 'function') {
        const vaProps: Record<string, unknown> = { ...props };
        if (funnel) vaProps.funnel = funnel;
        wAny.va('event', name, vaProps);
      }
    } catch {
      /* ignore */
    }
  }
}

// ── Domain-specific helpers (typed properties for each conversion) ──

export function trackCTA(
  cta: {
    /** CTA location: hero | nav | pricing | assessment_card | footer | match_cta | ... */
    location:
      | 'hero'
      | 'nav_marketing'
      | 'nav_leader'
      | 'nav_consultant'
      | 'pricing_tier'
      | 'assessment_card'
      | 'footer'
      | 'match_cta'
      | 'b2b_cta'
      | 'assessment_landing'
      | 'dex_cta'
      | string;
    /** CTA label, e.g. "Try NEXUS", "Start CPI", "View Pricing" */
    label: string;
    /** Destination path this CTA navigates to, when applicable */
    destination?: string;
    /** Pricing tier slug or assessment code — contextual id depending on location */
    context_id?: string;
  },
): void {
  trackEvent('cta_click', cta, { funnelStep: cta.location === 'hero' ? 'landing_view' : undefined });
}

export function trackNexusChatInitiation(source: 'hero_cta' | 'nav_cta' | 'dex' | 'portal_nav' | 'direct_link' | string): void {
  trackEvent('nexus_chat_initiation', { source }, { funnelStep: 'nexus_chat_open' });
}

export function trackNexusFirstMessageSent(model: string): void {
  trackEvent('nexus_first_message_sent', { model }, { funnelStep: 'nexus_chat_message' });
}

export function trackAssessmentStart(
  code: string,
  name: string,
  entry: 'catalog' | 'landing' | 'nexus' | 'app_listing' | string,
): void {
  trackEvent('assessment_start', { code, name, entry }, { funnelStep: 'assessment_start' });
}

export function trackAssessmentComplete(
  code: string,
  name: string,
  durationSeconds: number,
  completionStatus: 'completed' | 'abandoned' | 'partial',
): void {
  trackEvent(
    'assessment_complete',
    { code, name, durationSeconds, completionStatus },
    { funnelStep: completionStatus === 'completed' ? 'assessment_complete' : undefined },
  );
}

export function trackAssessmentPurchase(code: string, name: string, milesCost: number, currency: 'miles' | 'usd' | 'cny' = 'miles'): void {
  trackEvent('assessment_purchase', { code, name, milesCost, currency });
}

export function trackSignupSuccess(method: 'email' | 'oauth_google' | 'magic_link' | string, role?: string): void {
  trackEvent('signup_success', { method, role }, { funnelStep: 'signup' });
}

export function trackLoginSuccess(method: 'email' | 'oauth_google' | string, role?: string): void {
  trackEvent('login_success', { method, role });
}

export function trackUpgradeAttempt(
  tier: string,
  source: 'billing' | 'modal' | 'pricing_page' | 'miles_depleted' | string,
): void {
  trackEvent('upgrade_attempt', { tier, source }, { funnelStep: 'upgrade' });
}

export function trackPurchaseSuccess(tier: string, amount: number, currency: 'usd' | 'cny', source: string): void {
  trackEvent('purchase_success', { tier, amount, currency, source }, { funnelStep: 'upgrade' });
}

export function trackBillingView(source: 'nav' | 'link' | 'redirect' | string): void {
  trackEvent('billing_view', { source });
}

// ── Route change hook (auto-tracks page view + landing_view funnel step on first load) ──

let firstPageViewEmitted = false;

/**
 * Call inside App.tsx (outside Suspense, inside Router context) to
 * auto-track every SPA route change. Emits `page_view` events and the
 * initial landing_view funnel step.
 */
export function useRoutePageViewTracker(): void {
  const location = useLocation();
  useEffect(() => {
    const isFirst = !firstPageViewEmitted;
    firstPageViewEmitted = true;
    trackEvent(
      'page_view',
      {
        path: location.pathname,
        search: location.search || undefined,
        is_first: isFirst,
      },
      isFirst ? { funnelStep: 'landing_view', path: location.pathname } : { path: location.pathname },
    );
    // Also forward to PostHog for dashboarding when the key is set.
    // PostHog's native `capture_pageview` is disabled (see analytics.ts)
    // so we drive this manually with router precision.
    try {
      const user = getCurrentUser();
      posthogTrackPageView(
        location.pathname + (location.search || ''),
        (user?.role as any) || undefined,
      );
      // PostHog $pageview override to keep dashboards intact:
      if (analyticsEnabled) {
        posthog.capture('$pageview', {
          $current_url: window.location.href,
          $pathname: location.pathname,
        });
      }
    } catch { /* transport failures are OK */ }
  }, [location.pathname, location.search]);
}
