# Phase 1.2 — Candidate Portal (Build)

**Status:** DRAFT — Pending Kevin approval  
**Priority:** P0 (completes the candidate journey — currently a dead-end after assessment)  
**Estimated effort:** 3–4 days  
**Dependency:** Phase 1.0 (auth unification)

---

## 1. Problem Statement

Candidates (`icp = 'candidate'`) have a **one-shot experience**: B2C Landing → Assessment → Result (archetype + scores + PDF). After that, there's nothing. The platform offers:

- ❌ No application tracking (can't see which mandates they've been submitted to)
- ❌ No profile persistence (assessment result is downloadable but not saved to a portal)
- ❌ No interview preparation resources
- ❌ No career insights or market data
- ❌ No notification system for status updates
- ❌ No way for candidates to update preferences or availability

**There are no Candidate Portal components in the codebase.** This spec covers building the portal from scratch.

---

## 2. Target State

When a candidate (`icp = 'candidate'`) logs in:
- Redirected to `/candidate` (not `/platform`)
- See a **Candidate Portal** with candidate-specific sidebar
- Can view their assessment results and archetype
- Can track mandates they've been submitted to (by consultants)
- Can update their profile, preferences, and availability
- Can access interview prep materials for active applications
- Can see anonymized market insights relevant to their profile

---

## 3. Detailed Specification

### 3.1. New Components to Build

```
src/components/candidate/
├── CandidatePortal.tsx        # Layout: sidebar + Outlet for candidate routes
├── CandidateDashboard.tsx     # Profile summary, application status, next steps
├── CandidateProfile.tsx       # Edit profile: preferences, availability, goals
├── CandidateApplications.tsx  # List of mandates they've been submitted to
├── CandidateApplicationDetail.tsx  # Single application: status, timeline, prep
├── CandidateAssessments.tsx   # Past assessment results + retake option
├── CandidateInsights.tsx      # Market insights, demand signals for their profile
└── CandidateSettings.tsx      # Notification preferences, privacy settings
```

### 3.2. CandidatePortal Layout

**File:** `src/components/candidate/CandidatePortal.tsx`

```typescript
const CANDIDATE_NAV = [
  { path: '/candidate', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { path: '/candidate/profile', icon: User, label: 'My Profile' },
  { path: '/candidate/applications', icon: Briefcase, label: 'Applications' },
  { path: '/candidate/assessments', icon: BarChart3, label: 'My Assessments' },
  { path: '/candidate/insights', icon: TrendingUp, label: 'Career Insights' },
  { path: '/candidate/settings', icon: Settings, label: 'Settings' },
];
```

### 3.3. Route Integration

**File:** `src/App.tsx`

```typescript
// Lazy-load candidate components
const CandidatePortal = lazy(() => import('@/components/candidate/CandidatePortal'));
const CandidateDashboard = lazy(() => import('@/components/candidate/CandidateDashboard'));
const CandidateProfile = lazy(() => import('@/components/candidate/CandidateProfile'));
const CandidateApplications = lazy(() => import('@/components/candidate/CandidateApplications'));
const CandidateApplicationDetail = lazy(() => import('@/components/candidate/CandidateApplicationDetail'));
const CandidateAssessments = lazy(() => import('@/components/candidate/CandidateAssessments'));
const CandidateInsights = lazy(() => import('@/components/candidate/CandidateInsights'));
const CandidateSettings = lazy(() => import('@/components/candidate/CandidateSettings'));

// Routes
<Route path="/candidate" element={
  <ProtectedRoute>
    <ICPRoute allowedICP="candidate">
      <CandidatePortal />
    </ICPRoute>
  </ProtectedRoute>
}>
  <Route index element={<CandidateDashboard />} />
  <Route path="profile" element={<CandidateProfile />} />
  <Route path="applications" element={<CandidateApplications />} />
  <Route path="applications/:id" element={<CandidateApplicationDetail />} />
  <Route path="assessments" element={<CandidateAssessments />} />
  <Route path="insights" element={<CandidateInsights />} />
  <Route path="settings" element={<CandidateSettings />} />
</Route>
```

### 3.4. Post-Assessment Portal Connection

Currently the B2C assessment flow ends at the result page. Add a prompt:

```
After assessment result:
┌─────────────────────────────────────────────┐
│  Your Leadership Archetype: The Architect    │
│                                              │
│  [Download PDF]  [Create Account to Track]   │
│                                              │
│  → Sign up to see which roles match you     │
└─────────────────────────────────────────────┘
```

