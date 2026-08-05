/**
 * Tests for Breadcrumbs — items, separators, aria-current, empty state.
 *
 * Breadcrumbs uses <Link> so renders are wrapped in MemoryRouter.
 */
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Breadcrumbs } from '../Breadcrumbs';
import type { BreadcrumbItem } from '../types';

function renderCrumbs(items: BreadcrumbItem[]) {
  return render(
    <MemoryRouter>
      <Breadcrumbs items={items} />
    </MemoryRouter>,
  );
}

describe('Breadcrumbs', () => {
  it('renders each item label', () => {
    renderCrumbs([
      { label: 'Home', to: '/' },
      { label: 'Mandates', to: '/mandates' },
      { label: 'Current' },
    ]);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Mandates')).toBeInTheDocument();
    expect(screen.getByText('Current')).toBeInTheDocument();
  });

  it('renders a separator between items (n-1 separators)', () => {
    const { container } = renderCrumbs([
      { label: 'Home', to: '/' },
      { label: 'Mandates', to: '/mandates' },
      { label: 'Current' },
    ]);
    // ChevronRight separators are svg[aria-hidden="true"]
    expect(container.querySelectorAll('svg[aria-hidden="true"]')).toHaveLength(2);
  });

  it('marks the last item (no `to`) with aria-current="page"', () => {
    const { container } = renderCrumbs([
      { label: 'Home', to: '/' },
      { label: 'Current' },
    ]);
    const current = container.querySelector('[aria-current="page"]');
    expect(current).not.toBeNull();
    expect(current?.textContent).toBe('Current');
  });

  it('renders items without `to` as a <span>', () => {
    const { container } = renderCrumbs([{ label: 'Current' }]);
    expect(container.querySelector('span[aria-current="page"]')).not.toBeNull();
    expect(container.querySelector('a')).toBeNull();
  });

  it('renders items with `to` as links', () => {
    const { container } = renderCrumbs([
      { label: 'Home', to: '/' },
      { label: 'Current' },
    ]);
    expect(container.querySelector('a')).not.toBeNull();
    expect(container.querySelector('a')?.getAttribute('href')).toBe('/');
  });

  it('does not render the nav when items is empty', () => {
    const { container } = renderCrumbs([]);
    expect(container.querySelector('nav[aria-label="Breadcrumb"]')).toBeNull();
  });

  it('exposes the Breadcrumb landmark', () => {
    renderCrumbs([{ label: 'Home', to: '/' }]);
    expect(screen.getByLabelText('Breadcrumb')).toBeInTheDocument();
  });
});
