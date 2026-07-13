# 08 — Commerce Layer Spec v2.0
## LYC Intelligence Platform — Revenue Engine

**Version:** 2.0  
**Last Updated:** 2026-07-13  
**Author:** NEXUS (PM) for Trae (Engineer)  
**Scope:** All monetization — credits, subscriptions, orders, Stripe, pricing  
**Dependencies:** 02 (Supabase), 05 (Council), DEX AI B2C  
**Scope Note:** LYC Intelligence only. WAVE and VISTA are out of scope.

---

## 1. Commerce Layer Overview

### 1.1 Purpose

The Commerce Layer is the revenue engine of LYC Intelligence. It handles:
- **Credit systems** (dual model: DEX AI Credits + Council Credits)
- **Subscription management** (Council membership tiers)
- **One-time purchases** (credit packs, event tickets, assessments)
- **Payment processing** (Stripe integration)
- **Revenue tracking** (orders, transactions, analytics)

### 1.2 Revenue Streams

| Stream | Type | Price (CNY) | Credit Model |
|--------|------|-------------|-------------|
| **DEX AI Executive Introduction** | Complimentary | Free (5 messages) | No credits — gated funnel |
| **DEX AI Credit Pack Starter** | One-time | ¥99 (10 credits) | DEX Credits |
| **DEX AI Credit Pack Professional** | One-time | ¥399 (50 credits) | DEX Credits |
| **DEX AI Credit Pack Executive** | One-time | ¥799 (150 credits) | DEX Credits |
| **DEX AI Monthly Member** | Subscription | ¥99/mo (30 credits/mo) | DEX Credits |
| **DEX AI Monthly Pro** | Subscription | ¥299/mo (100 credits/mo) | DEX Credits |
| **Council Founding** | Annual | ¥2,800/yr (first 20) | Council Credits |
| **Council Individual** | Annual | ¥3,800/yr | Council Credits |
| **Council Corporate** | Annual | ¥12,000/yr | Council Credits |
| **Council PE Partner** | Annual | ¥25,000/yr | Council Credits |
| **Workshop Tickets** | One-time | ¥0–500/event | Council Credits or cash |
| **Coaching Sessions** | Per-session | Credits only | Council Credits |

### 1.3 Dual Credit Model

```
┌─────────────────────────────────────────────┐
│              DEX AI CREDITS                  │
│  Purpose: B2C AI advisory consultations      │
│  Currency: DEX Credits                       │
│  Purchase: Credit packs (99/399/799 CNY)     │
│  Subscription: Monthly (99/299 CNY)          │
│  Consumption: 1 credit per AI message        │
│  Scope: DEX AI chat only                     │
│  Expiry: Credits expire after 12 months      │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│             COUNCIL CREDITS                  │
│  Purpose: Membership coaching & events       │
│  Currency: Council Credits                   │
│  Included: With annual membership            │
│  Consumption: 1 credit per coaching session  │
│  Scope: Council Portal only                  │
│  Expiry: Reset annually with membership      │
└─────────────────────────────────────────────┘

Key Rule: Credits are NON-TRANSFERABLE between systems.
DEX Credits ≠ Council Credits. Separate ledgers, separate consumption.
```

### 1.4 Brand Language Rules (CRITICAL)

| Context | ❌ NEVER SAY | ✅ SAY INSTEAD |
|---------|-------------|---------------|
| DEX AI first touch | "Free tier" | "Executive Introduction" |
| DEX AI sign-up | "Sign up free" | "Access your Executive Introduction" |
| Candidate assessments | "Free assessment" | "Complimentary assessment" |
| Any zero-cost feature | "Free" | "Complimentary" or "Executive Introduction" |
| Council trial | "Free trial" | "Founding member rate" |

**The word "free" is permanently banned from all LYC Intelligence UI copy.**

---

## 2. Product Catalog

### 2.1 Product Codes