"Create Account to Track" → signup flow with `icp = 'candidate'` → redirect to `/candidate`.

---

## 4. Component Specifications

### 4.1. CandidateDashboard

**Purpose:** At-a-glance view of candidacy status.

**Sections:**
- **Profile Summary** — archetype, scores, top strengths (from latest assessment)
- **Active Applications** — count and list of mandates where they're in pipeline
- **Status Banner** — "You're in 2 active searches" or "No active applications yet"
- **Next Steps** — contextual guidance (complete profile, prepare for interview, etc.)

**Data sources:**
- `assessments` (candidate's own assessments, filtered by `auth.uid()`)
- `candidates_pipeline` (records where `candidate_id = auth.uid()`)
- `profiles` (candidate's profile data)

### 4.2. CandidateProfile

**Purpose:** Let candidates manage their professional profile.

**Editable fields:**
- Current title & company
- Target geographies (multi-select)
- Target industries
- Availability (immediately / 1 month / 3 months / exploring)
- Short-term and long-term goals
- Preferred contact method
- LinkedIn URL

**Data model:** Extend `profiles` table or create `candidate_preferences` table.

```sql
CREATE TABLE candidate_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES profiles(id),
  target_geographies TEXT[],
  target_industries TEXT[],
  availability TEXT DEFAULT 'exploring',  -- 'immediately' | '1_month' | '3_months' | 'exploring'
  preferred_contact TEXT,
  linkedin_url TEXT,
  open_to_relocate BOOLEAN DEFAULT false,
  min_compensation_usd INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 4.3. CandidateApplications

**Purpose:** Track all mandates the candidate has been submitted to.

**View:**
| Company | Role | Status | Submitted | Last Update |
|---------|------|--------|-----------|-------------|
| TechCorp | VP Engineering | Interview Stage | Jan 15 | 2 days ago |
| FinanceCo | Managing Director | Screening | Jan 20 | Today |

**Status values (candidate-facing):**
| Internal Status | Candidate Sees |
|----------------|----------------|
| `screened` | Under Review |
| `client_submitted` | Submitted to Client |
| `interview_1`, `interview_2`, `interview_3` | Interview Stage |
| `offer_extended` | Offer Stage |
| `offer_accepted` | Placed ✅ |
| `rejected_*` | Not Selected |

**Critical:** Candidates should NOT see:
- Internal consultant notes
- Scoring details
- Which consultant is handling them (unless explicitly introduced)
- Fee information

### 4.4. CandidateApplicationDetail

**Purpose:** Single application deep-dive.

**Sections:**
- **Role Overview** — title, company (may be anonymized initially), location, key requirements
- **Timeline** — visual progress bar (Applied → Screening → Interview → Offer → Placed)
- **Interview Prep** — if in interview stage:
  - Company brief (public info + LYC market intel, curated for candidate)
  - Common interview questions for this role type
  - Tips from LYC's methodology (general, not mandate-specific)
- **Feedback** — if available, anonymized feedback from interviews

### 4.5. CandidateAssessments

**Purpose:** View past assessment results.

**Features:**
- List of all assessments taken with dates
- Latest result: archetype + dimension scores + PDF download
- Comparison view if multiple assessments (progress over time)
- "Retake Assessment" button (credit-gated for B2C; free for portal users)

### 4.6. CandidateInsights

**Purpose:** Market intelligence relevant to the candidate's profile.

**Content (generated/curated by LYC):**
- Demand signals: "Your profile (Cross-Border Architect) is in high demand in APAC fintech"
- Benchmark data: "Compensation range for your level in target geographies"
- Trend insights: "Companies in your target industry are prioritizing X skills"

**Implementation:**
- Use Nexus AI to generate personalized insights based on candidate profile + market data
- Cache results (refresh weekly, not on-demand)
- This is a strong differentiator — candidates get value even without an active application

### 4.7. CandidateSettings

**Purpose:** Notification and privacy controls.

**Features:**
- Email notifications: new opportunity match, application status change, interview reminder
- Profile visibility: visible to all consultants / visible to LYC network only / hidden
- Data export (GDPR compliance)
- Account deletion

---

## 5. Database Changes

### 5.1. Candidate Preferences Table

```sql
CREATE TABLE candidate_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES profiles(id) UNIQUE,
  target_geographies TEXT[],
  target_industries TEXT[],
  availability TEXT DEFAULT 'exploring',
  preferred_contact TEXT,
  linkedin_url TEXT,
  open_to_relocate BOOLEAN DEFAULT false,
  min_compensation_usd INTEGER,
  profile_visibility TEXT DEFAULT 'lyc_network',  -- 'all' | 'lyc_network' | 'hidden'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE candidate_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY candidate_own_preferences ON candidate_preferences
  FOR ALL
  USING (candidate_id = auth.uid());
```

### 5.2. Candidate Pipeline Access

Candidates should only see pipeline records for themselves:

```sql
-- Add RLS policy for candidates_pipeline
CREATE POLICY candidate_own_pipeline ON candidates_pipeline
  FOR SELECT
  USING (candidate_id = auth.uid());
```

### 5.3. Candidate-Facing Mandate Data

Create a view that strips internal data:

```sql
CREATE VIEW candidate_visible_mandates AS
SELECT 
  m.id,
  m.title,
  m.location,
  m.industry,
  m.function,
  m.level,
  m.status,
  m.created_at,
  m.anonymized_company  -- NULL means show real name; set by consultant
FROM mandates m
WHERE m.id IN (
  SELECT DISTINCT mandate_id FROM candidates_pipeline 
  WHERE candidate_id = auth.uid()
);
```

---

## 6. Post-Assessment Flow Integration

### 6.1. Current Flow
```
B2C Landing → Assessment → Result Page (dead end)
```

### 6.2. New Flow
```
B2C Landing → Assessment → Result Page
                              ├── [Download PDF] (existing)
                              └── [Create Account] → Signup (icp='candidate')
                                                      → /candidate (portal)
```

**File to modify:** `src/components/assessment/ResultsPanel.tsx`

Add CTA button:
```tsx
{!isLoggedIn && (
  <Button onClick={() => navigate('/signup?icp=candidate&assessment=' + assessmentId)}>
    Track Your Applications
  </Button>
)}
```

### 6.3. Assessment-to-Profile Bridge

When a candidate signs up after assessment, link the assessment to their new profile:

```typescript
// In signup flow:
// 1. Create profile with icp='candidate'
// 2. If assessmentId in URL params, update assessment record:
await supabase.from('assessments').update({ 
  candidate_id: newUserId 
}).eq('id', assessmentId);
```

---

## 7. Acceptance Criteria

- [ ] Candidate user (`icp = 'candidate'`) logging in is redirected to `/candidate`
- [ ] Candidate sees only their own applications and data
- [ ] Candidate cannot access `/platform/*` routes (redirected to `/candidate`)
- [ ] Assessment result is accessible in the portal after signup
- [ ] Candidate can update their profile and preferences
- [ ] Application timeline shows correct status (using candidate-facing labels)
- [ ] No internal data leakage (scoring, consultant notes, fees)
- [ ] Post-assessment "Create Account" CTA works and links assessment to profile
- [ ] Career Insights page shows relevant content (even if placeholder initially)
- [ ] `npm run build` succeeds

---

## 8. Files Created / Modified

### Created
| File | Purpose |
|------|---------|
| `src/components/candidate/CandidatePortal.tsx` | Layout + sidebar |
| `src/components/candidate/CandidateDashboard.tsx` | Dashboard |
| `src/components/candidate/CandidateProfile.tsx` | Profile editor |
| `src/components/candidate/CandidateApplications.tsx` | Application tracker |
| `src/components/candidate/CandidateApplicationDetail.tsx` | Single application view |
| `src/components/candidate/CandidateAssessments.tsx` | Assessment history |
| `src/components/candidate/CandidateInsights.tsx` | Market insights |
| `src/components/candidate/CandidateSettings.tsx` | Settings |
| `supabase/migrations/create_candidate_preferences.sql` | New table + RLS |

### Modified
| File | Change |
|------|--------|
| `src/App.tsx` | Add `/candidate` routes |
| `src/components/assessment/ResultsPanel.tsx` | Add "Create Account" CTA |
| `src/pages/SignupPage.tsx` | Handle `icp=candidate` param |
| `src/stores/authStore.ts` | Post-login redirect for candidates |

---

## 9. Design Notes

- Candidate portal should feel like a **career companion**, not a job board
- The assessment archetype is the hero — it's LYC's differentiator
- Career Insights is the **stickiness** mechanism — gives candidates a reason to return
- Keep it simple: candidates are passive users, not power users
- Mobile-first design — candidates will check status on their phones
- Consider PWA (Progressive Web App) for candidates — add to home screen

