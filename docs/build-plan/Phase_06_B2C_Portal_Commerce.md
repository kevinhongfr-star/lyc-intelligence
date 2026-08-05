# Phase 6: B2C Portal & Commerce (DEX)

**Goal:** Build the B2C portal for individual users — landing pages, assessment flows, credit system, Stripe payments, coaching bookings, and self-service features.

**Pre-requisites:** Phase 1-5 complete (DB secure, API ready, design system + internal/client portals as reference).

**Gap Context:** Trae's feature/eo5-b2c-coaching-v2 branch exists but contains no working implementation. Zero B2C users, zero commerce integration, zero assessment flows built.

---

## Sprint 6.1 — B2C Landing Pages & Public Experience

| # | Ticket |
|---|--------|
| 6.1.01 | Build B2C public landing page — hero section, value propositions, social proof |
| 6.1.02 | Build B2C services overview page — list of all services with descriptions |
| 6.1.03 | Build B2C assessment landing page — what to expect, pricing, duration |
| 6.1.04 | Build B2C coaching landing page — coach profiles, booking info, testimonials |
| 6.1.05 | Build B2C about page — LYC story, team, values |
| 6.1.06 | Build B2C testimonials section — carousel with video/text testimonials |
| 6.1.07 | Build B2C blog/resource section — thought leadership articles |
| 6.1.08 | Build B2C FAQ page — common questions organized by topic |
| 6.1.09 | Build B2C pricing page — credit packages, service tiers, comparison table |
| 6.1.10 | Build B2C contact form — inquiry form with subject routing |
| 6.1.11 | Build B2C newsletter signup — email capture with confirmation |
| 6.1.12 | Build B2C SEO optimization — meta tags, structured data, sitemap |
| 6.1.13 | Build B2C analytics tracking — page views, conversions, funnel metrics |
| 6.1.14 | Build B2C cookie consent — GDPR-compliant cookie banner |
| 6.1.15 | Build B2C multi-language support — i18n framework with EN/CN |
| 6.1.16 | Build B2C social sharing — share buttons, Open Graph tags |
| 6.1.17 | Build B2C chat widget — live chat or chatbot integration |
| 6.1.18 | Build B2C video embed — hero video, testimonial videos |
| 6.1.19 | Build B2C image gallery — before/after, event photos |
| 6.1.20 | Build B2C mobile-first design — responsive across all devices |
| 6.1.21 | Build B2C page performance — Core Web Vitals optimization |
| 6.1.22 | Build B2C accessibility — WCAG 2.1 AA for public pages |
| 6.1.23 | Build B2C browser compatibility — cross-browser testing matrix |
| 6.1.24 | Build B2C landing page A/B testing — framework for testing variants |
| 6.1.25 | Sprint 6.1 review — landing pages live and performant |

## Sprint 6.2 — B2C User Registration & Authentication

| # | Ticket |
|---|--------|
| 6.2.01 | Build B2C user registration — email + password with email verification |
| 6.2.02 | Build B2C social login — Google, LinkedIn OAuth integration |
| 6.2.03 | Build B2C login page — branded login with remember me |
| 6.2.04 | Build B2C password reset — self-service email-based reset |
| 6.2.05 | Build B2C user profile — name, avatar, contact details, preferences |
| 6.2.06 | Build B2C user dashboard — credit balance, purchase history, upcoming sessions |
| 6.2.07 | Build B2C email verification flow — verification link with expiry |
| 6.2.08 | Build B2C account deletion — GDPR-compliant account + data deletion |
| 6.2.09 | Build B2C session management — auto-logout, concurrent session handling |
| 6.2.10 | Build B2C user consent management — terms, privacy, marketing consent |
| 6.2.11 | Build B2C notification preferences — email, SMS, in-app notification settings |
| 6.2.12 | Build B2C referral system — referral link, credit reward on signup |
| 6.2.13 | Build B2C loyalty program — points for engagement, redeemable for credits |
| 6.2.14 | Build B2C user onboarding wizard — guided first experience after signup |
| 6.2.15 | Build B2C user segmentation — tag users by interest, source, engagement |
| 6.2.16 | Build B2C RLS policies — user-scoped data access for all B2C tables |
| 6.2.17 | Build B2C auth integration test — all auth flows working across devices |
| 6.2.18 | Build B2C password strength meter — real-time feedback during registration |
| 6.2.19 | Build B2C CAPTCHA — bot protection on registration and login |
| 6.2.20 | Build B2C rate limiting — prevent brute force on auth endpoints |
| 6.2.21 | Build B2C account lockout — lock after failed attempts with unlock flow |
| 6.2.22 | Build B2C magic link login — passwordless login via email |
| 6.2.23 | Build B2C two-factor auth — optional TOTP setup |
| 6.2.24 | Build B2C audit log — track all auth events per user |
| 6.2.25 | Sprint 6.2 review — B2C auth fully operational |

## Sprint 6.3 — Assessment Flow & Credit System

