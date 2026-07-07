import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { LogOut } from 'lucide-react';
import { PortalSwitcher } from '@/components/shared/PortalSwitcher';
import { ImpersonationBanner } from '@/components/shared/ImpersonationBanner';

const SUB_TABS = [
  { id: 'dashboard', label: 'Dashboard', path: '/candidate/dashboard' },
  { id: 'opportunities', label: 'Opportunities', path: '/candidate/opportunities' },
  { id: 'applications', label: 'Applications', path: '/candidate/applications' },
  { id: 'interview-prep', label: 'Interview Prep', path: '/candidate/interview-prep' },
  { id: 'assessments', label: 'Assessments', path: '/candidate/assessments' },
  { id: 'offers', label: 'Offers', path: '/candidate/offers' },
  { id: 'career-dev', label: 'Career Dev', path: '/candidate/career-dev' },
  { id: 'nexus-coach', label: 'NEXUS Coach', path: '/candidate/nexus-coach' },
  { id: 'community', label: 'Community', path: '/candidate/community' },
  { id: 'advanced-assess', label: 'Advanced Assess', path: '/candidate/advanced-assess' },
  { id: 'settings', label: 'Settings', path: '/candidate/settings' },
  { id: 'profile', label: 'Profile', path: '/candidate/profile' },
];

export function CandidatePortalLayout() {
  const { signOut, profile } = useAuthStore();
  const location = useLocation();

  const currentTab = SUB_TABS.find(tab => location.pathname === tab.path) || SUB_TABS[0];

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      <ImpersonationBanner />

      <nav className="h-12 bg-bg-primary border-b border-bg-tertiary flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <Link to="/candidate/dashboard" className="font-serif font-bold text-lg text-text-primary hover:text-accent transition-colors">
            LYC Intelligence
          </Link>
          <PortalSwitcher />
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:block">
            <span className="text-sm text-text-muted">
              {profile?.name || 'Candidate'}
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </nav>

      <div className="flex flex-col flex-1">
        <div className="border-b border-bg-tertiary bg-bg-secondary">
          <div className="flex overflow-x-auto">
            {SUB_TABS.map((tab) => (
              <Link
                key={tab.id}
                to={tab.path}
                className={`relative px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  currentTab.id === tab.id
                    ? 'text-accent'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {tab.label}
                {currentTab.id === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
                )}
              </Link>
            ))}
          </div>
        </div>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>

        <footer className="border-t border-bg-tertiary py-4 px-6 bg-bg-primary">
          <div className="flex items-center justify-between">
            <span className="font-serif font-bold text-text-primary">LYC Intelligence</span>
            <span className="text-xs text-text-muted">CD · Confidential</span>
            <span className="text-xs text-text-muted">1/12</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
