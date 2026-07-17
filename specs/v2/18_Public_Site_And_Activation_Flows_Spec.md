# Public Marketing Site & User Activation Flows Spec

**Version:** 1.0  
**Created:** 2026-07-17  
**Status:** Draft  
**Priority:** 🔴 P0 — Must be designed before launch

---

## Overview

This spec covers the **public-facing marketing site** (the front door) and **user activation flows** (first-run experience per portal). These are critical for conversion and retention but currently have zero design.

**What this spec covers:**
1. Public marketing site (homepage, pricing, features, testimonials, CTAs)
2. User activation flows (per portal first-run experience)
3. Conversion moment UX (upgrade prompts, paywall design)
4. Data export & customization design

**What this spec does NOT cover:**
- Portal-specific page designs (covered in individual portal specs)
- Design system / component library (covered in spec 17)
- Email templates (separate spec needed)

---

## Part 1: Public Marketing Site

### 1.1 Site Structure

```
lyc-intelligence.com/
├── / (Homepage)
├── /pricing
├── /features
│   ├── /features/for-executives
│   ├── /features/for-council
│   ├── /features/for-clients
│   └── /features/for-candidates
├── /testimonials (or /case-studies)
├── /faq
├── /book-demo (enterprise CTA)
├── /council/* (covered in spec 05)
├── /login
├── /signup
└── /legal/* (covered in spec 14)
```

### 1.2 Homepage Design

#### Hero Section

**Layout:**
- Full-width hero with background image/video (abstract, professional, not stock photos)
- Headline: "The AI-Native Platform for Executive Intelligence"
- Subheadline: "Connect with top executives, access market intelligence, and make data-driven leadership decisions."
- Two CTAs:
  - Primary: "Start for Executive Introduction" (B2C executive)
  - Secondary: "Book a Demo" (enterprise/client)

**Below the fold:**
- Social proof bar: "Trusted by executives from" + logo carousel (if available, otherwise remove)
- 3-column value proposition:
  1. **For Executives:** "Access on-demand executive intelligence. Get answers from peers who've been there."
  2. **For Council Members:** "Join an exclusive network. Share expertise. Grow your influence."
  3. **For Companies:** "Data-driven executive search. AI-powered candidate matching."
- Feature highlight section (3-4 key features with icons)
- Testimonial carousel (2-3 quotes)
- Final CTA: "Ready to get started?" + "Start for Executive Introduction" button

#### Design Notes:
- Keep it clean, professional, not overly salesy
- Use portal accent colors subtly (Council purple, Client teal, etc.)
- Mobile: Stack columns vertically, reduce font sizes, CTAs full-width
- Load time: < 2 seconds (optimize images, lazy load below fold)

### 1.3 Pricing Page

**Layout:**
- Headline: "Simple, transparent pricing"
- Subheadline: "Start for Executive Introduction. Upgrade when you're ready."

**Pricing Tiers (2 sections):**

#### Section 1: Credit Packs (B2C Executives)

| Starter | Professional | Executive |
|---------|--------------|-----------|
| ¥99 | ¥399 | ¥799 |
| 10 credits | 50 credits | 150 credits |
| Access to Executive Introduction | Access to Executive Introduction | Access to Executive Introduction |
| Basic intelligence reports | Advanced intelligence reports | All intelligence reports |
| Email support | Priority support | Priority support |
| | | Dedicated account manager |

**CTA per tier:** "Get Started" (all same button, just different pack selected)

**Notes:**
- Credits never expire
- Credits used for: Executive Introduction messages, premium content, assessments
- Show "Most Popular" badge on Professional tier
- Currency: Show CNY for China-based visitors, USD for others (geo-detect)

#### Section 2: Council Memberships (Annual)

| Founding | Individual | Corporate | PE Partner |
|----------|------------|-----------|------------|
| ¥2,800/yr | ¥3,800/yr | ¥12,000/yr | ¥25,000/yr |
| Limited to first 50 members | Open to all executives | For companies (5 seats) | For PE/VC firms (10 seats) |
| All Council features | All Council features | All Council features | All Council features |
| Founding member badge | | Company branding | Deal flow access |
| Lifetime price lock | | Admin dashboard | Portfolio company insights |
| | | API access (future) | Custom reports |

