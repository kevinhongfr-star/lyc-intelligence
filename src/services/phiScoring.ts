export const PHI_WEIGHTS = { urgency: 0.25, strategic: 0.20, value: 0.20, retainer: 0.20, decision: 0.15 } as const;
export interface PHIDimensions { urgency: number; strategic: number; value: number; retainer: number; decision: number; }
export interface PHIResult { dimensions: PHIDimensions; composite: number; status: 'GREEN' | 'AMBER' | 'RED'; actionPriority: number; slaBehind: boolean; }
export function computePHI(dimensions: PHIDimensions): PHIResult {
  const composite = Math.round((dimensions.urgency * 0.25 + dimensions.strategic * 0.20 + dimensions.value * 0.20 + dimensions.retainer * 0.20 + dimensions.decision * 0.15) * 100) / 100;
  const status: PHIResult['status'] = composite > 2.2 ? 'RED' : composite >= 1.5 ? 'AMBER' : 'GREEN';
  const actionPriority = Math.round(dimensions.urgency * dimensions.value * (composite > 2.0 ? 1.5 : 1.0) * 10);
  const slaBehind = dimensions.urgency === 3 && dimensions.retainer >= 2;
  return { dimensions, composite, status, actionPriority, slaBehind };
}
export function autoComputePHI(mandate: { status: string; created_at: string; tier1_count: number; tier2_count: number; shortlisted_count: number; interview_count: number; placed_count: number; priority?: string | null; }): PHIResult {
  const ageDays = Math.floor((Date.now() - new Date(mandate.created_at).getTime()) / 86400000);
  const urgency = ageDays > 60 ? 3 : ageDays > 30 ? 2 : 1;
  const strategic = mandate.priority === 'high' ? 3 : mandate.priority === 'medium' ? 2 : 1;
  const value = (mandate.shortlisted_count + mandate.interview_count) > 0 ? 3 : mandate.tier1_count > 3 ? 2 : 1;
  const retainer = ['3_deliver', 'won'].includes(mandate.status) ? 3 : mandate.status === '2_call' ? 2 : 1;
  const decision = mandate.placed_count > 0 ? 3 : mandate.interview_count > 0 ? 2 : 1;
  return computePHI({ urgency, strategic, value, retainer, decision });
}
