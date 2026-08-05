/**
 * Tests for TopBar — user email, actions slot, loading skeleton.
 *
 * TopBar is presentational and router-free, so no MemoryRouter is needed.
 */
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { V1AuthUser } from '@/hooks/v1/types';
import { TopBar } from '../TopBar';

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

describe('TopBar', () => {
  it('renders the user email when a user is present', () => {
    render(<TopBar user={user} />);
    expect(screen.getByText('user@example.com')).toBeInTheDocument();
  });

  it('renders a sign-out icon button with an aria-label when a user is present', () => {
    render(<TopBar user={user} />);
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
  });

  it('renders the actions slot instead of the default user info when provided', () => {
    render(
      <TopBar
        user={user}
        actions={<button type="button">ACTIONS</button>}
      />,
    );
    expect(screen.getByText('ACTIONS')).toBeInTheDocument();
    expect(screen.queryByText('user@example.com')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sign out' })).not.toBeInTheDocument();
  });

  it('renders the left slot', () => {
    render(
      <TopBar user={user} left={<nav aria-label="Test left">LEFT</nav>} />,
    );
    expect(screen.getByText('LEFT')).toBeInTheDocument();
  });

  it('renders a skeleton when loading and no user', () => {
    const { container } = render(<TopBar user={null} loading />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    expect(screen.queryByText('user@example.com')).not.toBeInTheDocument();
  });

  it('calls onLogout when the sign-out button is clicked', () => {
    const onLogout = vi.fn();
    render(<TopBar user={user} onLogout={onLogout} />);
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
