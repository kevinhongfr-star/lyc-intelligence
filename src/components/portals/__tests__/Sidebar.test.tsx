/**
 * Tests for Sidebar — brand, role filtering, active state, sign-out.
 *
 * Sidebar uses NavLink/Link so every render is wrapped in MemoryRouter.
 */
import type React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { V1AuthUser } from '@/hooks/v1/types';
import { Sidebar } from '../Sidebar';
import type { NavItem } from '../types';

const candidateUser: V1AuthUser = {
  id: 'u-1',
  email: 'candidate@example.com',
  role: 'candidate',
  user_type: 'candidate',
};

function renderSidebar(ui: React.ReactElement, initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>{ui}</MemoryRouter>,
  );
}

describe('Sidebar', () => {
  it('renders the brand text', () => {
    renderSidebar(
      <Sidebar nav={[]} user={candidateUser} brand="TestBrand" onLogout={vi.fn()} />,
    );
    expect(screen.getByText('TestBrand')).toBeInTheDocument();
  });

  it('truncates the brand to the first 3 chars when collapsed', () => {
    renderSidebar(
      <Sidebar
        nav={[]}
        user={candidateUser}
        brand="TestBrand"
        collapsed
        onToggleCollapse={vi.fn()}
        onLogout={vi.fn()}
      />,
    );
    expect(screen.getByText('Tes')).toBeInTheDocument();
    expect(screen.queryByText('TestBrand')).not.toBeInTheDocument();
  });

  it('filters out nav items the user role cannot see', () => {
    const nav: NavItem[] = [
      { path: '/dashboard', label: 'Dashboard' },
      { path: '/admin-only', label: 'Admin Only', roles: ['admin'] },
    ];
    renderSidebar(
      <Sidebar nav={nav} user={candidateUser} brand="Brand" onLogout={vi.fn()} />,
    );
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Admin Only')).not.toBeInTheDocument();
  });

  it('filters out nav items the user_type cannot see', () => {
    const nav: NavItem[] = [
      { path: '/a', label: 'Open' },
      { path: '/b', label: 'Internal Only', userTypes: ['internal'] },
    ];
    renderSidebar(
      <Sidebar nav={nav} user={candidateUser} brand="Brand" onLogout={vi.fn()} />,
    );
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.queryByText('Internal Only')).not.toBeInTheDocument();
  });

  it('renders no nav items when the user is null', () => {
    const nav: NavItem[] = [
      { path: '/dashboard', label: 'Dashboard' },
    ];
    renderSidebar(<Sidebar nav={nav} user={null} brand="Brand" onLogout={vi.fn()} />);
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('applies the accent class to the active nav link', () => {
    const nav: NavItem[] = [
      { path: '/internal', label: 'Dashboard', end: true },
      { path: '/internal/pipeline', label: 'Pipeline' },
    ];
    renderSidebar(
      <Sidebar nav={nav} user={candidateUser} brand="Brand" onLogout={vi.fn()} />,
      '/internal/pipeline',
    );

    const pipelineLink = screen.getByRole('link', { name: 'Pipeline' });
    expect(pipelineLink.getAttribute('class')).toContain('text-accent');

    const dashboardLink = screen.getByRole('link', { name: 'Dashboard' });
    expect(dashboardLink.getAttribute('class')).not.toContain('text-accent');
  });

  it('renders a badge pill when an item has a positive badge count', () => {
    const nav: NavItem[] = [
      { path: '/inbox', label: 'Inbox', badge: 7 },
    ];
    renderSidebar(
      <Sidebar nav={nav} user={candidateUser} brand="Brand" onLogout={vi.fn()} />,
    );
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('calls onLogout when the sign-out button is clicked', () => {
    const onLogout = vi.fn();
    renderSidebar(
      <Sidebar nav={[]} user={candidateUser} brand="Brand" onLogout={onLogout} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('calls onToggleCollapse when the collapse button is clicked', () => {
    const onToggleCollapse = vi.fn();
    renderSidebar(
      <Sidebar
        nav={[]}
        user={candidateUser}
        brand="Brand"
        onToggleCollapse={onToggleCollapse}
        onLogout={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    expect(onToggleCollapse).toHaveBeenCalledTimes(1);
  });

  it('exposes the primary landmark and main navigation', () => {
    renderSidebar(
      <Sidebar nav={[]} user={candidateUser} brand="Brand" onLogout={vi.fn()} />,
    );
    expect(screen.getByLabelText('Primary')).toBeInTheDocument();
    expect(screen.getByLabelText('Main navigation')).toBeInTheDocument();
  });
});
