import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from './adminAuth.js';
import { selectOne, selectMany, update, insert, isSupabaseConfigured } from './supabaseRest.js';

interface FeeConfig {
  id: string;
  name: string;
  fee_type: 'percentage' | 'fixed' | 'percentage_with_minimum';
  percentage?: number;
  fixed_amount?: number;
  minimum_amount?: number;
  split_enabled?: boolean;
  lyc_share?: number;
  partner_share?: number;
  payment_schedule?: Array<{ amount_pct: number; offset_days: number }>;
}

interface Mandate {
  id: string;
  org_id: string;
  position_title: string;
  status: string;
  priority_tier: string;
  salary_range_min?: number;
  salary_range_max?: number;
  fee_percentage?: number;
  fee_fixed_amount?: number;
  fee_config_id?: string;
  consultant_id?: string;
  deadline?: string;
  target_start_date?: string;
  created_at?: string;
}

interface Candidate {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  status: string;
  source?: string;
  current_company?: string;
  current_title?: string;
  years_experience?: number;
  salary_current?: number;
  salary_expected?: number;
}

interface MandateCandidate {
  id: string;
  mandate_id: string;
  candidate_id: string;
  stage: string;
  match_score?: number;
  submitted_date?: string;
  last_activity_date?: string;
  days_in_stage?: number;
  interview_date?: string;
  offer_amount?: number;
}

interface Consultant {
  id: string;
  name: string;
  role: string;
  max_capacity: number;
  current_load: number;
  active_mandate_ids: string[];
  status: string;
}

// ── FEE CALCULATION ENGINE ──────────────────────────────────────────────
export function calculateFee(mandate: Mandate, feeConfig?: FeeConfig): {
  gross_fee: number;
  lyc_net: number;
  partner_share: number;
  payment_schedule: Array<{ amount_pct: number; offset_days: number; amount: number }>;
  breakdown: {
    annual_salary: number;
    fee_percentage: number | null;
    minimum_applied: boolean;
    split_applied: boolean;
  };
} {
  const salaryMid = mandate.salary_range_min && mandate.salary_range_max
    ? (mandate.salary_range_min + mandate.salary_range_max) / 2
    : 0;

  let grossFee = 0;
  let feePercentage = null;
  let minimumApplied = false;
  let splitApplied = false;

  if (feeConfig) {
    feePercentage = feeConfig.percentage || null;

    switch (feeConfig.fee_type) {
      case 'percentage':
        grossFee = salaryMid * ((feeConfig.percentage || 0) / 100);
        break;
      case 'fixed':
        grossFee = feeConfig.fixed_amount || 0;
        break;
      case 'percentage_with_minimum':
        grossFee = salaryMid * ((feeConfig.percentage || 0) / 100);
        if (feeConfig.minimum_amount && grossFee < feeConfig.minimum_amount) {
          grossFee = feeConfig.minimum_amount;
          minimumApplied = true;
        }
        break;
    }

    splitApplied = feeConfig.split_enabled || false;
  } else if (mandate.fee_percentage) {
    feePercentage = mandate.fee_percentage;
    grossFee = salaryMid * (mandate.fee_percentage / 100);
  } else if (mandate.fee_fixed_amount) {
    grossFee = mandate.fee_fixed_amount;
  }

  const lycShare = splitApplied && feeConfig?.lyc_share
    ? grossFee * feeConfig.lyc_share
    : grossFee;

  const partnerShare = splitApplied && feeConfig?.partner_share
    ? grossFee * feeConfig.partner_share
    : 0;

  const paymentSchedule = (feeConfig?.payment_schedule || []).map((p) => ({
    ...p,
    amount: grossFee * p.amount_pct,
  }));

  return {
    gross_fee: grossFee,
    lyc_net: lycShare,
    partner_share: partnerShare,
    payment_schedule: paymentSchedule,
    breakdown: {
      annual_salary: salaryMid,
      fee_percentage: feePercentage,
      minimum_applied: minimumApplied,
      split_applied: splitApplied,
    },
  };
}

