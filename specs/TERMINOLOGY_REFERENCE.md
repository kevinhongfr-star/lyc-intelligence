# Unified Terminology Reference

**Batch 6 / Ticket 1 — Single source of truth for all product terminology.**

> **One term = one concept.** No synonyms. No parallel naming systems. All batches reference this document. No batch defines its own terms.

---

## Source Specs (locked)

| Spec | Version | Authority |
|------|---------|-----------|
| Tier Feature Matrix | v4.1 (locked) | Product |
| X0 Voice Standard | v0.5 / v0.6 | Akira — Diagnostic Content Integrity Lead |
| Brand Master Spec | v1.2 | Brand |
| Pricing Strategy | v1.1 | Pricing |

**Config source of truth:** [`src/config/terminologyReference.ts`](../src/config/terminologyReference.ts)

---

## 1. Product Name

| Term | Form | Rule |
|------|------|------|
| **NEXUS** | Always ALL CAPS | The entity name. Never "the coach", "the AI", "your assistant", "the chatbot", "the bot". |

**Banned entity references:** `the coach`, `the AI`, `your assistant`, `your coach`, `the chatbot`, `the bot` — enforced in [`voiceStandard.ts → BANNED_ENTITY_REFERENCES`](../src/config/voiceStandard.ts).

---

## 2. Tiers (5 user-facing)

Canonical keys + display names from [`tiers.ts`](../src/config/tiers.ts) (supersedes `tierConfig.ts`). Order: `explorer < starter < professional < executive < council`.

| Display Name | Canonical Key | Role | Notes |
|--------------|---------------|------|-------|
| **Explorer** | `explorer` | Entry tier | Marketing alias: "Executive Introduction" (legacy). NEVER "free tier". |
| **Starter** | `starter` | 2nd tier | Earns 2 monthly miles. |
| **Professional** | `professional` | 3rd tier (recommended) | Full catalog. NEVER "Pro" in user-facing copy (internal shorthand only). |
| **Executive** | `executive` | 4th tier | Priority NEXUS, branded PDFs. |
| **Council** | `council` | 5th tier (invite-only) | Cannot self-serve upgrade. CPI flagship access. |

**Build rule:** Tier names never appear in NEXUS chat (platform layer handles upgrade direction). The word "tier" suffix (e.g. "Professional tier") is avoided in chat — use the bare display name.

---

## 3. Assessment Currency — "miles"

| Term | Visibility | Rule |
|------|------------|------|
| **miles** | User-facing (product/UI/chat only) | Lowercase in prose. NOT marketing copy — marketing uses "included assessments" / "premium diagnostics". NEVER "credits", "tokens", "points", "coins". |
| **mile** | User-facing | Singular. "1 mile" not "1 miles". |
| **complimentary** | User-facing | Replaces "free" everywhere. 0-mile assessments + Explorer tokens. |
| **mile pack** | User-facing | Purchasable bundles. NEVER "credit pack", "top-up". |

**Cost tiers** (from [`miles.ts → MILE_COST_TIERS`](../src/config/miles.ts)):

| Tier | Miles | Instruments |
|------|-------|-------------|
| Light | 1 | SPARK |
| Standard | 2 | PRISM, IMPACT, BRIDGE, DRIVE, MOSAIC |
| Signature | 3 | FORGE, LEAP, QUEST |
| Flagship | 5 | CPI |
| — (0 miles) | 0 | COACH (coaching fit, not an assessment) |

---

## 4. Progress Tracking — "milestones"

| Term | Rule |
|------|------|
| **milestones** | Unified across ALL tiers. One word everywhere. Platform handles quantity limits; terminology stays constant. |

**Banned progress terms:** `bookmarks`, `dashboard items`, `tasks`, `todo`, `checklist` — enforced in [`voiceStandard.ts → BANNED_PROGRESS_TERMS`](../src/config/voiceStandard.ts).

---

## 5. Diagnostics (11 instruments)

Canonical descriptors from [`voiceStandard.ts → APPROVED_DIAGNOSTICS`](../src/config/voiceStandard.ts). All codes ALL CAPS.

