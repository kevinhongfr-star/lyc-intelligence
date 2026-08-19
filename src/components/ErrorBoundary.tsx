import React from 'react';
import { V1 } from '@/styles/v1-tokens';
import { reportError } from '@/analytics/errorMonitor';

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
  onError?: (error: Error, info: React.ErrorInfo) => void;
  resetKeys?: unknown[];
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
    reportError(error, {
      scope: 'react:error_boundary',
      componentStack: info.componentStack ?? undefined,
      severity: 'error',
    });
    if (this.props.onError) {
      this.props.onError(error, info);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
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

const TRIANGLE_SVG = (
  <svg
    width="48"
    height="48"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <polygon
      points="24,4 44,44 4,44"
      stroke={V1.teal600}
      strokeWidth="2"
      strokeLinejoin="miter"
      fill="none"
    />
    <line
      x1="24"
      y1="18"
      x2="24"
      y2="30"
      stroke={V1.teal600}
      strokeWidth="2"
      strokeLinecap="square"
    />
    <line
      x1="24"
      y1="34"
      x2="24"
      y2="38"
      stroke={V1.teal600}
      strokeWidth="2"
      strokeLinecap="square"
    />
  </svg>
);

const BUTTON_PRIMARY_STYLE: React.CSSProperties = {
  fontFamily: V1.monoFont,
  fontSize: '0.7rem',
  letterSpacing: V1.trackingMono,
  textTransform: 'uppercase',
  backgroundColor: V1.teal800,
  color: V1.white,
  border: 'none',
  borderRadius: 0,
  padding: '10px 16px',
  cursor: 'pointer',
  lineHeight: V1.leadingLabel,
  fontWeight: V1.fwMedium,
};

const BUTTON_OUTLINE_STYLE: React.CSSProperties = {
  fontFamily: V1.monoFont,
  fontSize: '0.7rem',
  letterSpacing: V1.trackingMono,
  textTransform: 'uppercase',
  backgroundColor: 'transparent',
  color: V1.teal800,
  border: `1px solid ${V1.teal800}`,
  borderRadius: 0,
  padding: '10px 16px',
  cursor: 'pointer',
  lineHeight: V1.leadingLabel,
  fontWeight: V1.fwMedium,
};

const TITLE_STYLE: React.CSSProperties = {
  fontFamily: V1.displayFont,
  fontSize: V1.textH3,
  color: V1.text,
  fontWeight: V1.fwSemibold,
  lineHeight: V1.leadingHeading,
  margin: 0,
};

const BODY_STYLE: React.CSSProperties = {
  fontFamily: V1.bodyFont,
  fontSize: V1.textBodySm,
  color: V1.textSecondary,
  lineHeight: V1.leadingBody,
  margin: 0,
};

const ERROR_PREVIEW_STYLE: React.CSSProperties = {
  fontFamily: V1.monoFont,
  fontSize: '0.75rem',
  color: V1.ink700,
  border: `1px solid ${V1.ink200}`,
  backgroundColor: V1.white,
  padding: '10px 12px',
  maxHeight: 240,
  overflow: 'auto',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
  margin: 0,
  lineHeight: 1.5,
};

function DefaultFallback({ error, level, reset }: DefaultFallbackProps) {
  const actions = (
    <div
      style={{
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        marginTop: level === 'page' ? 16 : 12,
      }}
    >
      <button
        type="button"
        style={BUTTON_PRIMARY_STYLE}
        onClick={() => window.location.reload()}
      >
        Reload page
      </button>
      <button type="button" style={BUTTON_OUTLINE_STYLE} onClick={reset}>
        Try again
      </button>
    </div>
  );

  if (level === 'page') {
    return (
      <div
        role="alert"
        aria-live="assertive"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: V1.cream,
          padding: 24,
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 512,
            border: `1px solid ${V1.ink200}`,
            backgroundColor: V1.white,
            padding: 32,
          }}
        >
          {TRIANGLE_SVG}
          <div style={{ height: 16 }} />
          <h1 style={TITLE_STYLE}>Something went wrong</h1>
          <div style={{ height: 8 }} />
          <p style={BODY_STYLE}>
            An unexpected error occurred. You can try reloading the page or
            retrying the action.
          </p>
          <div style={{ height: 16 }} />
          <pre style={ERROR_PREVIEW_STYLE}>{error.message}</pre>
          {actions}
        </div>
      </div>
    );
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        border: `1px solid ${V1.teal600}`,
        backgroundColor: V1.teal50,
        padding: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flexShrink: 0 }}>
          <svg
            width="28"
            height="28"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <polygon
              points="24,4 44,44 4,44"
              stroke={V1.teal600}
              strokeWidth="2"
              strokeLinejoin="miter"
              fill="none"
            />
            <line
              x1="24"
              y1="18"
              x2="24"
              y2="30"
              stroke={V1.teal600}
              strokeWidth="2"
              strokeLinecap="square"
            />
            <line
              x1="24"
              y1="34"
              x2="24"
              y2="38"
              stroke={V1.teal600}
              strokeWidth="2"
              strokeLinecap="square"
            />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2
            style={{
              fontFamily: V1.displayFont,
              fontSize: 18,
              color: V1.text,
              fontWeight: V1.fwSemibold,
              lineHeight: V1.leadingHeading,
              margin: 0,
            }}
          >
            Something went wrong
          </h2>
          <div style={{ height: 8 }} />
          <pre
            style={{
              ...ERROR_PREVIEW_STYLE,
              maxHeight: 128,
              fontSize: '0.7rem',
              padding: '8px 10px',
            }}
          >
            {error.message}
          </pre>
          {actions}
        </div>
      </div>
    </div>
  );
}

export { ErrorBoundary };
export default ErrorBoundary;
