/**
 * SurfaceTabs — 4-surface tab bar (Internal / B2B / B2C / Candidate)
 * Desktop: horizontal tabs with fuchsia accent on active
 * Mobile: hamburger menu with dropdown overlay
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
  { id: 'internal', label: 'Internal Ops', icon: <Briefcase className="w-4 h-4" /> },
  { id: 'client', label: 'B2B Client', icon: <Building2 className="w-4 h-4" /> },
  { id: 'coaching', label: 'B2C Coaching', icon: <GraduationCap className="w-4 h-4" /> },
  { id: 'candidate', label: 'Candidate', icon: <User className="w-4 h-4" /> },
];

interface SurfaceTabsProps {
  active: Surface;
  onChange: (surface: Surface) => void;
}

export function SurfaceTabs({ active, onChange }: SurfaceTabsProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [mobileMenuOpen]);

  const activeTab = SURFACE_TABS.find(t => t.id === active);

  const handleSelect = (surface: Surface) => {
    onChange(surface);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Desktop: horizontal tabs */}
      <div className="hidden md:block bg-white border-b border-border px-6">
        <div className="flex gap-1">
          {SURFACE_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors
                ${active === tab.id
                  ? 'text-fuchsia border-b-2 border-fuchsia bg-fuchsia-light'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-warm'
                }
              `}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile: hamburger + dropdown */}
      <div className="md:hidden bg-white border-b border-border px-4 py-2 relative" ref={menuRef}>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-bg-warm transition-colors w-full justify-between"
          aria-label="Toggle navigation menu"
        >
          <div className="flex items-center gap-2">
            <Menu className="w-5 h-5 text-text-secondary" />
            <span className="text-sm font-medium text-text-primary">
              {activeTab?.label || 'Menu'}
            </span>
          </div>
          {mobileMenuOpen ? (
            <X className="w-4 h-4 text-text-muted" />
          ) : (
            <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>

        {mobileMenuOpen && (
          <div className="absolute left-4 right-4 top-full mt-1 bg-white rounded-lg shadow-lg border border-border overflow-hidden z-50">
            {SURFACE_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleSelect(tab.id)}
                className={`
                  flex items-center gap-3 w-full px-4 py-3 text-sm font-medium transition-colors
                  ${active === tab.id
                    ? 'text-fuchsia bg-fuchsia-light border-l-2 border-fuchsia'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-warm'
                  }
                `}
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
