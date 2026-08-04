import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts';
import './index.css';
import './styles/tokens.css';
import { initAnalytics } from './lib/analytics';

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
      // Strip any auth cookies or local auth tokens from tags/extra if present.
      if (event.tags) {
        delete (event.tags as Record<string, unknown>).auth;
      }
      return event;
    },
  });
}

initAnalytics();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
