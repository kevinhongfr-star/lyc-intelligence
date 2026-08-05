/**
 * Tests for the v1 auth endpoints — login / signup / logout / me / reset-password.
 *
 * These are Node-environment unit tests (no DOM). They mock:
 *   - global `fetch` (Supabase Auth REST responses)
 *   - `supabaseRest` (isSupabaseConfigured / selectOne / insert — profile layer)
 *   - `audit` (no-op logAuditEvent + fixed ip/ua helpers)
 *   - `auth.resolveUser` (kept real except where we override per-test for
 *     /auth/me + /auth/logout, since those depend on cookie resolution)
 *
 * `AUTH_COOKIE_NAME` + the `V1AuthUser`/`UserType` types are kept real so the
 * cookie assertions use the same name the production code writes.
 */
// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Module mocks (hoisted) ───────────────────────────────────────
// supabaseRest — profile layer + config flag.
vi.mock('../../../api/_lib/supabaseRest.js', () => ({
  isSupabaseConfigured: vi.fn(() => true),
  selectOne: vi.fn(),
  insert: vi.fn(),
}));

// audit — silence logging + provide stable ip/ua.
vi.mock('../../../api/_lib/v1/audit.js', () => ({
  logAuditEvent: vi.fn().mockResolvedValue(true),
  getClientIp: () => '127.0.0.1',
  getUserAgent: () => 'vitest',
}));

// auth — keep everything real EXCEPT resolveUser (overridden per-test).
vi.mock('../../../api/_lib/v1/auth.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api/_lib/v1/auth.js')>();
  return { ...actual, resolveUser: vi.fn() };
});

// logging — silence warn/info.
vi.mock('../../../api/_lib/v1/logging.js', () => ({
  logWarn: vi.fn(),
  logInfo: vi.fn(),
  logError: vi.fn(),
}));

import { isSupabaseConfigured, selectOne, insert } from '../../../api/_lib/supabaseRest.js';
import { resolveUser, AUTH_COOKIE_NAME, type V1AuthUser } from '../../../api/_lib/v1/auth.js';
import {
  handleAuthLogin,
  handleAuthSignup,
  handleAuthLogout,
  handleAuthMe,
  handleAuthResetPassword,
} from '../../../api/_lib/v1/authEndpoints.js';

// ─── Test fixtures ────────────────────────────────────────────────

const SAMPLE_USER: V1AuthUser = {
  id: 'user-1',
  email: 'test@example.com',
  role: 'member',
  user_type: 'b2c',
};

interface MockRes {
  statusCode: number;
  body: unknown;
  headers: Record<string, string | string[]>;
  status(code: number): MockRes;
  json(data: unknown): MockRes;
  setHeader(name: string, value: string | string[]): void;
  end(): void;
}

function mockRes(): MockRes {
  const r: MockRes = {
    statusCode: 200,
    body: undefined,
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
    },
    end() {
      /* noop */
    },
  };
  return r;
}

function mockReq(opts: {
  method?: string;
  body?: unknown;
  authorization?: string;
  cookie?: string;
  headers?: Record<string, string>;
}): unknown {
  const headers: Record<string, string> = { ...(opts.headers ?? {}) };
  if (opts.authorization) headers.authorization = opts.authorization;
  if (opts.cookie) headers.cookie = opts.cookie;
  return {
    method: opts.method ?? 'POST',
    body: opts.body ?? {},
    headers,
    query: {},
  };
}

function jsonResponse(ok: boolean, status: number, data: unknown): Response {
  return {
    ok,
    status,
    json: async () => data,
  } as Response;
}

// ─── Setup / teardown ─────────────────────────────────────────────

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isSupabaseConfigured).mockReturnValue(true);
  vi.mocked(resolveUser).mockResolvedValue({ user: null, error: 'Unauthorized', status: 401 });

  process.env.SUPABASE_URL = 'https://test.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'test-anon-key';
  process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
  process.env.NODE_ENV = 'test';

  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ─── handleAuthLogin ──────────────────────────────────────────────

