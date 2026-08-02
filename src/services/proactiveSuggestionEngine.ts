/**
 * N5 Proactive Suggestion Engine
 *
 * 6 recommendation models aggregate signal into scored suggestions delivered via:
 *  - in-session chips (NexusChat SuggestedPrompts)
 *  - bell + push notifications
 *  - D46 Weekly / D47 scheduled emails
 */

import { INTENTS } from './intentRouter';

export type SuggestionCategory = 'next_action' | 'recommendation' | 'proactive_alert' | 'upsell';
export type SuggestionSurface =
  | 'consultant'
  | 'bd_manager'
  | 'candidate'
  | 'council'
  | 'client_admin'
  | 'team_lead'
  | 'admin';

export interface Suggestion {
  id: string;
  category: SuggestionCategory;
  title: string;
  body: string;
  reason: string;
  cta: string;
  targetRoute?: string;
  intentId?: string;
  params?: Record<string, unknown>;
  score: number;
  surface: SuggestionSurface[];
  tierRequired: 'free' | 'core' | 'premium' | 'staff';
  creditCost: number;
  expiresAt?: string;
  source: string;
  weight: number;
}

interface SignalInput {
  role: string;
  icp?: string;
  tier: 'free' | 'core' | 'premium' | 'staff';
  slaBreaches24h: { type: string; label: string; hoursLeft: number }[];
  newCandidatesAbove: { id: string; name: string; match: number; mandateId: string }[];
  stageSilentMandates: { id: string; title: string; daysSilent: number }[];
  partialAssessments: { id: string; instrument: string; pct: number }[];
  openActions: { id: string; label: string; dueInDays: number }[];
  nexusChatTopics: string[];
}

/**
 * N5 aggregate all models into scored + sorted
 */
