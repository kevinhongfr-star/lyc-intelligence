/**
 * v1 data layer — shared types.
 *
 * These types are the contract between the React hooks in `src/hooks/v1/`
 * and the v1 API (`/api/v1/*`). They mirror the server-side envelope
 * defined in `api/_lib/v1/response.ts` and the auth shape defined in
 * `api/_lib/v1/auth.ts`.
 */

import type { UserRole } from '@/types';

/** Portal segment — same set as `UserType` in `api/_lib/v1/auth.ts`. */
export type UserType =
  | 'internal'
  | 'client'
  | 'candidate'
  | 'b2c'
  | 'council'
  | 'workshop'
  | 'alumni'
  | 'partner';

/** Authenticated caller — same shape as `V1AuthUser` server-side. */
export interface V1AuthUser {
  id: string;
  email: string;
  role: UserRole;
  user_type: UserType;
}

/** Standard v1 response envelope. */
export interface ApiEnvelope<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: Record<string, unknown>;
}

/** Paginated list response — what `/api/v1/<resource>` list endpoints return. */
export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
}

/** Standard query params supported by list endpoints. */
export interface ListQueryParams {
  page?: number;
  page_size?: number;
  q?: string;
  /** `null` values are skipped by the client (treated like `undefined`). */
  [key: string]: string | number | boolean | null | undefined;
}

/** Error thrown by `v1Client` on a non-2xx response. */
export class V1ApiError extends Error {
  readonly status: number;
  readonly code: string | null;
  readonly meta: Record<string, unknown> | undefined;

  constructor(
    message: string,
    opts: { status: number; code?: string | null; meta?: Record<string, unknown> },
  ) {
    super(message);
    this.name = 'V1ApiError';
    this.status = opts.status;
    this.code = opts.code ?? null;
    this.meta = opts.meta;
  }
}

/** Cache entry used by `useV1Query`. */
export interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  /** ISO timestamp of when the data was originally fetched. */
  fetchedAt: number;
}

/** Options accepted by `useV1Query`. */
export interface UseV1QueryOptions<T, R = T> {
  /** Query params appended to the URL. */
  params?: ListQueryParams;
  /** When false, the query does not auto-fetch on mount. Default true. */
  enabled?: boolean;
  /** Cache TTL in ms. Default 30s. Set to 0 to disable caching. */
  cacheTtlMs?: number;
  /** Refetch on window focus. Default false. */
  refetchOnWindowFocus?: boolean;
  /** Refetch on mount even when cache is fresh. Default false. */
  refetchOnMount?: boolean;
  /** Transform the raw response data before returning. */
  select?: (data: T) => R;
  /** Initial data shown while the first fetch is in flight. */
  placeholderData?: R;
}

/** Options accepted by `useV1Mutation`. */
export interface UseV1MutationOptions<TData, TBody, TContext> {
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Params appended to the URL (rarely used for mutations). */
  params?: ListQueryParams;
  /** Called with the optimistic value before the request fires. */
  onMutate?: (body: TBody) => TContext | Promise<TContext>;
  /** Called after a successful mutation. */
  onSuccess?: (data: TData, body: TBody, context: TContext | undefined) => void | Promise<void>;
  /** Called after a failed mutation. Receives the context for rollback. */
  onError?: (error: V1ApiError, body: TBody, context: TContext | undefined) => void | Promise<void>;
  /** Called after success or error — useful for cleanup. */
  onSettled?: (
    data: TData | undefined,
    error: V1ApiError | null,
    body: TBody,
    context: TContext | undefined,
  ) => void | Promise<void>;
  /** Cache paths to invalidate after success. */
  invalidateQueries?: string[];
}

/** Result of `useV1Query`. */
export interface UseV1QueryResult<T> {
  data: T | undefined;
  loading: boolean;
  error: V1ApiError | null;
  isStale: boolean;
  refetch: () => Promise<T | undefined>;
}

/** Result of `useV1Mutation`. */
export interface UseV1MutationResult<TData, TBody, TContext> {
  data: TData | undefined;
  loading: boolean;
  error: V1ApiError | null;
  context: TContext | undefined;
  mutate: (body: TBody) => Promise<TData>;
  mutateAsync: (body: TBody) => Promise<TData>;
  reset: () => void;
}

/** Options accepted by `useAuth`. */
export interface UseAuthOptions {
  /** When false, the hook does not auto-fetch the user on mount. Default true. */
  enabled?: boolean;
}

/** Result of `useAuth`. */
export interface UseAuthResult {
  user: V1AuthUser | null;
  loading: boolean;
  error: V1ApiError | null;
  login: (email: string, password: string) => Promise<V1AuthUser>;
  signup: (input: SignupInput) => Promise<V1AuthUser>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refresh: () => Promise<V1AuthUser | null>;
}

/** Body for `POST /api/v1/auth/signup`. */
export interface SignupInput {
  email: string;
  password: string;
  name: string;
  /** Optional user_type — defaults to `b2c` on the server. */
  user_type?: UserType;
}

/**
 * Options accepted by `useRealtime`.
 *
 * `T` is the row type. `onPayload` receives the full Supabase payload
 * envelope (which includes `new: T`, `old: Partial<T>`, `eventType`, etc.).
 */
export interface UseRealtimeOptions<T extends Record<string, unknown>> {
  /** Filter expression, e.g. `candidate_id=eq.USER_ID`. */
  filter?: string;
  /** Event types to listen for. Default `*` (all). */
  events?: ('INSERT' | 'UPDATE' | 'DELETE' | '*')[];
  /** Called for every received payload. */
  onPayload?: (payload: RealtimeEnvelope<T>) => void;
  /** When false, the subscription is not opened. Default true. */
  enabled?: boolean;
  /** Schema name. Default `public`. */
  schema?: string;
}

/** Shape of the payload Supabase hands to a `postgres_changes` callback. */
export interface RealtimeEnvelope<T extends Record<string, unknown>> {
  schema: string;
  table: string;
  commit_timestamp: string;
  errors: string[];
  eventType: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  new: T;
  old: Partial<T> | Record<string, never>;
}
