/**
 * Tests for adminAuth.ts — RBAC and role management
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../../api/_lib/supabaseRest', () => ({
  selectOne: vi.fn(),
  selectMany: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  isSupabaseConfigured: vi.fn(),
  handleError: vi.fn(),
}));

import {
  hasOrgAccess,
  isOrgAdmin,
  getUserRole,
  isAdmin,
  isTeamLead,
} from '../../../api/_lib/adminAuth';

describe('adminAuth — role checks', () => {
  describe('hasOrgAccess', () => {
    it('returns true for admin roles', () => {
      expect(hasOrgAccess('admin')).toBe(true);
      expect(hasOrgAccess('lyc_admin')).toBe(true);
      expect(hasOrgAccess('super_admin')).toBe(true);
      expect(hasOrgAccess('client_admin')).toBe(true);
    });

    it('returns true for consultant roles', () => {
      expect(hasOrgAccess('lyc_consultant')).toBe(true);
      expect(hasOrgAccess('client_viewer')).toBe(true);
    });

    it('returns false for restricted roles', () => {
      expect(hasOrgAccess('candidate')).toBe(false);
      expect(hasOrgAccess('member')).toBe(false);
    });
  });

  describe('isOrgAdmin', () => {
    it('returns true for admin-level roles', () => {
      expect(isOrgAdmin('admin')).toBe(true);
      expect(isOrgAdmin('lyc_admin')).toBe(true);
      expect(isOrgAdmin('super_admin')).toBe(true);
      expect(isOrgAdmin('client_admin')).toBe(true);
    });

    it('returns false for non-admin roles', () => {
      expect(isOrgAdmin('consultant')).toBe(false);
      expect(isOrgAdmin('lyc_consultant')).toBe(false);
      expect(isOrgAdmin('member')).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('returns true for super_admin, lyc_admin, and admin', async () => {
      const { isSupabaseConfigured } = await import('../../../api/_lib/supabaseRest');
      (isSupabaseConfigured as any).mockReturnValue(true);

      const { selectOne } = await import('../../../api/_lib/supabaseRest');
      (selectOne as any).mockResolvedValue({ role: 'super_admin' });
      expect(await isAdmin('user-1')).toBe(true);

      (selectOne as any).mockResolvedValue({ role: 'lyc_admin' });
      expect(await isAdmin('user-1')).toBe(true);

      (selectOne as any).mockResolvedValue({ role: 'admin' });
      expect(await isAdmin('user-1')).toBe(true);
    });

    it('returns false for non-admin roles', async () => {
      const { isSupabaseConfigured } = await import('../../../api/_lib/supabaseRest');
      (isSupabaseConfigured as any).mockReturnValue(true);

      const { selectOne } = await import('../../../api/_lib/supabaseRest');
      (selectOne as any).mockResolvedValue({ role: 'consultant' });
      expect(await isAdmin('user-1')).toBe(false);
    });
  });

  describe('isTeamLead', () => {
    it('returns true for team lead or above', () => {
      expect(isTeamLead('team_lead')).toBe(true);
      expect(isTeamLead('admin')).toBe(true);
      expect(isTeamLead('lyc_admin')).toBe(true);
      expect(isTeamLead('super_admin')).toBe(true);
    });

    it('returns false for regular members', () => {
      expect(isTeamLead('consultant')).toBe(false);
      expect(isTeamLead('member')).toBe(false);
    });
  });
});
