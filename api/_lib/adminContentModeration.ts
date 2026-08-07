/**
 * adminContentModeration.ts — Content review, flag, approve, remove.
 *
 * Moderation pipeline for user-generated content: flags, reviews,
 * approves, rejects, and removes content across the platform.
 */

import {
  selectOne,
  selectMany,
  insert,
  update,
  remove,
  isSupabaseConfigured,
} from './supabaseRest.js';

export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'removed';
export type ContentType = 'comment' | 'post' | 'document' | 'profile' | 'campaign' | 'message';
export type ModerationAction = 'flag' | 'approve' | 'reject' | 'remove' | 'restore';

export interface ModerationRecord {
  id: string;
  content_type: ContentType;
  content_id: string;
  author_id: string;
  status: ModerationStatus;
  flag_reason: string | null;
  reviewer_id: string | null;
  review_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FlagInput {
  content_type: ContentType;
  content_id: string;
  reason: string;
  author_id?: string;
}

export interface ReviewInput {
  status: ModerationStatus;
  notes?: string;
}

export interface ListModerationFilters {
  status?: ModerationStatus;
  content_type?: ContentType;
  author_id?: string;
  reviewer_id?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export async function listModerationQueue(
  filters: ListModerationFilters = {}
): Promise<{ items: ModerationRecord[]; total: number }> {
  if (!isSupabaseConfigured()) {
    return { items: [], total: 0 };
  }

  const where: { column: string; value: any; op?: string }[] = [];
  if (filters.status) where.push({ column: 'status', value: filters.status, op: 'eq' });
  if (filters.content_type) where.push({ column: 'content_type', value: filters.content_type, op: 'eq' });
  if (filters.author_id) where.push({ column: 'author_id', value: filters.author_id, op: 'eq' });
  if (filters.reviewer_id) where.push({ column: 'reviewer_id', value: filters.reviewer_id, op: 'eq' });

  const items = await selectMany('moderation_logs', {
    select: 'id,content_type,content_id,author_id,status,flag_reason,reviewer_id,review_notes,reviewed_at,created_at,updated_at',
    where: where.length > 0 ? where : undefined,
    orderBy: { column: 'created_at', ascending: false },
    limit: filters.limit ?? 50,
    offset: filters.offset ?? 0,
  });

  return { items: items as ModerationRecord[], total: items.length };
}

export async function getModerationRecord(id: string): Promise<ModerationRecord | null> {
  if (!isSupabaseConfigured()) return null;
  const rec = await selectOne('moderation_logs', {
    column: 'id',
    value: id,
    select: 'id,content_type,content_id,author_id,status,flag_reason,reviewer_id,review_notes,reviewed_at,created_at,updated_at',
  });
  return rec as ModerationRecord | null;
}

export async function flagContent(
  input: FlagInput,
  flaggerId: string
): Promise<ModerationRecord> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  if (!input.reason?.trim()) throw new Error('Flag reason is required');

  const rec = await insert('moderation_logs', {
    content_type: input.content_type,
    content_id: input.content_id,
    author_id: input.author_id || null,
    status: 'pending',
    flag_reason: input.reason.trim(),
    reviewer_id: null,
    review_notes: null,
    reviewed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  return rec as ModerationRecord;
}

export async function reviewContent(
  id: string,
  input: ReviewInput,
  reviewerId: string
): Promise<ModerationRecord> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

  const updates: Record<string, any> = {
    status: input.status,
    reviewer_id: reviewerId,
    review_notes: input.notes || null,
    reviewed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const result = await update('moderation_logs', { column: 'id', value: id }, updates);
  const updated = result[0];
  if (!updated) throw new Error('Moderation record not found');

  return updated as ModerationRecord;
}

export async function removeContent(
  id: string,
  reviewerId: string,
  reason: string
): Promise<ModerationRecord> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

  const updates: Record<string, any> = {
    status: 'removed',
    reviewer_id: reviewerId,
    review_notes: reason,
    reviewed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const result = await update('moderation_logs', { column: 'id', value: id }, updates);
  const updated = result[0];
  if (!updated) throw new Error('Moderation record not found');

  return updated as ModerationRecord;
}

export async function restoreContent(
  id: string,
  reviewerId: string,
  reason: string
): Promise<ModerationRecord> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

  const updates: Record<string, any> = {
    status: 'approved',
    reviewer_id: reviewerId,
    review_notes: `Restored: ${reason}`,
    reviewed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const result = await update('moderation_logs', { column: 'id', value: id }, updates);
  const updated = result[0];
  if (!updated) throw new Error('Moderation record not found');

  return updated as ModerationRecord;
}

export async function getModerationStats(): Promise<{
  pending: number;
  approved: number;
  rejected: number;
  removed: number;
  total_today: number;
}> {
  if (!isSupabaseConfigured()) {
    return { pending: 0, approved: 0, rejected: 0, removed: 0, total_today: 0 };
  }

  const all = await selectMany('moderation_logs', { select: 'id,status,created_at' });
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return {
    pending: all.filter((r: any) => r.status === 'pending').length,
    approved: all.filter((r: any) => r.status === 'approved').length,
    rejected: all.filter((r: any) => r.status === 'rejected').length,
    removed: all.filter((r: any) => r.status === 'removed').length,
    total_today: all.filter((r: any) => new Date(r.created_at) >= today).length,
  };
}
