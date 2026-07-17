# 15 — First-Time User Onboarding Spec

**Version:** 1.0 | **Phase:** Go-Live Prerequisite | **Author:** NEXUS | **Status:** Ready for Implementation

---

## 1. Overview

First-time user onboarding for 3 user types: B2C Executive, Council Member, B2B Client. Each gets a tailored guided experience that drives them to their first value moment within 5 minutes.

---

## 2. User Type Detection

On first login after registration, route based on user role:
```
user_role = 'executive' → B2C Onboarding
user_role = 'council_member' → Council Onboarding
user_role = 'client_admin' → B2B Onboarding
user_role = 'consultant' → Skip onboarding (internal user)
```

---

## 3. B2C Executive Onboarding (5 Steps)

### Step 1: Welcome
```
┌──────────────────────────────────────────────────┐
│                                                  │
│  Welcome to DEX AI                              │
│                                                  │
│  Your AI-powered executive intelligence advisor. │
│  Get insights in 30 seconds.                     │
│                                                  │
│  [Get Started →]                                 │
│                                                  │
│  Takes ~2 minutes to set up                      │
└──────────────────────────────────────────────────┘
```

### Step 2: Quick Profile
```
┌──────────────────────────────────────────────────┐
│  Tell us about yourself                          │
│                                                  │
│  Full Name:    [____________]                    │
│  Role:         [C-Suite ▾]                       │
│  Company:      [____________]                    │
│  Industry:     [Technology ▾]                    │
│  Location:     [Shanghai ▾]                      │
│                                                  │
│  [Continue →]  [Skip for now]                    │
└──────────────────────────────────────────────────┘
```

### Step 3: Choose Your Path
```
┌──────────────────────────────────────────────────┐
│  What brings you here?                           │
│                                                  │
│  ┌─────────────┐  ┌─────────────┐               │
│  │ 💬 Ask AI    │  │ 📊 Assess   │               │
│  │ Chat with    │  │ Take SHIFT  │               │
│  │ DEX AI about │  │ diagnostic  │               │
│  │ your market  │  │ assessment  │               │
│  └─────────────┘  └─────────────┘               │
│                                                  │
│  ┌─────────────┐  ┌─────────────┐               │
│  │ 📚 Learn     │  │ 🏢 Council  │               │
│  │ Browse       │  │ Join The    │               │
│  │ courses &    │  │ Council     │               │
│  │ resources    │  │ community   │               │
│  └─────────────┘  └─────────────┘               │
└──────────────────────────────────────────────────┘
```

### Step 4: First Action (based on choice)
- **Ask AI**: Drop into chat with a pre-loaded prompt ("Tell me about leadership trends in APAC tech sector")
- **Assess**: Start LEAP mini-assessment (5 questions, shows teaser result)
- **Learn**: Show top 3 recommended courses
- **Council**: Show Council benefits page + pricing

### Step 5: Completion
```
┌──────────────────────────────────────────────────┐
│  ✅ You're all set!                              │
│                                                  │
│  Here's your dashboard. Come back anytime.       │
│                                                  │
│  ─── Your Progress ───                           │
│  ✅ Profile complete                             │
│  ✅ First action taken                           │
│  ○  Take full SHIFT assessment                   │
│  ○  Complete your development plan               │
│                                                  │
│  [Go to Dashboard →]                             │
└──────────────────────────────────────────────────┘
```

---

## 4. Council Member Onboarding (3 Steps)

### Step 1: Welcome to The Council
- Your membership benefits overview (3 cards: Intelligence, Community, Courses)
- Key features highlighted based on tier (Founding/Individual/Corporate)

### Step 2: Profile & Preferences
- Profile completion (if not done)
- Notification preferences (email digest frequency, in-app alerts)
- Topics of interest (for personalized intelligence)

### Step 3: Navigate
- Guided tour of: Latest Briefing → Community → Courses → Settings
- "Your first action" CTA based on what's new since joining

---

## 5. B2B Client Onboarding (4 Steps)

### Step 1: Company Setup
- Company name, logo, industry, size
- Primary contact details

### Step 2: Team Invitation
- Invite team members by email
- Assign roles (admin, viewer)
- Or skip and add later

### Step 3: First Mandate
- Guided mandate creation wizard
- Or browse AI-generated company intelligence

### Step 4: Consultant Connection
- See assigned consultant profile
- Schedule introductory call
- Or start chat

---

## 6. Technical Implementation

### 6.1 Library
```
react-joyride — Step-by-step guided tours
react-shepherd — Alternative (more customizable)
```

### 6.2 State Management
```typescript
interface OnboardingState {
    completed: boolean;
    currentStep: number;
    totalSteps: number;
    skipped: boolean;
    selectedPath?: string;
    firstActionTaken: boolean;
}

// Stored in v2_user_profiles.onboarding_state JSONB column
```

### 6.3 Database
```sql
-- Add to v2_user_profiles
ALTER TABLE v2_user_profiles ADD COLUMN onboarding_state JSONB DEFAULT '{"completed": false}';
ALTER TABLE v2_user_profiles ADD COLUMN onboarding_completed_at TIMESTAMPTZ;
```

### 6.4 Components
| Component | Description |
|-----------|-------------|
| OnboardingWrapper | Routes to correct flow based on user_role |
| B2COnboarding | 5-step executive flow |
| CouncilOnboarding | 3-step member flow |
| B2BOnboarding | 4-step client flow |
| GuidedTour | Joyride wrapper for feature tours |
| EmptyState | Reusable empty state with CTA |
| CompletionChecklist | Gamified progress checklist |

---

## 7. Empty States (All Major Sections)

Every dashboard section needs a meaningful empty state:

| Section | Empty State | CTA |
|---------|-------------|-----|
| Intelligence feed | "No signals yet. Here's what we're tracking..." | Configure interests |
| Assessments | "You haven't taken any assessments" | Take SHIFT Assessment |
| Courses | "No courses in progress" | Browse Course Catalog |
| Community | "No discussions yet" | Start a thread |
| Mandates | "No active mandates" | Create first mandate |
| Development Plan | "Complete an assessment to generate your plan" | Take Assessment |

---

## 8. Analytics

Track onboarding metrics:
- Completion rate per step
- Drop-off points
- Time to complete
- Path selection distribution
- First action taken vs. skipped
- 7-day retention correlated with onboarding completion

---

## 9. Exit Criteria
- [ ] B2C 5-step flow functional
- [ ] Council 3-step flow functional
- [ ] B2B 4-step flow functional
- [ ] Empty states for all 6 major sections
- [ ] Onboarding state persisted (can resume if interrupted)
- [ ] Skip option on every step
- [ ] Analytics tracking all steps
- [ ] Mobile responsive