**CTA per tier:**
- Founding: "Join as Founding Member" (show "X spots remaining" if < 50)
- Individual: "Join Council"
- Corporate: "Contact Sales"
- PE Partner: "Contact Sales"

**FAQ section below pricing:**
- "What happens if I run out of credits?" → "You can send up to 5 Executive Introduction messages for free. After that, you'll need to purchase a credit pack."
- "Can I switch between credit packs?" → "Yes, you can upgrade anytime. Unused credits carry over."
- "Is there a contract for Council membership?" → "No, Council membership is annual but you can cancel anytime. No refunds for partial years."
- "What's the difference between Executive Introduction and Council?" → "Executive Introduction is for occasional access to executive intelligence. Council is for executives who want to build their personal brand, network with peers, and access exclusive content."

### 1.4 Features Tour

**Structure:**
- Landing page: `/features` with 4 tabs (one per user type)
- Each tab shows:
  - 3-4 key features with screenshots/mockups
  - Use case examples
  - CTA at bottom: "Get started" or "Book a demo"

#### For Executives Tab
1. **Executive Introduction:** "Send a message to any executive in our network. Get answers in 48 hours."
   - Screenshot: Message composer + response preview
2. **Intelligence Reports:** "Access AI-generated market intelligence, salary benchmarks, and leadership insights."
   - Screenshot: Report preview with charts
3. **Academy:** "Learn from top executives. Courses on leadership, strategy, and executive presence."
   - Screenshot: Course player + certificate
4. **Community:** "Join discussions with peers. Ask questions, share experiences."
   - Screenshot: Community feed with post example

#### For Council Tab
1. **Personal Brand:** "Build your profile. Showcase your expertise. Get discovered."
   - Screenshot: Council member profile
2. **Community:** "Engage with a curated network of executives. Share insights."
   - Screenshot: Community feed + rich post editor
3. **Coaching:** "Offer 1:1 coaching sessions. Monetize your expertise."
   - Screenshot: Coaching booking flow
4. **Intelligence:** "Access exclusive reports. Contribute to APAC executive intelligence."
   - Screenshot: Intelligence dashboard

#### For Clients Tab
1. **AI-Powered Search:** "Find the right executive fast. AI matches you to candidates based on your needs."
   - Screenshot: Candidate shortlist with match scores
2. **Mandate Management:** "Track your open roles. Manage candidates in one place."
   - Screenshot: Mandate pipeline view
3. **Intelligence:** "Get market insights. Salary benchmarks. Competitor analysis."
   - Screenshot: Company 360° intelligence report
4. **Consultant Access:** "Work directly with LYC consultants. Get expert guidance."
   - Screenshot: Consultant chat / collaboration view

#### For Candidates Tab
1. **Browse Mandates:** "Find executive roles at top companies. Filter by industry, location, level."
   - Screenshot: Mandate list with filters
2. **Apply in One Click:** "Apply to any role with your profile. No need to rewrite your resume."
   - Screenshot: Application form (pre-filled from profile)
3. **ASSESS:** "Take our diagnostic assessment. Get AI-powered insights into your leadership style."
   - Screenshot: ASSESS result preview (radar chart)
4. **Track Applications:** "See where you stand. Get feedback. Improve your chances."
   - Screenshot: Application status timeline

### 1.5 Testimonials / Case Studies

**Layout:**
- Carousel on homepage (2-3 quotes)
- Dedicated page: `/testimonials` with full case studies

**Content needed:**
- 3-5 executive testimonials (B2C users)
- 2-3 Council member testimonials
- 1-2 client company case studies
- 1-2 candidate success stories

**Format per testimonial:**
- Quote (2-3 sentences)
- Name, title, company (or "Anonymous" if preferred)
- Photo (optional, with consent)
- For case studies: Problem → Solution → Result format

**Note:** If no testimonials exist yet, remove this section from v1. Don't use fake testimonials.

### 1.6 FAQ Page

**Structure:**
- Accordion-style FAQ
- Grouped by topic: General, Pricing, Council, Client, Candidate, Technical

**Sample questions:**

**General:**
- What is LYC Intelligence?
- How is this different from LinkedIn?
- Is my data secure?
- Can I delete my account?

