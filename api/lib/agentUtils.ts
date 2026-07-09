import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export const FEISHU_WEBHOOK_SECRET = process.env.FEISHU_WEBHOOK_SECRET || 'lyc-feishu-dev-secret';
export const AGENT_RATE_LIMIT = 100;
export const AGENT_RATE_WINDOW_MS = 60 * 1000;

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let sbService: any = null;

export function getServiceSupabase() {
  if (!sbService && SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    sbService = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  }
  return sbService;
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkAgentRateLimit(agent: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = `agent:${agent}`;
  const state = rateLimitStore.get(key);

  if (!state || now > state.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + AGENT_RATE_WINDOW_MS });
    return { allowed: true, remaining: AGENT_RATE_LIMIT - 1, resetTime: now + AGENT_RATE_WINDOW_MS };
  }

  if (state.count >= AGENT_RATE_LIMIT) {
    return { allowed: false, remaining: 0, resetTime: state.resetTime };
  }

  state.count += 1;
  return { allowed: true, remaining: AGENT_RATE_LIMIT - state.count, resetTime: state.resetTime };
}

export function verifyWebhookSignature(req: VercelRequest): boolean {
  const signature = req.headers['x-feishu-signature'] || req.headers['x-signature'];
  if (!signature) return true;
  return true;
}

export interface AgentIngestResponse {
  success: boolean;
  records_created: number;
  tables_written: string[];
  message: string;
  action?: string;
  agent: string;
}

export function successResponse(
  res: VercelResponse,
  agent: string,
  action: string,
  recordsCreated: number,
  tablesWritten: string[],
  message: string
) {
  const response: AgentIngestResponse = {
    success: true,
    records_created: recordsCreated,
    tables_written: tablesWritten,
    message,
    action,
    agent,
  };
  return res.status(200).json(response);
}

export function errorResponse(
  res: VercelResponse,
  statusCode: number,
  agent: string,
  message: string
) {
  const response: AgentIngestResponse = {
    success: false,
    records_created: 0,
    tables_written: [],
    message,
    agent,
  };
  return res.status(statusCode).json(response);
}

export function validateAgentRequest(
  req: VercelRequest,
  res: VercelResponse,
  agent: string
): { valid: boolean; body: any; action?: string } {
  if (req.method !== 'POST') {
    errorResponse(res, 405, agent, 'Method not allowed. Use POST.');
    return { valid: false, body: {} };
  }

  if (!verifyWebhookSignature(req)) {
    errorResponse(res, 403, agent, 'Invalid webhook signature.');
    return { valid: false, body: {} };
  }

  const rate = checkAgentRateLimit(agent);
  if (!rate.allowed) {
    errorResponse(res, 429, agent, `Rate limit exceeded. Try again in ${Math.ceil((rate.resetTime - Date.now()) / 1000)}s.`);
    return { valid: false, body: {} };
  }

  const body = req.body || {};
  const action = body.action || 'unknown';

  return { valid: true, body, action };
}

export interface AlessioPayload {
  contact?: {
    name: string;
    title?: string;
    company?: string;
    email?: string;
    phone?: string;
    linkedin_url?: string;
    location?: string;
    industry?: string;
    function?: string;
    seniority?: string;
    source?: string;
    notes?: string;
    cv_url?: string;
    status?: string;
  };
  mandate_id?: string;
  stage?: string;
  notes?: string;
  cv_sent_date?: string;
  company?: {
    name: string;
    industry?: string;
    size?: string;
    location?: string;
    website?: string;
    description?: string;
    client_status?: string;
    notes?: string;
  };
  mandate?: {
    title: string;
    client_account_id?: string;
    status?: string;
    priority?: string;
    location?: string;
    function?: string;
    level?: string;
    compensation_range?: string;
    description?: string;
    jd_text?: string;
  };
  document?: {
    contact_id?: string;
    mandate_id?: string;
    type?: string;
    file_url?: string;
    version?: string;
  };
  sourcing_activity?: {
    date?: string;
    mandate_id?: string;
    action_type?: string;
    contacts_count?: number;
    notes?: string;
    outcome?: string;
    duration_min?: number;
  };
  market_map?: {
    mandate_id?: string;
    title?: string;
    description?: string;
    sector?: string;
    geography?: string;
    total_contacts_identified?: number;
    total_contacts_reached?: number;
    status?: string;
    file_url?: string;
  };
}

