/**
 * Legacy LoadingSkeleton — kept for backwards compatibility.
 *
 * New code should import `Skeleton` from `@/components/ui` directly.
 * This file simply re-exports the new primitive so existing call sites
 * keep rendering unchanged.
 */
export { Skeleton as LoadingSkeleton } from './Skeleton';
export type { SkeletonVariant as LoadingSkeletonVariant } from './Skeleton';
