import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { initAnalytics } from './lib/analytics';
import { installGlobalErrorHandlers, scrubErrorMessage } from './analytics/errorMonitor';

// ── Sentry Error Monitoring (S4-T02) ──
// Only activate when a DSN is explicitly configured. In dev/preview this is
// a no-op. For production set VITE_SENTRY_DSN in .env.production.
const sentryDsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.browserProfilingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: 0.2,
    tracePropagationTargets: [/^\/api\//],
    profilesSampleRate: 0.1,
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0,
    environment: import.meta.env.MODE,
    release: (import.meta.env.VITE_APP_RELEASE as string | undefined) ?? 'dev',
    enabled: true,
    beforeSend(event) {
      // W4-7 / #1288 — PII scrubbing on every Sentry event.
      // Sentry's automatic capture (window.onerror etc.) runs in parallel
      // to our reportError() pipeline, so we must scrub here too.
      if (event.tags) {
        delete (event.tags as Record<string, unknown>).auth;
      }
      // Scrub exception messages + stacktrace frames (may contain user input
      // e.g. "Failed to process: <chat message>").
      if (event.exception?.values) {
        for (const ex of event.exception.values) {
          if (ex.value) ex.value = scrubErrorMessage(ex.value);
          if (ex.stacktrace?.frames) {
            for (const frame of ex.stacktrace.frames) {
              if (frame.vars) {
                for (const key of Object.keys(frame.vars)) {
                  frame.vars[key] = scrubErrorMessage(String(frame.vars[key]));
                }
              }
            }
          }
        }
      }
      // Scrub breadcrumb messages (may contain navigation params with PII).
      if (event.breadcrumbs) {
        for (const crumb of event.breadcrumbs) {
          if (crumb.message) crumb.message = scrubErrorMessage(crumb.message);
          if (crumb.data) {
            for (const key of Object.keys(crumb.data)) {
              crumb.data[key] = scrubErrorMessage(String(crumb.data[key]));
            }
          }
        }
      }
      return event;
    },
  });
}

initAnalytics();

// Install onerror / unhandledrejection → reportError() pipeline.
// (installGlobalErrorHandlers is idempotent.)
installGlobalErrorHandlers();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
