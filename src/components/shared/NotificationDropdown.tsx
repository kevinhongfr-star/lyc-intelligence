/**
 * NotificationDropdown — Dropdown from bell icon
 * Mockup v14: unread indicator, title + detail + time, close button
 */
import React from 'react';
import { X, Bell } from 'lucide-react';

export interface NotificationItem {
  id: string;
  title: string;
  detail: string;
  time: string;
  unread: boolean;
}

interface NotificationDropdownProps {
  notifications: NotificationItem[];
  onClose: () => void;
  onDismiss: (id: string) => void;
}

export function NotificationDropdown({ notifications, onClose, onDismiss }: NotificationDropdownProps) {
  return (
    <div className="absolute right-0 top-12 w-80 bg-white rounded-card shadow-modal border border-border overflow-hidden z-popover">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-fuchsia" />
          <span className="font-semibold text-text-primary text-sm">Notifications</span>
        </div>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-4 py-6 text-center text-text-muted text-sm">
            No new notifications
          </div>
        ) : (
          notifications.map((notif) => (
            <div key={notif.id} className="px-4 py-3 border-b border-border last:border-b-0 hover:bg-bg-warm group">
              <div className="flex items-start gap-3">
                {notif.unread && (
                  <div className="w-2 h-2 rounded-full bg-fuchsia mt-1.5 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text-primary">{notif.title}</div>
                  <div className="text-xs text-text-secondary mt-0.5">{notif.detail}</div>
                  <div className="text-xxs text-text-muted mt-1">{notif.time}</div>
                </div>
                <button
                  onClick={() => onDismiss(notif.id)}
                  className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-text-primary transition-opacity"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default NotificationDropdown;
