# Phase 1.4 — Consultant Experience Completion

**Status:** DRAFT — Pending Kevin approval  
**Priority:** P1 (core product value — what consultants use daily)  
**Estimated effort:** 4–6 days  
**Dependency:** Phase 1.0 (auth), Phase 1.3 (role navigation)

---

## 1. Problem Statement

The consultant experience has working core flows (match scoring, pipeline, Nexus chat) but lacks:

1. **No onboarding flow** — new consultants see a generic "Good morning" dashboard with no guidance
2. **No daily task view** — no "what should I work on today?" functionality
3. **Nexus AI is disconnected** — chat has no mandate context, no integration with active work
4. **Scheduler is generic** — no integration with interviews, deadlines, or mandate milestones
5. **Dashboard doesn't differentiate** — no "my mandates" vs "platform overview" distinction
6. **No activity logging** — no time tracking or work history for performance review
7. **Placeholder pages** — some pages show TODO content or incomplete UI

---

## 2. Target State

A consultant logging in sees:

```
My Dashboard
├── Today's Focus (3-5 priority items from active mandates)
├── My Active Mandates (cards with status, next action)
├── Recent Activity (last 7 days)
├── Credit Balance & Usage
└── Quick Actions (New Match, Import LinkedIn, Start Nexus Session)
```

With guided onboarding for new users (first 3 logins).

---

## 3. Detailed Specification

### 3.1. Consultant Onboarding (First Login)

**Trigger:** `profile.created_at` is within 24 hours AND no completed onboarding steps.

**File:** `src/components/dashboard/ConsultantOnboarding.tsx`

```
Step 1: Welcome
  "Welcome to LYC Intelligence. Let's get you set up."
  → Name, title, specialization

Step 2: Your First Mandate
  "Create your first mandate or import from an existing search."
  → Quick mandate creation form (title, company, function, level, location)
  → OR skip

Step 3: Nexus AI Intro
  "Meet Nexus — your AI research assistant."
  → Show a sample prompt: "Find me comparable companies in APAC fintech"
  → OR skip

Step 4: Done
  "You're all set. Here's your dashboard."
  → Navigate to /platform
```

**Data model:** Add `onboarding_completed` boolean to profiles:
```sql
ALTER TABLE profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;
```

### 3.2. Dashboard Redesign — "My Dashboard"

**File:** `src/components/dashboard/ConsultantDashboard.tsx`

Replace the current generic dashboard with a task-oriented view:

#### Section 1: Today's Focus
```
┌─────────────────────────────────────────────────┐
│ 🎯 Today's Focus                                │
│                                                 │
│ □ Review 3 new candidates for VP Eng, TechCorp  │
│ □ Prepare interview brief for Managing Dir, 3PM │
│ □ Follow up on offer feedback from FinanceCo    │
│ □ Submit shortlist update to client (deadline)  │
└─────────────────────────────────────────────────┘
```

**Data sources:**
- `mandates` WHERE `status = 'active'` AND `consultant_id = auth.uid()`
- `candidates_pipeline` WHERE action required (e.g., candidates in `client_submitted` need follow-up)
- `events` WHERE date = today
- `vista_action_queue` (if populated)

#### Section 2: My Active Mandates
```
┌─────────────────────────────────────────────────┐
│ 📋 My Active Mandates (3)                       │
│                                                 │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│ │ VP Eng      │ │ Managing Dir│ │ CFO, APAC   ││
│ │ TechCorp    │ │ FinanceCo   │ │ StartupX    ││
│ │             │ │             │ │             ││
│ │ Interview   │ │ Screening   │ │ Shortlist   ││
│ │ 5 candidates│ │ 12 screened │ │ 4 submitted ││
│ │ Next: Prep  │ │ Next: Submit│ │ Next: Client││
│ └─────────────┘ └─────────────┘ └─────────────┘│
└─────────────────────────────────────────────────┘
```

**Data sources:**
- `mandates` WHERE `consultant_id = auth.uid()` AND `status IN ('active', 'on_hold')`
- `candidates_pipeline` grouped by mandate, counted by stage

#### Section 3: Recent Activity
```
┌─────────────────────────────────────────────────┐
│ 📊 Recent Activity                              │
│                                                 │
│ Today    Scored 5 candidates for VP Eng         │
│ Today    Nexus: Market map for APAC fintech     │
│ Yesterday Candidate interview feedback received │
│ Yesterday Shortlist submitted to client         │
│ 2 days   LinkedIn import: 12 profiles          │
└─────────────────────────────────────────────────┘
```

**Data sources:**
- `scoring_runs` (scoring activity)
- `chat_sessions` (Nexus activity)
- `candidates_pipeline` (status changes)
- `documents` (uploads)

#### Section 4: Quick Stats
```
┌─────────────────────────────────────────────────┐
│ ⚡ Quick Stats                                  │
│                                                 │
│ Active Mandates: 3    Pipeline Candidates: 24  │
│ Credits: 847        This Week Scored: 18       │
└─────────────────────────────────────────────────┘
```

### 3.3. Nexus AI — Mandate Context Integration

**Problem:** Nexus chat has no awareness of which mandate the consultant is working on.

**Solution:** Add a mandate context selector to NexusPage.

**File:** `src/pages/NexusPage.tsx`

```typescript
// Add mandate selector above chat input
const [selectedMandate, setSelectedMandate] = useState<string | null>(null);

// Fetch active mandates for selector
const { data: mandates } = await supabase
  .from('mandates')
  .select('id, title, company')
  .eq('consultant_id', profile?.id)
  .eq('status', 'active');

// When sending a message, include mandate context
function handleSend(message: string) {
  const context = selectedMandate 
    ? `[Context: Working on mandate "${selectedMandate.title}" at ${selectedMandate.company}] ${message}`
    : message;
  
  sendChatMessage(context);
}
```

