import React from 'react';

interface SkipLinkProps {
  targetId?: string;
  label?: string;
}

export function SkipLink({ targetId = 'main-content', label = 'Skip to main content' }: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:text-sm focus:font-medium focus:shadow-lg"
      style={{ borderRadius: '0 !important' }}
    >
      {label}
    </a>
  );
}
