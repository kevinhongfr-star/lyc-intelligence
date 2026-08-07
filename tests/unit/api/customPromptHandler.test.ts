import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockSelectMany = vi.fn();
const mockSelectOne = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockRemove = vi.fn();
const mockIsConfigured = vi.fn();

vi.mock('../../../api/_lib/supabaseRest', () => ({
  selectMany: (...args: any[]) => mockSelectMany(...args),
  selectOne: (...args: any[]) => mockSelectOne(...args),
  insert: (...args: any[]) => mockInsert(...args),
  update: (...args: any[]) => mockUpdate(...args),
  remove: (...args: any[]) => mockRemove(...args),
  isSupabaseConfigured: () => mockIsConfigured(),
  handleError: vi.fn((res: any, _: string, err: any) => res.status(500).json({ success: false, error: String(err) })),
}));

vi.mock('../../../api/_lib/adminAuth', () => ({
  getUserFromRequest: vi.fn(() => ({ user: { id: 'test_user', role: 'admin' }, error: null })),
}));

import { handleCustomPrompt } from '../../../api/_lib/customPromptHandler';

function createMockReq(method: string, body?: any, query: any = { path: [] }) {
  return { method, body, query, headers: {} } as any;
}

function createMockRes() {
  const res: any = {
    statusCode: 200,
    headers: {},
    status: vi.fn().mockImplementation(function(code: number) { this.statusCode = code; return this; }),
    json: vi.fn().mockImplementation(function(data: any) { this.body = data; return this; }),
    setHeader: vi.fn(),
  };
  return res;
}

describe('customPromptHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsConfigured.mockReturnValue(true);
  });

  it('returns 500 when not configured', async () => {
    mockIsConfigured.mockReturnValue(false);
    const req = createMockReq('GET');
    const res = createMockRes();
    await handleCustomPrompt(req, res);
    expect(res.statusCode).toBe(500);
  });

  it('lists prompts for user', async () => {
    mockSelectMany.mockResolvedValue([
      { id: 'p1', name: 'Test Prompt', content: 'Hello {name}', variables: ['name'], version: 1 },
    ]);
    const req = createMockReq('GET', undefined, { path: [] });
    const res = createMockRes();
    await handleCustomPrompt(req, res);
    expect(res.body.prompts).toHaveLength(1);
  });

  it('creates a new prompt with version', async () => {
    mockInsert.mockResolvedValue({ id: 'prmpt_123', name: 'New', version: 1 });
    const req = createMockReq('POST', {
      name: 'New',
      content: 'Hello {name}, welcome to {company}',
      category: 'general',
    }, { path: [] });
    const res = createMockRes();
    await handleCustomPrompt(req, res);
    expect(res.statusCode).toBe(201);
    expect(mockInsert).toHaveBeenCalledWith('custom_prompts', expect.objectContaining({
      name: 'New',
      variables: ['name', 'company'],
      version: 1,
    }));
    expect(mockInsert).toHaveBeenCalledWith('prompt_versions', expect.objectContaining({
      version: 1,
    }));
  });

  it('extracts variables from content', async () => {
    mockInsert.mockResolvedValue({ id: 'prmpt_1' });
    const req = createMockReq('POST', {
      name: 'Var Test',
      content: '{greeting} {name}! Your score is {score}.',
    }, { path: [] });
    const res = createMockRes();
    await handleCustomPrompt(req, res);
    const callArgs = mockInsert.mock.calls.find(c => c[0] === 'custom_prompts');
    expect(callArgs[1].variables).toEqual(['greeting', 'name', 'score']);
  });

  it('updates a prompt creating new version', async () => {
    mockSelectOne.mockResolvedValue({ id: 'p1', user_id: 'test_user', version: 2, content: 'old' });
    mockUpdate.mockResolvedValue({ id: 'p1', version: 3 });
    const req = createMockReq('PUT', { content: 'new content' }, { path: ['p1'] });
    const res = createMockRes();
    await handleCustomPrompt(req, res);
    expect(mockUpdate).toHaveBeenCalledWith('custom_prompts', { column: 'id', value: 'p1' }, expect.objectContaining({ version: 3 }));
  });

  it('prevents updating another users prompt', async () => {
    mockSelectOne.mockResolvedValue({ id: 'p1', user_id: 'other_user', version: 1 });
    const req = createMockReq('PUT', { content: 'new' }, { path: ['p1'] });
    const res = createMockRes();
    await handleCustomPrompt(req, res);
    expect(res.statusCode).toBe(403);
  });

  it('deletes a prompt', async () => {
    mockSelectOne.mockResolvedValue({ id: 'p1', user_id: 'test_user' });
    mockRemove.mockResolvedValue({});
    const req = createMockReq('DELETE', undefined, { path: ['p1'] });
    const res = createMockRes();
    await handleCustomPrompt(req, res);
    expect(res.body.deleted).toBe(true);
  });

  it('activates a specific version', async () => {
    mockSelectOne
      .mockResolvedValueOnce({ id: 'p1', user_id: 'test_user' })
      .mockResolvedValueOnce({ id: 'v2', version: 2, content: 'v2 content', variables: ['x'] });
    mockUpdate.mockResolvedValue({});
    const req = createMockReq('POST', { version_id: 'v2' }, { path: ['p1', 'activate'] });
    const res = createMockRes();
    await handleCustomPrompt(req, res);
    expect(res.body.activated_version).toBe(2);
  });
});