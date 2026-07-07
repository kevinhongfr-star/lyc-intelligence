import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';

interface CoachIntegrationLinkProps {
  context?: string;
}

export function CoachIntegrationLink({ context }: CoachIntegrationLinkProps) {
  return (
    <div className="flex flex-col items-start gap-1">
      <Link
        to="/leader-portal/coach"
        className="bg-accent-10 text-accent border border-accent px-4 py-2 text-sm font-medium hover:bg-accent hover:text-white transition-colors inline-flex items-center gap-2"
      >
        <MessageSquare className="w-4 h-4" />
        <span>Discuss with Coach</span>
      </Link>
      {context && (
        <p className="text-xs text-text-muted">
          Share this {context} with your DEX Coach for deeper analysis.
        </p>
      )}
    </div>
  );
}
