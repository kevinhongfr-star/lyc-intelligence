/**
 * Design system index — single import surface for all UI primitives.
 *
 *   import { Button, Card, Input, Modal, Toast, useToast } from '@/components/ui';
 *
 * Backwards-compatible re-exports keep existing imports from
 * `@/components/ui/{Button,Card,...}` working.
 */

// Core primitives
export { Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './Card';
export type {
  CardProps,
  CardHeaderProps,
  CardTitleProps,
  CardDescriptionProps,
  CardContentProps,
  CardFooterProps,
} from './Card';

export { Input } from './Input';
export type { InputProps } from './Input';

export { Select } from './Select';
export type { SelectProps, SelectOption } from './Select';

export { Badge } from './Badge';
export type { BadgeProps, BadgeVariant, BadgeSize } from './Badge';

export { Modal } from './Modal';
export type { ModalProps, ModalSize } from './Modal';

export { Table } from './Table';
export type { TableProps, Column, ColumnAlign } from './Table';

export { Skeleton } from './Skeleton';
export type { SkeletonProps, SkeletonVariant } from './Skeleton';

// Backwards-compat re-export — old call sites import LoadingSkeleton
export { LoadingSkeleton } from './LoadingSkeleton';
export type { LoadingSkeletonVariant } from './LoadingSkeleton';

export { EmptyState } from './EmptyState';
export type { EmptyStateProps } from './EmptyState';

export { Progress } from './Progress';
export type { ProgressProps, ProgressVariant, ProgressSize } from './Progress';

// Toast system
export { ToastProvider, useToast, toast } from './Toast';
export type { ToastHelpers, ToastType } from './Toast';

// Existing specialized components (kept for backwards compat)
export { UpgradeBanner } from './UpgradeBanner';
export { CreditDisplay } from './CreditDisplay';
export { TierBadge } from './TierBadge';
export type { Tier } from './TierBadge';
