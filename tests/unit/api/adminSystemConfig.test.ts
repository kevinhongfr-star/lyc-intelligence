/**
 * Tests for adminSystemConfig.ts
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockSelectMany = vi.fn();
const mockSelectOne = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockIsConfigured = vi.fn();

vi.mock('../../../api/_lib/supabaseRest', () => ({
  selectOne: (...args: any[]) => mockSelectOne(...args),
  selectMany: (...args: any[]) => mockSelectMany(...args),
  insert: (...args: any[]) => mockInsert(...args),
  update: (...args: any[]) => mockUpdate(...args),
  remove: vi.fn(),
  isSupabaseConfigured: () => mockIsConfigured(),
  handleError: vi.fn(),
}));

import {
  listConfigs,
  getConfigByKey,
  createConfig,
  updateConfig,
  listFeatureFlags,
  getFeatureFlag,
  createFeatureFlag,
  updateFeatureFlag,
  isFeatureFlagEnabled,
  SYSTEM_CONFIG_KEYS,
} from '../../../api/_lib/adminSystemConfig';

describe('adminSystemConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsConfigured.mockReturnValue(true);
  });

  describe('listConfigs', () => {
    it('returns configs filtered by scope', async () => {
      mockSelectMany.mockResolvedValue([
        { id: '1', key: 'timeout', value: 30, scope: 'global' },
      ]);
      const result = await listConfigs('global');
      expect(result).toHaveLength(1);
    });

    it('returns empty when not configured', async () => {
      mockIsConfigured.mockReturnValue(false);
      const result = await listConfigs();
      expect(result).toHaveLength(0);
    });
  });

  describe('getConfigByKey', () => {
    it('returns config by key', async () => {
      mockSelectOne.mockResolvedValue({ id: '1', key: 'timeout', value: 30 });
      const result = await getConfigByKey('timeout');
      expect(result?.key).toBe('timeout');
    });
  });

  describe('createConfig', () => {
    it('creates a new config entry', async () => {
      mockSelectOne.mockResolvedValue(null);
      mockInsert.mockResolvedValue({ id: '1', key: 'new_key', value: 'test' });

      const result = await createConfig({ key: 'new_key', value: 'test' }, 'admin-1');
      expect(result.key).toBe('new_key');
    });

    it('throws on duplicate key', async () => {
      mockSelectOne.mockResolvedValue({ id: '1', key: 'existing' });
      await expect(createConfig({ key: 'existing', value: 'x' }, 'admin-1'))
        .rejects.toThrow('already exists');
    });
  });

  describe('updateConfig', () => {
    it('updates config value', async () => {
      mockUpdate.mockResolvedValue([{ id: '1', value: 'updated' }]);
      const result = await updateConfig('1', { value: 'updated' }, 'admin-1');
      expect(result.value).toBe('updated');
    });

    it('throws when not found', async () => {
      mockUpdate.mockResolvedValue([]);
      await expect(updateConfig('999', { value: 'x' }, 'admin-1'))
        .rejects.toThrow('Config not found');
    });
  });

  describe('listFeatureFlags', () => {
    it('returns feature flags', async () => {
      mockSelectMany.mockResolvedValue([
        { id: '1', key: 'dark_mode', is_enabled: true },
      ]);
      const result = await listFeatureFlags();
      expect(result).toHaveLength(1);
    });

    it('returns empty when not configured', async () => {
      mockIsConfigured.mockReturnValue(false);
      const result = await listFeatureFlags();
      expect(result).toHaveLength(0);
    });
  });

  describe('createFeatureFlag', () => {
    it('creates a new feature flag', async () => {
      mockSelectOne.mockResolvedValue(null);
      mockInsert.mockResolvedValue({
        id: '1',
        key: 'new_flag',
        name: 'New Flag',
        is_enabled: false,
      });

      const result = await createFeatureFlag(
        { key: 'new_flag', name: 'New Flag' },
        'admin-1'
      );
      expect(result.key).toBe('new_flag');
      expect(result.is_enabled).toBe(false);
    });

    it('throws on duplicate key', async () => {
      mockSelectOne.mockResolvedValue({ id: '1', key: 'existing' });
      await expect(createFeatureFlag(
        { key: 'existing', name: 'Existing' },
        'admin-1'
      )).rejects.toThrow('already exists');
    });
  });

  describe('updateFeatureFlag', () => {
    it('toggles flag on/off', async () => {
      mockUpdate.mockResolvedValue([{ id: '1', key: 'flag', is_enabled: true }]);
      const result = await updateFeatureFlag('flag', { is_enabled: true }, 'admin-1');
      expect(result.is_enabled).toBe(true);
    });
  });

  describe('isFeatureFlagEnabled', () => {
    it('returns false when flag is disabled', () => {
      const flag = { id: '1', key: 'test', is_enabled: false, rollout_percentage: 100, allowed_roles: null, org_override: null, name: 'Test', description: null, updated_by: null, updated_at: '', created_at: '' };
      expect(isFeatureFlagEnabled(flag, {})).toBe(false);
    });

    it('returns true when enabled with no restrictions', () => {
      const flag = { id: '1', key: 'test', is_enabled: true, rollout_percentage: 100, allowed_roles: null, org_override: null, name: 'Test', description: null, updated_by: null, updated_at: '', created_at: '' };
      expect(isFeatureFlagEnabled(flag, {})).toBe(true);
    });

    it('respects org override', () => {
      const flag = { id: '1', key: 'test', is_enabled: true, rollout_percentage: 100, allowed_roles: null, org_override: { 'org-1': false }, name: 'Test', description: null, updated_by: null, updated_at: '', created_at: '' };
      expect(isFeatureFlagEnabled(flag, { orgId: 'org-1' })).toBe(false);
      expect(isFeatureFlagEnabled(flag, { orgId: 'org-2' })).toBe(true);
    });

    it('respects allowed roles', () => {
      const flag = { id: '1', key: 'test', is_enabled: true, rollout_percentage: 100, allowed_roles: ['admin'], org_override: null, name: 'Test', description: null, updated_by: null, updated_at: '', created_at: '' };
      expect(isFeatureFlagEnabled(flag, { role: 'admin' })).toBe(true);
      expect(isFeatureFlagEnabled(flag, { role: 'consultant' })).toBe(false);
    });

    it('handles percentage rollout deterministically', () => {
      const flag = { id: '1', key: 'test', is_enabled: true, rollout_percentage: 50, allowed_roles: null, org_override: null, name: 'Test', description: null, updated_by: null, updated_at: '', created_at: '' };
      const result1 = isFeatureFlagEnabled(flag, { userId: 'user-1' });
      const result2 = isFeatureFlagEnabled(flag, { userId: 'user-1' });
      expect(result1).toBe(result2);
    });
  });

  describe('SYSTEM_CONFIG_KEYS', () => {
    it('contains expected config keys', () => {
      expect(SYSTEM_CONFIG_KEYS.SESSION_TIMEOUT_MINUTES).toBe('session_timeout_minutes');
      expect(SYSTEM_CONFIG_KEYS.TAX_RATE).toBe('tax_rate');
      expect(SYSTEM_CONFIG_KEYS.DEFAULT_CURRENCY).toBe('default_currency');
      expect(SYSTEM_CONFIG_KEYS.AUDIT_RETENTION_DAYS).toBe('audit_retention_days');
    });
  });
});
