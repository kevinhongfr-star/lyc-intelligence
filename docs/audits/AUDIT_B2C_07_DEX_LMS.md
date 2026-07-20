# B2C Audit #7: DEX Chat Page + Student LMS Dashboard

**Date:** 2026-07-20
**Auditor:** NEXUS
**Pages audited:**
- `/dex/chat` — `src/pages/council/DexChatPage.tsx` (492 lines)
- `/lms/dashboard` — `src/pages/lms/StudentLmsDashboardPage.tsx` (595 lines)
**Backend files reviewed:**
- `api/chat.ts` (public chat endpoint)
- `api/_lib/nexusChatHandler.ts` (authenticated Nexus chat)
- `api/dispatch.ts` (router)
- `api/_lib/creditsHandler.ts`
- `api/_lib/academyAdminHandler.ts`
- `src/services/coze.ts`
- `src/services/atomicCreditService.ts`
- `supabase/migrations/20250707_nexus_chat_tables.sql`
- `supabase/migrations/20260717_lms_schema.sql`
- `supabase/migrations/20260715_credit_system_atomic.sql`

---

## Overall Score: 2/10

Both pages are UI shells with no functional backend integration. The DEX chat page uses client-side mock AI responses instead of the real DeepSeek pipeline. The LMS dashboard has no backend API at all — its endpoint returns 404, so it always falls back to hardcoded mock data.

---

## Page 1: DEX Chat (`/dex/chat`) — Score: 3/10

### What the page claims to do
- AI-powered executive advisory chat with progressive credit gating (5 free messages → paid credits)
- Integration with DeepSeek via `/api/chat` or `/api/nexus/chat`
- Credit balance tracking and deduction per message
- Chat persistence across sessions

### What the page actually does
A self-contained React component that generates canned responses locally using keyword matching. It never calls any API, never fetches the user's credit balance, never persists messages, and never uses AI.

### 🔴 P0 — Critical Bugs

#### Bug 1: No AI integration — all responses are client-side mocks
- **File:** `DexChatPage.tsx`, lines 53-77
- **Function:** `buildMockResponse(userMessage: string): string`
- **Problem:** The page defines a local function that returns hardcoded executive-sounding text based on keyword matching (`salary`, `career`, `path`, `next`). This is the ONLY response mechanism. The comment on line 45 says "In production this is replaced by an SSE stream from /api/chat" — but no such integration exists.
- **Impact:** Users receive the same 3 canned responses regardless of question complexity. No actual AI, no context awareness, no conversation memory.
- **Data flow (current):**
  ```
  User input → buildMockResponse(keyword check) → hardcoded string → UI
  ```
- **Data flow (expected):**
  ```
  User input → POST /api/chat → DeepSeek API → streaming response → UI → persist to chat_messages
  ```

#### Bug 2: Credit balance never fetched from database
- **File:** `DexChatPage.tsx`, line 103
- **Code:** `const [creditBalance, setCreditBalance] = useState(0);`
- **Problem:** `creditBalance` is initialized to `0` and never updated from any API call. The page never queries `user_credits`, `credits`, or any credit endpoint. The "Executive Introduction" gating (5 free messages) works only because `creditBalance` stays at 0, so after 5 messages the gate state transitions from 'intro' to 'hard' (since `creditBalance > 0` is never true).
- **Impact:** Every user is immediately hard-gated after 5 messages regardless of their actual credit balance. Paid users with credits see the "Credits required" paywall.
- **Actual credit tables available:**
  - `user_credits` (20250707): columns `balance, tier, daily_grant, total_spent, total_earned`
  - `credits` (legacy): columns `balance, daily_balance, tier, total_spent, total_earned`
  - `v2_credit_transactions` (20260715): dual-ledger with `dex_credits` and `council_credits`
  - `organizations.credit_balance`: org-level balance
- **None of these are queried by the page.**

#### Bug 3: Credit "deduction" is purely cosmetic
- **File:** `DexChatPage.tsx`, line 131
- **Code:** `setCreditBalance((b) => Math.max(0, b - 1));`
- **Problem:** This decrements the React state variable, but since the initial value is 0 and is never loaded from the database, this line does nothing meaningful. No server-side credit deduction occurs. The `creditsHandler.ts` `handleSpend()` function is never called.
- **Impact:** Zero revenue can flow through this page. No credits are consumed, no transactions logged.

