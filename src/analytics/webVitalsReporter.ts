/**
 * Phase 1 / #1288 — Web Vitals reporter.
 *
 * Dependency-free performance tracking using the PerformanceObserver API.
 * Captures LCP, CLS, INP, FCP, and TTFB and routes them through:
 *   1. PostHog (when VITE_POSTHOG_KEY is set)
 *   2. The event tracker (for the /api/events pipeline)
 *
 * Initialization is idempotent — safe to call multiple times.
 */

interface VitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  id: string;
}

// Rating thresholds per Google's Web Vitals guidelines
const THRESHOLDS: Record<string, { good: number; poor: number }> = {
  LCP: { good: 2500, poor: 4000 },   // ms
  CLS: { good: 0.1, poor: 0.25 },    // score
  INP: { good: 200, poor: 500 },     // ms
  FCP: { good: 1800, poor: 3000 },   // ms
  TTFB: { good: 800, poor: 1800 },   // ms
};

function rate(name: string, value: number): VitalMetric['rating'] {
  const t = THRESHOLDS[name];
  if (!t) return 'good';
  if (value <= t.good) return 'good';
  if (value >= t.poor) return 'poor';
  return 'needs-improvement';
}

async function reportVital(metric: VitalMetric): Promise<void> {
  // Route through PostHog if available
  try {
    const { analyticsEnabled } = await import('@/lib/analytics');
    if (analyticsEnabled) {
      const { default: posthog } = await import('posthog-js');
      posthog.capture('web_vital', {
        metric: metric.name,
        value: Math.round(metric.value * 100) / 100,
        rating: metric.rating,
        id: metric.id,
        $set_once: { [`last_${metric.name}`]: metric.value },
      });
    }
  } catch {
    // PostHog not available — no-op
  }

  // Route through the event tracker pipeline
  try {
    const { trackEvent } = await import('@/analytics/eventTracker');
    trackEvent('web_vital', {
      metric: metric.name,
      value: Math.round(metric.value * 100) / 100,
      rating: metric.rating,
    });
  } catch {
    // no-op
  }
}

let initialized = false;

export function initWebVitalsReporter(): void {
  if (initialized) return;
  if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') return;
  initialized = true;

  const sessionId = Math.random().toString(36).slice(2, 10);

  // ── LCP (Largest Contentful Paint) ──
  let lcpValue = 0;
  const lcpObserver = new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    const lastEntry = entries[entries.length - 1];
    if (lastEntry) {
      lcpValue = lastEntry.startTime;
    }
  });
  try {
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch { /* type not supported */ }

  // Report LCP on page hide
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && lcpValue > 0) {
      reportVital({
        name: 'LCP',
        value: lcpValue,
        rating: rate('LCP', lcpValue),
        id: sessionId,
      });
      lcpValue = 0; // reset for SPA navigation
    }
  });

  // ── CLS (Cumulative Layout Shift) ──
  let clsValue = 0;
  const clsObserver = new PerformanceObserver((entryList) => {
    for (const entry of entryList.getEntries()) {
      const layoutShift = entry as any;
      if (!layoutShift.hadRecentInput) {
        clsValue += layoutShift.value || 0;
      }
    }
  });
  try {
    clsObserver.observe({ type: 'layout-shift', buffered: true });
  } catch { /* type not supported */ }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && clsValue > 0) {
      reportVital({
        name: 'CLS',
        value: clsValue,
        rating: rate('CLS', clsValue),
        id: sessionId,
      });
      clsValue = 0;
    }
  });

  // ── INP (Interaction to Next Paint) ──
  let maxINP = 0;
  const inpObserver = new PerformanceObserver((entryList) => {
    for (const entry of entryList.getEntries()) {
      const duration = (entry as any).duration || 0;
      if (duration > maxINP) maxINP = duration;
    }
  });
  try {
    inpObserver.observe({ type: 'event', buffered: true });
  } catch { /* type not supported */ }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && maxINP > 0) {
      reportVital({
        name: 'INP',
        value: maxINP,
        rating: rate('INP', maxINP),
        id: sessionId,
      });
      maxINP = 0;
    }
  });

  // ── FCP (First Contentful Paint) ──
  const fcpObserver = new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    const firstEntry = entries[0];
    if (firstEntry) {
      reportVital({
        name: 'FCP',
        value: firstEntry.startTime,
        rating: rate('FCP', firstEntry.startTime),
        id: sessionId,
      });
    }
  });
  try {
    fcpObserver.observe({ type: 'paint', buffered: true });
  } catch { /* type not supported */ }

  // ── TTFB (Time to First Byte) ──
  const navEntries = performance.getEntriesByType('navigation');
  if (navEntries.length > 0) {
    const nav = navEntries[0] as PerformanceNavigationTiming;
    const ttfb = nav.responseStart - nav.requestStart;
    if (ttfb > 0) {
      reportVital({
        name: 'TTFB',
        value: ttfb,
        rating: rate('TTFB', ttfb),
        id: sessionId,
      });
    }
  }
}