**Pricing:**
- What are credits?
- How many credits do I need?
- Do credits expire?
- Can I get a refund?
- What payment methods do you accept?

**Council:**
- How do I join the Council?
- What's the difference between Founding and Individual membership?
- Can I cancel my Council membership?
- What benefits do Council members get?

**Client:**
- How do I create a mandate?
- How does AI matching work?
- Can I work with a consultant?
- How much does it cost?

**Candidate:**
- How do I apply for a role?
- What is ASSESS?
- Can I see why I was rejected?
- How do I improve my profile?

**Technical:**
- What browsers are supported?
- Is there a mobile app?
- How do I reset my password?
- How do I contact support?

**Note:** FAQ should be searchable. Add a search bar at top.

### 1.7 Book a Demo (Enterprise CTA)

**Flow:**
1. User clicks "Book a Demo" (from homepage, pricing page, or features page)
2. Form appears (modal or dedicated page):
   - Name (required)
   - Company (required)
   - Email (required)
   - Phone (optional)
   - Company size (dropdown: 1-50, 51-200, 201-500, 501-1000, 1000+)
   - What are you looking for? (checkboxes: Executive search, Intelligence reports, Consulting, Other)
   - Message (optional, textarea)
3. Submit → "Thanks! We'll be in touch within 24 hours." + CTA to start Executive Introduction
4. Kevin receives email notification with form data
5. Kevin or sales team follows up within 24 hours

**Design notes:**
- Keep form short (only required fields)
- Show privacy notice: "We respect your privacy. No spam."
- Mobile: Full-screen form, large inputs

---

## Part 2: User Activation Flows

### 2.1 B2C Executive Activation (Executive Introduction User)

**Goal:** User sends their first Executive Introduction message within 5 minutes of signing up.

**Flow:**
1. **Signup:** Email/password or Google OAuth
2. **Welcome modal:** "Welcome to LYC Intelligence! Let's get you started."
   - 3 options: "Send a message," "Browse intelligence," "Explore Council"
   - Default highlight: "Send a message" (primary CTA)
3. **If "Send a message":**
   - Show search bar: "Who do you want to talk to?"
   - Pre-fill with example: "Try searching for 'CTO Shanghai' or 'VP Sales Beijing'"
   - User searches → sees list of executives
   - Clicks executive → sees profile preview
   - Clicks "Send message" → composer opens
   - **Free message prompt:** "You have 1 free Executive Introduction message. Use it wisely!"
   - User writes message → sends
   - **Success screen:** "Message sent! You'll get a response within 48 hours. We'll email you when they reply."
   - CTA: "Browse more executives" or "View your messages"
4. **If user doesn't send message within 5 minutes:**
   - Show toast: "Need help getting started? [Watch a 30-second demo]"
   - After 24 hours (if no message sent): Send email: "You haven't used your free message yet. Here's how to get started..."

**Activation metric:** % of signups who send at least 1 message within 24 hours

### 2.2 Council Member Activation

**Goal:** New Council member completes profile, makes 1 post, and connects with 3 members within first week.

**Flow:**
1. **Signup (after payment):** Redirect to onboarding wizard
2. **Step 1: Profile setup**
   - Upload photo (required)
   - Write bio (required, 100-500 chars)
   - Select expertise areas (required, pick 3-5)
   - Add LinkedIn URL (optional)
   - **Progress bar:** "Step 1 of 3"
3. **Step 2: Discover members**
   - Show curated list of 10 Council members (based on expertise overlap, geography)
   - "Connect with 3 members to get started"
   - Each member card: Photo, name, title, expertise, "Connect" button
   - User clicks "Connect" → connection request sent (or auto-connected, depending on privacy settings)
   - **Progress bar:** "Step 2 of 3" (X/3 connections made)
4. **Step 3: Make your first post**
   - "Share your first insight with the community"
   - Rich text editor opens
   - Prompts: "What's a leadership challenge you've faced recently?" or "What's the best advice you've received?"
   - User writes post → publishes
   - **Success screen:** "You're all set! Welcome to the Council."
   - CTA: "View your profile" or "Browse community"
5. **Post-onboarding:**
   - Show dashboard with: "Complete your profile" (if incomplete), "Connect with more members", "Browse community", "Book a coaching session"
   - **Email sequence (over 7 days):**
     - Day 1: "Welcome to the Council! Here's how to get started..."
     - Day 3: "You haven't made your first post yet. Here are some ideas..."
     - Day 7: "You've connected with X members. Keep building your network!"

