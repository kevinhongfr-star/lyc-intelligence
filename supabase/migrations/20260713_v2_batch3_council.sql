-- ============================================================================
-- v2 Batch 3 — Council Portal Schema
-- Tickets 21-30 of File 02 (Supabase Backend Architecture)
-- ============================================================================

-- ── Ticket 21: Council profiles table ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.council_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  title TEXT,
  company TEXT,
  industry TEXT,
  bio TEXT,
  avatar_url TEXT,
  linkedin_url TEXT,
  expertise TEXT[] DEFAULT '{}',
  interests TEXT[] DEFAULT '{}',
  city TEXT,
  country TEXT DEFAULT 'CN',
  membership_tier TEXT DEFAULT 'individual'
    CHECK (membership_tier IN ('founding', 'individual', 'corporate', 'pe_partner')),
  membership_status TEXT DEFAULT 'active'
    CHECK (membership_status IN ('pending', 'active', 'suspended', 'expired', 'cancelled')),
  membership_started_at TIMESTAMPTZ,
  membership_expires_at TIMESTAMPTZ,
  founding_member BOOLEAN DEFAULT FALSE,
  council_credits INTEGER DEFAULT 0,
  credits_reset_at TIMESTAMPTZ,
  coaching_hours_used INTEGER DEFAULT 0,
  events_attended INTEGER DEFAULT 0,
  referral_count INTEGER DEFAULT 0,
  verification_status TEXT DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  is_public BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_council_tier ON public.council_profiles(membership_tier);
CREATE INDEX IF NOT EXISTS idx_council_status ON public.council_profiles(membership_status);
CREATE INDEX IF NOT EXISTS idx_council_expertise ON public.council_profiles USING GIN(expertise);
CREATE INDEX IF NOT EXISTS idx_council_industry ON public.council_profiles(industry);
CREATE INDEX IF NOT EXISTS idx_council_city ON public.council_profiles(city);

ALTER TABLE public.council_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles visible to all authenticated users"
  ON public.council_profiles FOR SELECT TO authenticated
  USING (is_public = true AND deleted_at IS NULL);

CREATE POLICY "Users can view their own full profile"
  ON public.council_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Users can update their own profile"
  ON public.council_profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Admin can manage council profiles"
  ON public.council_profiles FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager', 'director')
    )
    AND deleted_at IS NULL
  );

DROP TRIGGER IF EXISTS trg_council_profiles_updated_at ON public.council_profiles;
CREATE TRIGGER trg_council_profiles_updated_at
  BEFORE UPDATE ON public.council_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Ticket 22: Council coaching sessions table ──────────────────────────────

CREATE TABLE IF NOT EXISTS public.council_coaching_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES public.council_profiles(id) ON DELETE CASCADE,
  consultant_id UUID NOT NULL,
  session_type TEXT CHECK (session_type IN (
    'career_coaching', 'executive_coaching', 'leadership_coaching',
    'interview_prep', 'salary_negotiation', 'business_strategy',
    'transition_coaching', 'peer_mentoring'
  )),
  status TEXT DEFAULT 'requested'
    CHECK (status IN ('requested', 'scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
  scheduled_at TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 60,
  meeting_url TEXT,
  meeting_notes TEXT,
  credits_consumed INTEGER DEFAULT 1,
  member_rating INTEGER CHECK (member_rating BETWEEN 1 AND 5),
  member_feedback TEXT,
  consultant_notes TEXT,
  recording_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_coaching_member ON public.council_coaching_sessions(member_id);
CREATE INDEX IF NOT EXISTS idx_coaching_consultant ON public.council_coaching_sessions(consultant_id);
CREATE INDEX IF NOT EXISTS idx_coaching_status ON public.council_coaching_sessions(status);
CREATE INDEX IF NOT EXISTS idx_coaching_scheduled ON public.council_coaching_sessions(scheduled_at);

ALTER TABLE public.council_coaching_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their own coaching sessions"
  ON public.council_coaching_sessions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.council_profiles cp
      WHERE cp.id = council_coaching_sessions.member_id
        AND cp.user_id = auth.uid()
    )
    AND deleted_at IS NULL
  );

CREATE POLICY "Consultants can view their own coaching sessions"
  ON public.council_coaching_sessions FOR SELECT TO authenticated
  USING (consultant_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Members can request coaching sessions"
  ON public.council_coaching_sessions FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.council_profiles cp
      WHERE cp.id = council_coaching_sessions.member_id
        AND cp.user_id = auth.uid()
        AND cp.membership_status = 'active'
    )
  );

CREATE POLICY "Consultants and admins can manage coaching sessions"
  ON public.council_coaching_sessions FOR ALL TO authenticated
  USING (
    consultant_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager', 'director')
    )
    AND deleted_at IS NULL
  );

