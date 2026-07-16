-- =====================================================
-- FIXED Migration #2: Credit System Consolidation
-- Adapted to match ACTUAL schema (2026-07-16)
-- =====================================================

-- 1. Add missing columns to v2_credit_transactions (table already exists)
ALTER TABLE public.v2_credit_transactions
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.v2_organizations(id),
  ADD COLUMN IF NOT EXISTS reference_id TEXT,
  ADD COLUMN IF NOT EXISTS reference_type TEXT,
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- Add unique index on idempotency_key (not column constraint since column may have nulls)
CREATE UNIQUE INDEX IF NOT EXISTS idx_v2_credit_transactions_idempotency
  ON public.v2_credit_transactions(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- Additional indexes
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id
  ON public.v2_credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at
  ON public.v2_credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_reference
  ON public.v2_credit_transactions(reference_type, reference_id);

-- Enable RLS
ALTER TABLE public.v2_credit_transactions ENABLE ROW LEVEL SECURITY;

-- 2. Get user's current credit balance
CREATE OR REPLACE FUNCTION public.get_user_credit_balance(p_user_id UUID)
RETURNS TABLE (
  user_id UUID,
  dex_credits BIGINT,
  council_credits BIGINT,
  tier TEXT,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p_user_id,
    COALESCE(
      (SELECT balance_after FROM public.v2_credit_transactions
       WHERE user_id = p_user_id AND credit_type = 'dex_credits'
       ORDER BY created_at DESC LIMIT 1), 0
    )::BIGINT as dex_credits,
    COALESCE(
      (SELECT balance_after FROM public.v2_credit_transactions
       WHERE user_id = p_user_id AND credit_type = 'council_credits'
       ORDER BY created_at DESC LIMIT 1), 0
    )::BIGINT as council_credits,
    COALESCE(
      (SELECT tier::TEXT FROM public.v2_user_profiles WHERE id = p_user_id), 'free'
    ) as tier,
    COALESCE(
      (SELECT created_at FROM public.v2_credit_transactions
       WHERE user_id = p_user_id
       ORDER BY created_at DESC LIMIT 1), NOW()
    ) as updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. Atomic credit deduction
CREATE OR REPLACE FUNCTION public.atomic_deduct_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_credit_type TEXT DEFAULT 'dex_credits',
  p_organization_id UUID DEFAULT NULL,
  p_reference_id TEXT DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS JSONB AS $$
DECLARE
  current_balance INTEGER;
  new_balance INTEGER;
  v_id UUID;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::TEXT || p_credit_type));

  SELECT COALESCE(
    (SELECT balance_after FROM public.v2_credit_transactions
     WHERE user_id = p_user_id AND credit_type = p_credit_type
     ORDER BY created_at DESC LIMIT 1), 0
  ) INTO current_balance;

  IF current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient credits: has %, needs %', current_balance, p_amount;
  END IF;

  new_balance := current_balance - p_amount;

  INSERT INTO public.v2_credit_transactions (
    user_id, organization_id, credit_type, transaction_type,
    amount, balance_after, reference_id, reference_type, metadata
  ) VALUES (
    p_user_id, p_organization_id, p_credit_type, 'consumption',
    -p_amount, new_balance, p_reference_id, p_reference_type, p_metadata
  ) RETURNING id INTO v_id;

  RETURN jsonb_build_object(
    'id', v_id, 'user_id', p_user_id, 'credit_type', p_credit_type,
    'amount', -p_amount, 'balance_after', new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Atomic credit addition
CREATE OR REPLACE FUNCTION public.atomic_add_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_credit_type TEXT DEFAULT 'dex_credits',
  p_transaction_type TEXT DEFAULT 'grant',
  p_organization_id UUID DEFAULT NULL,
  p_reference_id TEXT DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS JSONB AS $$
DECLARE
  current_balance INTEGER;
  new_balance INTEGER;
  v_id UUID;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::TEXT || p_credit_type));

  SELECT COALESCE(
    (SELECT balance_after FROM public.v2_credit_transactions
     WHERE user_id = p_user_id AND credit_type = p_credit_type
     ORDER BY created_at DESC LIMIT 1), 0
  ) INTO current_balance;

  new_balance := current_balance + p_amount;

  INSERT INTO public.v2_credit_transactions (
    user_id, organization_id, credit_type, transaction_type,
    amount, balance_after, reference_id, reference_type, metadata
  ) VALUES (
    p_user_id, p_organization_id, p_credit_type, p_transaction_type,
    p_amount, new_balance, p_reference_id, p_reference_type, p_metadata
  ) RETURNING id INTO v_id;

  RETURN jsonb_build_object(
    'id', v_id, 'user_id', p_user_id, 'credit_type', p_credit_type,
    'amount', p_amount, 'balance_after', new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Atomic transfer between users
CREATE OR REPLACE FUNCTION public.atomic_transfer_credits(
  p_from_user_id UUID,
  p_to_user_id UUID,
  p_amount INTEGER,
  p_credit_type TEXT DEFAULT 'dex_credits',
  p_organization_id UUID DEFAULT NULL,
  p_reference_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS JSONB AS $$
DECLARE
  deduction JSONB;
  addition JSONB;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_from_user_id::TEXT || p_credit_type));
  PERFORM pg_advisory_xact_lock(hashtext(p_to_user_id::TEXT || p_credit_type));

  deduction := public.atomic_deduct_credits(
    p_from_user_id, p_amount, p_credit_type, p_organization_id,
    p_reference_id, 'transfer_out', p_metadata
  );

  addition := public.atomic_add_credits(
    p_to_user_id, p_amount, p_credit_type, 'transfer',
    p_organization_id, p_reference_id, 'transfer_in', p_metadata
  );

  RETURN jsonb_build_object('deduction', deduction, 'addition', addition);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Idempotent credit operation (for webhook handlers)
