import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({
  title = 'Nothing here yet',
  message = 'No data to display.',
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-10 flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 bg-bg-secondary border border-bg-tertiary flex items-center justify-center mb-4">
        {icon || <Inbox className="w-5 h-5 text-text-muted" />}
      </div>
      <h3 className="font-serif text-lg font-bold text-text-primary">{title}</h3>
      <p className="text-sm text-text-muted mt-1 max-w-sm">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export default EmptyState;
