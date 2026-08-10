/**
 * AppShell — Main layout wrapper for all authenticated surfaces
 *
 * Phase 15.3 (C1 + C2 + C3) streamlined app shell:
 *  - Consumes SURFACE_CONFIG (SurfaceTabs.tsx) as single source of truth
 *  - Dynamically filters sub-tabs: shows only working ones to regular users;
 *    admins + VITE_ENABLE_ADMIN_PREVIEW see all for QA/dev
 *  - Removes floating NexusCommandBar visual element, keeps Cmd+K shortcut
 *    navigation to the dedicated NEXUS Chat tab
 */
import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { TopBar } from './TopBar';
import { SurfaceTabs, Surface, SURFACE_CONFIG, SubTabConfig, userSeesAllSurfaces } from './SurfaceTabs';
import { SubTabs } from './SubTabs';
import { useAuthStore } from '@/stores/authStore';

// Determine active surface from path
function getSurfaceFromPath(path: string): Surface {
  if (path.startsWith('/app') || path.startsWith('/platform')) return 'internal';
  if (path.startsWith('/client')) return 'client';
  if (path.startsWith('/coaching')) return 'coaching';
  if (path.startsWith('/candidate')) return 'candidate';
  if (path.startsWith('/grid')) return 'grid';
  return 'coaching';
}

/**
 * Filter the sub-tab list for display.
 * Regular users: only tabs with `working: true` and whose route resolves to
 * a real page (no Placeholder). Admins / preview mode: show all.
 */
function getVisibleSubTabs(config: SubTabConfig[] | undefined, adminPreview: boolean): { path: string; label: string }[] {
  if (!config) return [];
  return config
    .filter((t) => t.working || adminPreview)
    .map((t) => ({ path: t.path, label: t.label }));
}

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const userRole = profile?.role || null;
  const adminPreview = userSeesAllSurfaces(userRole);

  const [activeSurface, setActiveSurface] = useState<Surface>(() => getSurfaceFromPath(location.pathname));

  // Look up surface config from the single source of truth
  const surfaceCfg = SURFACE_CONFIG.find((s) => s.id === activeSurface);
  const currentTabs = getVisibleSubTabs(surfaceCfg?.subTabs, adminPreview);

  // Find active tab
  const activeTab =
    currentTabs.find(
      (tab) => location.pathname === tab.path || location.pathname.startsWith(tab.path + '/'),
    )?.path || currentTabs[0]?.path;

  // Handle surface change — jump to first working tab of the new surface
  const handleSurfaceChange = (surface: Surface) => {
    setActiveSurface(surface);
    const cfg = SURFACE_CONFIG.find((s) => s.id === surface);
    const visibleForRole = getVisibleSubTabs(cfg?.subTabs, adminPreview);
    const firstTab = visibleForRole[0]?.path;
    if (firstTab) navigate(firstTab);
  };

  // Handle sub-tab click
  const handleTabClick = (path: string) => {
    navigate(path);
  };

  // C2 — Cmd+K (or Ctrl+K) keyboard shortcut → NEXUS Chat.
  // If inside coaching surface → /coaching/nexus-chat; else → /nexus/chat (standalone).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        const nexusTab = SURFACE_CONFIG.find((s) => s.id === 'coaching')?.subTabs.find(
          (t) => t.path.endsWith('/nexus-chat') || t.path.endsWith('/coach'),
        )?.path;
        navigate(nexusTab || '/nexus/chat');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-bg font-sans">
      {/* TopBar — brand + notification + user menu */}
      <TopBar />

      {/* SurfaceTabs — role + working-count filtered surface navigation */}
      <SurfaceTabs active={activeSurface} onChange={handleSurfaceChange} />

      {/* SubTabs — secondary navigation for current surface, placeholder tabs hidden */}
      {currentTabs.length > 0 && (
        <SubTabs tabs={currentTabs} active={activeTab} onTabClick={handleTabClick} />
      )}

      {/* Main content area */}
      <main className="px-6 pb-16 pt-4">
        <Outlet />
      </main>

      {/* NexusCommandBar visual element REMOVED in Phase 15.3 (C2).
          Cmd+K shortcut still works to jump to NEXUS Chat tab above. */}
    </div>
  );
}

export default AppShell;