| Product Code | Name | Price (CNY) | Category | Credits |
|-------------|------|-------------|----------|---------|
| `B2C-DEX-INTRO` | DEX AI Executive Introduction | 0 | dex_credit_pack | 5 (intro messages) |
| `B2C-DEX-STARTER` | Credit Pack Starter | 99 | dex_credit_pack | 10 DEX Credits |
| `B2C-DEX-PRO` | Credit Pack Professional | 399 | dex_credit_pack | 50 DEX Credits |
| `B2C-DEX-EXEC` | Credit Pack Executive | 799 | dex_credit_pack | 150 DEX Credits |
| `B2C-DEX-MONTHLY` | Monthly Member | 99/mo | dex_subscription | 30 DEX Credits/mo |
| `B2C-DEX-MONTHLY-PRO` | Monthly Pro | 299/mo | dex_subscription | 100 DEX Credits/mo |
| `CNC-FOUNDING` | Council Founding | 2,800/yr | council_membership | 12 Council Credits/yr |
| `CNC-INDIVIDUAL` | Council Individual | 3,800/yr | council_membership | 12 Council Credits/yr |
| `CNC-CORPORATE` | Council Corporate | 12,000/yr | council_membership | 48 Council Credits/yr |
| `CNC-PE-PARTNER` | Council PE Partner | 25,000/yr | council_membership | 100 Council Credits/yr |
| `EVT-WORKSHOP` | Workshop Ticket | 0–500 | event_ticket | Varies |
| `COA-SESSION` | Coaching Session | 1 credit | coaching_session | 1 Council Credit |

### 2.2 Product Detail Pages

#### COM-001: Credit Store Page (DEX AI)

**Route:** `/dex/credits`  
**Access:** Any authenticated DEX AI user

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  DEX AI Credit Store                                │
│                                                     │
│  Your balance: [XX] DEX Credits                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  ONE-TIME CREDIT PACKS                      │   │
│  │                                              │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐   │   │
│  │  │ Starter   │ │Professional│ │Executive │   │   │
│  │  │ ¥99       │ │ ¥399       │ │ ¥799     │   │   │
│  │  │ 10 credits│ │ 50 credits │ │ 150 credits│  │   │
│  │  │           │ │ Save 20%   │ │ Save 33%  │   │   │
│  │  │ [BUY]     │ │ [BUY]      │ │ [BUY]     │   │   │
│  │  └──────────┘ └──────────┘ └──────────┘   │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  SUBSCRIBE & SAVE                            │   │
│  │                                              │   │
│  │  Monthly Member        Monthly Pro           │   │
│  │  ¥99/month             ¥299/month            │   │
│  │  30 credits/month      100 credits/month     │   │
│  │  [SUBSCRIBE]           [SUBSCRIBE]           │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Transaction history ↓                              │
└─────────────────────────────────────────────────────┘
```

**Tickets:**
- `COM-DEX-001`: Credit store page layout & rendering
- `COM-DEX-002`: Stripe Checkout integration for credit packs
- `COM-DEX-003`: Subscription management (create/upgrade/cancel)
- `COM-DEX-004`: Balance display & real-time update
- `COM-DEX-005`: Transaction history with filters
- `COM-DEX-006`: Credit expiry warnings (30/7/1 day)
- `COM-DEX-007`: Upgrade prompt when credits run low

#### COM-002: Council Membership Page

**Route:** `/council/membership`  
**Access:** Any authenticated user (upgrade flow)

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  The Council — Membership                            │
│                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐│
│  │Individual │ │Corporate │ │PE Partner│ │Founding││
│  │ ¥3,800/yr│ │¥12,000/yr│ │¥25,000/yr│ │¥2,800  ││
│  │          │ │          │ │          │ │/yr     ││
│  │ 12 credits│ │ 48 credits│ │100 credits│ │12 cred ││
│  │ [SELECT] │ │ [SELECT] │ │ [SELECT] │ │(20 left)││
│  └──────────┘ └──────────┘ └──────────┘ └────────┘│
│                                                     │
│  What's included:                                   │
│  ✓ 1-on-1 coaching sessions                        │
│  ✓ Exclusive workshops & events                     │
│  ✓ Private community access                         │
│  ✓ AI-powered career intelligence                   │
│  ✓ Priority candidate referrals                     │
│  ✓ Executive network access                         │
└─────────────────────────────────────────────────────┘
```

