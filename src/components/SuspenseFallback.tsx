/**
 * SuspenseFallback — reusable loading fallback for React.Suspense.
 *
 * Renders an accessible status region with optional spinner + N skeleton
 * bars (first bar narrower to suggest a title). Imports Skeleton from the
 * design system barrel so styling stays consistent.
 */
import { Skeleton } from '@/components/ui';

export interface SuspenseFallbackProps {
  /** Number of skeleton lines. Default 3. */
  lines?: number;
  /** Label announced to screen readers. Default "Loading…". */
  label?: string;
  /** Show a spinner above the skeletons. Default false. */
  spinner?: boolean;
}

export function SuspenseFallback({
  lines = 3,
  label = 'Loading…',
  spinner = false,
}: SuspenseFallbackProps) {
  return (
    <div role="status" aria-live="polite" aria-label={label}>
      {spinner && (
        <svg
          className="animate-spin h-6 w-6 text-accent"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} width={i === 0 ? '50%' : '100%'} />
        ))}
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}

export default SuspenseFallback;
