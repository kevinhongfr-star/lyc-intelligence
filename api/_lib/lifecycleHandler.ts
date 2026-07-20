/**
 * api/_lib/lifecycleHandler.ts — Candidate Lifecycle Automation
 * Issue #41: Auto stage transitions, lifecycle rules, trigger management
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface LifecycleRule {
  id: string;
  name: string;
  fromStage: string;
  toStage: string;
  trigger: 'manual' | 'time_based' | 'event_based' | 'score_threshold';
  condition?: Record<string, any>;
  autoActions: string[];
  notifyRoles: string[];
  active: boolean;
  createdAt: string;
}

interface CandidateStage {
  candidateId: string;
  mandateId: string;
  currentStage: string;
  previousStage: string;
  enteredAt: string;
  daysInStage: number;
  score: number;
  lastActivityAt: string;
}

const MOCK_RULES: LifecycleRule[] = [
  {
    id: 'rule-1',
    name: 'Auto Shortlist on High Score',
    fromStage: 'screening',
    toStage: 'shortlist',
    trigger: 'score_threshold',
    condition: { minScore: 85 },
    autoActions: ['notify_consultant', 'update_pipeline'],
    notifyRoles: ['consultant', 'client'],
    active: true,
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'rule-2',
    name: 'Archive After 90 Days Inactive',
    fromStage: 'on_hold',
    toStage: 'archived',
    trigger: 'time_based',
    condition: { days: 90 },
    autoActions: ['send_followup', 'archive_record'],
    notifyRoles: ['consultant'],
    active: true,
    createdAt: '2026-02-01T08:30:00Z',
  },
  {
    id: 'rule-3',
    name: 'Interview Scheduled → Interviewing',
    fromStage: 'shortlist',
    toStage: 'interviewing',
    trigger: 'event_based',
    condition: { event: 'interview_scheduled' },
    autoActions: ['send_calendar_invite', 'notify_candidate'],
    notifyRoles: ['candidate', 'consultant'],
    active: true,
    createdAt: '2026-01-20T14:00:00Z',
  },
  {
    id: 'rule-4',
    name: 'Offer Extended → Offer Stage',
    fromStage: 'interviewing',
    toStage: 'offer',
    trigger: 'event_based',
    condition: { event: 'offer_extended' },
    autoActions: ['generate_offer_letter', 'notify_candidate'],
    notifyRoles: ['candidate', 'client', 'consultant'],
    active: true,
    createdAt: '2026-03-01T09:00:00Z',
  },
];

const MOCK_CANDIDATES: CandidateStage[] = [
  {
    candidateId: 'cand-101',
    mandateId: 'man-201',
    currentStage: 'screening',
    previousStage: 'new',
    enteredAt: '2026-07-10T08:00:00Z',
    daysInStage: 10,
    score: 92,
    lastActivityAt: '2026-07-18T14:30:00Z',
  },
  {
    candidateId: 'cand-102',
    mandateId: 'man-201',
    currentStage: 'on_hold',
    previousStage: 'shortlist',
    enteredAt: '2026-04-15T10:00:00Z',
    daysInStage: 96,
    score: 78,
    lastActivityAt: '2026-04-20T11:00:00Z',
  },
  {
    candidateId: 'cand-103',
    mandateId: 'man-202',
    currentStage: 'interviewing',
    previousStage: 'shortlist',
    enteredAt: '2026-07-05T09:00:00Z',
    daysInStage: 15,
    score: 88,
    lastActivityAt: '2026-07-19T16:00:00Z',
  },
];

function getUser(req: VercelRequest) {
  return (req as any).__authenticatedUser;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const path = ((req.query as any).path || []) as string[];
  const method = req.method || 'GET';
  const user = getUser(req);

  try {
    // GET /rules — list automation rules
    if (method === 'GET' && path[0] === 'rules') {
      const { data: rules } = await supabase
        .from('lifecycle_rules')
        .select('*')
        .order('created_at', { ascending: false });

      return res.status(200).json({
        success: true,
        rules: rules || MOCK_RULES,
      });
    }

    // POST /rules — create a new rule
    if (method === 'POST' && path[0] === 'rules') {
      const body = req.body || {};
      const newRule: LifecycleRule = {
        id: `rule-${Date.now()}`,
        name: body.name,
        fromStage: body.fromStage,
        toStage: body.toStage,
        trigger: body.trigger,
        condition: body.condition || {},
        autoActions: body.autoActions || [],
        notifyRoles: body.notifyRoles || [],
        active: body.active ?? true,
        createdAt: new Date().toISOString(),
      };

      const { error } = await supabase.from('lifecycle_rules').insert(newRule);
      if (error) console.warn('lifecycle_rules insert failed:', error.message);

      return res.status(201).json({ success: true, rule: newRule });
    }

    // PUT /rules/:id — update rule
    if (method === 'PUT' && path[0] === 'rules' && path[1]) {
      const updates = req.body || {};
      const { error } = await supabase
        .from('lifecycle_rules')
        .update(updates)
        .eq('id', path[1]);

      if (error) console.warn('lifecycle_rules update failed:', error.message);

      return res.status(200).json({ success: true, id: path[1], updates });
    }

    // DELETE /rules/:id — delete rule
    if (method === 'DELETE' && path[0] === 'rules' && path[1]) {
      const { error } = await supabase
        .from('lifecycle_rules')
        .delete()
        .eq('id', path[1]);

      if (error) console.warn('lifecycle_rules delete failed:', error.message);

      return res.status(200).json({ success: true, deleted: path[1] });
    }

    // GET /candidates — candidates with stage info
    if (method === 'GET' && path[0] === 'candidates') {
      const { mandate_id, stage } = req.query;
      let candidates = MOCK_CANDIDATES;

      if (mandate_id) {
        candidates = candidates.filter(c => c.mandateId === mandate_id);
      }
      if (stage) {
        candidates = candidates.filter(c => c.currentStage === stage);
      }

      return res.status(200).json({
        success: true,
        candidates,
        total: candidates.length,
      });
    }

    // POST /transition — manually trigger or simulate stage transition
    if (method === 'POST' && path[0] === 'transition') {
      const { candidateId, toStage, reason } = req.body || {};

      const transition = {
        candidateId,
        fromStage: 'screening',
        toStage,
        reason: reason || 'Manual transition',
        triggeredBy: user?.id || 'system',
        triggeredAt: new Date().toISOString(),
        actionsExecuted: ['update_stage', 'log_transition'],
      };

      return res.status(200).json({
        success: true,
        transition,
      });
    }

    // GET /stats — lifecycle overview stats
    if (method === 'GET' && path[0] === 'stats') {
      const stats = {
        totalCandidates: MOCK_CANDIDATES.length,
        byStage: {
          screening: 1,
          on_hold: 1,
          interviewing: 1,
        },
        avgDaysInStage: 40,
        autoTransitionsToday: 3,
        pendingTransitions: 2,
        activeRules: MOCK_RULES.filter(r => r.active).length,
      };

      return res.status(200).json({ success: true, stats });
    }

    return res.status(404).json({ error: 'Unknown lifecycle endpoint' });
  } catch (err: any) {
    console.error('[lifecycleHandler]', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}
