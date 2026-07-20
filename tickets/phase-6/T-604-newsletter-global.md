# T-604: Global Newsletter Signup (Resend)

**Phase:** 6 | **Batch:** 6B | **Effort:** 1 day
**CD Source:** CD23 (FW-6), CD20 (FW-3 Content Cascade)
**Depends On:** Phase 3 (newsletter hub exists)
**Blocks:** None

---

## What to Build

Persistent newsletter signup across all pages + contextual signup on specific pages.

## Implementations

### 1. Persistent Signup (All Pages)
- Slim bar at bottom of viewport (above footer): "Get weekly insights → [Email] [Subscribe]"
- Dismissible (remember dismissal in localStorage)
- Resend integration

### 2. Diagnostic Results Page
- After archetype teaser: "Get archetype insights in your inbox"
- Contextual: tags email with `archetype_interest_[instrument]`

### 3. Webinar Pages
- Combined: "Register for webinar + Subscribe to newsletter"
- Single form, dual action: register for webinar AND subscribe to newsletter
- Checkbox: "Also send me weekly insights" (pre-checked)

### 4. Resend Segmentation Tags

| Tag | Trigger |
|---|---|
| `newsletter_signup` | Any newsletter signup |
| `archetype_interest_[instrument]` | Signup from diagnostic page |
| `webinar_registered_[slug]` | Signup from webinar page |
| `brief_downloaded` | Signup from brief page |

## Acceptance Criteria

- [ ] Persistent signup bar visible on all pages
- [ ] Dismissible (localStorage)
- [ ] Diagnostic page contextual signup works
- [ ] Webinar page combined signup works
- [ ] All Resend tags applied correctly
- [ ] Mobile responsive
- [ ] Does not conflict with existing newsletter signup on `/insights/newsletter`
