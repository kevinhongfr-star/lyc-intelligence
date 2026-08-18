# Terminology Audit Checklist

**Batch 6 / Ticket 2 — Full product surface audit checklist.**

> Every surface where text appears, mapped to: what terms to verify, common mistakes, acceptance criteria, and a status template for recording results.

**Config source of truth:** [`src/config/terminologyAuditChecklist.ts`](../src/config/terminologyAuditChecklist.ts)
**Terminology reference:** [`TERMINOLOGY_REFERENCE.md`](./TERMINOLOGY_REFERENCE.md)

---

## Audit Surfaces (12)

| # | Surface | Locations | 2B Guardrails? |
|---|---------|-----------|----------------|
| 1 | NEXUS Chat Responses | `/nexus/chat`, `src/nexus/*` | ✅ Yes (runtime) |
| 2 | Pricing Page Copy | `/pricing`, `PricingPage.tsx` | ❌ Manual |
| 3 | Landing Page Copy | `/`, `*Landing*.tsx`, `*TakePage.tsx` | ❌ Manual |
| 4 | Onboarding Flow Text | `/create-profile`, `onboarding/*` | ❌ Manual |
| 5 | Assessment / Depth Pages | `/assessment/:code`, `assessment/*` | ❌ Manual |
| 6 | Email Templates | `emailEngine.ts`, `email/*` | ❌ Manual |
| 7 | Error Messages | form/API/edge errors | ❌ Manual |
| 8 | Settings / Account Pages | `/settings`, `settings/*` | ❌ Manual |
| 9 | Mile Balance + Pack Pages | `billing/*`, `miles/*` | ❌ Manual |
| 10 | Debrief Booking Flow | `NexusDebriefWidget.tsx` | ❌ Manual |
| 11 | Milestones / Progress Area | `Milestone*`, `growth/*` | ❌ Manual |
| 12 | Navigation + Footer | `TopBar*`, `Footer*` | ❌ Manual |

---

## Audit Item Template

Each audit item follows this schema:

```
surface → term to check → correct form → common error → acceptance criteria → status
```

**Status values:** `pass` | `fail` | `pending` | `not_applicable`

---

## Surface 1 — NEXUS Chat Responses (covered by Batch 2B guardrails)

| ID | Term to Check | Correct Form | Common Error | Acceptance |
|----|---------------|--------------|--------------|------------|
| `chat-nexus-naming` | NEXUS entity name | NEXUS | "the coach", "the AI" | `signatureBlockEnforcer()` zero hard violations |
| `chat-no-tier-names` | Tier names in chat | None (platform layer handles) | "Professional tier" in response | `canonicalTierNameCheck()` zero violations |
| `chat-banned-words` | Banned words | See BANNED_WORDS | "free", "framework", "credits" | `bannedWordScanner()` zero hard violations |
| `chat-mile-cost-accuracy` | Mile cost accuracy | INSTRUMENT_MILE_COST | "LEAP costs 2 miles" (wrong) | Every cost matches `miles.ts` |

**Verify method:** Runtime `QualityGate.audit()` on sample response corpus.

---

## Surface 2 — Pricing Page Copy

| ID | Term to Check | Correct Form | Common Error | Acceptance |
|----|---------------|--------------|--------------|------------|
| `pricing-entry-tier-name` | Entry tier name | Explorer / Executive Introduction | "Free", "$0" | Entry card never "Free"; 0-price = "Complimentary" |
| `pricing-tier-display-names` | Tier display names | Explorer, Starter, Professional, Executive, Council | "Pro", "Basic", "Enterprise" | Canonical names from `tiers.ts` |
| `pricing-price-format` | Price formatting | $X/mo, ¥X/mo; annual = 17% saving | Wrong currency, wrong annual math | `computeTierPrice()` + `formatPrice()` consistent |
| `pricing-cta-language` | CTA buttons | TIER_CTA_LABEL values | "Sign Up Free", "Buy Now" | CTAs from `tierConfig.ts`; no "free"/"buy now" |

---

## Surface 3 — Landing Page Copy

| ID | Term to Check | Correct Form | Common Error | Acceptance |
|----|---------------|--------------|--------------|------------|
| `landing-miles-vs-marketing` | miles (marketing register) | "included assessments" / "premium diagnostics" | "miles" in marketing prose | "miles" only in product-UI contexts |
| `landing-nexus-name` | NEXUS entity name | NEXUS (ALL CAPS) | "Nexus", "the AI", "our AI" | ALL CAPS; no banned entity refs |
| `landing-diagnostic-codes` | Diagnostic capitalization | ALL CAPS (SPARK, PRISM...) | Title case (Spark, Prism) | All 11 codes ALL CAPS |

---

## Surface 4 — Onboarding Flow Text

| ID | Term to Check | Correct Form | Common Error | Acceptance |
|----|---------------|--------------|--------------|------------|
| `onboard-signup-language` | Signup CTA | "Create your profile" | "Sign up", "Register" | Never "sign up"/"register" |
| `onboard-no-banned-words` | Banned words in microcopy | None | "free", "no credit card", "easy peasy" | Zero banned words in wizard/tooltip text |
| `onboard-explorer-tokens` | Explorer complimentary tokens | "complimentary assessments" / "complimentary Explorer tokens" | "free assessments", "free tokens" | LEAP + PRISM described as "complimentary" |

