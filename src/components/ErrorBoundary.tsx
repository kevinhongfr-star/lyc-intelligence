/**
 * ErrorBoundary — class-based React error boundary.
 *
 * Phase 3 strengthening of the minimal Phase 0 boundary. Adds:
 *   - `fallback` render prop (receives error + reset)
 *   - `onError` callback for logging/Sentry
 *   - `resetKeys` auto-reset on prop change
 *   - `level` ('page' | 'section') presentation toggle
 *   - Accessible default fallback (role="alert", aria-live="assertive")
 *
 * Default export name kept as `ErrorBoundary`; named export also available.
 */
import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui';

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Custom fallback render. Receives the error + a reset() callback. */
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
  /** Called when an error is caught (for logging/Sentry). */
  onError?: (error: Error, info: React.ErrorInfo) => void;
  /** When any of these values change, the boundary auto-resets. */
  resetKeys?: unknown[];
  /** Level affects presentation: 'page' (full page) vs 'section' (inline card). Default 'section'. */
  level?: 'page' | 'section';
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    if (this.props.onError) {
      this.props.onError(error, info);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // Only auto-reset when currently in an error state.
    if (!this.state.hasError) return;

    const prev = prevProps.resetKeys ?? [];
    const next = this.props.resetKeys ?? [];

    if (prev.length !== next.length) {
      this.reset();
      return;
    }
    for (let i = 0; i < next.length; i++) {
      if (!Object.is(prev[i], next[i])) {
        this.reset();
        return;
      }
    }
  }

  reset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }
      return (
        <DefaultFallback
          error={this.state.error}
          level={this.props.level ?? 'section'}
          reset={this.reset}
        />
      );
    }
    return this.props.children;
  }
}

interface DefaultFallbackProps {
  error: Error;
  level: 'page' | 'section';
  reset: () => void;
}

function DefaultFallback({ error, level, reset }: DefaultFallbackProps) {
  const actions = (
    <div className={level === 'page' ? 'mt-4 flex gap-2' : 'mt-3 flex gap-2'}>
      <Button
        variant="default"
        leftIcon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
        onClick={() => window.location.reload()}
      >
        Reload page
      </Button>
      <Button variant="outline" onClick={reset}>
        Try again
      </Button>
    </div>
  );

  if (level === 'page') {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="min-h-screen flex items-center justify-center bg-bg-primary p-6"
      >
        <div className="w-full max-w-lg border border-bg-tertiary bg-bg-secondary p-6">
          <AlertTriangle className="h-8 w-8 text-red-600" aria-hidden="true" />
          <h1 className="mt-3 text-xl font-semibold text-text-primary">
            Something went wrong
          </h1>
          <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap break-words bg-bg-tertiary p-3 text-sm text-red-600">
            {error.message}
          </pre>
          {actions}
        </div>
      </div>
    );
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="border border-red-600/40 bg-bg-secondary p-4"
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-red-600" aria-hidden="true" />
        <h2 className="text-base font-semibold text-text-primary">
          Something went wrong
        </h2>
      </div>
      <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap break-words bg-bg-tertiary p-2 text-xs text-red-600">
        {error.message}
      </pre>
      {actions}
    </div>
  );
}

export { ErrorBoundary };
export default ErrorBoundary;
