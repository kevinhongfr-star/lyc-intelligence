-- Add monthly_summary template to email_template_registry
-- Required by the monthly summary cron pipeline (api/cron/monthly-summary.ts)

INSERT INTO public.email_template_registry (
  template_code,
  display_name,
  description,
  tier_required,
  subject_default,
  preheader_default
)
VALUES
  (
    'monthly_summary',
    'Monthly summary',
    'Monthly activity rollup for Professional+ users.',
    'professional',
    'Your monthly LYC Partners summary',
    'See what you accomplished this month.'
  )
ON CONFLICT (template_code) DO NOTHING;
