# 03 — UX & Behavioral Mechanics Spec
## LYC Intelligence Platform — Shared UX Patterns

**Version:** 2.0  
**Last Updated:** 2026-07-13  
**Author:** NEXUS (PM) for Trae (Engineer)  
**Scope:** Cross-portal UX patterns, state machines, notifications, design system  
**Dependencies:** 02 (Supabase)

---

## 1. Design System

### 1.1 Theme

- **Style:** Clean, modern, professional (inspired by Linear, Notion, Vercel)
- **Light theme default** with dark mode toggle
- **Colors:** Blue primary (#2563EB), neutral grays, semantic colors (green=success, yellow=warning, red=error)
- **Typography:** Inter (UI), Noto Sans SC (Chinese), JetBrains Mono (code)
- **Spacing:** 4px base grid
- **Border radius:** 8px (cards), 4px (inputs), 12px (modals)

### 1.2 Component Library

| Component | Library | Notes |
|-----------|---------|-------|
| Buttons | Custom (shadcn/ui base) | Primary, secondary, ghost, danger |
| Inputs | shadcn/ui | Text, select, checkbox, radio, date |
| Tables | TanStack Table | Sortable, filterable, paginated |
| Modals | Radix Dialog | Accessible, animated |
| Toasts | Sonner | Auto-dismiss, stacking |
| Charts | Recharts | Line, bar, pie, funnel |
| Kanban | Custom | Drag-and-drop |
| Calendar | FullCalendar | Month/week/day views |
| Search | Cmdk | Cmd+K palette |
| Forms | React Hook Form + Zod | Validation |

### 1.3 Responsive Breakpoints

| Breakpoint | Width | Target |
|-----------|-------|--------|
| Mobile | < 768px | Phone |
| Tablet | 768px - 1024px | iPad |
| Desktop | > 1024px | Laptop |
| Wide | > 1440px | Large screen |

---

## 2. State Machines

### 2.1 Mandate State Machine

```
[draft] ──→ [pending_approval] ──→ [active] ──→ [on_hold]
   │              │                    │            │
   │              ↓                    ↓            │
   │         [cancelled]        [shortlisting]     │
   │                                   │            │
   │                              [interviewing]    │
   │                                   │            │
   │                              [offer_pending]   │
   │                               │         │      │
   │                          [filled]   [cancelled]│
   │                               │                │
   └─────────────────────────── [reopened] ←────────┘
```

**Valid Transitions:**
| From | To | Trigger | Who |
|------|----|---------|-----|
| draft | pending_approval | Submit for approval | Consultant |
| pending_approval | active | Approve | Admin/Client |
| pending_approval | cancelled | Reject | Admin |
| active | on_hold | Pause mandate | Consultant |
| active | shortlisting | First candidate submitted | System |
| on_hold | active | Resume | Consultant |
| shortlisting | interviewing | Client starts interviews | Client |
| interviewing | offer_pending | Offer extended | Consultant |
| offer_pending | filled | Offer accepted | System |
| offer_pending | cancelled | Offer rejected | System |
| filled | reopened | Re-open position | Consultant |

### 2.2 Candidate State Machine

```
[discovered] → [contacted] → [screening] → [qualified]
                                         → [rejected]
    [qualified] → [submitted] → [client_review] → [interview]
                                                    → [rejected]
        [interview] → [offer] → [accepted] → [placed]
                              → [rejected]
                              → [withdrawn]
```

### 2.3 Council Membership State Machine

```
[unregistered] → [applied] → [pending] → [active] → [expired]
                                          │           │
                                      [suspended]     │
                                          │           │
                                      [cancelled]     │
                                          ↓           │
                                      [reinstated] ←──┘ (renew)
```

### 2.4 Order State Machine

```
[pending] → [payment_required] → [paid] → [processing] → [fulfilled]
                                        → [failed]
                                        → [cancelled]
                                    [fulfilled] → [refunded]
                                                → [partially_refunded]
```

---

## 3. Notification System

### 3.1 Notification Channels

| Channel | When | Latency |
|---------|------|---------|
| In-app | Always | Real-time (WebSocket) |
| Email | Configured | < 1 minute (Resend) |
| Push | Configured | < 1 minute (Web Push) |
| SMS | Critical only | < 5 minutes |

### 3.2 Notification Types & Channels

| Event | In-App | Email | Push | SMS |
|-------|:------:|:-----:|:----:|:---:|
| New candidate submitted | ✓ | ✓ | ✓ | — |
| Interview scheduled | ✓ | ✓ | ✓ | — |
| Offer extended | ✓ | ✓ | ✓ | ✓ |
| Placement confirmed | ✓ | ✓ | ✓ | ✓ |
| Task due today | ✓ | ✓ | — | — |
| Task overdue | ✓ | ✓ | ✓ | — |
| Council event tomorrow | ✓ | ✓ | ✓ | — |
| Coaching session in 1h | ✓ | ✓ | ✓ | — |
| Credit balance low (<2) | ✓ | ✓ | — | — |
| Payment failed | ✓ | ✓ | ✓ | ✓ |
| System announcement | ✓ | ✓ | — | — |

### 3.3 Notification Preferences

Users can configure per-channel:
- Global on/off per channel
- Per-type on/off
- Quiet hours (no notifications 22:00-08:00)
- Digest mode (batch into daily summary)

### 3.4 Tickets

- `UX-NOT-001`: Notification service (backend)
- `UX-NOT-002`: In-app notification bell + dropdown
- `UX-NOT-003`: Email template system (Resend)
- `UX-NOT-004`: Push notification (Web Push API)
- `UX-NOT-005`: Notification preferences page
- `UX-NOT-006`: Quiet hours logic
- `UX-NOT-007`: Digest compilation (daily cron)
- `UX-NOT-008`: Notification read/unread tracking
- `UX-NOT-009`: Realtime delivery (Supabase Realtime)
- `UX-NOT-010`: Notification history page

---

## 4. Shared UX Patterns

### 4.1 Data Tables

All list views use consistent table patterns:
- Sortable columns (click header)
- Column visibility toggle
- Row selection (checkbox)
- Bulk actions toolbar
- Pagination (20/50/100 per page)
- Saved views (localStorage)
- CSV export
- Inline editing (optional)

**Tickets:**
- `UX-TBL-001`: Reusable DataTable component
- `UX-TBL-002`: Sort/filter/pagination
- `UX-TBL-003`: Column visibility
- `UX-TBL-004`: Bulk selection + actions
- `UX-TBL-005`: Saved views
- `UX-TBL-006`: CSV export

### 4.2 Forms

All forms follow consistent patterns:
- React Hook Form + Zod validation
- Inline validation (on blur)
- Error messages below fields
- Required field indicator (*)
- Auto-save for long forms (draft)
- Submit button states (idle/loading/success/error)

**Tickets:**
- `UX-FRM-001`: Reusable FormField component
- `UX-FRM-002`: Validation patterns
- `UX-FRM-003`: Auto-save draft
- `UX-FRM-004`: Submit button states
- `UX-FRM-005`: Form layout (single/multi-column)

### 4.3 File Uploads

- Drag-and-drop zone
- File type validation
- Size limit display
- Upload progress bar
- Preview (images/PDFs)
- Multiple file support

**Tickets:**
- `UX-UPL-001`: Drag-and-drop upload component
- `UX-UPL-002`: File validation
- `UX-UPL-003`: Upload progress
- `UX-UPL-004`: File preview
- `UX-UPL-005`: Supabase Storage integration

### 4.4 Search & Filtering

- Global search (Cmd+K) — see 01 IN-GLB
- Page-level search (within current view)
- Faceted filters (sidebar)
- Date range picker
- Saved filters

**Tickets:**
- `UX-SRCH-001`: Page-level search component
- `UX-SRCH-002`: Faceted filter sidebar
- `UX-SRCH-003`: Date range picker
- `UX-SRCH-004`: Saved filters

### 4.5 Empty States

Every list/table view needs an empty state:
- Friendly message
- Relevant illustration
- Primary CTA (create first item)
- Secondary CTA (import/learn more)

**Tickets:**
- `UX-EMP-001`: Empty state component
- `UX-EMP-002`: Per-page empty state copy

### 4.6 Loading States

- Skeleton screens (not spinners) for data loading
- Optimistic UI for mutations
- Toast for success/error feedback
- Progress bar for long operations

**Tickets:**
- `UX-LOAD-001`: Skeleton screen components
- `UX-LOAD-002`: Optimistic update patterns
- `UX-LOAD-003`: Toast notification system

---

## 5. Accessibility

### 5.1 Standards

- WCAG 2.1 AA compliance
- Keyboard navigation (all interactive elements)
- Screen reader support (ARIA labels)
- Color contrast (4.5:1 minimum)
- Focus indicators (visible)
- Reduced motion support

### 5.2 Tickets

- `UX-A11Y-001`: Keyboard navigation audit
- `UX-A11Y-002`: ARIA label audit
- `UX-A11Y-003`: Color contrast check
- `UX-A11Y-004`: Focus indicator styling
- `UX-A11Y-005`: Reduced motion media query

---

## 6. Internationalization

### 6.1 Language Support

| Language | Code | Priority |
|----------|------|----------|
| Chinese (Simplified) | zh-CN | Primary |
| English | en | Secondary |

### 6.2 Implementation

- `react-i18next` for translations
- All user-facing strings externalized
- Date/time formatting by locale
- Number/currency formatting by locale
- RTL support (future, Arabic)

### 6.3 Tickets

- `UX-I18N-001`: i18n setup (react-i18next)
- `UX-I18N-002`: Language switcher component
- `UX-I18N-003`: zh-CN translation file
- `UX-I18N-004`: en translation file
- `UX-I18N-005`: Date/number formatting

---

## 7. Performance

### 7.1 Targets

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Largest Contentful Paint | < 2.5s |
| Time to Interactive | < 3.5s |
| Cumulative Layout Shift | < 0.1 |
| First Input Delay | < 100ms |

### 7.2 Techniques

- Route-based code splitting
- Lazy loading (images, heavy components)
- Virtual scrolling (long lists)
- Image optimization (WebP, srcset)
- API response caching (React Query)
- Debounced search inputs
- Memoized computations

### 7.3 Tickets

- `UX-PERF-001`: Code splitting setup
- `UX-PERF-002`: Image optimization pipeline
- `UX-PERF-003`: Virtual scrolling for large tables
- `UX-PERF-004`: React Query caching config
- `UX-PERF-005`: Lighthouse CI integration

---

## Ticket Summary

| Module | Tickets | IDs |
|--------|:-------:|-----|
| UX-NOT: Notifications | 10 | `UX-NOT-001` to `UX-NOT-010` |
| UX-TBL: Data Tables | 6 | `UX-TBL-001` to `UX-TBL-006` |
| UX-FRM: Forms | 5 | `UX-FRM-001` to `UX-FRM-005` |
| UX-UPL: File Uploads | 5 | `UX-UPL-001` to `UX-UPL-005` |
| UX-SRCH: Search & Filter | 4 | `UX-SRCH-001` to `UX-SRCH-004` |
| UX-EMP: Empty States | 2 | `UX-EMP-001` to `UX-EMP-002` |
| UX-LOAD: Loading States | 3 | `UX-LOAD-001` to `UX-LOAD-003` |
| UX-A11Y: Accessibility | 5 | `UX-A11Y-001` to `UX-A11Y-005` |
| UX-I18N: Internationalization | 5 | `UX-I18N-001` to `UX-I18N-005` |
| UX-PERF: Performance | 5 | `UX-PERF-001` to `UX-PERF-005` |
| **TOTAL** | **~50** | |

---

**Document Version:** 2.0  
**Created:** 2026-07-11  
**Updated:** 2026-07-13  
**Next Review:** Upon Trae implementation start
