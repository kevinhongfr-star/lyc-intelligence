/**
 * SubTabs — Reusable sub-tab component for B2B, B2C, Candidate surfaces
 * Mockup v14 style: horizontal scrollable tabs
 */
import React from 'react';

interface SubTab {
  path: string;
  label: string;
}

interface SubTabsProps {
  tabs: SubTab[];
  active: string;
  onTabClick: (path: string) => void;
}

export function SubTabs({ tabs, active, onTabClick }: SubTabsProps) {
  return (
    <div className="bg-bg-warm border-b border-border px-6 overflow-x-auto">
      <div className="flex gap-1 min-w-max">
        {tabs.map((tab) => (
          <button
            key={tab.path}
            onClick={() => onTabClick(tab.path)}
            className={`
              px-4 py-2 text-sm transition-colors whitespace-nowrap
              ${active === tab.path || active.startsWith(tab.path + '/')
                ? 'text-fuchsia font-semibold bg-white rounded-t-md shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default SubTabs;