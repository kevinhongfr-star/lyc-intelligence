# Phase 3: Design System & Frontend Framework

**Goal:** Establish the production design system, component library, layout framework, and shared UI infrastructure that all 6 portals will use. Build on Trae's DS-001→DS-050 specs but make them functional and production-ready.

**Pre-requisites:** Phase 1-2 complete (data foundation + API layer available).

**Gap Context:** Trae created 50 design system tickets (all closed) but these are specs/scaffold, not production components. No theme switching, no portal-specific layouts, no responsive testing, no accessibility compliance.

---

## Sprint 3.1 — Design Tokens & Theme Engine

| # | Ticket |
|---|--------|
| 3.1.01 | Define production design tokens — colors, spacing, typography, shadows as CSS variables |
| 3.1.02 | Create dark theme token set — full dark mode color palette |
| 3.1.03 | Create light theme token set — full light mode color palette |
| 3.1.04 | Build theme switcher component — toggle between dark/light with persistence |
| 3.1.05 | Create portal-specific theme variants — Internal (dark), Client (professional), Candidate (modern), B2C (vibrant) |
| 3.1.06 | Define typography scale — heading levels H1-H6, body, caption, label with responsive sizes |
| 3.1.07 | Define color semantics — primary, secondary, success, warning, error, info per theme |
| 3.1.08 | Define spacing scale — 4px base unit, 4/8/12/16/24/32/48/64/96 tokens |
| 3.1.09 | Define border radius tokens — sm(4px), md(8px), lg(12px), xl(16px), full |
| 3.1.10 | Define shadow tokens — elevation levels (card, dropdown, modal, overlay) |
| 3.1.11 | Define animation tokens — duration, easing curves for transitions |
| 3.1.12 | Define z-index scale — base(0), dropdown(100), sticky(200), modal(300), tooltip(400), toast(500) |
| 3.1.13 | Create Tailwind CSS configuration — map all tokens to Tailwind config |
| 3.1.14 | Create `@lyc/tokens` package — shared design tokens for all portals |
| 3.1.15 | Create `@lyc/theme` package — theme provider and hooks |
| 3.1.16 | Build theme preview tool — side-by-side light/dark comparison |
| 3.1.17 | Validate design tokens against LYC brand guidelines — fuchsia #C108AB, Libre Baskerville, DM Sans |
| 3.1.18 | Create icon library — Lucide icons with LYC-custom additions |
| 3.1.19 | Define responsive breakpoints — mobile(320), tablet(768), desktop(1024), wide(1440) |
| 3.1.20 | Create responsive layout utilities — container, grid, flex helpers |
| 3.1.21 | Create print styles — PDF-friendly layouts for report pages |
| 3.1.22 | Create high-contrast mode — accessibility theme for visually impaired |
| 3.1.23 | Design token documentation page — interactive token browser |
| 3.1.24 | Create design token migration guide — map Trae's DS specs to production tokens |
| 3.1.25 | Design system foundation review — all tokens validated and documented |

## Sprint 3.2 — Core Component Library

