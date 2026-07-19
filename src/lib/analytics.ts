/**
 * Event tracking system — Issue #38: Analytics & Event Tracking
 *
 * Client-side analytics hook + event definitions.
 * Tracks user behavior, feature usage, and conversion events.
 * Batches events and sends to /api/analytics/track endpoint.
 */

import { useCallback, useEffect, useRef } from 'react';

/* ------------------------------------------------------------------ */
/* Event definitions                                                   */
/* ------------------------------------------------------------------ */

export type AnalyticsEvent =
  | { name: 'page_view'; properties: { path: string; referrer?: string; title?: string } }
  | { name: 'signup_started'; properties: { source?: string } }
  | { name: 'signup_completed'; properties: { role?: string; source?: string } }
  | { name: 'login'; properties: { method: 'email' | 'google' | 'linkedin' } }
  | { name: 'feature_used'; properties: { feature: string; module?: string } }
  | { name: 'search_performed'; properties: { query?: string; filters?: Record<string, any>; result_count?: number } }
  | { name: 'profile_viewed'; properties: { profile_type: string; profile_id: string } }
  | { name: 'mandate_viewed'; properties: { mandate_id: string } }
  | { name: 'candidate_shortlisted'; properties: { mandate_id: string; candidate_id: string } }
  | { name: 'feedback_submitted'; properties: { mandate_id: string; feedback_type: string } }
  | { name: 'interview_scheduled'; properties: { mandate_id: string; candidate_id: string } }
  | { name: 'course_enrolled'; properties: { course_id: string; course_title?: string } }
  | { name: 'lesson_completed'; properties: { course_id: string; lesson_id: string } }
  | { name: 'certificate_earned'; properties: { course_id: string } }
  | { name: 'payment_completed'; properties: { amount: number; currency: string; product: string } }
  | { name: 'onboarding_step_completed'; properties: { step: number; total_steps: number } }
  | { name: 'onboarding_completed'; properties: { duration_seconds?: number } }
  | { name: 'notification_opened'; properties: { notification_id: string; type: string } }
  | { name: 'chat_message_sent'; properties: { module: string; message_length?: number } };

/* ------------------------------------------------------------------ */
/* Event batch config                                                  */
/* ------------------------------------------------------------------ */

const BATCH_SIZE = 10;
const BATCH_INTERVAL_MS = 5000;
const STORAGE_KEY = 'lyc_analytics_queue';

interface QueuedEvent {
  name: string;
  properties: Record<string, any>;
  timestamp: string;
  session_id: string;
  anonymous_id?: string;
}

let sessionId: string | null = null;
let anonymousId: string | null = null;

function getSessionId(): string {
  if (sessionId) return sessionId;
  const existing = sessionStorage.getItem('lyc_session_id');
  if (existing) {
    sessionId = existing;
  } else {
    sessionId = `sess_${Math.random().toString(36).slice(2, 18)}`;
    sessionStorage.setItem('lyc_session_id', sessionId);
  }
  return sessionId;
}

function getAnonymousId(): string {
  if (anonymousId) return anonymousId;
  const existing = localStorage.getItem('lyc_anonymous_id');
  if (existing) {
    anonymousId = existing;
  } else {
    anonymousId = `anon_${Math.random().toString(36).slice(2, 18)}`;
    localStorage.setItem('lyc_anonymous_id', anonymousId);
  }
  return anonymousId;
}

/* ------------------------------------------------------------------ */
/* Queue management                                                    */
/* ------------------------------------------------------------------ */

function loadQueue(): QueuedEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedEvent[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // Storage might be full — drop oldest events
    if (queue.length > BATCH_SIZE) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(queue.slice(-BATCH_SIZE)));
      } catch {
        /* ignore */
      }
    }
  }
}

async function flushQueue(): Promise<void> {
  const queue = loadQueue();
  if (queue.length === 0) return;

  const batch = queue.slice(0, BATCH_SIZE);
  const remaining = queue.slice(BATCH_SIZE);

  try {
    const res = await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ events: batch }),
    });
    if (!res.ok) throw new Error('Track failed');
    saveQueue(remaining);
    // Recursively flush if more events remain
    if (remaining.length >= BATCH_SIZE) {
      await flushQueue();
    }
  } catch {
    // Put events back in queue for retry
    saveQueue([...batch, ...remaining]);
  }
}

/* ------------------------------------------------------------------ */
/* Track function                                                       */
/* ------------------------------------------------------------------ */

export function trackEvent(event: AnalyticsEvent) {
  const queued: QueuedEvent = {
    name: event.name,
    properties: (event as any).properties || {},
    timestamp: new Date().toISOString(),
    session_id: getSessionId(),
    anonymous_id: getAnonymousId(),
  };

  const queue = loadQueue();
  queue.push(queued);
  saveQueue(queue);

  // If we've reached batch size, flush immediately
  if (queue.length >= BATCH_SIZE) {
    flushQueue();
  }
}

/* ------------------------------------------------------------------ */
/* React hook                                                          */
/* ------------------------------------------------------------------ */

export function useAnalytics() {
  const flushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Set up periodic flush
  useEffect(() => {
    flushTimerRef.current = setInterval(flushQueue, BATCH_INTERVAL_MS);
    // Flush on page hide
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        flushQueue();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    // Flush on unload
    const handleBeforeUnload = () => {
      flushQueue();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (flushTimerRef.current) clearInterval(flushTimerRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const track = useCallback((event: AnalyticsEvent) => {
    trackEvent(event);
  }, []);

  const trackPageView = useCallback((path: string, title?: string) => {
    trackEvent({
      name: 'page_view',
      properties: {
        path,
        title,
        referrer: document.referrer,
      },
    });
  }, []);

  return { track, trackPageView };
}

/* ------------------------------------------------------------------ */
/* Page view tracker component (wrap <Routes>)                         */
/* ------------------------------------------------------------------ */

import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';

export function AnalyticsPageTracker() {
  const location = useLocation();

  useEffect(() => {
    trackEvent({
      name: 'page_view',
      properties: {
        path: location.pathname + location.search,
        title: document.title,
        referrer: document.referrer,
      },
    });
  }, [location.pathname, location.search]);

  return null;
}

/* ------------------------------------------------------------------ */
/* Init function (called from main.tsx)                                 */
/* ------------------------------------------------------------------ */

export function initAnalytics() {
  // Pre-warm session + anonymous IDs
  getSessionId();
  getAnonymousId();
  // Flush any stale events from previous session
  flushQueue();
  // Set up periodic flush
  setInterval(flushQueue, BATCH_INTERVAL_MS);
  // Flush on visibility change
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushQueue();
  });
}
