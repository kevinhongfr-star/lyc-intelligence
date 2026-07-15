-- =====================================================
-- Phase 1: Credit System Consolidation
-- Atomic operations using stored procedures
-- =====================================================

-- =====================================================
-- TABLES (if not exists)
-- =====================================================

-- Unified credit transactions table
CREATE TABLE IF NOT EXISTS public.v2_credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.v2_organizations(id),
  credit_type TEXT NOT NULL CHECK (credit_type IN ('dex_credits', 'council_credits')),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN (
    'purchase', 'grant', 'consumption', 'refund', 
    'expiry', 'adjustment', 'transfer', 'daily_reset'
  )),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  reference_id TEXT,
  reference_type TEXT,
  metadata JSONB DEFAULT '{}',
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id 
  ON public.v2_credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at 
  ON public.v2_credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_reference 
  ON public.v2_credit_transactions(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_idempotency 
  ON public.v2_credit_transactions(idempotency_key);

-- Enable RLS
ALTER TABLE public.v2_credit_transactions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ATOMIC STORED PROCEDURES
-- =====================================================

-- Get user's current credit balance
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
    ) as dex_credits,
    COALESCE(
      (SELECT balance_after FROM public.v2_credit_transactions 
       WHERE user_id = p_user_id AND credit_type = 'council_credits'
       ORDER BY created_at DESC LIMIT 1), 0
    ) as council_credits,
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

-- Atomic credit deduction (with locking)
CREATE OR REPLACE FUNCTION public.atomic_deduct_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_credit_type TEXT DEFAULT 'dex_credits',
  p_organization_id UUID DEFAULT NULL,
  p_reference_id TEXT DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS public.v2_credit_transactions AS $$
DECLARE
  current_balance INTEGER;
  new_balance INTEGER;
  result public.v2_credit_transactions%ROWTYPE;
BEGIN
  -- Lock the user's credit row for atomic update
  -- Use advisory lock to prevent concurrent modifications
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::TEXT || p_credit_type));
  
  -- Get current balance
  SELECT COALESCE(
    (SELECT balance_after FROM public.v2_credit_transactions 
     WHERE user_id = p_user_id AND credit_type = p_credit_type
     ORDER BY created_at DESC LIMIT 1), 0
  ) INTO current_balance;
  
  -- Check sufficient balance
  IF current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient credits: has %, needs %', current_balance, p_amount;
  END IF;
  
  -- Calculate new balance
  new_balance := current_balance - p_amount;
  
  -- Insert transaction
  INSERT INTO public.v2_credit_transactions (
    user_id, organization_id, credit_type, transaction_type,
    amount, balance_after, reference_id, reference_type, metadata
  ) VALUES (
    p_user_id, p_organization_id, p_credit_type, 'consumption',
    -p_amount, new_balance, p_reference_id, p_reference_type, p_metadata
  )
  RETURNING * INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic credit addition
CREATE OR REPLACE FUNCTION public.atomic_add_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_credit_type TEXT DEFAULT 'dex_credits',
  p_transaction_type TEXT DEFAULT 'grant',
  p_organization_id UUID DEFAULT NULL,
  p_reference_id TEXT DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS public.v2_credit_transactions AS $$
DECLARE
  current_balance INTEGER;
  new_balance INTEGER;
  result public.v2_credit_transactions%ROWTYPE;
BEGIN
  -- Lock for atomic update
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::TEXT || p_credit_type));
  
  -- Get current balance
  SELECT COALESCE(
    (SELECT balance_after FROM public.v2_credit_transactions 
     WHERE user_id = p_user_id AND credit_type = p_credit_type
     ORDER BY created_at DESC LIMIT 1), 0
  ) INTO current_balance;
  
  -- Calculate new balance
  new_balance := current_balance + p_amount;
  
  -- Insert transaction
  INSERT INTO public.v2_credit_transactions (
    user_id, organization_id, credit_type, transaction_type,
    amount, balance_after, reference_id, reference_type, metadata
  ) VALUES (
    p_user_id, p_organization_id, p_credit_type, p_transaction_type,
    p_amount, new_balance, p_reference_id, p_reference_type, p_metadata
  )
  RETURNING * INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic transfer between users
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
  deduction_result public.v2_credit_transactions%ROWTYPE;
  addition_result public.v2_credit_transactions%ROWTYPE;
BEGIN
  -- Lock both users
  PERFORM pg_advisory_xact_lock(hashtext(p_from_user_id::TEXT || p_credit_type));
  PERFORM pg_advisory_xact_lock(hashtext(p_to_user_id::TEXT || p_credit_type));
  
  -- Perform deduction
  deduction_result := public.atomic_deduct_credits(
    p_from_user_id, p_amount, p_credit_type, p_organization_id,
    p_reference_id, 'transfer_out', p_metadata
  );
  
  -- Perform addition
  addition_result := public.atomic_add_credits(
    p_to_user_id, p_amount, p_credit_type, 'transfer',
    p_organization_id, p_reference_id, 'transfer_in', p_metadata
  );
  
  RETURN jsonb_build_object(
    'deduction', row_to_json(deduction_result),
    'addition', row_to_json(addition_result)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Daily credit reset (for cron)
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
      -- Get tier limit
      tier_limit := (p_tier_limits ->> (user_record.tier::TEXT))::INTEGER;
      IF tier_limit IS NULL THEN tier_limit := 2; END IF;
      
      -- Grant daily credits
      PERFORM public.atomic_add_credits(
        user_record.id, tier_limit, 'dex_credits', 'daily_reset'
      );
      
      processed := processed + 1;
    EXCEPTION WHEN OTHERS THEN
      errors := array_append(errors, format('User %s: %s', user_record.id, SQLERRM));
    END;
  END LOOP;
  
  RETURN jsonb_build_object(
    'processed', processed,
    'errors', errors
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Idempotent credit operation (for webhook handlers)
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
) RETURNS public.v2_credit_transactions AS $$
DECLARE
  existing public.v2_credit_transactions%ROWTYPE;
  result public.v2_credit_transactions%ROWTYPE;
BEGIN
  -- Check if already processed
  SELECT * INTO existing
  FROM public.v2_credit_transactions
  WHERE idempotency_key = p_idempotency_key;
  
  -- Return existing if found
  IF FOUND THEN
    RETURN existing;
  END IF;
  
  -- Perform the addition
  INSERT INTO public.v2_credit_transactions (
    user_id, organization_id, credit_type, transaction_type,
    amount, balance_after, reference_id, reference_type, metadata, idempotency_key
  )
  SELECT 
    p_user_id, p_organization_id, p_credit_type, p_transaction_type,
    p_amount,
    COALESCE(
      (SELECT balance_after FROM public.v2_credit_transactions 
       WHERE user_id = p_user_id AND credit_type = p_credit_type
       ORDER BY created_at DESC LIMIT 1), 0
    ) + p_amount,
    p_reference_id, p_reference_type, p_metadata, p_idempotency_key
  RETURNING * INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT ALL ON public.v2_credit_transactions TO authenticated;

-- =====================================================
-- SYNC TRIGGER (keep legacy credits table in sync)
-- =====================================================

CREATE OR REPLACE FUNCTION public.sync_credits_from_v2()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert into legacy credits table
  INSERT INTO public.credits (user_id, balance, daily_balance, tier, updated_at)
  VALUES (
    NEW.user_id,
    NEW.balance_after,
    NEW.balance_after,
    COALESCE((SELECT tier FROM public.v2_user_profiles WHERE id = NEW.user_id), 'free'),
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