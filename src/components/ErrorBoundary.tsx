import React from 'react';

interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends React.Component<{children: React.ReactNode}, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, fontFamily: 'system-ui', maxWidth: 600, margin: '0 auto' }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Something went wrong</h1>
          <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, fontSize: 13, overflow: 'auto', color: '#c00' }}>
            {this.state.error?.message}
          </pre>
          <button onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
            style={{ marginTop: 16, padding: '10px 20px', background: '#C108AB', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
