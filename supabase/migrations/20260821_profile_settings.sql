-- #1393 corrective batch — Profile settings columns
--
-- SettingsPageV3 toggles for notifications + privacy must persist to the
-- profiles table. These columns are written by updateProfile() (already
-- strips privileged columns; these are user-managed so they pass through).
-- Defaults match the UI defaults in SettingsPageV3.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notif_product_updates BOOLEAN DEFAULT true;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notif_milestone_reminders BOOLEAN DEFAULT true;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notif_coaching_followups BOOLEAN DEFAULT true;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notif_nudges BOOLEAN DEFAULT false;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS allow_anonymous_benchmarks BOOLEAN DEFAULT true;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS hide_profile_from_consultants BOOLEAN DEFAULT false;

-- Backfill existing rows to defaults (ADD COLUMN DEFAULT already handles new
-- rows; this makes the columns non-null for existing users).
UPDATE profiles SET notif_product_updates = true WHERE notif_product_updates IS NULL;
UPDATE profiles SET notif_milestone_reminders = true WHERE notif_milestone_reminders IS NULL;
UPDATE profiles SET notif_coaching_followups = true WHERE notif_coaching_followups IS NULL;
UPDATE profiles SET notif_nudges = false WHERE notif_nudges IS NULL;
UPDATE profiles SET allow_anonymous_benchmarks = true WHERE allow_anonymous_benchmarks IS NULL;
UPDATE profiles SET hide_profile_from_consultants = false WHERE hide_profile_from_consultants IS NULL;
