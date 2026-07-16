-- ============================================================================
-- LMS-001: Learning Management System Schema
-- Courses, Lessons, Enrollments, Lesson Progress, Quizzes, Certificates
-- ============================================================================

-- ----------------------------------------------------------------------------
-- LMS Courses table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lms_courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  long_description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  price_cny DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_usd DECIMAL(10,2) DEFAULT 0,
  team_price_cny DECIMAL(10,2),
  team_price_usd DECIMAL(10,2),
  team_max_seats INTEGER DEFAULT 5,
  duration_weeks INTEGER,
  estimated_hours FLOAT,
  companion_diagnostic TEXT,
  diagnostic_discount_pct INTEGER DEFAULT 0,
  prerequisite_course_id UUID REFERENCES lms_courses(id),
  cover_image_url TEXT,
  notion_page_id TEXT,
  cd_reference TEXT,
  instructor_notes TEXT,
  avg_rating DECIMAL(2,1),
  review_count INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lms_courses_status ON public.lms_courses(status);
CREATE INDEX IF NOT EXISTS idx_lms_courses_slug ON public.lms_courses(slug);
CREATE INDEX IF NOT EXISTS idx_lms_courses_published ON public.lms_courses(published_at);

ALTER TABLE public.lms_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published courses"
  ON public.lms_courses FOR SELECT
  USING (status = 'published');

CREATE POLICY "Authenticated users can view all courses"
  ON public.lms_courses FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Service role has full access to courses"
  ON public.lms_courses FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin can manage courses"
  ON public.lms_courses FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM v2_user_profiles p
      WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM v2_user_profiles p
      WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'admin')
    )
  );

DROP TRIGGER IF EXISTS trg_lms_courses_updated_at ON public.lms_courses;
CREATE TRIGGER trg_lms_courses_updated_at
  BEFORE UPDATE ON public.lms_courses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- LMS Quizzes table (before lessons so lessons can reference quizzes)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lms_quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID,
  title TEXT,
  passing_score DECIMAL(5,2) DEFAULT 70.00,
  max_attempts INTEGER DEFAULT 3,
  questions JSONB NOT NULL DEFAULT '[]',
  answer_key JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lms_quizzes_lesson ON public.lms_quizzes(lesson_id);

ALTER TABLE public.lms_quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to quizzes"
  ON public.lms_quizzes FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin can manage quizzes"
  ON public.lms_quizzes FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM v2_user_profiles p
      WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM v2_user_profiles p
      WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'admin')
    )
  );

DROP TRIGGER IF EXISTS trg_lms_quizzes_updated_at ON public.lms_quizzes;
CREATE TRIGGER trg_lms_quizzes_updated_at
  BEFORE UPDATE ON public.lms_quizzes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- LMS Lessons table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lms_lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES lms_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  duration_minutes INTEGER,
  video_url TEXT,
  video_duration_seconds INTEGER,
  reading_content TEXT,
  reading_word_count INTEGER,
  exercise_content TEXT,
  quiz_id UUID REFERENCES lms_quizzes(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  notion_page_id TEXT,
  instructor_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lms_lessons_course ON public.lms_lessons(course_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_lms_lessons_status ON public.lms_lessons(status);

ALTER TABLE public.lms_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published lessons"
  ON public.lms_lessons FOR SELECT
  USING (status = 'published');

CREATE POLICY "Authenticated users can view all lessons"
  ON public.lms_lessons FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Service role has full access to lessons"
  ON public.lms_lessons FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin can manage lessons"
  ON public.lms_lessons FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM v2_user_profiles p
      WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM v2_user_profiles p
      WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'admin')
    )
  );

DROP TRIGGER IF EXISTS trg_lms_lessons_updated_at ON public.lms_lessons;
CREATE TRIGGER trg_lms_lessons_updated_at
  BEFORE UPDATE ON public.lms_lessons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Add FK from quizzes to lessons after lessons table exists
ALTER TABLE public.lms_quizzes
  ADD CONSTRAINT lms_quizzes_lesson_id_fkey
  FOREIGN KEY (lesson_id) REFERENCES lms_lessons(id) ON DELETE CASCADE;

-- ----------------------------------------------------------------------------
-- LMS Enrollments table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lms_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES lms_courses(id),
  contact_id UUID NOT NULL REFERENCES contacts(id),
  user_id UUID REFERENCES v2_user_profiles(id),
  enrollment_type TEXT NOT NULL DEFAULT 'individual' CHECK (enrollment_type IN ('individual', 'team')),
  team_id UUID,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'expired')),
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  discount_code_id UUID,
  payment_id TEXT,
  diagnostic_discount_code TEXT,
  certificate_id TEXT,
  certificate_url TEXT,
  last_lesson_id UUID REFERENCES lms_lessons(id),
  progress_percent DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, contact_id)
);

CREATE INDEX IF NOT EXISTS idx_lms_enrollments_contact ON public.lms_enrollments(contact_id);
CREATE INDEX IF NOT EXISTS idx_lms_enrollments_course ON public.lms_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_lms_enrollments_user ON public.lms_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_lms_enrollments_status ON public.lms_enrollments(status);

