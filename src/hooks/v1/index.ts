/**
 * v1 data layer — public surface.
 *
 *   import {
 *     useV1Query, useV1Mutation, useAuth, useRealtime, v1Client, V1ApiError,
 *   } from '@/hooks/v1';
 */

export { useV1Query, invalidateV1Queries } from './useV1Query';
export { useV1Mutation } from './useV1Mutation';
export { useAuth } from './useAuth';
export {
  useRealtime,
  useRealtimeRefresh,
  type RealtimeEnvelope,
  type UseRealtimeResult,
  type UseRealtimeRefreshOptions,
} from './useRealtime';
export { v1Client } from './v1Client';
export type { V1Client } from './v1Client';

export {
  V1ApiError,
  type ApiEnvelope,
  type CacheEntry,
  type ListQueryParams,
  type PaginatedResponse,
  type SignupInput,
  type UseAuthOptions,
  type UseAuthResult,
  type UseRealtimeOptions,
  type UseV1MutationOptions,
  type UseV1MutationResult,
  type UseV1QueryOptions,
  type UseV1QueryResult,
  type V1AuthUser,
  type UserType,
} from './types';