describe('handleAuthLogin', () => {
  it('sets the httpOnly cookie + returns the user on valid credentials', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(true, 200, {
        access_token: 'jwt-abc',
        refresh_token: 'rfr',
        user: { id: 'user-1', email: 'test@example.com' },
      }),
    );
    vi.mocked(selectOne).mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      role: 'member',
      user_type: 'b2c',
    });

    const req = mockReq({ method: 'POST', body: { email: 'test@example.com', password: 'secret' } });
    const res = mockRes();

    await handleAuthLogin(req as never, res as never);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ success: true, data: { user: SAMPLE_USER } });

    const cookie = res.headers['Set-Cookie'] as string;
    expect(cookie).toContain(`${AUTH_COOKIE_NAME}=jwt-abc`);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Path=/');

    // fetch was called against the password-grant endpoint with the anon apikey.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body).toEqual({ email: 'test@example.com', password: 'secret' });
    const headers = init.headers as Record<string, string>;
    expect(headers.apikey).toBe('test-anon-key');
  });

  it('returns 401 on invalid credentials', async () => {
    fetchMock.mockResolvedValue(jsonResponse(false, 400, { error: 'invalid_grant' }));

    const req = mockReq({ method: 'POST', body: { email: 'x@example.com', password: 'wrong' } });
    const res = mockRes();

    await handleAuthLogin(req as never, res as never);

    expect(res.statusCode).toBe(401);
    expect((res.body as { error: string }).error).toMatch(/Invalid email or password/i);
    expect(res.headers['Set-Cookie']).toBeUndefined();
  });

  it('returns 400 when the body fails validation', async () => {
    const req = mockReq({ method: 'POST', body: { email: 'not-an-email', password: '' } });
    const res = mockRes();

    await handleAuthLogin(req as never, res as never);

    expect(res.statusCode).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns 500 when supabase is not configured', async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(false);

    const req = mockReq({ method: 'POST', body: { email: 'a@b.c', password: 'secret' } });
    const res = mockRes();

    await handleAuthLogin(req as never, res as never);

    expect(res.statusCode).toBe(500);
  });

  it('creates a profile when none exists (lazy ensureProfile)', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(true, 200, {
        access_token: 'jwt-abc',
        refresh_token: 'rfr',
        user: { id: 'new-user', email: 'new@example.com' },
      }),
    );
    vi.mocked(selectOne).mockResolvedValue(null);
    vi.mocked(insert).mockResolvedValue({ id: 'new-user', role: 'member', user_type: 'b2c' });

    const req = mockReq({ method: 'POST', body: { email: 'new@example.com', password: 'secret' } });
    const res = mockRes();

    await handleAuthLogin(req as never, res as never);

    expect(res.statusCode).toBe(200);
    expect(insert).toHaveBeenCalledWith(
      'profiles',
      expect.objectContaining({ id: 'new-user', role: 'member', user_type: 'b2c' }),
    );
    const data = (res.body as { data: { user: V1AuthUser } }).data.user;
    expect(data.id).toBe('new-user');
    expect(data.user_type).toBe('b2c');
  });
});

// ─── handleAuthSignup ─────────────────────────────────────────────

describe('handleAuthSignup', () => {
  it('creates the user + profile, sets cookie when a session is returned', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(true, 200, {
        user: { id: 'new-user', email: 'new@example.com', email_confirmed_at: '2026-01-01' },
        session: { access_token: 'jwt-signup', refresh_token: 'rfr' },
      }),
    );
    vi.mocked(selectOne).mockResolvedValue(null);
    vi.mocked(insert).mockResolvedValue({ id: 'new-user', role: 'member', user_type: 'candidate' });

    const req = mockReq({
      method: 'POST',
      body: { email: 'new@example.com', password: 'password123', name: 'New User', user_type: 'candidate' },
    });
    const res = mockRes();

    await handleAuthSignup(req as never, res as never);

    expect(res.statusCode).toBe(200);
    const cookie = res.headers['Set-Cookie'] as string;
    expect(cookie).toContain(`${AUTH_COOKIE_NAME}=jwt-signup`);

    const data = (res.body as { data: { user: V1AuthUser } }).data.user;
    expect(data.user_type).toBe('candidate');

    // insert received the requested user_type
    expect(insert).toHaveBeenCalledWith(
      'profiles',
      expect.objectContaining({ user_type: 'candidate', name: 'New User' }),
    );
  });

  it('does NOT set a cookie when no session is returned (email confirmation required)', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(true, 200, {
        user: { id: 'new-user', email: 'new@example.com', email_confirmed_at: null },
        session: null,
      }),
    );
    vi.mocked(selectOne).mockResolvedValue(null);
    vi.mocked(insert).mockResolvedValue({ id: 'new-user', role: 'member', user_type: 'b2c' });

    const req = mockReq({
      method: 'POST',
      body: { email: 'new@example.com', password: 'password123', name: 'New User' },
    });
    const res = mockRes();

    await handleAuthSignup(req as never, res as never);

    expect(res.statusCode).toBe(200);
    expect(res.headers['Set-Cookie']).toBeUndefined();
  });

  it('returns 400 when supabase rejects the signup', async () => {
    fetchMock.mockResolvedValue(jsonResponse(false, 400, { msg: 'User already registered' }));

    const req = mockReq({
      method: 'POST',
      body: { email: 'dup@example.com', password: 'password123', name: 'Dup' },
    });
    const res = mockRes();

    await handleAuthSignup(req as never, res as never);

    expect(res.statusCode).toBe(400);
    expect((res.body as { error: string }).error).toBe('User already registered');
  });

  it('returns 400 when the password is too short', async () => {
    const req = mockReq({
      method: 'POST',
      body: { email: 'a@b.c', password: 'short', name: 'A' },
    });
    const res = mockRes();

    await handleAuthSignup(req as never, res as never);

    expect(res.statusCode).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reuses an existing profile if one already exists', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(true, 200, {
        user: { id: 'existing', email: 'e@example.com' },
        session: { access_token: 'jwt', refresh_token: 'r' },
      }),
    );
    vi.mocked(selectOne).mockResolvedValue({
      id: 'existing',
      email: 'e@example.com',
      role: 'team_lead',
      user_type: 'internal',
    });

    const req = mockReq({
      method: 'POST',
      body: { email: 'e@example.com', password: 'password123', name: 'E' },
    });
    const res = mockRes();

    await handleAuthSignup(req as never, res as never);

    expect(insert).not.toHaveBeenCalled();
    const data = (res.body as { data: { user: V1AuthUser } }).data.user;
    expect(data.role).toBe('team_lead');
    expect(data.user_type).toBe('internal');
  });
});

