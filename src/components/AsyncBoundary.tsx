/**
 * AsyncBoundary — convenience wrapper composing ErrorBoundary + Suspense.
 *
 * Consumers can wrap async (Suspense-throwing) children in a single
 * component and get both a loading fallback and an error fallback out of
 * the box, with the same knobs exposed for customization.
 */
import React from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SuspenseFallback } from '@/components/SuspenseFallback';

export interface AsyncBoundaryProps {
  children: React.ReactNode;
  /** ErrorBoundary level. Default 'section'. */
  level?: 'page' | 'section';
  /** Passed to SuspenseFallback. */
  suspenseLabel?: string;
  suspenseLines?: number;
  /** ErrorBoundary onError. */
  onError?: (error: Error, info: React.ErrorInfo) => void;
  /** ErrorBoundary resetKeys. */
  resetKeys?: unknown[];
}

export function AsyncBoundary({
  children,
  level = 'section',
  suspenseLabel,
  suspenseLines,
  onError,
  resetKeys,
}: AsyncBoundaryProps) {
  return (
    <ErrorBoundary level={level} onError={onError} resetKeys={resetKeys}>
      <React.Suspense
        fallback={<SuspenseFallback label={suspenseLabel} lines={suspenseLines} />}
      >
        {children}
      </React.Suspense>
    </ErrorBoundary>
  );
}

export default AsyncBoundary;