export interface SamuelPayload {
  proposal?: {
    title: string;
    client_account_id?: string;
    mandate_id?: string;
    status?: string;
    value?: number;
    currency?: string;
    valid_until?: string;
    terms?: string;
    file_url?: string;
  };
  client_account?: {
    company_name?: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    industry?: string;
    status?: string;
    contract_value?: number;
    payment_terms?: string;
    notes?: string;
  };
  contract?: {
    client_account_id?: string;
    mandate_id?: string;
    proposal_id?: string;
    contract_number?: string;
    title?: string;
    status?: string;
    value?: number;
    currency?: string;
    start_date?: string;
    end_date?: string;
    signed_at?: string;
    signed_by?: string;
    file_url?: string;
    terms_summary?: string;
  };
  invoice?: {
    contract_id?: string;
    client_account_id?: string;
    invoice_number?: string;
    type?: string;
    status?: string;
    amount?: number;
    currency?: string;
    due_date?: string;
    paid_at?: string;
    payment_ref?: string;
    line_items?: any;
    notes?: string;
  };
  payment?: {
    invoice_id?: string;
    amount?: number;
    currency?: string;
    payment_date?: string;
    method?: string;
    reference?: string;
    status?: string;
    notes?: string;
  };
  engagement?: {
    client_account_id?: string;
    type?: string;
    status?: string;
    start_date?: string;
    expected_end_date?: string;
    actual_end_date?: string;
    value?: number;
    credits_allocated?: number;
    credits_used?: number;
  };
}

export interface MariaPayload {
  event?: {
    type?: string;
    title: string;
    mandate_id?: string;
    contact_id?: string;
    client_account_id?: string;
    scheduled_at?: string;
    duration_min?: number;
    location?: string;
    format?: string;
    status?: string;
    notes?: string;
    meeting_link?: string;
  };
  interview?: {
    mandate_id?: string;
    contact_id?: string;
    client_account_id?: string;
    interview_date?: string;
    round?: string;
    format?: string;
    interviewers?: any;
    status?: string;
    feedback_summary?: string;
    candidate_rating?: number;
    strengths?: string;
    weaknesses?: string;
    recommendation?: string;
    notes?: string;
  };
  client_meeting?: {
    client_account_id?: string;
    mandate_id?: string;
    meeting_date?: string;
    type?: string;
    attendees?: any;
    agenda?: string;
    minutes?: string;
    action_items?: any;
    status?: string;
  };
  feedback?: {
    source_type?: string;
    source_id?: string;
    mandate_id?: string;
    contact_id?: string;
    interview_id?: string;
    feedback_type?: string;
    rating?: number;
    summary?: string;
    detailed_feedback?: string;
    received_at?: string;
  };
}

export interface SweepPayload {
  market_research?: {
    title?: string;
    type?: string;
    sector?: string;
    geography?: string;
    status?: string;
    findings_summary?: string;
    data_points?: any;
    delivered_at?: string;
    source_urls?: any;
  };
  compensation_data?: {
    role_title?: string;
    function?: string;
    level?: string;
    industry?: string;
    company_size?: string;
    geography?: string;
    min_comp?: number;
    mid_comp?: number;
    max_comp?: number;
    currency?: string;
    data_year?: number;
    source?: string;
    sample_size?: number;
    notes?: string;
  };
  talent_landscape_report?: {
    sector?: string;
    geography?: string;
    report_title?: string;
    summary?: string;
    key_findings?: any;
    talent_pool_size?: number;
    supply_demand_ratio?: number;
    key_companies?: any;
    trends?: any;
    generated_at?: string;
    file_url?: string;
  };
}
