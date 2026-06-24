# Phase 1.3 — Role-Based Navigation & Route Guards

**Status:** DRAFT — Pending Kevin approval  
**Priority:** P0 (security + UX — all users currently see the same sidebar)  
**Estimated effort:** 1–2 days  
**Dependency:** Phase 1.0 (auth unification — need `useAuthStore` everywhere for `profile.icp` access)

---

## 1. Problem Statement

The current AppLayout sidebar shows **all 12+ navigation items to every user**, regardless of their role or ICP type:

```typescript
// Current state — src/components/layout/AppLayout.tsx
const NAV_ITEMS = [
  { path: '/platform', label: 'Dashboard' },
  { path: '/platform/pipeline', label: 'Pipeline' },
  { path: '/platform/mandates', label: 'Mandates' },
  { path: '/platform/candidates', label: 'Candidates' },
  { path: '/platform/companies', label: 'Companies' },
  { type: 'divider', label: 'Scoring' },
  { path: '/platform/batch-scoring', label: 'Match Analysis' },
  { path: '/platform/mandates', label: 'Candidate Report', suffix: '/lens' },
  { path: '/platform/metrix', label: 'Performance Metrics' },
  { path: '/platform/scoring-runs', label: 'Scoring Runs' },
  { type: 'divider', label: 'Tools' },
  { path: '/platform/chat', label: 'Nexus' },
  { path: '/platform/scheduler', label: 'Scheduler' },
  { path: '/platform/documents', label: 'Documents' },
  { path: '/platform/notifications', label: 'Alerts' },
  { path: '/platform/settings', label: 'Settings', roles: ['admin', 'recruiter'] },
];
```

Only `Settings` has any role filtering. All other items are visible to everyone.

---

## 2. Target State

Each user type sees a **curated sidebar** relevant to their role:

### Consultant View (`icp = 'consultant'`, `role != 'admin'`)
```
Dashboard
Pipeline
Mandates
Candidates
Companies
─── Scoring ───
Match Analysis
─── Tools ───
Nexus
Scheduler
Documents
Alerts
Settings
```
(Remove: Scoring Runs, Candidate Report as separate item, Performance Metrics from sidebar)

### Team Lead View (`icp = 'leader'`, `role != 'admin'`)
```
Dashboard (team overview — Phase 1.6)
All Mandates (portfolio view)
Team (consultant load — Phase 1.6)
Approvals (Phase 1.6)
─── Tools ───
Nexus
Alerts
Settings
```
(No: Pipeline, Candidates, Scoring Runs, Batch Scoring — these are operational, not oversight)

### Admin View (`role = 'admin'`)
```
[All consultant items]
─── Admin ───
Org Intelligence
User Management (future)
```

### Client View (`icp = 'client'`)
→ Routed to `/client` (Phase 1.1) — different portal entirely, not this sidebar.

### Candidate View (`icp = 'candidate'`)
→ Routed to `/candidate` (Phase 1.2) — different portal entirely, not this sidebar.

---

## 3. Detailed Specification

### 3.1. Extend NAV_ITEMS with ICP Metadata

**File:** `src/components/layout/AppLayout.tsx`

```typescript
import { useAuthStore } from '@/stores/authStore';

interface NavItem {
  path?: string;
  icon?: any;
  label: string;
  exact?: boolean;
  type?: 'divider';
  suffix?: string;
  icp?: ICP[];        // Which ICP types can see this item
  roles?: string[];    // Which roles can see this item (admin override)
}

const NAV_ITEMS: NavItem[] = [
  { path: '/platform', icon: IconImpact, label: 'Dashboard', exact: true, icp: ['consultant', 'leader'] },
  { path: '/platform/pipeline', icon: IconBridge, label: 'Pipeline', icp: ['consultant'] },
  { path: '/platform/mandates', icon: Briefcase, label: 'Mandates', icp: ['consultant', 'leader'] },
  { path: '/platform/candidates', icon: Users, label: 'Candidates', icp: ['consultant'] },
  { path: '/platform/companies', icon: Building2, label: 'Companies', icp: ['consultant', 'leader'] },
  
  { type: 'divider', label: 'Scoring', icp: ['consultant'] },
  { path: '/platform/batch-scoring', icon: IconTrident, label: 'Match Analysis', icp: ['consultant'] },
  { path: '/platform/metrix', icon: IconSpark, label: 'Performance Metrics', icp: ['consultant'] },
  
  { type: 'divider', label: 'Tools' },
  { path: '/platform/chat', icon: IconQuest, label: 'Nexus', icp: ['consultant', 'leader'] },
  { path: '/platform/scheduler', icon: Calendar, label: 'Scheduler', icp: ['consultant'] },
  { path: '/platform/documents', icon: IconPrism, label: 'Documents', icp: ['consultant', 'leader'] },
  { path: '/platform/notifications', icon: Bell, label: 'Alerts' },
  { path: '/platform/settings', icon: IconForge, label: 'Settings', roles: ['admin'] },
  
  // Admin-only section
  { type: 'divider', label: 'Admin', roles: ['admin'] },
  { path: '/platform/org-intel', icon: BarChart3, label: 'Org Intelligence', roles: ['admin'] },
];
```

### 3.2. Navigation Filter Logic

```typescript
function filterNavItems(items: NavItem[], userICP: string | null, userRole: string | null): NavItem[] {
  return items.filter(item => {
    // Dividers: show only if the next visible item exists
    if (item.type === 'divider') return true; // filter empty dividers in a second pass
    
    // Admin sees everything
    if (userRole === 'admin') return true;
    
    // Check ICP filter
    if (item.icp && userICP && !item.icp.includes(userICP as ICP)) return false;
    
    // Check role filter
    if (item.roles && userRole && !item.roles.includes(userRole)) return false;
    
    return true;
  }).filter((item, index, arr) => {
    // Remove consecutive dividers and trailing dividers
    if (item.type === 'divider') {
      const nextItem = arr[index + 1];
      return nextItem && nextItem.type !== 'divider';
    }
    return true;
  });
}
```

