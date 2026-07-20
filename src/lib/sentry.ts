/**
 * src/lib/sentry.ts — Error Monitoring & Performance Tracking
 * Issue #28: Sentry integration for error monitoring and performance
 */
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/browser';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || process.env.VITE_SENTRY_DSN;
const ENV = import.meta.env.MODE || process.env.NODE_ENV || 'development';

export function initSentry() {
  if (!SENTRY_DSN) {
    console.warn('[Sentry] DSN not configured — error monitoring disabled');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENV,
    release: import.meta.env.VITE_APP_VERSION || 'dev',
    integrations: [
      new BrowserTracing({
        tracePropagationTargets: ['localhost', /^https:\/\/.*lyc-intelligence\.vercel\.app/],
      }),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    tracesSampleRate: ENV === 'production' ? 0.1 : 1.0,
    replaysSessionSampleRate: ENV === 'production' ? 0.05 : 0.1,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event) {
      // Sanitize PII
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
      }
      return event;
    },
  });
}

export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, { extra: context });
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}

export function setUserContext(user: { id: string; role?: string; org?: string }) {
  Sentry.setUser({
    id: user.id,
    role: user.role,
    organization: user.org,
  });
}

export function clearUserContext() {
  Sentry.setUser(null);
}

export function startTransaction(name: string, op: string) {
  return Sentry.startTransaction({ name, op });
}
