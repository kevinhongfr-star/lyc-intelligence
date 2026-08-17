/**
 * nexusMileIntegration — NEXUS chat cost display helpers.
 *
 * Batch 2 / Ticket 6: When NEXUS recommends an assessment in chat,
 * show the mile cost inline. Format:
 *   [assessment name] — [X] miles · You have [Y] miles remaining
 * NEXUS always asks before spending miles: "Want me to run it?"
 * Miles deducted on completion (not on start).
 */

import { getInstrumentMileCost, INSTRUMENT_MILE_COST } from '@/config/miles';

export interface AssessmentRecommendation {
  instrumentCode: string;
  instrumentName: string;
  mileCost: number;
  userBalance: number;
  canAfford: boolean;
}

/**
 * Build a recommendation object from an instrument code + user balance.
 */
export function buildRecommendation(
  instrumentCode: string,
  instrumentName: string,
  userBalance: number,
): AssessmentRecommendation {
  const cost = getInstrumentMileCost(instrumentCode);
  return {
    instrumentCode,
    instrumentName,
    mileCost: cost,
    userBalance,
    canAfford: userBalance >= cost,
  };
}

/**
 * Format the inline cost string for NEXUS chat responses.
 * Example: "LEAP — 3 miles · You have 5 miles remaining"
 */
export function formatMileCostInline(rec: AssessmentRecommendation): string {
  const costStr = rec.mileCost === 0
    ? 'Free'
    : `${rec.mileCost} ${rec.mileCost === 1 ? 'mile' : 'miles'}`;
  const balanceStr = `You have ${rec.userBalance} ${rec.userBalance === 1 ? 'mile' : 'miles'} remaining`;
  return `${rec.instrumentName} — ${costStr} · ${balanceStr}`;
}

/**
 * Format the NEXUS confirmation prompt.
 */
export function formatConfirmationPrompt(rec: AssessmentRecommendation): string {
  if (!rec.canAfford) {
    const needed = rec.mileCost - rec.userBalance;
    return `You need ${needed} more ${needed === 1 ? 'mile' : 'miles'} to take ${rec.instrumentName}. Would you like to upgrade or purchase miles?`;
  }
  if (rec.mileCost === 0) {
    return `${rec.instrumentName} is available as a complimentary assessment. Want me to run it?`;
  }
  return `${rec.instrumentName} costs ${rec.mileCost} ${rec.mileCost === 1 ? 'mile' : 'miles'}. You have ${rec.userBalance} remaining. Want me to run it?`;
}

/**
 * Extract instrument codes mentioned in a NEXUS chat message.
 * Looks for known instrument codes/names in the text.
 */
export function extractAssessmentMentions(text: string): string[] {
  const knownCodes = Object.keys(INSTRUMENT_MILE_COST);
  const upper = text.toUpperCase();
  return knownCodes.filter((code) => upper.includes(code));
}

export default {
  buildRecommendation,
  formatMileCostInline,
  formatConfirmationPrompt,
  extractAssessmentMentions,
};
