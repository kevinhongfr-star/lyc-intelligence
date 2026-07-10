/**
 * TopBar — Single unified header
 * Combines brand + surface selector + user actions in one bar
 * No dropdowns, no multi-bar stacks. Clean, modern, app-like.
 */
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Settings, Briefcase, Building2, GraduationCap, User } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export type Surface = 'internal' | 'client' | 'coaching' | 'candidate';

interface TopBarProps {
  activeSurface: Surface;
  onSurfaceChange: (surface: Surface) => void;
}

const SURFACES: { id: Surface; label: string; icon: React.ReactNode }[] = [
  { id: 'internal', label: 'Internal', icon: <Briefcase className="w-4 h-4" /> },
  { id: 'client', label: 'Clients', icon: <Building2 className="w-4 h-4" /> },
  { id: 'coaching', label: 'Coaching', icon: <GraduationCap className="w-4 h-4" /> },
  { id: 'candidate', label: 'Candidates', icon: <User className="w-4 h-4" /> },
];

export function TopBar({ activeSurface, onSurfaceChange }: TopBarProps) {
  const { user, profile, logout } = useAuthStore();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const initials = (profile?.full_name || user?.email || 'U')
    .split(' ')
    .map(s => s[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#E5E5E5] h-14 flex items-center px-5 gap-4">
      {/* Brand */}
      <Link to="/" className="flex items-center gap-2 no-underline flex-shrink-0">
        <span className="font-bold text-base text-[#171717] tracking-tight">LYC</span>
        <span className="text-sm font-medium text-[#737373] hidden lg:inline">Intelligence</span>
      </Link>

      {/* Divider */}
      <div className="w-px h-6 bg-[#E5E5E5] hidden sm:block" />

      {/* Surface Selector — segmented control */}
      <nav className="flex items-center gap-0.5">
        {SURFACES.map((s) => {
          const isActive = activeSurface === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onSurfaceChange(s.id)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium
                transition-colors duration-150
                ${isActive
                  ? 'text-[#171717] bg-[#F5F5F5]'
                  : 'text-[#737373] hover:text-[#171717] hover:bg-[#FAFAFA]'
                }
              `}
            >
              {s.icon}
              <span className="hidden md:inline">{s.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/app/notifications')}
          className="relative flex items-center justify-center w-9 h-9 text-[#737373] hover:text-[#171717] transition-colors"
        >
          <Bell className="w-5 h-5" />
        </button>

        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#F5F5F5] transition-colors"
          >
            <div className="w-7 h-7 flex items-center justify-center text-xs font-semibold text-[#404040] bg-[#F5F5F5] border border-[#E5E5E5]">
              {initials}
            </div>
            <span className="text-sm font-medium text-[#171717] hidden md:inline">
              {profile?.full_name?.split(' ')[0] || 'User'}
            </span>
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-11 w-52 bg-white border border-[#E5E5E5] overflow-hidden z-50 shadow-lg">
              <div className="px-4 py-3 border-b border-[#E5E5E5]">
                <div className="text-sm font-medium text-[#171717]">{profile?.full_name || 'User'}</div>
                <div className="text-xs text-[#737373] mt-0.5">{profile?.role || 'Member'}</div>
              </div>
              <div className="py-1">
                <button
                  onClick={() => { navigate('/app/platform-settings'); setUserMenuOpen(false); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-[#404040] hover:bg-[#F5F5F5]"
                >
                  <Settings className="w-4 h-4" /> Settings
                </button>
                <button
                  onClick={() => logout()}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-[#404040] hover:bg-[#F5F5F5]"
                >
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default TopBar;
