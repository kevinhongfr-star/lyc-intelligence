# Phase 5: Client & Consultant Portals

**Goal:** Build the Client Portal (mandate viewing, candidate shortlisting, feedback) and enhance the Consultant Portal with performance views, workload management, and collaboration tools.

**Pre-requisites:** Phase 1-4 complete (DB foundation, API layer, internal portal as reference).

**Gap Context:** Trae's S1-T11 (Client Portal Pipeline Dashboard) is an open issue with no implementation. No client-facing functionality exists. Consultant portal is limited to internal view.

---

## Sprint 5.1 — Client Portal Authentication & Layout

| # | Ticket |
|---|--------|
| 5.1.01 | Build Client login page — branded for LYC, email/password + SSO option |
| 5.1.02 | Build Client registration flow — invite-only, token-based registration |
| 5.1.03 | Build Client password reset — email-based reset flow |
| 5.1.04 | Build Client MFA setup — optional TOTP for enhanced security |
| 5.1.05 | Build Client session management — auto-logout after inactivity, concurrent session limits |
| 5.1.06 | Build Client portal layout — simplified sidebar with mandates, meetings, documents |
| 5.1.07 | Build Client header — company logo, notification bell, user menu, help |
| 5.1.08 | Build Client onboarding wizard — first-login guide, preferences setup |
| 5.1.09 | Build Client role hierarchy — admin (full access), viewer (read-only) per client org |
| 5.1.10 | Build Client profile settings — update contact info, notification preferences |
| 5.1.11 | Build Client company profile — view/edit company details (permitted fields only) |
| 5.1.12 | Build Client dashboard — summary of active mandates, recent candidates, upcoming meetings |
| 5.1.13 | Build Client quick stats — open mandates, candidates presented, interviews scheduled |
| 5.1.14 | Build Client recent activity feed — latest updates on their mandates |
| 5.1.15 | Build Client notification center — portal notifications + email digest option |
| 5.1.16 | Build Client permission enforcement — RLS policies for client-scoped data access |
| 5.1.17 | Build Client data isolation test — verify clients cannot see other clients' data |
| 5.1.18 | Build Client mobile responsive layout — optimized for tablet and mobile viewing |
| 5.1.19 | Build Client accessibility compliance — WCAG 2.1 AA |
| 5.1.20 | Build Client session analytics — track login frequency, feature usage |
| 5.1.21 | Build Client feedback prompt — NPS survey after key interactions |
| 5.1.22 | Build Client help/documentation page — FAQ, guides, contact support |
| 5.1.23 | Build Client portal loading states — skeleton screens for all pages |
| 5.1.24 | Build Client error handling — graceful degradation for API failures |
| 5.1.25 | Sprint 5.1 review — client authentication and layout verified |

## Sprint 5.2 — Client Mandate & Candidate Views

| # | Ticket |
|---|--------|
| 5.2.01 | Build Client mandate list — all mandates accessible to this client account |
| 5.2.02 | Build Client mandate detail — mandate overview with status, timeline, team |
| 5.2.03 | Build Client candidate shortlist — presented candidates with scores (blinded until presented) |
| 5.2.04 | Build Client candidate profile — full profile view for presented candidates |
| 5.2.05 | Build Client candidate comparison — side-by-side comparison of shortlisted candidates |
| 5.2.06 | Build Client candidate scoring display — Score Match (not internal names), tier badge |
| 5.2.07 | Build Client pipeline view — candidates per mandate with stage progression |
| 5.2.08 | Build Client candidate feedback — rate candidate after interview (stars + comments) |
| 5.2.09 | Build Client candidate action — request more candidates, reject candidate, schedule interview |
| 5.2.10 | Build Client mandate timeline — visual timeline of key events and milestones |
| 5.2.11 | Build Client team view — see assigned consultants with contact info |
| 5.2.12 | Build Client document viewer — view proposals, reports, contracts |
| 5.2.13 | Build Client document download — download documents as PDF |
| 5.2.14 | Build Client report viewer — view intelligence reports generated for their mandates |
| 5.2.15 | Build Client mandate status updates — real-time status changes via Supabase Realtime |
| 5.2.16 | Build Client search — search across their mandates and candidates |
| 5.2.17 | Build Client filter presets — save filter combinations for mandates/candidates |
| 5.2.18 | Build Client export — export candidate list or mandate summary as PDF/Excel |
| 5.2.19 | Build Client notification triggers — new candidate presented, interview scheduled, status change |
| 5.2.20 | Build Client engagement metrics — track how often client logs in and interacts |
| 5.2.21 | Build Client mandate history — view completed mandates and placement outcomes |
| 5.2.22 | Build Client satisfaction survey — periodic survey on service quality |
| 5.2.23 | Build Client portal analytics — track feature usage, identify friction points |
| 5.2.24 | Build Client mandate view integration test — all client views working with real data |
| 5.2.25 | Sprint 5.2 review — demo client mandate views to stakeholders |

## Sprint 5.3 — Client Meetings & Communication

