# LYC Intelligence — Phase 1 PRD: Fix + Core Launch

**Target:** Ship a career intelligence platform that real users can use on their phone.  
**Non-goal:** ATS features, internal pipeline, consultant dashboards (Phase 4).  
**Non-goal:** Stripe, pricing pages, credit-gating UI (Phase 2).  

---

## 0. Product Identity

LYC Intelligence is a **career intelligence platform** for senior professionals navigating cross-border leadership transitions. It is not an ATS, not a job board, not a chatbot wrapper.

Every surface must feel like the user is receiving intelligence about **their own career** — not being sold to, not being processed through a funnel. The product earns trust by delivering value first.

---

## 1. Design & Brand Rules (LOCKED — Do Not Touch)

| Rule | Value |
|------|-------|
| Background | `#0A0A0A` — dark only, no light mode |
| Text | `#E5E5E5` body, `#FFFFFF` headings |
| Accent | `#C108AB` — **CTAs only**, never decorative |
| Headings | `Georgia, serif` |
| Body | `Inter, system-ui, sans-serif` |
| Touch targets | Minimum 44px |
| Viewport | Mobile-first. Every page must be usable at 375px width |

### Prohibited:
- ❌ TRIDENT, LENS, METRIX, PHI, D3 Framework — any proprietary IP names
- ❌ Pricing anywhere on the site
- ❌ Emojis in UI
- ❌ White/light backgrounds
- ❌ Motivational-speaker tone
- ❌ Mentioning Notion, Supabase, DeepSeek, or any backend infrastructure

### Naming Map (internal name → user-facing label):
| Internal | User-Facing |
|----------|------------|
| TRIDENT Match | **Score Match** |
| LENS | **Full Report** |
| METRIX | **Analytics** (Phase 2) |
| PHI / SHIFT | **Career Assessment** |
| D3 Framework | ❌ Never shown |
| Nexus | **Nexus** (exception — allowed) |

---

## 2. Navigation Map (Phase 1)

```
/             → Landing (sign in / sign up)
/b2b          → For Firms — Score Match demo entry
/b2c          → For Leaders — Career Assessment entry
/nexus        → Nexus AI chat (the front door)
/assessment   → Career Assessment: multi-step wizard
/match        → Score Match: JD-CV matching engine
```

**Locked for Phase 1:** `/platform/*`, `/dashboard`, `/pipeline`, `/candidates` — do not modify.

---

## 3. Pre-Launch Blockers

These must be fixed before anyone sees the site. In priority order.

---

### BLOCKER-1: Nexus Chat Markdown Rendering

**Why:** Tables, lists, and formatted content are broken. This destroys credibility when users ask for comparison tables, pros/cons, or career roadmaps.

**What to change:**

| File | Action |
|------|--------|
| `src/components/nexus/MessageBubble.tsx` | Replace custom text renderer with `react-markdown` + `remark-gfm` |
| `tailwind.config.js` | Add `@tailwindcss/typography` plugin |
| `package.json` | Install `react-markdown`, `remark-gfm`, `@tailwindcss/typography` |

**Implementation details:**

```tsx
// In MessageBubble.tsx, replace the content renderer with:
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const customComponents = {
  table: ({ children }) => (
    <div style={{ overflowX: 'auto', margin: '8px 0' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #222222' }}>
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th style={{ border: '1px solid #222222', padding: '8px 12px', fontWeight: 700, color: '#E5E5E5', background: '#1A1A1A', fontSize: '12px', textAlign: 'left' }}>
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td style={{ border: '1px solid #222222', padding: '8px 12px', color: '#CCCCCC', fontSize: '13px' }}>
      {children}
    </td>
  ),
  code: ({ inline, children }) => {
    if (inline) return <code style={{ background: '#1A1A1A', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', color: '#C108AB' }}>{children}</code>;
    return <pre style={{ background: '#111111', padding: '12px', borderRadius: '8px', overflowX: 'auto', fontSize: '12px', color: '#CCCCCC' }}><code>{children}</code></pre>;
  },
  ul: ({ children }) => <ul style={{ paddingLeft: '20px', color: '#CCCCCC', fontSize: '13px', lineHeight: 1.6 }}>{children}</ul>,
  ol: ({ children }) => <ol style={{ paddingLeft: '20px', color: '#CCCCCC', fontSize: '13px', lineHeight: 1.6 }}>{children}</ol>,
  a: ({ href, children }) => <a href={href} style={{ color: '#C108AB', textDecoration: 'underline' }}>{children}</a>,
  p: ({ children }) => <p style={{ margin: '4px 0', fontSize: '13px', lineHeight: 1.6 }}>{children}</p>,
  strong: ({ children }) => <strong style={{ color: '#FFFFFF', fontWeight: 600 }}>{children}</strong>,
  h3: ({ children }) => <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '15px', fontWeight: 600, color: '#FFFFFF', margin: '12px 0 4px' }}>{children}</h3>,
  h4: ({ children }) => <h4 style={{ fontFamily: 'Georgia, serif', fontSize: '14px', fontWeight: 600, color: '#FFFFFF', margin: '10px 0 4px' }}>{children}</h4>,
};

// Usage:
<ReactMarkdown remarkPlugins={[remarkGfm]} components={customComponents}>
  {content}
</ReactMarkdown>
```

