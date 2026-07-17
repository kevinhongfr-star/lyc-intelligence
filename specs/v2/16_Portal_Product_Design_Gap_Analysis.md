# LYC Intelligence — Portal-by-Portal Product Design Gap Analysis

**Date:** 2026-07-17
**Author:** NEXUS
**Purpose:** Identify every product design gap across all 5 portals before Trae builds them

---

## Executive Summary

The 5 portals have **17 spec files** covering pages, routes, and feature lists. But "feature list" ≠ "product design." A product designer would look at these specs and immediately ask 50+ questions per portal that aren't answered. Below is every gap I found, portal by portal.

---

## 1. THE COUNCIL PORTAL
### What's Specced (✅)
- 17 pages defined with routes
- Public pages: landing, membership tiers, events
- DEX AI B2C: chat, credits, history, account
- Member pages: dashboard, coaching, events, community, directory, profile, benefits
- Admin: member management, event management, coaching management, applications
- B2C → Council graduation journey
- Basic wireframes for landing page, member dashboard, event detail
- Notification types (coaching reminders, event reminders, credit low)

### What's Missing (🔴 Gaps)

#### 1.1 Community Feed — No Design Detail
- **What does a thread look like?** No wireframe for the feed layout. Is it card-based? List? Masonry? Infinite scroll or paginated?
- **Rich content in posts**: Can members embed images, links, code blocks, polls? What's the editor?
- **Thread depth**: Flat replies or nested? If nested, how many levels deep?
- **Content types**: Are there different post types? (Question, Discussion, Announcement, Resource Share, Event Recap?)
- **Member badges in posts**: How do Founding Members, Corporate members appear differently? Badge display next to author name?
- **Reactions**: Just likes? Or emoji reactions? Upvoting like Stack Overflow?
- **Content moderation UI**: How does a member report content? What happens after? What does the admin moderation queue look like?
- **Search within community**: Can members search old discussions?

#### 1.2 Member Directory — Privacy & Discovery Gaps
- **Profile visibility tiers**: What info is public vs. member-only vs. private? Which fields can members toggle?
- **Connection request UX**: Does it work like LinkedIn (send request → accept)? Or just direct message? What's the social protocol?
- **Messaging**: Is there a 1:1 messaging system between members? Or is this out of scope? If out of scope, how do members connect?
- **"Who's online" indicator**: Real-time presence or last-seen timestamp?
- **Industry/expertise taxonomy**: What are the filter categories? Are they predefined or user-generated tags? Who curates them?
- **Member onboarding into directory**: When does a new member appear? Immediately after signup? After profile completion? After admin approval?

#### 1.3 Coaching Booking — Workflow Gaps
- **Coach matching**: How are coaches assigned? Does the member choose from a list? Is there an algorithm? Or is it admin-assigned?
- **Coach profiles**: What does a coach's profile look like? Credentials, specialties, availability, rating?
- **Session types**: Video call? Phone? In-person? How is the meeting link generated?
- **Scheduling conflicts**: What happens if a member double-books? What's the reschedule/cancel policy? How many hours notice required?
- **Post-session flow**: What happens after a session ends? Does the system prompt for feedback? Can members write private notes? Are notes shared with the coach?
- **Credit consumption**: When exactly are credits deducted? At booking? At session completion? What if no-show?

#### 1.4 Events — Operational Gaps
- **Recurring events**: Are there weekly/monthly standing events? How are series handled?
- **Virtual event integration**: Is there a built-in video call (Whereby, Zoom)? Or just an external link?
- **Event capacity management**: Waitlist UX when full. How does auto-fill work if someone cancels?
- **Post-event content**: Where do recordings, slides, and materials live? Behind member-only wall?
- **Event feedback**: NPS score? Written feedback? How is it collected and displayed?
- **Calendar sync**: iCal export? Google Calendar integration? Outlook?

