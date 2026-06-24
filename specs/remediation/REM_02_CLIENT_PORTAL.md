# Phase 1.1 — Client Portal (Build)

**Status:** DRAFT — Pending Kevin approval  
**Priority:** P0 (security risk — clients currently see consultant platform)  
**Estimated effort:** 3–5 days  
**Dependency:** Phase 1.0 (auth unification must be done first)

---

## 1. Problem Statement

Clients (`icp = 'client'`) currently log in and see the **consultant platform** — the same sidebar, routes, and data as `lyc_consultant` users. This means:

- Clients see ALL mandates (not just their own) — **data leak risk**
- Clients see candidate scoring, pipeline internals, and consultant tools
- Clients have no portal to track their own mandate progress
- No role-based route protection for client users

**There are no Client Portal components in the codebase.** This spec covers building the portal from scratch.

---

## 2. Target State

When a client (`icp = 'client'`, `role != 'admin'`) logs in:
- Redirected to `/client` (not `/platform`)
- See a **Client Portal** with client-specific sidebar and routes
- Can only see mandates linked to their organization
- Can view candidate shortlists shared with them
- Can download reports
- Cannot see consultant-internal data (scoring, pipeline stages, Nexus AI strategy)

---

## 3. Role Model Extension

### 3.1. Current Role System

```typescript
// src/types/index.ts
export type ICP = 'client' | 'consultant' | 'leader' | 'candidate';

// src/stores/authStore.ts
interface UserProfile {
  role: string | null;  // Currently only 'admin' or 'user'
  icp: string | null;   // 'client' | 'consultant' | 'leader' | 'candidate'
  organization_id: string | null;
}
```

### 3.2. Required Changes

The `icp` field already exists on profiles. We use it for routing:

| `icp` value | Portal | Sidebar |
|-------------|--------|---------|
| `consultant` | `/platform` | Consultant sidebar |
| `leader` | `/platform` | Team Lead sidebar (Phase 1.6) |
| `client` | `/client` | Client sidebar (this spec) |
| `candidate` | `/candidate` | Candidate sidebar (Phase 1.2) |
| `admin` (role) | `/platform` | Full access + admin tools |

**No database migration needed** — `icp` field already exists on `profiles` table.

---

## 4. Detailed Specification

### 4.1. New Components to Build

```
src/components/client/
├── ClientPortal.tsx          # Layout: sidebar + Outlet for client routes
├── ClientDashboard.tsx       # My mandates overview, recent activity
├── ClientMandates.tsx        # List of mandates linked to this client's org
├── ClientMandateDetail.tsx   # Single mandate: status, milestones, shared shortlist
├── ClientShortlist.tsx       # Candidate cards for this mandate (GRID/LENS reports)
├── ClientReports.tsx         # Downloadable PDFs, market maps
├── ClientTeam.tsx            # (client_admin only) invite/manage team members
└── ClientSettings.tsx        # Profile, notification preferences
```

### 4.2. ClientPortal Layout Component

**File:** `src/components/client/ClientPortal.tsx`

```typescript
// Sidebar items for client view
const CLIENT_NAV = [
  { path: '/client', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { path: '/client/mandates', icon: Briefcase, label: 'My Mandates' },
  { path: '/client/reports', icon: FileDown, label: 'Reports' },
  { path: '/client/team', icon: Users, label: 'Team', roles: ['admin'] }, // client_admin only
  { path: '/client/settings', icon: Settings, label: 'Settings' },
];
```

Structure mirrors AppLayout but:
- No scoring tools, no pipeline, no Nexus AI, no candidates search
- Data is filtered by `organization_id` from the client's profile

### 4.3. Route Integration

**File:** `src/App.tsx`

Add client routes alongside platform routes:

```typescript
// Lazy-load client components
const ClientPortal = lazy(() => import('@/components/client/ClientPortal').then(m => ({ default: m.ClientPortal })));
const ClientDashboard = lazy(() => import('@/components/client/ClientDashboard').then(m => ({ default: m.ClientDashboard })));
const ClientMandates = lazy(() => import('@/components/client/ClientMandates').then(m => ({ default: m.ClientMandates })));
const ClientMandateDetail = lazy(() => import('@/components/client/ClientMandateDetail').then(m => ({ default: m.ClientMandateDetail })));
const ClientShortlist = lazy(() => import('@/components/client/ClientShortlist').then(m => ({ default: m.ClientShortlist })));
const ClientReports = lazy(() => import('@/components/client/ClientReports').then(m => ({ default: m.ClientReports })));
const ClientSettings = lazy(() => import('@/components/client/ClientSettings').then(m => ({ default: m.ClientSettings })));

// Inside <Routes>:
<Route path="/client" element={<ProtectedRoute><ClientPortal /></ProtectedRoute>}>
  <Route index element={<ClientDashboard />} />
  <Route path="mandates" element={<ClientMandates />} />
  <Route path="mandates/:id" element={<ClientMandateDetail />} />
  <Route path="mandates/:id/shortlist" element={<ClientShortlist />} />
  <Route path="reports" element={<ClientReports />} />
  <Route path="settings" element={<ClientSettings />} />
</Route>
```

### 4.4. ICP-Based Routing Guard

Create a new guard component for portal-level routing:

```typescript
// src/components/ICPRoute.tsx
function ICPRoute({ allowedICP, children }: { allowedICP: ICP | ICP[], children: React.ReactNode }) {
  const { profile, isLoading } = useAuthStore();
  if (isLoading) return <Loading />;
  
  const userICP = profile?.icp as ICP;
  const isAdmin = profile?.role === 'admin';
  
  // Admins can access any portal
  if (isAdmin) return <>{children}</>;
  
  const allowed = Array.isArray(allowedICP) ? allowedICP : [allowedICP];
  if (!userICP || !allowed.includes(userICP)) {
    // Redirect to appropriate portal
    return <Navigate to={getPortalRoute(userICP)} replace />;
  }
  return <>{children}</>;
}

function getPortalRoute(icp: ICP | null): string {
  switch (icp) {
    case 'client': return '/client';
    case 'candidate': return '/candidate';
    case 'consultant':
    case 'leader':
    default: return '/platform';
  }
}
```

Update App.tsx routes to use this guard:

```typescript
<Route path="/platform" element={
  <ProtectedRoute>
    <ICPRoute allowedICP={['consultant', 'leader']}>
      <AppLayout />
    </ICPRoute>
  </ProtectedRoute>
}>
```

### 4.5. Data Access Control

**Client mandate query** — filter by organization_id:

```typescript
// In ClientMandates.tsx
const { profile } = useAuthStore();
const { data: mandates } = await supabase
  .from('mandates')
  .select('*')
  .eq('organization_id', profile?.organization_id)  // Only see their org's mandates
  .eq('client_visible', true)                        // Only see mandates marked as visible
  .order('created_at', { ascending: false });
```

**New DB column needed:**
```sql
ALTER TABLE mandates ADD COLUMN client_visible BOOLEAN DEFAULT true;
-- Consultants can hide mandates from client view by setting client_visible = false
```

### 4.6. Post-Login Redirect

Update `src/pages/LoginPage.tsx` and `authStore.ts` to redirect based on ICP:

```typescript
// After successful login:
const icp = profile?.icp;
const targetRoute = icp === 'client' ? '/client' 
                 : icp === 'candidate' ? '/candidate'
                 : '/platform';
navigate(targetRoute);
```

---

## 5. Component Specifications

### 5.1. ClientDashboard

**Purpose:** At-a-glance view of engagement status.

**Sections:**
- **Active Mandates** — cards showing mandate name, status, phase, last update
- **Recent Activity** — timeline of shared shortlists, interview updates, report deliveries
- **Upcoming Interviews** — candidates in interview stage with date/time
- **Quick Actions** — "Request Report", "Contact Team"

