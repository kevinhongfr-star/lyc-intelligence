# 05b — The Council Portal v2.1 Addendum
## LYC Intelligence Platform — B2C Integration + Pricing v2

**Version:** 2.1  
**Last Updated:** 2026-07-13  
**Author:** NEXUS (PM) for Trae (Engineer)  
**Scope:** Additions/changes to 05_Council_Portal_Spec for v2 architecture  
**Dependencies:** 05 (Council Portal), 08 (Commerce Layer)

---

## 1. What Changed in v2.1

### 1.1 Changelog Summary

| Change | Impact | Section |
|--------|--------|---------|
| DEX AI B2C integrated into Council Portal | Major — new user journey | §2 |
| "Free" → "Executive Introduction" rebrand | All UI copy | §3 |
| Dual credit model (DEX Credits vs Council Credits) | Major — separate ledgers | §4 |
| Council pricing reduced (3,800/12,000/25,000) | Commerce Layer | §5 |
| Progressive gating (5 intro → soft → hard) | UX flow | §6 |
| Graduation gift (DEX → Council) | Retention mechanic | §7 |
| Annual prepay for Council | Billing change | §8 |

---

## 2. B2C User Journey (New)

### 2.1 Entry Points

| Entry | Source | Landing Page |
|-------|--------|-------------|
| WAVE content | Blog, social, email | `/council` → DEX AI |
| Direct search | Google/Baidu | `/dex/chat` |
| Referral | Council member | `/dex/chat?ref={member_id}` |
| Conference | QR code / event | `/dex/chat?src=event` |

### 2.2 Journey States

```
ANONYMOUS → INTRO_USER → PAID_DEX_USER → COUNCIL_MEMBER
              (0-5 msgs)   (credits/sub)    (annual)
```

### 2.3 State Transitions

| From | To | Trigger |
|------|----|---------|
| ANONYMOUS | INTRO_USER | Sign up (email/Google) |
| INTRO_USER | PAID_DEX_USER | Purchase credit pack or subscription |
| INTRO_USER | COUNCIL_MEMBER | Direct Council purchase (skip DEX) |
| PAID_DEX_USER | COUNCIL_MEMBER | Council membership purchase (graduation) |

### 2.4 Tickets

- `TC2-BJ-001`: Anonymous → Intro transition (signup flow)
- `TC2-BJ-002`: Intro → Paid transition (purchase prompt at msg 6)
- `TC2-BJ-003`: Paid → Council transition (graduation invitation)
- `TC2-BJ-004`: Direct Council signup (skip DEX path)
- `TC2-BJ-005`: Referral tracking (ref parameter)
- `TC2-BJ-006`: Source attribution (src parameter)

---

## 3. Brand Language Migration

### 3.1 Find & Replace Rules

**Everywhere in the codebase:**

| Old Text | New Text | Context |
|----------|----------|---------|
| `"Free"` | `"Executive Introduction"` | DEX AI landing/description |
| `"free tier"` | `"Executive Introduction"` | Any tier reference |
| `"sign up free"` | `"Access your Executive Introduction"` | CTA buttons |
| `"Free assessment"` | `"Complimentary assessment"` | Candidate Portal |
| `"Free trial"` | `"Founding member rate"` | Council context |
| `"free_message"` | `"intro_message"` | Code identifiers |
| `"freeMessages"` | `"introMessages"` | Variable names |
| `"FREE_TIER"` | `"EXECUTIVE_INTRO"` | Enum constants |

### 3.2 Affected Components

- `05_Council_Portal_Spec.md` — Landing page copy, CTA labels
- `07_Candidate_Portal_Spec.md` — Assessment descriptions
- `08_Commerce_Layer_Spec.md` — Product codes, pricing table
- All email templates mentioning "free"
- All push notification copy

### 3.3 Tickets

- `TC2-BL-001`: Update all UI copy for "free" → "Executive Introduction"
- `TC2-BL-002`: Update all database seed data
- `TC2-BL-003`: Update all email templates
- `TC2-BL-004`: Update all notification copy
- `TC2-BL-005`: Update all variable/enum names in code
- `TC2-BL-006`: QA pass — search entire codebase for remaining "free"

---

## 4. Dual Credit Model (New)

### 4.1 Architecture