#### 1.5 DEX AI Chat — UX Detail Missing
- **Conversation UI**: ChatGPT-style bubbles? Or something different? Streaming responses?
- **Context persistence**: Does DEX AI remember previous conversations? How far back? Can the user see/manage context?
- **Message limits**: How is the 5-message Executive Introduction enforced? What happens at message 5? Hard cut-off with CTA, or soft nudge?
- **Error states**: What if DeepSeek API fails? Retry? Fallback? User message?
- **Mobile chat**: Chat interfaces are notoriously tricky on mobile. How does it work on small screens?
- **File attachments**: Can users upload resumes or documents in chat for analysis?
- **Chat history management**: Can users delete conversations? Archive? Search old chats?

#### 1.6 Membership Lifecycle
- **Renewal flow**: What happens when membership expires? Grace period? Auto-renew? Downgrade to DEX AI?
- **Upgrade/downgrade**: Can a member change tiers mid-year? Pro-rata? How does the UI handle this?
- **Cancellation flow**: What happens when someone cancels? Exit survey? Data retention? Can they rejoin?
- **Payment failure**: Failed card → retry logic → dunning emails → what UI states?
- **Corporate member management**: How does a Corporate member manage their 5 seats? Invite/remove seat holders?

#### 1.7 Council Intelligence Integration
- **How do Council members access intelligence reports?** Monthly briefing delivery — email only? In-platform? Both?
- **Signal alerts**: Can members subscribe to specific signal categories? Get notified when relevant signals appear?
- **Exclusive content**: What intelligence content is Council-exclusive? How is it gated and displayed differently from public content?

---

## 2. CLIENT PORTAL
### What's Specced (✅)
- 8 pages with routes and wireframes
- Dashboard with KPI cards, mandates, activity, company health
- Mandate management with pipeline visualization
- Candidate shortlist with AI match scores
- Billing & contracts
- Multi-company support
- White-label options
- ~67 tickets defined

### What's Missing (🔴 Gaps)

#### 2.1 Mandate Creation — No Design
- **Create mandate wizard**: The spec lists it but there's no detail. What fields? What's the UX? Multi-step form? How many steps?
- **Required vs. optional fields**: What's the minimum to create a mandate? What's nice-to-have?
- **Mandate templates**: Can clients save mandate templates for recurring roles?
- **Draft mode**: Can clients save a mandate as draft and come back later?
- **Approval workflow**: Does the mandate go through internal review before going live? (Client admin creates → client user approves?)
- **Salary input UX**: How do clients enter salary ranges? Slider? Min/max fields? Currency selector? How to handle "competitive" (no number)?
- **Mandate brief**: Is there a rich text field for the full role description? Markdown? WYSIWYG?

#### 2.2 Candidate Interaction — Underdesigned
- **Candidate profile depth**: What does the client see on a candidate? Full resume? AI assessment summary? Consultant notes? Interview history? How is this structured visually?
- **Feedback submission**: When a client reviews a candidate, what's the feedback form? Structured (ratings + dropdowns) or free text? Both?
- **Rejection feedback**: Does the client give feedback on why they rejected a candidate? Is this shared with the candidate? With the consultant?
- **Candidate comparison**: The spec mentions "side-by-side comparison" but there's no design for it. What attributes are compared? How does the layout work with 2 vs 5 candidates?
- **"Request more candidates"**: What happens after the client clicks this? Does it create a task for the consultant? What context is passed?
- **Internal candidate notes**: Can multiple client users add notes on a candidate? Are notes shared between client users?

#### 2.3 Interview Scheduling — Missing
- **Calendar integration**: How do interviews get scheduled? Built-in calendar? Google/Outlook sync?
- **Interview types**: Phone screen, video, panel, on-site — does the system distinguish between them?
- **Interview reminders**: Automated reminders to all parties (candidate, client, consultant)?
- **Interview feedback form**: Post-interview, what does the feedback form look like? Structured scoring? Free text?
- **Interview availability**: Does the client set available time slots? Or does the consultant coordinate?

