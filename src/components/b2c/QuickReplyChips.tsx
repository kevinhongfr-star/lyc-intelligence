import React from 'react';

interface QuickReplyChipsProps {
  chips?: string[];
  onSelect?: (chip: string) => void;
}

const DEFAULT_CHIPS = [
  'New assessment',
  'Career path',
  'Ask about your leadership profile',
];

export function QuickReplyChips({ chips = DEFAULT_CHIPS, onSelect }: QuickReplyChipsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip}
          onClick={() => onSelect?.(chip)}
          className="px-3 py-1.5 text-xs font-medium text-text-secondary bg-bg-secondary border border-bg-tertiary hover:border-accent hover:text-accent transition-colors"
        >
          {chip}
        </button>
      ))}
    </div>
  );
}
