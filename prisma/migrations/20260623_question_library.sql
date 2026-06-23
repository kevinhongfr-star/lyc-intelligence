-- Phase 7.2: Question Library Migration
-- Pre-built question bank organized by competency and difficulty

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Question content
  question_text text NOT NULL,
  competency text NOT NULL CHECK (competency IN (
    'technical', 'leadership', 'communication', 'problem_solving',
    'teamwork', 'cultural_fit', 'strategic_thinking', 'adaptability',
    'decision_making', 'customer_focus', 'innovation', 'execution'
  )),
  difficulty int CHECK (difficulty BETWEEN 1 AND 3),
  expected_answer text,
  follow_up_question text,
  -- Metadata
  is_system boolean DEFAULT false,
  created_by uuid REFERENCES profiles(id),
  organization_id uuid REFERENCES organizations(id),
  starred_by uuid[] DEFAULT '{}',
  usage_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Question sets table
CREATE TABLE IF NOT EXISTS question_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  question_ids uuid[] NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES profiles(id),
  organization_id uuid REFERENCES organizations(id),
  is_shared boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_questions_competency ON questions(competency);
CREATE INDEX IF NOT EXISTS idx_questions_org ON questions(organization_id);
CREATE INDEX IF NOT EXISTS idx_questions_system ON questions(is_system);
CREATE INDEX IF NOT EXISTS idx_questions_starred ON questions(starred_by);
CREATE INDEX IF NOT EXISTS idx_question_sets_org ON question_sets(organization_id);

-- RLS policies
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_sets ENABLE ROW LEVEL SECURITY;

-- Users can view system questions and their org's questions
CREATE POLICY "Users can view accessible questions" ON questions
  FOR SELECT USING (
    is_system = true
    OR organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
    OR created_by = auth.uid()
  );

-- Users can create questions for their org
CREATE POLICY "Users can create questions" ON questions
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Users can update their own questions
CREATE POLICY "Users can update own questions" ON questions
  FOR UPDATE USING (
    created_by = auth.uid()
    AND is_system = false
  );

-- Users can delete their own questions
CREATE POLICY "Users can delete own questions" ON questions
  FOR DELETE USING (
    created_by = auth.uid()
    AND is_system = false
  );

-- Question sets policies
CREATE POLICY "Users can view accessible sets" ON question_sets
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
    OR created_by = auth.uid()
  );

CREATE POLICY "Users can create sets" ON question_sets
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update own sets" ON question_sets
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete own sets" ON question_sets
  FOR DELETE USING (created_by = auth.uid());