**Acceptance criteria:**
- [ ] Tables render with borders, dark headers, alternating row backgrounds
- [ ] Ordered and unordered lists render with proper indentation and spacing
- [ ] Code blocks render with dark background, inline code in accent color
- [ ] Bold, italic, links render correctly
- [ ] No horizontal overflow on 375px viewport
- [ ] All custom components use inline styles (no Tailwind prose classes — avoids bleed)

---

### BLOCKER-2: Career Assessment — Full Multi-Step Wizard Rebuild

**Why:** The assessment page has zero interactivity. No clickable ratings, no style selector, no progress indicator. It is the core B2C value delivery. Without it, there is nothing to offer individual leaders.

**What to change:**

| File | Action |
|------|--------|
| `src/pages/AssessmentPage.tsx` | Complete rewrite into 4-step wizard component |
| `src/assessments/catalog.ts` | Update all dimension names/descriptions to user-facing language; remove internal IP labels |
| `src/services/assessmentEngine.ts` | Add `calculateAssessmentScore(ratings, style)` |

**Step flow:**

```
Step 1: Email Gate
  → "Start your free career assessment"
  → Email input + "Begin" button
  → Save to Supabase b2c_leads (source: 'assessment_gate')
  → Proceed to Step 2

Step 2: Self-Rating (5 dimensions, one at a time on mobile)
  → Dimension name (large, Georgia)
  → One-sentence description
  → 5 clickable rating buttons: 1 (Low) to 5 (High)
  → Each button shows short label on selection
  → "Next" button appears after selection
  → Progress: "2 of 5" dot indicators

Step 3: Style Selector
  → "How do you prefer insights to be delivered?"
  → 4 cards in a 2x2 grid (stacks to 1-col on mobile):
    - Analytical: Data-driven, structured, evidence-based
    - Visionary: Big-picture, future-focused, strategic
    - Pragmatic: Practical, actionable, straightforward
    - Empathetic: Personal, developmental, supportive
  → Single selection, visual highlight on chosen card
  → "See My Results" button

Step 4: Results
  → Score display (large number, 0-100)
  → Archetype label and one-paragraph description
  → Horizontal bar chart: 5 dimensions with filled bars
  → "Download Report" button (generates PDF)
  → "Talk to Nexus" button → opens /nexus
```

**Design spec for each step:**

All cards use `background: #111111, border: 1px solid #222222, border-radius: 12px, padding: 20px`.

Rating buttons: `width: 48px, height: 48px, border-radius: 50%`. Unselected: `border: 1px solid #333333, color: #888888`. Selected: `background: #C108AB, color: #FFFFFF, border: none`. Touch target: 48px minimum.

Style cards: `min-height: 120px`. Unselected: `border: 1px solid #222222`. Selected: `border: 2px solid #C108AB, background: rgba(193,8,171,0.08)`.

Progress bar: horizontal dots connected by lines. Active = `#C108AB`, completed = `#C108AB`, pending = `#333333`.

PDF export: use `html2canvas` + `jspdf` (already in package.json). Dark theme report: `#0A0A0A` bg, `#E5E5E5` text, `#C108AB` accent.