#### 2.4 Consultant Communication
- **Messaging system**: How does the client message their assigned consultant? Built-in chat? Email relay? Scheduled calls?
- **Response SLA**: Is there a displayed SLA for consultant responses?
- **Communication history**: Can the client see all past communications with the consultant in one place?
- **Escalation path**: What if the client is unhappy with their consultant? How do they escalate?

#### 2.5 Reporting & Analytics — Underdesigned
- **Client-side reports**: What reports can clients generate? Pipeline report? Spend report? Diversity metrics?
- **Data export**: Can clients export their data? In what formats?
- **Benchmarking**: Can clients see how they compare to other clients? (Anonymized benchmarks)
- **Custom date ranges**: The spec mentions it but what does the date picker look like? Presets (last 30d, last quarter, YTD)?

#### 2.6 Offer Stage — Missing
- **Offer tracking**: How is the offer stage managed? Offer letter generation? Offer acceptance/rejection tracking?
- **Compensation visualization**: How are comp packages displayed? Base + bonus + equity breakdown?
- **Counter-offer tracking**: Can the system track if a candidate has a competing offer?
- **Placement celebration**: What happens when a mandate is filled? Is there a notification? A summary page?

#### 2.7 Multi-Company — Detail Gaps
- **Company switcher UX**: How does it work? Dropdown in header? Full page switch? Does it persist across sessions?
- **Cross-company permissions**: Can a client admin see all companies? Or only their assigned ones?
- **Consolidated reporting**: What does a cross-company dashboard look like? Aggregate metrics?

#### 2.8 Onboarding Flow for New Clients
- **First login experience**: What does a new client see? Empty state with guidance? Welcome wizard?
- **Company setup**: How does a new client set up their company profile? Step-by-step wizard?
- **First mandate creation**: Guided flow for creating the first mandate? Template-based?
- **Consultant introduction**: How is the client introduced to their assigned consultant? Automated intro? Manual?

---

## 3. CANDIDATE PORTAL
### What's Specced (✅)
- 9 pages with routes and wireframes
- Mandate browsing with search/filter
- Application flow (multi-step)
- Candidate dashboard with pipeline visualization
- Application tracker with status timeline
- ASSESS (complimentary assessment)
- AI career insights
- Profile & resume management
- Alumni → Council graduation flow
- ~68 tickets defined

### What's Missing (🔴 Gaps)

#### 3.1 Two User Journeys — Not Designed
- **Self-applied vs. consultant-placed**: A candidate who applies online has a very different experience from a senior executive placed by a consultant. The spec treats them identically.
- **Passive candidate profile**: What if a consultant adds a candidate manually? Does the candidate get an email to activate their account? What's their initial state?
- **Invited candidates**: What if a headhunted candidate is invited? Different onboarding? Different messaging?
- **How do these paths converge?** At what point do self-applied and consultant-placed candidates have the same experience?

#### 3.2 Application Experience — Detail Gaps
- **Application form UX**: How many steps? What's the progress indicator? Can users save and come back?
- **Resume parsing**: What happens after upload? Does the system auto-fill profile fields? Does the user review/correct? What if parsing fails?
- **Screening questions**: How are these displayed? One per page? All on one page? Required vs optional?
- **Application confirmation**: What does the confirmation page look like? What happens next? Expected timeline?
- **Edit after submission**: Can candidates edit their application after submitting? Up to what point?

#### 3.3 Status Communication
- **Status timeline**: The spec shows a pipeline but what does each status actually mean to the candidate? What are the exact statuses? (Applied → Under Review → Shortlisted → Interview → Offer → Placed → Rejected?)
- **Rejection experience**: How does a candidate learn they've been rejected? Email? In-app notification? How much detail is given?
- **Ghosting prevention**: If there's been no update in 2 weeks, does the system auto-notify? What does "no update" mean?
- **Status change notifications**: What triggers a notification? Every status change? Only forward progress?

