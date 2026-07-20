# B2C Portal — Page 4 Deep Audit: Pricing & Monetization

**Audit Date:** 2026-07-20
**Auditor:** NEXUS
**Scope:** All pricing pages, credit systems, Stripe integration, tier definitions, checkout flows
**Score: 2/10**

---

## 1. What Exists

### 1.1 Four Separate Pricing Pages

| Route | Component | Auth | Tiers Shown | Currency | Lines |
|---|---|---|---|---|---|
| `/pricing` | `PricingPage.tsx` | Required | Member ($0), Professional ($29/mo) | USD | 230 |
| `/pricing-v2` | `PublicPricingPage.tsx` | Public | Individual ($199), Council Member ($499), Council Fellow ($999) | USD | 216 |
| `/council/tiers` | `CouncilTiersPage.tsx` | Public | Founding (¥2,800/yr), Individual (¥3,800/yr), Corporate (¥12,000/yr), PE Partner (¥25,000/yr) | CNY | 596 |
| `/dex/credits` | `CreditStorePage.tsx` | Required | Starter (10cr/$9.99), Professional (50cr/$39.99), Enterprise (150cr/$99.99) | USD | 596 |

### 1.2 Master Spec Requirements (§1.3)

| Tier | Price | Credits/Month |
|---|---|---|
| Free | ¥0 | 0 |
| Starter | ¥199/mo (¥1,999/yr) | 8 |
| Growth | ¥499/mo (¥4,999/yr) | 20 |
| Elite | ¥999/mo (¥9,999/yr) | 50 |
| Corporate | ¥4,999/mo | 200 |

**Verdict: None of the 4 pages matches the Master Spec.**

---

## 2. Critical Bugs (P0 — Will Crash or Silently Fail)

### 🔴 Bug 1: `PricingPage.handleUpgrade()` always fails with 400

```typescript
// PricingPage.tsx line 83
body: JSON.stringify({
  priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_COUNCIL || '',
  ...
})
```

- `NEXT_PUBLIC_STRIPE_PRICE_COUNCIL` does not exist in any env config
- Falls back to `''` → `stripeHandler.handleCheckout` rejects with `"priceId is required"`
- **Result:** Every "Upgrade to Professional" click → HTTP 400

### 🔴 Bug 2: `UpgradeModal` sends wrong parameter to Stripe

```typescript
// UpgradeModal.tsx
body: JSON.stringify({ tier: tierId })  // sends { tier: 'basic' }
// stripeHandler.handleCheckout expects:
const { priceId } = req.body || {};      // expects { priceId: 'price_xxx' }
```

- **Result:** Every upgrade attempt from CreditGate → HTTP 400 "priceId is required"

### 🔴 Bug 3: `credits/CreditGate.tsx` sends wrong parameter name

```typescript
// credits/CreditGate.tsx
body: JSON.stringify({ userId: user?.id, action, cost })  // sends `cost`
// creditsHandler.handleSpend expects:
const { userId, amount, action } = req.body;               // expects `amount`
```

- `amount` is undefined → `Number(undefined)` = NaN → spend fails
- **Result:** Every credit-gated action silently fails

### 🔴 Bug 4: `CreditContext.deductCredit()` writes to wrong column

```typescript
// CreditContext.tsx line 115
await supabase.from('credit_transactions').insert({
  user_id: userId,
  amount: -amount,
  type: 'spend',           // ← WRONG column name
  description,
})
```

- Table column is `transaction_type`, not `type`
- Supabase silently drops unknown columns → transaction not logged
- **Result:** Credit deductions not recorded in transaction history

### 🔴 Bug 5: `stripeHandler.grantAnnualCouncilCredits()` writes to non-existent table

```typescript
// stripeHandler.ts line 983
await db.insert('v2_council_credits', { ... })
await db.insert('v2_council_transactions', { ... })
```

- Neither `v2_council_credits` nor `v2_council_transactions` exists in any migration
- **Result:** Every Council subscription activation crashes → user pays but gets no credits

### 🔴 Bug 6: Database CHECK constraint rejects valid tier values

```sql
-- Migration 20260625
CREATE TABLE credits (
  ...
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'member', 'council'))
);
```

But code uses these tier values:
- `creditService.ts`: `basic`, `pro` → **violates CHECK constraint**
- `CreditContext.tsx`: `basic`, `pro`, `enterprise` → **violates CHECK constraint**
- `authStore.ts`: `pro`, `enterprise` → **violates CHECK constraint**
- `UpgradeModal.tsx`: `basic`, `pro`, `council` → `basic` and `pro` **violate CHECK**

