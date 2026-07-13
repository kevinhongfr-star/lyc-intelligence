# 05c — The Council v2 Backend Wiring
## LYC Intelligence Platform — Database & API Connections

**Version:** 2.0  
**Last Updated:** 2026-07-13  
**Author:** NEXUS (PM) for Trae (Engineer)  
**Scope:** Backend wiring for Council Portal v2 + DEX AI B2C  
**Dependencies:** 02 (Supabase), 05 (Council), 05b (v2.1 Addendum), 08 (Commerce)

---

## 1. Database Tables Used

### 1.1 Council Tables

| Table | Spec | Purpose |
|-------|------|---------|
| `council_profiles` | 02 §5.1 | Member profiles, tier, credits, status |
| `council_coaching_sessions` | 02 §5.2 | Coaching bookings, status, ratings |
| `council_events` | 02 §5.3 | Event definitions, capacity, pricing |
| `council_event_registrations` | 02 §5.4 | Event signups, attendance, payment |

### 1.2 DEX AI Tables

| Table | Spec | Purpose |
|-------|------|---------|
| `dex_user_profiles` | 02 §6.1 | B2C user profiles, intro status, credits |
| `dex_chat_sessions` | 02 §6.2 | AI conversation records |
| `dex_chat_context` | 02 §6.3 | Conversation memory/context |
| `dex_credit_consumption` | 02 §6.4 | B2C credit transaction log |

### 1.3 Commerce Tables

| Table | Spec | Purpose |
|-------|------|---------|
| `products` | 02 §7.1 | Product catalog |
| `orders` | 02 §7.2 | Order records |
| `credit_transactions` | 02 §7.3 | Unified credit ledger |
| `discount_codes` | 02 §7.4 | Promo codes |

---

## 2. API Endpoints

### 2.1 Council API

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/council/profile` | GET | Get member profile | Council member |
| `/api/council/profile` | PATCH | Update profile | Council member |
| `/api/council/members` | GET | List members (directory) | Council member |
| `/api/council/members/:id` | GET | Member detail | Council member |
| `/api/council/community` | GET | Community feed | Council member |
| `/api/council/community` | POST | Create post | Council member |
| `/api/council/community/:id/like` | POST | Like post | Council member |
| `/api/council/community/:id/reply` | POST | Reply to post | Council member |

### 2.2 Coaching API

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/council/coaches` | GET | List available coaches | Council member |
| `/api/council/coaching/book` | POST | Book session | Council member |
| `/api/council/coaching/upcoming` | GET | Upcoming sessions | Council member |
| `/api/council/coaching/past` | GET | Past sessions | Council member |
| `/api/council/coaching/:id/reschedule` | PATCH | Reschedule | Council member |
| `/api/council/coaching/:id/cancel` | POST | Cancel session | Council member |
| `/api/council/coaching/:id/rate` | POST | Rate session | Council member |

### 2.3 Events API

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/council/events` | GET | List events | Auth (public for landing) |
| `/api/council/events/:id` | GET | Event detail | Auth |
| `/api/council/events/:id/register` | POST | Register for event | Council member |
| `/api/council/events/:id/cancel` | POST | Cancel registration | Council member |

### 2.4 DEX AI API

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/dex/chat` | POST | Send message, get response | DEX AI user |
| `/api/dex/sessions` | GET | List chat sessions | DEX AI user |
| `/api/dex/sessions/:id` | GET | Get session detail | DEX AI user |
| `/api/dex/sessions/:id` | DELETE | Delete session | DEX AI user |
| `/api/dex/credits` | GET | Get credit balance | DEX AI user |
| `/api/dex/intro-status` | GET | Get intro message count | DEX AI user |

---

## 3. Edge Functions

### 3.1 AI Chat Function

**Function:** `ai-chat`  
**Trigger:** HTTP POST  
**Purpose:** Process DEX AI chat message

**Flow:**
```
1. Receive message + session_id
2. Check intro status (if messages_used < 5, allow free)
3. If paid: check DEX credit balance
4. If no credits: return gate error
5. Build context (from dex_chat_context)
6. Call DeepSeek API (route to flash/pro based on complexity)
7. Save response to dex_chat_sessions
8. Deduct credit (if applicable)
9. Update context (dex_chat_context)
10. Return response (streaming SSE)
```

**Tickets:**
- `TCW-EF-001`: ai-chat edge function
- `TCW-EF-002`: DeepSeek API integration
- `TCW-EF-003`: Context assembly from dex_chat_context
- `TCW-EF-004`: Credit deduction logic
- `TCW-EF-005`: Streaming response (SSE)
- `TCW-EF-006`: Intro message counting
- `TCW-EF-007`: Gate enforcement

### 3.2 Coaching Reminder Function

**Function:** `coaching-reminder`  
**Trigger:** Cron (hourly)  
**Purpose:** Send coaching session reminders

**Flow:**
```
1. Find sessions scheduled in next 24h with status='scheduled'
2. For each session:
   a. Check if 24h reminder already sent
   b. If not, send email + push notification
   c. Log notification
3. Find sessions scheduled in next 1h
4. Send urgent reminder
```