#### Bug 4: No chat session/message persistence
- **File:** `DexChatPage.tsx` — entire component
- **Problem:** Messages exist only in React state (`useState<ChatMessage[]>`). The `chat_sessions` and `chat_messages` tables (created in `20250707_nexus_chat_tables.sql`) are never written to. No session is created, no messages are saved.
- **Impact:** Refreshing the page loses all conversation history. No diagnostic tracking, no milestone tracking, no analytics. The rich schema (diagnostic_progress, diagnostic_dimensions, milestone_status, diagnostic_tags, milestone_tags) is completely unused.

### ⚠️ P1 — Severe Issues

#### Issue 5: No authentication context passed to chat
- **File:** `DexChatPage.tsx` — entire component
- **Problem:** Even if the page were to call `/api/chat`, it doesn't import or use any auth context. The `api/chat.ts` handler expects `userId`, `tier`, `portalType`, `memoryContext` in the request body. None of these are available to the page. The page is wrapped in `<ProtectedRoute>` but doesn't consume the auth session.
- **Impact:** Even if fixed to call the API, the backend would treat every user as anonymous/free-tier.

#### Issue 6: Wrong chat endpoint target
- **Problem:** There are TWO chat backends:
  1. `api/chat.ts` — public, no auth required, uses in-memory rate limiting, non-streaming
  2. `api/_lib/nexusChatHandler.ts` — auth-required, SSE streaming, seniority calibration, role-aware prompts, persistent session support
- The DEX page should use `nexusChatHandler` (routed via `/api/nexus/chat`) for authenticated users with proper context. But it uses neither.

#### Issue 7: DeepSeek model alias deprecated
- **File:** `api/chat.ts`, line 29: `const DEEPSEEK_MODEL = 'deepseek-v4-flash';`
- **File:** `api/_lib/nexusChatHandler.ts`, line 18: `const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash';`
- **Problem:** The `deepseek-v4-flash` alias is being deprecated by DeepSeek (deadline ~July 24, 2026). Must migrate to `deepseek-chat`.
- **Impact:** Chat will completely stop working after deprecation date.

#### Issue 8: In-memory rate limiting is not persistent
- **File:** `api/chat.ts`, lines 47-58
- **Problem:** `rateLimitStore` is a `Map` in serverless function memory. It resets on every cold start. The TODO comment acknowledges this: "persist counts to Supabase keyed by userId for true cross-instance enforcement."
- **Impact:** Rate limits are best-effort only; users can exceed limits by triggering cold starts.

#### Issue 9: Broken link to `/council/membership`
- **File:** `DexChatPage.tsx`, lines 179, 222, 484
- **Problem:** Three links point to `/council/membership` but no such route exists in `App.tsx`. The Council routes are: `/council`, `/council/tiers`, `/council/dashboard`, `/council/coaching`, `/council/events/:id`, `/council/community`, `/council/directory`, `/council/profile`, `/council/benefits`, `/council/briefing`.
- **Impact:** Clicking "Explore Council" leads to a 404 / blank page.

#### Issue 10: No error handling for chat failures
- **Problem:** Since the page never makes API calls, there's no error handling for network failures, API errors, or DeepSeek downtime. When the page is eventually connected, it will need retry logic and graceful degradation.

### P2 — Minor Issues

- **No conversation export/download** — Users can't save their conversations
- **No message editing/retry** — Once sent, a message can't be edited
- **Suggested prompts are static** — Not personalized based on user profile or assessment results
- **No typing indicator delay calibration** — Fixed 700ms delay regardless of response length
- **Mobile keyboard not handled** — No `inputMode` or keyboard avoidance for mobile chat UX
- **No session management** — Can't start a new conversation or view past conversations
- **Accessibility:** No `aria-live` region for screen readers to announce new messages

### What works
- UI/UX design is polished — clean layout, proper spacing, fuchsia brand accent
- Progressive gating logic (intro → soft → hard) is well-structured as a concept
- `GateState` type and `useMemo` computation are clean
- Message bubble component is well-designed
- Hard gate modal is accessible (aria-modal, keyboard dismiss)
- Responsive design (mobile/desktop breakpoints)

### Fix Specification