**Acceptance criteria:**
- [ ] Email gate validates format before proceeding
- [ ] Each of 5 dimensions shows name, description, 5 clickable rating buttons
- [ ] Selected button has clear visual state (accent fill)
- [ ] User cannot proceed without rating all 5 dimensions
- [ ] Style selector shows 4 cards, one must be selected
- [ ] Progress indicator updates correctly across 4 steps
- [ ] Results show composite score, archetype, dimension breakdown
- [ ] "Download Report" generates a dark-themed PDF
- [ ] Every step works at 375px viewport width
- [ ] No proprietary IP names anywhere in the UI
- [ ] All buttons have 44px+ touch targets

---

### BLOCKER-3: Landing Pages — Lead Capture + Clean Messaging

**Why:** Both landing pages currently have no lead capture mechanism. The hero copy references internal IP and has "why we're better" comparison language. Replace with benefit statements focused on the user.

**What to change:**

#### B2B Landing (`/b2b`):

| File | Action |
|------|--------|
| `src/pages/B2BLanding.tsx` | Rewrite hero copy, add lead form, rename all TRIDENT references to "Score Match" |

**New hero copy:**
```
Headline: Find Your Next C-Suite Leader in Hours, Not Months

Subhead: Paste a job description, add candidate profiles, and get instant
3-dimensional match scores. See who fits before you schedule the first call.
```

**Lead capture form** (reuses existing `LeadCaptureForm` component):
- Fields: Name, Work Email, Company
- On submit: save to Supabase, redirect to `/match?email=<encoded>`
- Flow prop: `"b2b"`

**Replace all "TRIDENT" text** with "Score Match" or "Match Engine."

**Remove the "TRIDENT 3D Scoring Model" section heading** — replace with "How Scoring Works."

**Remove the "Verdict mapping" text** showing T1/T2/T3 — show only user-facing labels: Strong Fit, Good Fit, Potential Fit.

#### B2C Landing (`/b2c`):

| File | Action |
|------|--------|
| `src/pages/B2CLanding.tsx` | Rewrite hero copy, add lead form |

**New hero copy:**
```
Headline: Where Do You Stand as a Cross-Border Leader?

Subhead: A 10-minute assessment that benchmarks your leadership profile
against European and Asian executive markets. Discover your archetype,
understand your positioning, and find the opportunities that match.
```

**Lead capture form:**
- Fields: Name, Email
- On submit: save to Supabase, redirect to `/assessment?email=<encoded>`
- Flow prop: `"b2c"`

**Remove the "TRIDENT Score" feature card** — replace with "Career Benchmark."

**Acceptance criteria:**
- [ ] B2B form submits → data saved → user lands on `/match`
- [ ] B2C form submits → data saved → user lands on `/assessment`
- [ ] Invalid emails show inline error (no alert())
- [ ] No IP names (TRIDENT, LENS, METRIX, PHI, D3) anywhere on either page
- [ ] No pricing visible
- [ ] No "why we're better than X" comparison language
- [ ] Dark theme consistent throughout
- [ ] Forms work at 375px width

---

### BLOCKER-4: Score Match Engine — Rename + UX Polish

**Why:** The matching engine works but references "TRIDENT" throughout and the UI needs mobile-first layout.

**What to change:**

| File | Action |
|------|--------|
| `src/pages/MatchPage.tsx` | Rename all TRIDENT references, fix mobile layout |
| `src/services/tridentScoring.ts` | No UI changes needed (backend/internal) |
| `src/components/trident/` | Rename directory and update imports |

**Required renames:**
- Page title: "TRIDENT Match" → "Score Match"
- "Run TRIDENT Sweep" button → "Run Match"
- "TRIDENT Results" → "Match Results"
- "TRIDENT 3D Scoring Model" → "How Scoring Works"
- Dimension labels: Keep as D1/D2/D3 on the scoring page, but label them:
  - D1 → Experience & Impact
  - D2 → Skills & Expertise
  - D3 → Leadership Fit
- Verdict labels:
  - Strong Fit (not "Strong Primary T1")
  - Good Fit (not "Strong Secondary T2")
  - Potential Fit (not "Reserve T3")

**Mobile layout:**
- JD textarea and candidate inputs stack vertically (not side-by-side)
- Score cards stack vertically
- Expanded detail cards use full width
- Buttons full-width on mobile

**Existing document upload feature must be preserved** — file upload buttons for JD and CV files must continue to work.

**Directory rename:**
- `src/components/trident/` → `src/components/match/`
- Update all imports in MatchPage.tsx