CREATE OR REPLACE FUNCTION public.idempotent_add_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_credit_type TEXT,
  p_transaction_type TEXT,
  p_idempotency_key TEXT,
  p_organization_id UUID DEFAULT NULL,
  p_reference_id TEXT DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS JSONB AS $$
DECLARE
  existing_id UUID;
  new_id UUID;
  new_balance INTEGER;
BEGIN
  SELECT id INTO existing_id
  FROM public.v2_credit_transactions
  WHERE idempotency_key = p_idempotency_key;

  IF existing_id IS NOT NULL THEN
    RETURN jsonb_build_object('id', existing_id, 'status', 'already_processed');
  END IF;

  SELECT COALESCE(
    (SELECT balance_after FROM public.v2_credit_transactions
     WHERE user_id = p_user_id AND credit_type = p_credit_type
     ORDER BY created_at DESC LIMIT 1), 0
  ) + p_amount INTO new_balance;

  INSERT INTO public.v2_credit_transactions (
    user_id, organization_id, credit_type, transaction_type,
    amount, balance_after, reference_id, reference_type, metadata, idempotency_key
  ) VALUES (
    p_user_id, p_organization_id, p_credit_type, p_transaction_type,
    p_amount, new_balance, p_reference_id, p_reference_type, p_metadata, p_idempotency_key
  ) RETURNING id INTO new_id;

  RETURN jsonb_build_object('id', new_id, 'balance_after', new_balance, 'status', 'created');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Daily credit reset (for cron)
CREATE OR REPLACE FUNCTION public.daily_credit_reset(
  p_tier_limits JSONB DEFAULT '{"free": 2, "member": 5, "pro": 10, "council": 15, "enterprise": 50}'
) RETURNS JSONB AS $$
DECLARE
  user_record RECORD;
  tier_limit INTEGER;
  processed INTEGER := 0;
  errors TEXT[] := '{}';
BEGIN
  FOR user_record IN
    SELECT id, tier FROM public.v2_user_profiles WHERE tier IS NOT NULL
  LOOP
    BEGIN
      tier_limit := (p_tier_limits->>(tier::TEXT))::INTEGER;
      IF tier_limit IS NULL THEN tier_limit := 2; END IF;

      PERFORM public.atomic_add_credits(
        user_record.id, tier_limit, 'dex_credits', 'daily_reset'
      );

      processed := processed + 1;
    EXCEPTION WHEN OTHERS THEN
      errors := array_append(errors, format('User %s: %s', user_record.id, SQLERRM));
    END;
  END LOOP;

  RETURN jsonb_build_object('processed', processed, 'errors', errors);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Sync trigger: keep legacy credits table in sync
CREATE OR REPLACE FUNCTION public.sync_credits_from_v2()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.credits (user_id, balance, daily_balance, tier, updated_at)
  VALUES (
    NEW.user_id,
    NEW.balance_after,
    NEW.balance_after,
    COALESCE((SELECT tier::TEXT FROM public.v2_user_profiles WHERE id = NEW.user_id), 'free'),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    balance = EXCLUDED.balance,
    daily_balance = EXCLUDED.daily_balance,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_credits_trigger ON public.v2_credit_transactions;
CREATE TRIGGER sync_credits_trigger
  AFTER INSERT ON public.v2_credit_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_credits_from_v2();

-- 9. Grants
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT ALL ON public.v2_credit_transactions TO authenticated;