// ── STATUS TRANSITION MATRIX ────────────────────────────────────────────
const STATUS_TRANSITIONS: Record<string, string[]> = {
  not_started: ['kick_off'],
  kick_off: ['sourcing', 'not_started'],
  sourcing: ['screening', 'on_hold'],
  screening: ['shortlist', 'rejected', 'sourcing'],
  shortlist: ['first_interview', 'screening'],
  first_interview: ['second_interview', 'rejected', 'shortlist'],
  second_interview: ['final_interview', 'rejected', 'first_interview'],
  final_interview: ['offer', 'rejected', 'second_interview'],
  offer: ['accepted', 'rejected', 'final_interview'],
  accepted: ['onboarded'],
  onboarded: ['closed_won'],
  closed_won: [],
  closed_lost: [],
  on_hold: ['sourcing', 'screening', 'not_started'],
};

const CANDIDATE_STATUS_TRANSITIONS: Record<string, string[]> = {
  new: ['contacted'],
  contacted: ['screening', 'ghosted'],
  screening: ['interview_prep', 'rejected', 'contacted'],
  interview_prep: ['interviewing'],
  interviewing: ['offered', 'rejected', 'withdrawn'],
  offered: ['accepted', 'rejected', 'withdrawn'],
  accepted: [],
  rejected: [],
  withdrawn: [],
  ghosted: ['contacted'],
};

const PIPELINE_STAGE_TRANSITIONS: Record<string, string[]> = {
  submitted: ['screening'],
  screening: ['first_interview', 'rejected', 'submitted'],
  first_interview: ['second_interview', 'rejected', 'screening'],
  second_interview: ['final_interview', 'rejected', 'first_interview'],
  final_interview: ['offer_pending', 'rejected', 'second_interview'],
  offer_pending: ['offer_accepted', 'rejected'],
  offer_accepted: [],
  rejected: [],
  withdrawn: [],
};

export function isValidTransition(
  currentStatus: string,
  newStatus: string,
  type: 'mandate' | 'candidate' | 'pipeline'
): boolean {
  const transitions = type === 'mandate' ? STATUS_TRANSITIONS
    : type === 'candidate' ? CANDIDATE_STATUS_TRANSITIONS
    : PIPELINE_STAGE_TRANSITIONS;
  return (transitions[currentStatus] || []).includes(newStatus);
}

// ── PRIORITY TIER CLASSIFICATION ────────────────────────────────────────
export function classifyPriority(mandate: Mandate): string {
  const now = new Date();
  const deadline = mandate.deadline ? new Date(mandate.deadline) : null;
  const created = mandate.created_at ? new Date(mandate.created_at) : null;

  const daysUntilDeadline = deadline ? Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
  const daysSinceCreated = created ? Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)) : null;

  if (mandate.status === 'offer' || mandate.status === 'onboarded' || mandate.status === 'closed_won') {
    return 'tier1_closing';
  }

  if (daysUntilDeadline !== null && daysUntilDeadline <= 7) {
    return 'tier1_closing';
  }

  if (daysUntilDeadline !== null && daysUntilDeadline <= 14) {
    return 'tier2_active';
  }

  if (mandate.status === 'not_started' && daysSinceCreated !== null && daysSinceCreated >= 7) {
    return 'tier3_hold';
  }

  if (mandate.status === 'on_hold') {
    return 'tier3_hold';
  }

  if (mandate.status === 'sourcing' || mandate.status === 'screening' || mandate.status === 'shortlist') {
    return 'tier2_active';
  }

  return 'pending';
}

// ── CAPACITY MODEL ──────────────────────────────────────────────────────
export function calculateCapacity(consultant: Consultant): {
  current_load: number;
  max_capacity: number;
  remaining: number;
  ratio: number;
  status: 'active' | 'overloaded' | 'at_capacity';
} {
  const ratio = consultant.current_load / consultant.max_capacity;
  let status: 'active' | 'overloaded' | 'at_capacity' = 'active';

  if (ratio >= 1.0) {
    status = 'overloaded';
  } else if (ratio >= 0.8) {
    status = 'at_capacity';
  }

  return {
    current_load: consultant.current_load,
    max_capacity: consultant.max_capacity,
    remaining: consultant.max_capacity - consultant.current_load,
    ratio,
    status,
  };
}