**Activation metric:** % of new Council members who complete profile + make 1 post + connect with 3 members within 7 days

### 2.3 Candidate Activation

**Goal:** Candidate completes profile and applies to 1 mandate within 24 hours of signing up.

**Flow:**
1. **Signup:** Email/password or LinkedIn OAuth (pre-fill profile from LinkedIn)
2. **Profile completion wizard:**
   - **Step 1: Basic info** (pre-filled if LinkedIn OAuth)
     - Name, email, phone, location
   - **Step 2: Professional background**
     - Current company, title, years of experience
     - Past experience (add multiple)
     - Education
     - Skills (pick from list or type custom)
   - **Step 3: Preferences**
     - Target roles (checkboxes: CEO, CFO, CTO, VP, etc.)
     - Target industries
     - Target locations
     - Salary expectations (range)
   - **Step 4: Upload resume** (optional, but recommended)
     - "Upload your resume to make your profile more complete"
     - File upload (PDF, DOCX, max 5MB)
     - **AI parsing:** Extract experience, education, skills from resume → auto-fill profile
     - User reviews and confirms
3. **Post-wizard:**
   - Show dashboard: "Your profile is X% complete"
   - CTA: "Browse mandates" or "Take ASSESS"
   - **If "Browse mandates":**
     - Show list of mandates matching preferences
     - "Apply in one click" — profile auto-fills application
   - **If "Take ASSESS":**
     - Explain ASSESS: "Take our 20-minute diagnostic assessment. Get AI-powered insights into your leadership style."
     - CTA: "Start ASSESS"
     - User completes ASSESS → sees preview of results (full results unlocked after application or payment)
4. **If user doesn't complete profile within 24 hours:**
   - Send email: "Complete your profile to apply for executive roles"
   - Show in-app notification: "Your profile is X% complete. [Finish now]"

**Activation metric:** % of signups who complete profile (80%+) and apply to 1 mandate within 24 hours

### 2.4 Client Admin Activation

**Goal:** Client admin creates first mandate and invites team members within 48 hours of signing up.

**Flow:**
1. **Signup:** Email/password (no OAuth for B2B)
2. **Company setup wizard:**
   - **Step 1: Company info**
     - Company name, industry, size, location
     - Company logo (upload)
     - Company website
   - **Step 2: Team members**
     - "Invite your team to collaborate"
     - Add emails (comma-separated)
     - Role per member (Admin, Recruiter, Viewer)
     - Send invites
   - **Step 3: Create first mandate**
     - "Let's create your first mandate"
     - Guided wizard (multi-step form):
       - Job title, department, level
       - Location (remote, hybrid, onsite)
       - Key responsibilities (textarea)
       - Requirements (years of experience, skills, education)
       - Salary range
       - Internal notes (not visible to candidates)
     - **Save as draft** or **Publish**
3. **Post-wizard:**
   - Show dashboard: "Your first mandate is live. Here's what happens next..."
   - Explain: "Candidates will apply. Our AI will match you to the best candidates. You'll see them in your dashboard."
   - CTA: "View candidates" or "Create another mandate" or "Work with a consultant"
   - **If "Work with a consultant":**
     - Show form: "Tell us about your needs. A consultant will reach out within 24 hours."
     - Form: Mandate link, additional context, timeline, budget
     - Submit → Kevin/sales team notified
4. **If user doesn't create mandate within 48 hours:**
   - Send email: "You haven't created your first mandate yet. Here's how to get started..."
   - Show in-app notification: "Create your first mandate to find top executives"

**Activation metric:** % of signups who create 1 mandate within 48 hours

### 2.5 Internal User Activation (Consultants)

**Goal:** Consultant completes profile and manages first mandate within 24 hours of account creation.

**Flow:**
1. **Account created by admin** (Kevin or platform admin)
2. **First login:**
   - Welcome screen: "Welcome to LYC Intelligence. Let's get you set up."
   - **Step 1: Complete profile**
     - Photo, bio, expertise areas
     - Contact info (email, phone, LinkedIn)
   - **Step 2: View assigned mandates**
     - Show list of mandates (if any assigned)
     - If no mandates: "No mandates yet. Check back soon or contact your admin."
   - **Step 3: Explore dashboard**
     - Guided tour: "Here's your dashboard. You can see mandates, candidates, tasks, and reports."
     - Highlight key sections: Mandates, Candidates, Tasks, Intelligence