**UI:**
```
┌─────────────────────────────────────────────────┐
│ Nexus AI                                        │
│                                                 │
│ [🏢 All Mandates ▾] [VP Eng, TechCorp]         │
│                                                 │
│ ── Chat Messages ──                             │
│                                                 │
│ [Input: Ask Nexus about this mandate...]  [→]  │
└─────────────────────────────────────────────────┘
```

### 3.4. Scheduler — Mandate Integration

**Problem:** Current scheduler is a generic calendar with no connection to mandates.

**Solution:** Auto-populate calendar from mandate events.

**File:** `src/pages/SchedulerPage.tsx`

```typescript
// Auto-fetch events from mandates and pipeline
const mandateEvents = await supabase
  .from('events')
  .select('*')
  .in('mandate_id', activeMandateIds)
  .gte('event_date', today)
  .order('event_date');

// Calendar shows:
// - Interview dates (from candidates_pipeline)
// - Client meetings (from events)
// - Deadline reminders (from mandates)
// - Follow-up tasks (from vista_action_queue)
```

**Event types on calendar:**
| Type | Color | Source |
|------|-------|--------|
| Interview | Blue | `candidates_pipeline` with interview date |
| Client Meeting | Green | `events` table |
| Deadline | Red | `mandates` deadline fields |
| Follow-up | Yellow | `vista_action_queue` |
| Scoring Session | Purple | `scoring_runs` |

### 3.5. "My Mandates" Filter

**File:** `src/pages/MandatesPage.tsx`

Add a filter toggle:
```
[All Mandates] [My Mandates] [Shared with Me]
```

- **All Mandates:** Show everything (current behavior)
- **My Mandates:** Filter by `consultant_id = auth.uid()`
- **Shared with Me:** Filter by organization_id (team members' mandates visible to team lead)

Default view: "My Mandates" for consultants, "All Mandates" for team leads.

### 3.6. Activity Logging

**New table:**
```sql
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  mandate_id UUID REFERENCES mandates(id),
  action_type TEXT NOT NULL,  -- 'score_candidates' | 'nexus_chat' | 'pipeline_update' | 'document_upload' | 'interview_scheduled'
  action_details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Users can read their own + admin can read all
CREATE POLICY activity_read ON activity_log
  FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Insert own activities
CREATE POLICY activity_insert ON activity_log
  FOR INSERT
  WITH CHECK (user_id = auth.uid());
```

**Integration points (where to log):**
- `BatchScoringPage.tsx` → log scoring session
- `NexusPage.tsx` → log chat session
- `PipelinePage.tsx` → log candidate stage change
- `DocumentsPage.tsx` → log document upload

### 3.7. Placeholder / TODO Resolution

**Pages to audit and complete:**

| Page | Issue | Action |
|------|-------|--------|
| `NotificationsPage.tsx` | May show empty state with no notification generation | Wire to `events` table or `vista_action_queue` |
| `SchedulerPage.tsx` | Generic calendar, no mandate integration | See 3.4 above |
| `DashboardPage.tsx` | Shows generic stats, not mandate-aware | See 3.2 above |

---

## 4. Acceptance Criteria

- [ ] New consultant sees onboarding flow on first login
- [ ] Dashboard shows "Today's Focus" with actionable items from active mandates
- [ ] Dashboard shows "My Active Mandates" cards with status and next action
- [ ] Dashboard shows recent activity timeline
- [ ] Nexus chat has mandate context selector
- [ ] Nexus messages include mandate context when selected
- [ ] Scheduler shows mandate-related events (interviews, deadlines, meetings)
- [ ] MandatesPage has "My Mandates" / "All Mandates" filter
- [ ] Activity is logged for: scoring, Nexus chat, pipeline updates, document uploads
- [ ] No placeholder/TODO content visible to users
- [ ] `npm run build` succeeds

---

## 5. Files Created / Modified

### Created
| File | Purpose |
|------|---------|
| `src/components/dashboard/ConsultantOnboarding.tsx` | First-login onboarding flow |
| `src/components/dashboard/TodayFocus.tsx` | Today's priority items widget |
| `src/components/dashboard/MyMandateCards.tsx` | Active mandate cards |
| `src/components/dashboard/RecentActivity.tsx` | Activity timeline widget |
| `supabase/migrations/create_activity_log.sql` | Activity logging table |

### Modified
| File | Change |
|------|--------|
| `src/components/dashboard/ConsultantDashboard.tsx` | Major redesign: add Today's Focus, My Mandates, Recent Activity |
| `src/pages/NexusPage.tsx` | Add mandate context selector |
| `src/pages/SchedulerPage.tsx` | Auto-populate from mandate events |
| `src/pages/MandatesPage.tsx` | Add "My Mandates" filter |
| `src/pages/BatchScoringPage.tsx` | Add activity logging on score |
| `src/pages/DocumentsPage.tsx` | Add activity logging on upload |
| `src/pages/NotificationsPage.tsx` | Wire to real data or show clean empty state |

---

## 6. Design Notes

- "Today's Focus" should be **automatically generated** from mandate state, not manually created
- The dashboard should feel like a **command center**, not a report
- Keep the dark/light theme support from current implementation
- Mobile-responsive is nice-to-have but not critical for consultants (they use desktop)
- Activity log is primarily for future "Performance Metrics" page (Phase 1.6 for team leads)

