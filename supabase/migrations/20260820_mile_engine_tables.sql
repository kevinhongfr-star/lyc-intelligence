-- ═══════════════════════════════════════════════════════════════════════
-- Batch 2 / Ticket 1: Mile engine tables
--
-- Extends the existing `credits` table with separate balance tracking for
-- allocated, rollover, and purchased miles. Adds Explorer free assessment
-- tokens table. Extends credit_transactions with balance_type + instrument.
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. Extend credits table with separate mile balances ───────────────
-- `miles` column already exists (renamed from `balance` in prior migration).
-- We add granular tracking columns. `miles` becomes a computed total
-- (= allocated + rollover + purchased), kept in sync by the engine.

ALTER TABLE credits
  ADD COLUMN IF NOT EXISTS allocated_miles INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rollover_miles INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS purchased_miles INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS purchased_miles_expiry TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_allocation_date DATE;

-- Backfill: existing users get their current `miles` as `allocated_miles`
UPDATE credits
SET allocated_miles = COALESCE(miles, 0)
WHERE allocated_miles = 0 AND COALESCE(miles, 0) > 0;

-- ── 2. Extend credit_transactions with mile engine fields ─────────────
ALTER TABLE credit_transactions
  ADD COLUMN IF NOT EXISTS balance_type TEXT DEFAULT 'allocated'
    CHECK (balance_type IN ('allocated', 'rollover', 'purchased', 'free')),
  ADD COLUMN IF NOT EXISTS instrument_code TEXT,
  ADD COLUMN IF NOT EXISTS assessment_id UUID,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Index for user + created_at lookup (transaction history)
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_created
  ON credit_transactions (user_id, created_at DESC);

-- Index for instrument-specific queries (analytics)
CREATE INDEX IF NOT EXISTS idx_credit_transactions_instrument
  ON credit_transactions (instrument_code)
  WHERE instrument_code IS NOT NULL;

-- ── 3. Explorer free assessment tokens ────────────────────────────────
-- Tracks one-time free assessment usage for Explorer tier.
-- LEAP + PRISM are free for Explorer (per Ticket 2 spec).
CREATE TABLE IF NOT EXISTS explorer_free_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instrument_code TEXT NOT NULL,
  used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assessment_id UUID,
  UNIQUE (user_id, instrument_code)
);

-- RLS: users can only see their own free assessment tokens
ALTER TABLE explorer_free_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY explorer_free_own_select
  ON explorer_free_assessments FOR SELECT
  USING (auth.uid() = user_id);

-- No direct INSERT/UPDATE/DELETE via RLS — only service_role can write
-- (tokens are granted by the backend, not by users directly).

-- ── 4. Mile packs purchase tracking ───────────────────────────────────
-- Tracks purchased mile packs (separate from credit_transactions for
-- easy pack-level reporting + expiry management).
CREATE TABLE IF NOT EXISTS mile_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_id TEXT NOT NULL,           -- 'pack_1', 'pack_5', 'pack_15'
  miles INTEGER NOT NULL,
  price_usd NUMERIC(10,2) NOT NULL,
  stripe_payment_intent TEXT,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,  -- 12 months from purchase
  consumed_miles INTEGER NOT NULL DEFAULT 0,  -- tracks partial consumption
  fully_consumed BOOLEAN NOT NULL DEFAULT FALSE,
  expired BOOLEAN NOT NULL DEFAULT FALSE
);

-- Index for expiry queries
CREATE INDEX IF NOT EXISTS idx_mile_packs_expiry
  ON mile_packs (expires_at)
  WHERE NOT fully_consumed AND NOT expired;

CREATE INDEX IF NOT EXISTS idx_mile_packs_user
  ON mile_packs (user_id, purchased_at DESC);

-- RLS
ALTER TABLE mile_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY mile_packs_own_select
  ON mile_packs FOR SELECT
  USING (auth.uid() = user_id);

