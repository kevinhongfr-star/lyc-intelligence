/**
 * Analytics Service
 * 
 * Centralized event tracking for the platform.
 * Supports multiple backends: GA4, PostHog, custom events.
 */

// GA4 script loader
export function initAnalytics(): void {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!measurementId || typeof window === 'undefined') return;

  // Load gtag.js
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  // Initialize gtag
  (window as any).dataLayer = (window as any).dataLayer || [];
  function gtag(...args: any[]) {
    (window as any).dataLayer.push(args);
  }
  (window as any).gtag = gtag;
  gtag('js', new Date());
  gtag('config', measurementId, { send_page_view: false });
}

type EventCategory = 
  | 'engagement'
  | 'conversion'
  | 'navigation'
  | 'search'
  | 'form'
  | 'error'
  | 'performance';

type EventAction =
  | 'page_view'
  | 'click'
  | 'submit'
  | 'search'
  | 'filter'
  | 'download'
  | 'share'
  | 'signup'
  | 'login'
  | 'purchase'
  | 'error'
  | 'timing';

interface AnalyticsEvent {
  category: EventCategory;
  action: EventAction;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
}

// Check if analytics is enabled
const isAnalyticsEnabled = (): boolean => {
  return typeof window !== 'undefined' && !!(window as any).gtag;
};

// Get GA4 measurement ID
const getMeasurementId = (): string => {
  return import.meta.env.VITE_GA_MEASUREMENT_ID || '';
};

/**
 * Track a page view
 */
export function trackPageView(path: string, title?: string): void {
  if (!isAnalyticsEnabled()) return;

  (window as any).gtag('config', getMeasurementId(), {
    page_path: path,
    page_title: title || document.title,
  });

  // Also send to custom analytics endpoint if configured
  sendToCustomAnalytics('page_view', { path, title });
}

/**
 * Track a custom event
 */
export function trackEvent(event: AnalyticsEvent): void {
  if (!isAnalyticsEnabled()) return;

  (window as any).gtag('event', event.action, {
    event_category: event.category,
    event_label: event.label,
    value: event.value,
    ...event.metadata,
  });

  // Also send to custom analytics
  sendToCustomAnalytics('event', event);
}

/**
 * Track user signup
 */
export function trackSignup(method: 'email' | 'google' | 'magic_link', tier?: string): void {
  trackEvent({
    category: 'conversion',
    action: 'signup',
    label: method,
    metadata: { tier },
  });
}

/**
 * Track login
 */
export function trackLogin(method: 'email' | 'google' | 'magic_link'): void {
  trackEvent({
    category: 'engagement',
    action: 'login',
    label: method,
  });
}

/**
 * Track credit purchase
 */
export function trackCreditPurchase(pack: string, amount: number, credits: number): void {
  trackEvent({
    category: 'conversion',
    action: 'purchase',
    label: pack,
    value: amount,
    metadata: { credits },
  });
}

/**
 * Track Council application
 */
export function trackCouncilApplication(tier: string): void {
  trackEvent({
    category: 'conversion',
    action: 'submit',
    label: `council_application_${tier}`,
  });
}

/**
 * Track search
 */
export function trackSearch(query: string, results: number, source: string): void {
  trackEvent({
    category: 'search',
    action: 'search',
    label: source,
    value: results,
    metadata: { query },
  });
}

/**
 * Track error
 */
export function trackError(errorType: string, message: string, fatal: boolean = false): void {
  trackEvent({
    category: 'error',
    action: 'error',
    label: errorType,
    metadata: { message, fatal },
  });
}

/**
 * Track performance timing
 */
export function trackTiming(category: string, variable: string, timeMs: number): void {
  trackEvent({
    category: 'performance',
    action: 'timing',
    label: `${category}:${variable}`,
    value: timeMs,
  });
}

/**
 * Track DEX AI message
 */
export function trackDexMessage(messageLength: number, gated: boolean): void {
  trackEvent({
    category: 'engagement',
    action: 'click',
    label: gated ? 'dex_message_gated' : 'dex_message',
    value: messageLength,
  });
}

/**
 * Track mandate application
 */
export function trackMandateApplication(mandateId: string): void {
  trackEvent({
    category: 'conversion',
    action: 'submit',
    label: 'mandate_application',
    metadata: { mandate_id: mandateId },
  });
}

/**
 * Track event RSVP
 */
export function trackEventRsvp(eventId: string, action: 'rsvp' | 'cancel'): void {
  trackEvent({
    category: 'engagement',
    action: 'click',
    label: `event_${action}`,
    metadata: { event_id: eventId },
  });
}

// Send to custom analytics endpoint (optional)
async function sendToCustomAnalytics(type: string, data: any): Promise<void> {
  const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
  if (!endpoint) return;

  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        data,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        referrer: document.referrer,
      }),
      keepalive: true, // Ensure request completes even if page unloads
    });
  } catch (e) {
    // Silently fail - don't impact UX
  }
}

// Export a hook for React components
import { useCallback } from 'react';

export function useAnalytics() {
  return {
    trackPageView: useCallback(trackPageView, []),
    trackEvent: useCallback(trackEvent, []),
    trackSignup: useCallback(trackSignup, []),
    trackLogin: useCallback(trackLogin, []),
    trackCreditPurchase: useCallback(trackCreditPurchase, []),
    trackCouncilApplication: useCallback(trackCouncilApplication, []),
    trackSearch: useCallback(trackSearch, []),
    trackError: useCallback(trackError, []),
    trackTiming: useCallback(trackTiming, []),
    trackDexMessage: useCallback(trackDexMessage, []),
    trackMandateApplication: useCallback(trackMandateApplication, []),
    trackEventRsvp: useCallback(trackEventRsvp, []),
  };
}