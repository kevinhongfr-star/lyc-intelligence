import React from 'react';
import {
  Inbox,
  Search,
  FileText,
  Users,
  Briefcase,
  Calendar,
  Bell,
  Upload,
  Settings,
  AlertCircle,
  Plus,
  Download,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui';

export type EmptyStateVariant =
  | 'default'
  | 'search'
  | 'no-results'
  | 'no-data'
  | 'no-candidates'
  | 'no-mandates'
  | 'no-documents'
  | 'no-events'
  | 'no-notifications'
  | 'error'
  | 'loading';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  variant?: EmptyStateVariant;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  actionIcon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const VARIANT_ICONS: Record<EmptyStateVariant, React.ReactNode> = {
  default: <Inbox />,
  search: <Search />,
  'no-results': <Search />,
  'no-data': <FileText />,
  'no-candidates': <Users />,
  'no-mandates': <Briefcase />,
  'no-documents': <FileText />,
  'no-events': <Calendar />,
  'no-notifications': <Bell />,
  error: <AlertCircle />,
  loading: <RefreshCw />,
};

const VARIANT_DEFAULTS: Partial<Record<EmptyStateVariant, { title: string; description: string }>> = {
  search: {
    title: 'No results found',
    description: 'Try adjusting your search or filter criteria.',
  },
  'no-candidates': {
    title: 'No candidates yet',
    description: 'Add your first candidate to start building your talent pipeline.',
  },
  'no-mandates': {
    title: 'No mandates yet',
    description: 'Create your first mandate to start tracking placements.',
  },
  'no-documents': {
    title: 'No documents uploaded',
    description: 'Upload resumes, reports, or other documents to get started.',
  },
  'no-events': {
    title: 'No upcoming events',
    description: 'Schedule your first event or check back later.',
  },
  'no-notifications': {
    title: 'All caught up!',
    description: 'You have no new notifications. We will let you know when something happens.',
  },
  error: {
    title: 'Something went wrong',
    description: 'We could not load this content. Please try again.',
  },
};

export function EmptyState({
  title,
  description,
  icon,
  variant = 'default',
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  actionIcon,
  size = 'md',
  className = '',
}: EmptyStateProps) {
  const defaults = VARIANT_DEFAULTS[variant] || {};
  const displayTitle = title || defaults.title || 'Nothing here yet';
  const displayDescription = description || defaults.description;
  const displayIcon = icon || VARIANT_ICONS[variant];

  const sizeClasses = {
    sm: 'py-8 px-4',
    md: 'py-16 px-6',
    lg: 'py-24 px-8',
  };

  const iconSizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const titleSizeClasses = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
  };

  return (
    <div className={`flex flex-col items-center justify-center ${sizeClasses[size]} ${className}`}>
      <div className={`${iconSizeClasses[size]} text-text-muted mb-4 flex items-center justify-center`}>
        {variant === 'loading' ? (
          <RefreshCw className={`${iconSizeClasses[size]} animate-spin text-text-muted`} />
        ) : (
          displayIcon
        )}
      </div>

      <h3 className={`${titleSizeClasses[size]} font-medium text-text-primary text-center`}>
        {displayTitle}
      </h3>

      {displayDescription && (
        <p className="mt-2 text-sm text-text-muted text-center max-w-sm">
          {displayDescription}
        </p>
      )}

      {(actionLabel || secondaryActionLabel) && (
        <div className="mt-6 flex items-center gap-3">
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="outline" onClick={onSecondaryAction} size="sm">
              {secondaryActionLabel}
            </Button>
          )}
          {actionLabel && onAction && (
            <Button onClick={onAction} size="sm">
              {actionIcon}
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export const EmptyStates = {
  candidates: (onCreate?: () => void, onImport?: () => void) => (
    <EmptyState
      variant="no-candidates"
      actionLabel="Add Candidate"
      actionIcon={<Plus className="w-4 h-4" />}
      onAction={onCreate}
      secondaryActionLabel="Import CSV"
      onSecondaryAction={onImport}
    />
  ),
  mandates: (onCreate?: () => void) => (
    <EmptyState
      variant="no-mandates"
      actionLabel="Create Mandate"
      actionIcon={<Plus className="w-4 h-4" />}
      onAction={onCreate}
    />
  ),
  documents: (onUpload?: () => void) => (
    <EmptyState
      variant="no-documents"
      actionLabel="Upload Document"
      actionIcon={<Upload className="w-4 h-4" />}
      onAction={onUpload}
    />
  ),
  search: () => (
    <EmptyState variant="search" />
  ),
  notifications: () => (
    <EmptyState variant="no-notifications" />
  ),
  error: (onRetry?: () => void) => (
    <EmptyState
      variant="error"
      actionLabel="Try Again"
      actionIcon={<RefreshCw className="w-4 h-4" />}
      onAction={onRetry}
    />
  ),
};

export default EmptyState;
