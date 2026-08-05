/**
 * Tests for v1Client — fetch wrapper for /api/v1/*.
 *
 * Mocks `globalThis.fetch` and asserts:
 *   - URL is prefixed with /api/v1
 *   - credentials: 'include' is always sent
 *   - JSON body is encoded
 *   - Success envelope is stripped to `data`
 *   - Non-2xx responses throw V1ApiError with status + meta
 *   - Network errors throw V1ApiError with status 0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { v1Client } from '../v1Client';
import { V1ApiError } from '../types';

type FetchMock = ReturnType<typeof vi.fn>;

function makeResponse(body: unknown, init: { status: number; ok: boolean }): Response {
  return {
    ok: init.ok,
    status: init.status,
    json: async () => body,
  } as unknown as Response;
}

describe('v1Client', () => {
  let fetchMock: FetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prefixes path with /api/v1 and sends credentials: include', async () => {
    fetchMock.mockResolvedValue(
      makeResponse({ success: true, data: { ok: true } }, { status: 200, ok: true }),
    );

    await v1Client.get('/health');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/v1/health');
    expect(init.credentials).toBe('include');
    expect(init.method).toBe('GET');
  });

  it('strips the envelope and returns data', async () => {
    fetchMock.mockResolvedValue(
      makeResponse(
        { success: true, data: { id: 1, name: 'Test' }, meta: { source: 'cache' } },
        { status: 200, ok: true },
      ),
    );

    const result = await v1Client.get('/items');
    expect(result).toEqual({ id: 1, name: 'Test' });
  });

  it('encodes JSON body and sets Content-Type for POST', async () => {
    fetchMock.mockResolvedValue(
      makeResponse({ success: true, data: { id: 1 } }, { status: 201, ok: true }),
    );

    await v1Client.post('/items', { name: 'New' });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' });
    expect(init.body).toBe(JSON.stringify({ name: 'New' }));
  });

  it('encodes query params into the URL', async () => {
    fetchMock.mockResolvedValue(
      makeResponse({ success: true, data: [] }, { status: 200, ok: true }),
    );

    await v1Client.get('/items', { params: { page: 2, page_size: 10, q: 'foo' } });

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/api/v1/items?');
    expect(url).toContain('page=2');
    expect(url).toContain('page_size=10');
    expect(url).toContain('q=foo');
  });

  it('skips undefined/null params', async () => {
    fetchMock.mockResolvedValue(
      makeResponse({ success: true, data: [] }, { status: 200, ok: true }),
    );

    await v1Client.get('/items', { params: { page: 1, q: undefined, sort: null } });

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/v1/items?page=1');
  });

  it('throws V1ApiError with status + message on non-2xx', async () => {
    fetchMock.mockResolvedValue(
      makeResponse(
        { success: false, error: 'Forbidden', meta: { code: 'forbidden' } },
        { status: 403, ok: false },
      ),
    );

    await expect(v1Client.get('/secret')).rejects.toMatchObject({
      name: 'V1ApiError',
      status: 403,
      message: 'Forbidden',
      code: 'forbidden',
    });
  });

  it('throws V1ApiError with status 0 on network failure', async () => {
    fetchMock.mockRejectedValue(new Error('Network down'));

    await expect(v1Client.get('/items')).rejects.toMatchObject({
      name: 'V1ApiError',
      status: 0,
    });
  });

  it('throws V1ApiError when response is not valid JSON', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    } as unknown as Response);

    await expect(v1Client.get('/items')).rejects.toBeInstanceOf(V1ApiError);
  });

  it('PUT/PATCH/DELETE use the right HTTP methods', async () => {
    fetchMock.mockResolvedValue(
      makeResponse({ success: true, data: { ok: true } }, { status: 200, ok: true }),
    );

    await v1Client.put('/items/1', { name: 'Updated' });
    await v1Client.patch('/items/1', { name: 'Patched' });
    await v1Client.delete('/items/1');

    const methods = fetchMock.mock.calls.map((c) => (c[1] as RequestInit).method);
    expect(methods).toEqual(['PUT', 'PATCH', 'DELETE']);
  });
});
