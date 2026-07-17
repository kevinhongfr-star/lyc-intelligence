# Email Templates, Admin Console & Analytics Spec

**Version:** 1.0  
**Created:** 2026-07-17  
**Status:** Draft  
**Priority:** 🟡 P1 — Needed before launch

---

## Overview

This spec covers the **final 3 product design gaps**:
1. Email templates (transactional, notifications, activation sequences, marketing)
2. Platform admin console (Kevin's control tower)
3. Analytics & event tracking (what to track, dashboards, success metrics)

These are the last pieces needed to lock the product design phase and move to execution.

---

## Part 1: Email Templates

### 1.1 Email Service

**Recommended:** SendGrid or Postmark
- Transactional emails (welcome, password reset, payment)
- High deliverability
- Template management
- Analytics (open rates, click rates)
- API for sending

**Alternative:** Resend (if Kevin prefers simpler API)

### 1.2 Email Template Design System

**Global styles:**
- Font: Inter (same as app)
- Primary color: #4070FF
- Logo: LYC Intelligence logo (top-left)
- Footer: Company info, unsubscribe link, social links
- Mobile responsive (single column, large touch targets)

**Email types:**
1. **Transactional** — Immediate, action-required
2. **Notification** — Informational, optional action
3. **Activation** — Onboarding sequences (Day 1, Day 3, Day 7)
4. **Marketing** — Reports, newsletters, announcements

### 1.3 Transactional Emails

#### Welcome Email
**Trigger:** User signs up (any portal)

**Subject:** "Welcome to LYC Intelligence — Let's get started"

**Content:**
```
[Logo]

Hi [First Name],

Welcome to LYC Intelligence! You're now part of a network of [X] executives across APAC.

Here's how to get started:
[CTA Button: "Complete Your Profile"] or [CTA Button: "Send Your First Message"]

If you have any questions, just reply to this email.

Best,
The LYC Intelligence Team

---
Footer: Unsubscribe | Privacy Policy | Terms of Service
```

**Variants per user type:**
- B2C Executive: CTA = "Send Your First Message" (highlight free message)
- Council Member: CTA = "Complete Your Profile" (highlight community access)
- Candidate: CTA = "Browse Mandates" or "Take ASSESS"
- Client Admin: CTA = "Create Your First Mandate"
- Student: CTA = "Start Your First Course"

#### Password Reset
**Trigger:** User requests password reset

**Subject:** "Reset your password"

**Content:**
```
[Logo]

Hi [First Name],

We received a request to reset your password. Click the button below to create a new password:

[CTA Button: "Reset Password"]

This link expires in 1 hour.

If you didn't request this, you can safely ignore this email.

Best,
The LYC Intelligence Team
```

#### Payment Confirmation
**Trigger:** User purchases credit pack or Council membership

**Subject:** "Payment confirmed — You're all set!"

**Content:**
```
[Logo]

Hi [First Name],

Thanks for your payment! Here's your receipt:

Order Summary:
- Product: [Credit Pack Professional / Council Individual Membership]
- Amount: ¥[Amount]
- Date: [Date]
- Order ID: [ID]

[For Credit Pack:]
You now have [X] credits. Use them to send Executive Introduction messages, access premium content, and more.

[For Council:]
Welcome to the Council! You now have access to:
✓ Community discussions
✓ Coaching sessions
✓ Exclusive intelligence reports
✓ Personal brand building

[CTA Button: "View Your Dashboard"]

Questions? Reply to this email.

Best,
The LYC Intelligence Team
```

#### Receipt / Invoice
**Trigger:** Monthly (for subscriptions) or after each payment

**Subject:** "Your receipt from LYC Intelligence"

**Content:**
```
[Logo]

Hi [First Name],

Here's your receipt for [Month Year]:

Invoice #[Number]
Date: [Date]

Item                          Qty    Price
[Product Name]                1      ¥[Amount]
                                      ─────────
                            Total:   ¥[Amount]

Payment Method: [Card ending in 1234]

Download PDF: [Link]

Questions? Reply to this email.

Best,
The LYC Intelligence Team
```

### 1.4 Notification Emails

#### New Message Received
**Trigger:** User receives a message (Executive Introduction, Council community, client inquiry)

**Subject:** "[Sender Name] sent you a message"

**Content:**
```
[Logo]

Hi [First Name],

[Sender Name] ([Sender Title] at [Company]) sent you a message:

---
[Message preview — first 100 characters]
---

[CTA Button: "View Message"]

You can also view all your messages in your dashboard:
[CTA Link: "Go to Messages"]

Best,
The LYC Intelligence Team
```

**Unsubscribe:** "Unsubscribe from message notifications"

#### Report Ready
**Trigger:** Intelligence report generated (cohort, monthly briefing, quarterly)

**Subject:** "Your [Report Type] is ready"

**Content:**
```
[Logo]

Hi [First Name],

Your [Cohort Intelligence Report / Monthly Intelligence Briefing / APAC Quarterly Report] is ready to view.

Report Summary:
- Title: [Report Title]
- Period: [Date Range]
- Key Insights: [3 bullet points]

[CTA Button: "View Report"]

This report is also available in your dashboard under "Intelligence Reports."

Best,
The LYC Intelligence Team
```

#### Membership Expiry Warning
**Trigger:** 30 days, 7 days, 1 day before Council membership expires

**Subject (30 days):** "Your Council membership expires in 30 days"
**Subject (7 days):** "Your Council membership expires in 7 days"
**Subject (1 day):** "Your Council membership expires tomorrow"

**Content:**
```
[Logo]

Hi [First Name],

Your Council membership will expire on [Date].

Renew now to keep access to:
✓ Community discussions
✓ Coaching sessions
✓ Exclusive intelligence reports
✓ Personal brand building

[CTA Button: "Renew Now"]

If you have any questions, reply to this email.

Best,
The LYC Intelligence Team
```

#### Application Status Change
**Trigger:** Candidate's application status changes (received, under review, interview, rejected, offered)

**Subject:** "Your application for [Job Title] — Status Update"

**Content:**
```
[Logo]

Hi [First Name],

Your application for [Job Title] at [Company] has been updated.

New Status: [Status]

[If "Interview":]
Great news! The company wants to interview you. We'll send you scheduling details soon.

[If "Rejected":]
We know this is disappointing. Here are some other roles that match your profile:
[3 recommended mandates]

[If "Offered":]
Congratulations! The company has made you an offer. Check your dashboard for details.

[CTA Button: "View Application"]

Best,
The LYC Intelligence Team
```

### 1.5 Activation Sequences

#### B2C Executive (Day 1, Day 3, Day 7)

**Day 1 — "Let's get you started"**
**Subject:** "Your free Executive Introduction message is waiting"

**Content:**
```
Hi [First Name],

Welcome to LYC Intelligence! You have 1 free Executive Introduction message.

Use it to:
✓ Ask a question to a peer who's been there
✓ Get advice on a leadership challenge
✓ Explore a new market or industry

[CTA Button: "Send Your Message"]

Need inspiration? Here are 3 popular executives to message:
[3 executive cards with name, title, company]

Best,
The LYC Intelligence Team
```

**Day 3 — "You haven't used your free message yet"**
**Subject:** "Your free message expires soon"

**Content:**
```
Hi [First Name],

Just a reminder: You have 1 free Executive Introduction message waiting.

Here's how it works:
1. Search for an executive (e.g., "CTO Shanghai" or "VP Sales Beijing")
2. Send a message (up to 500 characters)
3. Get a response within 48 hours

[CTA Button: "Send Your Message"]

Questions? Reply to this email.

Best,
The LYC Intelligence Team
```

**Day 7 — "Last chance to use your free message"**
**Subject:** "Your free message expires tomorrow"

**Content:**
```
Hi [First Name],

Your free Executive Introduction message expires tomorrow.

Don't miss this chance to connect with top executives across APAC.

[CTA Button: "Send Your Message"]

After your free message, you can purchase a credit pack to continue:
- Starter: 10 credits for ¥99
- Professional: 50 credits for ¥399 (Most Popular)
- Executive: 150 credits for ¥799

Best,
The LYC Intelligence Team
```

#### Council Member (Day 1, Day 3, Day 7)

**Day 1 — "Welcome to the Council"**
**Subject:** "Welcome to the Council — Here's how to get started"

**Content:**
```
Hi [First Name],

Welcome to the Council! You're now part of an exclusive network of [X] executives across APAC.

Here's how to make the most of your membership:

1. Complete your profile (2 min)
   [CTA Link: "Complete Profile"]

2. Connect with 3 members
   [CTA Link: "Discover Members"]

3. Make your first post
   [CTA Link: "Start a Discussion"]

Need help? Reply to this email.

Best,
The LYC Intelligence Team
```

**Day 3 — "You haven't made your first post yet"**
**Subject:** "Share your first insight with the Council"

**Content:**
```
Hi [First Name],

You've connected with [X] members. Now it's time to share your expertise.

Post ideas:
✓ "What's the biggest leadership challenge you've faced this year?"
✓ "What's the best advice you've received about [industry]?"
✓ "Here's what I learned from [experience]"

[CTA Button: "Make Your First Post"]

Your insights help build the community. Don't be shy!

Best,
The LYC Intelligence Team
```

**Day 7 — "Keep building your network"**
**Subject:** "You've been in the Council for 7 days — Here's what's next"

**Content:**
```
Hi [First Name],

You've been in the Council for 7 days. Here's your progress:
✓ Profile: [Complete / Incomplete]
✓ Connections: [X] members
✓ Posts: [X] posts
✓ Coaching sessions: [X] offered / [X] booked

Next steps:
- Connect with [X] more members to reach your goal
- Book a coaching session with [Council Member Name]
- Join the discussion: [Popular Thread Title]

[CTA Button: "Go to Dashboard"]

Best,
The LYC Intelligence Team
```

#### Candidate (Day 1, Day 3, Day 7)

**Day 1 — "Complete your profile"**
**Subject:** "Complete your profile to apply for executive roles"

**Content:**
```
Hi [First Name],

Welcome to LYC Intelligence! Your profile is [X]% complete.

Complete your profile to:
✓ Apply for executive roles in one click
✓ Get matched to relevant mandates
✓ Receive AI-powered career insights

[CTA Button: "Complete Profile"]

It only takes 5 minutes.

Best,
The LYC Intelligence Team
```

**Day 3 — "Browse mandates matching your profile"**
**Subject:** "[X] executive roles match your profile"

**Content:**
```
Hi [First Name],

Based on your profile, we found [X] executive roles that match your experience:

[3 mandate cards with title, company, location, match score]

[CTA Button: "Browse All Mandates"]

Apply in one click — no need to rewrite your resume.

Best,
The LYC Intelligence Team
```

**Day 7 — "Take ASSESS to unlock AI insights"**
**Subject:** "Unlock AI-powered career insights with ASSESS"

**Content:**
```
Hi [First Name],

You've been on LYC Intelligence for 7 days. Here's how to stand out:

Take ASSESS (20 min) and get:
✓ AI-powered leadership insights
✓ Personality & working style analysis
✓ Comparison to top executives
✓ Personalized development recommendations

[CTA Button: "Start ASSESS"]

Companies love candidates who understand themselves.

Best,
The LYC Intelligence Team
```

#### Client Admin (Day 1, Day 3, Day 7)

**Day 1 — "Create your first mandate"**
**Subject:** "Create your first mandate to find top executives"

**Content:**
```
Hi [First Name],

Welcome to LYC Intelligence! Let's find your next executive.

Create your first mandate in 5 minutes:
[CTA Button: "Create Mandate"]

Our AI will match you to the best candidates automatically.

Need help? Work with a LYC consultant:
[CTA Link: "Book a Consultant"]

Best,
The LYC Intelligence Team
```

**Day 3 — "You haven't created a mandate yet"**
**Subject:** "You haven't created your first mandate yet"

**Content:**
```
Hi [First Name],

You haven't created your first mandate yet. Here's what you're missing:

✓ AI-powered candidate matching
✓ Access to [X] executive profiles
✓ Automated application tracking
✓ Market intelligence reports

[CTA Button: "Create Mandate"]

It only takes 5 minutes.

Best,
The LYC Intelligence Team
```

**Day 7 — "Work with a consultant"**
**Subject:** "Get expert help with your executive search"

**Content:**
```
Hi [First Name],

Looking for the right executive? Work with a LYC consultant.

You'll get:
✓ Dedicated consultant assigned to your mandate
✓ Access to our full network (including passive candidates)
✓ Market intelligence and salary benchmarks
✓ Interview coordination and offer negotiation

[CTA Button: "Book a Consultant"]

Tell us about your needs, and we'll reach out within 24 hours.

Best,
The LYC Intelligence Team
```

#### Academy Student (Day 1, Day 3, Day 7)

**Day 1 — "Start your first course"**
**Subject:** "Start your first course today"

**Content:**
```
Hi [First Name],

Welcome to LYC Academy! Here are 3 courses recommended for you:

[3 course cards with title, instructor, duration, rating]

[CTA Button: "Browse All Courses"]

Each course includes:
✓ Video lessons from top executives
✓ Downloadable resources
✓ Certificate of completion
✓ Community discussion

Best,
The LYC Intelligence Team
```

**Day 3 — "You haven't started your first lesson yet"**
**Subject:** "You haven't started your first lesson yet"

**Content:**
```
Hi [First Name],

You enrolled in [Course Title] but haven't started yet.

Here's why you should start today:
✓ Learn from [Instructor Name], [Instructor Title]
✓ Get actionable insights you can apply immediately
✓ Earn your certificate in [X] hours

[CTA Button: "Start Lesson 1"]

It only takes 10 minutes to complete the first lesson.

Best,
The LYC Intelligence Team
```

**Day 7 — "Keep your streak alive"**
**Subject:** "Keep your learning streak alive"

**Content:**
```
Hi [First Name],

You've been learning for 7 days. Here's your progress:

✓ Courses enrolled: [X]
✓ Lessons completed: [X]
✓ Time spent learning: [X] hours
✓ Current streak: [X] days

Keep it up! Here's your next lesson:
[CTA Button: "Continue Learning"]

Best,
The LYC Intelligence Team
```

### 1.6 Marketing Emails

#### Monthly Intelligence Briefing
**Trigger:** 1st of each month

**Subject:** "APAC Executive Intelligence Briefing — [Month Year]"

**Content:**
```
[Logo]

Hi [First Name],

Here's your monthly intelligence briefing for [Month Year].

Key Insights:
1. [Insight 1 — e.g., "CTO demand up 23% in Southeast Asia"]
2. [Insight 2 — e.g., "Average executive compensation up 8% YoY"]
3. [Insight 3 — e.g., "Remote executive roles increased 45%"]

[CTA Button: "View Full Report"]

Trending Topics:
- [Topic 1]
- [Topic 2]
- [Topic 3]

Best,
The LYC Intelligence Team
```

#### Quarterly APAC Report
**Trigger:** End of quarter (Jan, Apr, Jul, Oct)

**Subject:** "APAC Executive Intelligence Report — Q[X] [Year]"

**Content:**
```
[Logo]

Hi [First Name],

Your quarterly APAC Executive Intelligence Report is ready.

This quarter:
✓ [X] new executive mandates
✓ [X]% change in demand by role
✓ [X]% change in average compensation
✓ Top industries: [List]

[CTA Button: "View Full Report"]

Key Takeaways:
- [Takeaway 1]
- [Takeaway 2]
- [Takeaway 3]

Best,
The LYC Intelligence Team
```

### 1.7 Email Design Notes

**Mobile optimization:**
- Single column layout
- Font size: 16px minimum
- Buttons: 44px minimum height
- Images: Max 600px width, responsive

**Accessibility:**
- Alt text for all images
- High contrast (4.5:1 minimum)
- Descriptive link text (not "click here")
- Plain text version available

**Testing:**
- Test in Gmail, Outlook, Apple Mail, mobile apps
- Check spam score (aim for < 2.0)
- Verify all links work
- Test unsubscribe flow

---

## Part 2: Platform Admin Console

### 2.1 Overview

**Purpose:** Kevin's control tower for running the business.

**Access:** Only Kevin (and future platform admins)

**URL:** `/admin` (separate from portal navigation)

### 2.2 Admin Dashboard

**Layout:**
- Left sidebar: Navigation (Dashboard, Users, Organizations, Revenue, System, Settings)
- Main area: Dashboard widgets

**Dashboard widgets:**
1. **Key Metrics (top row)**
   - Total users (by type: B2C, Council, Client, Candidate, Student)
   - MRR (Monthly Recurring Revenue)
   - Active mandates
   - Active courses

2. **Revenue Chart**
   - Line chart: MRR over last 12 months
   - Breakdown by product (Credit Packs, Council Memberships, Client Subscriptions)

3. **User Growth Chart**
   - Line chart: New signups per day (last 30 days)
   - Breakdown by user type

4. **Recent Activity Feed**
   - New signups (last 10)
   - New payments (last 10)
   - Support tickets (last 10)

5. **System Health**
   - API status (green/yellow/red)
   - Database status
   - Email delivery rate
   - Error rate (last 24h)

### 2.3 Users Management

**Table view:**
- Columns: Name, Email, User Type, Status, Created Date, Last Login
- Filters: User type, status (active, suspended, deleted)
- Search: By name or email
- Actions: View profile, suspend user, delete user, reset password

**User detail page:**
- Profile info (name, email, photo, user type)
- Account status (active, suspended, deleted)
- Created date, last login
- Payment history (credit packs, Council membership)
- Activity log (posts, messages, applications, course enrollments)
- Notes (admin-only)

### 2.4 Organizations Management

**Table view:**
- Columns: Company Name, Industry, Size, Admin, Mandates, Created Date
- Filters: Industry, size
- Search: By company name
- Actions: View company, suspend company, delete company

**Company detail page:**
- Company info (name, industry, size, location, logo)
- Admin users (list of admins with roles)
- Mandates (list of all mandates)
- Payment history (subscriptions, credit packs)
- Activity log (mandate creations, applications, hires)

### 2.5 Revenue Management

**Overview:**
- MRR (Monthly Recurring Revenue)
- ARR (Annual Recurring Revenue)
- Total revenue (last 12 months)
- Revenue by product (Credit Packs, Council, Client)

**Charts:**
- Revenue over time (line chart)
- Revenue by product (pie chart)
- Revenue by user type (bar chart)

**Transactions table:**
- Columns: Date, User, Product, Amount, Status
- Filters: Date range, product, status (completed, refunded, failed)
- Search: By user or transaction ID
- Actions: View receipt, issue refund

### 2.6 System Health

**Overview:**
- API status (green/yellow/red)
- Database status
- Email delivery rate
- Error rate (last 24h)
- Active users (last 24h)

**Logs:**
- API request logs (last 100)
- Error logs (last 100)
- Email delivery logs (last 100)

**Actions:**
- Restart services (if needed)
- Clear cache
- Run diagnostics

### 2.7 Content Moderation

**Queue:**
- Reported posts (community, Council)
- Reported messages
- Reported profiles
- Flagged content (auto-detected)

**Actions:**
- View content
- Approve (remove flag)
- Remove content
- Suspend user
- Ban user

### 2.8 Feature Flags

**List:**
- Feature name
- Status (enabled/disabled)
- Rollout % (0-100%)
- Affected user types

**Actions:**
- Toggle feature on/off
- Adjust rollout %
- Add/remove user types

### 2.9 Audit Log

**Table view:**
- Columns: Timestamp, User, Action, Resource, Details
- Filters: Date range, user, action type
- Search: By user or action
- Actions: View details

**Actions tracked:**
- User created, updated, deleted
- Mandate created, updated, deleted
- Payment processed, refunded
- Content posted, removed
- Feature flag changed

### 2.10 Admin Console Design Notes

**Security:**
- 2FA required for admin access
- IP whitelist (optional)
- All actions logged in audit log
- Session timeout: 30 minutes

**Performance:**
- Paginate all tables (50 rows per page)
- Lazy load charts
- Cache key metrics (refresh every 5 minutes)

**Implementation:**
- Use Supabase for data queries
- Use Chart.js or Recharts for charts
- Use Design System components (spec 17)

---

## Part 3: Analytics & Event Tracking

### 3.1 Analytics Service

**Recommended:** PostHog (self-hosted or cloud)
- Product analytics (events, funnels, cohorts)
- Session recording
- Feature flags
- A/B testing
- Free tier available

**Alternative:** Mixpanel or Amplitude (if Kevin prefers)

### 3.2 Events to Track

#### Signup & Onboarding
- `user_signup` — User signs up (properties: user_type, referral_source)
- `profile_completed` — User completes profile (properties: user_type, time_to_complete)
- `onboarding_completed` — User completes onboarding wizard (properties: user_type, steps_completed)

#### Activation
- `first_message_sent` — B2C executive sends first message (properties: recipient_type)
- `first_post_created` — Council member creates first post (properties: post_type)
- `first_application_submitted` — Candidate applies to first mandate (properties: mandate_id)
- `first_mandate_created` — Client admin creates first mandate (properties: mandate_type)
- `first_lesson_completed` — Student completes first lesson (properties: course_id)

#### Engagement
- `message_sent` — User sends message (properties: sender_type, recipient_type)
- `post_created` — User creates post (properties: post_type, portal)
- `comment_created` — User creates comment (properties: post_id)
- `course_enrolled` — User enrolls in course (properties: course_id)
- `lesson_completed` — User completes lesson (properties: lesson_id, time_spent)
- `assessment_started` — User starts ASSESS (properties: user_id)
- `assessment_completed` — User completes ASSESS (properties: user_id, score)

#### Conversion
- `credit_pack_purchased` — User buys credit pack (properties: pack_type, amount)
- `council_membership_purchased` — User buys Council membership (properties: tier, amount)
- `upgrade_to_council` — B2C user upgrades to Council (properties: previous_spend)
- `demo_requested` — User requests demo (properties: company_size, interests)

#### Retention
- `user_churned` — User hasn't logged in for 30 days (properties: user_type, last_activity)
- `membership_cancelled` — User cancels Council membership (properties: tier, tenure)
- `membership_renewed` — User renews Council membership (properties: tier)

#### Support
- `support_ticket_created` — User creates support ticket (properties: category, priority)
- `support_ticket_resolved` — Ticket resolved (properties: resolution_time)

### 3.3 Dashboards

#### Executive Dashboard (Kevin)
**Metrics:**
- Total users (by type)
- MRR / ARR
- Activation rate (by user type)
- Churn rate (by user type)
- NPS (if tracked)

**Charts:**
- User growth (line chart)
- Revenue growth (line chart)
- Activation funnel (bar chart)
- Churn by user type (pie chart)

#### Product Dashboard
**Metrics:**
- Daily active users (DAU)
- Weekly active users (WAU)
- Monthly active users (MAU)
- Feature usage (by portal)
- Session duration

**Charts:**
- DAU/WAU/MAU over time (line chart)
- Feature usage heatmap
- Session duration distribution

#### Marketing Dashboard
**Metrics:**
- Signups by referral source
- Conversion rate (visitor → signup)
- Email open rates
- Email click rates

**Charts:**
- Signups by source (pie chart)
- Conversion funnel (bar chart)
- Email performance over time

### 3.4 Success Metrics Per Portal

#### B2C Executive
- **Activation:** >30% send 1 message in 24h
- **Engagement:** >50% send 3+ messages in 30 days
- **Conversion:** >10% upgrade to credit pack after free message
- **Retention:** >60% active (sent message) in last 30 days

#### Council Member
- **Activation:** >50% complete profile + post + 3 connections in 7d
- **Engagement:** >70% post at least once per month
- **Conversion:** >80% renew membership
- **Retention:** >70% active (posted or commented) in last 30 days

#### Candidate
- **Activation:** >40% complete profile + apply in 24h
- **Engagement:** >60% apply to 3+ mandates in 30 days
- **Conversion:** >20% take ASSESS
- **Retention:** >50% active (applied) in last 30 days

#### Client Admin
- **Activation:** >60% create 1 mandate in 48h
- **Engagement:** >80% create 3+ mandates in 90 days
- **Conversion:** >10% engage consultant
- **Retention:** >70% active (created mandate) in last 90 days

#### Student
- **Activation:** >50% enroll + complete 1 lesson in 48h
- **Engagement:** >60% complete 3+ lessons in 30 days
- **Conversion:** >30% complete first course
- **Retention:** >50% active (completed lesson) in last 30 days

### 3.5 Implementation Notes

**Event tracking:**
- Use PostHog JS library for client-side events
- Use PostHog Python library for server-side events
- Send events asynchronously (don't block user actions)
- Include user_id, timestamp, properties

**Dashboard:**
- Use PostHog dashboards (built-in)
- Embed in admin console (iframe or API)
- Refresh every 5 minutes

**Cohorts:**
- Create cohorts for each user type
- Track activation, engagement, conversion, retention per cohort
- Export to CSV for deeper analysis

**A/B testing:**
- Use PostHog feature flags
- Test onboarding flows, pricing pages, email sequences
- Track conversion rate, time to conversion

---

## Implementation Notes for Trae

### File Structure

```
src/
├── app/
│   └── admin/
│       ├── page.tsx (Admin Dashboard)
│       ├── users/page.tsx
│       ├── organizations/page.tsx
│       ├── revenue/page.tsx
│       ├── system/page.tsx
│       ├── moderation/page.tsx
│       ├── features/page.tsx
│       └── audit/page.tsx
├── components/
│   ├── admin/
│   │   ├── AdminSidebar.tsx
│   │   ├── MetricsCard.tsx
│   │   ├── RevenueChart.tsx
│   │   ├── UserGrowthChart.tsx
│   │   └── ActivityFeed.tsx
│   └── analytics/
│       ├── EventTracker.tsx (client-side event tracking)
│       └── Dashboard.tsx (PostHog embed)
└── lib/
    ├── email/
    │   ├── sendgrid.ts (SendGrid integration)
    │   ├── templates/
    │   │   ├── welcome.ts
    │   │   ├── password-reset.ts
    │   │   ├── payment-confirmation.ts
    │   │   ├── notification.ts
    │   │   └── activation.ts
    │   └── sequences/
    │       ├── executive.ts
    │       ├── council.ts
    │       ├── candidate.ts
    │       ├── client.ts
    │       └── student.ts
    └── analytics/
        ├── posthog.ts (PostHog integration)
        └── events.ts (event definitions)
```

### Key Libraries

**Email:**
- `@sendgrid/mail` or `postmark` — Email sending
- `mjml` or `react-email` — Email template building

**Analytics:**
- `posthog-js` — Client-side event tracking
- `posthog-node` — Server-side event tracking

**Charts (Admin Console):**
- `recharts` or `chart.js` — Dashboard charts

### Database Tables Needed

```sql
-- Audit log
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feature flags
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT FALSE,
  rollout_percent INT DEFAULT 0,
  user_types TEXT[], -- array of user types affected
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email delivery log
CREATE TABLE email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  email_type TEXT NOT NULL, -- 'welcome', 'password_reset', 'notification', etc.
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'sent', -- 'sent', 'delivered', 'failed'
  sent_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Metrics & Success Criteria

### Email
- **Delivery rate:** >98%
- **Open rate:** >40% (transactional), >20% (marketing)
- **Click rate:** >10% (transactional), >5% (marketing)
- **Unsubscribe rate:** <1%

### Admin Console
- **Load time:** <2 seconds
- **Dashboard refresh:** Every 5 minutes
- **Audit log retention:** 90 days

### Analytics
- **Event tracking accuracy:** >99%
- **Dashboard load time:** <3 seconds
- **Data retention:** 12 months

---

## Next Steps

1. **Trae:** Build admin console (dashboard, users, organizations, revenue)
2. **Trae:** Integrate SendGrid/Postmark for email sending
3. **Trae:** Build email templates (transactional first, then activation sequences)
4. **Trae:** Integrate PostHog for event tracking
5. **Kevin:** Set up PostHog account (or choose alternative)
6. **Kevin:** Set up SendGrid/Postmark account
7. **Kevin:** Review and approve email copy
8. **Kevin:** Define initial feature flags

---

**End of Spec**
