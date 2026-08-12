# LYC Intelligence — Go-Live Checklist, Launch Plan & Rollback Procedure

**Ticket:** #1292  
**Phase:** 1 — Launch Blockers  
**Last updated:** 2026-08-11

---

## 1. Pre-Launch Checklist

### 1.1 Environment Variables

- [ ] `.env.production` created with all required vars (see `.env.example`)
- [ ] `VITE_SUPABASE_URL` — production Supabase project URL
- [ ] `VITE_SUPABASE_ANON_KEY` — production anon key
- [ ] `VITE_SENTRY_DSN` — Sentry project DSN (error monitoring)
- [ ] `VITE_POSTHOG_KEY` — PostHog project API key (product analytics)
- [ ] `VITE_APP_RELEASE` — git SHA or semantic version tag
- [ ] `SUPABASE_SERVICE_ROLE_KEY` — server-side only (API routes)
- [ ] `CRON_SECRET` — for RLS deployment endpoint auth
- [ ] `STRIPE_SECRET_KEY` — Stripe API key (billing)
- [ ] `STRIPE_WEBHOOK_SECRET` — Stripe webhook signing secret
- [ ] `DEEPSEEK_API_KEY` — DeepSeek LLM API key (NEXUS chat)
- [ ] All secrets stored in Vercel project settings (not in repo)

### 1.2 Security

