/**
 * engine.ts — Proactive Suggestion Engine (#43).
 *
 * State machine: DETECT → EVALUATE → CHECK_COOLDOWN → FORMAT → DELIVER → LOG.
 *
 * 7 trigger types:
 *   post_assessment        — immediately after completing any diagnostic
 *   inactivity_streak      — user has not asked NEXUS anything for ≥ N days
 *   new_content_available  — new RAG library content matches user's focus
 *   new_capability         — a new platform capability matches user context
 *   goal_progress_milestone— semantic memory goal reaches a progress threshold
 *   miles_low              — miles balance below tier floor + upcoming billing
 *   repeat_question        — user asks variant of same question ≥ 3 times
 *
 * Anti-spam rules (antiSpamAllowsDelivery checks):
 *   • Max 1 recommendation per user per 6-hour window
 *   • Max 2/day  for Executive Introduction (entry tier)
 *   • Max 4/day  for Professional
 *   • Max 7/day  for Executive
 *   • Max 15/day for Council / Enterprise
 */

import { TierKey, TIER_META, tierMeets, normalizeTier } from '@/config/tierConfig';

// ─────────────────────────────────────────────────────────────────────
//  Trigger enum + types
// ─────────────────────────────────────────────────────────────────────

export const RECOMMENDATION_TRIGGER_TYPES = [
  'post_assessment',
  'inactivity_streak',
  'new_content_available',
  'new_capability',
  'goal_progress_milestone',
  'miles_low',
  'repeat_question',
] as const;

export type RecommendationTriggerType = (typeof RECOMMENDATION_TRIGGER_TYPES)[number];

export const RECOMMENDATION_STATUS = [
  'pending',
  'delivered',
  'dismissed',
  'actioned',
] as const;

export type RecommendationStatus = (typeof RECOMMENDATION_STATUS)[number];

// ── Detection context ───────────────────────────────────────────────

export interface UserTierContext {
  user_id: string;
  tierKey: TierKey | string;
  miles_balance?: number;
}

export interface InteractionsLogContext {
  lastQuestionDays?: number;
  lastAssessmentDays?: number;
  recentQuestions?: Array<{ text: string; at_days_ago: number }>;
  recentDeliveriesDaysAgo?: number[];
  deliveriesPast24h?: number;
}

export interface SemanticContext {
  goals?: Array<{ id: string; slug: string; progress: number; title: string }>;
  focus_areas?: string[];
  common_questions?: string[];
}

export interface DiagnosticsContext {
  completedSlugs?: string[];
  lastCompletedSlug?: string;
  lastCompletedAtDays?: number;
}

export interface MilesContext {
  current_balance?: number;
  next_billing_days?: number;
  monthly_allocation?: number;
}

export interface RecommendationContext {
  user: UserTierContext;
  lastRecommendations: PastRecommendation[];
  semantic?: SemanticContext;
  diagnostics?: DiagnosticsContext;
  miles?: MilesContext;
  interactionsLog: InteractionsLogContext;
}

// ── Trigger pipeline types ──────────────────────────────────────────

export interface RawTrigger {
  trigger_type: RecommendationTriggerType;
  rawScore: number;
  evidence: Record<string, unknown>;
}

export interface RankedTrigger extends RawTrigger {
  relevanceScore: number;
}

export interface FormattedRecommendation {
  trigger_type: RecommendationTriggerType;
  headline: string;
  recommendation: string;
  related_content_id?: string;
  related_diagnostic_slug?: string;
  context_payload: Record<string, unknown>;
  relevanceScore: number;
}

export interface PastRecommendation {
  id: string;
  trigger_type: RecommendationTriggerType;
  status: RecommendationStatus;
  created_at: number;
  delivered_at?: number;
}

export interface CooldownState {
  [trigger_type: string]: {
    last_fired_at: number;
    next_allowed_at: number;
    cooldown_hours: number;
  };
}

export interface DeliveryResult {
  success: boolean;
  recommendation?: FormattedRecommendation;
  reason?: string;
  recorded_at?: number;
}

// ─────────────────────────────────────────────────────────────────────
//  Anti-spam thresholds
// ─────────────────────────────────────────────────────────────────────

const MIN_HOURS_BETWEEN_DELIVERIES = 6;

const MAX_DAILY_DELIVERIES_BY_TIER: Record<TierKey, number> = {
  executive_introduction: 2,
  professional: 4,
  executive: 7,
  council: 15,
  enterprise: 15,
};