ALTER TABLE public.lms_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own enrollments"
  ON public.lms_enrollments FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM contacts c
      WHERE c.id = lms_enrollments.contact_id
      AND c.id IN (
        SELECT id FROM contacts WHERE email = (
          SELECT email FROM v2_user_profiles WHERE id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Service role has full access to enrollments"
  ON public.lms_enrollments FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin can manage enrollments"
  ON public.lms_enrollments FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM v2_user_profiles p
      WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM v2_user_profiles p
      WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'admin')
    )
  );

DROP TRIGGER IF EXISTS trg_lms_enrollments_updated_at ON public.lms_enrollments;
CREATE TRIGGER trg_lms_enrollments_updated_at
  BEFORE UPDATE ON public.lms_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- LMS Lesson Progress table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lms_lesson_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id UUID NOT NULL REFERENCES lms_enrollments(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lms_lessons(id),
  video_watched BOOLEAN DEFAULT FALSE,
  video_last_position_seconds INTEGER DEFAULT 0,
  reading_viewed BOOLEAN DEFAULT FALSE,
  exercise_completed BOOLEAN DEFAULT FALSE,
  exercise_submission TEXT,
  quiz_attempted BOOLEAN DEFAULT FALSE,
  quiz_score DECIMAL(5,2),
  quiz_attempts INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(enrollment_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_lms_progress_enrollment ON public.lms_lesson_progress(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_lms_progress_lesson ON public.lms_lesson_progress(lesson_id);

ALTER TABLE public.lms_lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
  ON public.lms_lesson_progress FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lms_enrollments e
      WHERE e.id = lms_lesson_progress.enrollment_id
      AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own progress"
  ON public.lms_lesson_progress FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lms_enrollments e
      WHERE e.id = lms_lesson_progress.enrollment_id
      AND e.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lms_enrollments e
      WHERE e.id = lms_lesson_progress.enrollment_id
      AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role has full access to progress"
  ON public.lms_lesson_progress FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin can view progress"
  ON public.lms_lesson_progress FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM v2_user_profiles p
      WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'admin')
    )
  );

DROP TRIGGER IF EXISTS trg_lms_lesson_progress_updated_at ON public.lms_lesson_progress;
CREATE TRIGGER trg_lms_lesson_progress_updated_at
  BEFORE UPDATE ON public.lms_lesson_progress
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- LMS Certificates table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lms_certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id UUID NOT NULL REFERENCES lms_enrollments(id),
  certificate_code TEXT UNIQUE NOT NULL,
  participant_name TEXT NOT NULL,
  course_title TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  verified BOOLEAN DEFAULT FALSE,
  certificate_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lms_certificates_code ON public.lms_certificates(certificate_code);
CREATE INDEX IF NOT EXISTS idx_lms_certificates_enrollment ON public.lms_certificates(enrollment_id);

ALTER TABLE public.lms_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can verify certificates"
  ON public.lms_certificates FOR SELECT
  USING (true);

CREATE POLICY "Service role has full access to certificates"
  ON public.lms_certificates FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin can manage certificates"
  ON public.lms_certificates FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM v2_user_profiles p
      WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM v2_user_profiles p
      WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'admin')
    )
  );

-- ----------------------------------------------------------------------------
-- LMS Reviews table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lms_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id UUID NOT NULL REFERENCES lms_enrollments(id),
  course_id UUID NOT NULL REFERENCES lms_courses(id),
  contact_id UUID NOT NULL REFERENCES contacts(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(enrollment_id)
);

CREATE INDEX IF NOT EXISTS idx_lms_reviews_course ON public.lms_reviews(course_id);
CREATE INDEX IF NOT EXISTS idx_lms_reviews_visible ON public.lms_reviews(is_visible);

ALTER TABLE public.lms_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view visible reviews"
  ON public.lms_reviews FOR SELECT
  USING (is_visible = true);

CREATE POLICY "Authenticated users can view all reviews"
  ON public.lms_reviews FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Service role has full access to reviews"
  ON public.lms_reviews FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin can manage reviews"
  ON public.lms_reviews FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM v2_user_profiles p
      WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM v2_user_profiles p
      WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'admin')
    )
  );

-- ----------------------------------------------------------------------------
-- Helper function: update course progress
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.update_course_progress(UUID);
CREATE OR REPLACE FUNCTION public.update_course_progress(p_enrollment_id UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  v_total_lessons INTEGER;
  v_completed_lessons INTEGER;
  v_progress DECIMAL(5,2);
  v_course_id UUID;
BEGIN
  SELECT e.course_id INTO v_course_id
  FROM lms_enrollments e WHERE e.id = p_enrollment_id;

  SELECT COUNT(*) INTO v_total_lessons
  FROM lms_lessons l
  WHERE l.course_id = v_course_id AND l.status = 'published';

  IF v_total_lessons = 0 THEN
    RETURN 0;
  END IF;

  SELECT COUNT(*) INTO v_completed_lessons
  FROM lms_lesson_progress lp
  JOIN lms_lessons l ON l.id = lp.lesson_id
  WHERE lp.enrollment_id = p_enrollment_id
    AND l.course_id = v_course_id
    AND lp.completed_at IS NOT NULL;

  v_progress := ROUND((v_completed_lessons::DECIMAL / v_total_lessons::DECIMAL) * 100, 2);

  UPDATE lms_enrollments
  SET progress_percent = v_progress,
      completed_at = CASE WHEN v_progress = 100 THEN NOW() ELSE completed_at END,
      status = CASE WHEN v_progress = 100 THEN 'completed' ELSE status END
  WHERE id = p_enrollment_id;

  RETURN v_progress;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;
