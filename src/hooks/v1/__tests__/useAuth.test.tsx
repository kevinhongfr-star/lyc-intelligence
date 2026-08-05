/**
 * Tests for useAuth — typed auth hook over the v1 API.
 *
 * Mocks `v1Client.{get,post}` and asserts:
 *   - On mount, calls GET /auth/me and hydrates user
 *   - 401 from /auth/me is treated as "no user" (not an error)
 *   - login() POSTs to /auth/login and stores the returned user
 *   - signup() POSTs to /auth/signup
 *   - logout() POSTs to /auth/logout and clears user
 *   - resetPassword() POSTs to /auth/reset-password
 *   - Network errors are surfaced as V1ApiError in `error`
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '../useAuth';
import * as v1ClientMod from '../v1Client';
import { V1ApiError, type V1AuthUser } from '../types';

const SAMPLE_USER: V1AuthUser = {
  id: 'user-1',
  email: 'test@example.com',
  role: 'member',
  user_type: 'b2c',
};

describe('useAuth', () => {
  let getMock: ReturnType<typeof vi.fn>;
  let postMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getMock = vi.fn();
    postMock = vi.fn();
    const fake = {
      get: getMock,
      post: postMock,
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      request: vi.fn(),
    };
    vi.spyOn(v1ClientMod, 'v1Client', 'get').mockReturnValue(
      fake as unknown as typeof v1ClientMod.v1Client,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('hydrates the user from /auth/me on mount', async () => {
    getMock.mockResolvedValue({ user: SAMPLE_USER });

    const { result } = renderHook(() => useAuth());

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user).toEqual(SAMPLE_USER);
    expect(result.current.error).toBeNull();
    expect(getMock).toHaveBeenCalledWith('/auth/me');
  });

  it('treats 401 from /auth/me as "no user" (no error)', async () => {
    getMock.mockRejectedValue(new V1ApiError('Unauthorized', { status: 401 }));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('surfaces non-401 errors from /auth/me in error state', async () => {
    getMock.mockRejectedValue(new V1ApiError('Server error', { status: 500 }));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user).toBeNull();
    expect(result.current.error).toBeInstanceOf(V1ApiError);
    expect(result.current.error?.status).toBe(500);
  });

  it('login POSTs to /auth/login and stores the returned user', async () => {
    getMock.mockResolvedValue({ user: null });
    postMock.mockResolvedValue({ user: SAMPLE_USER });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.loading).toBe(false));

    const user = await result.current.login('test@example.com', 'password');
    expect(user).toEqual(SAMPLE_USER);
    expect(postMock).toHaveBeenCalledWith('/auth/login', {
      email: 'test@example.com',
      password: 'password',
    });
    await waitFor(() => expect(result.current.user).toEqual(SAMPLE_USER));
  });

  it('login captures errors and re-throws', async () => {
    getMock.mockResolvedValue({ user: null });
    postMock.mockRejectedValue(new V1ApiError('Invalid credentials', { status: 401 }));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(result.current.login('test@example.com', 'wrong')).rejects.toMatchObject({
      name: 'V1ApiError',
      status: 401,
    });

    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(V1ApiError);
      expect(result.current.user).toBeNull();
    });
  });

  it('signup POSTs to /auth/signup with the full input', async () => {
    getMock.mockResolvedValue({ user: null });
    postMock.mockResolvedValue({ user: SAMPLE_USER });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.loading).toBe(false));

    const user = await result.current.signup({
      email: 'test@example.com',
      password: 'password',
      name: 'Test User',
      user_type: 'b2c',
    });

    expect(user).toEqual(SAMPLE_USER);
    expect(postMock).toHaveBeenCalledWith('/auth/signup', {
      email: 'test@example.com',
      password: 'password',
      name: 'Test User',
      user_type: 'b2c',
    });
  });

  it('logout POSTs to /auth/logout and clears the user', async () => {
    getMock.mockResolvedValue({ user: SAMPLE_USER });
    postMock.mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.user).toEqual(SAMPLE_USER));

    await result.current.logout();

    expect(postMock).toHaveBeenCalledWith('/auth/logout', {});
    await waitFor(() => expect(result.current.user).toBeNull());
  });

  it('resetPassword POSTs to /auth/reset-password', async () => {
    getMock.mockResolvedValue({ user: null });
    postMock.mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await result.current.resetPassword('test@example.com');

    expect(postMock).toHaveBeenCalledWith('/auth/reset-password', {
      email: 'test@example.com',
    });
  });

  it('enabled: false skips the initial /auth/me fetch', async () => {
    const { result } = renderHook(() => useAuth({ enabled: false }));

    expect(result.current.loading).toBe(false);
    expect(getMock).not.toHaveBeenCalled();
  });

  it('refresh re-fetches the user from /auth/me', async () => {
    getMock.mockResolvedValueOnce({ user: null });
    getMock.mockResolvedValueOnce({ user: SAMPLE_USER });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();

    const user = await result.current.refresh();
    expect(user).toEqual(SAMPLE_USER);
    await waitFor(() => expect(result.current.user).toEqual(SAMPLE_USER));
  });
});