| # | Ticket |
|---|--------|
| 3.2.01 | Build Button component — variants (primary, secondary, ghost, danger), sizes (sm, md, lg), loading state |
| 3.2.02 | Build Input component — text, email, password, number with validation states |
| 3.2.03 | Build Select component — single select with search, multi-select variant |
| 3.2.04 | Build Checkbox and Radio components — with group and indeterminate states |
| 3.2.05 | Build TextArea component — auto-resize, character count, max length |
| 3.2.06 | Build DatePicker component — single date, date range, with timezone support |
| 3.2.07 | Build FileUpload component — drag-and-drop, multi-file, progress indicator, type validation |
| 3.2.08 | Build Modal/Dialog component — overlay, focus trap, sizes, close on ESC/overlay click |
| 3.2.09 | Build Drawer component — slide-in panel from right/left, nested drawer support |
| 3.2.10 | Build Card component — header, body, footer, hover state, click action |
| 3.2.11 | Build Table component — sortable columns, pagination, row selection, sticky header |
| 3.2.12 | Build DataGrid component — virtual scrolling for large datasets (10K+ rows) |
| 3.2.13 | Build Badge/Tag component — status colors, removable, clickable variants |
| 3.2.14 | Build Avatar component — image, initials fallback, size variants, status indicator |
| 3.2.15 | Build Toast/Notification component — success, error, warning, info with auto-dismiss |
| 3.2.16 | Build Tooltip component — top/bottom/left/right placement, delay, rich content |
| 3.2.17 | Build Dropdown menu component — nested menus, keyboard navigation, icons |
| 3.2.18 | Build Tabs component — horizontal, vertical, scrollable, lazy rendering |
| 3.2.19 | Build Accordion component — single/multi expand, animated, nested |
| 3.2.20 | Build Progress/Loading components — bar, spinner, skeleton screens |
| 3.2.21 | Build Breadcrumbs component — auto-generated from route, with overflow |
| 3.2.22 | Build Pagination component — page numbers, prev/next, items per page selector |
| 3.2.23 | Build EmptyState component — illustration, title, description, action button |
| 3.2.24 | Build ErrorBoundary component — catch render errors, fallback UI, retry button |
| 3.2.25 | Component library visual regression test suite — screenshot comparison per component |

## Sprint 3.3 — Advanced Components & Data Visualization

| # | Ticket |
|---|--------|
| 3.3.01 | Build DataTable component — server-side sorting, filtering, column resizing, export |
| 3.3.02 | Build SearchBar component — global search, filters, recent searches, suggestions |
| 3.3.03 | Build FilterPanel component — multi-facet filters, saved filter presets |
| 3.3.04 | Build KanbanBoard component — drag-and-drop columns, card preview, WIP limits |
| 3.3.05 | Build Timeline component — vertical/horizontal, milestones, status colors |
| 3.3.06 | Build ScoreCard component — metric display with trend arrow, comparison, sparkline |
| 3.3.07 | Build TierBadge component — Gold/Silver/Bronze/Unranked with visual distinction |
| 3.3.08 | Build StatCard component — large number, label, change percentage, icon |
| 3.3.09 | Build ChartLine component — time series, multi-line, zoom, tooltip |
| 3.3.10 | Build ChartBar component — horizontal/vertical, stacked, grouped |
| 3.3.11 | Build ChartPie/Donut component — segments, labels, interactive legend |
| 3.3.12 | Build ChartRadar component — multi-axis comparison for scoring visualization |
| 3.3.13 | Build ChartHeatmap component — grid-based with color intensity, tooltip |
| 3.3.14 | Build ChartFunnel component — pipeline funnel with stage labels and counts |
| 3.3.15 | Build ChartGantt component — timeline bars for project/mandate tracking |
| 3.3.16 | Build Map component — geographic visualization for contact/mandate locations |
| 3.3.17 | Build Notification Center component — bell icon, dropdown list, read/unread, mark all |
| 3.3.18 | Build CommandPalette component — Cmd+K search, navigation shortcuts |
| 3.3.19 | Build RichTextEditor component — formatting toolbar, markdown support, image embed |
| 3.3.20 | Build DragAndDrop context — sortable lists, reorderable cards |
| 3.3.21 | Build FileViewer component — PDF preview, image gallery, document metadata |
| 3.3.22 | Build ComparisonView component — side-by-side candidate/profile comparison |
| 3.3.23 | Build DashboardLayout component — resizable widget grid, drag-to-rearrange |
| 3.3.24 | Build ExportBar component — PDF, Excel, CSV export with format options |
| 3.3.25 | Data visualization review — all charts tested with real Supabase data |

## Sprint 3.4 — Layout Framework & Navigation