```
┌────────────────────────────┐  ┌────────────────────────────┐
│     DEX CREDITS            │  │    COUNCIL CREDITS          │
│                            │  │                             │
│  Balance: dex_user_profiles│  │  Balance: council_profiles  │
│  Ledger: dex_credit_       │  │  Ledger: credit_transactions│
│          consumption       │  │           (credit_type =    │
│                            │  │            'council_credits')│
│  Consumed by:              │  │  Consumed by:               │
│  - DEX AI chat messages    │  │  - Coaching sessions        │
│  - Advanced AI features    │  │  - Event registrations      │
│                            │  │  - Premium content          │
│  Purchased via:            │  │  Included with:             │
│  - Credit packs (99/399/799│  │  - Council membership       │
│  - Monthly subscriptions   │  │    (annual prepay)          │
│    (99/299 CNY)            │  │                             │
│                            │  │  Reset: Annually with       │
│  Expiry: 12 months         │  │  membership renewal         │
│  Transferable: NO          │  │  Transferable: NO           │
│  Cross-use: NO             │  │  Cross-use: NO              │
└────────────────────────────┘  └────────────────────────────┘
```

### 4.2 Key Rule

**DEX Credits and Council Credits are completely separate.** No conversion, no transfer, no mixing. Each has its own balance, ledger, and consumption rules.

### 4.3 Database Impact

| Table | Credit Type | Notes |
|-------|-------------|-------|
| `dex_user_profiles.dex_credits` | DEX Credits | Balance for B2C users |
| `dex_credit_consumption` | DEX Credits | Transaction log |
| `council_profiles.council_credits` | Council Credits | Balance for members |
| `credit_transactions` | Both | Unified ledger (filtered by `credit_type`) |

### 4.4 Tickets

- `TC2-DC-001`: Separate credit balance queries (DEX vs Council)
- `TC2-DC-002`: DEX credit consumption on AI message
- `TC2-DC-003`: Council credit consumption on coaching booking
- `TC2-DC-004`: Council credit consumption on event registration
- `TC2-DC-005`: Credit expiry job (DEX: 12 months; Council: annual reset)
- `TC2-DC-006`: Low credit notifications (separate for each type)
- `TC2-DC-007`: Credit balance display in correct portal
- `TC2-DC-008`: Prevent cross-credit operations

---

## 5. Council Pricing v2

### 5.1 Updated Pricing Table

| Tier | Annual Price (CNY) | Council Credits/yr | Notes |
|------|-------------------|-------------------|-------|
| **Founding** | ¥2,800 | 12 | First 20 members only |
| **Individual** | ¥3,800 | 12 | Standard tier |
| **Corporate** | ¥12,000 | 48 | Up to 5 seats |
| **PE Partner** | ¥25,000 | 100 | Deal flow access + priority coaching |

### 5.2 Pricing Change Impact

| Old Price | New Price | Change |
|-----------|-----------|--------|
| Individual ¥5,000 | ¥3,800 | -24% |
| Corporate ¥18,000 | ¥12,000 | -33% |
| PE Partner ¥38,000 | ¥25,000 | -34% |
| Founding (new) | ¥2,800 | New tier |

**Rationale:** Lower prices to drive adoption. Founding tier creates urgency.

### 5.3 Tickets

- `TC2-PR-001`: Update product catalog with new prices
- `TC2-PR-002`: Update Stripe products/prices
- `TC2-PR-003`: Update pricing display on all pages
- `TC2-PR-004`: Founding member counter logic (20 max)
- `TC2-PR-005`: Legacy pricing support (grandfather existing members)
- `TC2-PR-006`: Proration for mid-cycle upgrades

---

## 6. Progressive Gating (New)

### 6.1 Gate States

| State | Messages Used | Gate Level | User Sees |
|-------|:------------:|-----------|-----------|
| Executive Introduction | 0-5 | None | Full AI, no payment prompt |
| Soft Gate | 6 | Soft | "Continue with credits?" banner |
| Hard Gate | 6+ (no credits) | Hard | Must purchase/subscribe |
| Active Paid | Any | None | Full access with credit deduction |

### 6.2 Soft Gate UX

After message 5, at the top of the chat:
```
┌─────────────────────────────────────────────────┐
│ ✨ You've completed your Executive Introduction! │
│                                                  │
│  To continue this conversation and unlock full   │
│  DEX AI capabilities:                            │
│                                                  │
│  [Get Credits — from ¥99]  [Subscribe — ¥99/mo] │
│                                                  │
│  Or explore Council membership for coaching,     │
│  events, and community. [Learn More →]           │
└─────────────────────────────────────────────────┘
```

### 6.3 Hard Gate UX