---

## Surface 5 — Assessment / Depth Pages

| ID | Term to Check | Correct Form | Common Error | Acceptance |
|----|---------------|--------------|--------------|------------|
| `assessment-diagnostic-accuracy` | Diagnostic names + descriptors | APPROVED_DIAGNOSTICS | Wrong descriptor, misspelled code | Matches `voiceStandard.ts` exactly |
| `assessment-mile-cost-display` | Mile cost display | "X miles" or "Complimentary" | "credits", "Free" for 0-cost | MileCostBadge renders correctly |
| `assessment-cost-tier-labels` | Cost tier labels | Light, Standard, Signature, Flagship | Invented tier names | Matches `MILE_COST_TIERS` |

---

## Surface 6 — Email Templates

| ID | Term to Check | Correct Form | Common Error | Acceptance |
|----|---------------|--------------|--------------|------------|
| `email-no-free` | "free" in email | "complimentary" / "Executive Introduction" | "free", "free trial" | Zero "free" variants in any template |
| `email-no-emoji-exclamation` | Emoji + exclamation | None | 🎉, !, !!! | Zero emoji, zero "!" in subject + body |
| `email-nexus-name` | NEXUS entity name | NEXUS | "the AI", "your assistant" | Never banned entity refs |

---

## Surface 7 — Error Messages

| ID | Term to Check | Correct Form | Common Error | Acceptance |
|----|---------------|--------------|--------------|------------|
| `error-no-banned-words` | Banned words in errors | None (no exceptions for errors) | "Oops!", emoji, "free" | Zero banned words; no emoji/exclamation |
| `error-nexus-name` | NEXUS in errors | "NEXUS encountered an issue" | "the AI is having trouble" | Never banned entity refs |
| `error-mile-terms` | Mile-related errors | "miles" / "complimentary" | "credits", "tokens", "Free token" | Never "credits"/"tokens"/"Free" |

---

## Surface 8 — Settings / Account Pages

| ID | Term to Check | Correct Form | Common Error | Acceptance |
|----|---------------|--------------|--------------|------------|
| `settings-profile-not-account` | "profile" vs "account" | "profile" | "account", "user account" | Never "account" |
| `settings-member-not-user` | "member" vs "user" | "member" | "user" in user-facing copy | Never "user" (internal analytics OK) |
| `settings-tier-display` | Tier display in settings | Canonical display names | Raw tier_key, "Pro", "Enterprise" | Uses `tierDisplayName()` |

---

## Surface 9 — Mile Balance + Pack Pages

| ID | Term to Check | Correct Form | Common Error | Acceptance |
|----|---------------|--------------|--------------|------------|
| `miles-currency-term` | Currency term | "miles" | "credits", "tokens", "points" | Never "credits"/"tokens"/"points" |
| `miles-zero-cost-label` | Zero-cost label | "Complimentary" | "Free", "$0" | Never "Free"/"$0" |
| `miles-pack-labels` | Pack labels | MILE_PACKS labels ("1 mile", "5 miles") | "credit pack", wrong pluralization | Matches `miles.ts` |

---

## Surface 10 — Debrief Booking Flow

| ID | Term to Check | Correct Form | Common Error | Acceptance |
|----|---------------|--------------|--------------|------------|
| `debrief-session-format` | Session duration format | "30-minute session" | "30 min", "30min", "1 hour session" | Hyphenated "X-minute session" |
| `debrief-term` | "debrief" term | "debrief" | "walkthrough", "review session", "consultation" | Never synonyms |

---

## Surface 11 — Milestones / Progress Area

| ID | Term to Check | Correct Form | Common Error | Acceptance |
|----|---------------|--------------|--------------|------------|
| `milestones-term` | Progress term | "milestones" | "bookmarks", "tasks", "todo", "checklist" | Zero banned progress terms |
| `milestones-cross-tier-consistency` | Cross-tier consistency | "milestones" at ALL tiers | "bookmarks" at Explorer, "milestones" at Pro | Same term every tier |

---

## Surface 12 — Navigation + Footer

| ID | Term to Check | Correct Form | Common Error | Acceptance |
|----|---------------|--------------|--------------|------------|
| `nav-nexus-name` | NEXUS in nav/footer | NEXUS (ALL CAPS) | "Nexus", "the AI" | ALL CAPS; no banned refs |
| `nav-no-tier-names` | Tier names in nav | None | "Professional", "Executive" as nav items | No tier names as nav items |
| `nav-milestone-term` | Milestones nav label | "Milestones" | "Bookmarks", "Tasks", "Saved" | Never synonyms |

---

## Cross-Surface Consistency Checks

These checks span multiple surfaces — they verify the SAME term is used consistently everywhere.

