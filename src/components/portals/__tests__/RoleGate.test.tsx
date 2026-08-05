/**
 * Tests for RoleGate — access-control wrapper.
 *
 * RoleGate avoids router primitives, so no MemoryRouter is required.
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { V1AuthUser } from '@/hooks/v1/types';
import { RoleGate } from '../RoleGate';

// The @/components/ui barrel re-exports CreditDisplay/UpgradeBanner, which pull
// in @/contexts/CreditContext → @/stores/authStore → @/lib/supabase/client.
// The supabase client calls createClient() at module-eval, which throws on
// Node 24 (no native WebSocket). Mocking CreditContext cuts that chain so the
// real EmptyState/Skeleton we actually exercise stay intact.
vi.mock('@/contexts/CreditContext', () => ({
  useCredits: () => ({}),
}));

const superAdmin: V1AuthUser = {
  id: 'u-1',
  email: 'super@example.com',
  role: 'super_admin',
  user_type: 'internal',
};

const candidate: V1AuthUser = {
  id: 'u-2',
  email: 'candidate@example.com',
  role: 'candidate',
  user_type: 'candidate',
};

const clientUser: V1AuthUser = {
  id: 'u-3',
  email: 'client@example.com',
  role: 'client_admin',
  user_type: 'client',
};

describe('RoleGate', () => {
  it('renders children when the user is authorized (role gate)', () => {
    render(
      <RoleGate user={superAdmin} role="team_lead">
        <div>ALLOWED</div>
      </RoleGate>,
    );
    expect(screen.getByText('ALLOWED')).toBeInTheDocument();
  });

  it('renders the fallback when the user is unauthorized', () => {
    render(
      <RoleGate
        user={candidate}
        role="team_lead"
        fallback={<div>NO ACCESS</div>}
      >
        <div>ALLOWED</div>
      </RoleGate>,
    );
    expect(screen.getByText('NO ACCESS')).toBeInTheDocument();
    expect(screen.queryByText('ALLOWED')).not.toBeInTheDocument();
  });

  it('renders the default fallback (Access restricted) when unauthorized and no custom fallback', () => {
    render(
      <RoleGate user={candidate} role="team_lead">
        <div>ALLOWED</div>
      </RoleGate>,
    );
    expect(screen.getByText('Access restricted')).toBeInTheDocument();
    expect(screen.queryByText('ALLOWED')).not.toBeInTheDocument();
  });

  it('renders the loadingFallback while loading and user is null', () => {
    render(
      <RoleGate
        user={null}
        loading
        loadingFallback={<div>LOADING</div>}
      >
        <div>ALLOWED</div>
      </RoleGate>,
    );
    expect(screen.getByText('LOADING')).toBeInTheDocument();
    expect(screen.queryByText('ALLOWED')).not.toBeInTheDocument();
  });

  it('renders a default skeleton loadingFallback when none is provided', () => {
    const { container } = render(
      <RoleGate user={null} loading>
        <div>ALLOWED</div>
      </RoleGate>,
    );
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    expect(screen.queryByText('ALLOWED')).not.toBeInTheDocument();
  });

  it('treats a null (non-loading) user as unauthorized', () => {
    render(
      <RoleGate user={null} fallback={<div>NO ACCESS</div>}>
        <div>ALLOWED</div>
      </RoleGate>,
    );
    expect(screen.getByText('NO ACCESS')).toBeInTheDocument();
    expect(screen.queryByText('ALLOWED')).not.toBeInTheDocument();
  });

  it('respects the userType filter (matching type passes)', () => {
    render(
      <RoleGate user={clientUser} userType="client">
        <div>ALLOWED</div>
      </RoleGate>,
    );
    expect(screen.getByText('ALLOWED')).toBeInTheDocument();
  });

  it('respects the userType filter (non-matching type fails)', () => {
    render(
      <RoleGate user={candidate} userType="client" fallback={<div>NO ACCESS</div>}>
        <div>ALLOWED</div>
      </RoleGate>,
    );
    expect(screen.getByText('NO ACCESS')).toBeInTheDocument();
    expect(screen.queryByText('ALLOWED')).not.toBeInTheDocument();
  });
});
