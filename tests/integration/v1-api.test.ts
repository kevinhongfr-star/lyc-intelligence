/**
 * v1 API integration tests.
 *
 * Tests run against in-memory implementations (rate limiter, cache,
 * validators, RBAC) — the parts that don't need a live Supabase.
 * For Supabase-dependent tests, we mock the REST layer.
 *
 * Run with: node --import tsx --test tests/integration/v1-api.test.ts
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createRateLimiter, _resetRateLimitStore } from '../../api/_lib/v1/rateLimit.js';
import { clearCache, getCache, setCache, getOrSetCache, deleteCachePrefix } from '../../api/_lib/v1/cache.js';
import { hasRole, hasAnyRole, hasUserType, isInternalUser, isAuthorized } from '../../api/_lib/v1/roleCheck.js';
import {
  validateBody,
  validateQuery,
  firstZodError,
  contactCreateSchema,
  paginationSchema,
  uuidSchema,
} from '../../api/_lib/v1/validators.js';
import { sendSuccess, sendError } from '../../api/_lib/v1/response.js';
import { getClientIp, getUserAgent } from '../../api/_lib/v1/audit.js';
import { logInfo } from '../../api/_lib/v1/logging.js';
import type { V1AuthUser } from '../../api/_lib/v1/auth.js';

// ─── Test helpers ─────────────────────────────────────────────────

const UUIDS = {
  contact1: '11111111-1111-4111-8111-111111111111',
  contact2: '22222222-2222-4222-8222-222222222222',
  mandate1: '33333333-3333-4333-8333-333333333333',
  campaign1: '44444444-4444-4444-8444-444444444444',
  user1: '55555555-5555-5555-8555-555555555555',
  user2: '66666666-6666-6666-8666-666666666666',
};

function makeUser(overrides: Partial<V1AuthUser> = {}): V1AuthUser {
  return {
    id: UUIDS.user1,
    email: 'test@example.com',
    role: 'member',
    user_type: 'internal',
    ...overrides,
  };
}

// ─── Rate limiter tests ───────────────────────────────────────────

test('rate limiter: allows requests within limit', () => {
  _resetRateLimitStore();
  const limiter = createRateLimiter(3, 60000);

  limiter('key1');
  limiter('key1');
  const r3 = limiter('key1');
  assert.equal(r3.allowed, true);
  assert.equal(r3.remaining, 0);
});

test('rate limiter: blocks after limit exceeded', () => {
  _resetRateLimitStore();
  const limiter = createRateLimiter(2, 60000);

  limiter('key1');
  limiter('key1');
  const r3 = limiter('key1');
  assert.equal(r3.allowed, false);
  assert.equal(r3.remaining, 0);
  assert.ok(r3.retryAfterMs > 0);
});

test('rate limiter: separate keys are independent', () => {
  _resetRateLimitStore();
  const limiter = createRateLimiter(2, 60000);

  limiter('key1');
  limiter('key1');
  const r1 = limiter('key1'); // should be blocked
  assert.equal(r1.allowed, false);

  const r2 = limiter('key2'); // different key, should be allowed
  assert.equal(r2.allowed, true);
  assert.equal(r2.remaining, 1);
});

// ─── Cache tests ──────────────────────────────────────────────────

test('cache: set and get', () => {
  clearCache();
  setCache('foo', 'bar', 10000);
  assert.equal(getCache<string>('foo'), 'bar');
});

test('cache: returns null for missing key', () => {
  clearCache();
  assert.equal(getCache<string>('nope'), null);
});

test('cache: expires after TTL', async () => {
  clearCache();
  setCache('short', 'lived', 10);
  assert.equal(getCache<string>('short'), 'lived');
  await new Promise((r) => setTimeout(r, 50));
  assert.equal(getCache<string>('short'), null);
});

test('cache: getOrSetCache computes and caches', async () => {
  clearCache();
  let callCount = 0;
  const fn = async () => {
    callCount++;
    return 'computed';
  };

  const v1 = await getOrSetCache('key', 10000, fn);
  assert.equal(v1, 'computed');
  assert.equal(callCount, 1);

  const v2 = await getOrSetCache('key', 10000, fn);
  assert.equal(v2, 'computed');
  assert.equal(callCount, 1); // cached, not called again
});

test('cache: deleteCachePrefix works', () => {
  clearCache();
  setCache('user:1', 'a', 10000);
  setCache('user:2', 'b', 10000);
  setCache('team:1', 'c', 10000);

  const deleted = deleteCachePrefix('user:');
  assert.equal(deleted, 2);
  assert.equal(getCache<string>('user:1'), null);
  assert.equal(getCache<string>('user:2'), null);
  assert.equal(getCache<string>('team:1'), 'c');
});

// ─── RBAC / role check tests ─────────────────────────────────────

test('RBAC: hasRole respects hierarchy', () => {
  const admin = makeUser({ role: 'lyc_admin' });
  const member = makeUser({ role: 'member' });
  const candidate = makeUser({ role: 'candidate' });

  assert.equal(hasRole(admin, 'member'), true);
  assert.equal(hasRole(admin, 'lyc_admin'), true);
  assert.equal(hasRole(admin, 'super_admin'), false);

  assert.equal(hasRole(member, 'member'), true);
  assert.equal(hasRole(member, 'admin'), false);

  assert.equal(hasRole(candidate, 'candidate'), true);
  assert.equal(hasRole(candidate, 'member'), false);
});

test('RBAC: hasAnyRole checks list', () => {
  const consultant = makeUser({ role: 'lyc_consultant' });
  assert.equal(hasAnyRole(consultant, ['super_admin', 'lyc_admin']), false);
  assert.equal(hasAnyRole(consultant, ['lyc_consultant', 'admin']), true);
});

test('RBAC: hasUserType checks portal segment', () => {
  const candidate = makeUser({ user_type: 'candidate' });
  const client = makeUser({ user_type: 'client' });

  assert.equal(hasUserType(candidate, 'candidate'), true);
  assert.equal(hasUserType(candidate, 'client'), false);
  assert.equal(hasUserType(client, 'client'), true);
});

test('RBAC: isInternalUser detects internal users', () => {
  const internal = makeUser({ user_type: 'internal', role: 'lyc_consultant' });
  const candidate = makeUser({ user_type: 'candidate', role: 'candidate' });
  const admin = makeUser({ user_type: 'internal', role: 'super_admin' });

  assert.equal(isInternalUser(internal), true);
  assert.equal(isInternalUser(admin), true);
  assert.equal(isInternalUser(candidate), false);
  assert.equal(isInternalUser(null), false);
});

test('RBAC: isAuthorized combined check', () => {
  const clientAdmin = makeUser({ role: 'client_admin', user_type: 'client' });

  assert.equal(isAuthorized(clientAdmin, { userType: 'client' }), true);
  assert.equal(isAuthorized(clientAdmin, { role: 'super_admin' }), false);
  assert.equal(isAuthorized(clientAdmin, { userTypes: ['client', 'candidate'] }), true);
  assert.equal(isAuthorized(clientAdmin, { userType: 'candidate' }), false);
  assert.equal(isAuthorized(null, { userType: 'client' }), false);
});

// ─── Validator tests ──────────────────────────────────────────────

test('validators: valid contact body passes', () => {
  const req = {
    body: {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      phone: '+1234567890',
    },
  } as any;
  const result = validateBody(req, contactCreateSchema);
  assert.equal(result.success, true);
});

test('validators: missing required fields fails', () => {
  const req = { body: { first_name: 'John' } } as any;
  const result = validateBody(req, contactCreateSchema);
  assert.equal(result.success, false);
  const msg = firstZodError(result);
  assert.ok(msg.length > 0);
  // Error could be about any missing required field; just verify it's not empty
});

test('validators: pagination defaults applied', () => {
  const req = { query: {} } as any;
  const result = validateQuery(req, paginationSchema);
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.page, 1);
    assert.equal(result.data.page_size, 20);
  }
});

test('validators: UUID schema validates format', () => {
  const good = uuidSchema.safeParse(UUIDS.contact1);
  assert.equal(good.success, true);

  const bad = uuidSchema.safeParse('not-a-uuid');
  assert.equal(bad.success, false);
});

test('validators: firstZodError returns first issue message', () => {
  const req = { body: { first_name: '', last_name: '' } } as any;
  const result = validateBody(req, contactCreateSchema);
  assert.equal(result.success, false);
  const msg = firstZodError(result);
  assert.ok(msg.length > 0);
});

// ─── Response envelope tests ──────────────────────────────────────

test('response: sendSuccess returns correct shape', () => {
  let status = 0;
  let jsonBody: any = null;
  const res = {
    status(s: number) {
      status = s;
      return this;
    },
    json(body: any) {
      jsonBody = body;
    },
  } as any;

  sendSuccess(res, { id: '123' }, { total: 42 });

  assert.equal(status, 200);
  assert.equal(jsonBody.success, true);
  assert.equal(jsonBody.data.id, '123');
  assert.equal(jsonBody.meta.total, 42);
});

test('response: sendError returns error shape', () => {
  let status = 0;
  let jsonBody: any = null;
  const res = {
    status(s: number) {
      status = s;
      return this;
    },
    json(body: any) {
      jsonBody = body;
    },
  } as any;

  sendError(res, 404, 'Not found');

  assert.equal(status, 404);
  assert.equal(jsonBody.success, false);
  assert.equal(jsonBody.error, 'Not found');
});

// ─── Audit tests ──────────────────────────────────────────────────

test('audit: getClientIp extracts from x-forwarded-for', () => {
  const ip = getClientIp({
    headers: {
      'x-forwarded-for': '192.168.1.1, 10.0.0.1',
    },
  });
  assert.equal(ip, '192.168.1.1');
});

test('audit: getClientIp falls back to x-real-ip', () => {
  const ip = getClientIp({
    headers: {
      'x-real-ip': '10.0.0.5',
    },
  });
  assert.equal(ip, '10.0.0.5');
});

test('audit: getUserAgent extracts UA', () => {
  const ua = getUserAgent({
    headers: {
      'user-agent': 'TestAgent/1.0',
    },
  });
  assert.equal(ua, 'TestAgent/1.0');
});

// ─── Logging tests ────────────────────────────────────────────────

test('logging: logInfo produces valid JSON', () => {
  let output = '';
  const origInfo = console.info;
  console.info = (msg: string) => { output = msg; };

  try {
    logInfo('test message', { count: 5 });
    const parsed = JSON.parse(output);
    assert.equal(parsed.message, 'test message');
    assert.equal(parsed.level, 'info');
    assert.equal(parsed.service, 'v1-api');
    assert.equal(parsed.count, 5);
    assert.ok(parsed.timestamp);
  } finally {
    console.info = origInfo;
  }
});
