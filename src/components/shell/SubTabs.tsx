/**
 * SubTabs — Secondary navigation
 * Larger text, better contrast, clean underline active state
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
      <div className="hidden md:flex items-center gap-0 bg-white border-b border-[#E5E5E5] px-5 h-11 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = active === tab.path || active.startsWith(tab.path + '/');
          return (
            <button
              key={tab.path}
              onClick={() => onTabClick(tab.path)}
              className={`
                px-4 h-full text-[14px] font-medium whitespace-nowrap transition-colors duration-150
                border-b-[2px]
                ${isActive
                  ? 'text-[#171717] border-[#171717]'
                  : 'text-[#404040] border-transparent hover:text-[#171717]'
                }
              `}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Mobile: horizontal scroll */}
      <div className="md:hidden bg-white border-b border-[#E5E5E5]">
        <div
          ref={scrollRef}
          className="flex overflow-x-auto px-3 py-2 gap-1 snap-x snap-mandatory"
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
                  px-3 py-1.5 text-[13px] font-medium whitespace-nowrap snap-start flex-shrink-0
                  transition-colors duration-150
                  ${isActive
                    ? 'text-[#171717] bg-[#F5F5F5]'
                    : 'text-[#404040]'
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
