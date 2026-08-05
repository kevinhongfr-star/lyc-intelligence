# Custom Domain Runbook — LYC Intelligence (S4-T04)

Configure `www.lyc-intelligence.app` as the production domain, with apex
redirect and auto-renewing SSL. All steps run in Vercel + the DNS provider
dashboard — no code changes required.

**Acceptance:** site accessible via `https://www.lyc-intelligence.app` with a
valid SSL certificate, and `https://lyc-intelligence.app` 301-redirects to the
`www` host.

---

## Prerequisites
- Owner access to the Vercel project (`lyc-intelligence`)
- Owner access to the DNS provider managing `lyc-intelligence.app`
- The Vercel project already deployed from the `main` branch

## Steps

### 1. Add the domain in Vercel
1. Vercel dashboard → **lyc-intelligence** project → **Settings → Domains**.
2. Click **Add**, enter `www.lyc-intelligence.app`, click **Add**.
3. Vercel displays the DNS record to create — note the **Value**
   (typically `cname.vercel-dns.com`).

### 2. Configure DNS at the provider
Create the following records at the DNS provider:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| CNAME | `www` | `cname.vercel-dns.com` | 3600 (default) |
| A (or ALIAS/ANAME) | `@` (apex) | `76.76.21.21` | 3600 |

> If the DNS provider does not support ALIAS/ANAME for the apex, use the A
> record above. Vercel's apex A record is `76.76.21.21`.

### 3. Add the apex domain in Vercel
1. Back in **Settings → Domains**, click **Add**, enter `lyc-intelligence.app`.
2. Once added, click the **...** menu next to the apex domain →
   **Edit** → set **Redirect to** `https://www.lyc-intelligence.app` with
   **Permanent (308)**. This enforces the apex → `www` redirect at the edge.

### 4. Wait for SSL provisioning
- Vercel auto-provisions a Let's Encrypt certificate once DNS propagates
  (typically 5–30 minutes).
- Status shows **Valid Configuration** with a green check once complete.
- If status shows **Invalid Configuration**, verify the DNS records match
  exactly (no trailing dot, correct CNAME target).

### 5. Verify
- `curl -I https://www.lyc-intelligence.app` → `HTTP/2 200`
- `curl -I https://lyc-intelligence.app` → `HTTP/2 308` with
  `location: https://www.lyc-intelligence.app/`
- Browser loads the site with a valid certificate (no warning).
- A hard-refresh of `/candidate/dashboard` and `/client/overview` works.

### 6. Update environment-specific references
After the domain is live, audit code/config for hardcoded preview URLs:
- `src/` — search for `*.vercel.app` and replace with the canonical domain
  where it appears in user-facing strings (OAuth redirect URIs, email links,
  og:url tags).
- Vercel env vars — update any `SITE_URL` / `PUBLIC_URL` / Supabase Auth
  redirect URLs to `https://www.lyc-intelligence.app`.
- Supabase Dashboard → **Authentication → URL Configuration** → add
  `https://www.lyc-intelligence.app/**` to **Redirect URLs**.

## Rollback
If the custom domain breaks production:
1. In Vercel **Settings → Domains**, remove both domain entries.
2. Vercel falls back to the `*.vercel.app` preview URL immediately.
3. Investigate DNS propagation (`dig www.lyc-intelligence.app`) before re-adding.

## Renewal
- SSL certificates auto-renew ~30 days before expiry — no action needed.
- The `.vercel.app` domain remains active as a fallback forever.
