# DEX AI — Nexus Companion Phase 1 Tickets

**Version:** 1.0 | **Date:** 2026-07-20 | **Author:** NEXUS
**Spec reference:** `DEX_AI_MASTER_SPEC.md` v3.1, Part 1 + Part 4
**Scope:** 7 tickets | ~160-200h | Weeks 1-6 (Foundation)
**Dependencies:** N1 → N2 → N3 → N4 → N5 → N6, N7 runs parallel

---

## N1 — Nexus Core: Conversation Engine + Intent Router

**Estimate:** 28-35h
**Dependencies:** None (start here)
**Blocks:** N2, N3, N4, N5, N6

### Scope
Build the core conversational interface: message input/output, intent classification, DeepSeek routing (Flash/Pro), response rendering, conversation persistence.

### Requirements

1. **Chat UI Component**
   - Message input (text, file upload for CVs/docs)
   - Streaming response display (SSE or WebSocket)
   - Conversation thread view with scrollback
   - Mobile-responsive, dark mode support

2. **Intent Classifier** (11 intents per spec §4.2)
   - Route through DeepSeek Flash for <500ms classification
   - Intents: career_advisory, self_understanding, market_intel, compensation, opportunity, coaching, peer_connection, event, skill_building, system_nav, out_of_scope
   - Confidence threshold: if <0.7, ask clarifying question
   - Intent routing table maps each intent → handler module

3. **DeepSeek Integration**
   - Flash model: classification, simple conversation, peer matching, event queries
   - Pro model: career advisory, complex analysis, diagnostic translation
   - Timeout: Flash 10s, Pro 30s
   - Fallback: Pro fails → retry Flash with simpler prompt
   - Token counting + cost tracking per request
   - Daily budget cap enforcement (default ¥50/day)

4. **Conversation Persistence**
   - Store full conversation history in `nexus_conversations` table
   - Index by user_id + timestamp
   - Support pagination for history retrieval
   - Conversation metadata: intent distribution, session duration, message count

5. **System Prompt Assembly** (per spec §4.4)
   - Layer 1: Base personality (constant)
   - Layer 2: User context (per conversation)
   - Layer 3: Intent-specific instructions
   - Layer 4: Tier behavior modifiers
   - Layer 5: Safety guardrails (constant)

### Schema
```sql
CREATE TABLE nexus_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  intent TEXT,
  intent_confidence NUMERIC,
  model_used TEXT,
  tokens_in INTEGER,
  tokens_out INTEGER,
  cost_usd NUMERIC,
  latency_ms INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_nexus_conv_user ON nexus_conversations(user_id, created_at DESC);

CREATE TABLE nexus_intent_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  conversation_id UUID REFERENCES nexus_conversations(id),
  intent TEXT NOT NULL,
  confidence NUMERIC,
  routed_to TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Acceptance Criteria
- [ ] User can send messages and receive streaming responses
- [ ] Intent classifier routes correctly for all 11 categories (>90% accuracy on test set)
- [ ] DeepSeek Flash used for simple queries, Pro for complex
- [ ] System prompt assembled from all 5 layers
- [ ] Conversations persisted and paginated
- [ ] Cost tracking per request, daily cap enforced
- [ ] Graceful degradation when DeepSeek is unavailable
- [ ] Mobile-responsive chat UI

### Test Cases
| Test | Input | Expected |
|------|-------|----------|
| Simple query | "What's the weather?" | Out-of-scope redirect |
| Career advisory | "Where should I go next in my career?" | Pro model, full context, thoughtful response |
| Intent ambiguity | "Help me" | Clarifying question (confidence < 0.7) |
| Cost cap | Daily budget reached | Polite "try again tomorrow" message |
| Streaming | Any query | Response appears token-by-token |

---

## N2 — Memory System (Working + Episodic + Semantic)

**Estimate:** 24-30h
**Dependencies:** N1
**Blocks:** N4, N5

### Scope
Three-tier memory system that gives Nexus persistent knowledge of each user.

### Requirements

1. **Working Memory** (in-context, session-scoped)
   - Maintain last 20 messages in active context window
   - Sliding window with priority weighting (recent messages weighted higher)
   - System messages and diagnostic insights get priority slot retention
   - Token budget management (stay within model context limits)

2. **Episodic Memory** (cross-session, event-based)
   - Store conversation summaries after each session
   - Extract key decisions, action items, emotional states
   - Index by user_id + topic + timestamp
   - Retrieval: semantic similarity search (embeddings via DeepSeek)
   - Include relevant past episodes in context assembly when relevant to current conversation

3. **Semantic Memory** (user model, persistent)
   - Maintain structured user profile: preferences, patterns, goals, relationships
   - Auto-update after each conversation (extract facts, update beliefs)
   - Fields: career_goals, preferred_industries, leadership_style, communication_preferences, key_relationships, development_areas, compensation_expectations
   - Conflict resolution: newer info updates older (with audit trail)
   - Used as Layer 2 in system prompt assembly

4. **Memory Retrieval Pipeline**
   - On each user message: query episodic (semantic search, top 5) + semantic (full user model)
   - Inject into context before LLM call
   - Log what was retrieved for debugging

### Schema
```sql
CREATE TABLE nexus_episodic_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  summary TEXT NOT NULL,
  topics TEXT[] DEFAULT '{}',
  embedding VECTOR(1536),
  source_conversation_id UUID,
  emotional_tone TEXT,
  action_items JSONB DEFAULT '[]',
  decisions JSONB DEFAULT '[]',
  relevance_score NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_accessed_at TIMESTAMPTZ
);
CREATE INDEX idx_episodic_user ON nexus_episodic_memory(user_id);

