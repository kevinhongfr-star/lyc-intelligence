/**
 * #33 Barrel export for the ECHO v6.0 Design System component library.
 *
 * Import like: import { Button, Input, Card } from '@/components/ui';
 * This barrel deliberately re-exports from both ui/* AND shared chromes
 * under portals/* so call sites have ONE import path for the design system.
 */

/* ── Tokens (TS mirror of CSS custom properties) ───────────────── */
export * from './tokens';

/* ── Core atomic components ────────────────────────────────────── */
export { Button, type ButtonProps, type ButtonSize, type ButtonVariant } from './Button';
export { Input, type InputProps } from './Input';
export { Textarea, type TextareaProps } from './Textarea';
export { Select, type SelectOption, type SelectProps } from './Select';
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  type CardProps, type CardHeaderProps, type CardTitleProps,
  type CardDescriptionProps, type CardContentProps, type CardFooterProps,
} from './Card';
export {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption,
  type TableProps, type TableRowProps, type TableCellProps,
} from './Table';
export { Modal,
  type ModalProps,
} from './Modal';
// Toast helpers: static toast, useToast() hook, ToastProvider, ToastContainer
export { toast, useToast, ToastProvider, type ToastHelpers } from './Toast';
export type { ToastType } from './Toast';
export { ToastContainer } from './ToastContainer';
export { Badge, type BadgeProps, type BadgeVariant, type BadgeSize } from './Badge';
export { TierBadge, type Tier } from './TierBadge';
export { Progress, type ProgressProps, type ProgressVariant, type ProgressSize } from './Progress';
export { EmptyState, type EmptyStateProps, type EmptyStateVariant } from './EmptyState';
export { Skeleton, type SkeletonProps } from './Skeleton';
export { LoadingSpinner, type LoadingSpinnerProps } from './LoadingSpinner';
export { LoadingSkeleton } from './LoadingSkeleton';

/* ── #33: Newly added for NEXUS Layer + shared chrome ─────────── */
export { Avatar, AvatarGroup, type AvatarProps, type AvatarSize } from './Avatar';
export { Tooltip, type TooltipProps } from '../Tooltip';
export { NotificationCenter,
  type NotificationCenterProps, type NotificationItem, type NotificationType,
} from './NotificationCenter';
export { CommandPalette,
  type CommandPaletteProps, type CommandItem,
} from './CommandPalette';
export { LoadingState, ErrorState,
  type LoadingStateProps, type LoadingStateSize, type ErrorStateProps,
} from './ContentStates';

/* ── Shared layout chrome (portal components, re-exported) ───── */
export { TopBar, type TopBarProps } from '../portals/TopBar';
export { Sidebar, type SidebarProps, type SidebarItem } from '../portals/Sidebar';
export { Breadcrumbs, type BreadcrumbItem, type BreadcrumbsProps } from '../portals/Breadcrumbs';
