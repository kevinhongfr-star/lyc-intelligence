import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from './adminAuth.js';
import { selectMany, selectOne, insert, update, isSupabaseConfigured } from './supabaseRest.js';

/* ─── Constants ─── */
const STAGE_WEIGHT: Record<string, number> = {
  kick_off: 0.5, sourcing: 0.8, screening: 1.0, shortlist: 1.2,
  interview: 1.5, offer: 1.8, onboarded: 1.0,
  closed_won: 0.0, closed_lost: 0.0, on_hold: 0.3,
};

const DIFFICULTY_MULTIPLIER: Record<number, number> = {
  1: 0.7, 2: 0.85, 3: 1.0, 4: 1.2, 5: 1.5,
};

/* ─── Capacity Calculation ─── */
async function calculateConsultantCapacity(consultantId: string) {
  const consultant = await selectOne('consultants', { where: [{ column: 'id', value: consultantId }] });
  if (!consultant) return null;

  const mandates = await selectMany('mandates', {
    where: [
      { column: 'consultant_id', value: consultantId },
      { column: 'is_deleted', value: false },
      { column: 'status', value: ['not_started', 'kick_off', 'sourcing', 'screening', 'shortlist', 'interview', 'offer', 'on_hold'], op: 'in' },
    ],
  });

  let weightedLoad = 0;
  let difficultySum = 0;
  let stageSum = 0;

  for (const m of mandates) {
    const stageW = STAGE_WEIGHT[m.status] || 0.5;
    const diffW = DIFFICULTY_MULTIPLIER[m.difficulty_score || 3] || 1.0;
    const mandateWeight = stageW * diffW;
    weightedLoad += mandateWeight;
    difficultySum += diffW;
    stageSum += stageW;
  }

  const maxCapacity = consultant.max_capacity || 8;
  const capacityRatio = weightedLoad / maxCapacity;

  let status: string;
  if (capacityRatio > 1.0) status = 'overloaded';
  else if (capacityRatio > 0.85) status = 'at_capacity';
  else if (capacityRatio < 0.4) status = 'underloaded';
  else status = 'balanced';

  return {
    consultant_id: consultant.id,
    name: consultant.name,
    mandate_count: mandates.length,
    weighted_load: Math.round(weightedLoad * 100) / 100,
    max_capacity: maxCapacity,
    capacity_ratio: Math.round(capacityRatio * 1000) / 1000,
    status,
    active_mandates: mandates.map((m: any) => ({ id: m.id, title: m.position_title, status: m.status, weight: Math.round((STAGE_WEIGHT[m.status] || 0.5) * (DIFFICULTY_MULTIPLIER[m.difficulty_score || 3] || 1.0) * 100) / 100 })),
    difficulty_weighted_sum: Math.round(difficultySum * 100) / 100,
    stage_weighted_sum: Math.round(stageSum * 100) / 100,
  };
}

/* ─── Load Balancer ─── */
async function rebalanceTeamLoad() {
  const consultants = await selectMany('consultants', { where: [{ column: 'is_deleted', value: false }] });
  const loads: Record<string, any> = {};

  for (const c of consultants) {
    loads[c.id] = await calculateConsultantCapacity(c.id);
  }

  const overloaded = consultants.filter((c: any) => loads[c.id]?.status === 'overloaded');
  const underloaded = consultants.filter((c: any) => loads[c.id]?.capacity_ratio < 0.4);

  if (overloaded.length === 0 || underloaded.length === 0) {
    return { status: 'balanced', recommendations: [], team_status: 'optimal' };
  }

  const recommendations: any[] = [];

  for (const overC of overloaded) {
    const overMandates = loads[overC.id].active_mandates;
    for (const mandate of overMandates) {
      for (const underC of underloaded) {
        const compatibility = await calculateAssignmentCompatibility(mandate.id, underC.id);
        if (compatibility.score > 0.6 && loads[underC.id].capacity_ratio < 0.8) {
          const fromLoadAfter = loads[overC.id].capacity_ratio - (mandate.weight / loads[overC.id].max_capacity);
          const toLoadAfter = loads[underC.id].capacity_ratio + (mandate.weight / loads[underC.id].max_capacity);
          recommendations.push({
            mandate_id: mandate.id,
            mandate_title: mandate.title,
            from_consultant: overC.name,
            from_consultant_id: overC.id,
            to_consultant: underC.name,
            to_consultant_id: underC.id,
            compatibility_score: compatibility.score,
            reasons: compatibility.reasons,
            impact: {
              from_load_after: Math.round(fromLoadAfter * 1000) / 1000,
              to_load_after: Math.round(toLoadAfter * 1000) / 1000,
            },
          });
        }
      }
    }
  }

  recommendations.sort((a, b) => b.compatibility_score - a.compatibility_score);

  return {
    status: 'imbalanced',
    team_status: 'needs_rebalancing',
    overloaded_count: overloaded.length,
    underloaded_count: underloaded.length,
    recommendations: recommendations.slice(0, 10),
  };
}

