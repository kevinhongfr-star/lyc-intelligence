/**
 * Tests for AsyncBoundary (ErrorBoundary + Suspense + SuspenseFallback).
 *
 * Covers:
 *   - rendering children normally
 *   - showing the Suspense fallback when a child suspends (throws a promise)
 *   - showing the ErrorBoundary fallback when a child throws an error
 *
 * NOTE: stubs `@/lib/supabase/client` so the `@/components/ui` barrel can load
 * under Node 24 (see ErrorBoundary.test.tsx for rationale).
 */
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { render, screen } from '@testing-library/react';
import { AsyncBoundary } from '../AsyncBoundary';

vi.mock('@/lib/supabase/client', () => ({
  supabase: {} as unknown as SupabaseClient,
  isSupabaseConfigured: false,
}));

describe('AsyncBoundary', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Suppress React's console.error noise from thrown errors / suspended renders.
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders children normally', () => {
    render(<AsyncBoundary><div>async-content</div></AsyncBoundary>);
    expect(screen.getByText('async-content')).toBeInTheDocument();
  });

  it('shows the Suspense fallback when a child suspends', () => {
    function Suspending(): ReactNode {
      // Throw a never-resolving promise → React.Suspense catches it.
      throw new Promise(() => {});
    }
    render(
      <AsyncBoundary>
        <Suspending />
      </AsyncBoundary>,
    );
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('shows the error fallback when a child throws an error', () => {
    function Thrower(): ReactNode {
      throw new Error('async-boom');
    }
    render(
      <AsyncBoundary>
        <Thrower />
      </AsyncBoundary>,
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('async-boom')).toBeInTheDocument();
  });
});
