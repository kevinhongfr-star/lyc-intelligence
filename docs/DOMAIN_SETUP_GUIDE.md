# Custom Domain Setup Guide — lyc-intelligence.com

## Overview
This guide covers setting up `lyc-intelligence.com` as the custom domain for the LYC Intelligence platform deployed on Vercel.

## Prerequisites
- Access to the domain registrar (where `lyc-intelligence.com` is registered)
- Vercel team admin access
- Valid Vercel API token (the current token has expired — needs regeneration)

## Steps

### 1. Add Domain to Vercel Project

**Option A: Via Vercel Dashboard (Recommended)**
1. Go to https://vercel.com/teams/kevinhongfr-stars-projects/lyc-intelligence/settings/domains
2. Click "Add Domain"
3. Enter `lyc-intelligence.com`
4. Vercel will show DNS records to add

**Option B: Via Vercel CLI**
```bash
vercel --token <YOUR_TOKEN> domains add lyc-intelligence.com --team team_jBiUm19QlNzR1qHSMax3qzTb
```

**Option C: Via Vercel API**
```bash
curl -X POST "https://api.vercel.com/v10/projects/prj_SiN8wOKHuAWyNtaaHOJlbdi2mRfA/domains?teamId=team_jBiUm19QlNzR1qHSMax3qzTb" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name": "lyc-intelligence.com"}'
```

### 2. Configure DNS Records

After adding the domain, Vercel will provide DNS records. Typically:

**For root domain (lyc-intelligence.com):**
| Type  | Name | Value                              |
|-------|------|------------------------------------|
| A     | @    | 76.76.21.21                        |

**For www subdomain:**
| Type   | Name | Value                              |
|--------|------|------------------------------------|
| CNAME  | www  | cname.vercel-dns.com               |

### 3. SSL Certificate
Vercel automatically provisions and renews SSL certificates via Let's Encrypt. No action needed.

### 4. Verify
After DNS propagation (usually 5-30 minutes):
```bash
curl -I https://lyc-intelligence.com
# Should return 200 with Vercel headers
```

### 5. Update CSP Headers
Once the domain is live, update `vercel.json` to include the custom domain in trusted origins:

```json
{
  "headers": [{
    "source": "/(.*)",
    "headers": [{
      "key": "Content-Security-Policy",
      "value": "default-src 'self' https://lyc-intelligence.com; ..."
    }]
  }]
}
```

## Current Status
- ⚠️ Vercel API token expired (needs regeneration from Vercel dashboard)
- ⏳ Waiting for domain registrar access to configure DNS
- ✅ SSL will be auto-provisioned by Vercel

## Alternative: Subdomain
If the root domain is complex to configure, consider using a subdomain:
- `app.lyc-intelligence.com` → CNAME to Vercel
- `intelligence.lyc-partners.ai` → CNAME to Vercel

## Notes
- DNS propagation can take up to 48 hours (usually much faster)
- Vercel handles HTTPS automatically
- Redirect from www → root (or vice versa) is configured in Vercel dashboard