async function calculateAssignmentCompatibility(mandateId: string, consultantId: string) {
  const [mandate, consultant] = await Promise.all([
    selectOne('mandates', { where: [{ column: 'id', value: mandateId }] }),
    selectOne('consultants', { where: [{ column: 'id', value: consultantId }] }),
  ]);

  if (!mandate || !consultant) return { score: 0, reasons: ['Mandate or consultant not found'] };

  let score = 0;
  const reasons: string[] = [];

  // Specialization match
  const specializations = consultant.specializations || [];
  if (specializations.includes(mandate.industry)) {
    score += 0.3;
    reasons.push(`Industry match: ${mandate.industry}`);
  }

  // Current load
  const capacity = await calculateConsultantCapacity(consultantId);
  if (capacity && capacity.capacity_ratio >= 0.4 && capacity.capacity_ratio <= 0.85) {
    score += 0.25;
    reasons.push('Available capacity');
  }

  // Track record
  const similarPast = await countSimilarMandates(consultantId, mandate.position_title, mandate.industry);
  if (similarPast >= 3) {
    score += 0.25;
    reasons.push(`${similarPast} similar mandates completed`);
  }

  // Location/language fit
  if (mandate.location && consultantLocationMatch(consultant, mandate.location)) {
    score += 0.2;
    reasons.push('Location/language alignment');
  }

  return { score: Math.round(score * 100) / 100, reasons };
}

async function countSimilarMandates(consultantId: string, positionTitle: string, industry: string): Promise<number> {
  const mandates = await selectMany('mandates', {
    where: [
      { column: 'consultant_id', value: consultantId },
      { column: 'status', value: ['closed_won', 'onboarded'], op: 'in' },
    ],
  });

  let count = 0;
  for (const m of mandates) {
    if (m.industry === industry || (m.position_title && positionTitle && m.position_title.toLowerCase().includes(positionTitle.toLowerCase()))) {
      count++;
    }
  }
  return count;
}

function consultantLocationMatch(consultant: any, location: string): boolean {
  const consultantLocation = (consultant.location || '').toLowerCase();
  const mandateLocation = (location || '').toLowerCase();
  return consultantLocation.includes(mandateLocation) || mandateLocation.includes(consultantLocation);
}

/* ─── Simulation ─── */
async function simulateRebalance(moves: any[]) {
  const consultants = await selectMany('consultants', { where: [{ column: 'is_deleted', value: false }] });
  const projectedLoads: Record<string, any> = {};

  for (const c of consultants) {
    const capacity = await calculateConsultantCapacity(c.id);
    projectedLoads[c.id] = { ...capacity };
  }

  for (const move of moves) {
    const { mandate_id, from_consultant_id, to_consultant_id } = move;
    const mandate = await selectOne('mandates', { where: [{ column: 'id', value: mandate_id }] });
    if (!mandate) continue;

    const weight = (STAGE_WEIGHT[mandate.status] || 0.5) * (DIFFICULTY_MULTIPLIER[mandate.difficulty_score || 3] || 1.0);

    if (projectedLoads[from_consultant_id]) {
      projectedLoads[from_consultant_id].weighted_load -= weight;
      projectedLoads[from_consultant_id].capacity_ratio = projectedLoads[from_consultant_id].weighted_load / projectedLoads[from_consultant_id].max_capacity;
      projectedLoads[from_consultant_id].mandate_count--;
    }
    if (projectedLoads[to_consultant_id]) {
      projectedLoads[to_consultant_id].weighted_load += weight;
      projectedLoads[to_consultant_id].capacity_ratio = projectedLoads[to_consultant_id].weighted_load / projectedLoads[to_consultant_id].max_capacity;
      projectedLoads[to_consultant_id].mandate_count++;
    }
  }

  const ratios = Object.values(projectedLoads).map((l: any) => l.capacity_ratio);
  const gini = calculateGini(ratios);
  const totalUtilization = ratios.reduce((sum: number, r: number) => sum + r, 0) / ratios.length;

  return {
    projected_loads: projectedLoads,
    gini_coefficient: Math.round(gini * 1000) / 1000,
    total_utilization: Math.round(totalUtilization * 1000) / 1000,
    risk_assessment: assessRisk(moves, projectedLoads),
  };
}

