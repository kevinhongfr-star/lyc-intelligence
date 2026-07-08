/**
 * AppShell — Main layout wrapper for all authenticated surfaces
 * Implements the mockup v14 design: TopBar + SurfaceTabs + content area + NEXUS Command Bar
 */
import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { TopBar } from './TopBar';
import { SurfaceTabs, Surface } from './SurfaceTabs';
import { SubTabs } from './SubTabs';
import { NexusCommandBar } from '@/components/nexus/NexusCommandBar';

// Surface definitions with their sub-tabs
const SURFACES: Record<Surface, { tabs: { path: string; label: string }[] }> = {
  internal: {
    tabs: [
      { path: '/app/dashboard', label: 'Dashboard' },
      { path: '/app/pipeline', label: 'Pipeline' },
      { path: '/app/mandates', label: 'Mandates' },
      { path: '/app/scheduler', label: 'Scheduler' },
      { path: '/app/intelligence', label: 'Intelligence' },
      { path: '/app/team', label: 'Team' },
      { path: '/app/tasks', label: 'Tasks' },
      { path: '/app/analytics', label: 'Analytics' },
      { path: '/app/compliance', label: 'Compliance' },
      { path: '/app/nexus-engine', label: 'NEXUS Engine' },
      { path: '/app/advanced-ops', label: 'Advanced Ops' },
      { path: '/app/scheduling-plus', label: 'Scheduling+' },
      { path: '/app/intelligence-plus', label: 'Intelligence+' },
      { path: '/app/platform-settings', label: 'Platform Settings' },
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
      { path: '/client/admin', label: 'Admin & Security' },
      { path: '/client/collaboration', label: 'Collaboration' },
      { path: '/client/onboarding', label: 'Onboarding' },
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
      { path: '/candidate/advanced-assessments', label: 'Advanced Assessments' },
      { path: '/candidate/settings-plus', label: 'Settings+' },
    ],
  },
};

// Determine active surface from path
function getSurfaceFromPath(path: string): Surface {
  if (path.startsWith('/app') || path.startsWith('/platform')) return 'internal';
  if (path.startsWith('/client')) return 'client';
  if (path.startsWith('/coaching')) return 'coaching';
  if (path.startsWith('/candidate')) return 'candidate';
  return 'internal'; // Default
}

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSurface, setActiveSurface] = useState<Surface>(() => getSurfaceFromPath(location.pathname));
  const [nexusOpen, setNexusOpen] = useState(false);

  // Get current sub-tabs for active surface
  const surfaceConfig = SURFACES[activeSurface];
  const currentTabs = surfaceConfig?.tabs || [];

  // Find active tab
  const activeTab = currentTabs.find(tab => location.pathname === tab.path || location.pathname.startsWith(tab.path + '/'))?.path || currentTabs[0]?.path;

  // Handle surface change
  const handleSurfaceChange = (surface: Surface) => {
    setActiveSurface(surface);
    const firstTab = SURFACES[surface]?.tabs[0]?.path;
    if (firstTab) navigate(firstTab);
  };

  // Handle sub-tab click
  const handleTabClick = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-bg font-sans">
      {/* TopBar — brand + notification + user menu */}
      <TopBar />

      {/* SurfaceTabs — 4-surface navigation bar */}
      <SurfaceTabs active={activeSurface} onChange={handleSurfaceChange} />

      {/* SubTabs — secondary navigation for current surface */}
      {currentTabs.length > 0 && (
        <SubTabs tabs={currentTabs} active={activeTab} onTabClick={handleTabClick} />
      )}

      {/* Main content area */}
      <main className="px-6 pb-24 pt-4">
        <Outlet />
      </main>

      {/* NEXUS Command Bar — floating bottom bar */}
      <NexusCommandBar isOpen={nexusOpen} onToggle={() => setNexusOpen(!nexusOpen)} />
    </div>
  );
}

export default AppShell;