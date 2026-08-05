/**
 * Tests for the strengthened ErrorBoundary.
 *
 * Covers:
 *   - rendering children when no error
 *   - default section fallback (heading + message + role="alert")
 *   - page-level fallback (min-h-screen container)
 *   - onError callback invocation
 *   - custom fallback render prop + reset() recovery
 *   - resetKeys change auto-reset
 *
 * NOTE: `@/components/ui` barrel transitively pulls in `@/stores/authStore`,
 * which imports `@/lib/supabase/client` — whose top-level `createClient` crashes
 * under Node 24 (no native WebSocket). We stub that module so the barrel can
 * load in the test environment. This stub is safe because authStore only stores
 * the client reference (gated by `isSupabaseConfigured`) and never calls it at
 * module load; our tests never exercise supabase.
 */
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { fireEvent, render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

// Hoisted above imports by vitest — prevents the real createClient() from running.
vi.mock('@/lib/supabase/client', () => ({
  supabase: {} as unknown as SupabaseClient,
  isSupabaseConfigured: false,
}));

function Thrower({ message = 'boom' }: { message?: string }): ReactNode {
  throw new Error(message);
}

describe('ErrorBoundary', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // React logs caught errors to console.error — suppress for clean test output.
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>hello-world</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText('hello-world')).toBeInTheDocument();
  });

  it('renders the default section fallback when a child throws', () => {
    render(
      <ErrorBoundary>
        <Thrower message="kaboom" />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('kaboom')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders a page-level fallback when level="page"', () => {
    const { container } = render(
      <ErrorBoundary level="page">
        <Thrower />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    const pageContainer = container.querySelector('.min-h-screen');
    expect(pageContainer).not.toBeNull();
  });

  it('calls onError when a child throws', () => {
    const onError = vi.fn();
    render(
      <ErrorBoundary onError={onError}>
        <Thrower message="fail" />
      </ErrorBoundary>,
    );
    expect(onError).toHaveBeenCalledTimes(1);
    const [err, info] = onError.mock.calls[0];
    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).toBe('fail');
    expect(info).toBeDefined();
    expect(typeof (info as { componentStack?: string })?.componentStack).toBe('string');
  });

  it('uses a custom fallback and recovers content after reset()', () => {
    let shouldThrow = true;

    function ControlledThrower() {
      if (shouldThrow) throw new Error('controlled');
      return <div>Recovered</div>;
    }

    render(
      <ErrorBoundary
        fallback={(error, reset) => (
          <div>
            <span>Custom: {error.message}</span>
            <button
              type="button"
              onClick={() => {
                shouldThrow = false;
                reset();
              }}
            >
              reset-btn
            </button>
          </div>
        )}
      >
        <ControlledThrower />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Custom: controlled')).toBeInTheDocument();
    fireEvent.click(screen.getByText('reset-btn'));
    expect(screen.getByText('Recovered')).toBeInTheDocument();
  });

  it('auto-resets when resetKeys change', () => {
    function ThrowOnBad({ value }: { value: string }) {
      if (value === 'bad') throw new Error('bad value');
      return <div>Good: {value}</div>;
    }

    const { rerender } = render(
      <ErrorBoundary resetKeys={['bad']}>
        <ThrowOnBad value="bad" />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    rerender(
      <ErrorBoundary resetKeys={['good']}>
        <ThrowOnBad value="good" />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Good: good')).toBeInTheDocument();
  });
});