CREATE TABLE nexus_semantic_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,
  career_goals JSONB DEFAULT '[]',
  preferred_industries TEXT[] DEFAULT '{}',
  leadership_style TEXT,
  communication_preferences JSONB DEFAULT '{}',
  key_relationships JSONB DEFAULT '[]',
  development_areas JSONB DEFAULT '[]',
  compensation_expectations JSONB DEFAULT '{}',
  personality_indicators JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE nexus_memory_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  memory_type TEXT NOT NULL CHECK (memory_type IN ('episodic', 'semantic')),
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'retrieved', 'deleted')),
  field_changed TEXT,
  old_value TEXT,
  new_value TEXT,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Acceptance Criteria
- [ ] Working memory maintains coherent multi-turn conversations (20+ turns)
- [ ] Episodic memory: Nexus references past conversations naturally ("Last week you mentioned...")
- [ ] Semantic memory: user profile auto-updates after conversations
- [ ] Memory retrieval adds relevant context without exceeding token limits
- [ ] Audit trail for all semantic memory updates
- [ ] Memory persists across sessions and device switches
- [ ] Retrieval latency < 500ms

### Test Cases
| Test | Input | Expected |
|------|-------|----------|
| Cross-session recall | User mentions topic from 3 days ago | Nexus references it naturally |
| Semantic update | User says "I got promoted to VP" | User profile updated, reflected in future conversations |
| Working memory overflow | 25+ message conversation | Oldest non-priority messages dropped gracefully |
| Memory conflict | User changes stated goal | New goal recorded, old one archived in audit |

---

## N3 — User Context Assembly + Tier Gating

**Estimate:** 16-20h
**Dependencies:** N1, N2
**Blocks:** N5

### Scope
Build the context assembly pipeline that constructs the full prompt for each Nexus response, with tier-gated capability unlocking.

### Requirements

1. **Context Assembler** (per spec §4.3)
   - Layer 1: User profile (from auth + semantic memory)
   - Layer 2: Conversation history (working memory)
   - Layer 3: Active goals and action items
   - Layer 4: Diagnostic insights (translated, never raw scores)
   - Layer 5: Coaching context (themes, pending actions)
   - Layer 6: Tier-gated features (see below)
   - Layer 7: Retrieved episodic memories (semantic search)
   - Layer 8: Recommendation state (per §3.4)