**Result:** Any INSERT/UPDATE to `credits` table with these tier values will be rejected by PostgreSQL with a constraint violation error.

### 🔴 Bug 7: `profile?.credits?.balance` accessed but type doesn't have `credits` field

```typescript
// MatchPage.tsx line 75
setUserCredits(profile.credits.balance);

// CreditBadge.tsx
const credits = profile?.credits?.balance ?? 0;
```

- `UserProfile` in `auth.ts` has no `credits` field
- `profile.credits` is `undefined` → `undefined.balance` → **runtime TypeError**
- **Result:** MatchPage and CreditBadge crash on render

### 🔴 Bug 8: `authStore.ts` type definition excludes `'member'` but code sets it

```typescript
// authStore.ts line 12
tier: 'free' | 'pro' | 'council' | 'enterprise';  // no 'member'

// authStore.ts lines 141, 156
tier: 'member',  // ← TypeScript type violation
```

- In strict mode this is a compile error; in loose mode, `'member'` leaks into the system
- But `credits` table CHECK constraint only allows `'free' | 'member' | 'council'`
- So `'pro'` and `'enterprise'` from the type would also fail at DB level

---

## 3. Severe Issues (P1 — Wrong Behavior)

### ⚠️ Issue 1: Five Incompatible Tier Naming Systems

| Source | Tier Values |
|---|---|
| Master Spec | Free, Starter, Growth, Elite, Corporate |
| `auth.ts` CreditTier | free, member, pro, council, enterprise |
| `authStore.ts` inline type | free, pro, council, enterprise |
| `CreditContext.tsx` CreditTier | free, basic, pro, enterprise |
| `creditService.ts` TIER_CREDITS | free, basic, pro, council |
| `stripeHandler.ts` runtime | member, basic, pro, council-{id} |
| `UpgradeModal.tsx` | basic, pro, council |
| `credits` DB CHECK | free, member, council |
| `PricingPage.tsx` UI | Member, Professional |
| `PublicPricingPage.tsx` UI | Individual, Council Member, Council Fellow |
| `CouncilTiersPage.tsx` UI | Founding, Individual, Corporate, PE Partner |

**There is not a single tier name consistent across more than 2 files.**

### ⚠️ Issue 2: Credit Amount Contradictions (10x discrepancy)

| Source | "Starter"/First Pack | "Professional"/Second Pack | "Enterprise"/Third Pack |
|---|---|---|---|
| `CreditStorePage.tsx` | 10 cr / $9.99 | 50 cr / $39.99 | 150 cr / $99.99 |
| `stripeHandler.ts` (backend) | 10 cr / $9.99 | 50 cr / $39.99 | 150 cr / $99.99 |
| `BillingDashboard.tsx` | **100 cr** / $9.99 | **500 cr** / $39.99 | **1500 cr** / $99.99 |
| `UpgradeModal.tsx` | 50 cr / $19 | 200 cr / $49 | ∞ / $199 |
| `creditService.ts` | — | 50/mo | 200/mo |
| `CreditContext.tsx` | — | 20/mo | ∞/mo |
| Master Spec | 8/mo | 20/mo | 50/mo |

**Same price ($39.99) gives 50, 500, or 200 credits depending on which component renders it.**

### ⚠️ Issue 3: Three Separate Credit Systems (Parallel, Conflicting)

| System | Tables Used | Tier Logic | Used By |
|---|---|---|---|
| `creditService.ts` | `credits`, `credit_transactions` | free/basic/pro/council | CreditGate, BillingDashboard |
| `CreditContext.tsx` | `credits`, `credit_transactions` | free/basic/pro/enterprise | CreditDisplay, UpgradeBanner |
| `atomicCreditService.ts` | `v2_credit_transactions` (via RPC) | dex_credits / council_credits dual ledger | **Nobody** (never imported by frontend) |

- `atomicCreditService.ts` is the most well-designed (atomic ops, dual ledger, proper types) but is **completely unused**
- The two active systems read/write the same `credits` table with different tier enums
- Race condition: both can update the same user's balance concurrently (SELECT then UPDATE, not atomic)

### ⚠️ Issue 4: Currency Chaos

- Master Spec: exclusively ¥ (CNY)
- `PricingPage`: $ (USD)
- `PublicPricingPage`: $ (USD) with 20% annual discount
- `CouncilTiersPage`: ¥ (CNY) ✓ correct
- `CreditStorePage`: $ (USD)
- `stripeHandler`: dual USD/CNY via locale detection
- No user currency preference stored anywhere

