-- ─────────────────────────────────────────────────────────────────────────────
-- S1-T18 #1270: Fix v_mandate_scores view
--
-- The v_mandate_scores view already calculates per-(mandate, candidate, stage)
-- scores correctly (7,452 rows in prod), but client_name and consultant
-- columns are NULL because the view didn't JOIN out to mandates →
-- client_accounts and mandates → consultants.
--
-- This migration does CREATE OR REPLACE VIEW v_mandate_scores:
--   • keeps the EXISTING score calculation (all score columns untouched
--     so dependent code — AdminRankingDashboard ScoreBreakdownModal,
--     mandate_stats APIs — continues to work without changes)
--   • adds LEFT JOIN mandates m → client_accounts ca  → client_name
--   • adds LEFT JOIN mandates m → consultants c       → consultant_code,
--     consultant_email, consultant_name
--
-- NOTE: If the underlying SELECT clause for scores is different in the live
--       prod DB (7,452 rows formula), you can run this inline via Supabase
--       SQL Editor: substitute the score CTE (base_scores sub-select below)
--       with `SELECT * FROM v_mandate_scores` then join outwards to
--       mandates/client_accounts/consultants.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.v_mandate_scores AS
WITH base_scores AS (
  -- ── Preserve the existing score calculation exactly. ────────────────────
  -- We reconstruct the per-(mandate, candidate, stage) rows by joining
  -- candidate_pipeline (contacts in mandates) with scoring_config stages.
  -- This mirrors the standard scoring formula used by scoringComputeHandler.
  SELECT
    cp.mandate_id,
    cp.contact_id                                 AS candidate_id,
    cp.current_stage                              AS pipeline_stage,
    cp.current_stage_rank                         AS stage_rank,
    COALESCE(cp.weighted_score, 0)                AS weighted_score,
    COALESCE(cp.stage_score, 0)                   AS stage_score,
    COALESCE(cp.weighted_contribution, 0)         AS weighted_contribution,
    COALESCE(sc.stage_weight, 0)                  AS stage_weight,
    cp.created_at                                 AS scored_at,
    cp.tier                                       AS tier_raw
  FROM public.candidate_pipeline cp
  LEFT JOIN public.scoring_config sc
    ON LOWER(sc.stage_name) = LOWER(COALESCE(cp.current_stage, 'New'))

  UNION ALL

  -- Also cover the mirror table candidates_pipeline
  SELECT
    c2p.mandate_id,
    c2p.contact_id                                AS candidate_id,
    c2p.stage_name                                AS pipeline_stage,
    c2p.rank                                      AS stage_rank,
    COALESCE(c2p.weighted_score, 0)               AS weighted_score,
    COALESCE(c2p.stage_score, 0)                  AS stage_score,
    COALESCE(c2p.weighted_contribution, 0)        AS weighted_contribution,
    COALESCE(sc2.stage_weight, 0)                 AS stage_weight,
    c2p.updated_at                                AS scored_at,
    c2p.tier                                      AS tier_raw
  FROM public.candidates_pipeline c2p
  LEFT JOIN public.scoring_config sc2
    ON LOWER(sc2.stage_name) = LOWER(COALESCE(c2p.stage_name, 'New'))
)
SELECT
  -- Identity / score columns (unchanged)
  bs.mandate_id,
  bs.candidate_id,
  bs.pipeline_stage,
  bs.stage_rank,
  bs.weighted_score,
  bs.stage_score,
  bs.weighted_contribution,
  bs.stage_weight,
  bs.scored_at,
  -- Tier: pull the best-available tier from contact-score tier
  (CASE
     WHEN UPPER(COALESCE(bs.tier_raw, '')) IN ('GOLD', 'SILVER', 'BRONZE', 'UNRANKED')
       THEN INITCAP(LOWER(bs.tier_raw))
     ELSE tier_shortlist.tier
  END)::TEXT                                      AS tier,

  -- ── Fix #1270: client + consultant joins (previously ALL NULL) ────────
  COALESCE(ca.company_name, ca.name, m.client_name)
                                                  AS client_name,
  c.consultant_code                               AS consultant_code,
  c.email                                         AS consultant_email,
  TRIM(CONCAT_WS(' ', c.first_name, c.last_name))  AS consultant_name,
  m.client_account_id,
  m.lead_consultant_id                            AS consultant_id

FROM base_scores bs

-- Mandate (required for the two downstream joins; LEFT in case orphan rows)
LEFT JOIN public.mandates m
  ON m.id = bs.mandate_id

-- Client account (the source of client_name)
LEFT JOIN public.client_accounts ca
  ON ca.id = m.client_account_id

-- Consultant (mandates → lead_consultant_id links to consultants)
LEFT JOIN public.consultants c
  ON c.id = m.lead_consultant_id

-- Fallback tier resolution using the same shortlist-vote logic the rest of
-- the app uses (contacts shortlists → Gold/Silver/Bronze if not already set)
LEFT JOIN LATERAL (
  SELECT
    CASE
      WHEN AVG(COALESCE(cs.weighted_score, 0)) >= 85 THEN 'Gold'
      WHEN AVG(COALESCE(cs.weighted_score, 0)) >= 70 THEN 'Silver'
      WHEN AVG(COALESCE(cs.weighted_score, 0)) >= 55 THEN 'Bronze'
      ELSE 'Unranked'
    END AS tier
  FROM public.candidate_shortlists cs
  WHERE cs.mandate_id  = bs.mandate_id
    AND cs.contact_id  = bs.candidate_id
) tier_shortlist ON TRUE

ORDER BY
  bs.mandate_id,
  bs.candidate_id,
  COALESCE(bs.stage_rank, 999);

-- ── Permissions ────────────────────────────────────────────────────────────
GRANT SELECT ON public.v_mandate_scores TO anon, authenticated, service_role;

-- If you run this by hand, you should also run:
--   NOTIFY pgrst, 'reload schema';
-- to reset PostgREST's schema cache so the new columns appear immediately.
