// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../api/_lib/supabaseRest.js', () => ({
  selectOne: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  selectMany: vi.fn(),
}));

import {
  trackMilestone,
  getUserMilestones,
  getSessionMilestones,
  computeMilestoneProgress,
  getNextMilestone,
  MILESTONE_ORDER,
  type Milestone,
  type MilestoneType,
} from '../../../api/_lib/nexusMilestoneTracker.js';
import { selectOne, insert, update, selectMany } from '../../../api/_lib/supabaseRest.js';

const mockSelectOne = vi.mocked(selectOne);
const mockInsert = vi.mocked(insert);
const mockUpdate = vi.mocked(update);
const mockSelectMany = vi.mocked(selectMany);

beforeEach(() => {
  vi.clearAllMocks();
});

function makeMilestone(overrides: Partial<Milestone> = {}): Milestone {
  return {
    id: 'ms-1',
    user_id: 'user-1',
    session_id: 'sess-1',
    milestone: 'goal_defined',
    created_at: '2026-08-06T10:00:00Z',
    metadata: null,
    ...overrides,
  };
}

describe('MILESTONE_ORDER', () => {
  it('contains all expected milestone types', () => {
    expect(MILESTONE_ORDER).toEqual([
      'goal_defined',
      'diagnostic_started',
      'diagnostic_complete',
      'solution_path',
      'next_steps',
      'assessment_completed',
      'deliverable_generated',
      'coaching_session',
    ]);
  });

  it('has 8 milestone types', () => {
    expect(MILESTONE_ORDER).toHaveLength(8);
  });
});

describe('trackMilestone', () => {
  it('inserts a milestone and returns the row', async () => {
    const row = makeMilestone();
    mockInsert.mockResolvedValue(row);

    const result = await trackMilestone('user-1', 'sess-1', 'goal_defined');

    expect(insert).toHaveBeenCalledWith('nexus_milestones', {
      user_id: 'user-1',
      session_id: 'sess-1',
      milestone: 'goal_defined',
      metadata: null,
    });
    expect(result).toEqual(row);
  });

  it('passes metadata when provided', async () => {
    const row = makeMilestone({ metadata: { note: 'test' } });
    mockInsert.mockResolvedValue(row);

    await trackMilestone('user-1', 'sess-1', 'goal_defined', { note: 'test' });

    expect(insert).toHaveBeenCalledWith('nexus_milestones', {
      user_id: 'user-1',
      session_id: 'sess-1',
      milestone: 'goal_defined',
      metadata: { note: 'test' },
    });
  });

  it('defaults metadata to null when not provided', async () => {
    mockInsert.mockResolvedValue(makeMilestone());

    await trackMilestone('user-1', 'sess-1', 'diagnostic_started');

    expect(insert).toHaveBeenCalledWith('nexus_milestones', {
      user_id: 'user-1',
      session_id: 'sess-1',
      milestone: 'diagnostic_started',
      metadata: null,
    });
  });

  it('inserts with all valid milestone types', async () => {
    const types: MilestoneType[] = [
      'goal_defined', 'diagnostic_started', 'diagnostic_complete',
      'solution_path', 'next_steps', 'assessment_completed',
      'deliverable_generated', 'coaching_session',
    ];
    for (const type of types) {
      const row = makeMilestone({ milestone: type });
      mockInsert.mockResolvedValue(row);
      const result = await trackMilestone('user-1', 'sess-1', type);
      expect(result.milestone).toBe(type);
    }
  });

  it('throws when insert fails', async () => {
    mockInsert.mockRejectedValue(new Error('DB error'));
    await expect(trackMilestone('user-1', 'sess-1', 'goal_defined')).rejects.toThrow('DB error');
  });
});