| # | Ticket |
|---|--------|
| 3.4.01 | Build AppShell layout — sidebar + header + content + footer |
| 3.4.02 | Build Sidebar component — collapsible, nested menu, active state, portal-aware icons |
| 3.4.03 | Build Header component — logo, search, notifications, user menu, theme toggle |
| 3.4.04 | Build Footer component — copyright, links, version, status indicator |
| 3.4.05 | Build PortalLayout wrapper — per-portal layout configuration (Internal, Client, Candidate, B2C, Council) |
| 3.4.06 | Build Internal layout — full sidebar, admin toolbar, system status bar |
| 3.4.07 | Build Client layout — simplified sidebar (mandates only), feedback shortcut |
| 3.4.08 | Build Candidate layout — minimal sidebar, progress tracker, assessment prompt |
| 3.4.09 | Build B2C layout — landing-style header, credit display, CTA bar |
| 3.4.10 | Build Council layout — elegant minimal layout, event calendar prominent |
| 3.4.11 | Build Login/Register page layout — branded, portal-aware background |
| 3.4.12 | Build Onboarding wizard layout — step indicator, progress bar, content area |
| 3.4.13 | Build Dashboard layout — widget grid, quick stats, recent activity |
| 3.4.14 | Build Detail page layout — header with actions, tabs, content sections |
| 3.4.15 | Build List page layout — filter bar, table/grid toggle, bulk actions |
| 3.4.16 | Build Settings page layout — tabbed sections, form groups, save/discard |
| 3.4.17 | Build Navigation context — route-aware active states, breadcrumbs auto-gen |
| 3.4.18 | Build Mobile navigation — hamburger menu, bottom tab bar, swipe gestures |
| 3.4.19 | Build 404/500 error pages — branded, with navigation back |
| 3.4.20 | Build Loading layout — full-page skeleton, route transition spinner |
| 3.4.21 | Build Maintenance mode page — scheduled downtime notification |
| 3.4.22 | Build Session expired page — auto-logout notification with re-login CTA |
| 3.4.23 | Build Permission denied page — access level explanation with upgrade CTA |
| 3.4.24 | Layout responsive testing — mobile, tablet, desktop, wide viewport validation |
| 3.4.25 | Navigation architecture review — all portal layouts validated and documented |

## Sprint 3.5 — Form System, Validation & Shared Utilities

| # | Ticket |
|---|--------|
| 3.5.01 | Build Form framework — React Hook Form integration with Zod validation |
| 3.5.02 | Build FormField wrapper — label, help text, error display, required indicator |
| 3.5.03 | Build FormSection component — collapsible section with title and description |
| 3.5.04 | Build FormWizard component — multi-step form with validation per step |
| 3.5.05 | Build FormActionBar — sticky bottom bar with Save, Cancel, Delete actions |
| 3.5.06 | Build Dynamic form builder — JSON schema → form rendering |
| 3.5.07 | Build Conditional form fields — show/hide fields based on other field values |
| 3.5.08 | Build Form autosave — draft saving to localStorage with recovery |
| 3.5.09 | Build Date/time utilities — formatting, parsing, timezone conversion |
| 3.5.10 | Build Number/currency utilities — formatting (CNY, EUR, USD), calculation helpers |
| 3.5.11 | Build String utilities — truncation, slugification, highlight matching |
| 3.5.12 | Build File utilities — MIME type detection, size formatting, download helper |
| 3.5.13 | Build Auth hooks — useUser, useAuth, usePermission, useSession |
| 3.5.14 | Build Data hooks — useQuery, useMutation, useRealtime with loading/error states |
| 3.5.15 | Build Pagination hook — page state, URL sync, cursor-based support |
| 3.5.16 | Build Search hook — debounced search, history, URL sync |
| 3.5.17 | Build Export hook — useExport with format selection, progress, download |
| 3.5.18 | Build Notification hook — useNotification with permission request, toast integration |
| 3.5.19 | Build Media query hooks — useMobile, useTablet, usePrefersDarkMode |
| 3.5.20 | Build Clipboard hook — copy to clipboard with feedback toast |
| 3.5.21 | Build LocalStorage hook — type-safe key-value persistence |
| 3.5.22 | Build Debounce/throttle utilities — performance optimization helpers |
| 3.5.23 | Build Error reporting utility — centralized error handler with Sentry integration |
| 3.5.24 | Build Analytics utility — page view, event tracking, user identification |
| 3.5.25 | Shared utilities review — all hooks and utilities tested and documented |