#### Fix 1: Connect to real DeepSeek backend
```typescript
// Replace buildMockResponse with actual API call
import { useAuth } from '@/contexts/AuthContext'; // or equivalent

const { user, profile } = useAuth();

async function handleSend() {
  // ...
  const res = await fetch('/api/nexus/chat', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream' 
    },
    credentials: 'include',
    body: JSON.stringify({
      message: text,
      history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
      session_id: sessionId,
      use_case: 'dex_advisory',
      profile: { title: profile?.title, company: profile?.company },
      tier: userTier,
      userId: user?.id,
      userRole: profile?.role,
      stream: true,
    }),
  });
  // Handle SSE stream...
}
```

#### Fix 2: Fetch credit balance on mount
```typescript
useEffect(() => {
  async function loadCredits() {
    const res = await fetch('/api/credits/org-balance', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      setCreditBalance(data.orgBalance || 0);
    }
  }
  loadCredits();
}, []);
```

#### Fix 3: Persist chat sessions and messages
```typescript
// After sending a message, persist to Supabase
async function persistMessage(sessionId: string, role: 'user' | 'assistant', content: string) {
  await supabase.from('chat_messages').insert({
    session_id: sessionId,
    role,
    content,
    metadata: { source: 'dex_chat' },
  });
}
```

#### Fix 4: Server-side credit deduction
```typescript
// After AI response, deduct credit via API
if (gateState === 'soft') {
  await fetch('/api/credits/spend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      userId: user.id,
      amount: 1,
      action: 'dex_chat_message',
      referenceId: aiMsg.id,
    }),
  });
}
```

#### Fix 5: Fix DeepSeek model alias
```
// api/chat.ts line 29:
const DEEPSEEK_MODEL = 'deepseek-chat';
// nexusChatHandler.ts line 18:
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
```

#### Fix 6: Fix broken `/council/membership` link
Change all three instances to `/council/tiers` (the public pricing page for Council).

---

## Page 2: Student LMS Dashboard (`/lms/dashboard`) — Score: 1/10

### What the page claims to do
- Show enrolled courses with progress tracking
- Display learning plan with priority items
- Show earned certificates
- Provide personalized recommendations

### What the page actually does
Makes a single API call to `/api/lms/dashboard` which returns 404 (no such backend exists), then falls back to 100% hardcoded mock data. Every piece of information shown is fictional.

### 🔴 P0 — Critical Bugs

#### Bug 1: Backend API does not exist — always 404
- **File:** `StudentLmsDashboardPage.tsx`, line 89
- **Code:** `const res = await fetch('/api/lms/dashboard', { credentials: 'include' });`
- **Problem:** The vercel.json rewrites route `/api/lms/dashboard` → `/api/dispatch?__mod=lms&__sub=dashboard`. But `dispatch.ts` handlers map has NO entry for `'lms'`. The dispatch returns `404: Unknown module: lms`.
- **Impact:** The API call ALWAYS fails. The page ALWAYS renders mock data. No real user data is ever shown.
- **Missing handler:** Need to add `'lms': () => import('./_lib/lmsDashboardHandler.js')` to dispatch.ts and create the handler.

#### Bug 2: All displayed data is hardcoded fiction
- **File:** `StudentLmsDashboardPage.tsx`, lines 438-595
- **Mock data:**
  - `MOCK_COURSES`: 3 fictional courses ("Executive Presence & Communication", "Strategic Decision Making", "People Management Essentials") with fabricated progress percentages
  - `MOCK_CERTIFICATES`: 2 fake certificates with codes like `LYC-STRAT-2025-00127`
  - `MOCK_LEARNING_PLAN`: 6 items with past target dates (2025-08-20, 2025-11-15) and fabricated progress
- **Impact:** Every single data point on the page is false. Users see courses they're not enrolled in, certificates they haven't earned, and progress they haven't made.
- **Contrast with DB:** The `lms_courses`, `lms_enrollments`, `lms_lesson_progress`, `lms_certificates` tables exist (20260717_lms_schema.sql) and are well-designed, but the dashboard never queries them.

#### Bug 3: No enrollment query exists
- **Problem:** The `academyAdminHandler.ts` handles enrollment management (`/api/academy/enrollments`), but only for admin users (requires `super_admin`, `admin`, `academy_admin`, or `content_admin` role). There is no student-facing endpoint to fetch a user's own enrollments with course details, progress, and certificates.
- **Required endpoint:** `GET /api/lms/dashboard` should:
  1. Get authenticated user's `contact_id` and `user_id`
  2. Query `lms_enrollments` WHERE `contact_id = ? OR user_id = ?`
  3. Hydrate with course details from `lms_courses`
  4. Compute progress from `lms_lesson_progress`
  5. Fetch certificates from `lms_certificates`
  6. Generate learning plan based on assessment results