3. **Post-onboarding:**
   - Show dashboard with: "Complete your profile" (if incomplete), "View mandates", "View tasks"
   - **If mandates assigned:**
     - Show mandate list → click mandate → see candidates, tasks, activity
     - CTA: "Review candidates" or "Add a task"
   - **If no mandates:**
     - Show empty state: "No mandates assigned yet. Contact your admin or check back soon."
4. **Training resources:**
   - Link to Academy courses (if available): "Learn how to use LYC Intelligence"
   - Link to help docs / FAQ

**Activation metric:** % of consultants who complete profile and review 1 mandate within 24 hours

### 2.6 Academy Student Activation

**Goal:** Student enrolls in first course and completes first lesson within 48 hours of signing up.

**Flow:**
1. **Signup:** Email/password or OAuth (if linked from another portal)
2. **Onboarding:**
   - Welcome screen: "Welcome to LYC Academy. Start learning from top executives."
   - **Step 1: Select interests**
     - Show list of course categories: Leadership, Strategy, Finance, Technology, etc.
     - User picks 2-3 interests
   - **Step 2: Recommended courses**
     - Show 3-5 courses based on interests
     - Each course: Title, instructor, duration, rating, "Enroll" button
   - **Step 3: Enroll in first course**
     - User clicks "Enroll" → enrolled
     - Show course curriculum
     - CTA: "Start lesson 1"
3. **Post-onboarding:**
   - Show dashboard: "Your courses" (enrolled courses), "Recommended courses", "Your progress"
   - **If user enrolls but doesn't start:**
     - Send email after 24 hours: "You haven't started your first lesson yet. Here's why you should..."
   - **If user completes first lesson:**
     - Show success message: "Great job! You've completed lesson 1. Keep going!"
     - Award XP (if gamification enabled)
     - CTA: "Continue to lesson 2" or "Browse more courses"

**Activation metric:** % of signups who enroll in 1 course and complete 1 lesson within 48 hours

---

## Part 3: Conversion Moment UX

### 3.1 Executive Introduction → Credit Pack Upgrade

**Trigger:** User has used their 1 free message and tries to send a 2nd message.

**Paywall screen:**
- Modal overlay (darkens background)
- Headline: "You've used your free Executive Introduction message"
- Subheadline: "Purchase a credit pack to continue connecting with executives."
- Show 3 credit packs (Starter, Professional, Executive) with prices and credit amounts
- **Highlight:** "Most Popular" on Professional tier
- CTA per tier: "Get Starter" / "Get Professional" / "Get Executive"
- Secondary CTA: "Learn more about credits" (link to pricing page)
- Close button (X) in top-right

**After purchase:**
- Success screen: "Thanks! You now have X credits. Send your message now."
- CTA: "Send message" (returns to composer)

### 3.2 B2C Executive → Council Membership Upgrade

**Trigger options:**
- User has sent 5+ Executive Introduction messages (power user)
- User views intelligence reports 3+ times
- User clicks "Join Council" from navigation or marketing page

**Upgrade prompt (in-app):**
- Toast notification (non-intrusive): "You're a power user! Unlock exclusive benefits with Council membership. [Learn more]"
- If user clicks "Learn more" → modal or dedicated page:
  - Headline: "Join the Council"
  - Benefits list: Community access, coaching, exclusive content, personal brand, etc.
  - Pricing tiers (Founding, Individual, Corporate, PE Partner)
  - CTA: "Join now" or "Book a call"

**Alternative:** Show upgrade prompt after 5th message: "You've sent 5 messages! Council members get unlimited messages + exclusive benefits. [Join Council]"

### 3.3 Credit Pack Upsell

**Trigger:** User has 0 credits remaining.

**Upsell screen:**
- Modal overlay
- Headline: "You're out of credits"
- Subheadline: "Purchase a credit pack to continue using LYC Intelligence."
- Show 3 credit packs
- CTA per tier: "Get Starter" / "Get Professional" / "Get Executive"
- Secondary CTA: "Learn more about credits"

