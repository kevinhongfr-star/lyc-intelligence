/**
 * TopBar — Brand + notification bell + user menu
 * Mockup v14 style: clean header with fuchsia brand accent
 */
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, User, LogOut, Settings, ChevronDown } from 'lucide-react';
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

  // Fetch notifications
  useEffect(() => {
    if (user) {
      getNotifications().then(items => {
        setNotifications(items.filter(n => n.status === 'Pending' || !n.read_at));
      }).catch(() => {});
    }
  }, [user]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const unreadCount = notifications.length;

  return (
    <header className="sticky top-0 z-sticky bg-white border-b border-border px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 group">
          <span className="font-serif font-bold text-xl text-text-primary group-hover:text-fuchsia transition-colors">
            DEX AI
          </span>
          <span className="text-xxs uppercase tracking-widest text-text-muted font-semibold">
            Talent Intelligence
          </span>
        </Link>

        {/* Right section: notifications + user */}
        <div className="flex items-center gap-4">
          {/* Notification Bell */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-bg-warm transition-colors relative"
            >
              <Bell className="w-5 h-5 text-text-secondary" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red text-white text-xxs font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {notifOpen && (
              <div className="absolute right-0 top-12 w-80 bg-white rounded-card shadow-modal border border-border overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <span className="font-semibold text-text-primary">Notifications</span>
                  <Link to="/app/notifications" className="text-xxs text-fuchsia hover:underline">
                    View all
                  </Link>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-text-muted">
                      No new notifications
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((notif, i) => (
                      <div key={notif.id || i} className="px-4 py-3 hover:bg-bg-warm cursor-pointer border-b border-border last:border-b-0">
                        <div className="text-sm text-text-primary">{notif.title || notif.message || 'Notification'}</div>
                        <div className="text-xxs text-text-muted mt-1">
                          {notif.created_at ? new Date(notif.created_at).toLocaleDateString() : 'Recent'}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-bg-warm transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-fuchsia-light flex items-center justify-center">
                <User className="w-4 h-4 text-fuchsia" />
              </div>
              <span className="text-sm font-medium text-text-primary">
                {profile?.full_name || user?.email?.split('@')[0] || 'User'}
              </span>
              <ChevronDown className="w-4 h-4 text-text-muted" />
            </button>

            {/* User Dropdown */}
            {dropdownOpen && (
              <div className="absolute right-0 top-12 w-56 bg-white rounded-card shadow-modal border border-border overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <div className="text-sm font-semibold text-text-primary">
                    {profile?.full_name || 'User'}
                  </div>
                  <div className="text-xxs text-text-muted">
                    {profile?.role || 'Member'}
                  </div>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => { navigate('/app/platform-settings'); setDropdownOpen(false); }}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-text-secondary hover:bg-bg-warm"
                  >
                    <Settings className="w-4 h-4" /> Settings
                  </button>
                  <button
                    onClick={() => logout()}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-text-secondary hover:bg-bg-warm"
                  >
                    <LogOut className="w-4 h-4" /> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default TopBar;