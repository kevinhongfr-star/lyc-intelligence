import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'We could not load this content. Please try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-10 flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 bg-bg-secondary border border-bg-tertiary flex items-center justify-center mb-4">
        <AlertTriangle className="w-5 h-5 text-error" />
      </div>
      <h3 className="font-serif text-lg font-bold text-text-primary">{title}</h3>
      <p className="text-sm text-text-muted mt-1 max-w-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent-hover transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      )}
    </div>
  );
}

export default ErrorState;