### ⚠️ Issue 5: Dead Routes Referenced by Components

| Dead Route | Referenced By | Impact |
|---|---|---|
| `/upgrade` | `UpgradeBanner.tsx` href | Click → 404 |
| `/settings/billing` | Stripe success URL, payment failure email | Post-payment → 404 |
| `/features` | `PublicPricingPage.tsx` nav link | Click → 404 |
| `/faq` | `PublicPricingPage.tsx` nav link | Click → 404 |

### ⚠️ Issue 6: Race Conditions in Credit Operations

```typescript
// creditsHandler.ts handleSpend — NOT atomic
const creditData = await selectOne('credits', ...);  // READ balance
if (creditData.balance < spendAmount) return error;
const newBalance = creditData.balance - spendAmount;
await update('credits', ..., { balance: newBalance });  // WRITE balance
// ↑ Another request can spend the same credits between READ and WRITE
```

Same pattern in `handleDailyReset` — concurrent requests can grant daily credits multiple times.

`atomicCreditService.ts` has proper `SELECT FOR UPDATE` + stored procedures but is **never called**.

---

## 4. Design & UX Issues (P2)

### 4.1 Two Different CreditGate Components

| | `credits/CreditGate.tsx` | `nexus/CreditGate.tsx` |
|---|---|---|
| **Pattern** | Wraps children, blocks interaction | Modal popup, message-count based |
| **Trigger** | Action cost (1-8 credits) | 5 free messages → paywall |
| **API** | `/api/credits/spend` | (no deduction, just gate) |
| **Used by** | Unknown (not imported anywhere found) | NexusChat (but NexusChat is unused) |
| **Design** | Inline styles, dark theme | Tailwind, white theme |

### 4.2 Three Different Design Systems in Same Feature

1. **Dark inline styles** — `CreditBadge`, `CreditGate`, `UpgradeModal`, `PricingPage` (bg: `#0A0A0A`, text: `#FFFFFF`)
2. **Light inline styles** — `CreditDisplay`, `UpgradeBanner` (bg: `#FFFFFF`, text: `#000000`)
3. **Tailwind classes** — `PublicPricingPage`, `CouncilTiersPage`, `CreditStorePage`, `BillingDashboard`

A user navigating from pricing → credits → upgrade sees 3 different visual themes.

### 4.3 No Unified Pricing Constants

Every component hardcodes its own pricing data. There is no `src/constants/pricing.ts` or similar. Changes require editing 5+ files simultaneously.

### 4.4 Transaction History Data Split

- `BillingDashboard` fetches from `/api/data/credit-transactions` → `credit_transactions` table
- `stripeHandler` writes credit pack purchases to `credit_transactions` but council credits to `v2_council_transactions`
- `atomicCreditService` reads from `v2_credit_transactions`
- No unified view or JOIN between the two tables
- Users see incomplete transaction history

---

## 5. Security Issues

### 🔒 Stripe Webhook Verification is Non-Standard

```typescript
// Manual HMAC verification instead of stripe.webhooks.constructEvent()
const expectedSig = createHmac('sha256', STRIPE_WEBHOOK_SECRET)
  .update(`${timestamp}.${body}`)
  .digest('hex');
if (sig !== expectedSig) return res.status(400).json({ error: 'Invalid signature' });
```

This re-implements Stripe's signature verification manually. While the logic appears correct, it:
- Doesn't validate the timestamp is within tolerance (replay attack possible)
- Doesn't use Stripe's official library (misses edge cases)
- Could break silently if Stripe changes their signature format

### 🔒 No Idempotency on Credit Spend

`creditsHandler.handleSpend` has no idempotency key. A network retry could deduct credits twice. The `v2_credit_transactions` table has `idempotency_key` support but it's never used by the active spend path.

---

## 6. What's Actually Good

| Component | Assessment |
|---|---|
| `CouncilTiersPage.tsx` | **Excellent** — proper design, correct CNY pricing, comparison table, FAQ, checkout flow, brand compliance |
| `CreditStorePage.tsx` | **Good** — clean UI, proper pack display, transaction history, brand compliance |
| `stripeHandler.ts` | **Well-structured** — handles checkout, webhooks, subscriptions, credit packs, course enrollments, locale-based currency, idempotency checks for credit packs |
| `atomicCreditService.ts` | **Best-designed** credit code in the codebase — atomic ops, dual ledger, proper types, RPC-based. But completely unused. |
| `creditsHandler.ts` | **Decent** org-level credit fallback logic |