2. **Tier Gating** (per spec §1.4)
   - Free: basic conversation only, last 5 messages history
   - Starter: full conversation history, diagnostic insights, industry avg benchmarks
   - Growth: + peer-group benchmarks, ranked opportunity matching, market intel
   - Elite: + company-specific intel, proactive alerts, scenario modeling
   - Corporate: + org-wide view, team analytics

3. **Diagnostic Translation Layer**
   - Raw scores from LEAP platform → natural language insights
   - Never expose scores, percentiles, or framework names to user
   - Benchmark inclusion only when cohort ≥ 20 (per C3.1 §5)
   - Example: score 78 on "Strategic Thinking" → "You tend toward strategic architecture with strong stakeholder influence"

4. **Credit System Integration**
   - Check user credit balance before each response
   - Deduct credits per response (tier-based: 1 credit for Flash, 3 for Pro)
   - Block with upgrade prompt when credits exhausted
   - Free tier: 0 credits, limited to N messages/day

### Schema
```sql
CREATE TABLE nexus_user_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  subscription_tier TEXT NOT NULL DEFAULT 'free',
  credits_remaining INTEGER DEFAULT 0,
  credits_total INTEGER DEFAULT 0,
  credits_reset_date TIMESTAMPTZ,
  coaching_themes JSONB DEFAULT '[]',
  pending_actions JSONB DEFAULT '[]',
  last_diagnostic_at TIMESTAMPTZ,
  diagnostic_insights JSONB DEFAULT '{}',
  recommendation_state JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Acceptance Criteria
- [ ] Context assembled from all layers within 200ms
- [ ] Free users limited to basic conversation + 5 message history
- [ ] Tier upgrades unlock capabilities immediately
- [ ] Diagnostic insights always translated to natural language (no raw scores leak)
- [ ] Credit deduction works correctly, blocks at 0
- [ ] Benchmarks only shown when cohort ≥ 20
- [ ] Context token count stays within model limits

---

## N4 — RAG: Content Library Integration

**Estimate:** 20-28h
**Dependencies:** N1, N2
**Blocks:** N6

### Scope
Connect Nexus to the content library (120+ annual assets from flywheel content engine) via RAG so it can answer questions using curated content.

### Requirements

1. **Content Ingestion Pipeline**
   - Source: Notion content assets (articles, webinar summaries, podcast transcripts)
   - Chunking: semantic chunking (500-1000 tokens per chunk, with overlap)
   - Embedding: generate embeddings via DeepSeek (or compatible model)
   - Storage: vector table in Supabase (pgvector)
   - Metadata per chunk: source_type, source_title, month, theme, diagnostic_tag, author

2. **Retrieval Engine**
   - Semantic search: user query → embedding → top-K similar chunks
   - Re-ranking: boost by recency, relevance to user's diagnostic profile, tier-appropriateness
   - Context injection: retrieved chunks appended to system prompt as reference material
   - Citation: include source reference in Nexus response ("Based on our August article on...")

3. **Content Types Indexed**
   - Webinar summaries and key takeaways
   - Article excerpts (1,500-word pieces)
   - Podcast transcript segments
   - Roundtable discussion highlights
   - Diagnostic insights (generic, non-proprietary portions)
   - Newsletter editions

4. **Guardrails**
   - Never expose proprietary diagnostic methodology details
   - Never reveal content tagged as B2B-only to B2C users
   - Content curation respects boundary rule (§1.7): reference themes, not diagnostic names
   - Rate limiting: max 10 RAG queries per user per hour

### Schema
```sql
CREATE TABLE nexus_content_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL CHECK (source_type IN ('article', 'webinar', 'podcast', 'roundtable', 'newsletter', 'diagnostic_insight')),
  source_title TEXT NOT NULL,
  source_url TEXT,
  month_tag TEXT,
  theme TEXT,
  diagnostic_tags TEXT[] DEFAULT '{}',
  audience TEXT DEFAULT 'all' CHECK (audience IN ('all', 'b2c', 'b2b', 'elite')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE nexus_content_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES nexus_content_library(id),
  chunk_index INTEGER NOT NULL,
  text TEXT NOT NULL,
  embedding VECTOR(1536),
  token_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_content_chunks_embedding ON nexus_content_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### Acceptance Criteria
- [ ] Content ingestion pipeline processes Notion articles automatically
- [ ] Semantic search returns relevant chunks (<500ms)
- [ ] Nexus responses cite content sources when using RAG
- [ ] B2B-only content not leaked to B2C users
- [ ] Proprietary diagnostic methodology never exposed
- [ ] Vector index performs well with 1000+ chunks
- [ ] Content refresh: new assets indexed within 24h of publication

---

## N5 — Proactive Suggestion Engine + Recommendation Engine

**Estimate:** 24-30h
**Dependencies:** N1, N2, N3, N4
**Blocks:** None (terminal)

### Scope
The proactive layer: Nexus surfaces timely suggestions without being asked — both product features and flywheel service recommendations.

### Requirements

1. **Proactive Suggestion Engine**
   - Trigger detection: analyze conversation context + user state for actionable moments
   - Priority scoring: relevance × urgency × tier-appropriateness
   - Delivery: in-conversation nudge (not popup/notification)
   - Types: upcoming events, relevant content, peer connections, coaching reminders, development milestones

2. **Recommendation Engine** (per spec §3.4)
   - Implements §1.7 boundary: recommends flywheel services conversationally
   - Trigger thresholds:
     - recurring_theme: same topic mentioned 3+ times → suggest related event/resource
     - coaching_readiness: 2+ coaching sessions completed → suggest deeper assessment
     - event_proximity: relevant event within 14 days → mention conversationally
     - peer_activity: peers significantly more engaged → gentle nudge
     - diagnostic_depth: conversation depth score > 0.7 → suggest formal diagnostic
   - Rules:
     - Never recommend if < 3 substantive conversations
     - Never recommend same service twice without follow-up
     - Always frame as natural suggestion, never as sales pitch
     - Always offer opt-out ("No pressure — just thought it might be relevant")

3. **Suggestion State Machine**
   ```
   DETECT trigger → EVALUATE relevance → CHECK history → 
   → FORMAT as natural suggestion → DELIVER in conversation →
   → AWAIT response → LOG outcome (accepted/dismissed/ignored)
   ```

4. **Anti-Spam Logic**
   - Max 1 proactive suggestion per conversation session
   - Min 48h between recommendations of same category
   - If user dismisses twice → suppress that category for 30 days
   - Track acceptance rate; auto-throttle if < 20% acceptance

### Schema
```sql
CREATE TABLE nexus_proactive_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  suggestion_type TEXT NOT NULL,
  suggestion_category TEXT NOT NULL,
  trigger_data JSONB DEFAULT '{}',
  suggestion_text TEXT,
  outcome TEXT CHECK (outcome IN ('accepted', 'dismissed', 'ignored', 'pending')),
  conversation_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ
);
CREATE INDEX idx_proactive_user ON nexus_proactive_log(user_id, created_at DESC);
```

### Acceptance Criteria
- [ ] Nexus proactively suggests relevant events/resources during conversation
- [ ] Flywheel recommendations feel natural, not salesy (qualitative review)
- [ ] Never recommends same service twice without acknowledgment
- [ ] Anti-spam: max 1 suggestion per session, 48h cooldown between same category
- [ ] User dismissal tracked; suppressed after 2 dismissals
- [ ] All suggestions logged with outcome tracking
- [ ] Suggestion acceptance rate monitored (target: >30%)

### Test Cases
| Test | Input | Expected |
|------|-------|----------|
| Recurring theme | User mentions "cross-border" 3 times across sessions | Nexus: "There's a roundtable on cross-border teams next Thursday..." |
| Anti-spam | Dismisses suggestion twice | That category suppressed for 30 days |
| Eligibility check | New user, 1 conversation | No recommendations yet |
| Natural framing | User eligible for coaching | "Based on what you've shared, working with a coach might help..." |

---

## N6 — Journey Intelligence Dashboard

**Estimate:** 20-25h
**Dependencies:** N1, N2, N3
**Blocks:** None (terminal)

### Scope
User-facing development tracking (NOT gamification). Quarterly Development Reviews + ongoing progress indicators per spec §1.5.

### Requirements

1. **Development Dimensions Tracker**
   - Track 6+ dimensions: strategic thinking, cross-border adaptability, stakeholder influence, communication, decision-making, team leadership
   - Score based on: conversation analysis, coaching outcomes, diagnostic data, self-assessments
   - Visualize as radar chart or progress bars (no XP/levels/badges)

2. **Engagement Signals**
   - Conversation frequency, depth, topic diversity
   - Event attendance (from recommendation engine)
   - Coaching session follow-through
   - Content engagement (articles read, topics explored)

3. **Quarterly Development Review** (generated by Nexus)
   - Auto-generated at end of each quarter
   - Sections: Strength Momentum, Watch Areas, Peer Context (anonymous, opt-in)
   - Delivered in-conversation (not email, not notification)
   - Includes actionable next steps

4. **In-Conversation Milestones**
   - Natural language recognition (not badge notifications)
   - Examples per spec §1.5:
     - "I now have a solid understanding of your leadership approach"
     - "You're building a good coaching rhythm — the consistency is showing"
     - "Other members are benefiting from your perspective"

5. **Peer Comparison** (opt-in, anonymous)
   - Compare engagement metrics to peer group
   - Never show individual peer data
   - Dimensions: conversation depth, event engagement, action follow-through

### Schema
```sql
CREATE TABLE nexus_journey_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  dimension TEXT NOT NULL,
  score NUMERIC CHECK (score BETWEEN 0 AND 100),
  evidence JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_journey_user ON nexus_journey_tracking(user_id);

CREATE TABLE nexus_quarterly_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  quarter TEXT NOT NULL,
  year INTEGER NOT NULL,
  strengths JSONB DEFAULT '[]',
  watch_areas JSONB DEFAULT '[]',
  peer_context JSONB DEFAULT '{}',
  next_steps JSONB DEFAULT '[]',
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, quarter, year)
);

CREATE TABLE nexus_engagement_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  signal_type TEXT NOT NULL CHECK (signal_type IN ('conversation', 'event', 'coaching', 'content')),
  signal_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Acceptance Criteria
- [ ] 6+ development dimensions tracked with scores
- [ ] No XP, badges, streaks, or leaderboards anywhere
- [ ] Quarterly Review auto-generates and delivers in-conversation
- [ ] Peer comparison only shown when user opts in
- [ ] Milestone recognition delivered as natural conversation, not notifications
- [ ] Engagement signals captured from all interaction types
- [ ] Radar chart / progress visualization renders correctly

---

## N7 — Subscription & Billing (Stripe Integration)

**Estimate:** 20-28h
**Dependencies:** None (parallel track)
**Blocks:** N3 (needs tier system)

### Scope
Stripe integration for subscription management: plans, checkout, webhooks, credit packs, tier upgrades/downgrades.

### Requirements

1. **Stripe Product Setup**
   - 5 subscription tiers (Free, Starter ¥199/mo, Growth ¥499/mo, Elite ¥999/mo, Corporate ¥4,999/mo)
   - Annual billing option (2 months free: ¥1,999/yr, ¥4,999/yr, ¥9,999/yr)
   - Credit packs: 10 credits ¥49, 50 credits ¥199, 100 credits ¥349
   - Currency: CNY (¥)

2. **Checkout Flow**
   - Stripe Checkout (hosted) for new subscriptions
   - Stripe Customer Portal for management (upgrade/downgrade/cancel)
   - Proration handling for mid-cycle tier changes
   - Free trial: 7-day Starter trial for new signups

3. **Webhook Handlers**
   - `checkout.session.completed` → activate subscription
   - `customer.subscription.updated` → update tier + credits
   - `customer.subscription.deleted` → downgrade to free
   - `invoice.payment_succeeded` → credit monthly allowance
   - `invoice.payment_failed` → grace period (7d) → downgrade
   - `customer.subscription.trial_will_end` → reminder notification

4. **Credit Management**
   - Monthly credit allowance per tier (Starter: 8, Growth: 20, Elite: 50, Corporate: 200)
   - Credits reset monthly (unused don't roll over)
   - Credit pack purchases: immediate credit addition
   - Credit usage tracking per interaction (Flash=1, Pro=3)

5. **Environment Variables Needed**
   - STRIPE_SECRET_KEY
   - STRIPE_WEBHOOK_SECRET
   - STRIPE_PRICE_STARTER_MONTHLY / YEARLY
   - STRIPE_PRICE_GROWTH_MONTHLY / YEARLY
   - STRIPE_PRICE_ELITE_MONTHLY / YEARLY
   - STRIPE_PRICE_CORPORATE_MONTHLY / YEARLY
   - STRIPE_PRICE_CREDITS_10 / 50 / 100

### Schema
```sql
CREATE TABLE nexus_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'starter', 'growth', 'elite', 'corporate')),
  billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'trialing', 'incomplete')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE nexus_credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('monthly_allowance', 'purchase', 'consumption', 'refund', 'adjustment')),
  reference_type TEXT,
  reference_id TEXT,
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_credits_user ON nexus_credit_transactions(user_id, created_at DESC);
```

### Acceptance Criteria
- [ ] Users can subscribe to any tier via Stripe Checkout
- [ ] Webhooks correctly update subscription status
- [ ] Credits allocated monthly based on tier
- [ ] Credit packs purchasable and immediately available
- [ ] Failed payments: 7-day grace period then downgrade
- [ ] Customer portal for self-service management
- [ ] All transactions logged with balance tracking
- [ ] Free tier enforced (no credits, limited conversations)

---

## Dependency Graph

```
N1 (Conversation Engine)
 ├── N2 (Memory System)
 │    ├── N3 (Context + Tiers)
 │    │    ├── N5 (Proactive + Recommendations)
 │    │    └── N6 (Journey Intelligence)
 │    └── N4 (RAG Content)
 │         └── N6 (uses RAG for content recommendations)
 └── N7 (Stripe Billing) ── runs parallel, feeds into N3

