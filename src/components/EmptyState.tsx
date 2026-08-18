/**
 * Backwards-compat re-export.
 *
 * The canonical EmptyState now lives in `@/components/ui/EmptyState` with
 * branded SVG illustrations per variant (#1328). This file re-exports it
 * so existing direct imports (`@/components/EmptyState`) keep working.
 * Prefer `import { EmptyState } from '@/components/ui'` going forward.
 */
export { EmptyState } from './ui/EmptyState';
export type { EmptyStateProps, EmptyStateVariant } from './ui/EmptyState';
