# Terminology Reference Specification v1.0

**Status:** APPROVED (Batch 6 P0 Corrective Pass)
**Source:** Akira canon audit + Kevin's locked mile cost table
**TS Implementation:** `src/constants/terminologyReference.ts`

---

## 1. Purpose

Single source of truth for all user-facing and internal terminology in LYC Intelligence. Covers:

- Canonical 11 diagnostics (APPROVED_DIAGNOSTICS)
- Subscription tier keys vs display names
- Banned words (Level 1/2/3 with technical-context exceptions)
- NEXUS positioning line
- Diagnostic vs Assessment usage rules
- User-facing category labels (no internal codenames)

Any marketing copy, UI string, NEXUS chat response, API contract, or batch spec that contradicts this document is **non-canonical** and must be corrected.

---

## 2. Canonical Diagnostics (11)

### 2.1 Instrument Table (Locked)

| Code | Full Name | Short Descriptor | Mile Cost | Category | Internal identity.category |
|------|-----------|-----------------|:---------:|----------|----------------------------|
| **CPI** | China Leadership Pipeline Index | leadership pipeline index | 5 | Flagship | SHIFT |
| **LEAP** | LEAP Career Positioning Diagnostic | career transition readiness | 1 | Career Core | SHIFT |
| **QUEST** | QUEST Executive Leadership Diagnostic | executive leadership profile | 2 | Career Core | SHIFT |
| **IMPACT** | IMPACT Board Effectiveness Diagnostic | board readiness & effectiveness | 2 | Career Core | SHIFT |
| **DRIVE** | DRIVE Motivation & Engagement Diagnostic | motivation & engagement drivers | 2 | Career Core | SHIFT |
| **COACH** | COACH Developmental Leadership Diagnostic | coaching & developmental leadership | 2 | Career Core | SHIFT |
| **PRISM** | PRISM Personal Brand Diagnostic | personal brand & market positioning | 2 | Advisory | CANVAS |
| **BRIDGE** | BRIDGE APAC Mandate Readiness Diagnostic | APAC mandate readiness | 3 | Advisory | TRIDENT |
| **MOSAIC** | MOSAIC Cross-Border Partnership Diagnostic | cross-border partnership navigation | 3 | Advisory | CANVAS |
| **SPARK** | SPARK AI Readiness Diagnostic | executive AI adoption readiness | 3 | Advisory | CANVAS |
| **FORGE** | FORGE Bilateral Operating Context Diagnostic | bilateral operating context readiness | 3 | Advisory | MERIDIAN |

### 2.2 Column Meanings

- **Code** — Short uppercase identifier. Use in URLs, API routes, internal keys, and as a shorthand when the full name has already been introduced.
- **Full Name** — Canonical user-facing name. Use in titles, product cards, headings.
- **Short Descriptor** — 1-8 word tagline. Use in chip labels, tooltips, meta descriptions.
- **Mile Cost** — Locked from Kevin's canon table (see §3). DO NOT CHANGE.
- **Category** — User-facing grouping label. See §2.3.
- **identity.category** — **INTERNAL-ONLY.** These 4 codenames (SHIFT, CANVAS, TRIDENT, MERIDIAN) are project-level identifiers from backend JSON configs. **NEVER surface to users.**

### 2.3 User-Facing Category Labels

Use these three plain-language labels everywhere users see categories:

| Category | User-Facing Label | Must NOT say |
|----------|-------------------|---------------|
| `flagship` | Flagship Diagnostic | CPI Tier, SHIFT Flagship |
| `career_core` | Career Core Diagnostics | SHIFT Suite, SHIFT Battery, SHIFT 5-pack |
| `advisory` | Advisory Diagnostics | CANVAS Products, TRIDENT Suite, MERIDIAN Pack |

---

## 3. Mile Cost Economy (Locked Canon)

### 3.1 Instrument Mile Cost Table

**Authoritative source:** Kevin's locked table. Not negotiable.

| Mile Cost | Tier Label | Instruments |
|:---------:|-----------|-------------|
| 1 mi | Light | LEAP |
| 2 mi | Standard | PRISM, IMPACT, COACH, DRIVE, QUEST |
| 3 mi | Signature | BRIDGE, MOSAIC, SPARK, FORGE |
| 5 mi | Flagship | CPI |

### 3.2 Monthly Allocation

| Tier | Miles / Month |
|------|:-------------:|
| Explorer | 0 |
| Starter | 50 |
| Pro | 150 |
| Executive | 300 |
| Council | 600 |

### 3.3 Earned Per Action

| Action | Miles |
|--------|:-----:|
| Framework exploration with NEXUS | 5 |
| Complete reflection prompt | 3 |
| Engage with content piece | 2 |
| Refer peer who signs up | 25 |
| Assessment completion refund (one-time / instrument) | 10 |
| Participate in workshop | 10 |

### 3.4 Lifecycle Rules

- Subscription miles: **NO** rollover (monthly reset)
- Earned miles: persist indefinitely
- Explorer tier: 0 miles, no earning capability
- One-time completion refund per instrument only

---

## 4. Subscription Tiers

### 4.1 Canonical Tier Names

**P0-7 RULE:** `display_name` is what users see. `tier_key` is the backend database key. Never confuse the two.