// ─── handleAuthLogout ─────────────────────────────────────────────

describe('handleAuthLogout', () => {
  it('clears the cookie + returns ok:true', async () => {
    vi.mocked(resolveUser).mockResolvedValue({ user: SAMPLE_USER, error: null, status: 200 });

    const req = mockReq({ method: 'POST' });
    const res = mockRes();

    await handleAuthLogout(req as never, res as never);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ success: true, data: { ok: true } });

    const cookie = res.headers['Set-Cookie'] as string;
    expect(cookie).toContain(`${AUTH_COOKIE_NAME}=`);
    expect(cookie).toContain('Max-Age=0');
  });

  it('still clears the cookie when no user is present (no audit)', async () => {
    vi.mocked(resolveUser).mockResolvedValue({ user: null, error: 'Unauthorized', status: 401 });

    const req = mockReq({ method: 'POST' });
    const res = mockRes();

    await handleAuthLogout(req as never, res as never);

    expect(res.statusCode).toBe(200);
    expect(res.headers['Set-Cookie']).toBeDefined();
  });
});

// ─── handleAuthMe ─────────────────────────────────────────────────

describe('handleAuthMe', () => {
  it('returns the user when resolveUser succeeds', async () => {
    vi.mocked(resolveUser).mockResolvedValue({ user: SAMPLE_USER, error: null, status: 200 });

    const req = mockReq({ method: 'GET' });
    const res = mockRes();

    await handleAuthMe(req as never, res as never);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ success: true, data: { user: SAMPLE_USER } });
  });

  it('returns 401 when resolveUser returns no user', async () => {
    vi.mocked(resolveUser).mockResolvedValue({ user: null, error: 'Unauthorized', status: 401 });

    const req = mockReq({ method: 'GET' });
    const res = mockRes();

    await handleAuthMe(req as never, res as never);

    expect(res.statusCode).toBe(401);
    expect((res.body as { success: boolean }).success).toBe(false);
  });
});

// ─── handleAuthResetPassword ──────────────────────────────────────

describe('handleAuthResetPassword', () => {
  it('calls /auth/v1/recover + returns ok:true', async () => {
    fetchMock.mockResolvedValue(jsonResponse(true, 200, {}));

    const req = mockReq({ method: 'POST', body: { email: 'a@example.com' } });
    const res = mockRes();

    await handleAuthResetPassword(req as never, res as never);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ success: true, data: { ok: true } });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/auth/v1/recover');
    expect(JSON.parse(init.body as string)).toEqual({ email: 'a@example.com' });
  });

  it('returns ok:true even when supabase rejects (no account enumeration)', async () => {
    fetchMock.mockResolvedValue(jsonResponse(false, 422, { error: 'user not found' }));

    const req = mockReq({ method: 'POST', body: { email: 'unknown@example.com' } });
    const res = mockRes();

    await handleAuthResetPassword(req as never, res as never);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ success: true, data: { ok: true } });
  });

  it('returns 400 for an invalid email', async () => {
    const req = mockReq({ method: 'POST', body: { email: 'not-an-email' } });
    const res = mockRes();

    await handleAuthResetPassword(req as never, res as never);

    expect(res.statusCode).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

// ─── Cookie helpers (indirect via handlers) ───────────────────────

describe('auth cookie attributes', () => {
  it('marks the cookie Secure in production', async () => {
    process.env.NODE_ENV = 'production';
    process.env.VERCEL_ENV = 'production';

    fetchMock.mockResolvedValue(
      jsonResponse(true, 200, {
        access_token: 'jwt-abc',
        refresh_token: 'rfr',
        user: { id: 'user-1', email: 't@e.com' },
      }),
    );
    vi.mocked(selectOne).mockResolvedValue({
      id: 'user-1',
      email: 't@e.com',
      role: 'member',
      user_type: 'b2c',
    });

    const req = mockReq({ method: 'POST', body: { email: 't@e.com', password: 'secret' } });
    const res = mockRes();

    await handleAuthLogin(req as never, res as never);

    const cookie = res.headers['Set-Cookie'] as string;
    expect(cookie).toContain('Secure');
  });
});