export function generateSuggestions(input: SignalInput, limit = 6): Suggestion[] {
  const out: Suggestion[] = [];
  const now = Date.now();

  // Model 1: SLA Proximity
  for (const sla of input.slaBreaches24h || []) {
    out.push({
      id: `sla_${sla.type}_${now}`,
      category: 'next_action',
      title: `SLA: ${sla.label} — ${sla.hoursLeft}h left`,
      body: `Act now before SLA breach.`,
      reason: `T-${sla.hoursLeft}h to SLA deadline.`,
      cta: `Resolve`,
      score: Math.min(1, 0.8 + (24 - sla.hoursLeft) / 48),
      surface: ['consultant', 'team_lead', 'bd_manager'],
      tierRequired: 'core',
      creditCost: 0,
      source: 'SLA Proximity',
      weight: 1.2,
    });
  }

  // Model 2: New ≥ 0.9 match
  for (const c of input.newCandidatesAbove || []) {
    out.push({
      id: `match_${c.id}_${now}`,
      category: 'proactive_alert',
      title: `New candidate: ${c.name} — ${Math.round(c.match * 100)}% for mandate ${c.mandateId}`,
      body: `Candidate scored highly on your mandate.`,
      reason: `Auto-matcher ≥ 85% score`,
      cta: `View`,
      targetRoute: `/app/candidates/${c.id}`,
      intentId: 'candidate_lookup',
      params: { mandateId: c.mandateId },
      score: 0.75 + c.match * 0.2,
      surface: ['consultant', 'bd_manager'],
      tierRequired: 'core',
      creditCost: 2,
      source: 'Signal Matcher v3',
      weight: 0.9,
    });
  }

  // Model 3: Mandate silent (> 14 days)
  for (const m of input.stageSilentMandates || []) {
    out.push({
      id: `silent_${m.id}_${now}`,
      category: 'next_action',
      title: `Mandate ${m.title} silent ${m.daysSilent}d`,
      body: `No activity for ${m.daysSilent} days — suggest follow-up draft.`,
      reason: `Mandate velocity risk: ${m.daysSilent}d > 14d threshold`,
      cta: `Draft update`,
      intentId: 'document_generate',
      score: 0.7 + Math.min(0.2, m.daysSilent / 100),
      surface: ['consultant', 'bd_manager', 'team_lead'],
      tierRequired: 'core',
      creditCost: 0,
      source: 'Mandate Velocity',
      weight: 1.1,
    });
  }

  // Model 4: Partial assessments → upsell
  for (const a of input.partialAssessments || []) {
    if (a.pct > 0 && a.pct < 100) {
      out.push({
        id: `assess_${a.id}_${now}`,
        category: 'upsell',
        title: `Finish ${a.instrument} — ${Math.round(a.pct)}% complete`,
        body: `You are ${Math.round(a.pct)}% through ${a.instrument} assessment.`,
        reason: `Partial → recommend full unlock`,
        cta: `Continue`,
        tierRequired: 'premium',
        creditCost: Math.max(0, 15 - Math.round(a.pct)),
        score: 0.65 + a.pct * 0.002,
        surface: ['candidate', 'client_admin'],
        source: 'Assessment Unlock',
        weight: 0.8,
      });
    }
  }

  // Model 5: Next actions due soon
  for (const a of input.openActions || []) {
    out.push({
      id: `action_${a.id}_${now}`,
      category: 'next_action',
      title: a.label,
      body: `Action item due in ${a.dueInDays}d.`,
      reason: `Due in ${a.dueInDays}d`,
      cta: `Open`,
      score: Math.min(1, 0.7 + (7 - a.dueInDays) / 14),
      surface: ['consultant', 'candidate', 'bd_manager'],
      tierRequired: 'free',
      creditCost: 0,
      source: 'Action Queue',
      weight: 1.0,
    });
  }

  // Model 6: Career path from nexus topics
  const topics = (input.nexusChatTopics || []).join(' ').toLowerCase();
  if (/career|transition|move|offer/i.test(topics)) {
    out.push({
      id: `career_${now}`,
      category: 'recommendation',
      title: `3 career insights matched`,
      body: `Content tailored to your recent nexus chats.`,
      reason: `Topics detected: "${
        input.nexusChatTopics?.slice(0, 3).join(', ') || 'career-related chat history'
      }"`,
      cta: `See more`,
      intentId: 'career_advice',
      score: 0.7,
      surface: ['candidate', 'council'],
      tierRequired: 'premium',
      creditCost: 8,
      source: 'Career Path Infer',
      weight: 0.85,
    });
  }

  // Weight, dedupe by surface
  const TIER: Record<string, number> = { staff: 0, premium: 1, core: 2, free: 3 };
  const weighted = out
    .filter(
      (s) =>
        TIER[input.tier] <= TIER[s.tierRequired] ||
        input.tier === 'staff'
    )
    .map((s) => ({ ...s, score: s.score * s.weight }))
    .sort((a, b) => b.score - a.score);

  return weighted.slice(0, limit);
}

/**
 * Delivery classifier for SuggestedPrompts chips
 */
export function pickInSessionChips(
  sugs: Suggestion[],
  max = 4
): {
  id: string;
  label: string;
  cta: string;
  intentId?: string;
  params?: Record<string, unknown>;
}[] {
  return sugs
    .filter((s) => s.score >= 0.75)
    .slice(0, max)
    .map((s) => ({
      id: s.id,
      label: s.title.length > 50 ? s.title.slice(0, 48) + '…' : s.title,
      cta: s.cta,
      intentId: s.intentId,
      params: s.params,
    }));
}

/**
 * Push candidates for push threshold: ≥ 0.90
 */
export function pickPushNotif(sugs: Suggestion[]): Suggestion[] {
  return sugs.filter((s) => s.score >= 0.9 && s.category !== 'upsell');
}

export default {
  generateSuggestions,
  pickInSessionChips,
  pickPushNotif,
  INTENT_MAP: INTENTS.reduce(
    (acc, i) => ({ ...acc, [i.id]: i }),
    {} as Record<string, (typeof INTENTS)[number]>
  ),
};
