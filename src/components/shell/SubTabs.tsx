/**
 * SubTabs — Secondary navigation tabs
 * Clean, minimal, horizontal scroll on mobile
 */
import React, { useRef, useEffect } from 'react';

interface SubTab { path: string; label: string; }
interface SubTabsProps { tabs: SubTab[]; active: string; onTabClick: (path: string) => void; }

export function SubTabs({ tabs, active, onTabClick }: SubTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const el = activeRef.current;
      const scrollLeft = el.offsetLeft - (container.offsetWidth / 2) + (el.offsetWidth / 2);
      container.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
    }
  }, [active]);

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:flex items-center gap-0 bg-white border-b border-[#EBEBEB] px-5 h-9 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = active === tab.path || active.startsWith(tab.path + '/');
          return (
            <button
              key={tab.path}
              onClick={() => onTabClick(tab.path)}
              className={`
                px-3 h-full text-[12px] font-medium whitespace-nowrap transition-colors
                border-b-[2px]
                ${isActive
                  ? 'text-[#171717] border-[#171717]'
                  : 'text-[#A3A3A3] border-transparent hover:text-[#525252]'
                }
              `}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Mobile: horizontal scrollable */}
      <div className="md:hidden bg-white border-b border-[#EBEBEB]">
        <div
          ref={scrollRef}
          className="flex overflow-x-auto px-3 py-1.5 gap-1 snap-x snap-mandatory"
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
                  px-2.5 py-1.5 text-[11px] font-medium whitespace-nowrap snap-start flex-shrink-0
                  transition-colors
                  ${isActive
                    ? 'text-[#171717] bg-[#F7F7F7]'
                    : 'text-[#A3A3A3]'
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
