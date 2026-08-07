/**
 * Tests for adminAnalytics.ts
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockSelectMany = vi.fn();
const mockIsConfigured = vi.fn();

vi.mock('../../../api/_lib/supabaseRest', () => ({
  selectOne: vi.fn(),
  selectMany: (...args: any[]) => mockSelectMany(...args),
  insert: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  isSupabaseConfigured: () => mockIsConfigured(),
  handleError: vi.fn(),
}));

import {
  getPlatformStats,
  getUsageMetrics,
  getHealthMetrics,
  getMandateHealth,
  getActivityTimeline,
} from '../../../api/_lib/adminAnalytics';

describe('adminAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsConfigured.mockReturnValue(true);
  });

  describe('getPlatformStats', () => {
    it('returns user counts from profiles', async () => {
      mockSelectMany.mockResolvedValue([
        { id: '1', last_login: new Date().toISOString(), created_at: '2026-01-01T00:00:00Z' },
        { id: '2', last_login: new Date().toISOString(), created_at: '2026-01-01T00:00:00Z' },
        { id: '3', last_login: null, created_at: '2026-01-01T00:00:00Z' },
      ]);

      const stats = await getPlatformStats();
      expect(stats.total_users).toBe(3);
      expect(stats.active_users_24h).toBe(2);
    });

    it('returns zeros when not configured', async () => {
      mockIsConfigured.mockReturnValue(false);
      const stats = await getPlatformStats();
      expect(stats.total_users).toBe(0);
      expect(stats.active_users_24h).toBe(0);
    });
  });

  describe('getUsageMetrics', () => {
    it('counts event types in period', async () => {
      mockSelectMany.mockResolvedValue([
        { action: 'user.create', created_at: new Date().toISOString() },
        { action: 'auth.login', created_at: new Date().toISOString() },
        { action: 'auth.login', created_at: new Date().toISOString() },
        { action: 'search.perform', created_at: new Date().toISOString() },
        { action: 'stage.change', created_at: new Date().toISOString() },
      ]);

      const metrics = await getUsageMetrics(30);
      expect(metrics.new_users).toBe(1);
      expect(metrics.active_sessions).toBe(2);
      expect(metrics.searches_performed).toBe(1);
      expect(metrics.stage_changes).toBe(1);
    });

    it('returns empty metrics when not configured', async () => {
      mockIsConfigured.mockReturnValue(false);
      const metrics = await getUsageMetrics();
      expect(metrics.new_users).toBe(0);
    });
  });

  describe('getHealthMetrics', () => {
    it('returns health metrics with reasonable values', async () => {
      const health = await getHealthMetrics();
      expect(health.api_latency_p50_ms).toBeGreaterThan(0);
      expect(health.error_rate_percent).toBeGreaterThanOrEqual(0);
      expect(health.uptime_percent).toBeLessThanOrEqual(100);
      expect(health.storage_used_gb).toBeGreaterThan(0);
    });
  });

  describe('getMandateHealth', () => {
    it('computes health scores for mandates', async () => {
      mockSelectMany.mockResolvedValue([
        { id: 'm1', title: 'Active Mandate', updated_at: new Date().toISOString() },
        { id: 'm2', title: 'Stale Mandate', updated_at: '2025-01-01T00:00:00Z' },
      ]);

      const health = await getMandateHealth();
      expect(health).toHaveLength(2);
      expect(health[0].health_status).toBe('green');
    });

    it('returns empty when not configured', async () => {
      mockIsConfigured.mockReturnValue(false);
      const health = await getMandateHealth();
      expect(health).toHaveLength(0);
    });
  });

  describe('getActivityTimeline', () => {
    it('groups events by date and action', async () => {
      const today = new Date().toISOString();
      mockSelectMany.mockResolvedValue([
        { action: 'login', created_at: today },
        { action: 'login', created_at: today },
        { action: 'create', created_at: today },
      ]);

      const timeline = await getActivityTimeline(7);
      expect(timeline.length).toBeGreaterThanOrEqual(2);
    });

    it('returns empty when not configured', async () => {
      mockIsConfigured.mockReturnValue(false);
      const timeline = await getActivityTimeline();
      expect(timeline).toHaveLength(0);
    });
  });
});