#### 3.4 Interview Preparation
- **Interview scheduling (candidate side)**: How does a candidate schedule an interview? Do they see the client's availability? Or does the consultant coordinate?
- **Interview prep resources**: What kind of resources? Company-specific tips? General interview advice? AI-generated prep based on the role?
- **Interview feedback**: Does the candidate receive feedback after interviews? From whom? In what format?

#### 3.5 ASSESS Experience — UX Detail
- **Assessment UI**: What does the assessment look like? Question types: Likert scale, multiple choice, open-ended, ranking? How are they displayed?
- **Progress indicator**: How many questions total? Can the user see progress? Can they go back?
- **Time estimate**: Is there an estimated completion time shown upfront?
- **Save and resume**: Can a candidate pause the assessment and come back later? How long is the data saved?
- **Mobile assessment**: Likert scales and complex forms are painful on mobile. What's the mobile-specific design?
- **Results display**: How are results presented? Radar chart? Bar chart? Narrative text? Combination?
- **Results sharing**: Who sees the results? Candidate only? Candidate + consultant? Candidate + client?

#### 3.6 AI Career Insights — Vague
- **Match scoring**: How are "AI-matched positions" calculated? What does the score mean? Is it transparent to the candidate?
- **Skill gap analysis**: How is this generated? Based on what data? Is it actionable?
- **Salary benchmarks**: Where does the data come from? How current? By region?
- **Market intelligence**: What does this look like for a candidate? Industry trends? Company-specific data?

#### 3.7 Job Alerts
- **Alert preferences**: How do candidates set up job alerts? Frequency (daily/weekly)? By what criteria?
- **Alert delivery**: Email? In-app? Push notification?
- **Alert content**: What does a job alert email/notification look like?
- **Alert management**: Can candidates edit, pause, or delete alerts?

#### 3.8 Messaging with Consultants
- **Communication channel**: How do candidates communicate with their assigned consultant? Built-in messaging? Email?
- **Response expectations**: Are SLAs displayed? "Typically responds within 24h"?
- **Message history**: Is the full conversation thread visible?
- **File sharing**: Can candidates send documents to consultants through the platform?

#### 3.9 Profile & Resume
- **LinkedIn import**: What exactly gets imported? How is it mapped to profile fields? What requires manual correction?
- **Profile completeness**: How is the "completeness" calculated? What fields are weighted? What's the target?
- **Resume versioning**: Can candidates upload multiple resume versions? For different roles? How is the right resume matched to the right application?
- **Privacy controls**: What can candidates control? Who sees their profile? Can they hide from specific companies?

#### 3.10 Post-Rejection Experience
- **What happens after rejection?** The spec has post-placement (alumni) but nothing for rejected candidates.
- **Re-engagement**: How do you keep rejected candidates engaged? They might be perfect for future roles.
- **Feedback delivery**: How much feedback is given? Can they request more?
- **Re-application**: Can a rejected candidate re-apply for the same role later? Different role?

---

## 4. INTERNAL PORTAL (Consultant Workspace)
### What's Specced (✅)
- 8 pages with routes and wireframes
- Dashboard with KPIs, priorities, pipeline, AI insights
- Mandate management (table + Kanban views)
- Candidate management with search/filter
- Company management with 360° intelligence
- Activity & tasks with calendar view
- Reports & analytics
- Team management
- Admin settings
- Global search (Cmd+K)
- ~73 tickets defined
- **Most complete spec of all portals**

### What's Missing (🔴 Gaps)

#### 4.1 Workflow Automation
- **Mandate lifecycle automation**: When a mandate is created, what happens automatically? (Create tasks? Notify team? Post to candidate matching?)
- **Stage transitions**: When a candidate moves from "screening" to "submitted" to client, what auto-happens? (Email to client? Update dashboard? Trigger notification?)
- **Task auto-generation**: Are tasks auto-created from workflow events? (e.g., "Submit shortlist" task created when mandate reaches X candidates)
- **SLA tracking**: Are there SLAs for each stage? (e.g., "submit shortlist within 5 business days of mandate creation") What happens when SLAs are at risk?
- **Automation rules**: Can consultants create custom automation rules? ("When X happens, do Y")