function calculateGini(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  let sum = 0;
  for (let i = 0; i < sorted.length; i++) {
    sum += sorted[i] * (i + 1);
  }
  const mean = sorted.reduce((a, b) => a + b, 0) / sorted.length;
  return (2 * sum) / (sorted.length * sorted.reduce((a, b) => a + b, 0)) - (sorted.length + 1) / sorted.length;
}

function assessRisk(moves: any[], projectedLoads: Record<string, any>): any {
  const risks: string[] = [];
  for (const [id, load] of Object.entries(projectedLoads)) {
    if (load.capacity_ratio > 1.2) risks.push(`Consultant ${load.name} severely overloaded after moves`);
    if (load.mandate_count === 0) risks.push(`Consultant ${load.name} has zero mandates after moves`);
  }
  if (moves.length > 5) risks.push('High number of moves may cause disruption');
  return { level: risks.length > 2 ? 'high' : risks.length > 0 ? 'medium' : 'low', items: risks };
}

/* ─── Assignment Recommendation ─── */
async function recommendAssignment(mandateId: string) {
  const mandate = await selectOne('mandates', { where: [{ column: 'id', value: mandateId }] });
  if (!mandate) return { error: 'Mandate not found' };

  const consultants = await selectMany('consultants', { where: [{ column: 'is_deleted', value: false }] });
  const scores: any[] = [];

  for (const c of consultants) {
    const compatibility = await calculateAssignmentCompatibility(mandateId, c.id);
    const capacity = await calculateConsultantCapacity(c.id);
    scores.push({
      consultant_id: c.id,
      name: c.name,
      score: compatibility.score,
      reasons: compatibility.reasons,
      current_capacity_ratio: capacity?.capacity_ratio || 0,
      current_mandate_count: capacity?.mandate_count || 0,
      status: capacity?.status || 'unknown',
    });
  }

  scores.sort((a, b) => b.score - a.score);
  return { mandate_id: mandateId, mandate_title: mandate.position_title, recommended_consultants: scores };
}

/* ─── API Handlers ─── */
async function handleCapacity(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  const path = (req.query as any).path || [];
  const action = path[1];

  try {
    if (req.method === 'GET') {
      if (action === 'overview') {
        const consultants = await selectMany('consultants', { where: [{ column: 'is_deleted', value: false }] });
        const overview = [];
        for (const c of consultants) {
          const cap = await calculateConsultantCapacity(c.id);
          if (cap) overview.push(cap);
        }
        return res.status(200).json({ success: true, consultants: overview });
      }

      // /api/v8/capacity/:consultant_id
      if (action) {
        const capacity = await calculateConsultantCapacity(action);
        if (!capacity) return res.status(404).json({ error: 'Consultant not found' });
        return res.status(200).json({ success: true, capacity });
      }
    }

    if (req.method === 'POST') {
      if (action === 'rebalance') {
        const result = await rebalanceTeamLoad();
        return res.status(200).json({ success: true, ...result });
      }

      if (action === 'simulate') {
        const { moves } = req.body;
        if (!moves || !Array.isArray(moves)) {
          return res.status(400).json({ error: 'moves array required' });
        }
        const result = await simulateRebalance(moves);
        return res.status(200).json({ success: true, ...result });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[Capacity] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleAssignments(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  const path = (req.query as any).path || [];
  const action = path[1];

  try {
    if (req.method === 'POST' && action === 'recommend') {
      const { mandate_id } = req.body;
      if (!mandate_id) return res.status(400).json({ error: 'mandate_id required' });
      const result = await recommendAssignment(mandate_id);
      return res.status(200).json({ success: true, ...result });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[Assignments] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/* ─── Main Router ─── */
export async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isSupabaseConfigured()) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  const path = (req.query as any).path || [];
  const resource = path[0];

  switch (resource) {
    case 'capacity':
      return handleCapacity(req, res);
    case 'assignments':
      return handleAssignments(req, res);
    default:
      return res.status(404).json({ error: `Unknown resource: /api/v8/${resource}` });
  }
}