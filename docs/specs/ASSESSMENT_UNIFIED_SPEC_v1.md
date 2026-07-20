# Unified Assessment Specification v1.0

**Status:** DECISIONS LOCKED — Kevin 2026-07-20  
**Decision:** A+B Combined — Conversational Force Exposure Assessment  
**Replaces:** All existing CPD code (`AssessmentWizard.tsx`, `assessmentEngine.ts`)

---

## 1. Design Principles (from Kevin's A+B Decision)

| Principle | Source | Meaning |
|---|---|---|
| Three Forces framework | FEA Spec (Notion C1.22) | Content measures exposure to: China going global, AI dissolving capabilities, Org tempo vs market tempo |
| Conversational delivery | Content Integration Spec | Nexus weaves questions into natural dialogue — NOT a wizard, NOT a test |
| Framework invisibility | Content Integration Spec | User never sees "Three Forces", "FEA", dimension names, or scoring mechanics |
| Credit-gated | Master Spec §2.5 | Assessments cost credits. Nexus orients users toward taking them |
| Diagnostic routing | FEA Spec | Output routes users to SHIFT, MOSAIC, or BRIDGE based on force profile |

---

## 2. Architecture Decisions (Kevin 2026-07-20)

### Decision 1: Unified Engine
**All B2C diagnostics share ONE unified assessment engine.** TRIDENT stays independent (B2B search scoring only).

The unified engine provides:
- Session management (create, resume, timeout, concurrent-block)
- Question delivery (conversation-wrapped, framework-invisible)
- Scoring pipeline (raw answers → dimension scores → pattern classification → narrative output)
- Credit deduction (integrated with `creditService`)
- Report generation (narrative + radar chart, per diagnostic)
- Diagnostic routing (FEA results → recommend SHIFT/MOSAIC/BRIDGE)

### Decision 2: Question Banks — Import As-Is
**Import Notion question banks as-is, add conversational wrapper layer.**

- Do NOT rewrite question content
- Import full question text, answer scales, and scoring mappings from Notion
- Wrap each question in Nexus conversational context (intro, follow-up, transitions)
- Question banks are the canonical source; the wrapper is the delivery layer
- **Version conflicts resolved:** Use the LATEST version for DRIVE, IMPACT, PRISM
  - DRIVE → `8d64b8a3-c399-4d0f-a79b-a40143abf426` (v2)
  - IMPACT → `40e0ae46-a9df-4286-b3c2-b8cf2cf9efb9` (v2)
  - PRISM → `d142f44a-816d-423e-a323-2f0e55e1c28d` (v2)
- **Blocker:** Notion API currently returns 0 blocks for all diagnostic pages. Kevin needs to share pages with N8N integration, or we extract via alternative method.

### Decision 3: Dual-Mode Diagnostics
**QUEST, DRIVE, LEAP, IMPACT = BOTH standalone products AND SHIFT sub-components.**

| Mode | Context | Pricing | Entry |
|---|---|---|---|
| **Standalone** | User takes the full diagnostic independently | $500–2,000 per Master Spec §2.5 | Nexus conversation → credit deduction → full question set → full report |
| **SHIFT sub-component** | User takes SHIFT Composite, which includes sub-diagnostics | Included in SHIFT Composite price | SHIFT wizard routes to sub-components, aggregates results |

This means each of the 4 diagnostics needs:
- A standalone question set + scoring + report (full version)
- A SHIFT-compatible subset/interface (when called as part of SHIFT Composite)
- Separate pricing and credit allocation per mode

### Decision 4: Version Authority
Latest version wins. See Decision 2 for specific page IDs.

---

## 3. Assessment Entry Points

### 3.1 Micro Quiz (Free Entry)
- **6–9 questions**, ~60 seconds
- Conversational — Nexus asks naturally
- Measures high-level force exposure (3 forces, 2-3 questions each)
- **Output:** Pattern classification + teaser + diagnostic recommendation
- **Purpose:** Lead capture, engagement, demonstrate Nexus value
- **Credit cost:** FREE (lead magnet)
- **Patterns:**
  - Triple High → Recommend full FEA
  - F1/F2/F3 Dominant → Recommend specific diagnostic (BRIDGE / SPARK / SHIFT)
  - Balanced Moderate → Recommend SHIFT Composite
  - Low Exposure → Recommend PRISM or FORGE for growth

### 3.2 Full Assessment (FEA — Paid)
- **36 questions** (12 per force), ~10-15 minutes
- Conversational — Nexus weaves into deeper dialogue
- **Output:** Full force exposure map + narrative + diagnostic routing
- **Credit cost:** Per tier pricing (Master Spec §2.5)
- Routes to: SHIFT, MOSAIC, BRIDGE based on dominant force

### 3.3 Standalone Diagnostics (Paid)
- Each diagnostic (BRIDGE, MOSAIC, PRISM, FORGE, SPARK, QUEST, DRIVE, LEAP, IMPACT) available independently
- Full question bank from Notion (imported as-is)
- Full report generation
- Credit cost per Master Spec pricing
- Nexus guides user to the right diagnostic based on FEA results + conversation context

### 3.4 SHIFT Composite (Paid)
- Aggregates LEAP + QUEST + DRIVE + COACH + IMPACT
- User can take all 5 or select subset
- Results aggregated into composite leadership profile
- Credit cost: premium tier

---

## 4. Unified Engine — Technical Requirements

