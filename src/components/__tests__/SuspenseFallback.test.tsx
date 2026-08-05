/**
 * Tests for SuspenseFallback.
 *
 * Skeleton renders `<div class="bg-bg-tertiary animate-pulse ...">`, so the
 * skeleton line count is asserted via `container.querySelectorAll('.animate-pulse')`.
 *
 * NOTE: stubs `@/lib/supabase/client` so the `@/components/ui` barrel can load
 * under Node 24 (see ErrorBoundary.test.tsx for rationale).
 */
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { render, screen } from '@testing-library/react';
import { SuspenseFallback } from '../SuspenseFallback';

vi.mock('@/lib/supabase/client', () => ({
  supabase: {} as unknown as SupabaseClient,
  isSupabaseConfigured: false,
}));

describe('SuspenseFallback', () => {
  it('renders the default number (3) of skeleton lines + sr-only label', () => {
    const { container } = render(<SuspenseFallback />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons).toHaveLength(3);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('renders a custom number of skeleton lines', () => {
    const { container } = render(<SuspenseFallback lines={5} />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons).toHaveLength(5);
  });

  it('renders a spinner svg with animate-spin when spinner is set', () => {
    const { container } = render(<SuspenseFallback spinner />);
    const svg = container.querySelector('svg.animate-spin');
    expect(svg).not.toBeNull();
  });

  it('does not render a spinner by default', () => {
    const { container } = render(<SuspenseFallback />);
    const svg = container.querySelector('svg.animate-spin');
    expect(svg).toBeNull();
  });

  it('announces a custom label via aria-label on the status container', () => {
    const { container } = render(<SuspenseFallback label="Fetching data" />);
    const status = container.querySelector('[role="status"]');
    expect(status).not.toBeNull();
    expect(status?.getAttribute('aria-label')).toBe('Fetching data');
    expect(screen.getByText('Fetching data')).toBeInTheDocument();
  });
});