**Acceptance criteria:**
- [ ] No "TRIDENT" text visible anywhere in the UI
- [ ] Score results show user-facing labels only (Strong Fit / Good Fit / Potential Fit)
- [ ] Mobile layout: all elements stack vertically at 375px
- [ ] Document upload (JD + CV) still works
- [ ] Dark theme consistent

---

### BLOCKER-5: Nexus Chat — System Prompt + Quick Actions Rewrite

**Why:** The system prompt and quick-action buttons reference internal IP and the D3 Framework. The tone should put the user at the center.

**What to change:**

| File | Action |
|------|--------|
| `api/chat.ts` | Rewrite system prompt to remove all internal IP references |
| `src/components/nexus/SuggestedPrompts.tsx` | Update suggested prompts |
| `src/pages/NexusLanding.tsx` | Update hero text |

**New system prompt:**
```
You are Nexus, the career intelligence assistant. You help senior professionals
understand their career positioning, navigate cross-border leadership transitions,
and make informed decisions about their next move.

YOUR KNOWLEDGE: Cross-border executive transitions between European and Asian
markets, how boards evaluate C-suite candidates, what separates leaders who land
top roles, executive presence, board readiness, interview preparation, and
negotiation strategy.

YOUR TONE: Direct, honest, specific to real market dynamics. Like a trusted
senior advisor. Never use motivational-speaker language.

CAPABILITIES YOU CAN OFFER:
- Career Assessment: A 10-minute self-assessment that benchmarks leadership
  profile against European and Asian executive markets
- Score Match: AI-powered JD-CV matching that scores candidates across
  experience, skills, and organizational fit
- Leadership insights: Market-specific guidance on positioning, transitions,
  and career strategy

LEAD CAPTURE RULE: After your third response to an unauthenticated user, work in:
"To save this conversation and get your personalized career brief, what's your
email address?"

NEVER MENTION: Internal frameworks, scoring weights, backend systems, or any
company IP. This includes: TRIDENT, LENS, METRIX, PHI, D3 Framework, Notion,
Supabase, DeepSeek, Coze, pipeline stages (SWEEP, CANVA, etc.)
```

**New suggested prompts:**
```typescript
const defaultPrompts = [
  'How do I position myself for a cross-border role?',
  'What makes a strong leadership profile?',
  'How should I prepare for a board interview?',
  'What are firms looking for in C-suite candidates?',
];
```

**Hero text update on NexusLanding.tsx:**
```
Headline: Your Career, Amplified
Subhead: Ask anything about cross-border leadership, career strategy, or
executive positioning. Take a free assessment or run a Score Match.
```

**Acceptance criteria:**
- [ ] System prompt contains zero IP names (TRIDENT, LENS, METRIX, PHI, D3)
- [ ] Quick action buttons use self-explanatory language
- [ ] Hero text is user-centered, not company-centered
- [ ] "What does LYC do?" prompt removed (company-centric)
- [ ] "Tell me about the D3 Framework" prompt removed
- [ ] Lead capture trigger still works after 3rd response

---

### BLOCKER-6: Global — Remove All IP Names from Codebase

**Why:** One-off references to TRIDENT, D3, etc. may exist in components not covered above. A sweep is needed.

**What to check:**

| Search Pattern | Files to Check |
|---------------|---------------|
| "TRIDENT" | All `.tsx`, `.ts`, `.css` files |
| "D3 Framework" | All `.tsx`, `.ts`, `.css` files |
| "LENS" | All `.tsx`, `.ts` files (except imports from lucide-react) |
| "METRIX" | All `.tsx`, `.ts` files |
| "PHI" | All `.tsx`, `.ts` files |
| "SWEEP", "CANVA", "GRID", "PLACED" | All `.tsx`, `.ts` files |
| "T1", "T2", "T3" in UI strings | All `.tsx` files (score labels) |

**Command:** `grep -rn "TRIDENT\|D3 Framework\|METRIX\|PHI scoring\|SWEEP\|CANVA\|GRID" src/ --include="*.tsx" --include="*.ts"`

**Acceptance criteria:**
- [ ] Zero occurrences of TRIDENT, LENS, METRIX, PHI in any user-facing string
- [ ] Zero occurrences of D3 Framework anywhere
- [ ] Zero occurrences of SWEEP, CANVA, GRID, LENS, PLACED in any user-facing string
- [ ] T1/T2/T3 replaced with Strong Fit / Good Fit / Potential Fit in UI
- [ ] Internal files (services, API routes) may keep internal names if they never reach the user

