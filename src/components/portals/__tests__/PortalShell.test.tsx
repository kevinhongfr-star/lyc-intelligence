/**
 * Tests for PortalShell — composite layout: sidebar + topbar + main.
 *
 * PortalShell uses useLocation (and NavLink via Sidebar) so every render is
 * wrapped in MemoryRouter.
 */
import type React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { V1AuthUser } from '@/hooks/v1/types';
import { PortalShell } from '../PortalShell';
import type { NavItem } from '../types';

// Mock CreditContext to prevent the supabase client (imported transitively via
// the @/components/ui barrel) from throwing createClient() at module-eval on
// Node 24. See RoleGate.test.tsx for the full rationale.
vi.mock('@/contexts/CreditContext', () => ({
  useCredits: () => ({}),
}));

const user: V1AuthUser = {
  id: 'u-1',
  email: 'user@example.com',
  role: 'member',
  user_type: 'b2c',
};

const nav: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', end: true },
  { path: '/reports', label: 'Reports' },
];

function renderShell(
  overrides: Partial<React.ComponentProps<typeof PortalShell>> = {},
  initialEntry = '/dashboard',
) {
  const props: React.ComponentProps<typeof PortalShell> = {
    kind: 'b2c',
    brand: 'TestBrand',
    nav,
    user,
    onLogout: vi.fn(),
    children: <div>MAIN</div>,
    ...overrides,
  };
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>{<PortalShell {...props} />}</MemoryRouter>,
  );
}

describe('PortalShell', () => {
  it('renders the sidebar brand, the main content, and a main landmark', () => {
    renderShell();
    expect(screen.getByText('TestBrand')).toBeInTheDocument();
    expect(screen.getByText('MAIN')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('main').getAttribute('id')).toBe('main-content');
  });

  it('renders the nav items in the sidebar', () => {
    renderShell();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Reports' })).toBeInTheDocument();
  });

  it('renders a loading skeleton instead of children when loading and user is null', () => {
    const { container } = renderShell({ user: null, loading: true });
    expect(screen.queryByText('MAIN')).not.toBeInTheDocument();
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('still renders children when loading is true but a user is present', () => {
    renderShell({ loading: true });
    expect(screen.getByText('MAIN')).toBeInTheDocument();
  });

  it('calls onLogout via the sidebar sign-out button', () => {
    const onLogout = vi.fn();
    renderShell({ onLogout });
    // Both Sidebar and TopBar render a sign-out button; scope to the sidebar
    // (the Primary aside) to target the one wired through PortalShell's Sidebar.
    const sidebar = screen.getByLabelText('Primary');
    fireEvent.click(within(sidebar).getByRole('button', { name: 'Sign out' }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('renders breadcrumbs in the top bar left slot', () => {
    renderShell({ breadcrumbs: [{ label: 'Home', to: '/' }, { label: 'Here' }] });
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Here')).toBeInTheDocument();
  });

  it('renders headerActions in the top bar actions slot', () => {
    renderShell({ headerActions: <button type="button">HEADER_ACTION</button> });
    expect(screen.getByText('HEADER_ACTION')).toBeInTheDocument();
  });

  it('tags the root with the portal kind', () => {
    const { container } = renderShell({ kind: 'internal' });
    expect(container.querySelector('[data-portal-kind="internal"]')).not.toBeNull();
  });
});
