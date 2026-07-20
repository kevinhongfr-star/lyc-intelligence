# B2C Portal — Page 3 Audit: `/nexus` (NexusPage)

**Audit Date:** 2026-07-20  
**Auditor:** NEXUS  
**Route:** `/nexus` → `NexusPage.tsx` (simple dark-theme chat)  
**Component Lines:** NexusPage.tsx (212), NexusChat.tsx (810), NexusLanding.tsx (6)  
**Related Sub-Components:** CreditGate (155), CareerInsight (154), CouncilUpsell (69), DiagnosticProgressBar (198), MilestoneBanner (200)  
**Backend:** nexusChatHandler.ts (393), nexusPersona.ts (248), coze.ts (53)  
**Score: 4/10**

---

## 1. What This Page Is

`/nexus` is the **primary B2C user-facing Nexus experience** — the conversational AI companion that should be the core product. It's accessible without authentication and is the first thing executives interact with after the landing page.

**Critical discovery:** There are **two completely separate Nexus implementations** in the codebase:

| | NexusPage.tsx (used by `/nexus`) | NexusChat.tsx (NOT used publicly) |
|---|---|---|
| **Theme** | Dark (#0d0a14 bg) | White (#FFFFFF bg) |
| **Auth required** | ❌ No | ✅ Yes (via useAuthStore) |
| **Credit gating** | ❌ None | ✅ CreditGate (5 free → pay) |
| **Session persistence** | ❌ None (state lost on refresh) | ⚠️ localStorage only |
| **API endpoint** | `/api/chat` (generic proxy) | `/api/nexus/chat` (dedicated, streaming) |
| **Diagnostic tracking** | ❌ None | ⚠️ DiagnosticProgressBar (visible) |
| **Milestone tracking** | ❌ None | ⚠️ MilestoneBanner |
| **Markdown rendering** | ✅ ReactMarkdown | ❌ Plain text |
| **Suggested prompts** | Static (4 hardcoded) | Dynamic (4 defaults + context) |
| **CareerInsight** | ❌ No | ✅ Yes |
| **CouncilUpsell** | ❌ No | ✅ Yes |

**The public page uses the simpler, less capable version.** The rich `NexusChat.tsx` component (810 lines with credits, diagnostics, upsells, insights) is imported by `NexusLanding.tsx` — which is **dead code** (never routed to).

---

## 2. Functional Issues

### 🔴 F1: Wrong API Endpoint
NexusPage.tsx calls `sendChatMessage()` from `coze.ts` → hits `/api/chat` (generic chat proxy).  
A dedicated `/api/nexus/chat` endpoint exists with:
- DeepSeek SSE streaming (real-time token delivery)
- Seniority detection from user profile
- Role-based system prompts (admin vs external)
- Runtime config from Supabase
- Rate limiting (30 req/min)

**The public Nexus page uses NONE of this.** It gets a basic non-streaming response with no seniority calibration.

### 🔴 F2: No Auth, No Credit Gate
`/nexus` is completely open. No login required, no credit deduction, no usage limits. Anyone can spam the DeepSeek API indefinitely. The `CreditGate` component exists in NexusChat.tsx but isn't used here.

### 🔴 F3: No Session Persistence
Messages are held in `useState` — lost on page refresh. No Supabase storage, no localStorage, nothing. The NexusChat.tsx at least saves to localStorage.

### 🔴 F4: No Assessment Integration
Zero connection to the assessment/diagnostic system:
- No FEA micro-quiz integration
- No diagnostic routing
- No credit-gated assessment offers
- Nexus can't recommend SHIFT/MOSAIC/BRIDGE

### 🔴 F5: Diagnostic Tags Leak to Users
The `nexusPersona.ts` system prompt instructs DeepSeek to output `[DIAGNOSTIC:COMPLETE]`, `[MILESTONE:GOAL_DEFINED]`, `[CONFIDENTIALITY:APPLIED]` tags. NexusChat.tsx has `stripTagsForDisplay()` — but NexusPage.tsx **does NOT strip them**. Users see raw internal tags in responses.

### 🔴 F6: Diagnostic Progress Bar Violates Content Integration Spec
When diagnostic progress IS shown (in NexusChat.tsx), it displays dimension **names** directly: "Role — Mandate, scope, authority", "Constraint — Budget, timeline, politics". The Content Integration spec is explicit: **"Users never see framework names or scoring dimensions."**

### 🟡 F7: Static Suggested Prompts
4 hardcoded prompts about cross-border leadership. Not context-aware, not personalized, not adaptive based on user behavior or tier.

### 🟡 F8: No Memory System
Master Spec §1.7 requires "3-tier memory system (working/episodic/semantic)" — Nexus "remembers" across sessions. Current implementation: last 10 messages in `useState`, gone on refresh. No episodic memory, no semantic memory, no cross-session context.

### 🟡 F9: No Proactive Nudges
Master Spec requires Nexus to proactively suggest events, roundtables, coaching, diagnostics based on conversation context. Current implementation: purely reactive (user asks → Nexus responds).

---

## 3. Design & UX Issues

### 🔴 D1: Two Competing Design Systems
| | NexusPage.tsx | NexusChat.tsx |
|---|---|---|
| Background | `#0d0a14` (dark purple-black) | `#FFFFFF` (white) |
| Text | `#FFFFFF` (white) | `#000000` (black) |
| Card | `#1a1225` (dark) | `#FFFFFF` (white) |
| Border | `#3a2040` (purple) | `#E5E5E5` (light grey) |

The public page is dark-themed while the rest of the B2C portal (landing, assessment, pricing) appears to be light-themed. Inconsistent brand experience.

### 🟡 D2: Plain Text Responses (No Rich Content)
Despite using ReactMarkdown for rendering, Nexus responses are plain text. No:
- Radar charts (force exposure visualization)
- Insight cards
- Action buttons ("Take the full assessment")
- External links to resources
- Embedded reports or summaries

### 🟡 D3: No Onboarding Flow
First-time visitors see a chat input with 4 suggested prompts. No explanation of:
- What Nexus is
- What it can do
- How the credit system works
- What to expect from the conversation
- How to get the most value

### 🟡 D4: No Visual Identity
Nexus has no avatar, no visual presence, no personality cues beyond text. The only visual indicator is "LYC INTELLIGENCE" in tiny uppercase accent text above the heading. No sense of interacting with a distinctive AI companion.

---

## 4. Architecture Issues

### 🔴 A1: Dead Code — NexusLanding.tsx
`NexusLanding.tsx` imports and renders `NexusChat` — but the route `/nexus` actually loads `NexusPage.tsx`. `NexusLanding.tsx` is never used.

### 🔴 A2: Duplicate Imports in App.tsx
```typescript
// Line 39
const NexusLanding = lazy(() => import('@/pages/NexusPage').then(m => ({ default: m.NexusPage })));
// Line 66
const NexusPage = lazy(() => import('@/pages/NexusPage').then(m => ({ default: m.NexusPage })));
```
Both resolve to the exact same component. `NexusLanding` is a misnomer — it's actually `NexusPage`.

### 🔴 A3: DeepSeek Model Alias Deprecation
Both `nexusChatHandler.ts` and `nexusPersona.ts` default to `deepseek-v4-flash`. This alias is being deprecated July 24, 2026. After that date, all Nexus chat will fail.

### 🟡 A4: No Rate Limiting on Public Endpoint
NexusPage calls `/api/chat` (generic proxy) — not `/api/nexus/chat` which has rate limiting (30 req/min). The public Nexus page has **no rate limiting at all**.

### 🟡 A5: NexusChat's Supabase Dependency
The rich NexusChat.tsx requires Supabase tables (`chat_sessions`, `chat_messages`) — these may not exist or may not be properly migrated. If the team switches `/nexus` to use NexusChat, they need to verify the schema.

---

## 5. Spec Compliance Matrix

| Spec Requirement | Status | Detail |
|---|---|---|
| Conversational AI (Content Integration §L1) | ⚠️ Partial | Chat works but no conversational assessment weaving |
| Frameworks invisible to user | 🔴 FAIL | DiagnosticProgressBar shows dimension names; raw tags leak |
| 3-tier memory system (Master Spec §1.7) | 🔴 FAIL | Only last 10 messages in state, no persistence |
| Proactive nudges | 🔴 FAIL | Purely reactive |
| Diagnostic routing (FEA → SHIFT/MOSAIC/BRIDGE) | 🔴 FAIL | Zero integration |
| Credit-gated (Master Spec §2.5) | 🔴 FAIL | No credit system on public page |
| Seniority calibration (nexusPersona.ts) | 🔴 FAIL | Public page doesn't use the dedicated endpoint |
| Coaching-first approach | ⚠️ Partial | System prompt says coaching-first but no structured coaching flow |
| Confidentiality protocol | 🔴 FAIL | Tags exist but leak to users on public page |
| Quarterly development reviews | 🔴 FAIL | Not implemented |
| Journey intelligence | 🔴 FAIL | Not implemented |
| Peer matching | 🔴 FAIL | Not implemented |
| Content curation (RAG) | 🔴 FAIL | No RAG over LYC content assets |
| Nexus NEVER shows diagnostic names | 🔴 FAIL | DiagnosticProgressBar shows them explicitly |
| Nexus NEVER shows prices | ✅ Pass | No pricing shown |
| Nexus NEVER sells directly | ✅ Pass | No store/shop UI |
| DeepSeek API only (no Coze compute) | ✅ Pass | Uses DeepSeek (but model alias expiring) |

---

## 6. Score Breakdown

| Category | Score | Notes |
|---|---|---|
| **Functionality** | 3/10 | Basic chat works. Nothing else does — no auth, no credits, no memory, no assessments, no routing |
| **Design** | 4/10 | Clean layout, correct fonts, correct accent color. But dark theme inconsistent with rest of portal, no visual identity |
| **UX/Onboarding** | 3/10 | No onboarding, no explanation, no guided experience. Just a chat input |
| **Spec Compliance** | 3/10 | 3/16 spec requirements pass. The page implements ~20% of what Master Spec requires |
| **Code Quality** | 5/10 | Clean React, proper component structure, markdown rendering. But dead code, duplicate imports, wrong API endpoint |
| **Go-Live Readiness** | 4/10 | The chat works and looks presentable. But fundamentally incomplete as a product |

**Overall: 4/10**

---

## 7. Priority Fixes

### Must Fix Before Go-Live
1. **Route `/nexus` to NexusChat.tsx** (or merge the two implementations) — the rich component already exists
2. **Add auth gate** — require signup after 5 free messages
3. **Switch to `/api/nexus/chat`** endpoint — get streaming, seniority detection, rate limiting
4. **Strip diagnostic tags** from displayed responses
5. **Remove DiagnosticProgressBar** or make it invisible (framework names must not be shown)
6. **Add session persistence** — Supabase or at minimum localStorage
7. **Fix DeepSeek model alias** before July 24
8. **Delete NexusLanding.tsx** dead code

### Should Fix
9. **Align theme** — decide dark vs light, make consistent with rest of portal
10. **Add onboarding** — first-time user explanation of Nexus
11. **Connect to credit system** — CreditGate already built, just wire it
12. **Add assessment integration** — Nexus can recommend diagnostics based on conversation
13. **Implement memory system** — at minimum, persist conversation summaries across sessions

### Nice to Have
14. **Proactive nudges** — surface events, coaching, diagnostics based on conversation
15. **Rich response content** — radar charts, insight cards, action buttons
16. **Nexus visual identity** — avatar, personality cues
17. **Content curation (RAG)** — connect to LYC's 120+ annual content assets

---

## 8. What's Actually Good

- The **NexusChat.tsx** component (810 lines) is well-architected — has credits, diagnostics, upsells, insights, milestones, sidebar with session management
- The **backend** (`nexusChatHandler.ts`) is solid — streaming, seniority detection, role-based prompts, rate limiting, runtime config
- The **persona system** (`nexusPersona.ts`) has good coaching-first principles, seniority calibration, confidentiality protocol
- The **credit system** (`creditService.ts` + `CreditGate.tsx`) is functional — daily grants, tier-based allocation, spend tracking
- **Markdown rendering** on NexusPage.tsx is clean — tables, code blocks, headings all styled correctly
- **Zero border-radius** brand rule correctly applied throughout

---

*Next: Page 4 (`/pricing`) — Pricing page audit.*
