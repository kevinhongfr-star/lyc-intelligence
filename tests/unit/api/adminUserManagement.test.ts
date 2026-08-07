/**
 * Tests for adminUserManagement.ts
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockSelectMany = vi.fn();
const mockSelectOne = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockRemove = vi.fn();
const mockCreateAuthUser = vi.fn();
const mockIsConfigured = vi.fn();

vi.mock('../../../api/_lib/supabaseRest', () => ({
  selectOne: (...args: any[]) => mockSelectOne(...args),
  selectMany: (...args: any[]) => mockSelectMany(...args),
  insert: (...args: any[]) => mockInsert(...args),
  update: (...args: any[]) => mockUpdate(...args),
  remove: (...args: any[]) => mockRemove(...args),
  createAuthUser: (...args: any[]) => mockCreateAuthUser(...args),
  isSupabaseConfigured: () => mockIsConfigured(),
  handleError: vi.fn(),
}));

import {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deactivateUser,
  reactivateUser,
  adminResetPassword,
  deleteUser,
  VALID_ROLES,
} from '../../../api/_lib/adminUserManagement';

describe('adminUserManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsConfigured.mockReturnValue(true);
  });

  describe('listUsers', () => {
    it('returns users when supabase is configured', async () => {
      const users = [
        { id: '1', email: 'a@b.com', full_name: 'Alice', role: 'admin', status: 'active', created_at: '2026-01-01T00:00:00Z', last_login: null, org_id: null, avatar_url: null, title: null },
      ];
      mockSelectMany.mockResolvedValue(users);

      const result = await listUsers();
      expect(result.users).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('returns empty when supabase is not configured', async () => {
      mockIsConfigured.mockReturnValue(false);
      const result = await listUsers();
      expect(result.users).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('applies filters correctly', async () => {
      mockSelectMany.mockResolvedValue([]);
      await listUsers({ status: 'active', role: 'admin' });
      expect(mockSelectMany).toHaveBeenCalled();
    });
  });

  describe('getUser', () => {
    it('returns user by id', async () => {
      const user = { id: '1', email: 'a@b.com' };
      mockSelectOne.mockResolvedValue(user);

      const result = await getUser('1');
      expect(result).toEqual(user);
    });

    it('returns null when not found', async () => {
      mockSelectOne.mockResolvedValue(null);
      const result = await getUser('999');
      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('creates a new user successfully', async () => {
      mockSelectOne.mockResolvedValue(null);
      mockCreateAuthUser.mockResolvedValue({ id: 'auth-1' });
      mockInsert.mockResolvedValue({ id: '1', email: 'new@test.com', role: 'consultant' });

      const result = await createUser(
        { email: 'new@test.com', role: 'consultant' },
        'admin-1'
      );
      expect(result.email).toBe('new@test.com');
      expect(mockCreateAuthUser).toHaveBeenCalled();
      expect(mockInsert).toHaveBeenCalled();
    });

    it('throws on invalid email', async () => {
      await expect(createUser(
        { email: 'not-an-email', role: 'admin' },
        'admin-1'
      )).rejects.toThrow('Valid email is required');
    });

    it('throws on invalid role', async () => {
      await expect(createUser(
        { email: 'test@test.com', role: 'invalid_role' },
        'admin-1'
      )).rejects.toThrow('Invalid role');
    });

    it('throws on duplicate email', async () => {
      mockSelectOne.mockResolvedValue({ id: '1', email: 'existing@test.com' });
      await expect(createUser(
        { email: 'existing@test.com', role: 'admin' },
        'admin-1'
      )).rejects.toThrow('already exists');
    });
  });

  describe('updateUser', () => {
    it('updates user fields', async () => {
      mockUpdate.mockResolvedValue([{ id: '1', full_name: 'Updated' }]);
      const result = await updateUser('1', { full_name: 'Updated' }, 'admin-1');
      expect(result.full_name).toBe('Updated');
    });

    it('validates role when provided', async () => {
      await expect(updateUser('1', { role: 'bad_role' }, 'admin-1'))
        .rejects.toThrow('Invalid role');
    });
  });

  describe('deactivateUser', () => {
    it('deactivates a user', async () => {
      mockUpdate.mockResolvedValue([{ id: '1', status: 'disabled' }]);
      const result = await deactivateUser('1', 'admin-1');
      expect(result.status).toBe('disabled');
    });
  });

  describe('reactivateUser', () => {
    it('reactivates a user', async () => {
      mockUpdate.mockResolvedValue([{ id: '1', status: 'active' }]);
      const result = await reactivateUser('1', 'admin-1');
      expect(result.status).toBe('active');
    });
  });

  describe('adminResetPassword', () => {
    it('resets password via admin API', async () => {
      mockSelectOne.mockResolvedValue({ id: '1', email: 'test@test.com' });
      global.fetch = vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve('{}') });

      const result = await adminResetPassword('1', 'admin-1');
      expect(result.success).toBe(true);
      expect(result.message).toContain('Password reset');
    });

    it('throws when user not found', async () => {
      mockSelectOne.mockResolvedValue(null);
      await expect(adminResetPassword('999', 'admin-1'))
        .rejects.toThrow('User not found');
    });
  });

  describe('deleteUser', () => {
    it('deletes user and auth record', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
      mockRemove.mockResolvedValue(1);

      const result = await deleteUser('1', 'admin-1');
      expect(result.success).toBe(true);
    });
  });

  describe('VALID_ROLES', () => {
    it('contains all expected roles', () => {
      expect(VALID_ROLES).toContain('admin');
      expect(VALID_ROLES).toContain('partner');
      expect(VALID_ROLES).toContain('consultant');
      expect(VALID_ROLES).toContain('recruiter');
      expect(VALID_ROLES).toContain('analyst');
    });
  });
});
