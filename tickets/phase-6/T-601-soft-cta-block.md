# T-601: Universal Soft CTA Block Component

**Phase:** 6 | **Batch:** 6A | **Effort:** 1 day
**CD Source:** CD23 (FW-6 Sales Soft CTAs)
**Depends On:** All previous phases (all target pages exist)
**Blocks:** None (but all pages need to import it)

---

## What to Build

A reusable soft CTA component that appears on EVERY page across the website. This is the flywheel's "always visible" element.

## Component: `components/SoftCTABlock.tsx`

### Design (from CD23/FW-6)

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  Explore Before You Commit                      │
│                                                 │
│  🎓 Free Webinar     → [Next webinar title]     │
│  🔍 Free Diagnostic  → [9 diagnostics dropdown] │
│  💬 Nexus Advisory   → [Booking link]           │
│  🏛️ Invitation Council → [/council]             │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Behavior

- **Free Webinar:** Dynamically shows the NEXT upcoming webinar (from webinar data)
- **Free Diagnostic:** Dropdown or grid of all 9 diagnostics with links
- **Nexus Advisory:** Link to advisory booking page
- **Invitation Council:** Link to `/council`

### Placement

- Appears at the bottom of every page (before footer)
- On diagnostic pages: appears after the result section
- On webinar pages: appears after "Upcoming Webinars"
- On programme/workshop pages: appears after pricing

## Rollout

Add `<SoftCTABlock />` to:
- [ ] All diagnostic pages (`/assess/*`)
- [ ] All webinar pages (`/webinars/*`)
- [ ] All programme pages (`/programmes/*`)
- [ ] All workshop pages (`/workshops/*`)
- [ ] `/council`
- [ ] `/roundtable`
- [ ] `/insights/*`
- [ ] `/advisory`
- [ ] `/platform`
- [ ] `/network`
- [ ] Homepage `/`

## Acceptance Criteria

- [ ] Component renders consistently across all pages
- [ ] "Free Webinar" dynamically shows next webinar
- [ ] All links work correctly
- [ ] Visual design matches site aesthetic (dark theme consistent)
- [ ] Mobile responsive (stack vertically on mobile)
- [ ] Does NOT break any existing page layouts

## ⚠️ DO NOT

- Change existing page layouts to accommodate this component
- Make it visually dominant — it should be subtle ("soft" CTA)
- Deploy without Kevin's review of placement on every page