- [ ] RLS policies deployed (`POST /api/apply-rls` with CRON_SECRET)
- [ ] `profiles_update_self` RLS policy restricts field-level updates (or app-level whitelist enforced — see #1291)
- [ ] No `role` or `tier` writes from client code (verify `updateProfile` whitelist)
- [ ] CSP headers verified in `vercel.json` (already configured)
- [ ] `X-Frame-Options: DENY` on all routes
- [ ] `Strict-Transport-Security` with preload
- [ ] `Permissions-Policy` restricting camera, mic, geolocation
- [ ] No API keys or secrets in client bundle (grep for `VITE_` prefixed secrets)
- [ ] Supabase auth: email confirmation enabled
- [ ] Supabase auth: password min length ≥ 8
- [ ] Rate limiting on `/api/auth/*` endpoints (if not at edge, configure via Vercel)

### 1.3 SEO & Metadata

- [ ] `sitemap.xml` submitted to Google Search Console
- [ ] `robots.txt` verified (portals disallowed, marketing pages allowed)
- [ ] OG image (`/public/og-image.jpg`) loads correctly
- [ ] Dynamic OG endpoint (`/api/og`) returns 200 for sample titles
- [ ] JSON-LD structured data validates (Google Rich Results Test)
- [ ] Canonical URLs match sitemap URLs
- [ ] All legacy redirects return 301 (not 200 + JS redirect)
- [ ] `/nexus/chat` is indexable (no noindex)

### 1.4 Analytics & Monitoring

- [ ] PostHog receiving events (verify in PostHog dashboard)
- [ ] Sentry receiving errors (trigger test error)
- [ ] Vercel Analytics active (verify in Vercel dashboard)
- [ ] Vercel SpeedInsights active (Web Vitals data flowing)
- [ ] Web Vitals reporter sending LCP/CLS/INP/FCP/TTFB to PostHog
- [ ] Error monitor (`installGlobalErrorHandlers`) catching unhandled rejections
- [ ] Event tracker buffer flushing to `/api/events` (check network tab)

### 1.5 Build & Deploy

- [ ] `npm run build` succeeds with no errors
- [ ] `npm run type-check` passes (or pre-existing errors documented)
- [ ] Bundle size within budget (< 500KB gzipped for initial load)
- [ ] Vercel deployment preview builds successfully
- [ ] All routes render without 404 (test sitemap URLs)
- [ ] No console errors on landing page load
- [ ] Font loading: Libre Baskerville, DM Sans, IBM Plex Mono from Google Fonts

### 1.6 Brand Compliance

- [ ] Zero border radius on all components (grep for `border-radius`, `rounded`)
- [ ] No "free" word in any UI string (grep for `free` in .tsx files)
- [ ] Entry tier labeled "Executive Introduction" (not "Explorer" or "free")
- [ ] Font trio: Libre Baskerville (serif), DM Sans (sans), IBM Plex Mono (mono)
- [ ] One accent color per page (#C108AB default)
- [ ] Premium tone in all copy

### 1.7 Pricing & Miles

- [ ] 5 tiers displayed: Executive Introduction, Starter, Pro, Executive, Council
- [ ] Assessment pricing: Standard (99mi), Premium (149mi), Unique (199mi)
- [ ] USD and CNY pricing correct (CNY ≈ USD × 2.33)
- [ ] Miles balance syncs with Supabase `credits` table
- [ ] Stripe checkout flow works end-to-end (test mode)

---

## 2. Launch Sequence

### Step 1: Deploy to Production (T-0)

```bash
# Ensure on main branch with latest merges
git checkout main
git pull origin main

# Deploy via Vercel
vercel --prod
```

### Step 2: Verify Deployment (T+2 min)

1. Visit `https://lyc-intelligence.app` — confirm landing page loads
2. Check `/sitemap.xml` — returns XML with all URLs
3. Check `/robots.txt` — returns text with correct disallow rules
4. Run Google PageSpeed Insights — verify LCP < 2.5s, CLS < 0.1
5. Trigger a test error — verify it appears in Sentry
6. Visit `/pricing` — verify 5 tiers display correctly
7. Visit `/assessment/cpi` — verify assessment landing loads
8. Test login flow — verify auth works

### Step 3: Submit to Search Engines (T+10 min)

1. Submit `https://lyc-intelligence.app/sitemap.xml` to Google Search Console
2. Submit to Bing Webmaster Tools
3. Verify indexing status (may take 24-48h)

### Step 4: Monitor (T+1h)

1. Check Sentry for any new errors
2. Check PostHog for incoming events
3. Check Vercel Analytics for traffic
4. Monitor Supabase logs for auth issues

---

## 3. Rollback Procedure

### Scenario A: Critical Bug (Immediate Rollback)

If a critical bug is discovered post-launch:

```bash
# Option 1: Vercel instant rollback (preferred)
vercel rollback [deployment-url]

# Option 2: Revert the merge commit and redeploy
git revert [merge-commit-sha]
git push origin main
vercel --prod
```

**Time to rollback:** < 2 minutes (Option 1) / < 5 minutes (Option 2)

### Scenario B: Data Migration Issue

If a database migration caused data loss:

1. **Stop the bleeding:** Disable the feature flag or revert the code
2. **Assess:** Check Supabase dashboard for affected rows
3. **Restore:** Use Supabase point-in-time recovery (PITR) if available
4. **Notify:** Alert the team in the incident channel

### Scenario C: Analytics/Tracking Failure

If analytics are not receiving data:

1. Check `VITE_POSTHOG_KEY` and `VITE_SENTRY_DSN` are set in Vercel
2. Check browser console for initialization errors
3. Verify `/api/events` endpoint is responding
4. Events are buffered in localStorage — they will flush once connection is restored

### Rollback Verification

After rollback:
- [ ] Previous version loads correctly
- [ ] No data loss (verify in Supabase)
- [ ] Analytics still receiving events
- [ ] Sentry still receiving errors
- [ ] Users can log in and access their data

---

## 4. Known Issues & Tech Debt

### Security
- **Consultant RLS too broad:** `is_consultant_role()` grants all consultants access to all mandates/contacts. Needs per-consultant scoping via `owner_id` or `consultant_id` columns on mandates and contacts tables. **Target: Phase 3 (#1306, #1307)**
- **CreditContext tier drift:** `CreditTier` type uses legacy values ('free', 'basic', 'pro', 'enterprise'). Needs alignment with canonical 5-tier model. **Target: Phase 3**

### SEO
- **Dynamic OG images:** The `/api/og` endpoint generates OG images server-side. If this endpoint is slow or unavailable, the static `/og-image.jpg` fallback will be used.
- **SPA rendering:** Search engines may not fully render JavaScript. The initial HTML in `index.html` includes basic meta tags and JSON-LD for crawlers.

### Performance
- **Bundle size:** Monitor initial bundle size. Code splitting is in place via React.lazy for route-level chunks.
- **Font loading:** Google Fonts CDN is used. Consider self-hosting fonts (Phase 6, #1273) for performance and privacy compliance.