#### Bug 4: Stats computed from mock data are meaningless
- **File:** `StudentLmsDashboardPage.tsx`, lines 123-126
- **Code:**
  ```typescript
  const inProgress = courses.filter((c) => c.status === 'active').length;
  const completed = courses.filter((c) => c.status === 'completed').length;
  const totalHours = courses.reduce((acc, c) => acc + (c.estimated_hours * (c.progress_pct / 100)), 0);
  const streakDays = 7;
  ```
- **Problem:** `inProgress`, `completed`, `totalHours` are computed from mock data. `streakDays` is hardcoded to `7` with no computation at all.
- **Impact:** All 4 stat cards show false numbers.

### ⚠️ P1 — Severe Issues

#### Issue 5: "Resume" / "Review" buttons have no navigation
- **File:** `StudentLmsDashboardPage.tsx`, line 367
- **Code:** `<Button variant="ghost" size="sm">{isCompleted ? 'Review' : 'Resume'}</Button>`
- **Problem:** Buttons have no `onClick` handler and no navigation. No lesson viewer page exists. No route for `/lms/course/:id/lesson/:lessonId`.
- **Impact:** Core action button is completely non-functional.

#### Issue 6: "Browse Courses" button has no navigation
- **File:** `StudentLmsDashboardPage.tsx`, line 164
- **Code:** `<Button>Browse Courses</Button>`
- **Problem:** No onClick handler, no link. No public course catalog page exists for students.
- **Impact:** Empty state CTA is broken.

#### Issue 7: Certificate "View" and "Download" buttons are non-functional
- **File:** `StudentLmsDashboardPage.tsx`, lines 415-422
- **Code:** `<Button size="sm" variant="outline">View</Button>` and `<Button size="sm">Download</Button>`
- **Problem:** No click handlers. No certificate PDF generation. No certificate viewing page. The `lms_certificates` table has a `certificate_url` column but it's never populated.
- **Impact:** Users can't view or download their certificates.

#### Issue 8: "Weekly Goal" card is entirely fabricated
- **File:** `StudentLmsDashboardPage.tsx`, lines 197-210
- **Code:** Shows hardcoded "3.5h of 5h target this week" with `Progress value={70}`
- **Problem:** No weekly goal tracking exists in the database. No time tracking per lesson. No mechanism to compute hours learned.
- **Impact:** Misleading gamification metric.

#### Issue 9: "Recommended for You" section is static
- **File:** `StudentLmsDashboardPage.tsx`, lines 219-232
- **Content:** Hardcoded "Executive Presence" and "Strategic Thinking" recommendations
- **Problem:** No personalization logic. Not based on assessment results, completed courses, or user profile.
- **Impact:** Same recommendation shown to every user.

#### Issue 10: Learning plan items have past target dates
- **File:** `StudentLmsDashboardPage.tsx`, lines 547-580
- **Mock data:** Target dates include `2025-08-20`, `2025-11-15`, `2026-04-30` — all in the past
- **Problem:** Past dates shown as "targets" are confusing. Additionally, the learning plan isn't tied to any real data model — there's no `learning_plan` table in the schema.

### P2 — Minor Issues

- **No loading states per tab** — Only initial loading has spinner; tab switches are instant (mock data) but will need loading when real API is connected
- **No error boundary** — If API fails after implementation, no error UI
- **No pagination** — All courses/certificates loaded at once
- **No course cover images** — `cover_image_url` is always null in mock data; placeholder is a generic BookOpen icon
- **No progress computation** — `lms_lesson_progress` has granular tracking (video_watched, reading_viewed, exercise_completed, quiz_attempted) but the dashboard only shows `progress_pct`
- **No real-time updates** — Dashboard doesn't refresh when a lesson is completed
- **Emoji in header** — "Welcome back 👋" uses emoji, inconsistent with LYC brand rules (no emoji)

### What works
- DB schema is comprehensive and well-designed (courses, lessons, enrollments, progress, quizzes, certificates)
- Academy admin handler (`academyAdminHandler.ts`) is fully functional for admin management
- Page layout and component structure are clean
- Tab navigation (Courses / Learning Plan / Certificates) is good UX
- Certificate card design is polished

