-- #1316: Schema naming drift — credits.balance → credits.miles
--
-- Brand rule: currency unit is "miles" (not credits, not balance).
-- User-facing: always "miles". Schema should reflect product language.
--
-- This migration renames the credits.balance column to credits.miles.
-- credit_transactions is verified — it uses `amount` (not `balance`), so no
-- change needed there.
--
-- Idempotent: uses DO block to check existence before renaming.

DO $$
BEGIN
  -- Rename balance → miles on credits table
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'credits' AND column_name = 'balance'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'credits' AND column_name = 'miles'
  ) THEN
    ALTER TABLE credits RENAME COLUMN balance TO miles;
  END IF;
END $$;

-- Verify: column should now be `miles`, not `balance`
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'credits';
