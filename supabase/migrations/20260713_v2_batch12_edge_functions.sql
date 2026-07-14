-- ============================================================================
-- v2 Batch 12 — Edge Functions, Webhook Triggers, Email Templates, Final Infrastructure
-- Tickets 111-120 of File 02 (Supabase Backend Architecture)
-- ============================================================================

-- ── Ticket 111: Database triggers for webhooks ──────────────────────────────

-- Trigger function for webhook dispatch
CREATE OR REPLACE FUNCTION public.dispatch_webhook()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM pg_notify(
      'webhook_channel',
      json_build_object(
        'event', TG_OP,
        'table', TG_TABLE_NAME,
        'schema', TG_TABLE_SCHEMA,
        'record', row_to_json(NEW)
      )::text
    );
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM pg_notify(
      'webhook_channel',
      json_build_object(
        'event', TG_OP,
        'table', TG_TABLE_NAME,
        'schema', TG_TABLE_SCHEMA,
        'old_record', row_to_json(OLD),
        'new_record', row_to_json(NEW)
      )::text
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM pg_notify(
      'webhook_channel',
      json_build_object(
        'event', TG_OP,
        'table', TG_TABLE_NAME,
        'schema', TG_TABLE_SCHEMA,
        'record', row_to_json(OLD)
      )::text
    );
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on mandates
DROP TRIGGER IF EXISTS trg_mandates_webhook ON public.v2_mandates;
CREATE TRIGGER trg_mandates_webhook
  AFTER INSERT OR UPDATE OR DELETE ON public.v2_mandates
  FOR EACH ROW EXECUTE FUNCTION public.dispatch_webhook();

-- Trigger on candidates
DROP TRIGGER IF EXISTS trg_candidates_webhook ON public.v2_candidates;
CREATE TRIGGER trg_candidates_webhook
  AFTER INSERT OR UPDATE OR DELETE ON public.v2_candidates
  FOR EACH ROW EXECUTE FUNCTION public.dispatch_webhook();

-- Trigger on mandate_candidates
DROP TRIGGER IF EXISTS trg_mandate_candidates_webhook ON public.v2_mandate_candidates;
CREATE TRIGGER trg_mandate_candidates_webhook
  AFTER INSERT OR UPDATE OR DELETE ON public.v2_mandate_candidates
  FOR EACH ROW EXECUTE FUNCTION public.dispatch_webhook();

-- Trigger on deals
DROP TRIGGER IF EXISTS trg_deals_webhook ON public.v2_deals;
CREATE TRIGGER trg_deals_webhook
  AFTER INSERT OR UPDATE OR DELETE ON public.v2_deals
  FOR EACH ROW EXECUTE FUNCTION public.dispatch_webhook();

-- Trigger on placements
DROP TRIGGER IF EXISTS trg_placements_webhook ON public.v2_placements;
CREATE TRIGGER trg_placements_webhook
  AFTER INSERT OR UPDATE OR DELETE ON public.v2_placements
  FOR EACH ROW EXECUTE FUNCTION public.dispatch_webhook();

-- ── Ticket 112: Database triggers for notifications ────────────────────────

-- Trigger function for notification dispatch
CREATE OR REPLACE FUNCTION public.dispatch_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT user_id INTO v_user_id FROM public.v2_org_memberships
    WHERE org_id = NEW.org_id AND role IN ('super_admin', 'admin') AND status = 'active'
    LIMIT 1;
    
    IF v_user_id IS NOT NULL THEN
      INSERT INTO public.notifications (
        user_id, type, title, message, entity_type, entity_id, created_at
      ) VALUES (
        v_user_id,
        'status_change',
        CONCAT(INITCAP(TG_TABLE_NAME), ' Created'),
        CONCAT('A new ', TG_TABLE_NAME, ' has been created in your organization'),
        TG_TABLE_NAME,
        NEW.id,
        NOW()
      );
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on new mandates
DROP TRIGGER IF EXISTS trg_mandates_notification ON public.v2_mandates;
CREATE TRIGGER trg_mandates_notification
  AFTER INSERT ON public.v2_mandates
  FOR EACH ROW EXECUTE FUNCTION public.dispatch_notification();

-- Trigger on new placements
DROP TRIGGER IF EXISTS trg_placements_notification ON public.v2_placements;
CREATE TRIGGER trg_placements_notification
  AFTER INSERT ON public.v2_placements
  FOR EACH ROW EXECUTE FUNCTION public.dispatch_notification();

-- Trigger on new deals
DROP TRIGGER IF EXISTS trg_deals_notification ON public.v2_deals;
CREATE TRIGGER trg_deals_notification
  AFTER INSERT ON public.v2_deals
  FOR EACH ROW EXECUTE FUNCTION public.dispatch_notification();

-- ── Ticket 113: Database triggers for credit consumption ───────────────────

-- Trigger function to update credit balance
CREATE OR REPLACE FUNCTION public.update_credit_balance()
RETURNS TRIGGER AS $$
DECLARE
  v_current_balance INTEGER;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT COALESCE(SUM(CASE WHEN NEW.transaction_type IN ('purchase', 'grant', 'refund') THEN NEW.amount ELSE -NEW.amount END), 0)
    INTO v_current_balance
    FROM public.v2_credit_transactions
    WHERE user_id = NEW.user_id AND credit_type = NEW.credit_type;
    
    IF NEW.credit_type = 'dex_credits' THEN
      UPDATE public.dex_user_profiles
      SET credit_balance = v_current_balance
      WHERE user_id = NEW.user_id;
    ELSIF NEW.credit_type = 'council_credits' THEN
      UPDATE public.council_profiles
      SET credits = v_current_balance
      WHERE user_id = NEW.user_id;
    END IF;
    
    NEW.balance_after := v_current_balance;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on credit transactions
DROP TRIGGER IF EXISTS trg_credit_transactions_balance ON public.v2_credit_transactions;
CREATE TRIGGER trg_credit_transactions_balance
  BEFORE INSERT ON public.v2_credit_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_credit_balance();

-- ── Ticket 114: Edge function: auth-handler ────────────────────────────────

INSERT INTO supabase_functions.functions (name, handler, runtime, config) VALUES
  ('auth-handler', 'auth-handler/index.ts', 'deno', '{"memory": 256, "timeout": 10}')
ON CONFLICT (name) DO UPDATE SET handler = EXCLUDED.handler, config = EXCLUDED.config;

-- ── Ticket 115: Edge function: webhook-handler ─────────────────────────────

INSERT INTO supabase_functions.functions (name, handler, runtime, config) VALUES
  ('webhook-handler', 'webhook-handler/index.ts', 'deno', '{"memory": 512, "timeout": 30}')
ON CONFLICT (name) DO UPDATE SET handler = EXCLUDED.handler, config = EXCLUDED.config;

-- ── Ticket 116: Edge function: email-sender ────────────────────────────────

INSERT INTO supabase_functions.functions (name, handler, runtime, config) VALUES
  ('email-sender', 'email-sender/index.ts', 'deno', '{"memory": 256, "timeout": 20}')
ON CONFLICT (name) DO UPDATE SET handler = EXCLUDED.handler, config = EXCLUDED.config;

-- ── Ticket 117: Edge function: ai-processor ────────────────────────────────

INSERT INTO supabase_functions.functions (name, handler, runtime, config) VALUES
  ('ai-processor', 'ai-processor/index.ts', 'deno', '{"memory": 1024, "timeout": 60}')
ON CONFLICT (name) DO UPDATE SET handler = EXCLUDED.handler, config = EXCLUDED.config;

-- ── Ticket 118: Edge function: report-generator ────────────────────────────

INSERT INTO supabase_functions.functions (name, handler, runtime, config) VALUES
  ('report-generator', 'report-generator/index.ts', 'deno', '{"memory": 1024, "timeout": 120}')
ON CONFLICT (name) DO UPDATE SET handler = EXCLUDED.handler, config = EXCLUDED.config;

-- ── Ticket 119: Edge function: sync-handler ────────────────────────────────

INSERT INTO supabase_functions.functions (name, handler, runtime, config) VALUES
  ('sync-handler', 'sync-handler/index.ts', 'deno', '{"memory": 512, "timeout": 30}')
ON CONFLICT (name) DO UPDATE SET handler = EXCLUDED.handler, config = EXCLUDED.config;

-- ── Ticket 120: Default email templates ────────────────────────────────────

INSERT INTO public.v2_email_templates (
  id, org_id, name, description, template_type, subject, body_html, body_text, is_active, is_default, created_at
) VALUES
  (
    gen_random_uuid(), NULL, 'Welcome Email', 'Welcome email for new users', 'welcome',
    'Welcome to LYC Intelligence',
    '<h1>Welcome to LYC Intelligence!</h1><p>Dear {{first_name}},</p><p>Thank you for joining us.</p>',
    'Welcome to LYC Intelligence!\n\nDear {{first_name}},\n\nThank you for joining us.',
    true, true, NOW()
  ),
  (
    gen_random_uuid(), NULL, 'Candidate Outreach', 'Initial outreach to candidates', 'candidate_outreach',
    'Opportunity at {{company_name}}',
    '<h1>Opportunity at {{company_name}}</h1><p>Dear {{first_name}},</p><p>We have an exciting opportunity...</p>',
    'Opportunity at {{company_name}}\n\nDear {{first_name}},\n\nWe have an exciting opportunity...',
    true, true, NOW()
  ),
  (
    gen_random_uuid(), NULL, 'Interview Invite', 'Invitation to interview', 'interview_invite',
    'Interview Invitation: {{mandate_title}}',
    '<h1>Interview Invitation</h1><p>Dear {{first_name}},</p><p>You have been invited to interview...</p>',
    'Interview Invitation: {{mandate_title}}\n\nDear {{first_name}},\n\nYou have been invited to interview...',
    true, true, NOW()
  ),
  (
    gen_random_uuid(), NULL, 'Offer Extended', 'Job offer notification', 'offer_extended',
    'Offer Extended: {{mandate_title}}',
    '<h1>Congratulations!</h1><p>Dear {{first_name}},</p><p>We are pleased to offer you...</p>',
    'Congratulations!\n\nDear {{first_name}},\n\nWe are pleased to offer you...',
    true, true, NOW()
  ),
  (
    gen_random_uuid(), NULL, 'Candidate Rejection', 'Rejection notification', 'rejection',
    'Update on your application',
    '<h1>Update on your application</h1><p>Dear {{first_name}},</p><p>Thank you for your interest...</p>',
    'Update on your application\n\nDear {{first_name}},\n\nThank you for your interest...',
    true, true, NOW()
  ),
  (
    gen_random_uuid(), NULL, 'Client Update', 'Update for clients', 'client_update',
    'Pipeline Update: {{mandate_title}}',
    '<h1>Pipeline Update</h1><p>Dear {{first_name}},</p><p>Here is your weekly update...</p>',
    'Pipeline Update: {{mandate_title}}\n\nDear {{first_name}},\n\nHere is your weekly update...',
    true, true, NOW()
  ),
  (
    gen_random_uuid(), NULL, 'Reminder', 'General reminder', 'reminder',
    'Reminder: {{title}}',
    '<h1>Reminder</h1><p>Dear {{first_name}},</p><p>This is a reminder about...</p>',
    'Reminder: {{title}}\n\nDear {{first_name}},\n\nThis is a reminder about...',
    true, true, NOW()
  ),
  (
    gen_random_uuid(), NULL, 'Invoice Reminder', 'Overdue invoice reminder', 'notification',
    'Overdue Invoice: {{invoice_number}}',
    '<h1>Overdue Invoice</h1><p>Dear {{first_name}},</p><p>Invoice {{invoice_number}} is overdue...</p>',
    'Overdue Invoice: {{invoice_number}}\n\nDear {{first_name}},\n\nInvoice {{invoice_number}} is overdue...',
    true, true, NOW()
  )
ON CONFLICT (name) DO NOTHING;
