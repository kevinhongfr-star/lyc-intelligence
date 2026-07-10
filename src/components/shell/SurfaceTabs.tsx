/**
 * SurfaceTabs — 4-surface tab bar (Internal / B2B / B2C / Candidate)
 * Linear-inspired: compact, subtle, content-focused
 */
import React, { useState, useRef, useEffect } from 'react';
import { Briefcase, Building2, GraduationCap, User, Menu, X } from 'lucide-react';

export type Surface = 'internal' | 'client' | 'coaching' | 'candidate';

interface SurfaceTab {
  id: Surface;
  label: string;
  icon: React.ReactNode;
}

const SURFACE_TABS: SurfaceTab[] = [
  { id: 'internal', label: 'Internal', icon: <Briefcase className="w-3.5 h-3.5" /> },
  { id: 'client', label: 'Clients', icon: <Building2 className="w-3.5 h-3.5" /> },
  { id: 'coaching', label: 'Coaching', icon: <GraduationCap className="w-3.5 h-3.5" /> },
  { id: 'candidate', label: 'Candidates', icon: <User className="w-3.5 h-3.5" /> },
];

interface SurfaceTabsProps {
  active: Surface;
  onChange: (surface: Surface) => void;
}

export function SurfaceTabs({ active, onChange }: SurfaceTabsProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [mobileMenuOpen]);

  const activeTab = SURFACE_TABS.find(t => t.id === active);

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:flex items-center gap-0 bg-white border-b border-[#EBEBEB] px-5 h-10">
        {SURFACE_TABS.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`
                flex items-center gap-1.5 px-3 h-full text-[12px] font-medium
                border-b-[2px] transition-colors
                ${isActive
                  ? 'text-[#171717] border-[#C108AB]'
                  : 'text-[#A3A3A3] border-transparent hover:text-[#525252]'
                }
              `}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Mobile */}
      <div className="md:hidden bg-white border-b border-[#EBEBEB] px-4 py-2 relative" ref={menuRef}>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex items-center gap-2 px-2 py-1.5 w-full justify-between"
        >
          <div className="flex items-center gap-2">
            <Menu className="w-4 h-4 text-[#525252]" />
            <span className="text-[13px] font-medium text-[#171717]">
              {activeTab?.label || 'Menu'}
            </span>
          </div>
          {mobileMenuOpen ? <X className="w-4 h-4 text-[#A3A3A3]" /> : null}
        </button>

        {mobileMenuOpen && (
          <div className="absolute left-4 right-4 top-full mt-1 bg-white border border-[#EBEBEB] shadow-lg overflow-hidden z-50">
            {SURFACE_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { onChange(tab.id); setMobileMenuOpen(false); }}
                className={`flex items-center gap-3 w-full px-4 py-3 text-[13px] font-medium transition-colors
                  ${active === tab.id
                    ? 'text-[#C108AB] bg-[#FAFAFA] border-l-2 border-[#C108AB]'
                    : 'text-[#525252] hover:bg-[#FAFAFA]'
                  }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default SurfaceTabs;