**Alternative:** Show warning when user has 2 credits left: "You have 2 credits remaining. [Purchase more]"

### 3.4 Council Membership Renewal

**Trigger:** 30 days before membership expires.

**Email sequence:**
- **30 days before:** "Your Council membership expires in 30 days. Renew now to keep your benefits."
- **7 days before:** "Your Council membership expires in 7 days. Don't lose access to the community."
- **1 day before:** "Your Council membership expires tomorrow. Renew now."
- **On expiry:** "Your Council membership has expired. Renew to regain access."

**Renewal flow:**
- Email CTA → landing page: "Renew your Council membership"
- Show current tier + price
- CTA: "Renew now" (pre-filled with current tier)
- User clicks → payment flow (Stripe)
- Success: "Your membership has been renewed. Thanks for being part of the Council!"

### 3.5 Client → Consultant Engagement Upsell

**Trigger:** Client has created 3+ mandates but hasn't engaged a consultant.

**Upsell prompt:**
- In-app notification: "Looking for expert help? Work with a LYC consultant to find the right executive faster. [Learn more]"
- If user clicks → dedicated page:
  - Headline: "Work with a LYC Consultant"
  - Benefits: "Get expert guidance, access to our network, and faster results."
  - Form: "Tell us about your needs" (mandate link, additional context, timeline, budget)
  - Submit → Kevin/sales team notified

---

## Part 4: Data Export & Customization

### 4.1 Client Exports

**Candidate shortlist export:**
- Button: "Export to PDF" or "Export to Excel"
- PDF format:
  - Company logo at top
  - Mandate title, location, level
  - List of candidates: Name, photo, current title, match score, key qualifications
  - Sorted by match score (highest first)
  - Footer: "Generated by LYC Intelligence on [date]"
- Excel format:
  - Same data as PDF
  - Additional columns: Application date, status, notes
  - Filterable/sortable

**Mandate summary export:**
- Button: "Export mandate"
- PDF format:
  - Mandate title, department, level, location
  - Key responsibilities, requirements
  - Salary range
  - Number of candidates, pipeline status
  - Activity log (recent updates)

### 4.2 Consultant Exports

**Mandate summary export:**
- Same as client export
- Additional sections: Internal notes, task list, activity log

**Candidate profile export:**
- PDF format:
  - Candidate photo, name, contact info
  - Professional summary
  - Experience, education, skills
  - ASSESS results (if available)
  - Internal notes

### 4.3 Student Exports

**Certificate download:**
- Button: "Download certificate" (after course completion)
- PDF format:
  - LYC Academy logo
  - "Certificate of Completion"
  - Student name
  - Course title
  - Instructor name
  - Completion date
  - Unique certificate ID (for verification)
  - QR code (optional, links to verification page)

**Course progress export:**
- Button: "Export progress" (for HR / L&D purposes)
- Excel format:
  - Course title, enrollment date, completion date
  - Lessons completed, quizzes passed
  - Final score (if applicable)
  - Certificate ID (if issued)

### 4.4 Council Member Exports

**Network export:**
- Button: "Export connections" (for CRM integration)
- Excel format:
  - Connection name, title, company, expertise
  - Connection date
  - Last interaction date
  - Notes (if any)

**Activity export:**
- Button: "Export activity" (for personal records)
- Excel format:
  - Posts made, comments made, reactions received
  - Coaching sessions offered, completed
  - Dates

### 4.5 Report Customization

**Intelligence reports:**
- Filters: Date range, industry, location, company size
- Save custom view: "Save as default view" (per user)
- Export: "Download as PDF" or "Download as Excel"

**Dashboard customization:**
- Drag-and-drop widgets (for Internal Portal, Client Portal)
- Show/hide sections
- Save layout per user

---

## Implementation Notes for Trae

### File Structure