const DEFAULT_COOLDOWN_HOURS_BY_TRIGGER: Record<RecommendationTriggerType, number> = {
  post_assessment: 48,
  inactivity_streak: 72,
  new_content_available: 24,
  new_capability: 72,
  goal_progress_milestone: 48,
  miles_low: 48,
  repeat_question: 24,
};

// ─────────────────────────────────────────────────────────────────────
//  Class: ProactiveRecommendationEngine
// ─────────────────────────────────────────────────────────────────────

export class ProactiveRecommendationEngine {
  private now: () => number;

  constructor(nowFn?: () => number) {
    this.now = nowFn ?? (() => Date.now());
  }

  // ══════════════════════════════════════════════════════════════════
  //  PIPELINE — orchestrate the full state machine
  // ══════════════════════════════════════════════════════════════════

  runPipeline(
    context: RecommendationContext,
    cooldownState: CooldownState
  ): DeliveryResult {
    // 1. DETECT
    const raw = this.detectTriggers(context);
    if (raw.length === 0) {
      return { success: false, reason: 'No triggers detected' };
    }

    // 2. EVALUATE (score + filter <0.2)
    const ranked = this.evaluateTriggers(raw, context);
    if (ranked.length === 0) {
      return { success: false, reason: 'No triggers scored ≥ 0.2' };
    }

    // 3. CHECK_COOLDOWN (trigger-type cooldowns)
    const afterCooldown = this.checkCooldowns(ranked, cooldownState);
    if (afterCooldown.length === 0) {
      return { success: false, reason: 'All triggers in cooldown' };
    }

    // Anti-spam: global frequency caps
    const spamCheck = this.antiSpamAllowsDelivery(context);
    if (!spamCheck.allowed) {
      return { success: false, reason: spamCheck.reason };
    }

    // 4. FORMAT — pick top-1 trigger after anti-spam
    const top = afterCooldown[0];
    const formatted = this.formatTrigger(top, context);

    // 5. DELIVER
    const cooldownH = DEFAULT_COOLDOWN_HOURS_BY_TRIGGER[top.trigger_type];
    const delivered = this.deliver(formatted, context.user.user_id, cooldownH, cooldownState);

    // 6. LOG is implicit in deliver() updating cooldownState + context.lastRecommendations
    return delivered;
  }

  // ══════════════════════════════════════════════════════════════════
  //  STEP 1: DETECT — raw triggers from context signals
  // ══════════════════════════════════════════════════════════════════

  detectTriggers(context: RecommendationContext): RawTrigger[] {
    const triggers: RawTrigger[] = [];
    const { diagnostics, interactionsLog, semantic, miles } = context;

    // ── post_assessment ────────────────────────────────────────────
    if (
      diagnostics?.lastCompletedSlug &&
      (diagnostics.lastCompletedAtDays ?? Infinity) <= 1
    ) {
      triggers.push({
        trigger_type: 'post_assessment',
        rawScore: 0.9,
        evidence: {
          slug: diagnostics.lastCompletedSlug,
          days_ago: diagnostics.lastCompletedAtDays,
        },
      });
    }

    // ── inactivity_streak ──────────────────────────────────────────
    const lastQ = interactionsLog.lastQuestionDays ?? Infinity;
    const lastA = interactionsLog.lastAssessmentDays ?? Infinity;
    const longestInactivity = Math.min(lastQ, lastA);
    if (longestInactivity >= 7) {
      triggers.push({
        trigger_type: 'inactivity_streak',
        rawScore: longestInactivity >= 21 ? 0.95 : longestInactivity >= 14 ? 0.8 : 0.6,
        evidence: { days_inactive: longestInactivity },
      });
    }

    // ── new_content_available ──────────────────────────────────────
    // Production: check if content added since last visit matches user focus.
    // Skeleton: if we have focus areas AND the context indicates new content exists.
    const hasFocusAreas = semantic?.focus_areas && semantic.focus_areas.length > 0;
    if (hasFocusAreas) {
      triggers.push({
        trigger_type: 'new_content_available',
        rawScore: 0.4,
        evidence: {
          focus_areas: semantic!.focus_areas,
        },
      });
    }

    // ── new_capability ─────────────────────────────────────────────
    // Skeleton: the presence of a user-level up-eligibility check signals it.
    // (Production: platform capability release flags + user fit matcher.)
    if (context.lastRecommendations.length === 0 && diagnostics?.completedSlugs?.length) {
      triggers.push({
        trigger_type: 'new_capability',
        rawScore: 0.35,
        evidence: { completed_count: diagnostics.completedSlugs.length },
      });
    }

    // ── goal_progress_milestone ────────────────────────────────────
    const goalsNearMilestone =
      semantic?.goals?.filter(
        (g) => g.progress >= 0.5 && g.progress < 1.0
      ) ?? [];
    if (goalsNearMilestone.length > 0) {
      const maxProgress = Math.max(...goalsNearMilestone.map((g) => g.progress));
      triggers.push({
        trigger_type: 'goal_progress_milestone',
        rawScore: maxProgress >= 0.85 ? 0.9 : maxProgress >= 0.7 ? 0.7 : 0.5,
        evidence: {
          milestone_goals: goalsNearMilestone.map((g) => g.id),
          max_progress: maxProgress,
        },
      });
    }

    // ── miles_low ──────────────────────────────────────────────────
    if (miles?.current_balance !== undefined && miles?.monthly_allocation) {
      const pctRemaining = miles.current_balance / Math.max(1, miles.monthly_allocation);
      const billingSoon = (miles.next_billing_days ?? Infinity) <= 7;
      if (pctRemaining <= 0.1 || (pctRemaining <= 0.25 && billingSoon)) {
        triggers.push({
          trigger_type: 'miles_low',
          rawScore: pctRemaining <= 0.05 ? 0.95 : 0.7,
          evidence: {
            balance: miles.current_balance,
            allocation: miles.monthly_allocation,
            pct_remaining: pctRemaining,
            billing_in_days: miles.next_billing_days,
          },
        });
      }
    }

    // ── repeat_question ────────────────────────────────────────────
    if (
      interactionsLog.recentQuestions &&
      interactionsLog.recentQuestions.length >= 3
    ) {
      const cluster = this._clusterSimilarQuestions(interactionsLog.recentQuestions);
      if (cluster.maxClusterSize >= 3) {
        triggers.push({
          trigger_type: 'repeat_question',
          rawScore: cluster.maxClusterSize >= 5 ? 0.9 : 0.6,
          evidence: {
            cluster_size: cluster.maxClusterSize,
            sample_question: cluster.sampleText,
          },
        });
      }
    }

    return triggers;
  }