### 4.1 Data Model
```typescript
// Unified diagnostic definition
interface DiagnosticDefinition {
  id: string;                    // 'FEA' | 'SHIFT' | 'BRIDGE' | 'MOSAIC' | etc.
  name: string;                  // Internal name (never shown to user)
  displayName: string;           // What Nexus calls it in conversation
  questionBankId: string;        // Reference to imported Notion question bank
  dimensions: DimensionDef[];
  scoring: ScoringConfig;
  outputTemplate: string;        // Report template reference
  creditCost: number;
  isStandalone: boolean;         // Can be taken independently
  isShiftComponent: boolean;     // Part of SHIFT Composite
  shiftSubType?: ShiftSubType;   // If SHIFT component, which one
  routingTarget?: string[];      // If entry diagnostic, what it routes to
}

// Unified session
interface AssessmentSession {
  id: string;
  userId: string;
  diagnosticId: string;
  status: 'active' | 'completed' | 'expired' | 'abandoned';
  currentQuestionIndex: number;
  answers: Answer[];
  conversationContext: any;      // Nexus dialogue state
  creditsCharged: boolean;
  createdAt: Date;
  expiresAt: Date;               // 60-min timeout
  resultId?: string;             // Link to generated report
}
```

### 4.2 Question Delivery
- Questions served through Nexus conversation layer
- Each question wrapped in natural dialogue context
- No progress bars, no step numbers, no dimension names visible
- Nexus adapts follow-up questions based on previous answers
- Session auto-saved server-side (resume within 60 min)
- Concurrent assessment blocked (one active session per user per diagnostic)

### 4.3 Scoring Pipeline
```
Raw answers → Dimension scores (normalized 0-100)
            → Pattern classification
            → Narrative generation (via DeepSeek API)
            → Radar chart data
            → Diagnostic routing recommendation
            → Report assembly
```

### 4.4 Credit Integration
- Credit check BEFORE starting assessment
- Credit deduction on assessment start (not completion — prevents abuse)
- Micro Quiz: FREE (no credit check)
- Full FEA / Standalone diagnostics: Deduct per diagnostic's `creditCost`
- SHIFT Composite: Deduct composite price (includes all sub-components)
- Refund policy: No refund on abandonment (credits consumed on start)

---

## 5. Diagnostic Catalog (Unified)

| # | Diagnostic | Standalone? | SHIFT Component? | Credit Cost | Notion QB Source | Priority |
|---|---|---|---|---|---|---|
| 1 | **FEA** | ✅ (free micro + paid full) | ❌ | Free / Tier 2 | `39bfafae-51be-81f6` | **P0 — BUILD FIRST** |
| 2 | **SHIFT Composite** | ✅ | N/A (is the composite) | Tier 3 | Aggregates 5 sub-types | P0 |
| 3 | **SHIFT-LEAP** | ✅ | ✅ (sub of SHIFT) | Tier 2 / incl. | `bea984b4-0c50` | P1 |
| 4 | **SHIFT-QUEST** | ✅ | ✅ (sub of SHIFT) | Tier 2 / incl. | `c1fe201f-f104` | P1 |
| 5 | **SHIFT-DRIVE** | ✅ | ✅ (sub of SHIFT) | Tier 2 / incl. | `8d64b8a3-c399` (v2) | P1 |
| 6 | **SHIFT-COACH** | ✅ | ✅ (sub of SHIFT) | Tier 2 / incl. | `39bfafae-51be-8169` | P1 |
| 7 | **SHIFT-IMPACT** | ✅ | ✅ (sub of SHIFT) | Tier 2 / incl. | `40e0ae46-a9df` (v2) | P1 |
| 8 | **BRIDGE** | ✅ | ❌ | Tier 2 | `39bfafae-51be-8186-89c3` | P1 (Aug launch) |
| 9 | **MOSAIC** | ✅ | ❌ | Tier 2 | `39bfafae-51be-81be` | P1 (Sep launch) |
| 10 | **PRISM** | ✅ | ❌ | Tier 2 | `d142f44a-816d` (v2) | P2 |
| 11 | **FORGE** | ✅ | ❌ | Tier 2 | `39bfafae-51be-816f` | P2 (Nov launch) |
| 12 | **SPARK** | ✅ | ❌ | Tier 2 | `39bfafae-51be-816c` | P2 (Oct launch) |
| 13 | **TRIDENT** | ❌ (B2B only) | ❌ | N/A | `39bfafae-51be-817b` | ✅ Already works |

---

## 6. What Must NOT Exist (Anti-Patterns)

- ❌ Multi-step wizard with progress bar
- ❌ Dimension names visible to user
- ❌ Numeric scores displayed raw (use narrative + visual radar)
- ❌ PDF download button (report rendered in-app, shared via Nexus)
- ❌ Anonymous dead ends (every path leads to Nexus conversation continuation)
- ❌ Separate codebase per diagnostic (unified engine handles all)
- ❌ Mock/fake question banks (real Notion content only)

---

## 7. Build Order

1. **Unified engine core** — session management, question delivery, scoring pipeline, credit integration
2. **FEA** — import question bank, build conversational wrapper, micro quiz + full assessment
3. **SHIFT Composite** — refactor existing `SHIFTAssessmentWizard.tsx` into unified engine, connect sub-diagnostics
4. **BRIDGE** — first standalone diagnostic (Aug 2026 content calendar)
5. **Remaining standalone diagnostics** — MOSAIC, SPARK, FORGE, PRISM per content calendar
6. **Diagnostic routing** — Nexus recommends based on FEA results + conversation context
7. **Report generation** — narrative + radar chart for each diagnostic

---

## 8. Blockers

1. **Notion API access** — All diagnostic page content returns 0 blocks. Kevin must share pages with N8N integration.
2. **Stripe env vars** — Credit pricing requires Stripe price IDs configured in Vercel.
3. **DeepSeek API model name** — `deepseek-v4-flash` alias deprecated July 24. Must verify before build.

---

*Spec v1.0 — Locked per Kevin's decisions 2026-07-20. Any changes require Kevin's explicit approval.*
