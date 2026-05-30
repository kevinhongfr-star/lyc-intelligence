# SPEC-004: SITE_URL Environment Variable

**Decision**: Option A + E belt-and-suspenders (Kevin approved 2026-05-30)
**Issues**: #122 (SITE_URL not set in Vercel, share links and og:image broken)
**Estimate**: 30 seconds (env var) + 10 min (code fallback)

---

## Problem

`SITE_URL` was renamed from `NEXT_PUBLIC_SITE_URL` but never set in Vercel dashboard. Effects:
- `api/share.ts`: generates share links with wrong/missing base URL
- `api/email.ts`: email callback URLs broken
- `public/og-image.svg`: may not be referenced correctly

## Fix

### Part A: Vercel Dashboard (Kevin must do)

1. Go to Vercel → `lyc-intelligence` project → Settings → Environment Variables
2. Add: `SITE_URL` = `https://www.lyc-intelligence.app`
3. Apply to: Production, Preview, Development
4. Redeploy (push a commit or trigger from Vercel dashboard)

### Part B: Code fallback (engineer does)

Add a hardcoded fallback in `api/share.ts` and any other files that reference `SITE_URL`:

```typescript
// BEFORE
const SITE_URL = process.env.SITE_URL || '';

// AFTER
const SITE_URL = process.env.SITE_URL || 'https://www.lyc-intelligence.app';
```

This ensures the app works even if env var is accidentally removed later.

Files to check for SITE_URL usage:
- `api/share.ts`
- `api/email.ts`
- `api/stripe/checkout.ts` (success_url / cancel_url)

## Verification

- [ ] `SITE_URL` appears in Vercel environment variables
- [ ] Share links use `https://www.lyc-intelligence.app/share/xxx`
- [ ] Email callbacks point to correct domain
- [ ] og:image URL resolves to `https://www.lyc-intelligence.app/og-image.svg`
