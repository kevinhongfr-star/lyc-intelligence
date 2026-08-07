// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../../api/_lib/supabaseRest', () => ({
  selectOne: vi.fn(),
  selectMany: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  isSupabaseConfigured: vi.fn(() => true),
  handleError: vi.fn(),
}));

vi.mock('../../../api/_lib/adminAuth', () => ({
  getUserFromRequest: vi.fn(),
  getUserRole: vi.fn(),
}));

import {
  computeHealthIndicator,
} from '../../../api/_lib/clientPortalHandler';

// ── computeHealthIndicator ─────────────────────────────────────────────

describe('computeHealthIndicator', () => {
  const baseMandate = { created_at: new Date().toISOString() };

  it('returns on_track for healthy pipeline', () => {
    const result = computeHealthIndicator(baseMandate, {
      sourced: 10, screened: 5, shortlisted: 3, interview: 2, offer: 0, placed: 0,
    });
    expect(result).toBe('on_track');
  });

  it('returns at_risk when no candidates after 14 days', () => {
    const oldMandate = { created_at: new Date(Date.now() - 15 * 86400000).toISOString() };
    const result = computeHealthIndicator(oldMandate, {
      sourced: 0, screened: 0, shortlisted: 0, interview: 0, offer: 0, placed: 0,
    });
    expect(result).toBe('at_risk');
  });

  it('returns at_risk when no shortlist after 30 days', () => {
    const oldMandate = { created_at: new Date(Date.now() - 31 * 86400000).toISOString() };
    const result = computeHealthIndicator(oldMandate, {
      sourced: 5, screened: 3, shortlisted: 0, interview: 0, offer: 0, placed: 0,
    });
    expect(result).toBe('at_risk');
  });

  it('returns behind when stuck in interview after 60 days', () => {
    const oldMandate = { created_at: new Date(Date.now() - 61 * 86400000).toISOString() };
    const result = computeHealthIndicator(oldMandate, {
      sourced: 10, screened: 8, shortlisted: 5, interview: 3, offer: 0, placed: 0,
    });
    expect(result).toBe('behind');
  });
});