| Code | Full Name | Miles | Tier | First-Mention Format |
|------|-----------|-------|------|----------------------|
| **SPARK** | AI leadership readiness | 1 | Light | "SPARK — AI leadership readiness" |
| **PRISM** | Professional branding | 2 | Standard | "PRISM — professional branding" |
| **IMPACT** | Board & stakeholder impact | 2 | Standard | "IMPACT — board and stakeholder impact" |
| **BRIDGE** | Cross-cultural relational intelligence | 2 | Standard | "BRIDGE — cross-cultural relational intelligence" |
| **DRIVE** | Motivational alignment | 2 | Standard | "DRIVE — motivational alignment" |
| **MOSAIC** | Institutional trust & relationship velocity | 2 | Standard | "MOSAIC — institutional trust and relationship velocity" |
| **FORGE** | Sales excellence capability | 3 | Signature | "FORGE — sales excellence capability" |
| **LEAP** | Competitive positioning | 3 | Signature | "LEAP — competitive positioning" |
| **QUEST** | Strategic market positioning | 3 | Signature | "QUEST — strategic market positioning" |
| **COACH** | Executive coaching fit | 0 | — | "COACH — executive coaching fit" |
| **CPI** | China Leadership Pipeline Index | 5 | Flagship (Council-only) | "CPI — China Leadership Pipeline Index" |

**Common errors:** wrong capitalization (e.g. "Spark", "prism"), redundant suffix ("SPARK assessment" — "assessment" is implied), "CPI Index" (redundant).

**Explorer onboarding:** LEAP + PRISM granted as one-time complimentary tokens (not miles).

---

## 6. Session / Debrief Terminology

| Term | Format | Rule |
|------|--------|------|
| **30-minute session** | Hyphenated, lowercase "minute" | NEVER "30 min", "30min", "30-min". |
| **45-minute session** | Same | |
| **60-minute session** | Same | NEVER "1 hour session". |
| **90-minute session** | Same | NEVER "1.5 hour session". |
| **debrief** | Lowercase (noun/verb) | Post-assessment review with a coach. NEVER "walkthrough", "review session", "consultation", "read-out", "debriefing". |
| **coach** | Lowercase | Human LYC coach. NEVER refers to NEXUS. Disambiguates from COACH diagnostic by context. |

**Source:** [`src/assessments/catalog.ts`](../src/assessments/catalog.ts) + Pricing Strategy v1.1.

---

## 7. Feature Names

| Term | Visibility | Rule |
|------|------------|------|
| **ensemble mode** | User-facing | Multi-diagnostic synthesis. Lowercase. NEVER "multi-assessment mode", "combined view", "cross-diagnostic dashboard". |
| **document upload** | User-facing | File attachment to NEXUS. NEVER "file upload", "attachment", "document sharing". |
| **persona system** | **Internal only** | The 4 NEXUS personas (Guide, Analyst, Architect, Steward). Members experience NEXUS adapting — never "switching personas". NEVER mention in user-facing copy. |
| **session memory** | User-facing | Cross-conversation continuity. NEVER "chat history", "conversation log", "memory bank". |

---

## 8. Member Terminology

| Term | Replaces | Rule |
|------|----------|------|
| **member** | user, customer, subscriber, client | In product UI. Internal analytics may use "user" for event tracking. |
| **profile** | account, user account, user dashboard | "Create your profile" not "sign up" / "register". |

**Source:** [`brandCompliance.ts → REQUIRED_SUBSTITUTIONS`](../src/config/brandCompliance.ts).

---

## 9. Internal-Only Terms (never user-facing)

| Concept | Internal Term | Detection |
|---------|---------------|-----------|
| Project phases | Phase 0-15 | [`brandGuard.ts → internalFrameworkCheck()`](../src/nexus/brandGuard.ts) |
| Codenames | TRIDENT, MERIDIAN, CANVAS, SHIFT, AKIRA | [`voiceStandard.ts → BANNED_WORDS[codename]`](../src/config/voiceStandard.ts) |
| Structural models | 3D, 3-pillar, 3-fires, three forces, three layers, maturity stack | [`voiceStandard.ts → BANNED_WORDS[internal_arch]`](../src/config/voiceStandard.ts) |
| Quality scoring | 8-dimension model, 3.8/5.0 bar, model_integration | Members never see scores. |
| Conversation modes | persona system (Guide, Analyst, Architect, Steward) | Members never see persona names. |

---

## 10. Tier-Specific Terminology Differences

**Constant across all tiers:** `miles`, `milestones`, `NEXUS`, `complimentary`, 11-instrument catalog names.

| Tier | What Changes |
|------|--------------|
| **Explorer** | LEAP + PRISM as complimentary tokens (not miles). 0 monthly miles. 20 NEXUS msg/day. No branded PDFs. Marketing alias "Executive Introduction". |
| **Starter** | 2 monthly miles. Earns miles. 50 NEXUS msg/day. 3 baselines. |
| **Professional** | 5 monthly miles. Unlimited NEXUS. Full catalog + unlimited retakes. Branded PDFs. "Most Popular". |
| **Executive** | 10 monthly miles. Priority NEXUS. Quarterly workshops. |
| **Council** | 20 monthly miles. Community + live sessions. Dedicated contact. Invite-only. CPI access. |

**Build rule:** Terminology stays constant; platform handles quantity limits. No "bookmarks" at some tiers and "milestones" at others.

