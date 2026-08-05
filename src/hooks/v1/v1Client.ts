/**
 * v1 client — thin fetch wrapper for `/api/v1/*`.
 *
 * Responsibilities:
 *   - Prefix every path with `/api/v1`
 *   - Send credentials (httpOnly cookie) on every request
 *   - JSON-encode request bodies
 *   - Strip the `{ success, data, error, meta }` envelope
 *   - Throw `V1ApiError` on non-2xx responses (with status + meta)
 *
 * Auth: cookies carry the JWT (set by `/api/v1/auth/login`), so the client
 * does NOT touch localStorage. `credentials: 'include'` is required for
 * the cookie to be sent cross-origin (Vercel preview domains).
 */

import {
  V1ApiError,
  type ApiEnvelope,
  type ListQueryParams,
} from './types';

const BASE = '/api/v1';

function buildUrl(path: string, params?: ListQueryParams): string {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const url = `${BASE}/${cleanPath}`;
  if (!params) return url;

  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    sp.append(key, String(value));
  }
  const qs = sp.toString();
  return qs ? `${url}?${qs}` : url;
}

async function parseEnvelope<T>(res: Response): Promise<T> {
  let body: ApiEnvelope<T> | null = null;
  try {
    body = (await res.json()) as ApiEnvelope<T>;
  } catch {
    throw new V1ApiError(`Invalid JSON response (HTTP ${res.status})`, { status: res.status });
  }

  if (!res.ok || !body.success) {
    const message = body.error ?? `Request failed (HTTP ${res.status})`;
    const code =
      typeof body.meta?.code === 'string' ? (body.meta.code as string) : null;
    throw new V1ApiError(message, { status: res.status, code, meta: body.meta });
  }

  return body.data as T;
}

export interface V1ClientRequestOptions {
  params?: ListQueryParams;
  signal?: AbortSignal;
  /** Extra headers. */
  headers?: Record<string, string>;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options: V1ClientRequestOptions = {},
): Promise<T> {
  const url = buildUrl(path, options.params);
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...options.headers,
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      credentials: 'include',
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: options.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') throw err;
    throw new V1ApiError(
      err instanceof Error ? err.message : 'Network request failed',
      { status: 0 },
    );
  }

  return parseEnvelope<T>(res);
}

export const v1Client = {
  get: <T>(path: string, options?: V1ClientRequestOptions) =>
    request<T>('GET', path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: V1ClientRequestOptions) =>
    request<T>('POST', path, body, options),
  put: <T>(path: string, body?: unknown, options?: V1ClientRequestOptions) =>
    request<T>('PUT', path, body, options),
  patch: <T>(path: string, body?: unknown, options?: V1ClientRequestOptions) =>
    request<T>('PATCH', path, body, options),
  delete: <T>(path: string, options?: V1ClientRequestOptions) =>
    request<T>('DELETE', path, undefined, options),
  /** Exposed for tests + advanced callers. */
  request,
};

export type V1Client = typeof v1Client;