**Data sources:**
- `mandates` (filtered by `organization_id`)
- `candidates_pipeline` (filtered by mandate → client org)
- `documents` (reports shared with client)

### 5.2. ClientMandates

**Purpose:** List view of all mandates for this client organization.

**Columns:**
| Mandate | Status | Phase | Shortlist | Last Update |
|---------|--------|-------|-----------|-------------|
| VP Engineering, Shanghai | Active | Interview | 3 candidates | 2 days ago |

**Filters:** Status (Active/Completed/Paused), Phase

### 5.3. ClientMandateDetail

**Purpose:** Single mandate deep-dive.

**Sections:**
- **Overview** — role title, location, fee, status, timeline
- **Progress** — visual phase indicator (screened → submitted → interview → offer → placed)
- **Shared Shortlist** — candidate cards with name, current role, match highlights (no internal scores)
- **Interview Schedule** — upcoming and past interviews
- **Documents** — downloadable reports

**Critical constraint:** Candidate cards in client view must NOT show:
- Internal scoring (φ, Trident scores)
- Consultant notes
- Source/origin of candidate
- Salary expectations (unless explicitly shared)

### 5.4. ClientReports

**Purpose:** Access to all reports generated for this client's mandates.

**Features:**
- List of reports by mandate
- Download PDF
- Report types: Market Map, Shortlist Report, Interview Debrief, Search Summary

### 5.5. ClientSettings

**Purpose:** Profile management and notification preferences.

**Features:**
- Edit company name, primary contact
- Notification preferences (email on: new shortlist, interview update, report ready)
- Password change

---

## 6. Database Changes

### 6.1. New Column

```sql
ALTER TABLE mandates ADD COLUMN client_visible BOOLEAN DEFAULT true;
COMMENT ON COLUMN mandates.client_visible IS 'Controls whether client org can see this mandate in their portal';
```

### 6.2. RLS Policies (Supabase)

```sql
-- Clients can only read mandates for their own org
CREATE POLICY client_mandates_read ON mandates
  FOR SELECT
  USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
    AND client_visible = true
  );

-- Clients cannot insert/update/delete mandates
-- (handled by existing consultant-only policies)
```

---

## 7. Acceptance Criteria

- [ ] Client user (`icp = 'client'`) logging in is redirected to `/client`
- [ ] Client sees only their organization's mandates
- [ ] Client cannot access `/platform/*` routes (redirected to `/client`)
- [ ] Client cannot see internal scoring, consultant notes, or pipeline internals
- [ ] Client can download reports shared with them
- [ ] Client dashboard shows meaningful activity summary
- [ ] Admin users can still access both `/platform` and `/client` for support
- [ ] `npm run build` succeeds
- [ ] No data leak: client viewing `/platform/mandates` in URL bar gets redirected

---

## 8. Files Created / Modified

### Created
| File | Purpose |
|------|---------|
| `src/components/client/ClientPortal.tsx` | Layout + sidebar |
| `src/components/client/ClientDashboard.tsx` | Dashboard |
| `src/components/client/ClientMandates.tsx` | Mandate list |
| `src/components/client/ClientMandateDetail.tsx` | Single mandate view |
| `src/components/client/ClientShortlist.tsx` | Candidate shortlist |
| `src/components/client/ClientReports.tsx` | Report downloads |
| `src/components/client/ClientSettings.tsx` | Settings |
| `src/components/ICPRoute.tsx` | ICP-based route guard |

### Modified
| File | Change |
|------|--------|
| `src/App.tsx` | Add `/client` routes + ICPRoute guard |
| `src/stores/authStore.ts` | Add post-login redirect logic |
| `src/pages/LoginPage.tsx` | Use ICP-based redirect |
| Supabase | Add `client_visible` column + RLS policy |

---

## 9. Design Notes

- Client portal should use the same design system (DS object) as the consultant platform for brand consistency
- Client view is intentionally simpler — fewer sidebar items, no technical tools
- The `client_visible` flag gives consultants control over what clients see
- Future enhancement: client feedback on candidates (thumbs up/down, interview feedback)