---

## 7. Master Spec Compliance Matrix

| Spec Requirement | Implemented? | Notes |
|---|---|---|
| 5 tiers (Free/Starter/Growth/Elite/Corporate) | ❌ | No page implements this. Code uses 4-6 different tier sets |
| CNY pricing | ⚠️ Partial | Only CouncilTiersPage uses ¥. Others use $ |
| Monthly credit allocation per tier | ❌ | Credit amounts differ 10x between components |
| Credit deduction for actions | ⚠️ Broken | Code exists but has wrong parameter names, wrong column names |
| Stripe integration | ⚠️ Partial | Backend is comprehensive but env vars missing, frontend sends wrong params |
| Upgrade flow | ❌ | Links to non-existent `/upgrade` route |
| Billing management | ⚠️ Partial | BillingDashboard exists but references non-existent `/settings/billing` |
| Council membership tiers | ✅ | CouncilTiersPage correctly implements 4 Council tiers with CNY |
| Dual credit ledger (DEX vs Council) | ❌ | Designed in atomicCreditService but unused. Active code uses single ledger |
| Webhook handling | ⚠️ Partial | Webhook handler exists but writes to non-existent tables |

---

## 8. Recommended Fix Order

### Phase 1: Unify Tier & Credit Model (blocks everything)
1. Define canonical tier enum matching Master Spec: `free | starter | growth | elite | corporate`
2. Define canonical credit amounts per tier from Master Spec
3. Update DB CHECK constraint to match
4. Create `src/constants/pricing.ts` as single source of truth
5. Remove or alias all conflicting tier definitions
6. Delete `CreditContext.tsx` or align it — currently it's a parallel system

### Phase 2: Fix Checkout Flows (blocks revenue)
1. Fix `PricingPage.handleUpgrade()` — use correct Stripe price IDs
2. Fix `UpgradeModal` — send `priceId` not `tier`
3. Fix `credits/CreditGate.tsx` — send `amount` not `cost`
4. Fix `CreditContext.deductCredit()` — use `transaction_type` not `type`
5. Fix `profile?.credits?.balance` references — add credits to UserProfile type or change access pattern
6. Configure all 14+ Stripe env vars in Vercel

### Phase 3: Fix Database Layer
1. Create missing `v2_council_credits` and `v2_council_transactions` tables
2. Migrate from `credit_transactions` to `v2_credit_transactions` (dual ledger)
3. Wire up `atomicCreditService.ts` as the active credit system
4. Add idempotency to spend operations
5. Add timestamp tolerance to webhook verification

### Phase 4: Clean Up Pages
1. Decide which pricing page is canonical → delete the rest
2. Fix dead routes (`/upgrade`, `/settings/billing`, `/features`, `/faq`)
3. Unify design system — all pages should use same theme
4. Remove duplicate CreditGate components
5. Fix BillingDashboard credit pack amounts (10x discrepancy)

---

## 9. Score Breakdown

| Dimension | Score | Rationale |
|---|---|---|
| Functionality | 1/10 | No checkout flow works end-to-end. Credits can't be spent. Webhooks write to missing tables. |
| Spec Alignment | 1/10 | No page matches Master Spec. Tier names, prices, credit amounts all wrong. |
| Data Integrity | 1/10 | 3 credit systems, 5 tier enums, 10x amount discrepancies, CHECK constraint violations. |
| Design/UX | 5/10 | CouncilTiersPage and CreditStorePage are well-designed individually. But 3 visual themes. |
| Architecture | 2/10 | atomicCreditService is well-designed but unused. Active code has race conditions, no idempotency. |
| Security | 4/10 | Webhook verification exists but non-standard. No idempotency on spend. |
| Go-live Readiness | 0/10 | Cannot accept a single payment. Every checkout path is broken. |
| **Overall** | **2/10** | |

---

## 10. B2C Audit Progress

| Page | Route | Score | Status |
|---|---|---|---|
| 1. Landing | `/b2c` | 5/10 | ✅ Done |
| 2. Assessment | `/assessment` | 4/10 | ✅ Done |
| 3. Nexus | `/nexus` | 4/10 | ✅ Done |
| 4. Pricing & Monetization | `/pricing`, `/pricing-v2`, `/council/tiers`, `/dex/credits` | 2/10 | ✅ Done |
| 5. Match | `/match` | — | 🔜 Next |