### 3.3. AppLayout Integration

```typescript
export function AppLayout() {
  const { user, profile, signOut } = useAuthStore();
  const userICP = profile?.icp || null;
  const userRole = profile?.role || null;
  
  const filteredNav = filterNavItems(NAV_ITEMS, userICP, userRole);
  
  // ... render filteredNav instead of NAV_ITEMS
}
```

### 3.4. Route Guards (Defense in Depth)

Navigation hiding is UX — route guards are security. Both are needed.

**Create `src/components/RoleRoute.tsx`:**

```typescript
interface RoleRouteProps {
  allowedICP?: ICP[];
  allowedRoles?: string[];
  children: React.ReactNode;
}

function RoleRoute({ allowedICP, allowedRoles, children }: RoleRouteProps) {
  const { profile, isLoading } = useAuthStore();
  if (isLoading) return <Loading />;
  
  const userICP = profile?.icp as ICP;
  const userRole = profile?.role;
  
  // Admin bypass
  if (userRole === 'admin') return <>{children}</>;
  
  // Check ICP
  if (allowedICP && (!userICP || !allowedICP.includes(userICP))) {
    return <Navigate to={getPortalRoute(userICP)} replace />;
  }
  
  // Check role
  if (allowedRoles && (!userRole || !allowedRoles.some(r => userRole.includes(r)))) {
    return <Navigate to="/platform" replace />;
  }
  
  return <>{children}</>;
}
```

**Apply to routes in App.tsx:**

```typescript
<Route path="/platform" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
  <Route index element={<ConsultantDashboard />} />
  <Route path="pipeline" element={<RoleRoute allowedICP={['consultant']}><PipelinePage /></RoleRoute>} />
  <Route path="candidates" element={<RoleRoute allowedICP={['consultant']}><CandidatesPage /></RoleRoute>} />
  <Route path="batch-scoring" element={<RoleRoute allowedICP={['consultant']}><BatchScoringPage /></RoleRoute>} />
  <Route path="scoring-runs" element={<RoleRoute allowedICP={['consultant']}><ScoringRunsPage /></RoleRoute>} />
  <Route path="org-intel" element={<RoleRoute allowedRoles={['admin']}><OrgIntelligencePage /></RoleRoute>} />
  {/* Other routes available to both consultant and leader */}
</Route>
```

### 3.5. Remove Scoring Runs from Consultant View

The "Scoring Runs" page (`/platform/scoring-runs`) is a **technical/debug page** showing raw scoring session data. It should be:
- Hidden from all non-admin navigation
- Kept accessible via URL for debugging (`/platform/scoring-runs` still works with admin role)
- Eventually replaced by a proper "Scoring History" feature

### 3.6. Dashboard Differentiation

The `/platform` index route currently renders `ConsultantDashboard` for everyone. After this phase:

```typescript
<Route path="/platform" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
  <Route index element={<DashboardRouter />} />
  {/* ... */}
</Route>
```

```typescript
// src/components/DashboardRouter.tsx
function DashboardRouter() {
  const { profile } = useAuthStore();
  const icp = profile?.icp;
  const role = profile?.role;
  
  if (role === 'admin' || icp === 'consultant') return <ConsultantDashboard />;
  if (icp === 'leader') return <TeamLeadDashboard />; // Placeholder until Phase 1.6
  return <ConsultantDashboard />; // Fallback
}
```

---

## 4. Acceptance Criteria

- [ ] Consultant sees: Dashboard, Pipeline, Mandates, Candidates, Companies, Match Analysis, Nexus, Scheduler, Documents, Alerts, Settings (if admin)
- [ ] Team Lead sees: Dashboard, Mandates, Companies, Nexus, Documents, Alerts, Settings
- [ ] Admin sees: All consultant items + Org Intelligence
- [ ] Client users can't access `/platform/*` at all (redirected to `/client` by ICPRoute from Phase 1.1)
- [ ] Candidate users can't access `/platform/*` at all (redirected to `/candidate` by ICPRoute from Phase 1.2)
- [ ] "Scoring Runs" hidden from non-admin navigation
- [ ] "Candidate Report" removed as separate sidebar item (it's accessed via Mandate Detail → LENS)
- [ ] No empty dividers in sidebar
- [ ] Direct URL access to restricted routes is blocked (not just hidden)
- [ ] `npm run build` succeeds

---

## 5. Files Created / Modified

### Created
| File | Purpose |
|------|---------|
| `src/components/RoleRoute.tsx` | ICP/role-based route guard |
| `src/components/DashboardRouter.tsx` | Dashboard by ICP type |

### Modified
| File | Change |
|------|--------|
| `src/components/layout/AppLayout.tsx` | Add `icp` field to NAV_ITEMS, filter logic, migrate to `useAuthStore` |
| `src/App.tsx` | Wrap routes with `RoleRoute` guards |
| `src/types/index.ts` | Ensure `ICP` type is properly exported |

---

## 6. Edge Cases

| Scenario | Behavior |
|----------|----------|
| User has `icp = null` | Show consultant view (backward compat) |
| User has `role = 'admin'` AND `icp = 'client'` | Admin wins — show full platform |
| Divider with no items after it | Hide divider |
| User navigates to restricted URL directly | Redirect to their portal |
| Sidebar collapsed (icon-only mode) | Show only icons for visible items |

