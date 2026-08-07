/**
 * Tests for adminOrgManagement.ts
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockSelectMany = vi.fn();
const mockSelectOne = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockRemove = vi.fn();
const mockIsConfigured = vi.fn();

vi.mock('../../../api/_lib/supabaseRest', () => ({
  selectOne: (...args: any[]) => mockSelectOne(...args),
  selectMany: (...args: any[]) => mockSelectMany(...args),
  insert: (...args: any[]) => mockInsert(...args),
  update: (...args: any[]) => mockUpdate(...args),
  remove: (...args: any[]) => mockRemove(...args),
  isSupabaseConfigured: () => mockIsConfigured(),
  handleError: vi.fn(),
}));

import {
  listOrganizations,
  getOrganization,
  createOrganization,
  updateOrganization,
  suspendOrganization,
  reactivateOrganization,
  changePlan,
  deleteOrganization,
  getOrganizationStats,
  getPlanSeats,
  getPlanFeatures,
  PLAN_LIMITS,
} from '../../../api/_lib/adminOrgManagement';

describe('adminOrgManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsConfigured.mockReturnValue(true);
  });

  describe('listOrganizations', () => {
    it('returns organizations', async () => {
      mockSelectMany.mockResolvedValue([
        { id: '1', name: 'Org 1', plan: 'free', status: 'active' },
      ]);
      const result = await listOrganizations();
      expect(result.orgs).toHaveLength(1);
    });

    it('returns empty when not configured', async () => {
      mockIsConfigured.mockReturnValue(false);
      const result = await listOrganizations();
      expect(result.orgs).toHaveLength(0);
    });
  });

  describe('getOrganization', () => {
    it('returns org by id', async () => {
      const org = { id: '1', name: 'Test Org' };
      mockSelectOne.mockResolvedValue(org);
      const result = await getOrganization('1');
      expect(result).toEqual(org);
    });

    it('returns null for missing org', async () => {
      mockSelectOne.mockResolvedValue(null);
      const result = await getOrganization('999');
      expect(result).toBeNull();
    });
  });

  describe('createOrganization', () => {
    it('creates org with valid data', async () => {
      mockSelectOne.mockResolvedValue(null);
      mockInsert.mockResolvedValue({ id: '1', name: 'New Org', slug: 'new-org' });

      const result = await createOrganization({ name: 'New Org' }, 'admin-1');
      expect(result.name).toBe('New Org');
      expect(result.slug).toBe('new-org');
    });

    it('throws on empty name', async () => {
      await expect(createOrganization({ name: '' }, 'admin-1'))
        .rejects.toThrow('Organization name is required');
    });

    it('throws on duplicate slug', async () => {
      mockSelectOne.mockResolvedValue({ id: '1', slug: 'existing' });
      await expect(createOrganization({ name: 'Existing', slug: 'existing' }, 'admin-1'))
        .rejects.toThrow('already exists');
    });

    it('auto-generates slug from name', async () => {
      mockSelectOne.mockResolvedValue(null);
      mockInsert.mockResolvedValue({ id: '1', slug: 'my-company' });
      const result = await createOrganization({ name: 'My Company' }, 'admin-1');
      expect(result.slug).toBe('my-company');
    });
  });

  describe('updateOrganization', () => {
    it('updates org name', async () => {
      mockUpdate.mockResolvedValue([{ id: '1', name: 'Updated Org' }]);
      const result = await updateOrganization('1', { name: 'Updated Org' }, 'admin-1');
      expect(result.name).toBe('Updated Org');
    });

    it('returns current org when no changes', async () => {
      mockSelectOne.mockResolvedValue({ id: '1', name: 'Unchanged' });
      const result = await updateOrganization('1', {}, 'admin-1');
      expect(result.name).toBe('Unchanged');
    });
  });

  describe('suspendOrganization', () => {
    it('suspends the org', async () => {
      mockUpdate.mockResolvedValue([{ id: '1', status: 'suspended' }]);
      const result = await suspendOrganization('1', 'admin-1');
      expect(result.status).toBe('suspended');
    });
  });

  describe('reactivateOrganization', () => {
    it('reactivates the org', async () => {
      mockUpdate.mockResolvedValue([{ id: '1', status: 'active' }]);
      const result = await reactivateOrganization('1', 'admin-1');
      expect(result.status).toBe('active');
    });
  });

  describe('changePlan', () => {
    it('changes plan and updates seat limits', async () => {
      mockSelectOne.mockResolvedValue({ id: '1', plan: 'free' });
      mockUpdate.mockResolvedValue([{ id: '1', plan: 'growth', seats_limit: 50 }]);

      const result = await changePlan('1', { plan: 'growth' }, 'admin-1');
      expect(result.plan).toBe('growth');
      expect(result.seats_limit).toBe(50);
    });

    it('throws when org not found', async () => {
      mockSelectOne.mockResolvedValue(null);
      await expect(changePlan('999', { plan: 'enterprise' }, 'admin-1'))
        .rejects.toThrow('Organization not found');
    });
  });

  describe('deleteOrganization', () => {
    it('archives instead of hard-delete', async () => {
      mockUpdate.mockResolvedValue([{ id: '1', status: 'archived' }]);
      const result = await deleteOrganization('1', 'admin-1');
      expect(result.success).toBe(true);
    });
  });

  describe('getOrganizationStats', () => {
    it('returns stats with user counts', async () => {
      mockSelectOne.mockResolvedValue({ id: '1', seats_limit: 10 });
      mockSelectMany.mockResolvedValue([
        { id: 'u1', status: 'active' },
        { id: 'u2', status: 'active' },
        { id: 'u3', status: 'disabled' },
      ]);

      const stats = await getOrganizationStats('1');
      expect(stats.total_users).toBe(3);
      expect(stats.active_users).toBe(2);
      expect(stats.seats_remaining).toBe(7);
    });
  });

  describe('getPlanSeats / getPlanFeatures', () => {
    it('returns correct seat counts per plan', () => {
      expect(getPlanSeats('free')).toBe(3);
      expect(getPlanSeats('starter')).toBe(10);
      expect(getPlanSeats('growth')).toBe(50);
      expect(getPlanSeats('enterprise')).toBe(500);
    });

    it('returns features for each plan tier', () => {
      const free = getPlanFeatures('free');
      expect(free).toContain('basic_candidates');
      expect(free.length).toBeLessThan(getPlanFeatures('enterprise').length);

      const enterprise = getPlanFeatures('enterprise');
      expect(enterprise).toContain('audit_logs');
      expect(enterprise).toContain('sla_support');
    });
  });
});