// ── BUSINESS RULES ──────────────────────────────────────────────────────
export interface RuleResult {
  ruleId: string;
  ruleName: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  triggered: boolean;
  message: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, any>;
}

const RULES: Array<{
  id: string;
  name: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  check: (data: { mandates: Mandate[]; candidates: Candidate[]; pipeline: MandateCandidate[]; consultants: Consultant[] }) => RuleResult[];
}> = [
  {
    id: 'M001',
    name: 'Deadline Overdue',
    category: 'mandate',
    severity: 'critical',
    check: ({ mandates }) => mandates
      .filter(m => m.status !== 'closed_won' && m.status !== 'closed_lost' && m.deadline && new Date(m.deadline) < new Date())
      .map(m => ({
        ruleId: 'M001',
        ruleName: 'Deadline Overdue',
        category: 'mandate',
        severity: 'critical',
        triggered: true,
        message: `Mandate "${m.position_title}" deadline has passed`,
        entityType: 'mandate',
        entityId: m.id,
        metadata: { deadline: m.deadline, days_overdue: Math.floor((new Date().getTime() - new Date(m.deadline).getTime()) / (1000 * 60 * 60 * 24)) },
      })),
  },
  {
    id: 'M002',
    name: 'Approaching Deadline',
    category: 'mandate',
    severity: 'high',
    check: ({ mandates }) => mandates
      .filter(m => m.status !== 'closed_won' && m.status !== 'closed_lost' && m.deadline)
      .filter(m => {
        const diff = new Date(m.deadline).getTime() - new Date().getTime();
        return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
      })
      .map(m => ({
        ruleId: 'M002',
        ruleName: 'Approaching Deadline',
        category: 'mandate',
        severity: 'high',
        triggered: true,
        message: `Mandate "${m.position_title}" deadline in 7 days`,
        entityType: 'mandate',
        entityId: m.id,
        metadata: { deadline: m.deadline, days_remaining: Math.ceil((new Date(m.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) },
      })),
  },
  {
    id: 'M003',
    name: 'No Activity for 14 Days',
    category: 'mandate',
    severity: 'high',
    check: ({ mandates }) => mandates
      .filter(m => m.status !== 'closed_won' && m.status !== 'closed_lost' && m.status !== 'on_hold' && m.created_at)
      .filter(m => {
        const diff = new Date().getTime() - new Date(m.created_at).getTime();
        return diff > 14 * 24 * 60 * 60 * 1000;
      })
      .map(m => ({
        ruleId: 'M003',
        ruleName: 'No Activity for 14 Days',
        category: 'mandate',
        severity: 'high',
        triggered: true,
        message: `Mandate "${m.position_title}" has no activity in 14+ days`,
        entityType: 'mandate',
        entityId: m.id,
        metadata: { days_since_activity: Math.floor((new Date().getTime() - new Date(m.created_at).getTime()) / (1000 * 60 * 60 * 24)) },
      })),
  },
  {
    id: 'M004',
    name: 'Priority Drift',
    category: 'mandate',
    severity: 'medium',
    check: ({ mandates }) => mandates
      .filter(m => m.priority_tier === 'tier1_closing' && m.status === 'on_hold')
      .map(m => ({
        ruleId: 'M004',
        ruleName: 'Priority Drift',
        category: 'mandate',
        severity: 'medium',
        triggered: true,
        message: `Tier 1 mandate "${m.position_title}" is on hold`,
        entityType: 'mandate',
        entityId: m.id,
      })),
  },
  {
    id: 'M005',
    name: 'No Consultant Assigned',
    category: 'mandate',
    severity: 'medium',
    check: ({ mandates }) => mandates
      .filter(m => m.status !== 'closed_won' && m.status !== 'closed_lost' && !m.consultant_id)
      .map(m => ({
        ruleId: 'M005',
        ruleName: 'No Consultant Assigned',
        category: 'mandate',
        severity: 'medium',
        triggered: true,
        message: `Mandate "${m.position_title}" has no consultant assigned`,
        entityType: 'mandate',
        entityId: m.id,
      })),
  },
  {
    id: 'C001',
    name: 'Ghost Candidate',
    category: 'candidate',
    severity: 'high',
    check: ({ candidates }) => candidates
      .filter(c => c.status === 'ghosted')
      .map(c => ({
        ruleId: 'C001',
        ruleName: 'Ghost Candidate',
        category: 'candidate',
        severity: 'high',
        triggered: true,
        message: `Candidate ${c.first_name} ${c.last_name} has ghosted`,
        entityType: 'candidate',
        entityId: c.id,
      })),
  },
  {
    id: 'C002',
    name: 'Candidate Status Stale',
    category: 'candidate',
    severity: 'medium',
    check: ({ candidates }) => candidates
      .filter(c => c.status === 'screening')
      .map(c => ({
        ruleId: 'C002',
        ruleName: 'Candidate Status Stale',
        category: 'candidate',
        severity: 'medium',
        triggered: true,
        message: `Candidate ${c.first_name} ${c.last_name} in screening for extended period`,
        entityType: 'candidate',
        entityId: c.id,
      })),
  },
  {
    id: 'C003',
    name: 'Duplicate Candidate',
    category: 'candidate',
    severity: 'medium',
    check: ({ candidates }) => {
      const seen = new Map<string, Candidate[]>();
      for (const c of candidates) {
        const key = `${c.email || ''}-${c.phone || ''}-${c.first_name}-${c.last_name}`;
        if (!seen.has(key)) seen.set(key, []);
        seen.get(key)!.push(c);
      }
      return Array.from(seen.entries())
        .filter(([, arr]) => arr.length > 1)
        .flatMap(([, arr]) => arr.slice(1).map(c => ({
          ruleId: 'C003',
          ruleName: 'Duplicate Candidate',
          category: 'candidate',
          severity: 'medium',
          triggered: true,
          message: `Candidate ${c.first_name} ${c.last_name} may be a duplicate`,
          entityType: 'candidate',
          entityId: c.id,
        })));
    },
  },
  {
    id: 'P001',
    name: 'Stale Pipeline Stage',
    category: 'pipeline',
    severity: 'high',
    check: ({ pipeline }) => pipeline
      .filter(p => p.days_in_stage !== undefined && p.days_in_stage > 14)
      .map(p => ({
        ruleId: 'P001',
        ruleName: 'Stale Pipeline Stage',
        category: 'pipeline',
        severity: 'high',
        triggered: true,
        message: `Candidate in ${p.stage} for ${p.days_in_stage} days`,
        entityType: 'mandate_candidate',
        entityId: p.id,
        metadata: { days_in_stage: p.days_in_stage, stage: p.stage },
      })),
  },
  {
    id: 'P002',
    name: 'Zero Pipeline',
    category: 'pipeline',
    severity: 'critical',
    check: ({ mandates, pipeline }) => {
      const mandateIdsWithPipeline = new Set(pipeline.map(p => p.mandate_id));
      return mandates
        .filter(m => m.status !== 'closed_won' && m.status !== 'closed_lost' && !mandateIdsWithPipeline.has(m.id))
        .map(m => ({
          ruleId: 'P002',
          ruleName: 'Zero Pipeline',
          category: 'pipeline',
          severity: 'critical',
          triggered: true,
          message: `Mandate "${m.position_title}" has zero candidates in pipeline`,
          entityType: 'mandate',
          entityId: m.id,
        }));
    },
  },
  {
    id: 'P003',
    name: 'Interview Scheduled',
    category: 'pipeline',
    severity: 'info',
    check: ({ pipeline }) => pipeline
      .filter(p => p.interview_date && new Date(p.interview_date) > new Date())
      .map(p => ({
        ruleId: 'P003',
        ruleName: 'Interview Scheduled',
        category: 'pipeline',
        severity: 'info',
        triggered: true,
        message: `Interview scheduled for pipeline entry`,
        entityType: 'mandate_candidate',
        entityId: p.id,
        metadata: { interview_date: p.interview_date },
      })),
  },
  {
    id: 'P004',
    name: 'Offer Extended',
    category: 'pipeline',
    severity: 'info',
    check: ({ pipeline }) => pipeline
      .filter(p => p.stage === 'offer_pending' && p.offer_amount)
      .map(p => ({
        ruleId: 'P004',
        ruleName: 'Offer Extended',
        category: 'pipeline',
        severity: 'info',
        triggered: true,
        message: `Offer of ${p.offer_amount} extended`,
        entityType: 'mandate_candidate',
        entityId: p.id,
        metadata: { offer_amount: p.offer_amount },
      })),
  },
  {
    id: 'P005',
    name: 'Low Match Score',
    category: 'pipeline',
    severity: 'medium',
    check: ({ pipeline }) => pipeline
      .filter(p => p.match_score !== undefined && p.match_score < 50)
      .map(p => ({
        ruleId: 'P005',
        ruleName: 'Low Match Score',
        category: 'pipeline',
        severity: 'medium',
        triggered: true,
        message: `Candidate match score is ${p.match_score}%`,
        entityType: 'mandate_candidate',
        entityId: p.id,
        metadata: { match_score: p.match_score },
      })),
  },
  {
    id: 'CN001',
    name: 'Consultant Overloaded',
    category: 'consultant',
    severity: 'critical',
    check: ({ consultants }) => consultants
      .filter(c => c.current_load >= c.max_capacity)
      .map(c => ({
        ruleId: 'CN001',
        ruleName: 'Consultant Overloaded',
        category: 'consultant',
        severity: 'critical',
        triggered: true,
        message: `Consultant ${c.name} is overloaded (${c.current_load}/${c.max_capacity})`,
        entityType: 'consultant',
        entityId: c.id,
        metadata: { current_load: c.current_load, max_capacity: c.max_capacity },
      })),
  },
  {
    id: 'CN002',
    name: 'Consultant At Capacity',
    category: 'consultant',
    severity: 'high',
    check: ({ consultants }) => consultants
      .filter(c => c.current_load >= c.max_capacity * 0.8 && c.current_load < c.max_capacity)
      .map(c => ({
        ruleId: 'CN002',
        ruleName: 'Consultant At Capacity',
        category: 'consultant',
        severity: 'high',
        triggered: true,
        message: `Consultant ${c.name} is at 80%+ capacity (${c.current_load}/${c.max_capacity})`,
        entityType: 'consultant',
        entityId: c.id,
        metadata: { current_load: c.current_load, max_capacity: c.max_capacity },
      })),
  },
  {
    id: 'CN003',
    name: 'Consultant Underutilized',
    category: 'consultant',
    severity: 'low',
    check: ({ consultants }) => consultants
      .filter(c => c.current_load < c.max_capacity * 0.3)
      .map(c => ({
        ruleId: 'CN003',
        ruleName: 'Consultant Underutilized',
        category: 'consultant',
        severity: 'low',
        triggered: true,
        message: `Consultant ${c.name} is underutilized (${c.current_load}/${c.max_capacity})`,
        entityType: 'consultant',
        entityId: c.id,
        metadata: { current_load: c.current_load, max_capacity: c.max_capacity },
      })),
  },
];

export function runAllRules(data: { mandates: Mandate[]; candidates: Candidate[]; pipeline: MandateCandidate[]; consultants: Consultant[] }): RuleResult[] {
  return RULES.flatMap(rule => rule.check(data));
}

// ── API HANDLER ─────────────────────────────────────────────────────────
async function handleFeeCalculation(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  const path = (req.query as any).path || [];
  const mandateId = path[0];

  try {
    if (!mandateId) {
      return res.status(400).json({ error: 'Mandate ID required' });
    }

    const mandate = await selectOne('mandates', { id: mandateId });
    if (!mandate) return res.status(404).json({ error: 'Mandate not found' });

    let feeConfig: FeeConfig | undefined;
    if (mandate.fee_config_id) {
      feeConfig = await selectOne('fee_configs', { id: mandate.fee_config_id });
    }

    const result = calculateFee(mandate as Mandate, feeConfig);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error('[Fee Calculation] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleStatusTransition(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  const path = (req.query as any).path || [];
  const entityType = path[0];
  const entityId = path[1];

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status required' });

    let currentStatus: string | null = null;
    let valid = false;

    if (entityType === 'mandate') {
      const mandate = await selectOne('mandates', { id: entityId });
      if (!mandate) return res.status(404).json({ error: 'Mandate not found' });
      currentStatus = mandate.status;
      valid = isValidTransition(currentStatus, status, 'mandate');
    } else if (entityType === 'candidate') {
      const candidate = await selectOne('candidates', { id: entityId });
      if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
      currentStatus = candidate.status;
      valid = isValidTransition(currentStatus, status, 'candidate');
    } else if (entityType === 'pipeline') {
      const mc = await selectOne('mandate_candidates', { id: entityId });
      if (!mc) return res.status(404).json({ error: 'Pipeline entry not found' });
      currentStatus = mc.stage;
      valid = isValidTransition(currentStatus, status, 'pipeline');
    } else {
      return res.status(400).json({ error: `Unknown entity type: ${entityType}` });
    }

    if (!valid) {
      const transitions = entityType === 'mandate' ? STATUS_TRANSITIONS
        : entityType === 'candidate' ? CANDIDATE_STATUS_TRANSITIONS
        : PIPELINE_STAGE_TRANSITIONS;
      return res.status(400).json({
        error: `Invalid transition: ${currentStatus} -> ${status}`,
        allowed_transitions: transitions[currentStatus || ''] || [],
      });
    }

    if (entityType === 'mandate') {
      await update('mandates', entityId, { status });
    } else if (entityType === 'candidate') {
      await update('candidates', entityId, { status });
    } else if (entityType === 'pipeline') {
      await update('mandate_candidates', entityId, { stage: status });
    }

    return res.status(200).json({ success: true, transition: `${currentStatus} -> ${status}` });
  } catch (err: any) {
    console.error('[Status Transition] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePriorityClassification(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  const path = (req.query as any).path || [];
  const mandateId = path[0];

  try {
    if (req.method === 'POST') {
      if (mandateId) {
        const mandate = await selectOne('mandates', { id: mandateId });
        if (!mandate) return res.status(404).json({ error: 'Mandate not found' });
        const newTier = classifyPriority(mandate as Mandate);
        await update('mandates', mandateId, { priority_tier: newTier });
        return res.status(200).json({ success: true, priority_tier: newTier });
      } else {
        const mandates = await selectMany('mandates', { is_deleted: false });
        let updated = 0;
        for (const m of mandates) {
          const newTier = classifyPriority(m as Mandate);
          if (m.priority_tier !== newTier) {
            await update('mandates', m.id, { priority_tier: newTier });
            updated++;
          }
        }
        return res.status(200).json({ success: true, updated_count: updated });
      }
    }

    if (req.method === 'GET') {
      const mandates = await selectMany('mandates', { is_deleted: false });
      const classification = mandates.map(m => ({
        id: m.id,
        title: m.position_title,
        current_tier: m.priority_tier,
        calculated_tier: classifyPriority(m as Mandate),
        status: m.status,
      }));
      return res.status(200).json(classification);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[Priority Classification] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleCapacity(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  const path = (req.query as any).path || [];
  const consultantId = path[0];

  try {
    if (req.method === 'GET') {
      if (consultantId) {
        const consultant = await selectOne('consultants', { id: consultantId });
        if (!consultant) return res.status(404).json({ error: 'Consultant not found' });
        const capacity = calculateCapacity(consultant as Consultant);
        return res.status(200).json({ ...consultant, ...capacity });
      }

      const consultants = await selectMany('consultants', {});
      const capacityData = consultants.map(c => ({
        ...c,
        ...calculateCapacity(c as Consultant),
      }));
      return res.status(200).json(capacityData);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[Capacity] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleRules(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  const path = (req.query as any).path || [];
  const ruleId = path[0];

  try {
    if (req.method === 'GET') {
      if (ruleId === 'list') {
        return res.status(200).json(RULES.map(r => ({
          id: r.id,
          name: r.name,
          category: r.category,
          severity: r.severity,
        })));
      }

      const [mandates, candidates, pipeline, consultants] = await Promise.all([
        selectMany('mandates', { is_deleted: false }),
        selectMany('candidates', {}),
        selectMany('mandate_candidates', {}),
        selectMany('consultants', {}),
      ]);

      const results = runAllRules({
        mandates: mandates as Mandate[],
        candidates: candidates as Candidate[],
        pipeline: pipeline as MandateCandidate[],
        consultants: consultants as Consultant[],
      });

      const filtered = ruleId
        ? results.filter(r => r.ruleId === ruleId || r.category === ruleId || r.severity === ruleId)
        : results;

      return res.status(200).json({
        total_triggered: filtered.length,
        results: filtered,
        summary: {
          critical: filtered.filter(r => r.severity === 'critical').length,
          high: filtered.filter(r => r.severity === 'high').length,
          medium: filtered.filter(r => r.severity === 'medium').length,
          low: filtered.filter(r => r.severity === 'low').length,
          info: filtered.filter(r => r.severity === 'info').length,
        },
      });
    }

    if (req.method === 'POST' && ruleId === 'run-all') {
      const [mandates, candidates, pipeline, consultants] = await Promise.all([
        selectMany('mandates', { is_deleted: false }),
        selectMany('candidates', {}),
        selectMany('mandate_candidates', {}),
        selectMany('consultants', {}),
      ]);

      const results = runAllRules({
        mandates: mandates as Mandate[],
        candidates: candidates as Candidate[],
        pipeline: pipeline as MandateCandidate[],
        consultants: consultants as Consultant[],
      });

      for (const result of results) {
        await insert('auto_flags', {
          flag_type: getFlagTypeFromRule(result),
          entity_type: result.entityType,
          entity_id: result.entityId,
          severity: result.severity,
          status: 'detected',
          description: result.message,
          metadata: result.metadata,
        });
      }

      return res.status(200).json({
        success: true,
        rules_run: RULES.length,
        flags_created: results.length,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[Rules Engine] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function getFlagTypeFromRule(result: RuleResult): string {
  const mapping: Record<string, string> = {
    'M001': 'DEADLINE_OVERDUE',
    'M002': 'APPROACHING_TARGET',
    'M003': 'STALE_PIPELINE',
    'M004': 'PRIORITY_DRIFT',
    'M005': 'ZERO_PIPELINE',
    'C001': 'GHOST',
    'C002': 'STALE_PIPELINE',
    'C003': 'DUPLICATE_EFFORT',
    'P001': 'STALE_PIPELINE',
    'P002': 'ZERO_PIPELINE',
    'P003': 'NEW_ACTIVITY',
    'P004': 'NEW_ACTIVITY',
    'P005': 'AT_RISK',
    'CN001': 'CAPACITY_OVERFLOW',
    'CN002': 'CAPACITY_OVERFLOW',
    'CN003': 'AT_RISK',
  };
  return mapping[result.ruleId] || 'AT_RISK';
}

export async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isSupabaseConfigured()) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  const path = (req.query as any).path || [];
  const resource = path[0];

  switch (resource) {
    case 'fee-calculation':
      return handleFeeCalculation(req, res);
    case 'status-transition':
      return handleStatusTransition(req, res);
    case 'priority':
      return handlePriorityClassification(req, res);
    case 'capacity':
      return handleCapacity(req, res);
    case 'rules':
      return handleRules(req, res);
    default:
      return res.status(404).json({ error: `Unknown resource: /api/v2/${resource}` });
  }
}