| ID | Check | Correct Form | Common Error |
|----|-------|--------------|--------------|
| `xsurf-nexus-naming` | NEXUS naming (no "the coach"/"the AI") | NEXUS everywhere | "the coach" in chat, "the AI" in email |
| `xsurf-milestones-vs-bookmarks` | "milestones" vs "bookmarks" | "milestones" | "bookmarks" in some surfaces |
| `xsurf-miles-vs-credits` | "miles" vs "assessments" vs "credits" context | "miles" (product) · "included assessments" (marketing) · never "credits" | "credits" anywhere; "miles" in marketing |
| `xsurf-tier-display-names` | Tier display name consistency | Explorer, Starter, Professional, Executive, Council | "Pro" in pricing, "Professional" in settings |
| `xsurf-complimentary-vs-free` | "complimentary" vs "free" | "complimentary" | "free" in any surface |
| `xsurf-diagnostic-capitalization` | Diagnostic code capitalization | ALL CAPS | Title case in some surfaces |

---

## Banned Word Enforcement — Per-Surface Risk Profile

| Surface | High-Risk Banned Words | Enforcement Notes |
|---------|------------------------|-------------------|
| Chat Responses | free, credits, framework, platform, leverage, "the coach", tier names | Runtime via `QualityGate.audit()` |
| Pricing Page | free, "no credit card", "cancel anytime", "best value", unlimited, "Pro tier", Enterprise | Manual + grep; historically prone to "free" |
| Landing Pages | free, cutting-edge, world-class, revolutionize, game changer, disrupt, "miles" (marketing) | Marketing register; prone to hype |
| Onboarding | free, "sign up", register, "no credit card", "easy peasy", "super easy", cool | Microcopy; casual tone risk |
| Assessment Pages | free, credits, test, quiz, survey, questionnaire | "assessment" canonical — never test/quiz/survey |
| Email Templates | free, deal, sale, bargain, amazing, !, emoji | `emailEngine.ts` forbidden_words lists enforce |
| Error Messages | Oops, uh oh, whoops, !, emoji, free, "the AI" | No exceptions for errors |
| Settings/Account | user, account, customer, subscriber, "Pro tier", Enterprise | "member" + "profile" canonical |
| Mile Balance/Packs | credits, tokens, points, Free, $0, top-up, refill | "miles" + "complimentary" + "mile pack" |
| Debrief Booking | walkthrough, "review session", consultation, read-out, debriefing, "30 min", "1 hour" | "debrief" + "X-minute session" |
| Milestones/Progress | bookmarks, tasks, todo, checklist, "dashboard items" | PROGRESS_TERM = "milestones" |
| Navigation/Footer | "Nexus" (wrong case), "the AI", Enterprise, Bookmarks, Tasks | Global chrome; high visibility |

---

## NEXUS Naming Consistency Check (non-negotiable)

**Rule:** Every user-facing surface — chat, UI, emails, error messages, marketing — uses **NEXUS** as the entity name.

**Banned entity references (enforced in `voiceStandard.ts → BANNED_ENTITY_REFERENCES`):**
`the coach`, `the AI`, `your assistant`, `your coach`, `the chatbot`, `the bot`

**Verify:** Codebase-wide grep for `BANNED_ENTITY_REFERENCES` across all 12 surface locations. Zero matches in user-facing string literals.

---

## "Milestones" vs "Bookmarks" Consistency Check

**Rule:** `PROGRESS_TERM = 'milestones'` — unified across ALL tiers.

**Banned progress terms (enforced in `voiceStandard.ts → BANNED_PROGRESS_TERMS`):**
`bookmarks`, `dashboard items`, `tasks`, `todo`, `checklist`

**Verify:** Codebase-wide grep for `BANNED_PROGRESS_TERMS`. Zero matches in any user-facing string.

---

## "Miles" vs "Assessments" vs "Credits" Usage Context Check

| Context | Correct Term | Wrong Term |
|---------|--------------|------------|
| Product UI (balance display, cost badges) | "miles" | "credits", "tokens", "points" |
| NEXUS chat (cost mentions) | "miles" | "credits" |
| Marketing copy (landing pages, ads) | "included assessments" / "premium diagnostics" | "miles" |
| Purchasable bundles | "mile pack" | "credit pack", "top-up" |
| Zero-cost assessments | "complimentary" | "free" |

**Verify:** Codebase-wide grep for "credits" (zero matches). Grep for "miles" in landing pages — verify each is product-UI context.

---

## Programmatic Usage

```typescript
import {
  AUDIT_SURFACES,
  AUDIT_CHECKLIST,
  CROSS_SURFACE_CHECKS,
  BANNED_WORD_PER_SURFACE,
  getAuditItemsForSurface,
  getBannedWordRiskForSurface,
  compileSurfaceReport,
  compileFullAuditReport,
  AUDIT_CHECKLIST_SUMMARY,
} from '@/config/terminologyAuditChecklist';
```

---

## Acceptance

- [x] Every product surface mapped (12 surfaces)
- [x] Per-surface: what terms to verify, common mistakes, acceptance criteria
- [x] Banned word enforcement checklist per surface
- [x] NEXUS naming consistency check documented
- [x] "Milestones" vs "bookmarks" consistency check documented
- [x] "Miles" vs "assessments" vs "credits" usage context check documented
- [x] Template: surface → term → correct form → common error → status