  // ══════════════════════════════════════════════════════════════════
  //  STEP 2: EVALUATE — score 0.0-1.0, filter < 0.2
  // ══════════════════════════════════════════════════════════════════

  evaluateTriggers(
    triggers: RawTrigger[],
    context: RecommendationContext
  ): RankedTrigger[] {
    const { diagnostics, miles, semantic } = context;

    const ranked = triggers.map((t): RankedTrigger => {
      let score = t.rawScore;

      // ── Tier-boost: higher tiers get higher baseline scores
      //    (proactive recommendations are a premium feature).
      const canonicalTier = normalizeTier(context.user.tierKey);
      if (canonicalTier) {
        const tierOrder = TIER_META[canonicalTier]?.order ?? 1;
        score = score * (0.8 + tierOrder * 0.05); // 0.85 → 1.05 multiplier
      }

      // ── Trigger-specific adjustments
      switch (t.trigger_type) {
        case 'post_assessment': {
          const slug = (t.evidence.slug as string)?.toUpperCase();
          const hasMoreCompleted = (diagnostics?.completedSlugs?.length ?? 0) >= 2;
          if (slug === 'CPI' || slug === 'DRIVE') score *= 1.1;
          if (hasMoreCompleted) score *= 1.05;
          break;
        }
        case 'miles_low': {
          if (miles?.current_balance === 0) score *= 1.1;
          break;
        }
        case 'goal_progress_milestone': {
          const maxP = (t.evidence.max_progress as number) ?? 0;
          if (maxP >= 0.9) score *= 1.15;
          break;
        }
        case 'repeat_question': {
          const size = (t.evidence.cluster_size as number) ?? 0;
          if (size >= 4) score *= 1.1;
          break;
        }
        case 'inactivity_streak': {
          const d = (t.evidence.days_inactive as number) ?? 0;
          if (d >= 30) score *= 1.1;
          break;
        }
        case 'new_content_available': {
          const focusCount = (semantic?.focus_areas?.length ?? 0);
          if (focusCount >= 3) score *= 1.1;
          break;
        }
        case 'new_capability': {
          // Only meaningful for users with substantial engagement history.
          const n = (t.evidence.completed_count as number) ?? 0;
          if (n < 2) score *= 0.6;
          break;
        }
      }

      // Clamp to [0, 1]
      score = Math.max(0, Math.min(1, score));

      return { ...t, relevanceScore: Number(score.toFixed(3)) };
    });

    return ranked
      .filter((t) => t.relevanceScore >= 0.2)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  // ══════════════════════════════════════════════════════════════════
  //  STEP 3: CHECK_COOLDOWN — strip any trigger where next_allowed_at > now
  // ══════════════════════════════════════════════════════════════════

  checkCooldowns(
    rankedTriggers: RankedTrigger[],
    cooldownState: CooldownState
  ): RankedTrigger[] {
    const now = this.now();
    return rankedTriggers.filter((t) => {
      const cd = cooldownState[t.trigger_type];
      if (!cd) return true;
      return cd.next_allowed_at <= now;
    });
  }

  // ══════════════════════════════════════════════════════════════════
  //  STEP 4: FORMAT — generate recommendation copy
  // ══════════════════════════════════════════════════════════════════

  formatTrigger(
    trigger: RankedTrigger,
    context: RecommendationContext
  ): FormattedRecommendation {
    const { trigger_type, evidence, relevanceScore } = trigger;

    const base: FormattedRecommendation = {
      trigger_type,
      headline: '',
      recommendation: '',
      context_payload: evidence,
      relevanceScore,
    };

    switch (trigger_type) {
      case 'post_assessment': {
        const slug = (evidence.slug as string) ?? '';
        base.headline = `Your ${slug.toUpperCase()} results are ready — what's next?`;
        base.recommendation =
          `Now that you've completed ${slug.toUpperCase()}, the next step is to anchor the results in a concrete 90-day experiment. Most executives stop at the report — the value comes from running one focused experiment per band. Would you like to explore the follow-up frameworks for your top two dimensions?`;
        base.related_diagnostic_slug = slug;
        break;
      }
      case 'inactivity_streak': {
        const d = (evidence.days_inactive as number) ?? 7;
        base.headline = `It's been ${d} days — want a quick progress check-in?`;
        base.recommendation =
          `We haven't connected in a little while. Whatever has shifted in that time — a new stakeholder, a partnership conversation, a decision on the table — a 5-minute structured check-in can surface the blind spots before they compound. Want to pick up where we left off?`;
        break;
      }
      case 'new_content_available': {
        const focus = (evidence.focus_areas as string[]) ?? [];
        const focusStr = focus.slice(0, 2).join(', ');
        base.headline = `New reading on ${focusStr || 'your focus areas'} is in the library`;
        base.recommendation =
          `There's new content in the Content Library that maps to your current focus. One of the articles breaks down a pattern we've seen across three recent executive placements — the exact scenario you were navigating last month.`;
        break;
      }
      case 'new_capability': {
        base.headline = 'A new NEXUS capability matches your profile';
        base.recommendation =
          `Based on the assessments you've completed, there's a new NEXUS capability that's now available for your tier — one that connects your ${(evidence.completed_count as number) ?? 0} completed frameworks into a single integrated development map.`;
        break;
      }
      case 'goal_progress_milestone': {
        const maxP = Math.round(((evidence.max_progress as number) ?? 0) * 100);
        base.headline = `You're at ${maxP}% on a key goal — the final push matters`;
        base.recommendation =
          `One of your tracked goals is at ${maxP}% progress. Statistically, this is where most goals stall — not for lack of effort, but because the final 20% needs a different strategy than the first 80%. Want to map the three concrete moves that get you across the line?`;
        break;
      }
      case 'miles_low': {
        const bal = (evidence.balance as number) ?? 0;
        base.headline = bal === 0
          ? 'Your miles balance is empty — here is how to refill'
          : `Your miles balance (${bal} mi) is running low`;
        base.recommendation = bal === 0
          ? `Your miles balance is currently empty. You can earn miles by completing a guided framework exploration or a reflection session, or by upgrading your tier for a monthly allocation. Which path makes more sense right now?`
          : `You have ${bal} miles remaining, and your next billing refill is in ${(evidence.billing_in_days as number) ?? 'a few'} days. Now would be a good time to run any framework exploration or follow-up diagnostic you've been considering before the month closes out.`;
        break;
      }
      case 'repeat_question': {
        const sample = (evidence.sample_question as string) ?? '';
        const size = (evidence.cluster_size as number) ?? 3;
        base.headline = `You've asked variants of this ${size} times — let's resolve it properly`;
        base.recommendation =
          `Pattern: you've returned to a similar question ${size} times now. That usually means the underlying issue is one layer deeper than the question itself. The right move is not another answer — it's a structured diagnostic that isolates the real friction point. Want to walk through it?`;
        if (sample) base.context_payload.sample_question = sample;
        break;
      }
    }

    return base;
  }

  // ══════════════════════════════════════════════════════════════════
  //  STEP 5: DELIVER — mark delivered, set cooldown (in-memory)
  // ══════════════════════════════════════════════════════════════════

  deliver(
    formatted: FormattedRecommendation,
    userId: string,
    cooldownHours: number,
    cooldownState: CooldownState
  ): DeliveryResult {
    const now = this.now();
    cooldownState[formatted.trigger_type] = {
      last_fired_at: now,
      next_allowed_at: now + cooldownHours * 60 * 60 * 1000,
      cooldown_hours: cooldownHours,
    };

    return {
      success: true,
      recommendation: formatted,
      recorded_at: now,
    };
  }

  // ══════════════════════════════════════════════════════════════════
  //  Anti-spam rules
  // ══════════════════════════════════════════════════════════════════

  antiSpamAllowsDelivery(context: RecommendationContext): {
    allowed: boolean;
    reason?: string;
  } {
    const now = this.now();
    const deliveries = context.lastRecommendations.filter(
      (r) => r.status === 'delivered' || r.status === 'actioned'
    );

    // 1. Max 1 per 6 hours
    const sixHoursAgo = now - MIN_HOURS_BETWEEN_DELIVERIES * 60 * 60 * 1000;
    const recent = deliveries.filter((d) => (d.delivered_at ?? d.created_at) > sixHoursAgo);
    if (recent.length > 0) {
      const last = recent[recent.length - 1];
      const lastAt = last.delivered_at ?? last.created_at;
      const hoursLeft = Math.ceil((MIN_HOURS_BETWEEN_DELIVERIES * 60 * 60 * 1000 - (now - lastAt)) / 3600000);
      return {
        allowed: false,
        reason: `Anti-spam: only 1 recommendation per 6h. Next allowed in ~${hoursLeft}h.`,
      };
    }

    // 2. Daily caps by tier
    const canonical = normalizeTier(context.user.tierKey);
    const dailyCap = canonical
      ? MAX_DAILY_DELIVERIES_BY_TIER[canonical]
      : MAX_DAILY_DELIVERIES_BY_TIER.executive_introduction;
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const todayCount = deliveries.filter(
      (d) => (d.delivered_at ?? d.created_at) > dayAgo
    ).length;
    if (todayCount >= dailyCap) {
      const tierName = canonical ? TIER_META[canonical].displayName : 'entry tier';
      return {
        allowed: false,
        reason: `Anti-spam: ${tierName} cap of ${dailyCap} recommendations/day reached (${todayCount} delivered).`,
      };
    }

    return { allowed: true };
  }

  // ══════════════════════════════════════════════════════════════════
  //  Internal helpers
  // ══════════════════════════════════════════════════════════════════

  /**
   * Naive question-clustering for repeat_question detection.
   * Returns the largest cluster size + a sample text from it.
   * Production: replace with Jaccard over token shingles + threshold.
   */
  private _clusterSimilarQuestions(
    questions: Array<{ text: string; at_days_ago: number }>
  ): { maxClusterSize: number; sampleText: string } {
    if (questions.length === 0) return { maxClusterSize: 0, sampleText: '' };

    const texts = questions.map((q) => q.text.toLowerCase().replace(/[^a-z0-9\s]/g, ' '));
    const tokensList = texts.map((t) => new Set(t.split(/\s+/).filter((w) => w.length >= 3)));

    const visited = new Set<number>();
    let maxSize = 0;
    let sampleIdx = 0;

    for (let i = 0; i < tokensList.length; i++) {
      if (visited.has(i)) continue;
      let size = 1;
      visited.add(i);
      for (let j = i + 1; j < tokensList.length; j++) {
        if (visited.has(j)) continue;
        const a = tokensList[i];
        const b = tokensList[j];
        if (a.size === 0 || b.size === 0) continue;
        let inter = 0;
        for (const tok of a) if (b.has(tok)) inter++;
        const union = a.size + b.size - inter;
        const jaccard = inter / Math.max(1, union);
        if (jaccard >= 0.35) {
          visited.add(j);
          size++;
        }
      }
      if (size > maxSize) {
        maxSize = size;
        sampleIdx = i;
      }
    }

    return {
      maxClusterSize: maxSize,
      sampleText: questions[sampleIdx].text,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────
//  Convenience export
// ─────────────────────────────────────────────────────────────────────

export {
  MAX_DAILY_DELIVERIES_BY_TIER,
  MIN_HOURS_BETWEEN_DELIVERIES,
  DEFAULT_COOLDOWN_HOURS_BY_TRIGGER,
};
