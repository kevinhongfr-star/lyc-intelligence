/**
 * Tests for adminAuditLog.ts
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockSelectMany = vi.fn();
const mockSelectOne = vi.fn();
const mockInsert = vi.fn();
const mockIsConfigured = vi.fn();

vi.mock('../../../api/_lib/supabaseRest', () => ({
  selectOne: (...args: any[]) => mockSelectOne(...args),
  selectMany: (...args: any[]) => mockSelectMany(...args),
  insert: (...args: any[]) => mockInsert(...args),
  update: vi.fn(),
  remove: vi.fn(),
  isSupabaseConfigured: () => mockIsConfigured(),
  handleError: vi.fn(),
}));

import {
  createAuditEntry,
  listAuditLogs,
  getAuditEntry,
  getAuditStats,
  exportAuditToCSV,
  ADMIN_ACTIONS,
} from '../../../api/_lib/adminAuditLog';

describe('adminAuditLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsConfigured.mockReturnValue(true);
  });

  describe('createAuditEntry', () => {
    it('creates an audit entry', async () => {
      const entry = {
        id: '1',
        actor_id: 'admin-1',
        action: 'user.create',
        entity_type: 'user',
        created_at: new Date().toISOString(),
      };
      mockInsert.mockResolvedValue(entry);

      const result = await createAuditEntry({
        actor_id: 'admin-1',
        action: 'user.create',
        entity_type: 'user',
        entity_id: 'u1',
      });
      expect(result.actor_id).toBe('admin-1');
      expect(result.action).toBe('user.create');
    });

    it('throws when not configured', async () => {
      mockIsConfigured.mockReturnValue(false);
      await expect(createAuditEntry({
        actor_id: 'admin-1',
        action: 'test',
        entity_type: 'test',
      })).rejects.toThrow('Supabase not configured');
    });
  });

  describe('listAuditLogs', () => {
    it('returns filtered audit logs', async () => {
      const entries = [
        { id: '1', action: 'user.create', actor_id: 'admin-1' },
      ];
      mockSelectMany.mockResolvedValue(entries);

      const result = await listAuditLogs({ actor_id: 'admin-1' });
      expect(result.entries).toHaveLength(1);
    });

    it('returns empty when not configured', async () => {
      mockIsConfigured.mockReturnValue(false);
      const result = await listAuditLogs();
      expect(result.entries).toHaveLength(0);
    });
  });

  describe('getAuditEntry', () => {
    it('returns entry by id', async () => {
      const entry = { id: '1', action: 'test' };
      mockSelectOne.mockResolvedValue(entry);

      const result = await getAuditEntry('1');
      expect(result?.id).toBe('1');
    });

    it('returns null for missing entry', async () => {
      mockSelectOne.mockResolvedValue(null);
      const result = await getAuditEntry('999');
      expect(result).toBeNull();
    });
  });

  describe('getAuditStats', () => {
    it('computes statistics from entries', async () => {
      mockSelectMany.mockResolvedValue([
        { id: '1', actor_id: 'admin-1', action: 'user.create', created_at: new Date().toISOString() },
        { id: '2', actor_id: 'admin-1', action: 'user.update', created_at: new Date().toISOString() },
        { id: '3', actor_id: 'admin-2', action: 'user.create', created_at: new Date().toISOString() },
      ]);

      const stats = await getAuditStats();
      expect(stats.total_entries).toBe(3);
      expect(stats.unique_actors).toBe(2);
      expect(stats.most_common_actions[0].action).toBe('user.create');
    });
  });

  describe('exportAuditToCSV', () => {
    it('exports entries to CSV format', () => {
      const entries = [
        {
          id: '1',
          actor_id: 'admin-1',
          action: 'user.create',
          entity_type: 'user',
          entity_id: 'u1',
          metadata: { email: 'test@test.com' },
          ip_address: '127.0.0.1',
          user_agent: 'test-agent',
          created_at: '2026-01-01T00:00:00Z',
        },
      ];

      const csv = exportAuditToCSV(entries);
      expect(csv).toContain('id');
      expect(csv).toContain('actor_id');
      expect(csv).toContain('user.create');
      expect(csv).toContain('test@test.com');
    });
  });

  describe('ADMIN_ACTIONS constants', () => {
    it('contains all expected action types', () => {
      expect(ADMIN_ACTIONS.USER_CREATE).toBe('user.create');
      expect(ADMIN_ACTIONS.USER_DEACTIVATE).toBe('user.deactivate');
      expect(ADMIN_ACTIONS.ORG_CREATE).toBe('org.create');
      expect(ADMIN_ACTIONS.MODERATION_FLAG).toBe('moderation.flag');
      expect(ADMIN_ACTIONS.CONFIG_UPDATE).toBe('config.update');
      expect(ADMIN_ACTIONS.FEATURE_FLAG_TOGGLE).toBe('feature_flag.toggle');
      expect(ADMIN_ACTIONS.BILLING_INVOICE_CREATE).toBe('billing.invoice.create');
      expect(ADMIN_ACTIONS.RBAC_ROLE_CHANGE).toBe('rbac.role_change');
      expect(ADMIN_ACTIONS.AUDIT_EXPORT).toBe('audit.export');
    });
  });
});