---

### BLOCKER-7: Mobile-First Responsiveness — Global Pass

**Why:** Primary traffic source is LinkedIn on phone. Pages must be fully usable at 375px width.

**What to change:**

| File | What to Fix |
|------|------------|
| `src/index.css` | Ensure body has no horizontal overflow |
| All landing pages | Grid layouts must collapse to single column at < 768px |
| `src/pages/MatchPage.tsx` | JD + candidate panels stack vertically |
| `src/pages/AssessmentPage.tsx` | Rating buttons fit 5 across on 375px |
| `src/components/nexus/NexusChat.tsx` | Chat input bar fits on one line at 375px |

**Design rules:**
- All grid layouts: `grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))`
- No fixed widths > 375px on any container
- All interactive elements ≥ 44px touch target
- Font sizes ≥ 13px for body, ≥ 24px for mobile headlines
- Horizontal padding: 16px minimum on all containers

**Acceptance criteria:**
- [ ] Every Phase 1 route renders without horizontal scroll at 375px
- [ ] All buttons and inputs have ≥ 44px touch targets
- [ ] Text is readable without zooming
- [ ] Forms are fully usable on mobile
- [ ] Chat input and send button fit on one row

---

## 4. Week 2 Polish

These are important but do not block the initial launch. Do them after the site is live.

---

### POLISH-1: PDF Export — Career Assessment Report

**Why:** Users expect to download their assessment results. The PDF must look professional and match the dark theme.

**What to change:**

| File | Action |
|------|--------|
| `src/services/reportGenerator.ts` | Refine PDF template with dark theme styling |
| `src/components/assessment/` | Add PdfExport component |

