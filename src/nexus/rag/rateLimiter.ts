/**
 * rateLimiter.ts — RAG content-query rate limiter (#42).
 *
 * Per-tier rate limits (#42 spec):
 *   executive_introduction:  10/day,  1/min
 *   professional:            30/day,  5/min
 *   executive:              100/day, 15/min
 *   council:                300/day, 30/min
 *   enterprise:            1000/day, 60/min
 *
 * Two sliding windows: daily + per-minute.
 *
 * Skeleton implementation: in-memory Map-based store.
 * PRODUCTION REQUIREMENT (see comments inline): replace the in-memory
 * store with a DB-backed rate limiter (e.g. nexus_rate_limit_state
 * table with user_id + window_key + count + reset_at, plus periodic
 * cleanup) — the in-memory store resets on every server restart and
 * does not coordinate across multiple API instances.
 */

import { TierKey, normalizeTier } from '@/config/tierConfig';

// ─────────────────────────────────────────────────────────────────────
//  Tier limits
// ─────────────────────────────────────────────────────────────────────

export interface TierRateLimit {
  tierKey: TierKey;
  maxPerDay: number;
  maxPerMinute: number;
}

export const TIER_RATE_LIMITS: Record<TierKey, TierRateLimit> = {
  executive_introduction: {
    tierKey: 'executive_introduction',
    maxPerDay: 10,
    maxPerMinute: 1,
  },
  professional: {
    tierKey: 'professional',
    maxPerDay: 30,
    maxPerMinute: 5,
  },
  executive: {
    tierKey: 'executive',
    maxPerDay: 100,
    maxPerMinute: 15,
  },
  council: {
    tierKey: 'council',
    maxPerDay: 300,
    maxPerMinute: 30,
  },
  enterprise: {
    tierKey: 'enterprise',
    maxPerDay: 1000,
    maxPerMinute: 60,
  },
};

// ─────────────────────────────────────────────────────────────────────
//  In-memory state (skeleton — prod: DB-backed required)
// ─────────────────────────────────────────────────────────────────────

interface WindowState {
  count: number;
  resetAt: number;
}

interface UserState {
  daily: WindowState;
  minute: WindowState;
}

/**
 * PRODUCTION: Replace with a DB-backed store:
 *   CREATE TABLE nexus_rate_limit_state (
 *     user_id       UUID NOT NULL,
 *     window_key    TEXT NOT NULL,   -- 'daily:2026-08-12' | 'minute:2026-08-12T14:35'
 *     count         INT NOT NULL DEFAULT 0,
 *     reset_at      TIMESTAMPTZ NOT NULL,
 *     updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
 *     PRIMARY KEY (user_id, window_key)
 *   );
 *
 * Use INSERT … ON CONFLICT DO UPDATE to atomically increment, and
 * run a scheduled job to prune expired rows older than 48h.
 */
const store = new Map<string, UserState>();

// ─────────────────────────────────────────────────────────────────────
//  Result types
// ─────────────────────────────────────────────────────────────────────

export interface RateLimitCheckResult {
  allowed: boolean;
  remainingDaily: number;
  remainingMinute: number;
  resetAt: {
    daily: number;
    minute: number;
  };
  reason?: string;
}

export interface RateLimitSnapshot {
  remainingDaily: number;
  remainingMinute: number;
  resetAt: {
    daily: number;
    minute: number;
  };
}

// ─────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────

function startOfDayUTC(ts: number): number {
  const d = new Date(ts);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function startOfMinuteUTC(ts: number): number {
  const d = new Date(ts);
  return Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate(),
    d.getUTCHours(),
    d.getUTCMinutes()
  );
}

function dayResetAt(now: number): number {
  return startOfDayUTC(now) + 24 * 60 * 60 * 1000;
}

function minuteResetAt(now: number): number {
  return startOfMinuteUTC(now) + 60 * 1000;
}

function getUserState(userId: string, now: number): UserState {
  let state = store.get(userId);
  const dayStart = startOfDayUTC(now);
  const minStart = startOfMinuteUTC(now);

  if (!state) {
    state = {
      daily: { count: 0, resetAt: dayResetAt(now) },
      minute: { count: 0, resetAt: minuteResetAt(now) },
    };
    store.set(userId, state);
  }

  if (state.daily.resetAt <= now || state.daily.resetAt - 24 * 60 * 60 * 1000 < dayStart) {
    state.daily = { count: 0, resetAt: dayResetAt(now) };
  }
  if (state.minute.resetAt <= now || state.minute.resetAt - 60 * 1000 < minStart) {
    state.minute = { count: 0, resetAt: minuteResetAt(now) };
  }

  return state;
}

// ─────────────────────────────────────────────────────────────────────
//  Class
// ─────────────────────────────────────────────────────────────────────

export class NexusRateLimiter {
  private store: Map<string, UserState>;

  constructor(seedStore?: Map<string, UserState>) {
    this.store = seedStore ?? store;
  }

  // ── getLimits ─────────────────────────────────────────────────────

