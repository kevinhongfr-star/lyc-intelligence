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

import { handleDocUpload } from '../../../api/_lib/docUploadHandler';

function createMockReq(method: string, body?: any, query: any = { path: [] }) {
  return {
    method,
    body,
    query,
    headers: {},
  } as any;
}

function createMockRes() {
  const res: any = {
    statusCode: 200,
    headers: {},
    status: vi.fn().mockImplementation(function(code: number) {
      this.statusCode = code;
      return this;
    }),
    json: vi.fn().mockImplementation(function(data: any) {
      this.body = data;
      return this;
    }),
    setHeader: vi.fn(),
  };
  return res;
}

describe('docUploadHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsConfigured.mockReturnValue(true);
  });

  it('returns 500 when not configured', async () => {
    mockIsConfigured.mockReturnValue(false);
    const req = createMockReq('GET');
    const res = createMockRes();
    await handleDocUpload(req, res);
    expect(res.statusCode).toBe(500);
  });

  it('lists documents for authenticated user', async () => {
    mockSelectMany.mockResolvedValue([
      { id: 'd1', filename: 'test.pdf', file_type: 'application/pdf', file_size: 1024, status: 'parsed', created_at: '2026-01-01' },
    ]);
    const req = createMockReq('GET', undefined, { path: [] });
    const res = createMockRes();
    await handleDocUpload(req, res);
    expect(res.body.success).toBe(true);
    expect(res.body.documents).toHaveLength(1);
  });

  it('uploads a document with valid file type', async () => {
    mockInsert.mockResolvedValue({ id: 'doc_123', filename: 'test.pdf', status: 'parsed' });
    const req = createMockReq('POST', {
      fileName: 'test.pdf',
      fileType: 'application/pdf',
      fileSize: 1024,
      fileBase64: 'dGVzdA==',
    }, { path: ['upload'] });
    const res = createMockRes();
    await handleDocUpload(req, res);
    expect(res.body.success).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith('documents', expect.objectContaining({
      filename: 'test.pdf',
      file_type: 'application/pdf',
      status: 'parsed',
    }));
  });

  it('rejects upload with invalid file type', async () => {
    const req = createMockReq('POST', {
      fileName: 'test.exe',
      fileType: 'application/x-msdownload',
      fileSize: 1024,
    }, { path: ['upload'] });
    const res = createMockRes();
    await handleDocUpload(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('rejects upload exceeding size limit', async () => {
    const req = createMockReq('POST', {
      fileName: 'big.pdf',
      fileType: 'application/pdf',
      fileSize: 30 * 1024 * 1024,
    }, { path: ['upload'] });
    const res = createMockRes();
    await handleDocUpload(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('gets document by id', async () => {
    mockSelectOne.mockResolvedValue({ id: 'd1', filename: 'test.pdf' });
    const req = createMockReq('GET', undefined, { path: ['documents', 'd1'] });
    const res = createMockRes();
    await handleDocUpload(req, res);
    expect(res.body.document).toBeDefined();
  });

  it('returns 404 for non-existent document', async () => {
    mockSelectOne.mockResolvedValue(null);
    const req = createMockReq('GET', undefined, { path: ['documents', 'nonexistent'] });
    const res = createMockRes();
    await handleDocUpload(req, res);
    expect(res.statusCode).toBe(404);
  });

  it('deletes a document', async () => {
    mockSelectOne.mockResolvedValue({ id: 'd1', user_id: 'test_user' });
    mockRemove.mockResolvedValue({});
    const req = createMockReq('DELETE', undefined, { path: ['documents', 'd1'] });
    const res = createMockRes();
    await handleDocUpload(req, res);
    expect(res.body.success).toBe(true);
    expect(mockRemove).toHaveBeenCalledWith('documents', { column: 'id', value: 'd1' });
  });

  it('prevents deleting another user document', async () => {
    mockSelectOne.mockResolvedValue({ id: 'd1', user_id: 'other_user' });
    const req = createMockReq('DELETE', undefined, { path: ['documents', 'd1'] });
    const res = createMockRes();
    await handleDocUpload(req, res);
    expect(res.statusCode).toBe(403);
  });

  it('returns document preview', async () => {
    mockSelectOne.mockResolvedValue({
      id: 'd1',
      extracted_text: 'Sample content',
      parsed_content: null,
      metadata: { pages: 5 },
    });
    const req = createMockReq('GET', undefined, { path: ['documents', 'd1', 'preview'] });
    const res = createMockRes();
    await handleDocUpload(req, res);
    expect(res.body.preview.content).toBe('Sample content');
  });
});