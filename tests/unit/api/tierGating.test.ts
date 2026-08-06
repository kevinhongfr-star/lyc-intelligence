// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../api/_lib/supabaseRest.js', () => ({
  selectOne: vi.fn(),
  selectMany: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  countRows: vi.fn(),
  isSupabaseConfigured: vi.fn(() => true),
}));

import { selectOne } from '../../../api/_lib/supabaseRest.js';
import {
  checkTierAccess,
  requireTier,
  getUserEffectiveTier,
  TIER_ORDER,
} from '../../../api/_lib/tierGating.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('tierGating — checkTierAccess', () => {
  it('returns allowed=true when user has access to feature', () => {
    const result = checkTierAccess('pro', 'chat');
    expect(result.allowed).toBe(true);
  });

  it('returns allowed=true for council-only feature on council tier', () => {
    const result = checkTierAccess('council', 'council');
    expect(result.allowed).toBe(true);
  });

  it('returns allowed=false when user tier is too low', () => {
    const result = checkTierAccess('explorer', 'peer_matching');
    expect(result.allowed).toBe(false);
    expect(result.reason).toBeDefined();
    expect(result.requiredTier).toBeDefined();
  });

  it('returns allowed=false for unknown feature', () => {
    const result = checkTierAccess('council', 'nonexistent_feature');
    expect(result.allowed).toBe(false);
  });

  it('returns requiredTier as the minimum tier that has access', () => {
    const result = checkTierAccess('explorer', 'events');
    expect(result.allowed).toBe(false);
    expect(result.requiredTier).toBe('executive');
  });

  it('returns requiredTier for council-only feature from pro', () => {
    const result = checkTierAccess('pro', 'council');
    expect(result.allowed).toBe(false);
    expect(result.requiredTier).toBe('council');
  });

  it('starter cannot access peer_matching (requires pro+)', () => {
    const result = checkTierAccess('starter', 'peer_matching');
    expect(result.allowed).toBe(false);
    expect(result.requiredTier).toBe('pro');
  });

  it('executive cannot access council-only feature', () => {
    const result = checkTierAccess('executive', 'council');
    expect(result.allowed).toBe(false);
    expect(result.requiredTier).toBe('council');
  });

  it('council tier has access to all features', () => {
    const features = ['chat', 'assessments', 'frameworks', 'peer_matching', 'events', 'council', 'web_research', 'export_pdf', 'deliverables', 'coaching'];
    for (const feat of features) {
      const result = checkTierAccess('council', feat);
      expect(result.allowed).toBe(true);
    }
  });

  it('explorer has access only to basic features', () => {
    const allowed = ['chat', 'assessments', 'web_research'];
    const denied = ['frameworks', 'peer_matching', 'events', 'council', 'export_pdf', 'deliverables', 'coaching'];
    for (const feat of allowed) {
      expect(checkTierAccess('explorer', feat).allowed).toBe(true);
    }
    for (const feat of denied) {
      expect(checkTierAccess('explorer', feat).allowed).toBe(false);
    }
  });
});