-- ── 5. RPC: Atomic mile deduction (allocated first, then purchased) ───
-- Replaces the older decrement_credits_balanced with mile-engine-aware logic.
-- Returns 0 on success, -1 on insufficient balance.
CREATE OR REPLACE FUNCTION deduct_miles_balanced(
  p_user_id UUID,
  p_amount INTEGER,
  p_instrument_code TEXT DEFAULT NULL,
  p_assessment_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  v_allocated INTEGER;
  v_rollover INTEGER;
  v_purchased INTEGER;
  v_from_allocated INTEGER;
  v_from_rollover INTEGER;
  v_from_purchased INTEGER;
  v_remaining INTEGER;
BEGIN
  -- Lock the row for atomic deduction
  SELECT allocated_miles, rollover_miles, purchased_miles
    INTO v_allocated, v_rollover, v_purchased
  FROM credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN -1;
  END IF;

  -- Check sufficient balance
  IF v_allocated + v_rollover + v_purchased < p_amount THEN
    RETURN -1;
  END IF;

  v_remaining := p_amount;

  -- Consume allocated first
  v_from_allocated := LEAST(v_allocated, v_remaining);
  v_remaining := v_remaining - v_from_allocated;

  -- Then rollover
  v_from_rollover := LEAST(v_rollover, v_remaining);
  v_remaining := v_remaining - v_from_rollover;

  -- Then purchased
  v_from_purchased := LEAST(v_purchased, v_remaining);
  v_remaining := v_remaining - v_from_purchased;

  -- Update balances
  UPDATE credits
  SET allocated_miles = allocated_miles - v_from_allocated,
      rollover_miles = rollover_miles - v_from_rollover,
      purchased_miles = purchased_miles - v_from_purchased,
      miles = allocated_miles - v_from_allocated
            + rollover_miles - v_from_rollover
            + purchased_miles - v_from_purchased,
      updated_at = now()
  WHERE user_id = p_user_id;

  -- Ledger entries (one per balance type that was touched)
  IF v_from_allocated > 0 THEN
    INSERT INTO credit_transactions (user_id, amount, type, balance_type, description, instrument_code, assessment_id)
    VALUES (p_user_id, -v_from_allocated, 'spend', 'allocated',
            COALESCE(p_description, 'Assessment completion'), p_instrument_code, p_assessment_id);
  END IF;

  IF v_from_rollover > 0 THEN
    INSERT INTO credit_transactions (user_id, amount, type, balance_type, description, instrument_code, assessment_id)
    VALUES (p_user_id, -v_from_rollover, 'spend', 'rollover',
            COALESCE(p_description, 'Assessment completion (rollover)'), p_instrument_code, p_assessment_id);
  END IF;

  IF v_from_purchased > 0 THEN
    INSERT INTO credit_transactions (user_id, amount, type, balance_type, description, instrument_code, assessment_id)
    VALUES (p_user_id, -v_from_purchased, 'spend', 'purchased',
            COALESCE(p_description, 'Assessment completion (purchased)'), p_instrument_code, p_assessment_id);
  END IF;

  RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 6. RPC: Refund miles (for assessment abandon) ─────────────────────
-- Refunds go back to allocated balance (simplest — they were just spent).
CREATE OR REPLACE FUNCTION refund_miles_balanced(
  p_user_id UUID,
  p_amount INTEGER,
  p_instrument_code TEXT DEFAULT NULL,
  p_assessment_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
BEGIN
  UPDATE credits
  SET allocated_miles = allocated_miles + p_amount,
      miles = miles + p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;

  INSERT INTO credit_transactions (user_id, amount, type, balance_type, description, instrument_code, assessment_id)
  VALUES (p_user_id, p_amount, 'refund', 'allocated',
          COALESCE(p_description, 'Assessment abandon refund'), p_instrument_code, p_assessment_id);

  RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 7. RPC: Monthly allocation reset + rollover ───────────────────────
-- Called by cron / billing cycle trigger.
-- Computes 50% rollover of unused allocated miles, caps at 3 months,
-- then applies new monthly allocation.
CREATE OR REPLACE FUNCTION process_monthly_mile_allocation(
  p_user_id UUID,
  p_tier TEXT,
  p_allocation_amount INTEGER
) RETURNS INTEGER AS $$
DECLARE
  v_current_allocated INTEGER;
  v_current_rollover INTEGER;
  v_unused INTEGER;
  v_rollover_add INTEGER;
  v_rollover_cap INTEGER;
  v_new_rollover INTEGER;
  v_expired INTEGER;
BEGIN
  SELECT allocated_miles, rollover_miles
    INTO v_current_allocated, v_current_rollover
  FROM credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    -- Create row if missing
    INSERT INTO credits (user_id, miles, tier, allocated_miles, rollover_miles, purchased_miles, total_earned, total_spent, last_allocation_date)
    VALUES (p_user_id, p_allocation_amount, p_tier, p_allocation_amount, 0, 0, p_allocation_amount, 0, CURRENT_DATE)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN p_allocation_amount;
  END IF;

  -- Compute rollover: 50% of unused allocated miles
  v_unused := GREATEST(v_current_allocated, 0);
  v_rollover_add := FLOOR(v_unused * 0.50);

  -- Cap: 3 months worth of allocation
  v_rollover_cap := p_allocation_amount * 3;
  v_new_rollover := LEAST(v_current_rollover + v_rollover_add, v_rollover_cap);
  v_expired := GREATEST(v_current_rollover + v_rollover_add - v_rollover_cap, 0);

  -- Ledger: rollover credit
  IF v_rollover_add > 0 THEN
    INSERT INTO credit_transactions (user_id, amount, type, balance_type, description)
    VALUES (p_user_id, v_rollover_add, 'rollover', 'rollover', 'Monthly rollover (50% of unused)');
  END IF;

  -- Ledger: expired rollover
  IF v_expired > 0 THEN
    INSERT INTO credit_transactions (user_id, amount, type, balance_type, description)
    VALUES (p_user_id, -v_expired, 'rollover_expiry', 'rollover', 'Rollover cap expiry (3-month max)');
  END IF;

  -- Ledger: new allocation
  INSERT INTO credit_transactions (user_id, amount, type, balance_type, description)
  VALUES (p_user_id, p_allocation_amount, 'allocation', 'allocated', 'Monthly tier allocation');

  -- Apply
  UPDATE credits
  SET allocated_miles = p_allocation_amount,
      rollover_miles = v_new_rollover,
      miles = p_allocation_amount + v_new_rollover + purchased_miles,
      tier = p_tier,
      last_allocation_date = CURRENT_DATE,
      updated_at = now()
  WHERE user_id = p_user_id;

  RETURN p_allocation_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