### Fix Specification

#### Fix 1: Create LMS Dashboard backend handler
Create `api/_lib/lmsDashboardHandler.ts`:
```typescript
export async function handler(req: VercelRequest, res: VercelResponse) {
  const { user } = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  // 1. Get user's enrollments with course details
  const enrollments = await supabase
    .from('lms_enrollments')
    .select('*, lms_courses!inner(id, title, description, cover_image_url, estimated_hours, duration_weeks, status)')
    .or(`user_id.eq.${user.id},contact_id.eq.${user.contact_id}`)
    .order('enrolled_at', { ascending: false });

  // 2. Compute progress per enrollment from lms_lesson_progress
  // 3. Fetch certificates
  // 4. Generate learning plan from assessment results
  // 5. Compute streak from lesson_progress.completed_at dates
  
  return res.status(200).json({
    success: true,
    data: {
      enrollments: enrichedEnrollments,
      certificates,
      learning_plan,
      stats: { inProgress, completed, totalHours, streakDays },
    },
  });
}
```

#### Fix 2: Register LMS module in dispatch.ts
```typescript
// api/dispatch.ts handlers map:
'lms': () => import('./_lib/lmsDashboardHandler.js'),
```

#### Fix 3: Connect page to real API and remove all mock data
```typescript
const loadDashboard = useCallback(async () => {
  try {
    const res = await fetch('/api/lms/dashboard', { credentials: 'include' });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    const data = await res.json();
    setCourses(data.data.enrollments || []);
    setCertificates(data.data.certificates || []);
    setLearningPlan(data.data.learning_plan || []);
    // Remove all MOCK_ fallbacks
  } catch (err) {
    setError(err.message); // Show error state, not fake data
  } finally {
    setLoading(false);
  }
}, []);
```

#### Fix 4: Add lesson viewer route
```typescript
// App.tsx:
<Route path="/lms/course/:courseId/lesson/:lessonId" element={<ProtectedRoute><LessonViewerPage /></ProtectedRoute>} />
```

#### Fix 5: Implement certificate PDF generation
- Use `certificate_url` field in `lms_certificates`
- Generate PDF with course title, participant name, date, certificate code
- Or link to a verification page: `/verify/certificate/:code`

#### Fix 6: Compute streak from actual lesson completion dates
```sql
SELECT COUNT(DISTINCT DATE(completed_at)) as streak_days
FROM lms_lesson_progress
WHERE enrollment_id IN (SELECT id FROM lms_enrollments WHERE user_id = ?)
  AND completed_at >= NOW() - INTERVAL '30 days'
ORDER BY DATE(completed_at) DESC
-- Compute consecutive days
```

---

## Combined B2C Audit Progress

| Page | Route | Score | Status |
|------|-------|-------|--------|
| 1. Landing | `/b2c` | 5/10 | ✅ |
| 2. Assessment | `/assessment` | 4/10 | ✅ |
| 3. Nexus Page | `/nexus` | 4/10 | ✅ |
| 4. Pricing | `/pricing`, `/pricing-v2`, `/council/tiers`, `/dex/credits` | 2/10 | ✅ |
| 5. Match | `/match` | 3/10 | ✅ |
| 6. Coaching Portal | `/coaching/*` (9 pages) | 2/10 | ✅ |
| 7a. DEX Chat | `/dex/chat` | 3/10 | ✅ this report |
| 7b. LMS Dashboard | `/lms/dashboard` | 1/10 | ✅ this report |

**B2C Portal Average: 2.75/10**

---

## Top Priority Fixes (B2C Portal-Wide)

1. **Create missing backend APIs** — `/api/lms/dashboard` doesn't exist. DEX chat doesn't call any API.
2. **Fix credit system column mismatches** — `user_credits` vs `credits` table confusion throughout
3. **Connect DEX chat to DeepSeek** — Replace mock responses with real SSE streaming via `nexusChatHandler`
4. **Fix DeepSeek model alias** — `deepseek-v4-flash` → `deepseek-chat` before July 24 deadline
5. **Eliminate all fabricated data** — Remove Math.random(), hardcoded stats, mock fallbacks
6. **Unify tier naming** — 5+ incompatible tier systems across the codebase
7. **Add Stripe environment variables** — 14+ price IDs and API keys not configured
8. **Fix broken routes** — `/council/membership`, missing lesson viewer, missing course catalog
