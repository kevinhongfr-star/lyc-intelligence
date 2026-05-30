# SPEC-002: JWT Middleware for All API Routes

**Decision**: Option A (Kevin approved 2026-05-30)
**Issues**: #110 (zero auth on any API endpoint)
**Estimate**: 2-3 hours

---

## Problem

Every API endpoint accepts requests with no authentication. Anyone who knows a user ID can:
- Spend their credits: `POST /api/credits?action=spend { userId: "victim-id", amount: 100 }`
- Read their assessment data: `POST /api/memory { userId: "victim-id" }`
- Send emails as them: `POST /api/email { userId: "victim-id" }`
- Trigger Stripe charges: `POST /api/stripe/checkout { userId: "victim-id" }`

Rate limiting (added in B11) slows attacks but doesn't prevent them.

## Target State

- Every API route validates JWT from `Authorization: Bearer <token>` header
- Supabase issues JWTs automatically on login; client already has the session
- Server verifies token via `supabase.auth.getUser(jwt)` — returns the authenticated user
- `req.body.userId` is replaced by the JWT-verified user ID — client can no longer spoof it
- Unauthenticated requests → 401

## Implementation

### Step 1: Create shared auth helper — `api/_lib/auth.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

// Use the ANON key (not service key) for token verification — this enforces RLS
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export interface AuthedRequest extends VercelRequest {
  userId?: string;
  userEmail?: string;
}

export async function requireAuth(
  req: AuthedRequest,
  res: VercelResponse
): Promise<boolean> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization token' });
    return false;
  }

  const token = authHeader.slice(7);
  if (!supabase) {
    res.status(500).json({ error: 'Auth service not configured' });
    return false;
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return false;
    }
    req.userId = data.user.id;
    req.userEmail = data.user.email || undefined;
    return true;
  } catch (e) {
    res.status(401).json({ error: 'Token verification failed' });
    return false;
  }
}
```

**Key design choice**: Use `SUPABASE_ANON_KEY` (not service key) for verification. This means Supabase enforces RLS during verification and the token is validated against real auth state.

### Step 2: Apply to each API route

Pattern for each endpoint:

```typescript
import { requireAuth, AuthedRequest } from '../_lib/auth';

export default async function handler(req: AuthedRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    // Require auth for all POST endpoints
    if (!(await requireAuth(req, res))) return;

    // Use req.userId instead of req.body.userId
    const userId = req.userId; // JWT-verified
    // ... rest of handler
  }
}
```

### Routes to update (10 files)

| File | Auth level | Notes |
|------|-----------|-------|
| `api/chat.ts` | Required (POST) | Anonymous chat is ok for landing page; add flag `req.body.anonymous=true` to bypass auth |
| `api/score.ts` | Required (POST) | Always authenticated |
| `api/credits.ts` | Required (all actions) | Replace `req.body.userId` with `req.userId` |
| `api/memory.ts` | Required (POST) | Replace `req.body.userId` with `req.userId` |
| `api/share.ts` | Required (POST) | Replace `req.body.userId` with `req.userId` |
| `api/upload.ts` | Required (POST) | Replace `req.body.userId` with `req.userId` |
| `api/email.ts` | Required (POST) | Replace `req.body.userId` with `req.userId` |
| `api/lead-capture.ts` | **Optional** | Leads from unauthenticated landing page — keep open, just rate-limited |
| `api/stripe/checkout.ts` | Required (POST) | Replace `req.body.userId` with `req.userId` |
| `api/stripe/webhook.ts` | **Skip** | Stripe signs webhooks with `STRIPE_WEBHOOK_SECRET` — verify signature instead |
| `api/health.ts` | **Skip** | Public health check, no auth needed |

### Step 3: Client-side — Add auth token to all API calls

Create a shared fetch wrapper in `src/lib/apiClient.ts`:

```typescript
import { useAuthStore } from '@/stores/authStore';

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const { supabase } = useAuthStore.getState();
  const session = supabase ? await supabase.auth.getSession() : null;
  const token = session?.data?.session?.access_token;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Don't send userId in body anymore — server gets it from JWT
  // But keep it during transition for backwards compatibility

  return fetch(path, { ...options, headers });
}
```

### Step 4: Update all client-side API calls to use apiFetch

Files that make API calls:
- `src/services/creditService.ts` — spendCredits, earnCredits, checkAndGrantDailyCredits, updateUserTier
- `src/services/aiQuickActions.ts` — fetch('/api/chat'...)
- `src/services/serverApi.ts` — fetch('/api/score'...), fetch('/api/upload'...)
- `src/services/shareCardService.ts` — fetch('/api/share'...)
- `src/services/memoryService.ts` — fetch('/api/memory'...)
- `src/stores/authStore.ts` — fetch('/api/email'...) in signUp
- `src/components/nexus/NexusChat.tsx` — fetch('/api/chat'...) in streaming
- `src/pages/BatchScoringPage.tsx` — fetch('/api/score'...)
- `src/components/common/LeadCaptureForm.tsx` — fetch('/api/lead-capture'...) — no auth needed

Replace raw `fetch('/api/...')` with `apiFetch('/api/...')` in each.

### Step 5: Remove `userId` from request bodies (server trusts JWT)

After both client and server are updated, remove `userId` from request bodies. Server uses `req.userId` from JWT only.

This is a **two-phase deploy**:
1. Phase 1: Add JWT verification but still accept `userId` from body (log warning if mismatch)
2. Phase 2: Remove `userId` from body entirely

## Backwards Compatibility

- `api/lead-capture.ts` stays unauthenticated (landing page leads)
- `api/health.ts` stays unauthenticated
- `api/stripe/webhook.ts` uses Stripe signature verification, not JWT
- `api/chat.ts` supports anonymous mode for landing page Nexus chat (pass `anonymous: true`)

## Verification Checklist

- [ ] All 8 protected routes return 401 without Authorization header
- [ ] All 8 protected routes work with valid JWT
- [ ] Expired/invalid JWT → 401
- [ ] `req.body.userId` mismatch with JWT `req.userId` → logged warning, uses JWT userId
- [ ] Anonymous chat still works on landing page
- [ ] Lead capture still works without auth
- [ ] Stripe webhook still processes events
- [ ] Health endpoint still responds
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npm run build` → success

## Risk & Rollback

- Medium risk: all API calls need token; missing token = broken feature
- Mitigation: Phase 1 keeps `userId` in body as fallback, just adds JWT verification on top
- Rollback: remove `requireAuth()` calls from handlers, remove `Authorization` header from client
- Key concern: Supabase session tokens expire (~1hr); ensure client refreshes tokens automatically (Supabase JS SDK handles this via `onAuthStateChange`)
