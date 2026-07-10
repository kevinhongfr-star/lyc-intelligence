/**
 * SubTabs — Reusable sub-tab component for B2B, B2C, Candidate surfaces
 * Desktop: horizontal scrollable tabs
 * Mobile: scrollable horizontal tabs with snap behavior + active indicator
 */
import React, { useRef, useEffect } from 'react';

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  // Scroll active tab into view on mount
  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const el = activeRef.current;
      const elLeft = el.offsetLeft;
      const elWidth = el.offsetWidth;
      const containerWidth = container.offsetWidth;
      const scrollLeft = elLeft - (containerWidth / 2) + (elWidth / 2);
      container.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
    }
  }, [active]);

  return (
    <>
      {/* Desktop: horizontal scrollable tabs */}
      <div className="hidden md:block bg-bg-warm border-b border-border px-6 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {tabs.map((tab) => {
            const isActive = active === tab.path || active.startsWith(tab.path + '/');
            return (
              <button
                key={tab.path}
                onClick={() => onTabClick(tab.path)}
                className={`
                  px-4 py-2 text-sm transition-colors whitespace-nowrap
                  ${isActive
                    ? 'text-fuchsia font-semibold bg-white rounded-t-md shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                  }
                `}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile: horizontally scrollable with snap + active indicator */}
      <div className="md:hidden bg-bg-warm border-b border-border">
        <div
          ref={scrollRef}
          className="flex overflow-x-auto gap-0 px-2 py-1 snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {tabs.map((tab) => {
            const isActive = active === tab.path || active.startsWith(tab.path + '/');
            return (
              <button
                key={tab.path}
                ref={isActive ? activeRef : null}
                onClick={() => onTabClick(tab.path)}
                className={`
                  px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap snap-start flex-shrink-0 rounded-md
                  ${isActive
                    ? 'text-fuchsia bg-white shadow-sm'
                    : 'text-text-secondary'
                  }
                `}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default SubTabs;