#### 4.2 Candidate Matching — Design Missing
- **AI matching UI**: How does the AI matching actually look in practice? When a consultant opens a mandate, what do they see? A ranked list of candidates with match scores? How is the score explained?
- **Match explainability**: Can the consultant see WHY a candidate scored 92%? What factors contributed?
- **Manual override**: Can consultants override AI scores? Add manual notes to adjust ranking?
- **Matching criteria**: What's the algorithm based on? Skills? Experience? Location? Culture fit? Can the consultant weight factors?
- **Batch matching**: Can a consultant match multiple mandates at once? Or is it one-at-a-time?

#### 4.3 Reporting Detail
- **Dashboard widgets**: What exact metrics are on the reports page? Revenue by consultant? Placement rate? Time-to-fill by level?
- **Custom reports**: Can consultants build custom reports? Filter by date, team, client, mandate type?
- **Export formats**: PDF? Excel? What does the exported report look like?
- **Scheduled reports**: Can reports be auto-emailed weekly/monthly?
- **Benchmarking**: Team vs. team comparison? Individual vs. team average?

#### 4.4 Document Management
- **Contract management**: Where are client contracts stored? Can they be generated from templates?
- **Proposal generation**: Can consultants generate proposals from the platform?
- **Offer letter templates**: Are there templates? Can they be customized per client?
- **Document versioning**: Are documents versioned? Can you see previous versions?
- **E-signature integration**: DocuSign? HelloSign? Or manual process?

#### 4.5 Calendar & Scheduling
- **Calendar view detail**: What goes on the calendar? Interviews? Client meetings? Internal deadlines? Coaching sessions? All of the above?
- **Color coding**: Different colors for different event types?
- **Calendar sync**: Google Calendar / Outlook integration? Two-way sync?
- **Conflict detection**: Does the system warn about scheduling conflicts?
- **Bulk scheduling**: Can a consultant schedule multiple interviews at once?

#### 4.6 Consultant Collaboration
- **Handoff flow**: When a mandate is handed from one consultant to another, what's the process? What context is transferred?
- **Internal notes**: Can consultants leave internal notes on mandates/candidates that clients can't see?
- **Team mentions**: Can consultants @mention each other in notes/comments?
- **Knowledge sharing**: Is there a way to share "this candidate might be good for your mandate too"?
- **Workload visibility**: Can consultants see each other's workload? Is this opt-in?

#### 4.7 Admin Settings — Detail Gaps
- **Integration config**: What does the Stripe config screen look like? Resend? Supabase? Are these just API key inputs or guided setup?
- **Notification templates**: What's the template editor like? Variables? Preview? Test send?
- **System health**: What metrics are shown? API status? Database health? Queue depth?
- **Feature flags**: Can specific features be toggled on/off? Per-user? Per-role?

#### 4.8 Keyboard Shortcuts & Power User Features
- **Beyond Cmd+K**: What other keyboard shortcuts exist? Navigate between pages? Quick actions?
- **Bulk operations detail**: What bulk operations are supported? Select all? Filter-then-select?
- **Saved views**: How do saved views work? Can they be shared across team members?

---

## 5. ACADEMY / LMS
### What's Specced (✅)
- Database schema (courses, modules, lessons, enrollments, progress, certificates, community, development plans)
- Course management (admin)
- Student dashboard (6 sections)
- Lesson player (video, text, quiz, assignment)
- Community forum (threads, replies, moderation)
- Certification (auto-certificate, CPD credits)
- Development plans (linked to SHIFT)

### What's Missing (🔴 Gaps)

