/**
 * useAuth — typed auth hook for the v1 API.
 *
 * Pulls the caller profile from `/api/v1/auth/me` on mount (via httpOnly
 * cookie) and exposes login / signup / logout / resetPassword helpers
 * that hit the v1 auth endpoints.
 *
 * The JWT lives in an httpOnly cookie set by the server on login/signup
 * and cleared on logout. This hook never touches localStorage, so the
 * token is not readable from JS — eliminating an entire XSS exfil class.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { v1Client } from './v1Client';
import {
  V1ApiError,
  type SignupInput,
  type UseAuthOptions,
  type UseAuthResult,
  type V1AuthUser,
} from './types';

interface LoginResponse {
  user: V1AuthUser;
}

interface SignupResponse {
  user: V1AuthUser;
}

interface MeResponse {
  user: V1AuthUser | null;
}

export function useAuth(options: UseAuthOptions = {}): UseAuthResult {
  const { enabled = true } = options;

  const [user, setUser] = useState<V1AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<V1ApiError | null>(null);

  const mountedRef = useRef<boolean>(true);

  const refresh = useCallback(async (): Promise<V1AuthUser | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await v1Client.get<MeResponse>('/auth/me');
      const u = res?.user ?? null;
      if (mountedRef.current) setUser(u);
      return u;
    } catch (err) {
      // 401 just means "not logged in" — treat as null user, not an error.
      if (err instanceof V1ApiError && err.status === 401) {
        if (mountedRef.current) setUser(null);
        return null;
      }
      const apiError =
        err instanceof V1ApiError
          ? err
          : new V1ApiError(
              err instanceof Error ? err.message : 'Failed to fetch user',
              { status: 0 },
            );
      if (mountedRef.current) setError(apiError);
      throw apiError;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  // Hydrate on mount
  useEffect(() => {
    mountedRef.current = true;
    if (!enabled) {
      setLoading(false);
      return;
    }
    void refresh().catch(() => undefined);
    return () => {
      mountedRef.current = false;
    };
  }, [enabled, refresh]);

  const login = useCallback(async (email: string, password: string): Promise<V1AuthUser> => {
    setLoading(true);
    setError(null);
    try {
      const res = await v1Client.post<LoginResponse>('/auth/login', { email, password });
      if (mountedRef.current) setUser(res.user);
      return res.user;
    } catch (err) {
      const apiError =
        err instanceof V1ApiError
          ? err
          : new V1ApiError(
              err instanceof Error ? err.message : 'Login failed',
              { status: 0 },
            );
      if (mountedRef.current) setError(apiError);
      throw apiError;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  const signup = useCallback(async (input: SignupInput): Promise<V1AuthUser> => {
    setLoading(true);
    setError(null);
    try {
      const res = await v1Client.post<SignupResponse>('/auth/signup', input);
      if (mountedRef.current) setUser(res.user);
      return res.user;
    } catch (err) {
      const apiError =
        err instanceof V1ApiError
          ? err
          : new V1ApiError(
              err instanceof Error ? err.message : 'Signup failed',
              { status: 0 },
            );
      if (mountedRef.current) setError(apiError);
      throw apiError;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await v1Client.post<{ ok: true }>('/auth/logout', {});
      if (mountedRef.current) setUser(null);
    } catch (err) {
      const apiError =
        err instanceof V1ApiError
          ? err
          : new V1ApiError(
              err instanceof Error ? err.message : 'Logout failed',
              { status: 0 },
            );
      if (mountedRef.current) setError(apiError);
      throw apiError;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await v1Client.post<{ ok: true }>('/auth/reset-password', { email });
    } catch (err) {
      const apiError =
        err instanceof V1ApiError
          ? err
          : new V1ApiError(
              err instanceof Error ? err.message : 'Password reset failed',
              { status: 0 },
            );
      if (mountedRef.current) setError(apiError);
      throw apiError;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  return {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    resetPassword,
    refresh,
  };
}
