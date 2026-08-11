/**
 * nexusMilesService — Miles earning driver for NEXUS chat (Phase 15.4, ticket 4).
 *
 * Three earning actions:
 *   framework_exploration:  +5 mi  — deep framework dive session
 *   reflection_prompt:      +3 mi  — user completes a guided reflection
 *   assessment_completion:  +10 mi — one-time refund per instrument
 *
 * Explorer / Executive Introduction tier NEVER earns (tierAllowsEarning guard).
 * One-time-per-instrument refund is de-duped via local + server sub-key check.
 */
import { v1Client } from '@/hooks/v1/v1Client';
import {
  NEXUS_MILES_EARNING,
  MilesEarningActionKey,
  tierAllowsEarning,
} from '@/nexus/nexusKnowledge';

export interface NexusMilesEarningResult {
  earned: boolean;
  amount: number;
  newBalance: number;
  message: string;
  skipped?: string;
  action: MilesEarningActionKey;
}

const ONE_TIME_KEY_PREFIX = 'nexus_earn_once:';

/**
 * Local (optimistic) one-time-per-subkey check. Server is source of truth for
 * true idempotency — this prevents UI double-claims while waiting for API.
 */
function checkLocalOnce(key: string): boolean {
  try {
    return localStorage.getItem(`${ONE_TIME_KEY_PREFIX}${key}`) === '1';
  } catch {
    return false;
  }
}
function markLocalOnce(key: string) {
  try {
    localStorage.setItem(`${ONE_TIME_KEY_PREFIX}${key}`, '1');
  } catch {
    /* ignore */
  }
}

export async function earnNexusMiles(
  action: MilesEarningActionKey,
  opts: {
    /** Required for assessment_completion_refund — instrument code (CPI, LEAP, …) */
    instrumentCode?: string;
    /** Session identifier for reflection / exploration deduplication per session */
    sessionId?: string;
    /** Current user tier key. Earning is skipped for Explorer / Executive Introduction tiers. */
    tierKey?: string | null;
    /** If true, don't actually call API — returns optimistic result (demo mode). */
    optimisticOnly?: boolean;
  } = {},
): Promise<NexusMilesEarningResult> {
  const cfg = NEXUS_MILES_EARNING[action];
  if (!cfg) {
    return {
      earned: false,
      amount: 0,
      newBalance: 0,
      message: 'Unknown earning action',
      action,
    };
  }

  // Explorer / Executive Introduction: never earn
  if (!tierAllowsEarning(opts.tierKey)) {
    return {
      earned: false,
      amount: 0,
      newBalance: 0,
      skipped: 'Executive Introduction tier does not earn miles',
      message: cfg.description,
      action,
    };
  }

  // One-time-per-subkey de-duplication (assessment_completion_refund uses instrument)
  let subKey: string | null = null;
  if (cfg.oneTimePerSubKey) {
    if (action === 'assessment_completion_refund') {
      subKey = opts.instrumentCode ? `instr:${opts.instrumentCode}` : null;
    } else if (opts.sessionId) {
      subKey = `session:${opts.sessionId}:${action}`;
    }
    if (subKey && checkLocalOnce(subKey)) {
      return {
        earned: false,
        amount: 0,
        newBalance: 0,
        skipped: 'Already claimed',
        message: cfg.description,
        action,
      };
    }
  }

  const payload: any = {
    event_type: cfg.eventType,
    amount: cfg.amount,
    description: cfg.description,
    action_key: action,
  };
  if (subKey) payload.sub_key = subKey;
  if (opts.instrumentCode) payload.instrument_code = opts.instrumentCode;
  if (opts.sessionId) payload.session_id = opts.sessionId;

  if (opts.optimisticOnly) {
    if (subKey) markLocalOnce(subKey);
    return {
      earned: true,
      amount: cfg.amount,
      newBalance: cfg.amount,
      message: `+${cfg.amount} mi · ${cfg.description}`,
      action,
    };
  }

  try {
    const result = (await v1Client.post('/billing/miles/earn', payload)) as any;
    if (subKey) markLocalOnce(subKey);
    const newBalance =
      typeof result?.new_balance === 'number'
        ? result.new_balance
        : typeof result?.data?.new_balance === 'number'
          ? result.data.new_balance
          : 0;
    return {
      earned: true,
      amount: cfg.amount,
      newBalance,
      message: `+${cfg.amount} mi · ${cfg.description}`,
      action,
    };
  } catch (e) {
    console.error('[nexusMilesService] earnNexusMiles error:', e);
    // Still mark local once — server will enforce idempotency on retry and
    // the user gets the optimistic UX.
    if (subKey) markLocalOnce(subKey);
    return {
      earned: false,
      amount: 0,
      newBalance: 0,
      message: cfg.description,
      skipped: 'Offline — miles will be credited on next sync',
      action,
    };
  }
}

/**
 * Detect framework-exploration session heuristics.
 * Caller invokes after every user turn; we count substantive turns and award
 * once the threshold of "deep dive" conversation is met.
 */
export class ExplorationEarningTracker {
  private turnCount = 0;
  private sessionId: string | null;
  private awardedThisSession = false;
  /** Threshold of turns that makes a "deep framework exploration" session. */
  static THRESHOLD_TURNS = 6;

  constructor(sessionId: string | null = null) {
    this.sessionId = sessionId;
    // Restore session state so reloads don't award twice
    if (sessionId) {
      const marker = `nexus_exploration_awarded:${sessionId}`;
      try {
        if (localStorage.getItem(marker) === '1') this.awardedThisSession = true;
      } catch {
        /* ignore */
      }
    }
  }

  /**
   * Count a substantive user turn. Returns true IF the earning threshold has
   * just been reached this call AND not already awarded.
   * Caller decides whether to actually call earnNexusMiles() based on this.
   */
  countTurn(userMessage: string): boolean {
    if (this.awardedThisSession) return false;
    const len = (userMessage || '').trim().length;
    if (len < 20) return false; // ignore short inputs
    this.turnCount += 1;
    if (this.turnCount >= ExplorationEarningTracker.THRESHOLD_TURNS) {
      this.awardedThisSession = true;
      if (this.sessionId) {
        try {
          localStorage.setItem(`nexus_exploration_awarded:${this.sessionId}`, '1');
        } catch {
          /* ignore */
        }
      }
      return true;
    }
    return false;
  }
}

/**
 * Reflection completion heuristics.
 * Simple heuristic: 60+ word answer to a prompt NEXUS framed as a guided
 * reflection. Caller sets the "expected reflection mode" flag based on the
 * previous assistant response content.
 */
export function isCompletedReflection(userMessage: string, expectedReflectionMode: boolean): boolean {
  if (!expectedReflectionMode) return false;
  const words = (userMessage || '').trim().split(/\s+/).filter(Boolean).length;
  return words >= 40;
}
