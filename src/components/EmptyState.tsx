import React from 'react';
import { cn } from '@/lib/utils';
import { Inbox, Search, FileText, MessageSquare, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export type EmptyStateVariant = 'default' | 'no-results' | 'no-data' | 'error' | 'welcome';

const VARIANT_CONFIG: Record<EmptyStateVariant, { icon: React.ReactNode; title: string; defaultDescription: string }> = {
  default: {
    icon: <Inbox className="w-12 h-12" />,
    title: 'Nothing here yet',
    defaultDescription: 'Get started by creating your first item.',
  },
  'no-results': {
    icon: <Search className="w-12 h-12" />,
    title: 'No results found',
    defaultDescription: 'Try adjusting your search or filters to find what you need.',
  },
  'no-data': {
    icon: <FileText className="w-12 h-12" />,
    title: 'No data available',
    defaultDescription: 'Data will appear here once it has been generated.',
  },
  error: {
    icon: <HelpCircle className="w-12 h-12" />,
    title: 'Something went wrong',
    defaultDescription: 'An unexpected error occurred. Please try again.',
  },
  welcome: {
    icon: <MessageSquare className="w-12 h-12" />,
    title: 'Welcome',
    defaultDescription: 'This is your dashboard. Let us know if you need help getting started.',
  },
};

export interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  actionLabel?: React.ReactNode;
  onAction?: () => void;
  secondaryActionLabel?: React.ReactNode;
  onSecondaryAction?: () => void;
  compact?: boolean;
  className?: string;
}

export function EmptyState({
  variant = 'default',
  title,
  description,
  icon,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  compact = false,
  className,
}: EmptyStateProps) {
  const config = VARIANT_CONFIG[variant];
  const resolvedIcon = icon || config.icon;
  const resolvedTitle = title || config.title;
  const resolvedDescription = description || config.defaultDescription;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-8 px-4' : 'py-16 px-6',
        className,
      )}
    >
      <div className="text-[var(--echo-text-tertiary)] mb-4" aria-hidden="true">
        {resolvedIcon}
      </div>
      <h3 className="text-lg font-semibold text-[var(--echo-text-primary)]">{resolvedTitle}</h3>
      <p className="mt-2 text-sm text-[var(--echo-text-secondary)] max-w-sm">{resolvedDescription}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-6">
          {actionLabel}
        </Button>
      )}
      {secondaryActionLabel && onSecondaryAction && (
        <button
          type="button"
          onClick={onSecondaryAction}
          className="mt-3 text-sm text-[var(--echo-accent)] hover:text-[var(--echo-accent-hover)] transition-colors"
        >
          {secondaryActionLabel}
        </button>
      )}
    </div>
  );
}
