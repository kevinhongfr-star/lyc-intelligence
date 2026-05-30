import { useAuthStore } from '@/stores/authStore';

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const { supabase } = useAuthStore.getState();
  let token: string | null = null;

  try {
    if (supabase) {
      const { data } = await supabase.auth.getSession();
      token = data?.session?.access_token || null;
    }
  } catch (e) {
    console.warn('[apiClient] Failed to get session:', e);
  }

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(path, { ...options, headers });
}
