/**
 * TopBar — Minimal header, Vercel/Linear inspired
 */
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, User, LogOut, Settings, ChevronDown, Command } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { getNotifications } from '@/services/supabaseApi';

export function TopBar() {
  const { user, profile, logout } = useAuthStore();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      getNotifications().then(items => {
        setNotifications(items.filter(n => n.status === 'Pending' || !n.read_at));
      }).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const unreadCount = notifications.length;
  const initials = (profile?.full_name || user?.email || 'U').split(' ').map(s => s[0]).join('').toUpperCase().slice(0, 2);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#EBEBEB] px-5 h-12 flex items-center justify-between">
      {/* Brand */}
      <Link to="/" className="flex items-center gap-2 no-underline group">
        <span className="font-bold text-[15px] text-[#171717] tracking-tight">LYC</span>
        <span className="text-[11px] font-medium text-[#D4D4D4] tracking-wide hidden sm:inline">Intelligence</span>
      </Link>

      {/* Right section */}
      <div className="flex items-center gap-1">
        {/* Keyboard shortcut hint */}
        <button
          onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-[12px] text-[#A3A3A3] border border-[#EBEBEB] hover:border-[#D4D4D4] transition-colors"
        >
          <Command className="w-3 h-3" />
          <span>K</span>
        </button>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative flex items-center justify-center w-9 h-9 text-[#A3A3A3] hover:text-[#171717] transition-colors"
          >
            <Bell className="w-[18px] h-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-[7px] h-[7px] bg-[#DC2626]" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-11 w-80 bg-white border border-[#EBEBEB] shadow-lg overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-[#EBEBEB] flex items-center justify-between">
                <span className="font-semibold text-[13px] text-[#171717]">Notifications</span>
                <Link to="/app/notifications" className="text-[11px] text-[#C108AB] hover:underline">View all</Link>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-[13px] text-[#A3A3A3]">No notifications</div>
                ) : (
                  notifications.slice(0, 5).map((notif, i) => (
                    <div key={notif.id || i} className="px-4 py-3 hover:bg-[#FAFAFA] cursor-pointer border-b border-[#F7F7F7] last:border-b-0">
                      <div className="text-[13px] text-[#171717]">{notif.title || notif.message}</div>
                      <div className="text-[11px] text-[#A3A3A3] mt-1">
                        {notif.created_at ? new Date(notif.created_at).toLocaleDateString() : 'Recent'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 pl-2 pr-1 py-1 hover:bg-[#F7F7F7] transition-colors"
          >
            <div className="w-6 h-6 flex items-center justify-center text-[10px] font-bold text-[#525252] bg-[#F7F7F7] border border-[#EBEBEB]">
              {initials}
            </div>
            <ChevronDown className="w-3 h-3 text-[#A3A3A3]" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-10 w-48 bg-white border border-[#EBEBEB] shadow-lg overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-[#EBEBEB]">
                <div className="text-[13px] font-medium text-[#171717]">{profile?.full_name || 'User'}</div>
                <div className="text-[11px] text-[#A3A3A3] mt-0.5">{profile?.role || 'Member'}</div>
              </div>
              <div className="py-1">
                <button
                  onClick={() => { navigate('/app/platform-settings'); setDropdownOpen(false); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2 text-[13px] text-[#525252] hover:bg-[#FAFAFA]"
                >
                  <Settings className="w-3.5 h-3.5" /> Settings
                </button>
                <button
                  onClick={() => logout()}
                  className="flex items-center gap-2.5 w-full px-4 py-2 text-[13px] text-[#525252] hover:bg-[#FAFAFA]"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign out
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
