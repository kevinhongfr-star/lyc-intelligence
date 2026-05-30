# SPEC-003: Server-Side Credit Writes + Race Condition Fix

**Decision**: Option E — Server writes, client reads (Kevin approved 2026-05-30)
**Issues**: #111 (client-side credit writes), #55 (race condition / double spend)
**Estimate**: 1-2 hours
**Depends on**: SPEC-002 (JWT middleware — credit write APIs need auth)

---

## Problem

1. **CreditContext.deductCredit** writes directly to Supabase from the browser:
   ```typescript
   // src/contexts/CreditContext.tsx — current
   const deductCredit = async (amount, description) => {
     const supabase = getSupabase(); // client-side Supabase
     const newBalance = credit.balance - amount; // reads from stale local state
     await supabase.from('credits').update({ balance: newBalance, ... }).eq('user_id', userId);
   };
   ```
2. **Race condition**: Two tabs both read `balance=5`, both deduct 1, both write `balance=4` → should be 3
3. **No atomicity**: Balance read + write are separate operations; no transaction
4. **Trust issue**: Client controls `newBalance` value — can set anything

## Target State

- **All credit writes** (deduct, earn, daily reset) go through server API with JWT auth
- **Credit reads** stay client-side (harmless, fast, no trust issue)
- **Server uses atomic operations**: read current balance → verify → update in one flow, with `.eq('balance', expectedBalance)` as optimistic lock
- **CreditContext.deductCredit** calls `/api/credits?action=spend` instead of direct Supabase write
- **Transaction logging** happens server-side only (already implemented in credits.ts API)

## Current Architecture

```
Client:
  CreditContext.deductCredit() → getSupabase().from('credits').update() [DIRECT WRITE]
  CreditContext.refreshCredits() → getSupabase().from('credits').select() [DIRECT READ]

Server (already exists but underutilized):
  /api/credits?action=spend → reads balance, checks sufficient, deducts, logs transaction
  /api/credits?action=earn → reads balance, adds, logs transaction
  /api/credits?action=daily-reset → checks tier, grants daily credits
```

## Changes

### 1. Update CreditContext.deductCredit — `src/contexts/CreditContext.tsx`

```typescript
// BEFORE — direct Supabase write (VULNERABLE)
const deductCredit = async (amount: number, description: string): Promise<boolean> => {
  if (!userId || credit.balance < amount) return false;
  const supabase = getSupabase();
  const newBalance = credit.balance - amount;
  await supabase.from('credits').update({ balance: newBalance, ... }).eq('user_id', userId);
  // ...
};

// AFTER — server API call (SECURE)
const deductCredit = async (amount: number, description: string): Promise<boolean> => {
  if (!userId || credit.balance < amount) return false;

  try {
    const response = await apiFetch('/api/credits?action=spend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, action: description, userId }),
    });
    const data = await response.json();

    if (!data.success) {
      // Server rejected (insufficient credits, auth failure, etc.)
      await refreshCredits(); // Re-sync balance from source of truth
      return false;
    }

    setCredit(prev => ({
      ...prev,
      balance: data.newBalance,
      totalSpent: prev.totalSpent + amount,
    }));
    return true;
  } catch (error) {
    console.error('[CreditContext] Deduct error:', error);
    await refreshCredits(); // Re-sync on error
    return false;
  }
};
```

### 2. Keep CreditContext.refreshCredits as-is (client-side read)

Reads are harmless. No change needed — `getSupabase().from('credits').select()` is fine for fetching current balance. The anon key respects RLS so users can only read their own credits.

### 3. Add optimistic locking to server — `api/credits.ts`

The existing `handleSpend` reads balance, checks it, then updates. Between read and update, another request could deduct. Fix:

```typescript
async function handleSpend(req: AuthedRequest, res: VercelResponse) {
  const userId = req.userId!; // From JWT, not body
  const { amount, action, referenceId } = req.body;

  // ... validation ...

  const { data: creditData } = await supabase!
    .from('credits')
    .select('balance, total_spent, tier')
    .eq('user_id', userId)
    .single();

  if (creditData.balance < amount) {
    return res.status(400).json({ error: 'Insufficient credits', success: false });
  }

  // Optimistic lock: only update if balance hasn't changed since we read it
  const { error: updateError, data: updateData } = await supabase!
    .from('credits')
    .update({
      balance: creditData.balance - amount,
      total_spent: (creditData.total_spent || 0) + amount,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('balance', creditData.balance)  // ← OPTIMISTIC LOCK
    .select()
    .single();

  if (updateError || !updateData) {
    // Balance changed between read and write — retry once
    return res.status(409).json({
      error: 'Concurrent modification — please retry',
      success: false,
      retry: true
    });
  }

  // ... log transaction, return success ...
}
```

### 4. Same fix for handleEarn — `api/credits.ts`

Add `.eq('balance', creditData.balance)` optimistic lock to earn handler too.

### 5. Remove userId from request body (server-side)

After SPEC-002 is deployed, server uses `req.userId` from JWT. Remove `userId` from request body in:
- `src/contexts/CreditContext.tsx` — deductCredit call
- `src/services/creditService.ts` — all 4 API calls

### 6. Delete creditService.ts functions that duplicate CreditContext

`src/services/creditService.ts` has `spendCredits()`, `earnCredits()`, `checkAndGrantDailyCredits()` that call the same API endpoints. These are used by... nothing currently (orphaned code after B8). Verify with grep and delete if unused.

## Dependency on SPEC-002

Credit API endpoints need JWT auth (SPEC-002) for this to be secure. Without JWT, moving writes to the API just changes WHERE the unauthenticated write happens (client → API, but API still has no auth).

**Recommended order**:
1. Deploy SPEC-002 first (JWT middleware on all routes)
2. Then deploy SPEC-003 (client writes → API calls)

If deploying together: ensure `api/credits.ts` has `requireAuth()` before the balance operations.

## Verification Checklist

- [ ] `CreditContext.deductCredit()` calls `/api/credits?action=spend` — NO direct Supabase writes
- [ ] `CreditContext.refreshCredits()` still reads from Supabase directly (OK)
- [ ] Server `handleSpend` uses optimistic lock (`.eq('balance', expectedBalance)`)
- [ ] Server returns 409 on concurrent modification, client retries
- [ ] No `userId` in request body — server uses `req.userId` from JWT
- [ ] `grep -rn "getSupabase.*credits.*update" src/` → ZERO results (no more client-side writes)
- [ ] `grep -rn "getSupabase.*credits.*insert" src/` → ZERO results
- [ ] Two-tab test: deduct in both tabs → no double spend (one gets 409 and retries)
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npm run build` → success

## Risk & Rollback

- Low-medium risk: changes are localized to CreditContext + credits API
- Optimistic lock may cause 409s under high concurrency — client should auto-retry once
- Rollback: revert CreditContext.deductCredit to direct Supabase write (but this re-opens #111/#55)
- Key concern: if apiFetch doesn't send JWT (SPEC-002 not deployed), all credit writes fail with 401