describe('tierGating — requireTier middleware', () => {
  it('returns a middleware function', () => {
    const mw = requireTier('pro');
    expect(typeof mw).toBe('function');
  });

  it('allows access when user meets tier requirement', async () => {
    vi.mocked(selectOne).mockResolvedValue({
      id: 'user-1',
      tier: 'pro',
      stripe_subscription_status: 'active',
    });

    const mw = requireTier('starter');
    let nextCalled = false;
    const req = { user: { id: 'user-1' } };
    const res = createMockRes();

    await mw(req, res, () => { nextCalled = true });

    expect(nextCalled).toBe(true);
  });

  it('blocks access when user is below tier requirement', async () => {
    vi.mocked(selectOne).mockResolvedValue({
      id: 'user-1',
      tier: 'explorer',
      stripe_subscription_status: 'active',
    });

    const mw = requireTier('pro');
    const req = { user: { id: 'user-1' } };
    const res = createMockRes();

    await mw(req, res);

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty('requiredTier', 'pro');
  });

  it('returns 401 when no user id in request', async () => {
    const mw = requireTier('pro');
    const req = { headers: {} };
    const res = createMockRes();

    await mw(req, res);

    expect(res.statusCode).toBe(401);
  });

  it('uses x-user-id header when no user object', async () => {
    vi.mocked(selectOne).mockResolvedValue({
      id: 'header-user',
      tier: 'pro',
      stripe_subscription_status: 'active',
    });

    const mw = requireTier('pro');
    const req = { headers: { 'x-user-id': 'header-user' } };
    const res = createMockRes();

    await mw(req, res);

    expect(res.statusCode).toBe(200);
  });

  it('blocks canceled subscription users', async () => {
    vi.mocked(selectOne).mockResolvedValue({
      id: 'user-1',
      tier: 'pro',
      stripe_subscription_status: 'canceled',
    });

    const mw = requireTier('starter');
    const req = { user: { id: 'user-1' } };
    const res = createMockRes();

    await mw(req, res);

    expect(res.statusCode).toBe(403);
  });

  it('blocks past_due subscription users', async () => {
    vi.mocked(selectOne).mockResolvedValue({
      id: 'user-1',
      tier: 'pro',
      stripe_subscription_status: 'past_due',
    });

    const mw = requireTier('starter');
    const req = { user: { id: 'user-1' } };
    const res = createMockRes();

    await mw(req, res);

    expect(res.statusCode).toBe(403);
  });

  it('allows access when exactly at minimum tier', async () => {
    vi.mocked(selectOne).mockResolvedValue({
      id: 'user-1',
      tier: 'executive',
      stripe_subscription_status: 'active',
    });

    const mw = requireTier('executive');
    const req = { user: { id: 'user-1' } };
    const res = createMockRes();
    let nextCalled = false;

    await mw(req, res, () => { nextCalled = true });

    expect(nextCalled).toBe(true);
  });

  it('gracefully falls back to explorer on DB error', async () => {
    vi.mocked(selectOne).mockRejectedValue(new Error('DB error'));

    const mw = requireTier('pro');
    const req = { user: { id: 'user-1' } };
    const res = createMockRes();

    await mw(req, res);

    expect(res.statusCode).toBe(403);
  });
});

describe('tierGating — getUserEffectiveTier', () => {
  it('returns user tier when subscription is active', async () => {
    vi.mocked(selectOne).mockResolvedValue({
      id: 'user-1',
      tier: 'pro',
      stripe_subscription_status: 'active',
    });

    const tier = await getUserEffectiveTier('user-1');
    expect(tier).toBe('pro');
  });

  it('returns explorer when no profile found', async () => {
    vi.mocked(selectOne).mockResolvedValue(null);

    const tier = await getUserEffectiveTier('unknown-user');
    expect(tier).toBe('explorer');
  });

  it('returns explorer when subscription is past_due', async () => {
    vi.mocked(selectOne).mockResolvedValue({
      id: 'user-1',
      tier: 'pro',
      stripe_subscription_status: 'past_due',
    });

    const tier = await getUserEffectiveTier('user-1');
    expect(tier).toBe('explorer');
  });

  it('returns explorer when subscription is canceled', async () => {
    vi.mocked(selectOne).mockResolvedValue({
      id: 'user-1',
      tier: 'executive',
      stripe_subscription_status: 'canceled',
    });

    const tier = await getUserEffectiveTier('user-1');
    expect(tier).toBe('explorer');
  });

  it('defaults to explorer for invalid tier value', async () => {
    vi.mocked(selectOne).mockResolvedValue({
      id: 'user-1',
      tier: 'invalid_tier',
      stripe_subscription_status: 'active',
    });

    const tier = await getUserEffectiveTier('user-1');
    expect(tier).toBe('explorer');
  });

  it('returns tier when no subscription status set', async () => {
    vi.mocked(selectOne).mockResolvedValue({
      id: 'user-1',
      tier: 'starter',
      stripe_subscription_status: null,
    });

    const tier = await getUserEffectiveTier('user-1');
    expect(tier).toBe('starter');
  });

  it('returns explorer on DB error', async () => {
    vi.mocked(selectOne).mockRejectedValue(new Error('DB error'));

    const tier = await getUserEffectiveTier('user-1');
    expect(tier).toBe('explorer');
  });
});

describe('tierGating — TIER_ORDER export', () => {
  it('exports the correct tier ranking', () => {
    expect(TIER_ORDER).toEqual(['explorer', 'starter', 'pro', 'executive', 'council']);
  });
});

// ─── Helpers ──────────────────────────────────────────────────────

function createMockRes() {
  const res: any = {
    statusCode: 200,
    body: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: unknown) {
      this.body = data;
      return this;
    },
  };
  return res;
}