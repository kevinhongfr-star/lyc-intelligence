/**
 * AppShell — Main layout wrapper
 * Single header bar (TopBar) + sub-tab navigation
 * CSS-only transitions, no framer-motion overhead
 */
import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { TopBar, Surface } from './TopBar';
import { SubTabs } from './SubTabs';
import { NexusCommandBar } from '@/components/nexus/NexusCommandBar';

// Surface definitions with their sub-tabs
const SURFACES: Record<Surface, { tabs: { path: string; label: string }[] }> = {
  internal: {
    tabs: [
      { path: '/app/dashboard', label: 'Dashboard' },
      { path: '/app/pipeline', label: 'Pipeline' },
      { path: '/app/mandates', label: 'Mandates' },
      { path: '/app/candidates', label: 'Candidates' },
      { path: '/app/companies', label: 'Companies' },
      { path: '/app/scheduler', label: 'Scheduler' },
      { path: '/app/notifications', label: 'Notifications' },
      { path: '/app/chat', label: 'NEXUS' },
      { path: '/app/org-intel', label: 'Org Intelligence' },
      { path: '/app/analytics', label: 'Analytics' },
      { path: '/app/tasks', label: 'Tasks' },
      { path: '/app/compliance', label: 'Compliance' },
      { path: '/app/platform-settings', label: 'Settings' },
    ],
  },
  client: {
    tabs: [
      { path: '/client/overview', label: 'Overview' },
      { path: '/client/pipeline-analytics', label: 'Pipeline Analytics' },
      { path: '/client/talent-intel', label: 'Talent Intelligence' },
      { path: '/client/mandates', label: 'Mandates & Pipeline' },
      { path: '/client/candidates', label: 'Candidates' },
      { path: '/client/nexus-assistant', label: 'NEXUS Assistant' },
      { path: '/client/documents', label: 'Documents & Billing' },
      { path: '/client/collaboration', label: 'Collaboration' },
      { path: '/client/onboarding', label: 'Onboarding' },
      { path: '/client/admin', label: 'Admin & Security' },
    ],
  },
  coaching: {
    tabs: [
      { path: '/coaching/coach', label: 'Coach' },
      { path: '/coaching/credits', label: 'Credits & Plans' },
      { path: '/coaching/intelligence', label: 'Intelligence' },
      { path: '/coaching/career-intel', label: 'Career Intelligence' },
      { path: '/coaching/profile', label: 'Profile & Settings' },
      { path: '/coaching/chat-features', label: 'Chat Features' },
      { path: '/coaching/career-services', label: 'Career Services' },
      { path: '/coaching/engagement', label: 'Engagement' },
      { path: '/coaching/growth', label: 'Growth' },
    ],
  },
  candidate: {
    tabs: [
      { path: '/candidate/dashboard', label: 'Dashboard' },
      { path: '/candidate/applications', label: 'Applications' },
      { path: '/candidate/offers', label: 'Offers & Decisions' },
      { path: '/candidate/opportunities', label: 'My Opportunities' },
      { path: '/candidate/interview-prep', label: 'Interview Prep' },
      { path: '/candidate/assessments', label: 'Assessments' },
      { path: '/candidate/career-dev', label: 'Career Development' },
      { path: '/candidate/community', label: 'Community' },
      { path: '/candidate/nexus-coach', label: 'NEXUS Coach' },
      { path: '/candidate/profile', label: 'Profile & Settings' },
    ],
  },
};

function getSurfaceFromPath(path: string): Surface {
  if (path.startsWith('/app') || path.startsWith('/platform')) return 'internal';
  if (path.startsWith('/client')) return 'client';
  if (path.startsWith('/coaching')) return 'coaching';
  if (path.startsWith('/candidate')) return 'candidate';
  return 'internal';
}

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSurface, setActiveSurface] = useState<Surface>(() => getSurfaceFromPath(location.pathname));
  const [nexusOpen, setNexusOpen] = useState(false);

  const surfaceConfig = SURFACES[activeSurface];
  const currentTabs = surfaceConfig?.tabs || [];
  const activeTab = currentTabs.find(tab => location.pathname === tab.path || location.pathname.startsWith(tab.path + '/'))?.path || currentTabs[0]?.path;

  const handleSurfaceChange = (surface: Surface) => {
    setActiveSurface(surface);
    const firstTab = SURFACES[surface]?.tabs[0]?.path;
    if (firstTab) navigate(firstTab);
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Single unified header */}
      <TopBar activeSurface={activeSurface} onSurfaceChange={handleSurfaceChange} />

      {/* Sub-navigation for current surface */}
      {currentTabs.length > 0 && (
        <SubTabs tabs={currentTabs} active={activeTab} onTabClick={(path) => navigate(path)} />
      )}

      {/* Main content — CSS fade-in only, no framer-motion */}
      <main className="px-6 md:px-10 pb-24 pt-6 max-w-[1440px] mx-auto animate-fadeIn">
        <Outlet />
      </main>

      <NexusCommandBar isOpen={nexusOpen} onToggle={() => setNexusOpen(!nexusOpen)} />
    </div>
  );
}

export default AppShell;