When trying to send message 6 without credits:
```
┌─────────────────────────────────────────────────┐
│ 🔒 Credits Required                              │
│                                                  │
│  Your Executive Introduction is complete.        │
│  Purchase credits or subscribe to continue.      │
│                                                  │
│  Current Balance: 0 DEX Credits                 │
│                                                  │
│  [Credit Pack — ¥99]  [Monthly — ¥99/mo]       │
│                                                  │
│  Already a Council member? [Use Council Credits] │
└─────────────────────────────────────────────────┘
```

### 6.4 Tickets

- `TC2-GT-001`: Intro message counter (tracks 0-5)
- `TC2-GT-002`: Soft gate UI component
- `TC2-GT-003`: Hard gate UI component
- `TC2-GT-004`: Gate state management (context)
- `TC2-GT-005`: Credit balance check before each message
- `TC2-GT-006`: Post-purchase gate removal (instant)
- `TC2-GT-007`: Council member alternative path

---

## 7. Graduation Gift (New)

### 7.1 Trigger

A DEX AI user purchases Council membership → "graduation" event fires.

### 7.2 Gift Contents

| Gift | Value | Delivery |
|------|-------|----------|
| 2 bonus Council Credits | ¥633 | Immediate |
| Personalized welcome message | — | Based on DEX AI chat history |
| Priority event registration | — | First pick at next 3 events |
| "Early Adopter" badge | — | Permanent on profile |

### 7.3 Implementation

```typescript
async function handleGraduation(userId: string, councilTier: string) {
  // 1. Activate Council membership
  await activateCouncilMembership(userId, councilTier);

  // 2. Deliver graduation bonus credits
  await deliverCredits(userId, 'council_credits', 2, 'graduation_bonus');

  // 3. Generate personalized welcome (using DEX AI chat context)
  const context = await getDexChatContext(userId);
  const welcome = await generateWelcomeMessage(context);

  // 4. Grant priority event access
  await grantPriorityAccess(userId, eventCount: 3);

  // 5. Award badge
  await awardBadge(userId, 'early_adopter');

  // 6. Send welcome email
  await sendGraduationEmail(userId, welcome);
}
```

### 7.4 Tickets

- `TC2-GG-001`: Graduation event detection
- `TC2-GG-002`: Bonus credit delivery
- `TC2-GG-003`: Personalized welcome generation (DeepSeek)
- `TC2-GG-004`: Priority event access flag
- `TC2-GG-005`: Badge award system
- `TC2-GG-006`: Graduation email template

---

## 8. Annual Prepay Billing

### 8.1 Model

Council memberships are **annual prepay only** (no monthly option).

| Tier | Annual (CNY) | Monthly Equivalent |
|------|-------------|-------------------|
| Founding | ¥2,800 | ¥233/mo |
| Individual | ¥3,800 | ¥317/mo |
| Corporate | ¥12,000 | ¥1,000/mo |
| PE Partner | ¥25,000 | ¥2,083/mo |

### 8.2 Stripe Configuration

- Mode: `subscription` with `interval: year`
- Proration: Enabled for mid-cycle upgrades
- Renewal: Auto-renew with 60/30/7 day reminders
- Cancellation: Pro-rated refund within first 30 days only

### 8.3 Tickets

- `TC2-AP-001`: Annual Stripe subscription setup
- `TC2-AP-002`: Auto-renewal handling
- `TC2-AP-003`: Renewal reminder emails (60/30/7 days)
- `TC2-AP-004`: Cancellation + partial refund logic
- `TC2-AP-005`: Upgrade proration calculation
- `TC2-AP-006`: Annual credit reset on renewal

---

## Ticket Summary (Addendum)

| Module | Tickets | IDs |
|--------|:-------:|-----|
| TC2-BJ: B2C User Journey | 6 | `TC2-BJ-001` to `TC2-BJ-006` |
| TC2-BL: Brand Language | 6 | `TC2-BL-001` to `TC2-BL-006` |
| TC2-DC: Dual Credits | 8 | `TC2-DC-001` to `TC2-DC-008` |
| TC2-PR: Pricing v2 | 6 | `TC2-PR-001` to `TC2-PR-006` |
| TC2-GT: Progressive Gating | 7 | `TC2-GT-001` to `TC2-GT-007` |
| TC2-GG: Graduation Gift | 6 | `TC2-GG-001` to `TC2-GG-006` |
| TC2-AP: Annual Prepay | 6 | `TC2-AP-001` to `TC2-AP-006` |
| **TOTAL** | **~45** | |

---

**Document Version:** 2.1  
**Created:** 2026-07-12  
**Updated:** 2026-07-13  
**Next Review:** Upon Trae implementation start