DROP TRIGGER IF EXISTS trg_coaching_sessions_updated_at ON public.council_coaching_sessions;
CREATE TRIGGER trg_coaching_sessions_updated_at
  BEFORE UPDATE ON public.council_coaching_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Ticket 23: Council events table ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.council_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  event_type TEXT CHECK (event_type IN (
    'workshop', 'webinar', 'roundtable', 'networking', 'masterclass',
    'firing_line', 'keynote', 'panel', 'social'
  )),
  category TEXT,
  format TEXT CHECK (format IN ('in_person', 'virtual', 'hybrid')),
  venue_name TEXT,
  venue_address TEXT,
  city TEXT,
  virtual_url TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  capacity INTEGER,
  registered_count INTEGER DEFAULT 0,
  price_cny DECIMAL(10,2) DEFAULT 0,
  is_free_to_members BOOLEAN DEFAULT TRUE,
  credits_cost INTEGER DEFAULT 0,
  speaker_names TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  cover_image_url TEXT,
  status TEXT DEFAULT 'draft'
    CHECK (status IN (
      'draft', 'published', 'registration_open', 'registration_closed',
      'in_progress', 'completed', 'cancelled'
    )),
  recording_url TEXT,
  materials JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_status ON public.council_events(status);
CREATE INDEX IF NOT EXISTS idx_events_starts ON public.council_events(starts_at);
CREATE INDEX IF NOT EXISTS idx_events_type ON public.council_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_city ON public.council_events(city);
CREATE INDEX IF NOT EXISTS idx_events_tags ON public.council_events USING GIN(tags);

ALTER TABLE public.council_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published events visible to all authenticated users"
  ON public.council_events FOR SELECT TO authenticated
  USING (status IN ('published', 'registration_open', 'registration_closed', 'in_progress', 'completed') AND deleted_at IS NULL);

CREATE POLICY "Admins can manage events"
  ON public.council_events FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager', 'director')
    )
    AND deleted_at IS NULL
  );

DROP TRIGGER IF EXISTS trg_council_events_updated_at ON public.council_events;
CREATE TRIGGER trg_council_events_updated_at
  BEFORE UPDATE ON public.council_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Ticket 24: Council event registrations table ────────────────────────────

CREATE TABLE IF NOT EXISTS public.council_event_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.council_events(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.council_profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'registered'
    CHECK (status IN ('registered', 'waitlisted', 'confirmed', 'checked_in', 'attended', 'cancelled', 'no_show')),
  credits_consumed INTEGER DEFAULT 0,
  payment_status TEXT DEFAULT 'free'
    CHECK (payment_status IN ('free', 'pending', 'paid', 'refunded')),
  stripe_payment_id TEXT,
  attended_at TIMESTAMPTZ,
  feedback JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_event_reg_event ON public.council_event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_reg_member ON public.council_event_registrations(member_id);
CREATE INDEX IF NOT EXISTS idx_event_reg_status ON public.council_event_registrations(status);

ALTER TABLE public.council_event_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their own registrations"
  ON public.council_event_registrations FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.council_profiles cp
      WHERE cp.id = council_event_registrations.member_id
        AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can register for events"
  ON public.council_event_registrations FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.council_profiles cp
      WHERE cp.id = council_event_registrations.member_id
        AND cp.user_id = auth.uid()
        AND cp.membership_status = 'active'
    )
  );

CREATE POLICY "Admins can manage registrations"
  ON public.council_event_registrations FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager', 'director')
    )
  );

DROP TRIGGER IF EXISTS trg_event_registrations_updated_at ON public.council_event_registrations;
CREATE TRIGGER trg_event_registrations_updated_at
  BEFORE UPDATE ON public.council_event_registrations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Ticket 25: RLS policies for council_profiles ───────────────────────────
-- Defined inline with council_profiles above.
-- Key policies: public profiles visible, owner full access, admin management.

-- ── Ticket 26: RLS policies for coaching_sessions ──────────────────────────
-- Defined inline with council_coaching_sessions above.
-- Key policies: member view own, consultant view own, member can request, admin manage.

-- ── Ticket 27: RLS policies for events ─────────────────────────────────────
-- Defined inline with council_events above.
-- Key policies: published events public, admin full management.

-- ── Ticket 28: RLS policies for event_registrations ────────────────────────
-- Defined inline with council_event_registrations above.
-- Key policies: member view/register own, admin manage all.

-- ── Ticket 29: Indexes & constraints for Council schema ────────────────────
-- All indexes and constraints defined inline:
--   council_profiles: 5 indexes (tier, status, expertise GIN, industry, city)
--   council_coaching_sessions: 4 indexes (member, consultant, status, scheduled)
--   council_events: 5 indexes (status, starts_at, type, city, tags GIN)
--   council_event_registrations: 3 indexes (event, member, status)
--   UNIQUE constraints: events(slug), event_registrations(event_id, member_id)
--   CHECK constraints: all enum-style columns + rating bounds

-- ── Ticket 30: updated_at triggers for Council schema ─────────────────────
-- All 4 tables have BEFORE UPDATE triggers using shared set_updated_at().
-- Triggers: trg_council_profiles_updated_at, trg_coaching_sessions_updated_at,
--           trg_council_events_updated_at, trg_event_registrations_updated_at