**Tickets:**
- `TCW-EF-008`: coaching-reminder cron function
- `TCW-EF-009`: Email notification dispatch
- `TCW-EF-010`: Push notification dispatch

### 3.3 Credit Expiry Function

**Function:** `credit-expiry`  
**Trigger:** Cron (daily)  
**Purpose:** Handle credit expiry

**Flow:**
```
1. DEX Credits: expire after 12 months from purchase
   - Find credits older than 12 months
   - Deduct expired amount
   - Create credit_transactions entry
   - Notify users

2. Council Credits: reset annually on membership renewal
   - On membership renewal, reset council_credits to tier allocation
   - Log reset in credit_transactions
```

**Tickets:**
- `TCW-EF-011`: credit-expiry cron function
- `TCW-EF-012`: DEX credit expiry processing
- `TCW-EF-013`: Council credit reset processing
- `TCW-EF-014`: Expiry notification emails

---

## 4. RLS Policies

### 4.1 Council RLS

```sql
-- Council profiles: members see own + public profiles
CREATE POLICY "Members see own profile"
ON council_profiles FOR SELECT
USING (user_id = auth.uid() OR is_public = true);

CREATE POLICY "Members update own profile"
ON council_profiles FOR UPDATE
USING (user_id = auth.uid());

-- Coaching: members see own sessions
CREATE POLICY "Members see own coaching"
ON council_coaching_sessions FOR SELECT
USING (member_id IN (
  SELECT id FROM council_profiles WHERE user_id = auth.uid()
));

-- Events: public read, member register
CREATE POLICY "Anyone sees events"
ON council_events FOR SELECT
USING (status IN ('published', 'registration_open'));

CREATE POLICY "Members register for events"
ON council_event_registrations FOR INSERT
WITH CHECK (member_id IN (
  SELECT id FROM council_profiles WHERE user_id = auth.uid()
  AND membership_status = 'active'
));

-- Community: members only
CREATE POLICY "Members see community"
ON council_community_posts FOR SELECT
USING (EXISTS (
  SELECT 1 FROM council_profiles WHERE user_id = auth.uid()
  AND membership_status = 'active'
));
```

### 4.2 DEX AI RLS

```sql
-- DEX profiles: user sees own
CREATE POLICY "User sees own DEX profile"
ON dex_user_profiles FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "User updates own DEX profile"
ON dex_user_profiles FOR UPDATE
USING (user_id = auth.uid());

-- Chat sessions: user sees own
CREATE POLICY "User sees own sessions"
ON dex_chat_sessions FOR SELECT
USING (user_id = auth.uid());

-- Chat context: user sees own
CREATE POLICY "User sees own context"
ON dex_chat_context FOR SELECT
USING (user_id = auth.uid());

-- Credit consumption: user sees own
CREATE POLICY "User sees own DEX credits"
ON dex_credit_consumption FOR SELECT
USING (user_id = auth.uid());
```

**Tickets:**
- `TCW-RLS-001`: Council profiles RLS
- `TCW-RLS-002`: Coaching sessions RLS
- `TCW-RLS-003`: Events RLS
- `TCW-RLS-004`: Event registrations RLS
- `TCW-RLS-005`: Community posts RLS
- `TCW-RLS-006`: DEX profiles RLS
- `TCW-RLS-007`: DEX sessions RLS
- `TCW-RLS-008`: DEX context RLS
- `TCW-RLS-009`: DEX credit consumption RLS

---

## 5. Realtime Subscriptions

```typescript
// Council realtime channels
const councilChannels = {
  community: supabase.channel('council:community')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'council_community_posts' }, handleNewPost)
    .subscribe(),

  coaching: supabase.channel(`coaching:${userId}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'council_coaching_sessions', filter: `member_id=eq.${memberId}` }, handleCoachingUpdate)
    .subscribe(),

  credits: supabase.channel(`credits:${userId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'credit_transactions', filter: `user_id=eq.${userId}` }, handleCreditChange)
    .subscribe(),
};

// DEX AI realtime
const dexChannels = {
  chat: supabase.channel(`dex:chat:${sessionId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'dex_chat_messages', filter: `session_id=eq.${sessionId}` }, handleNewMessage)
    .subscribe(),
};
```

**Tickets:**
- `TCW-RT-001`: Community feed realtime subscription
- `TCW-RT-002`: Coaching status realtime
- `TCW-RT-003`: Credit balance realtime
- `TCW-RT-004`: DEX chat realtime

---

## Ticket Summary

| Module | Tickets | IDs |
|--------|:-------:|-----|
| TCW-EF: Edge Functions | 14 | `TCW-EF-001` to `TCW-EF-014` |
| TCW-RLS: RLS Policies | 9 | `TCW-RLS-001` to `TCW-RLS-009` |
| TCW-RT: Realtime | 4 | `TCW-RT-001` to `TCW-RT-004` |
| **TOTAL** | **~27** | |

---

**Document Version:** 2.0  
**Created:** 2026-07-11  
**Updated:** 2026-07-13  
**Next Review:** Upon Trae implementation start
