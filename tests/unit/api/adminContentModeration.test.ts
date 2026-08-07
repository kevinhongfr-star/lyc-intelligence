/**
 * Tests for adminContentModeration.ts
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
  listModerationQueue,
  getModerationRecord,
  flagContent,
  reviewContent,
  removeContent,
  restoreContent,
  getModerationStats,
} from '../../../api/_lib/adminContentModeration';

describe('adminContentModeration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsConfigured.mockReturnValue(true);
  });

  describe('listModerationQueue', () => {
    it('returns moderation records', async () => {
      mockSelectMany.mockResolvedValue([
        { id: '1', status: 'pending', content_type: 'comment' },
      ]);
      const result = await listModerationQueue();
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('returns empty when not configured', async () => {
      mockIsConfigured.mockReturnValue(false);
      const result = await listModerationQueue();
      expect(result.items).toHaveLength(0);
    });
  });

  describe('getModerationRecord', () => {
    it('returns record by id', async () => {
      mockSelectOne.mockResolvedValue({ id: '1', status: 'pending' });
      const result = await getModerationRecord('1');
      expect(result?.id).toBe('1');
    });

    it('returns null for missing record', async () => {
      mockSelectOne.mockResolvedValue(null);
      const result = await getModerationRecord('999');
      expect(result).toBeNull();
    });
  });

  describe('flagContent', () => {
    it('flags content with valid input', async () => {
      mockInsert.mockResolvedValue({ id: '1', status: 'pending', flag_reason: 'Spam' });
      const result = await flagContent(
        { content_type: 'comment', content_id: 'c1', reason: 'Spam' },
        'mod-1'
      );
      expect(result.status).toBe('pending');
      expect(result.flag_reason).toBe('Spam');
    });

    it('throws on empty reason', async () => {
      await expect(flagContent(
        { content_type: 'comment', content_id: 'c1', reason: '' },
        'mod-1'
      )).rejects.toThrow('Flag reason is required');
    });
  });

  describe('reviewContent', () => {
    it('updates moderation status', async () => {
      mockUpdate.mockResolvedValue([{ id: '1', status: 'approved' }]);
      const result = await reviewContent('1', { status: 'approved', notes: 'Looks fine' }, 'mod-1');
      expect(result.status).toBe('approved');
    });

    it('throws when record not found', async () => {
      mockUpdate.mockResolvedValue([]);
      await expect(reviewContent('999', { status: 'approved' }, 'mod-1'))
        .rejects.toThrow('Moderation record not found');
    });
  });

  describe('removeContent', () => {
    it('marks content as removed', async () => {
      mockUpdate.mockResolvedValue([{ id: '1', status: 'removed' }]);
      const result = await removeContent('1', 'mod-1', 'Policy violation');
      expect(result.status).toBe('removed');
    });
  });

  describe('restoreContent', () => {
    it('restores removed content to approved', async () => {
      mockUpdate.mockResolvedValue([{ id: '1', status: 'approved' }]);
      const result = await restoreContent('1', 'mod-1', 'Appeal granted');
      expect(result.status).toBe('approved');
    });
  });

  describe('getModerationStats', () => {
    it('returns counts by status', async () => {
      const today = new Date().toISOString();
      mockSelectMany.mockResolvedValue([
        { id: '1', status: 'pending', created_at: today },
        { id: '2', status: 'pending', created_at: today },
        { id: '3', status: 'approved', created_at: '2026-01-01T00:00:00Z' },
        { id: '4', status: 'rejected', created_at: '2026-01-01T00:00:00Z' },
        { id: '5', status: 'removed', created_at: '2026-01-01T00:00:00Z' },
      ]);

      const stats = await getModerationStats();
      expect(stats.pending).toBe(2);
      expect(stats.approved).toBe(1);
      expect(stats.rejected).toBe(1);
      expect(stats.removed).toBe(1);
      expect(stats.total_today).toBe(2);
    });

    it('returns zeros when not configured', async () => {
      mockIsConfigured.mockReturnValue(false);
      const stats = await getModerationStats();
      expect(stats.pending).toBe(0);
    });
  });
});