describe('getUserMilestones', () => {
  it('returns milestones for a user ordered by created_at descending', async () => {
    const rows = [
      makeMilestone({ id: 'ms-2', milestone: 'diagnostic_complete', created_at: '2026-08-06T12:00:00Z' }),
      makeMilestone({ id: 'ms-1', milestone: 'goal_defined', created_at: '2026-08-06T10:00:00Z' }),
    ];
    mockSelectMany.mockResolvedValue(rows);

    const result = await getUserMilestones('user-1');

    expect(selectMany).toHaveBeenCalledWith('nexus_milestones', {
      where: [{ column: 'user_id', value: 'user-1' }],
      orderBy: { column: 'created_at', ascending: false },
    });
    expect(result).toHaveLength(2);
  });

  it('returns empty array when user has no milestones', async () => {
    mockSelectMany.mockResolvedValue(null);

    const result = await getUserMilestones('user-1');
    expect(result).toEqual([]);
  });

  it('returns empty array when selectMany returns null', async () => {
    mockSelectMany.mockResolvedValue(null);
    const result = await getUserMilestones('user-1');
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it('returns empty array when selectMany returns undefined', async () => {
    mockSelectMany.mockResolvedValue(undefined);
    const result = await getUserMilestones('user-1');
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });
});

describe('getSessionMilestones', () => {
  it('returns milestones for a session ordered by created_at ascending', async () => {
    const rows = [
      makeMilestone({ id: 'ms-1', milestone: 'goal_defined' }),
      makeMilestone({ id: 'ms-2', milestone: 'diagnostic_started' }),
    ];
    mockSelectMany.mockResolvedValue(rows);

    const result = await getSessionMilestones('sess-1');

    expect(selectMany).toHaveBeenCalledWith('nexus_milestones', {
      where: [{ column: 'session_id', value: 'sess-1' }],
      orderBy: { column: 'created_at', ascending: true },
    });
    expect(result).toHaveLength(2);
  });

  it('returns empty array for session with no milestones', async () => {
    mockSelectMany.mockResolvedValue(null);
    const result = await getSessionMilestones('empty-sess');
    expect(result).toEqual([]);
  });

  it('filters by session_id correctly', async () => {
    const rows = [makeMilestone({ session_id: 'sess-1' })];
    mockSelectMany.mockResolvedValue(rows);

    await getSessionMilestones('sess-1');

    expect(selectMany).toHaveBeenCalledWith(
      'nexus_milestones',
      expect.objectContaining({
        where: [{ column: 'session_id', value: 'sess-1' }],
      })
    );
  });
});

describe('computeMilestoneProgress', () => {
  it('returns 0 for empty array', () => {
    expect(computeMilestoneProgress([])).toBe(0);
  });

  it('returns 0 for null/undefined input', () => {
    expect(computeMilestoneProgress(null as any)).toBe(0);
    expect(computeMilestoneProgress(undefined as any)).toBe(0);
  });

  it('returns 12.5 for one milestone (1/8)', () => {
    const milestones = [makeMilestone({ milestone: 'goal_defined' })];
    expect(computeMilestoneProgress(milestones)).toBe(13);
  });

  it('returns 25 for two milestones (2/8)', () => {
    const milestones: Milestone[] = [
      makeMilestone({ milestone: 'goal_defined' }),
      makeMilestone({ milestone: 'diagnostic_started' }),
    ];
    expect(computeMilestoneProgress(milestones)).toBe(25);
  });

  it('returns 100 for all milestones complete', () => {
    const allTypes: MilestoneType[] = [
      'goal_defined', 'diagnostic_started', 'diagnostic_complete',
      'solution_path', 'next_steps', 'assessment_completed',
      'deliverable_generated', 'coaching_session',
    ];
    const milestones = allTypes.map((t, i) =>
      makeMilestone({ id: `ms-${i}`, milestone: t })
    );
    expect(computeMilestoneProgress(milestones)).toBe(100);
  });

  it('returns percentage rounded to nearest integer', () => {
    const milestones: Milestone[] = [
      makeMilestone({ milestone: 'goal_defined' }),
      makeMilestone({ milestone: 'diagnostic_started' }),
      makeMilestone({ milestone: 'diagnostic_complete' }),
      makeMilestone({ milestone: 'solution_path' }),
    ];
    const progress = computeMilestoneProgress(milestones);
    expect(progress).toBeGreaterThanOrEqual(0);
    expect(progress).toBeLessThanOrEqual(100);
    expect(Number.isInteger(progress)).toBe(true);
  });

  it('does not double-count duplicate milestones of same type', () => {
    const milestones: Milestone[] = [
      makeMilestone({ id: 'ms-1', milestone: 'goal_defined' }),
      makeMilestone({ id: 'ms-2', milestone: 'goal_defined' }),
    ];
    expect(computeMilestoneProgress(milestones)).toBe(13);
  });
});

describe('getNextMilestone', () => {
  it('returns first milestone when no milestones achieved', () => {
    expect(getNextMilestone([])).toBe('goal_defined');
  });

  it('returns first milestone for null/undefined input', () => {
    expect(getNextMilestone(null as any)).toBe('goal_defined');
    expect(getNextMilestone(undefined as any)).toBe('goal_defined');
  });

  it('returns goal_defined when only diagnostic_started is achieved', () => {
    const milestones: Milestone[] = [
      makeMilestone({ milestone: 'diagnostic_started' }),
    ];
    expect(getNextMilestone(milestones)).toBe('goal_defined');
  });

  it('returns diagnostic_started after goal_defined', () => {
    const milestones: Milestone[] = [
      makeMilestone({ milestone: 'goal_defined' }),
    ];
    expect(getNextMilestone(milestones)).toBe('diagnostic_started');
  });

  it('returns diagnostic_complete after diagnostic_started', () => {
    const milestones: Milestone[] = [
      makeMilestone({ milestone: 'goal_defined' }),
      makeMilestone({ milestone: 'diagnostic_started' }),
    ];
    expect(getNextMilestone(milestones)).toBe('diagnostic_complete');
  });

  it('returns solution_path after diagnostic_complete', () => {
    const milestones: Milestone[] = [
      makeMilestone({ milestone: 'goal_defined' }),
      makeMilestone({ milestone: 'diagnostic_started' }),
      makeMilestone({ milestone: 'diagnostic_complete' }),
    ];
    expect(getNextMilestone(milestones)).toBe('solution_path');
  });

  it('returns next_steps after solution_path', () => {
    const milestones: Milestone[] = [
      makeMilestone({ milestone: 'goal_defined' }),
      makeMilestone({ milestone: 'diagnostic_started' }),
      makeMilestone({ milestone: 'diagnostic_complete' }),
      makeMilestone({ milestone: 'solution_path' }),
    ];
    expect(getNextMilestone(milestones)).toBe('next_steps');
  });

  it('returns null when all milestones achieved', () => {
    const allTypes: MilestoneType[] = [
      'goal_defined', 'diagnostic_started', 'diagnostic_complete',
      'solution_path', 'next_steps', 'assessment_completed',
      'deliverable_generated', 'coaching_session',
    ];
    const milestones = allTypes.map((t, i) =>
      makeMilestone({ id: `ms-${i}`, milestone: t })
    );
    expect(getNextMilestone(milestones)).toBeNull();
  });

  it('skips already-achieved milestones in order', () => {
    const milestones: Milestone[] = [
      makeMilestone({ milestone: 'goal_defined' }),
      makeMilestone({ milestone: 'diagnostic_started' }),
      makeMilestone({ milestone: 'diagnostic_complete' }),
      makeMilestone({ milestone: 'solution_path' }),
      makeMilestone({ milestone: 'next_steps' }),
      makeMilestone({ milestone: 'assessment_completed' }),
      makeMilestone({ milestone: 'deliverable_generated' }),
    ];
    expect(getNextMilestone(milestones)).toBe('coaching_session');
  });

  it('returns first unachieved milestone regardless of order in array', () => {
    const milestones: Milestone[] = [
      makeMilestone({ milestone: 'diagnostic_complete' }),
      makeMilestone({ milestone: 'goal_defined' }),
    ];
    expect(getNextMilestone(milestones)).toBe('diagnostic_started');
  });
});