  /**
   * Returns the configured rate limit ceiling for a tier.
   * Unknown / legacy keys are normalized to canonical; unmatched tiers
   * fall back to executive_introduction (most restrictive).
   */
  getLimits(tierKey: TierKey | string): TierRateLimit {
    const canonical = normalizeTier(tierKey);
    if (!canonical) return TIER_RATE_LIMITS.executive_introduction;
    return TIER_RATE_LIMITS[canonical];
  }

  // ── checkLimits ───────────────────────────────────────────────────

  /**
   * Returns whether the user is currently allowed to make a RAG
   * content query, WITHOUT recording the request. Use this before
   * expensive work to short-circuit.
   */
  checkLimits(
    userId: string,
    tierKey: TierKey | string
  ): { allowed: boolean; reason?: string } {
    const limits = this.getLimits(tierKey);
    const now = Date.now();
    const state = getUserStateFromMap(this.store, userId, now);

    if (state.daily.count >= limits.maxPerDay) {
      return {
        allowed: false,
        reason: `Daily RAG query limit (${limits.maxPerDay}) reached. Resets in ${msToHuman(state.daily.resetAt - now)}.`,
      };
    }
    if (state.minute.count >= limits.maxPerMinute) {
      return {
        allowed: false,
        reason: `Per-minute RAG query limit (${limits.maxPerMinute}) reached. Resets in ${msToHuman(state.minute.resetAt - now)}.`,
      };
    }
    return { allowed: true };
  }

  // ── recordRequest ─────────────────────────────────────────────────

  /**
   * Records a request (increments both windows) and returns the
   * post-increment state. If either window is already exhausted,
   * `allowed=false` is returned and no counts are incremented.
   */
  recordRequest(
    userId: string,
    tierKey: TierKey | string
  ): RateLimitCheckResult {
    const limits = this.getLimits(tierKey);
    const now = Date.now();
    const state = getUserStateFromMap(this.store, userId, now);

    if (state.daily.count >= limits.maxPerDay) {
      return {
        allowed: false,
        remainingDaily: 0,
        remainingMinute: Math.max(0, limits.maxPerMinute - state.minute.count),
        resetAt: {
          daily: state.daily.resetAt,
          minute: state.minute.resetAt,
        },
        reason: `Daily RAG query limit (${limits.maxPerDay}) reached.`,
      };
    }
    if (state.minute.count >= limits.maxPerMinute) {
      return {
        allowed: false,
        remainingDaily: Math.max(0, limits.maxPerDay - state.daily.count),
        remainingMinute: 0,
        resetAt: {
          daily: state.daily.resetAt,
          minute: state.minute.resetAt,
        },
        reason: `Per-minute RAG query limit (${limits.maxPerMinute}) reached.`,
      };
    }

    state.daily.count += 1;
    state.minute.count += 1;

    return {
      allowed: true,
      remainingDaily: Math.max(0, limits.maxPerDay - state.daily.count),
      remainingMinute: Math.max(0, limits.maxPerMinute - state.minute.count),
      resetAt: {
        daily: state.daily.resetAt,
        minute: state.minute.resetAt,
      },
    };
  }

  // ── snapshot ──────────────────────────────────────────────────────

  /**
   * Non-mutating read of a user's current rate-limit state.
   */
  snapshot(userId: string, tierKey: TierKey | string): RateLimitSnapshot {
    const limits = this.getLimits(tierKey);
    const now = Date.now();
    const state = getUserStateFromMap(this.store, userId, now);
    return {
      remainingDaily: Math.max(0, limits.maxPerDay - state.daily.count),
      remainingMinute: Math.max(0, limits.maxPerMinute - state.minute.count),
      resetAt: {
        daily: state.daily.resetAt,
        minute: state.minute.resetAt,
      },
    };
  }

  // ── reset (for tests / admin) ─────────────────────────────────────

  _resetUser(userId: string): void {
    this.store.delete(userId);
  }

  _resetAll(): void {
    this.store.clear();
  }
}

// ─────────────────────────────────────────────────────────────────────
//  Module-level helpers
// ─────────────────────────────────────────────────────────────────────

function getUserStateFromMap(
  map: Map<string, UserState>,
  userId: string,
  now: number
): UserState {
  let state = map.get(userId);
  const dayStart = startOfDayUTC(now);
  const minStart = startOfMinuteUTC(now);

  if (!state) {
    state = {
      daily: { count: 0, resetAt: dayResetAt(now) },
      minute: { count: 0, resetAt: minuteResetAt(now) },
    };
    map.set(userId, state);
    return state;
  }

  if (state.daily.resetAt <= now || state.daily.resetAt - 24 * 60 * 60 * 1000 < dayStart) {
    state.daily = { count: 0, resetAt: dayResetAt(now) };
  }
  if (state.minute.resetAt <= now || state.minute.resetAt - 60 * 1000 < minStart) {
    state.minute = { count: 0, resetAt: minuteResetAt(now) };
  }
  return state;
}

function msToHuman(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.ceil(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm > 0 ? `${h}h ${rm}m` : `${h}h`;
}