#### 5.1 Lesson Player — Core UX Not Designed
- **Video player**: Custom player or YouTube/Vimeo embed? Playback speed controls? Captions/subtitles? Picture-in-picture?
- **Progress tracking UX**: Where is the progress bar? Top of screen? Side? Bottom? Does it show time remaining?
- **Lesson navigation**: Sidebar with all lessons? Previous/Next buttons? Breadcrumb? Can you jump to any lesson?
- **Note-taking**: Can students take notes during lessons? Where are notes stored? Are they searchable?
- **Transcript**: Are video transcripts available? Searchable? Downloadable?
- **Fullscreen mode**: For video and text content?
- **Distraction-free mode**: Option to hide sidebar and focus on content?
- **Resume playback**: Video resumes from last position? What about text lessons (scroll position)?

#### 5.2 Course Catalog — Browse Experience
- **Catalog layout**: Grid of cards? List view? Both? What info is on each card?
- **Filtering**: By difficulty, duration, topic, format (self-paced vs cohort)? What filters exactly?
- **Sorting**: Newest, most popular, highest rated, recommended?
- **Course preview**: Can users preview lessons before enrolling? Free preview lessons? Trailer video?
- **Reviews/ratings**: Can students rate courses? Leave reviews? Are these displayed?
- **Enrollment flow**: What happens when a user clicks "Enroll"? Instant enrollment? Payment step? Confirmation?

#### 5.3 Cohort-Based Courses — Not Designed
- **Cohort management**: How are cohorts created? Start dates? Capacity limits?
- **Cohort experience**: Do students in a cohort progress together? Is there a shared schedule?
- **Live sessions**: Zoom integration? Built-in video? Recording and replay?
- **Cohort community**: Is the community forum cohort-specific or course-wide?
- **Instructor role**: Is there an instructor role separate from admin? What can they do?

#### 5.4 Quiz & Assessment UX
- **Question types**: Multiple choice, true/false, short answer — what does each look like?
- **Instant feedback**: After each question? Or after completing the whole quiz?
- **Retry logic**: Can students retake quizzes? How many times? Does the best score count?
- **Passing score**: Is there a minimum passing score? What happens if they fail?
- **Timer**: Are quizzes timed? Is the timer visible?
- **Quiz review**: Can students review their answers after submission?

#### 5.5 Development Plans — Vague
- **Plan generation**: How are development plans created from SHIFT results? Auto-generated? Consultant-reviewed?
- **Plan UI**: What does a development plan look like? Timeline? Checklist? Kanban?
- **Goal tracking**: How are goals tracked? Manual update? Auto-detected from course completion?
- **Plan updates**: Can plans be modified? By the student? By the consultant?
- **Link to courses**: How are recommended courses surfaced within the plan?

#### 5.6 Video Infrastructure
- **Hosting**: Supabase Storage? Mux? Cloudflare Stream? AWS S3 + CloudFront?
- **Transcoding**: What formats/resolutions? Adaptive bitrate streaming?
- **DRM**: Any content protection needed?
- **Bandwidth costs**: Video is expensive. What's the cost model? Per-student? Per-course?
- **Upload flow**: How do admins upload videos? Progress indicator? Auto-transcoding?

#### 5.7 Live Sessions
- **Integration**: Zoom? Whereby? Google Meet? Built-in WebRTC?
- **Scheduling**: How are live sessions scheduled? Calendar integration?
- **Attendance tracking**: Automatic? Manual?
- **Recording**: Auto-record? Where are recordings stored? Who can access?
- **Chat/Q&A during session**: Built-in or external tool?

#### 5.8 Certificate Design
- **Certificate template**: What does it look like? LYC branding? Customizable per course?
- **Verification**: How does the verification URL work? Public page? QR code?
- **LinkedIn sharing**: One-click LinkedIn add? What metadata is included?
- **PDF generation**: What library? What quality? Printable?
- **Bulk certificates**: Can admins issue certificates manually?

#### 5.9 Gamification in Learning
- **XP/Streaks**: How do learning streaks work? What resets a streak? Can streaks be frozen?
- **Badges**: What badges exist? Course completion? Perfect quiz score? 7-day streak?
- **Leaderboard**: Is there a leaderboard? Per-course? Platform-wide? Opt-in?
- **Points redemption**: Can learning points be redeemed for anything? Council credits? Discounts?

---