| # | Ticket |
|---|--------|
| 5.3.01 | Build Client meeting list — upcoming and past meetings with consultants |
| 5.3.02 | Build Client meeting booking — select time slot from consultant's availability |
| 5.3.03 | Build Client meeting reschedule — propose new time, consultant confirms |
| 5.3.04 | Build Client meeting cancel — cancel with reason notification to consultant |
| 5.3.05 | Build Client meeting agenda — set agenda items before meeting |
| 5.3.06 | Build Client meeting notes — shared notes visible to both client and consultant |
| 5.3.07 | Build Client meeting follow-ups — action items from meetings with due dates |
| 5.3.08 | Build Client messaging — direct messages to assigned consultants |
| 5.3.09 | Build Client message threading — conversation threads per mandate |
| 5.3.10 | Build Client message attachments — share files in messages |
| 5.3.11 | Build Client message notifications — real-time notifications for new messages |
| 5.3.12 | Build Client announcement board — firm-wide announcements from LYC |
| 5.3.13 | Build Client proposal viewer — view and respond to proposals |
| 5.3.14 | Build Client proposal acceptance — accept proposal with e-signature |
| 5.3.15 | Build Client invoice viewer — view invoices for their mandates |
| 5.3.16 | Build Client invoice payment — online payment via Stripe (if applicable) |
| 5.3.17 | Build Client calendar integration — sync meetings with external calendar (iCal) |
| 5.3.18 | Build Client reminder system — email/SMS reminders before meetings |
| 5.3.19 | Build Client NDA viewer — view and accept NDA documents |
| 5.3.20 | Build Client document signing — e-signature integration for key documents |
| 5.3.21 | Build Client feedback form — structured feedback on mandate progress |
| 5.3.22 | Build Client escalation path — escalate issues to senior consultant/partner |
| 5.3.23 | Build Client portal communication test — all messaging and meetings working |
| 5.3.24 | Build Client satisfaction tracking — log satisfaction scores per interaction |
| 5.3.25 | Sprint 5.3 review — demo client communication tools |

## Sprint 5.4 — Consultant Portal Enhanced Views

| # | Ticket |
|---|--------|
| 5.4.01 | Build Consultant performance dashboard — personal KPIs, rankings, trends |
| 5.4.02 | Build Consultant workload view — current mandates, capacity indicator |
| 5.4.03 | Build Consultant mandate overview — all assigned mandates with status |
| 5.4.04 | Build Consultant candidate summary — candidates across all mandates |
| 5.4.05 | Build Consultant interview schedule — upcoming interviews with prep status |
| 5.4.06 | Build Consultant task list — personal tasks with deadlines and priorities |
| 5.4.07 | Build Consultant activity log — personal activity timeline |
| 5.4.08 | Build Consultant notification preferences — customize which events trigger alerts |
| 5.4.09 | Build Consultant quick actions — new candidate entry, status update, note |
| 5.4.10 | Build Consultant calendar view — integrated view of interviews, meetings, deadlines |
| 5.4.11 | Build Consultant search — search across their mandates and candidates |
| 5.4.12 | Build Consultant mobile view — optimized mobile experience for field consultants |
| 5.4.13 | Build Consultant offline mode — cache key data for offline access |
| 5.4.14 | Build Consultant data sync — sync offline changes when reconnected |
| 5.4.15 | Build Consultant time tracking — log time spent per mandate |
| 5.4.16 | Build Consultant expense logging — log expenses per mandate |
| 5.4.17 | Build Consultant collaboration — share notes/candidates with co-consultants |
| 5.4.18 | Build Consultant mentoring view — senior consultants can view/advise junior work |
| 5.4.19 | Build Consultant training tracker — track completed training and certifications |
| 5.4.20 | Build Consultant commission tracker — view estimated commission based on placements |
| 5.4.21 | Build Consultant goal setting — set personal targets for placements, revenue |
| 5.4.22 | Build Consultant peer comparison — anonymous comparison of KPIs with peers |
| 5.4.23 | Build Consultant feedback reception — view feedback from clients on their candidates |
| 5.4.24 | Build Consultant portal integration test — all consultant views working |
| 5.4.25 | Sprint 5.4 review — demo enhanced consultant portal |

## Sprint 5.5 — Cross-Portal Integration & Testing

| # | Ticket |
|---|--------|
| 5.5.01 | Build Client→Consultant feedback sync — client feedback appears in consultant view |
| 5.5.02 | Build Consultant→Client candidate presentation — consultant presents candidate, client sees it |
| 5.5.03 | Build Meeting sync — meetings created by either side visible to both |
| 5.5.04 | Build Document sharing — documents shared between client and consultant |
| 5.5.05 | Build Notification cross-routing — right notifications to right portal user |
| 5.5.06 | Build Real-time sync test — changes in internal portal reflected in client portal in real-time |
| 5.5.07 | Build Permission boundary test — verify no data leakage between clients |
| 5.5.08 | Build Concurrent edit handling — handle same record edited by client and consultant |
| 5.5.09 | Build Cross-portal audit trail — track actions across all portals for a mandate |
| 5.5.10 | Build Client portal load test — simulate 50 concurrent client users |
| 5.5.11 | Build Client portal security audit — penetration test for client data isolation |
| 5.5.12 | Build Client portal accessibility audit — WCAG 2.1 AA compliance check |
| 5.5.13 | Build Client portal mobile test — test on iOS Safari, Android Chrome |
| 5.5.14 | Build Client portal browser test — Chrome, Firefox, Safari, Edge compatibility |
| 5.5.15 | Build Consultant portal load test — simulate 20 concurrent consultant users |
| 5.5.16 | Build Consultant portal mobile test — field use on mobile devices |
| 5.5.17 | Build Client onboarding test — end-to-end from invitation to first login |
| 5.5.18 | Build Client workflow test — full mandate lifecycle from client perspective |
| 5.5.19 | Build Consultant workflow test — full mandate lifecycle from consultant perspective |
| 5.5.20 | Build Client UAT script — user acceptance testing scenarios for client |
| 5.5.21 | Build Consultant UAT script — user acceptance testing scenarios for consultants |
| 5.5.22 | Build Cross-portal E2E test — full flow from mandate creation to client viewing candidate |
| 5.5.23 | Build Performance optimization — lazy loading, code splitting, caching per portal |
| 5.5.24 | Build Documentation — client portal user guide, consultant portal user guide |
| 5.5.25 | Phase 5 completion review — full Client and Consultant Portal demo |