---

## 11. Banned Words — Cross-Referenced Index

Three existing sources define `BANNED_WORDS` with different shapes. This table names the authoritative source per enforcement surface. **The full banned word list lives in [`voiceStandard.ts → BANNED_WORDS`](../src/config/voiceStandard.ts)** (most complete); this index does not duplicate it.

| Source | Shape | Authoritative For |
|--------|-------|-------------------|
| [`voiceStandard.ts → BANNED_WORDS`](../src/config/voiceStandard.ts) | `BannedWordEntry[]` | NEXUS chat quality enforcement; full list (canon). Categories: tier_pricing, saas_jargon, hype, ai_bro, codename, internal_arch, tier_name, casual. |
| [`brandCompliance.ts → BANNED_WORDS`](../src/config/brandCompliance.ts) | `Record<string, string>` | Phase 2 surface scanning (assessment hub, login, results, pricing, landing). Pairs with `REQUIRED_SUBSTITUTIONS`. |
| [`brandGuard.ts → BANNED_WORDS`](../src/nexus/brandGuard.ts) | `Map<string, BannedWordEntry>` | NEXUS runtime response gating (`QualityGate.audit`). 7 categories with position tracking. |

**Banned word categories (from Brand Master Spec v1.2 + Voice Standard §6 + §8.3-8.4):**

1. **Tier/pricing language** — `free`, `free trial`, `for free`, `free preview`, `no credit card`, `cancel anytime`, `best value`, `unlimited`
2. **SaaS jargon** — `framework`, `architecture`, `architect`, `taxonomy`, `platform`, `toolset`, `leverage`, `synergy`, `flywheel`, `funnel`, `seamless`, `empower`, `streamline`, `disrupt`
3. **Generic hype** — `revolutionize`, `cutting-edge`, `state-of-the-art`, `world-class`, `game changer`, `next generation`, `awesome`, `amazing`, `incredible`
4. **AI bro language** — `chatbot`, `virtual assistant`, `as an AI`, `as a language model`, `I am an AI`, `my training`, `LLM`, `GPT`
5. **Internal codenames** — `TRIDENT`, `MERIDIAN`, `CANVAS`, `SHIFT`, `AKIRA`
6. **Internal architecture** — `3D`, `3-pillar`, `3-fires`, `three forces`, `three layers`, `maturity stack`
7. **Tier names (in chat)** — `Explorer tier`, `Starter tier`, `Professional tier`, `Executive tier`, `Council tier`
8. **Casual** — `hey`, `cool`, `super`, `boom`, `voila`

For the complete list with suggestions + severity, see [`voiceStandard.ts → BANNED_WORDS`](../src/config/voiceStandard.ts). For the merged/deduplicated cross-reference, see `BANNED_WORDS_CROSS_REFERENCED` in [`terminologyReference.ts`](../src/config/terminologyReference.ts).

---

## 12. NEXUS Naming Rule (non-negotiable)

Every user-facing surface — chat, UI, emails, error messages, marketing — uses **NEXUS** as the entity name.

- **Never:** "the coach", "the AI", "your assistant", "your coach", "the chatbot", "the bot"
- **Never:** self-identification as AI ("as an AI", "I'm a language model")
- **Never:** apologies for existing ("I'm sorry, as an AI...")
- **Always:** "NEXUS can...", "Ask NEXUS...", "NEXUS will..."

**Enforcement:** [`brandGuard.ts → signatureBlockEnforcer()`](../src/nexus/brandGuard.ts) + [`voiceStandard.ts → ENTITY_NAME / BANNED_ENTITY_REFERENCES`](../src/config/voiceStandard.ts).

---

## Lookup Helpers (programmatic)

```typescript
import {
  getTerminology,           // term → TerminologyEntry | null
  getTerminologyByCategory, // category → TerminologyEntry[]
  getUserFacingTerms,       // → all user-facing entries
  getInternalOnlyTerms,     // → all internal-only entries
  getTierTerminologyDelta,  // tier → TierTerminologyDelta | null
  verifyCanonicalTerm,      // term → { ok, reason, canonical? }
  BANNED_WORDS_CROSS_REFERENCED,
  TERMINOLOGY_REFERENCE_SUMMARY,
} from '@/config/terminologyReference';
```

---

## Acceptance

- [x] All approved terms documented with correct spelling, capitalization, usage context
- [x] All banned words cross-referenced from Brand Master v1.2 + Voice Standard §6 + §8.3-8.4
- [x] Tier-specific terminology differences mapped (what changes vs. what stays constant)
- [x] User-facing vs. internal-only mapping for every concept
- [x] One term = one concept (no synonyms)
- [x] NEXUS naming rule documented
- [x] Single source of truth — all batches reference this file; no batch defines its own terms
