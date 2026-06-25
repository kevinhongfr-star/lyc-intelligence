/**
 * Authenticated fetch wrapper — automatically attaches JWT from Supabase session.
 * Use this instead of raw `fetch()` for all /api/* calls.
 */

import { useAuthStore } from '@/stores/authStore';

/**
 * Authenticated fetch wrapper — automatically attaches JWT from Supabase session.
 * Use this instead of raw `fetch()` for all /api/* calls.
 */
export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const { supabase } = useAuthStore.getState();

  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${session.access_token}`,
        };
      }
    } catch (e) {
      console.warn('[authFetch] Failed to get session:', e);
    }
  }

  return fetch(url, options);
}

/**
 * JSON convenience wrapper — sets Content-Type and parses response.
 * Throws on non-2xx responses.
 */
export async function authFetchJSON<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await authFetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

export default {
  authFetch,
  authFetchJSON,
};
