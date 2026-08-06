import { selectOne, selectMany, insert } from './supabaseRest.js';

export type TrustLevel = 'cold' | 'warm' | 'trusted' | 'veteran';

export type TrustSignal =
  | 'shared_context'
  | 'vulnerability'
  | 'follow_through'
  | 'consistency'
  | 'feedback';

export interface TrustSignalRecord {
  id?: string;
  user_id: string;
  signal: TrustSignal;
  value?: number;
  created_at?: string;
}

const SIGNAL_WEIGHTS: Record<TrustSignal, number> = {
  shared_context: 1.0,
  vulnerability: 1.5,
  follow_through: 1.2,
  consistency: 1.0,
  feedback: 0.8,
};

const TRUST_THRESHOLDS = {
  cold: 0,
  warm: 3,
  trusted: 7,
  veteran: 12,
};

const TRUST_LEVEL_ORDER: TrustLevel[] = ['cold', 'warm', 'trusted', 'veteran'];

export function computeTrustScore(signals: TrustSignalRecord[]): number {
  if (!signals || signals.length === 0) {
    return 0;
  }

  let score = 0;
  for (const record of signals) {
    const weight = SIGNAL_WEIGHTS[record.signal] || 1.0;
    const value = record.value ?? 1;
    score += weight * value;
  }

  return Math.round(score * 10) / 10;
}

export function getTrustLevel(score: number): TrustLevel {
  if (score >= TRUST_THRESHOLDS.veteran) return 'veteran';
  if (score >= TRUST_THRESHOLDS.trusted) return 'trusted';
  if (score >= TRUST_THRESHOLDS.warm) return 'warm';
  return 'cold';
}

export async function assessTrustLevel(userId: string): Promise<{ level: TrustLevel; score: number }> {
  const rows = await selectMany('nexus_trust_signals', {
    where: [{ column: 'user_id', value: userId }],
    orderBy: { column: 'created_at', ascending: false },
    limit: 50,
  });

  const signals: TrustSignalRecord[] = (rows || []) as TrustSignalRecord[];
  const score = computeTrustScore(signals);
  const level = getTrustLevel(score);

  return { level, score };
}

export async function recordTrustSignal(
  userId: string,
  signal: TrustSignal,
  value?: number,
): Promise<TrustSignalRecord> {
  const row = await insert('nexus_trust_signals', {
    user_id: userId,
    signal,
    value: value ?? null,
  });
  return row as TrustSignalRecord;
}

export function getAdviceDepthForTrust(level: TrustLevel): {
  canGiveStrategy: boolean;
  canGiveTactical: boolean;
  canGivePrescriptive: boolean;
  canGiveIntimate: boolean;
  maxAdvicePersonalization: number;
} {
  switch (level) {
    case 'veteran':
      return {
        canGiveStrategy: true,
        canGiveTactical: true,
        canGivePrescriptive: true,
        canGiveIntimate: true,
        maxAdvicePersonalization: 100,
      };
    case 'trusted':
      return {
        canGiveStrategy: true,
        canGiveTactical: true,
        canGivePrescriptive: true,
        canGiveIntimate: false,
        maxAdvicePersonalization: 80,
      };
    case 'warm':
      return {
        canGiveStrategy: true,
        canGiveTactical: true,
        canGivePrescriptive: false,
        canGiveIntimate: false,
        maxAdvicePersonalization: 50,
      };
    case 'cold':
    default:
      return {
        canGiveStrategy: true,
        canGiveTactical: false,
        canGivePrescriptive: false,
        canGiveIntimate: false,
        maxAdvicePersonalization: 20,
      };
  }
}

export { SIGNAL_WEIGHTS, TRUST_THRESHOLDS, TRUST_LEVEL_ORDER };
