-- #1393 — Profile settings columns. Instant save for SettingsPageV3 toggles.
-- Cols map 1:1 to the 6 toggles in SettingsPageV3 via updateProfile(). Defaults
-- match the UI defaults.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notif_product_updates BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notif_milestone_reminders BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notif_coaching_followups BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notif_nudges BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS allow_anonymous_benchmarks BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hide_profile_from_consultants BOOLEAN DEFAULT false;

UPDATE profiles SET notif_product_updates = true WHERE notif_product_updates IS NULL;
UPDATE profiles SET notif_milestone_reminders = true WHERE notif_milestone_reminders IS NULL;
UPDATE profiles SET notif_coaching_followups = true WHERE notif_coaching_followups IS NULL;
UPDATE profiles SET notif_nudges = false WHERE notif_nudges IS NULL;
UPDATE profiles SET allow_anonymous_benchmarks = true WHERE allow_anonymous_benchmarks IS NULL;
UPDATE profiles SET hide_profile_from_consultants = false WHERE hide_profile_from_consultants IS NULL;