**Tickets:**
- `COM-CNC-001`: Membership tier comparison page
- `COM-CNC-002`: Annual prepay Stripe Checkout
- `COM-CNC-003`: Founding member counter (20 max)
- `COM-CNC-004`: Membership activation workflow
- `COM-CNC-005`: Renewal reminders (60/30/7 days)
- `COM-CNC-006`: Corporate seat management
- `COM-CNC-007`: PE Partner deal flow access

#### COM-003: Checkout Flow

**Route:** `/checkout/{product_code}`

**Flow:**
```
Product Selection → Cart Review → Payment (Stripe) → Confirmation → Fulfillment
```

**Tickets:**
- `COM-CHK-001`: Cart/checkout page
- `COM-CHK-002`: Stripe Checkout Session creation
- `COM-CHK-003`: Payment confirmation webhook handler
- `COM-CHK-004`: Order creation & status tracking
- `COM-CHK-005`: Credit delivery (immediate for packs, monthly for subs)
- `COM-CHK-006`: Invoice/receipt generation
- `COM-CHK-007`: Failed payment retry logic
- `COM-CHK-008`: Refund workflow (admin)
- `COM-CHK-009`: Discount code application
- `COM-CHK-010`: Tax calculation (CNY invoices)

#### COM-004: Billing & Subscription Management

**Route:** `/account/billing`

**Tickets:**
- `COM-BIL-001`: Current plan display
- `COM-BIL-002`: Upgrade/downgrade flow
- `COM-BIL-003`: Cancel subscription flow
- `COM-BIL-004`: Payment method management
- `COM-BIL-005`: Invoice history
- `COM-BIL-006`: Next billing date display
- `COM-BIL-007`: Proration calculation

#### COM-005: Revenue Analytics (Admin)

**Route:** `/admin/revenue`

**Tickets:**
- `COM-REV-001`: Revenue dashboard (MRR, ARR, LTV)
- `COM-REV-002`: Product-level revenue breakdown
- `COM-REV-003`: Credit consumption analytics
- `COM-REV-004`: Conversion funnel (intro → paid)
- `COM-REV-005`: Churn rate tracking
- `COM-REV-006`: Revenue forecasting
- `COM-REV-007`: Cohort analysis
- `COM-REV-008`: Export to CSV/PDF

#### COM-006: Stripe Webhook Handler

**Edge Function:** `stripe-webhook`

**Events to handle:**
- `checkout.session.completed` → Activate credits/membership
- `customer.subscription.updated` → Update subscription status
- `customer.subscription.deleted` → Handle cancellation
- `invoice.paid` → Confirm payment
- `invoice.payment_failed` → Trigger retry + notification
- `charge.refunded` → Process refund

**Tickets:**
- `COM-SW-001`: Webhook endpoint setup
- `COM-SW-002`: checkout.session.completed handler
- `COM-SW-003`: subscription.updated handler
- `COM-SW-004`: subscription.deleted handler
- `COM-SW-005`: invoice.payment_failed handler
- `COM-SW-006`: charge.refunded handler
- `COM-SW-007`: Webhook signature verification
- `COM-SW-008`: Idempotency handling
- `COM-SW-009`: Error logging & retry

#### COM-007: Credit Ledger System

**Tickets:**
- `COM-CL-001`: Credit balance calculation (DEX)
- `COM-CL-002`: Credit balance calculation (Council)
- `COM-CL-003`: Credit consumption on AI message
- `COM-CL-004`: Credit consumption on coaching booking
- `COM-CL-005`: Credit consumption on event registration
- `COM-CL-006`: Credit top-up flow
- `COM-CL-007`: Credit expiry job (daily cron)
- `COM-CL-008`: Low credit notifications
- `COM-CL-009`: Credit audit trail
- `COM-CL-010`: Balance reconciliation check

#### COM-008: Progressive Gating (DEX AI)

**UX Pattern:** Show value before asking for payment

```
Message 1-5: Executive Introduction (complimentary, no payment)
  → Shows full AI capability
  → Builds trust and dependency
Message 6: Soft gate
  → "You've used your 5 Executive Introduction messages.
     Continue your conversation with a Credit Pack."
  → Shows credit pack options
  → Does NOT block — just prompts
Message 6+: Hard gate (unless subscribed)
  → Must purchase credits or subscribe to continue
  → Shows current balance + purchase options
```