```
src/
├── app/
│   ├── (marketing)/
│   │   ├── page.tsx (Homepage)
│   │   ├── pricing/page.tsx
│   │   ├── features/page.tsx
│   │   ├── testimonials/page.tsx
│   │   ├── faq/page.tsx
│   │   └── book-demo/page.tsx
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── onboarding/
│   │       ├── executive/page.tsx
│   │       ├── council/page.tsx
│   │       ├── candidate/page.tsx
│   │       ├── client/page.tsx
│   │       └── student/page.tsx
│   └── api/
│       ├── book-demo/route.ts (handle demo request form)
│       └── export/
│           ├── candidates/route.ts
│           ├── mandate/route.ts
│           ├── certificate/route.ts
│           └── connections/route.ts
├── components/
│   ├── marketing/
│   │   ├── Hero.tsx
│   │   ├── PricingTable.tsx
│   │   ├── FeaturesTour.tsx
│   │   └── TestimonialCarousel.tsx
│   ├── onboarding/
│   │   ├── ExecutiveOnboarding.tsx
│   │   ├── CouncilOnboarding.tsx
│   │   ├── CandidateOnboarding.tsx
│   │   └── ClientOnboarding.tsx
│   └── export/
│       ├── ExportButton.tsx
│       └── ExportModal.tsx
└── lib/
    ├── pdf-generator.ts (generate PDF exports)
    └── excel-generator.ts (generate Excel exports)
```

### Key Components

**Marketing site:**
- Use design system components (spec 17)
- Hero section: Full-width background image + overlay + text
- Pricing table: Responsive grid (4 columns desktop, 1 column mobile)
- Features tour: Tabs (4 user types) + content panels
- Testimonial carousel: Auto-rotate every 5 seconds, manual navigation

**Onboarding wizards:**
- Multi-step form with progress bar
- Validate each step before proceeding
- Allow back/forward navigation
- Auto-save progress (if user drops off, resume on next login)

**Export functionality:**
- Use libraries: `jspdf` for PDF, `exceljs` for Excel
- Generate on client-side for small exports (< 100 rows)
- Generate on server-side for large exports (> 100 rows) → download link
- Show loading spinner during generation
- Show success toast after download

### Database Tables Needed

```sql
-- Book demo requests
CREATE TABLE book_demo_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company_size TEXT,
  interests TEXT[], -- array of: 'executive_search', 'intelligence', 'consulting', 'other'
  message TEXT,
  status TEXT DEFAULT 'new', -- 'new', 'contacted', 'converted'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Export history (track what users export)
CREATE TABLE export_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  export_type TEXT NOT NULL, -- 'candidates', 'mandate', 'certificate', 'connections', 'progress'
  export_format TEXT NOT NULL, -- 'pdf', 'excel'
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Metrics & Success Criteria

### Public Marketing Site
- **Homepage bounce rate:** < 50%
- **Pricing page conversion:** > 5% click "Get Started" or "Join Council"
- **Book demo form submissions:** > 10 per month (initial target)
- **FAQ page views:** > 20% of homepage visitors

### User Activation
- **B2C Executive:** > 30% send 1 message within 24 hours
- **Council Member:** > 50% complete profile + make 1 post + connect with 3 members within 7 days
- **Candidate:** > 40% complete profile + apply to 1 mandate within 24 hours
- **Client Admin:** > 60% create 1 mandate within 48 hours
- **Consultant:** > 80% complete profile + review 1 mandate within 24 hours
- **Student:** > 50% enroll in 1 course + complete 1 lesson within 48 hours

### Conversion
- **Executive Intro → Credit Pack:** > 10% upgrade after using free message
- **B2C → Council:** > 5% of power users (5+ messages) upgrade to Council
- **Credit Pack Upsell:** > 20% purchase when hitting 0 credits
- **Council Renewal:** > 80% renew before expiry

### Data Export
- **Export usage:** > 10% of active users export data at least once per month
- **Export types:** Track which exports are most popular (candidates, certificates, etc.)

---

## Next Steps

1. **Trae:** Build public marketing site (homepage, pricing, features, FAQ, book-demo)
2. **Trae:** Build onboarding wizards (per user type)
3. **Trae:** Build conversion moment UX (paywall modals, upgrade prompts)
4. **Trae:** Build export functionality (PDF/Excel generation)
5. **Kevin:** Write FAQ content (50+ questions)
6. **Kevin:** Collect testimonials (if available)
7. **Kevin:** Set up email sequences for activation (Day 1, Day 3, Day 7)
8. **Kevin:** Define conversion targets (what % upgrade at each step?)

---

**End of Spec**
