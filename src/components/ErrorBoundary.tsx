import React from 'react';

interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends React.Component<{children: React.ReactNode}, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-bg-primary border border-bg-tertiary p-8 max-w-2xl mx-auto my-16">
          <h1 className="font-serif text-xl font-bold text-text-primary mb-3">Something went wrong</h1>
          <pre className="bg-bg-secondary border border-bg-tertiary p-4 text-xs overflow-auto text-error font-mono">
            {this.state.error?.message}
          </pre>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
            className="mt-4 bg-accent text-white px-5 py-2 text-sm font-medium hover:bg-accent-hover transition-colors"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