**Tickets:**
- `COM-PG-001`: Intro message counter (5 message limit)
- `COM-PG-002`: Soft gate UI (message 6 prompt)
- `COM-PG-003`: Hard gate enforcement
- `COM-PG-004`: Credit balance check before each message
- `COM-PG-005`: "Upgrade to subscription" prompt
- `COM-PG-006`: Council member cross-sell prompt
- `COM-PG-007`: Graduation gift flow (DEX → Council)

#### COM-009: Cross-Sell Engine

**Tickets:**
- `COM-XS-001`: DEX AI → Council membership prompt
- `COM-XS-002`: Council → DEX AI prompt (for AI features)
- `COM-XS-003`: Event → Membership upsell
- `COM-XS-004`: Coaching → Credit pack upsell
- `COM-XS-005`: Candidate graduation → Council invitation
- `COM-XS-006`: Time-based cross-sell triggers
- `COM-XS-007`: Cross-sell A/B testing framework

---

## 3. Stripe Integration

### 3.1 Stripe Products Setup

```
Stripe Products:
├── DEX AI Credit Packs
│   ├── Starter (¥99) → price_xxx
│   ├── Professional (¥399) → price_xxx
│   └── Executive (¥799) → price_xxx
├── DEX AI Subscriptions
│   ├── Monthly Member (¥99/mo) → price_xxx
│   └── Monthly Pro (¥299/mo) → price_xxx
├── Council Memberships
│   ├── Founding (¥2,800/yr) → price_xxx
│   ├── Individual (¥3,800/yr) → price_xxx
│   ├── Corporate (¥12,000/yr) → price_xxx
│   └── PE Partner (¥25,000/yr) → price_xxx
└── Events
    └── Workshop Tickets (varies) → price_xxx
```

### 3.2 Checkout Session Flow

```typescript
// 1. Client: Create Checkout Session
POST /api/create-checkout-session
{
  product_code: 'B2C-DEX-PRO',
  quantity: 1,
  success_url: '/dex/credits?success=true',
  cancel_url: '/dex/credits?cancelled=true'
}

// 2. Server: Create Stripe Checkout
const session = await stripe.checkout.sessions.create({
  mode: product.billing_cycle === 'one_time' ? 'payment' : 'subscription',
  line_items: [{ price: product.stripe_price_id, quantity: 1 }],
  success_url, cancel_url,
  metadata: { product_code, user_id }
});

// 3. Stripe: Redirect user to checkout
// 4. Stripe: Redirect back to success_url
// 5. Stripe: Send webhook (checkout.session.completed)
// 6. Server: Fulfill order (deliver credits/activate membership)
```

### 3.3 Webhook Security

```typescript
// Verify Stripe signature
const sig = req.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(
  req.body, sig, webhookSecret
);

// Idempotency: check if already processed
const existing = await db.from('orders')
  .select()
  .eq('stripe_checkout_session_id', event.data.object.id)
  .single();

if (existing) return { status: 'already_processed' };
```

---

## 4. Pricing Table (Complete Reference)

### 4.1 DEX AI Products

| Product | Price | Billing | Credits | Stripe Mode |
|---------|-------|---------|---------|-------------|
| Executive Introduction | ¥0 | One-time | 5 messages | N/A (no Stripe) |
| Credit Pack Starter | ¥99 | One-time | 10 DEX Credits | `payment` |
| Credit Pack Professional | ¥399 | One-time | 50 DEX Credits | `payment` |
| Credit Pack Executive | ¥799 | One-time | 150 DEX Credits | `payment` |
| Monthly Member | ¥99/mo | Monthly | 30 DEX Credits/mo | `subscription` |
| Monthly Pro | ¥299/mo | Monthly | 100 DEX Credits/mo | `subscription` |

### 4.2 Council Products

| Product | Price | Billing | Credits | Stripe Mode |
|---------|-------|---------|---------|-------------|
| Founding | ¥2,800 | Annual | 12 Council Credits/yr | `subscription` |
| Individual | ¥3,800 | Annual | 12 Council Credits/yr | `subscription` |
| Corporate | ¥12,000 | Annual | 48 Council Credits/yr | `subscription` |
| PE Partner | ¥25,000 | Annual | 100 Council Credits/yr | `subscription` |

### 4.3 Per-Unit Economics

