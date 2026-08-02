import React from 'react';

interface ScopeBarProps {
  scope?: string;
  className?: string;
  onEdit?: () => void;
}

export function ScopeBar({ scope = 'Unscoped', className = '', onEdit }: ScopeBarProps) {
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 text-sm ${className}`}>
      <span className="text-gray-500 uppercase text-xs font-semibold tracking-wide">Scope</span>
      <span className="font-medium text-gray-800">{scope}</span>
      {onEdit && (
        <button
          onClick={onEdit}
          className="text-pink-600 hover:text-pink-700 text-xs font-semibold ml-1"
        >
          Edit
        </button>
      )}
    </div>
  );
}

export default ScopeBar;
