import React, { Suspense, useCallback, useState, Component, ComponentType, LazyExoticComponent } from 'react';

interface LazyLoadProps {
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function LazyLoad({ fallback, children }: LazyLoadProps) {
  return <Suspense fallback={fallback || <DefaultFallback />}>{children}</Suspense>;
}

function DefaultFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="w-8 h-8 border-2 border-border border-t-primary rounded-none animate-spin" style={{ borderRadius: '50%' }} />
    </div>
  );
}

interface RetryErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: (error: Error, retry: () => void) => React.ReactNode;
  onError?: (error: Error) => void;
}

interface RetryErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class RetryErrorBoundary extends Component<RetryErrorBoundaryProps, RetryErrorBoundaryState> {
  constructor(props: RetryErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): RetryErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <p className="text-text-secondary mb-4">Failed to load component.</p>
          <button
            onClick={this.handleRetry}
            className="px-4 py-2 bg-primary text-white text-sm font-medium hover:bg-primary/90"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

interface AsyncComponentProps {
  loader: () => Promise<{ default: ComponentType<any> }>;
  fallback?: React.ReactNode;
  [key: string]: any;
}

export function AsyncComponent({ loader, fallback, ...props }: AsyncComponentProps) {
  const LazyComp = React.lazy(loader);
  return (
    <RetryErrorBoundary>
      <Suspense fallback={fallback || <DefaultFallback />}>
        <LazyComp {...props} />
      </Suspense>
    </RetryErrorBoundary>
  );
}