| Item | Cost per Unit |
|------|-------------|
| 1 DEX AI message (DeepSeek flash) | ~¥0.02 |
| 1 DEX AI message (DeepSeek pro) | ~¥0.10 |
| 1 DEX Credit (selling price) | ¥9.90 (Starter), ¥7.98 (Pro), ¥5.33 (Exec) |
| 1 Council coaching session | 1 Council Credit |
| 1 Council Credit (Individual) | ¥316.67 (¥3,800/12) |
| 1 Council Credit (Corporate) | ¥250.00 (¥12,000/48) |

---

## 5. Order Management

### 5.1 Order States

```
[pending] → [payment_required] → [paid] → [processing] → [fulfilled]
                                                         ↓
                                          [cancelled] ← [failed]
                                                         ↓
                                                 [refunded] / [partially_refunded]
```

### 5.2 Order Fulfillment Rules

| Product Category | Fulfillment | Trigger |
|-----------------|-------------|---------|
| Credit Pack | Immediate credit delivery | `checkout.session.completed` |
| Subscription | Activate sub + deliver monthly credits | `checkout.session.completed` |
| Council Membership | Activate profile + deliver annual credits | `checkout.session.completed` |
| Event Ticket | Register for event | `checkout.session.completed` |
| Coaching Session | Deduct credit + create booking | In-app (no Stripe) |

---

## 6. Invoice & Receipt

### 6.1 Invoice Requirements (China)

- Company name: 灵YC（上海）管理咨询有限公司
- Tax ID (税号): Required for B2B invoices
- Invoice type: 增值税普通发票 (standard) or 增值税专用发票 (VAT special)
- Currency: CNY only
- Language: Chinese (Simplified)

### 6.2 Invoice Template

```
发票号码: INV-2026-XXXXX
开票日期: 2026-07-13
购买方: [Company Name]
纳税人识别号: [Tax ID]

商品/服务          数量    单价      金额
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DEX AI 智能咨询信用包   1    ¥399.00   ¥399.00
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
合计:                              ¥399.00
```

---

## 7. Financial Reporting

### 7.1 Key Metrics

| Metric | Formula | Target |
|--------|---------|--------|
| MRR | Sum of monthly subscription revenue | ¥50,000 by Month 6 |
| ARR | MRR × 12 | ¥600,000 by Month 6 |
| ARPU | Total revenue / paying users | ¥300/mo |
| LTV | ARPU × avg lifetime months | ¥3,600 |
| CAC | Marketing spend / new customers | < ¥500 |
| LTV:CAC ratio | LTV / CAC | > 3:1 |
| Churn rate | Cancelled subs / total subs | < 5%/mo |
| NRR | (Starting MRR + expansion - contraction - churn) / Starting MRR | > 110% |

### 7.2 Revenue Recognition

- Credit packs: Recognized at point of sale
- Subscriptions: Recognized monthly (pro-rated)
- Event tickets: Recognized at event completion
- Coaching: Recognized at session completion

---

## Ticket Summary

| Module | Tickets | IDs |
|--------|:-------:|-----|
| COM-DEX: DEX AI Credit Store | 7 | `COM-DEX-001` to `COM-DEX-007` |
| COM-CNC: Council Membership | 7 | `COM-CNC-001` to `COM-CNC-007` |
| COM-CHK: Checkout Flow | 10 | `COM-CHK-001` to `COM-CHK-010` |
| COM-BIL: Billing Management | 7 | `COM-BIL-001` to `COM-BIL-007` |
| COM-REV: Revenue Analytics | 8 | `COM-REV-001` to `COM-REV-008` |
| COM-SW: Stripe Webhooks | 9 | `COM-SW-001` to `COM-SW-009` |
| COM-CL: Credit Ledger | 10 | `COM-CL-001` to `COM-CL-010` |
| COM-PG: Progressive Gating | 7 | `COM-PG-001` to `COM-PG-007` |
| COM-XS: Cross-Sell Engine | 7 | `COM-XS-001` to `COM-XS-007` |
| **TOTAL** | **~72** | |

---

**Document Version:** 2.0  
**Created:** 2026-07-11  
**Updated:** 2026-07-13  
**Next Review:** Upon Trae implementation start
