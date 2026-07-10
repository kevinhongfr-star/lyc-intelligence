/**
 * AppShell — Main layout wrapper for all authenticated surfaces
 * Phase 6: Linear-inspired calm hierarchy + framer-motion page transitions
 */
import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
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

function getSurfaceFromPath(path: string): Surface {
  if (path.startsWith('/app') || path.startsWith('/platform')) return 'internal';
  if (path.startsWith('/client')) return 'client';
  if (path.startsWith('/coaching')) return 'coaching';
  if (path.startsWith('/candidate')) return 'candidate';
  return 'internal';
}

// Page transition variants — subtle fade + slight vertical shift
const pageVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

const pageTransition = {
  type: 'tween',
  ease: [0.16, 1, 0.3, 1],
  duration: 0.25,
};

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
      <TopBar />
      <SurfaceTabs active={activeSurface} onChange={handleSurfaceChange} />
      {currentTabs.length > 0 && (
        <SubTabs tabs={currentTabs} active={activeTab} onTabClick={(path) => navigate(path)} />
      )}

      {/* Main content area with page transitions */}
      <main className="px-6 md:px-10 pb-24 pt-6 max-w-[1440px] mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <NexusCommandBar isOpen={nexusOpen} onToggle={() => setNexusOpen(!nexusOpen)} />
    </div>
  );
}

export default AppShell;