## 6. CROSS-CUTTING GAPS (All Portals)

### 6.1 Unified Navigation Architecture
No portal defines how the top-level navigation works across the entire platform. A user might be:
- A Council member who also takes Academy courses
- A consultant who also accesses the internal portal
- A client admin who also uses DEX AI

**What's needed:**
- Global navigation bar/header design
- How do portals relate to each other in the nav?
- Single sign-on across all portals?
- User avatar dropdown with cross-portal links?
- Breadcrumb structure?

### 6.2 Design System / Component Library
No shared component library is defined. Every portal will look different without this.

**What's needed:**
- Typography scale (headings, body, captions)
- Color palette (primary, secondary, accent, success, warning, error, info)
- Button variants (primary, secondary, ghost, danger, sizes)
- Form elements (input, select, checkbox, radio, toggle, textarea)
- Card components
- Table components
- Modal/dialog patterns
- Toast/notification patterns
- Loading states (skeleton screens, spinners)
- Empty states
- Error states
- Badge/tag components
- Avatar component
- Tooltip patterns

### 6.3 Mobile Strategy
No portal has explicit mobile design.

**What's needed:**
- Responsive breakpoints (mobile, tablet, desktop)
- Which features are mobile-first vs. desktop-only?
- Navigation pattern on mobile (hamburger? Bottom nav? Swipe?)
- Form UX on mobile (multi-step? Condensed?)
- Video player on mobile
- Touch targets (min 44x44px)
- Assessment/quiz UX on small screens

### 6.4 Email Template System
Zero email templates are designed.

**What's needed:**
- Welcome email (per portal)
- Password reset
- Email verification
- Interview reminder (candidate + client)
- Coaching reminder (Council member)
- Event reminder
- Application status change
- Report delivery (monthly briefing, quarterly report)
- Membership renewal reminder
- Payment receipt / invoice
- Weekly digest (per portal?)

### 6.5 Help & Support System
No help system anywhere.

**What's needed:**
- FAQ pages per portal
- In-app tooltips/guides for first-time users
- Help center / knowledge base
- Contact support form
- Chat widget? (Intercom? Crisp? Custom?)
- Contextual help (question mark icons next to complex features)

### 6.6 Feedback & Bug Reporting
No way for users to provide feedback.

**What's needed:**
- "Report a problem" button on every page
- Feature request form
- NPS surveys (post-interaction)
- Beta feedback mechanism
- Internal bug tracking integration

### 6.7 Accessibility (WCAG 2.1 AA)
No accessibility spec anywhere.

**What's needed:**
- Color contrast ratios
- Keyboard navigation for all interactive elements
- Screen reader compatibility
- Focus indicators
- Alt text for images
- Form labels and error messages
- ARIA landmarks
- Skip navigation links

### 6.8 Performance Budget
No performance targets defined.