| # | Ticket |
|---|--------|
| 6.3.01 | Build Assessment type selector — choose assessment type (career, personality, skills) |
| 6.3.02 | Build Assessment pre-screen — eligibility check, prerequisite validation |
| 6.3.03 | Build Assessment question engine — dynamic question rendering with branching |
| 6.3.04 | Build Assessment progress tracker — progress bar, question counter, time remaining |
| 6.3.05 | Build Assessment answer capture — multiple choice, rating scale, text input, file upload |
| 6.3.06 | Build Assessment auto-save — resume assessment from where user left off |
| 6.3.07 | Build Assessment timer — timed assessments with warning and auto-submit |
| 6.3.08 | Build Assessment review screen — review answers before submission |
| 6.3.09 | Build Assessment submission — submit and trigger scoring |
| 6.3.10 | Build Assessment result display — score, interpretation, visual breakdown |
| 6.3.11 | Build Assessment PDF report — downloadable detailed report |
| 6.3.12 | Build Assessment history — view past assessments with scores |
| 6.3.13 | Build Credit system — credit balance, purchase history, transaction log |
| 6.3.14 | Build Credit package catalog — display available credit packages with pricing |
| 6.3.15 | Build Credit purchase flow — add to cart, checkout, confirmation |
| 6.3.16 | Build Credit consumption — deduct credits on assessment purchase |
| 6.3.17 | Build Credit top-up notification — alert when credits running low |
| 6.3.18 | Build Credit gifting — purchase credits as gift for another user |
| 6.3.19 | Build Credit promo codes — discount codes for credit purchases |
| 6.3.20 | Build Credit refund flow — refund credits for cancelled assessments |
| 6.3.21 | Build Assessment scoring backend — calculate scores based on answer patterns |
| 6.3.22 | Build Assessment recommendation engine — suggest next steps based on results |
| 6.3.23 | Build Assessment comparison — compare current vs. previous assessment results |
| 6.3.24 | Build Assessment integration test — full flow from purchase to results |
| 6.3.25 | Sprint 6.3 review — assessment and credit system operational |

## Sprint 6.4 — Stripe Payments & Coaching Bookings

| # | Ticket |
|---|--------|
| 6.4.01 | Build Stripe integration setup — API keys, webhooks, event handling |
| 6.4.02 | Build Stripe Checkout — hosted checkout for credit packages |
| 6.4.03 | Build Stripe payment methods — credit card, Apple Pay, Google Pay |
| 6.4.04 | Build Stripe subscription — recurring credit top-up option |
| 6.4.05 | Build Stripe invoice generation — auto-generate invoices for purchases |
| 6.4.06 | Build Stripe webhook handlers — payment success, failure, refund events |
| 6.4.07 | Build Stripe payment history — user-viewable transaction history |
| 6.4.08 | Build Stripe refund processing — initiate and track refunds |
| 6.4.09 | Build Stripe tax handling — automatic tax calculation per jurisdiction |
| 6.4.10 | Build Stripe currency support — multi-currency pricing (CNY, USD, EUR) |
| 6.4.11 | Build Coach profile page — public-facing coach bio, specialties, availability |
| 6.4.12 | Build Coach availability calendar — set available time slots |
| 6.4.13 | Build Coaching booking flow — select coach, choose slot, pay credits |
| 6.4.14 | Build Coaching booking confirmation — email + in-app confirmation |
| 6.4.15 | Build Coaching reschedule — reschedule with coach availability check |
| 6.4.16 | Build Coaching cancellation — cancel with refund policy enforcement |
| 6.4.17 | Build Coaching session reminder — email/SMS reminder 24h before |
| 6.4.18 | Build Coaching video link — auto-generate video call link for session |
| 6.4.19 | Build Coaching session notes — coach and coachee can add notes |
| 6.4.20 | Build Coaching feedback — post-session rating and feedback |
| 6.4.21 | Build Coaching history — view past sessions with notes and recordings |
| 6.4.22 | Build Coach dashboard — coach view of upcoming sessions, client notes |
| 6.4.23 | Build Payment failure handling — retry logic, dunning emails |
| 6.4.24 | Build Payment integration test — end-to-end payment and booking flow |
| 6.4.25 | Sprint 6.4 review — payments and coaching bookings operational |

## Sprint 6.5 — B2C Advanced Features & Launch

| # | Ticket |
|---|--------|
| 6.5.01 | Build B2C search functionality — search coaches, assessments, resources |
| 6.5.02 | Build B2C recommendation engine — personalized content and service suggestions |
| 6.5.03 | Build B2C notification center — in-app notifications for bookings, credits, updates |
| 6.5.04 | Build B2C email digest — weekly summary of new content, offers |
| 6.5.05 | Build B2C community forum — discussion boards for users |
| 6.5.06 | Build B2C resource library — downloadable guides, templates, tools |
| 6.5.07 | Build B2C event calendar — webinars, workshops, networking events |
| 6.5.08 | Build B2C event registration — sign up for events with credit payment |
| 6.5.09 | Build B2C gamification — badges, streaks, achievement milestones |
| 6.5.10 | Build B2C social proof widgets — "X people booked this week" counters |
| 6.5.11 | Build B2C exit intent capture — offer discount when user tries to leave |
| 6.5.12 | Build B2C cart abandonment recovery — email sequence for incomplete purchases |
| 6.5.13 | Build B2C upsell engine — suggest premium services based on usage |
| 6.5.14 | Build B2C NPS survey — periodic satisfaction surveys |
| 6.5.15 | Build B2C help center — searchable FAQ, guides, video tutorials |
| 6.5.16 | Build B2C live chat support — real-time support during business hours |
| 6.5.17 | Build B2C chatbot — AI-powered FAQ bot for common questions |
| 6.5.18 | Build B2C user analytics dashboard — track user journey and conversion |
| 6.5.19 | Build B2C A/B testing framework — test page variations |
| 6.5.20 | Build B2C performance monitoring — page load, API response tracking |
| 6.5.21 | Build B2C error tracking — Sentry integration for frontend errors |
| 6.5.22 | Build B2C UAT — end-to-end user acceptance testing |
| 6.5.23 | Build B2C load test — simulate 200 concurrent users |
| 6.5.24 | Build B2C documentation — user guide, admin guide |
| 6.5.25 | Phase 6 completion review — full B2C portal demo |