**Acceptance criteria:**
- [ ] PDF has dark background (#0A0A0A), light text (#E5E5E5), accent headers (#C108AB)
- [ ] Includes: user name, date, composite score, dimension breakdown, archetype
- [ ] No raw scores or weights visible
- [ ] LYC Partners branding (logo if available, or "LYC Intelligence" text mark)
- [ ] Single page, well-formatted

---

### POLISH-2: Nexus Chat — Document Upload Polish

**Why:** The document upload feature was added but needs UX improvements.

**What to change:**

| File | Action |
|------|--------|
| `src/components/nexus/NexusChat.tsx` | Add upload progress feedback, accepted file types hint, clear uploaded document state |

**Acceptance criteria:**
- [ ] User sees file name after upload before sending
- [ ] "Remove" option on uploaded document
- [ ] Clear visual state during upload (spinner on paperclip button)
- [ ] Error message if file type unsupported or too large (>10MB)

---

### POLISH-3: Landing Page — Empty State / Demo

**Why:** Instead of telling users what the product does, let them experience it. Add a lightweight interactive element.

**What to change:**

| File | Action |
|------|--------|
| `src/pages/B2BLanding.tsx` | Add a "See it in action" section with a sample scored candidate card |
| `src/pages/B2CLanding.tsx` | Add a sample assessment archetype card |

**Acceptance criteria:**
- [ ] B2B page shows a static sample match card (not functional, just visual)
- [ ] B2C page shows a static sample archetype result
- [ ] Both use real-looking data, not lorem ipsum
- [ ] Dark theme, no IP names

---

### POLISH-4: Navigation Consistency

**Why:** Navigation links differ between pages. The nav bar should be consistent.

**What to change:**

| File | Action |
|------|--------|
| `src/components/layout/` | Create a shared `PublicNav` component |
| All landing pages | Replace inline nav with shared component |

**Nav links (Phase 1):**
```
LYC Intelligence (logo/home)  |  For Leaders  |  For Firms  |  Nexus AI  |  Sign In
```

**Acceptance criteria:**
- [ ] Same nav bar on `/`, `/b2b`, `/b2c`, `/nexus`, `/match`, `/assessment`
- [ ] Current page highlighted (subtle underline or color change)
- [ ] Mobile: hamburger menu or simplified nav
- [ ] Dark theme

---

### POLISH-5: Error States + Loading States

**Why:** Users hit errors and loading states — they need to know what's happening.

**What to change:**

| File | Action |
|------|--------|
| `src/components/nexus/NexusChat.tsx` | Improve error retry UI, add typing indicator dots |
| `src/pages/MatchPage.tsx` | Add scoring timeout error state |
| `src/pages/AssessmentPage.tsx` | Add loading state for score calculation |

**Acceptance criteria:**
- [ ] Chat: shows animated typing dots while AI responds
- [ ] Chat: retry button after error with clear message
- [ ] Match: progress bar during scoring, timeout message after 60s
- [ ] Assessment: spinner while calculating results
- [ ] All error messages are user-friendly (no "API failed" or "500 error")

---

## 5. Files Map (Phase 1)

```
src/
├── index.css                          # Global styles (dark theme base)
├── App.tsx                            # Routes — Phase 1 routes only
├── pages/
│   ├── Landing.tsx                    # Sign in / sign up
│   ├── B2BLanding.tsx                 # For Firms — lead form + Score Match entry
│   ├── B2CLanding.tsx                 # For Leaders — lead form + assessment entry
│   ├── NexusLanding.tsx               # Nexus AI chat (public front door)
│   ├── AssessmentPage.tsx             # Career Assessment wizard (4 steps)
│   ├── MatchPage.tsx                  # Score Match engine (JD-CV scoring)
│   ├── LoginPage.tsx                  # Auth
│   └── SignupPage.tsx                 # Auth
├── components/
│   ├── nexus/
│   │   ├── NexusChat.tsx              # Chat UI + document upload
│   │   ├── MessageBubble.tsx          # Message renderer (markdown)
│   │   ├── SuggestedPrompts.tsx       # Quick action buttons
│   │   └── EmailCapture.tsx           # Email gate in chat
│   ├── match/                         # Renamed from trident/
│   │   ├── JDInput.tsx                # JD input + file upload
│   │   ├── CandidateList.tsx          # Candidate cards + CV upload
│   │   └── ResultsTable.tsx           # Score results display
│   ├── assessment/
│   │   ├── EmailGate.tsx              # Step 1: email capture
│   │   ├── DimensionCard.tsx          # Step 2: dimension rating
│   │   ├── StyleSelector.tsx          # Step 3: writing style
│   │   ├── ResultPanel.tsx            # Step 4: results display
│   │   ├── ProgressBar.tsx            # Step indicator
│   │   └── PdfExport.tsx              # PDF download button
│   ├── LeadCaptureForm.tsx            # Reusable lead form (b2b/b2c)
│   └── layout/
│       └── PublicNav.tsx              # Shared navigation bar
├── services/
│   ├── tridentScoring.ts              # Scoring logic (internal only)
│   ├── assessmentEngine.ts            # Assessment scoring logic
│   ├── coze.ts                        # AI API integration
│   ├── supabaseApi.ts                 # Supabase client + data helpers
│   └── reportGenerator.ts             # PDF report generation
├── assessments/
│   └── catalog.ts                     # Assessment type definitions
└── stores/
    └── authStore.ts                   # Auth state
```

---

## 6. Pre-Flight Checklist

Before pushing to production, verify:

- [ ] `npm run build` passes with zero errors
- [ ] Every Phase 1 route loads without console errors
- [ ] All pages tested at 375px width (Chrome DevTools mobile view)
- [ ] `grep -rn "TRIDENT\|D3 Framework\|METRIX\|PHI" src/ --include="*.tsx"` returns zero results (or only internal service files)
- [ ] `grep -rn "T1\|T2\|T3" src/ --include="*.tsx"` returns zero results in UI strings
- [ ] No pricing visible on any page
- [ ] Dark theme (#0A0A0A background) on every page
- [ ] All CTA buttons use #C108AB accent, nothing else does
- [ ] Nexus chat renders markdown tables correctly
- [ ] Assessment wizard is fully interactive (all 4 steps)
- [ ] Lead forms submit and save to Supabase
- [ ] Document upload works in both Score Match and Nexus chat
- [ ] Navigation is consistent across all pages

---

## 7. Build & Deploy

```bash
# From /workspace:
npm run build           # Verify zero errors
git add -A
git commit -m "Phase 1: Fix + Core Launch"
git push origin main    # Vercel auto-deploys
```

---

*End of Phase 1 PRD. Each blocker and polish item above is a self-contained engineering ticket. Execute in order: BLOCKER-1 through BLOCKER-7, then POLISH-1 through POLISH-5.*