**What's needed:**
- Page load targets (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- Image optimization strategy (WebP, lazy loading)
- Code splitting strategy
- API response time targets
- Caching strategy
- CDN configuration

### 6.9 Internationalization (i18n)
- Chinese translations are mentioned in DB schema (title_zh, description_zh) but no i18n framework is defined
- Language switcher UI?
- RTL support? (Probably not needed for current markets)
- Date/time formatting per locale?
- Number formatting (¥ vs $ vs €)?

### 6.10 Analytics & Tracking
- GA4 events are mentioned in the Council landing spec but no comprehensive analytics plan
- What events are tracked per portal?
- Conversion funnels (application → assessment → placement)?
- User behavior tracking?
- A/B testing infrastructure?

---

## 7. PRIORITY MATRIX

### 🔴 Must-Have Before Launch (P0)
| Gap | Portal | Why |
|-----|--------|-----|
| Design System / Component Library | All | Without this, portals will be inconsistent and ugly |
| Unified Navigation Architecture | All | Users need to understand how the platform fits together |
| Mandate Creation Wizard | Client | Core client workflow — can't use platform without it |
| Candidate Status Communication | Candidate | Ghosting candidates = reputation destruction |
| Application Form UX Detail | Candidate | First impression for job seekers |
| ASSESS Assessment UX | Candidate | Core differentiator — needs to be polished |
| Mobile Strategy | All | 50%+ of candidates will access via mobile |
| Email Templates | All | Primary communication channel |
| Interview Scheduling | Client + Candidate | Core recruitment workflow |
| Accessibility Basics | All | Legal requirement in many jurisdictions |

### 🟡 Important for Quality (P1)
| Gap | Portal | Why |
|-----|--------|-----|
| Community Feed Design | Council | Core engagement mechanism |
| Member Directory Privacy | Council | Privacy is critical for senior professionals |
| Coaching Booking Detail | Council | Revenue-generating feature |
| AI Matching UI | Internal | Consultants need to understand AI recommendations |
| Workflow Automation | Internal | Efficiency multiplier |
| Lesson Player UX | Academy | Core learning experience |
| Video Infrastructure | Academy | Technical foundation for video courses |
| Job Alerts | Candidate | Re-engagement mechanism |
| Consultant Communication | Client | Relationship management |
| Help & Support | All | First users WILL get stuck |

### 🟢 Nice to Have (P2)
| Gap | Portal | Why |
|-----|--------|-----|
| Gamification | Academy | Engagement booster, not essential |
| Live Sessions | Academy | Can start with recorded only |
| Cohort-Based Courses | Academy | Can start with self-paced |
| Certificate Design | Academy | Can iterate on template |
| Bulk Operations Detail | Internal | Power user feature |
| White-Label | Client | Enterprise feature, later |
| Advanced Reporting | Internal + Client | Can start with basic |
| A/B Testing | All | Optimization, not launch-critical |

---

## 8. RECOMMENDED NEXT STEPS

1. **Design System First** — Before Trae writes another component, define the design system. One spec file: `16_Design_System_Spec.md`. Typography, colors, buttons, forms, cards, modals, loading states, responsive breakpoints. This is the foundation everything else builds on.

2. **Unified Navigation** — `17_Navigation_Architecture_Spec.md`. How the 5 portals connect. Global header. Sidebar structure per portal. Mobile nav. Breadcrumbs.

3. **Fill Critical UX Gaps** — For each portal, write a "UX Detail" addendum to the existing spec covering the 🔴 P0 gaps. These don't need to be full new specs — they're补充 (supplements) to existing specs.

4. **Email Templates** — `18_Email_Templates_Spec.md`. Define all transactional and notification emails. Copy, layout, variables, send triggers.

5. **Update GitHub Issues** — Create issues for each major gap identified above. Current 32 issues cover the "what to build" but miss the "how it should work."

6. **Interview Scheduling** — This is a cross-portal feature (client schedules, candidate confirms, consultant coordinates). Needs its own spec or at least a clear design across all 3 portals involved.

---

## Appendix: Spec Coverage Score

| Portal | Pages Specced | UX Detail | Interaction Design | Edge Cases | Overall |
|--------|:------------:|:---------:|:-----------------:|:----------:|:-------:|
| Council | 🟢 Good | 🟡 Medium | 🟡 Medium | 🔴 Weak | 6/10 |
| Client | 🟢 Good | 🟡 Medium | 🔴 Weak | 🔴 Weak | 5/10 |
| Candidate | 🟢 Good | 🟡 Medium | 🔴 Weak | 🔴 Weak | 5/10 |
| Internal | 🟢 Great | 🟢 Good | 🟡 Medium | 🟡 Medium | 7/10 |
| Academy | 🟡 Schema only | 🔴 Weak | 🔴 Weak | 🔴 Weak | 3/10 |
| Cross-cutting | 🔴 Missing | 🔴 Missing | 🔴 Missing | 🔴 Missing | 2/10 |

**Overall Platform Readiness: 4.7/10** — Good structural foundation, but product design depth is insufficient for Trae to build a polished, production-ready experience without making dozens of unilateral decisions.