N7 is the only parallel track — everything else is sequential.
```

### Parallel Execution
- **Week 1:** N1 starts. N7 (Stripe) starts in parallel.
- **Week 2:** N1 completes. N2 starts.
- **Week 3:** N2 completes. N3 starts (needs N1+N2). N4 starts in parallel (needs N1+N2).
- **Week 4:** N3 completes. N4 completes. N5 starts (needs N1-N4). N6 starts (needs N1-N3).
- **Week 5-6:** N5, N6 complete. Integration testing. Buffer.

---

## Summary

| Ticket | Scope | Hours | Key Deliverables |
|--------|-------|-------|-----------------|
| N1 | Conversation Engine + Intent Router | 28-35h | Chat UI, 11-intent classifier, DeepSeek routing, streaming |
| N2 | Memory System | 24-30h | Working/Episodic/Semantic memory, cross-session recall |
| N3 | Context Assembly + Tier Gating | 16-20h | 8-layer context pipeline, 5-tier gating, diagnostic translation |
| N4 | RAG Content Library | 20-28h | Content ingestion, vector search, citation, guardrails |
| N5 | Proactive + Recommendation Engine | 24-30h | Flywheel surfacing (§1.7), anti-spam, natural suggestions |
| N6 | Journey Intelligence | 20-25h | Development tracking, quarterly reviews, no-gamification |
| N7 | Stripe Billing | 20-28h | 5 tiers, credits, webhooks, customer portal |
| **Total** | **Phase 1 Foundation** | **152-196h** | **7 tickets, 6 weeks, full Nexus companion MVP** |

---

## Blocked By External Dependencies

| Blocker | Owner | Impact |
|---------|-------|--------|
| Stripe env vars (keys + price IDs) | Kevin | N7 cannot start without these |
| RESEND_API_KEY | Kevin | Email notifications blocked |
| Notion content export | NEXUS (automated) | N4 needs content to index |
| Supabase pgvector extension | Kevin (dashboard) | N2/N4 need vector search enabled |
