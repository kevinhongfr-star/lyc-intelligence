import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <Inbox className="w-12 h-12 text-text-muted" />
      <h3 className="mt-4 text-lg font-serif text-text-primary">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-text-muted text-center max-w-sm">{description}</p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-6 px-5 py-2 text-white text-sm font-medium hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#C108AB', borderRadius: 0 }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
