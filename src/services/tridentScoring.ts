export const TRIDENT_WEIGHTS = { d1: 0.40, d2: 0.35, d3: 0.25 } as const;
export const VERDICT_THRESHOLDS = { strong: 75, conditional: 50, weak: 30 } as const;
export interface TRIDENTScores { d1: number; d2: number; d3: number; }
export interface TRIDENTResult extends TRIDENTScores { composite: number; verdict: 'Strong Fit' | 'Conditional Fit' | 'Weak Fit' | 'Reject'; tier: 'T1' | 'T2' | 'T3'; clientVerdict: 'Strong Primary' | 'Strong Secondary' | 'Reserve' | 'Not Included'; }
export function computeTRIDENT(scores: TRIDENTScores): TRIDENTResult {
  const composite = Math.round((scores.d1 * 0.40 + scores.d2 * 0.35 + scores.d3 * 0.25) * 10);
  let verdict: TRIDENTResult['verdict'], tier: TRIDENTResult['tier'], clientVerdict: TRIDENTResult['clientVerdict'];
  if (composite >= 75) { verdict = 'Strong Fit'; tier = 'T1'; clientVerdict = 'Strong Primary'; }
  else if (composite >= 50) { verdict = 'Conditional Fit'; tier = 'T2'; clientVerdict = 'Strong Secondary'; }
  else if (composite >= 30) { verdict = 'Weak Fit'; tier = 'T3'; clientVerdict = 'Reserve'; }
  else { verdict = 'Reject'; tier = 'T3'; clientVerdict = 'Not Included'; }
  return { ...scores, composite, verdict, tier, clientVerdict };
}
