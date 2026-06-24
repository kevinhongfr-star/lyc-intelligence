# Phase 1.8 — Admin Platform Completion

**Status:** DRAFT — Pending Kevin approval  
**Priority:** P2 (operational necessity — needed for platform management at scale)  
**Estimated effort:** 3–4 days  
**Dependency:** Phase 1.0 (auth), Phase 1.3 (role navigation)

---

## 1. Problem Statement

The admin experience is **functional but basic**. The current admin has:

- ✅ Org Intelligence (CSV upload, talent pool, evaluations, scoring, one-pager)
- ✅ AdminRoute protection for `/platform/org-intel`
- ❌ No user management (create, edit, disable users)
- ❌ No credit management (grant, adjust, view all users' credits)
- ❌ No system configuration (feature flags, tier settings)
- ❌ No audit log viewer
- ❌ No data management tools (migration status, cleanup)
- ❌ No quick admin actions (reset password, impersonate for support)

As the platform scales, Kevin/Alessio need tools to manage users, credits, and system health without direct Supabase access.

---

## 2. Target State

```
Admin Dashboard (/platform/admin)
├── User Management
│   ├── User list (all profiles, searchable, filterable by ICP/role)
│   ├── User detail (profile, credits, activity, mandates)
│   ├── Quick actions: disable, change role, grant credits, reset password
│   └── Bulk actions: import users, export list
├── Credit Management
│   ├── Credit overview (total issued, consumed, remaining)
│   ├── Per-user credit history
│   ├── Bulk credit grant (CSV import)
│   └── Credit adjustment (add/remove credits for specific users)
├── System Health
│   ├── API status (Vercel functions health check)
│   ├── Database stats (table sizes, row counts)
│   ├── Recent errors (from org_audit_log)
│   └── Deployment status (current commit, last deploy time)
├── Audit Log
│   ├── All platform actions (who did what, when)
│   ├── Filterable by user, action type, date range
│   └── Export to CSV
└── Org Intelligence (existing)
    ├── Company data management
    ├── Talent pool
    ├── Evaluations
    ├── Scoring
    └── One-pager
```

---

## 3. Detailed Specification

### 3.1. Admin Dashboard

**New page:** `src/pages/AdminDashboardPage.tsx`

```
┌─────────────────────────────────────────────────────────┐
│ Admin Dashboard                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│ │ Users    │ │ Active   │ │ Credits  │ │ API      │   │
│ │   47     │ │ Today: 8 │ │ 42,800   │ │ All OK ✅│   │
│ │ +3 this wk│ │          │ │ remaining│ │          │   │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                                                         │
│ 📊 Users by ICP                                         │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Consultant: 12  Client: 8  Leader: 3  Candidate: 24│  │
│ └────────────────────────────────────────────────────┘  │
│                                                         │
│ 📋 Recent Activity                                      │
│ ┌────────────────────────────────────────────────────┐  │
│ │ 10:32  Alessio logged in                           │  │
│ │ 10:28  James scored 5 candidates for VP Eng        │  │
│ │ 09:45  New signup: candidate@example.com           │  │
│ │ 09:12  Credit grant: +500 to wei@lyc.com           │  │
│ └────────────────────────────────────────────────────┘  │
│                                                         │
│ ⚡ Quick Actions                                        │
│ [Add User]  [Grant Credits]  [View Audit Log]  [Export]│
└─────────────────────────────────────────────────────────┘
```

### 3.2. User Management

**File:** `src/components/admin/UserManagement.tsx`

**User List Table:**
| Name | Email | ICP | Role | Credits | Status | Last Active | Actions |
|------|-------|-----|------|---------|--------|-------------|---------|
| Alessio | alessio@lyc... | consultant | admin | 1,240 | ✅ Active | 2h ago | [Edit] [Disable] |
| James | james@lyc... | consultant | user | 847 | ✅ Active | Today | [Edit] [Disable] |
| Client A | ceo@client... | client | user | 100 | ✅ Active | Yesterday | [Edit] [Disable] |

**User Detail Panel (slide-out or modal):**
```
┌─────────────────────────────────────────┐
│ User: Alessio                           │
├─────────────────────────────────────────┤
│                                         │
│ Profile                                 │
│ Email: alessio@lyc-partners.ai          │
│ ICP: consultant                         │
│ Role: admin                             │
│ Tier: enterprise                        │
│ Org: LYC Partners                       │
│ Created: 2026-05-01                     │
│ Last Active: 2 hours ago                │
│                                         │
│ Credits                                 │
│ Balance: 1,240                          │
│ Total Granted: 5,000                    │
│ Total Consumed: 3,760                   │
│ [Grant Credits] [Adjust]                │
│                                         │
│ Activity                                │
│ Active Mandates: 4                      │
│ Total Scored: 234 candidates            │
│ Nexus Sessions: 89                      │
│                                         │
│ Actions                                 │
│ [Change Role ▾] [Disable User]         │
│ [Reset Password] [Impersonate]          │
└─────────────────────────────────────────┘
```

**Data source:**
```typescript
// Fetch all users with credit info
const { data: users } = await supabase
  .from('profiles')
  .select(`
    *,
    credits:credits(balance),
    credit_transactions(count)
  `)
  .order('created_at', { ascending: false });
```

### 3.3. Credit Management

**File:** `src/components/admin/CreditManagement.tsx`

**Sections:**
1. **Credit Overview** — total issued, consumed, remaining across all users
2. **Per-User Credits** — sortable table with grant/adjust actions
3. **Transaction Log** — all credit transactions with filters
4. **Bulk Grant** — CSV upload: `email,amount,reason`

**Grant Credits Dialog:**
```
┌─────────────────────────────────────────┐
│ Grant Credits                           │
├─────────────────────────────────────────┤
│ User: [Select user ▾]                   │
│ Amount: [____]                          │
│ Reason: [Monthly allocation ▾]          │
│                                         │
│ [Cancel]  [Grant]                       │
└─────────────────────────────────────────┘
```

**Credit transaction types:**
| Type | Description |
|------|-------------|
| `grant` | Admin adds credits |
| `consumption` | User spends credits (scoring, Nexus) |
| `adjustment` | Admin correction (positive or negative) |
| `refund` | Reversal of failed transaction |
| `expiry` | Credits expired (if applicable) |

### 3.4. System Health

**File:** `src/components/admin/SystemHealth.tsx`

```
┌─────────────────────────────────────────┐
│ System Health                           │
├─────────────────────────────────────────┤
│                                         │
│ API Status                              │
│ ┌─────────────────────────────────────┐ │
│ │ ✅ Vercel Functions — All healthy   │ │
│ │ ✅ Supabase — Connected             │ │
│ │ ✅ Coze API — Operational           │ │
│ │ ✅ Stripe — Connected               │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Database                                │
│ ┌─────────────────────────────────────┐ │
│ │ profiles: 47 rows                   │ │
│ │ mandates: 23 rows                   │ │
│ │ candidates_pipeline: 156 rows       │ │
│ │ scoring_runs: 89 rows               │ │
│ │ chat_messages: 1,234 rows           │ │
│ │ credits: 47 rows                    │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Recent Errors (last 24h)                │
│ ┌─────────────────────────────────────┐ │
│ │ No errors in last 24 hours ✅       │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Deployment                              │
│ ┌─────────────────────────────────────┐ │
│ │ Current: commit 3cf4e22             │ │
│ │ Deployed: 2026-06-24 10:30 UTC      │ │
│ │ Status: Ready ✅                     │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Implementation notes:**
- DB row counts: query `SELECT relname, n_live_tup FROM pg_stat_user_tables`
- API health: ping each Vercel function endpoint
- Errors: query `org_audit_log` for error-level entries
- Deployment: use Vercel API or display env vars

### 3.5. Audit Log Viewer

**File:** `src/components/admin/AuditLogViewer.tsx`

The `org_audit_log` table already exists (migration: `20260615_create_audit_logs.sql`).

**Table view:**
| Timestamp | User | Action | Resource | Details | IP |
|-----------|------|--------|----------|---------|-----|
| 2026-06-24 10:32 | Alessio | login | profiles | — | 1.2.3.4 |
| 2026-06-24 10:28 | James | score | scoring_runs | 5 candidates | 5.6.7.8 |
| 2026-06-24 09:45 | system | signup | profiles | candidate@... | 9.10.11.12 |

**Filters:** User, Action Type, Date Range, Resource

**Export:** CSV download of filtered results

### 3.6. Admin Sidebar Integration

```typescript
const ADMIN_NAV = [
  { path: '/platform/admin', icon: LayoutDashboard, label: 'Admin Dashboard', exact: true },
  { path: '/platform/admin/users', icon: Users, label: 'Users' },
  { path: '/platform/admin/credits', icon: CreditDisplay, label: 'Credits' },
  { path: '/platform/admin/health', icon: Activity, label: 'System Health' },
  { path: '/platform/admin/audit', icon: FileText, label: 'Audit Log' },
  { type: 'divider', label: 'Intelligence' },
  { path: '/platform/org-intel', icon: BarChart3, label: 'Org Intelligence' },
];
```

### 3.7. Route Integration

```typescript
// App.tsx — inside /platform routes
<Route path="admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
<Route path="admin/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
<Route path="admin/credits" element={<AdminRoute><CreditManagement /></AdminRoute>} />
<Route path="admin/health" element={<AdminRoute><SystemHealth /></AdminRoute>} />
<Route path="admin/audit" element={<AdminRoute><AuditLogViewer /></AdminRoute>} />
```

The existing `AdminRoute` component in `App.tsx` already checks `profile.role === 'admin'`.

---

## 4. API Endpoints (Vercel Functions)

New serverless functions needed:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/users` | GET | List all users with credit info |
| `/api/admin/users/:id` | GET | User detail |
| `/api/admin/users/:id/role` | PATCH | Change user role |
| `/api/admin/users/:id/disable` | POST | Disable user |
| `/api/admin/credits/grant` | POST | Grant credits to user |
| `/api/admin/credits/adjust` | POST | Adjust credits |
| `/api/admin/credits/bulk` | POST | Bulk credit grant (CSV) |
| `/api/admin/health` | GET | System health check |
| `/api/admin/audit` | GET | Audit log with filters |

**File structure:**
```
api/
├── admin/
│   ├── users/
│   │   └── [[...path]].ts    # Handles all user admin endpoints
│   ├── credits/
│   │   └── [[...path]].ts    # Handles all credit admin endpoints
│   └── health.ts             # System health check
```

---

## 5. Security Considerations

| Concern | Mitigation |
|---------|-----------|
| Admin actions are irreversible | Log all admin actions to audit_log |
| Credit grants can be exploited | Require reason field; alert on large grants |
| User disable affects active work | Warning dialog: "This user has N active mandates" |
| Impersonation is risky | Log impersonation sessions; time-limit to 30 min |
| Audit log can be large | Pagination + date range filter; max 1000 rows per query |

---

## 6. Acceptance Criteria

- [ ] Admin dashboard shows user count, active users, credit overview, system health
- [ ] User management: list all users, view details, change role, disable user
- [ ] Credit management: grant credits, view transaction history, bulk grant via CSV
- [ ] System health: shows API status, DB stats, recent errors, deployment info
- [ ] Audit log: view all platform actions with filters and export
- [ ] All admin pages accessible only to `role = 'admin'` users
- [ ] All admin actions logged to `org_audit_log`
- [ ] `npm run build` succeeds

---

## 7. Files Created / Modified

### Created
| File | Purpose |
|------|---------|
| `src/pages/AdminDashboardPage.tsx` | Admin dashboard |
| `src/components/admin/UserManagement.tsx` | User list + detail |
| `src/components/admin/CreditManagement.tsx` | Credit operations |
| `src/components/admin/SystemHealth.tsx` | System status |
| `src/components/admin/AuditLogViewer.tsx` | Audit log view |
| `api/admin/users/[[...path]].ts` | User admin API |
| `api/admin/credits/[[...path]].ts` | Credit admin API |
| `api/admin/health.ts` | Health check API |

### Modified
| File | Change |
|------|--------|
| `src/App.tsx` | Add admin routes |
| `src/components/layout/AppLayout.tsx` | Add admin sidebar section |
| `src/services/supabaseApi.ts` | Add admin query functions |

---

## 8. Design Notes

- Admin pages use the same design system as the rest of the platform
- Admin actions should be **confirmable** — never silently execute destructive operations
- Audit log is append-only — admins cannot delete or modify audit entries
- Consider adding Slack/email alerts for critical admin actions (credit grants > 1000, user disables)
- User impersonation is a powerful debugging tool but needs strict logging