| Order | tier_key (backend) | display_name (user-facing) | Monthly Miles |
|:-----:|--------------------|----------------------------|:-------------:|
| 0 | `explorer` | Explorer | 0 |
| 1 | `starter` | Starter | 50 |
| 2 | `professional` | **Pro** | 150 |
| 3 | `executive` | Executive | 300 |
| 4 | `council` | Council | 600 |

**CRITICAL:** The tier with `tier_key = "professional"` has `display_name = "Pro"`. The word "Professional" exists ONLY as the backend key. **Never show users "Professional Plan" or "Professional Tier".** Always "Pro".

### 4.2 Explorer Tier Copy Rule

- **Never say:** "Free tier", "Start for free"
- **Always say:** "Executive Introduction", "Complimentary introduction"

---

## 5. Banned Words

### 5.1 Level 1 (Hard Ban — Product Descriptors)

| Banned Word | Allowed in technical context? | Rationale | Preferred Alternatives |
|-------------|:------------------------------:|-----------|------------------------|
| **platform** | ✅ (architecture, engineering teams, technical docs) | Brand Master v1.2. Dilutes premium positioning and overpromises. **"Executive Intelligence Platform" → ALWAYS replace.** | "Executive Intelligence" (NEXUS positioning), "solution", "service", "product suite" |
| **free** | ❌ | Cheapens the brand. Use Explorer-tier language instead. | "Executive Introduction", "complimentary access" |
| **SHIFT** | ❌ (see §2.2) | Internal project codename. Only in identity.category metadata. | "Career Core diagnostics" |
| **CANVAS** | ❌ | Internal codename. | "Personal Brand diagnostics", "Portfolio diagnostics" |
| **TRIDENT** | ❌ | Internal codename. | "Candidate scoring & ranking" |
| **MERIDIAN** | ❌ | Internal codename. | "Operating Context diagnostics" |

### 5.2 Level 2 (Soft Ban)

| Banned Word | Rationale | Alternatives |
|-------------|-----------|--------------|
| chatbot | NEXUS is explicitly positioned as an executive thinking partner, not a generic Q&A bot. | NEXUS AI, executive intelligence coach, intelligent front door, AI thinking partner |

### 5.3 "Platform" Technical-Context Exception

**OK** (technical — allowed):
- "Our platform engineering team uses Kubernetes"
- "The software platform architecture uses React + Supabase"
- "Platform settings page" (internal config area title)

**NOT OK** (product descriptor — banned):
- ❌ "LYC Intelligence — Executive Intelligence Platform"
- ❌ "Upgrade to our platform today"
- ❌ "The platform delivers 11 assessments"

Use simple heuristic: if you can replace "platform" with "Executive Intelligence" and the sentence still works, it's a product descriptor → **BANNED.**

---

## 6. NEXUS Positioning

### 6.1 Interim Positioning (Until Emily delivers final v2)

| Field | Canonical Copy |
|-------|----------------|
| **Positioning line (titles)** | **Executive Intelligence** |
| **1-sentence descriptor** | NEXUS is the intelligent front door of LYC Intelligence — your private AI executive thinking partner. |
| **What NEXUS is NOT** | Not a chatbot. Not a generic Q&A engine. Not a replacement for human consultants or coaches. |

---

## 7. Diagnostic vs Assessment (P0-5)

### 7.1 The Rule

| Term | Status | Where | Examples |
|------|--------|-------|----------|
| **diagnostic** | **✓ PREFERRED** | User-facing copy by default | "Take the CPI diagnostic", "Browse our diagnostic portfolio", "Diagnostic pages" |
| **diagnostic assessment** | ✓ ALLOWED | User-facing when grammar needs both words | "Complete a diagnostic assessment" (vs awkward "Complete a diagnostic") |
| **assessment** | ⚠ ALLOWED | **Technical / internal only** | `assessmentEngine.ts`, `/api/assessments/run`, `assessment_type` DB column, "assessment completion" status field |

### 7.2 NEVER Use "Assessment" In These User-Facing Places

- Landing page CTAs: ❌ "Start the assessment" → ✓ "Start the diagnostic"
- Navigation: ❌ "Assessments" → ✓ "Diagnostics"
- Pricing pages: ❌ "Assessment pricing" → ✓ "Diagnostic pricing"
- NEXUS chat: ❌ "I'd like to recommend an assessment" → ✓ "I'd like to recommend a diagnostic"
- Catalog titles: ❌ "Assessment Catalog" → ✓ "Diagnostic Portfolio"

### 7.3 Places Where "Assessment" Is Fine

- File names & code identifiers: `assessmentEngine.ts`, `AssessmentWizard.tsx`, `type AssessmentState`
- Backend API routes: `/api/assessments/run`, `/api/assessments/:id`
- Database columns: `assessment_type`, `assessment_completed_at`
- Internal status fields: "assessment completion progress"
- Technical docs: "The assessment engine uses scenario-based scoring"

---

## 8. Acceptance Criteria (Cross-Reference)

This spec directly addresses the following P0 items:

| P0 | Covered In |
|----|-----------|
| P0-1: Internal codenames removed | §2.2, §2.3, §5.1 |
| P0-2: CPI descriptor corrected | §2.1 CPI row |
| P0-3: Mile cost table locked | §3.1 |
| P0-4: "Platform" banned + distinction | §5.1, §5.3, §6.1 |
| P0-5: "Diagnostic" default term | §7.1–7.3 |
| P0-7: "Pro" display name canon | §4.1 |

P0-6 (tier names in chat contexts) is covered in the Cross-Batch Consistency spec.
