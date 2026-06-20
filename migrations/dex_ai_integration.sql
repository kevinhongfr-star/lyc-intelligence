-- ============================================================
-- LYC Intelligence — DEX AI Integration SQL Migrations
-- Generated: 2026-06-20
-- ============================================================

-- 1. Notifications table (currently using vista_action_queue which works)
-- This creates a dedicated notifications table for future use.
-- NOT required immediately — vista_action_queue serves as the action items source.
--
-- CREATE TABLE IF NOT EXISTS notifications (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   user_id UUID REFERENCES auth.users(id),
--   title TEXT NOT NULL,
--   description TEXT,
--   action_type TEXT DEFAULT 'info',
--   priority TEXT DEFAULT 'normal',
--   status TEXT DEFAULT 'unread',
--   link TEXT,
--   created_at TIMESTAMPTZ DEFAULT now(),
--   read_at TIMESTAMPTZ
-- );
-- CREATE INDEX idx_notifications_user_status ON notifications(user_id, status);

-- 2. Extend profiles table for role-based access
-- Current roles: admin, user
-- Adding: recruiter, client, candidate for future multi-user support
--
-- NOTE: Do NOT run this yet — requires Kevin's approval for schema change.
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department TEXT;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS client_organization TEXT;

-- 3. Documents table already exists with columns:
--    id, mandate_id, contact_id, name, type, visibility, created_at
--    No migration needed.

-- 4. Events table already exists with columns:
--    id, title, start_time, end_time, location, mandate_id, contact_id, status, created_at
--    No migration needed.

-- 5. candidates_pipeline table already exists with 276 records
--    Columns: id, mandate_id, contact_id, stage, verdict, trident_composite, etc.
--    No migration needed.

-- Summary: NO migrations required for Phase 1-3.
-- All tables (documents, events, candidates_pipeline, vista_action_queue) exist and are populated.
