/**
 * Phase 3 — #1311: Session timeout & token refresh.
 *
 * Idle timeout: sign out after IDLE_TIMEOUT_MS of inactivity.
 * Absolute timeout: sign out after MAX_SESSION_MS regardless of activity.
 * Cross-tab: activity in one tab resets the timer in all tabs.
 * Tab visibility: on focus, validate session isn't expired.
 *
 * Supabase handles access-token refresh automatically (autoRefreshToken:
 * true in lib/supabase/client.ts). This hook adds the idle + absolute
 * timeout layer that Supabase doesn't provide out of the box.
 *
 * Mount once at the app root (App.tsx). No props — reads from authStore.
 */

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000;       // 30 min idle
const MAX_SESSION_MS  = 8 * 60 * 60 * 1000;    // 8h absolute
const CHECK_INTERVAL_MS = 60 * 1000;            // check every 1 min
const STORAGE_KEY_LAST_ACTIVITY = 'lyc:last_activity';
const STORAGE_KEY_SESSION_START = 'lyc:session_start';

const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  'mousemove',
  'keydown',
  'click',
  'scroll',
  'touchstart',
  'wheel',
];

/**
 * Hook that mounts the idle + absolute session timeout. Call once at
 * the app root. Returns nothing.
 */
export function useSessionTimeout(): void {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const lastActivityRef = useRef<number>(Date.now());
  const sessionStartRef = useRef<number | null>(null);

  // ── On sign-in: record session start ──
  useEffect(() => {
    if (user) {
      // Read existing session start (preserved across reload) or set new.
      const existing = Number(localStorage.getItem(STORAGE_KEY_SESSION_START) || 0);
      if (!existing || isNaN(existing)) {
        const now = Date.now();
        localStorage.setItem(STORAGE_KEY_SESSION_START, String(now));
        sessionStartRef.current = now;
      } else {
        sessionStartRef.current = existing;
      }
      lastActivityRef.current = Number(localStorage.getItem(STORAGE_KEY_LAST_ACTIVITY) || Date.now());
    } else {
      // Signed out — clear storage.
      localStorage.removeItem(STORAGE_KEY_SESSION_START);
      localStorage.removeItem(STORAGE_KEY_LAST_ACTIVITY);
      sessionStartRef.current = null;
    }
  }, [user]);

  // ── Activity listeners: update last_activity on user input ──
  useEffect(() => {
    if (!user) return;

    const recordActivity = () => {
      const now = Date.now();
      lastActivityRef.current = now;
      // Throttle localStorage writes to once per 10s to avoid churn.
      const stored = Number(localStorage.getItem(STORAGE_KEY_LAST_ACTIVITY) || 0);
      if (now - stored > 10_000) {
        localStorage.setItem(STORAGE_KEY_LAST_ACTIVITY, String(now));
      }
    };

    for (const evt of ACTIVITY_EVENTS) {
      window.addEventListener(evt, recordActivity, { passive: true });
    }
    return () => {
      for (const evt of ACTIVITY_EVENTS) {
        window.removeEventListener(evt, recordActivity);
      }
    };
  }, [user]);

  // ── Cross-tab sync: when another tab updates activity, sync here ──
  useEffect(() => {
    if (!user) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_LAST_ACTIVITY && e.newValue) {
        lastActivityRef.current = Number(e.newValue);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [user]);

  // ── Periodic timeout check ──
  useEffect(() => {
    if (!user) return;

    const check = () => {
      const now = Date.now();
      const lastActivity = lastActivityRef.current;
      const sessionStart = sessionStartRef.current;

      // Idle timeout
      if (now - lastActivity > IDLE_TIMEOUT_MS) {
        // eslint-disable-next-line no-console
        console.warn('[session] idle timeout — signing out');
        void signOut();
        return;
      }

      // Absolute timeout
      if (sessionStart && now - sessionStart > MAX_SESSION_MS) {
        // eslint-disable-next-line no-console
        console.warn('[session] absolute timeout — signing out');
        void signOut();
        return;
      }
    };

    const interval = setInterval(check, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [user, signOut]);

  // ── Tab visibility: validate session on focus ──
  useEffect(() => {
    if (!user) return;
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        // Sync from storage (another tab may have updated activity).
        const storedActivity = Number(localStorage.getItem(STORAGE_KEY_LAST_ACTIVITY) || 0);
        if (storedActivity) lastActivityRef.current = storedActivity;

        const now = Date.now();
        const lastActivity = lastActivityRef.current;
        const sessionStart = sessionStartRef.current;

        if (now - lastActivity > IDLE_TIMEOUT_MS) {
          // eslint-disable-next-line no-console
          console.warn('[session] idle timeout on focus — signing out');
          void signOut();
          return;
        }
        if (sessionStart && now - sessionStart > MAX_SESSION_MS) {
          // eslint-disable-next-line no-console
          console.warn('[session] absolute timeout on focus — signing out');
          void signOut();
          return;
        }
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [user, signOut]);
}

/**
 * Validate the current session's token expiry. Returns true if the
 * access token is still valid (or has been refreshed), false if the
 * session is genuinely expired and the user must sign in again.
 *
 * Used by sensitive operations (e.g. changing email, deleting account)
 * to require a fresh auth state.
 */
export async function isSessionValid(): Promise<boolean> {
  const supabase = useAuthStore.getState().supabase;
  if (!supabase) return false;
  try {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return false;
    // Supabase SDK auto-refreshes expired access tokens via refresh
    // token. If refresh fails, session is null.
    return Boolean(data.session.access_token);
  } catch {
    return false;
  }
}

/**
 * Require a recent, valid session for a sensitive operation.
 * Returns true if the session is valid AND was authenticated within
 * the last REAUTH_WINDOW_MS. Callers should prompt re-auth if false.
 */
const REAUTH_WINDOW_MS = 5 * 60 * 1000; // 5 min
export async function requiresRecentAuth(): Promise<boolean> {
  const supabase = useAuthStore.getState().supabase;
  if (!supabase) return false;
  try {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return false;
    // JWT `iat` (issued-at) tells us when the access token was minted.
    const payload = JSON.parse(
      atob(data.session.access_token.split('.')[1]),
    );
    const iat = (payload?.iat ?? 0) * 1000;
    return Date.now() - iat < REAUTH_WINDOW_MS;
  } catch {
    return false;
  }
}

export const SESSION_TIMEOUTS = {
  IDLE_TIMEOUT_MS,
  MAX_SESSION_MS,
  REAUTH_WINDOW_MS,
};
