/**
 * Tests for InternalPortalLayout — useAuth wiring + RoleGate gating.
 *
 * `useAuth` is mocked so we can swap the caller profile per test. The layout
 * uses NavLink/useLocation so renders are wrapped in MemoryRouter.
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { UseAuthResult } from '@/hooks/v1';
import type { V1AuthUser } from '@/hooks/v1/types';
import { useAuth } from '@/hooks/v1';
import InternalPortalLayout from '../InternalPortalLayout';

vi.mock('@/hooks/v1', () => ({
  useAuth: vi.fn(),
}));

// Mock CreditContext to prevent the supabase client (imported transitively via
// the @/components/ui barrel — EmptyState) from throwing createClient() at
// module-eval on Node 24. See RoleGate.test.tsx for the full rationale.
vi.mock('@/contexts/CreditContext', () => ({
  useCredits: () => ({}),
}));

const teamLead: V1AuthUser = {
  id: 'u-1',
  email: 'lead@example.com',
  role: 'team_lead',
  user_type: 'internal',
};

const candidate: V1AuthUser = {
  id: 'u-2',
  email: 'candidate@example.com',
  role: 'candidate',
  user_type: 'candidate',
};

function makeAuth(overrides: Partial<UseAuthResult>): UseAuthResult {
  return {
    user: null,
    loading: false,
    error: null,
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
    resetPassword: vi.fn(),
    refresh: vi.fn(),
    ...overrides,
  } as unknown as UseAuthResult;
}

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route element={<InternalPortalLayout />}>
          <Route index element={<div>OUTLET</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('InternalPortalLayout', () => {
  it('renders the Outlet content for a team_lead user', () => {
    vi.mocked(useAuth).mockReturnValue(makeAuth({ user: teamLead }));
    renderLayout();
    expect(screen.getByText('OUTLET')).toBeInTheDocument();
  });

  it('renders the brand and nav for an authorized user', () => {
    vi.mocked(useAuth).mockReturnValue(makeAuth({ user: teamLead }));
    renderLayout();
    expect(screen.getByText('LYC Intelligence')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Pipeline' })).toBeInTheDocument();
  });

  it('renders the access-restricted fallback for a candidate user', () => {
    vi.mocked(useAuth).mockReturnValue(makeAuth({ user: candidate }));
    renderLayout();
    expect(screen.getByText('Access restricted')).toBeInTheDocument();
    expect(
      screen.getByText(/requires team lead or higher/i),
    ).toBeInTheDocument();
    expect(screen.queryByText('OUTLET')).not.toBeInTheDocument();
  });

  it('does not render the shell brand for a candidate user', () => {
    vi.mocked(useAuth).mockReturnValue(makeAuth({ user: candidate }));
    renderLayout();
    // Brand link belongs to the shell, which is gated out.
    expect(screen.queryByRole('link', { name: 'Dashboard' })).not.toBeInTheDocument();
  });

  it('renders a loading state while loading and the user is null', () => {
    vi.mocked(useAuth).mockReturnValue(makeAuth({ user: null, loading: true }));
    const { container } = renderLayout();
    expect(screen.queryByText('OUTLET')).not.toBeInTheDocument();
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('hides the admin-only Settings nav from a team_lead user', () => {
    vi.mocked(useAuth).mockReturnValue(makeAuth({ user: teamLead }));
    renderLayout();
    // Settings is restricted to [admin, lyc_admin, super_admin]; team_lead cannot see it.
    expect(screen.queryByRole('link', { name: 'Settings' })).not.toBeInTheDocument();
  });

  it('shows the Settings nav for a super_admin user', () => {
    const superAdmin: V1AuthUser = {
      id: 'u-3',
      email: 'super@example.com',
      role: 'super_admin',
      user_type: 'internal',
    };
    vi.mocked(useAuth).mockReturnValue(makeAuth({ user: superAdmin }));
    renderLayout();
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
  });
});
