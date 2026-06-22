import React, { useState, useEffect } from 'react';
import { Bell, X, Clock, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { getNotifications, markNotificationAsRead, markAllAsRead } from '@/services/supabaseApi';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string;
  read: boolean;
  created_at: string;
  metadata?: Record<string, any>;
}

export function NotificationBell() {
  const { profile } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, [profile?.id, isOpen]);

  const loadNotifications = async () => {
    if (!profile?.id) return;
    
    setLoading(true);
    const data = await getNotifications(profile.id);
    setNotifications(data);
    setLoading(false);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    await markNotificationAsRead(notificationId);
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    ));
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead(profile?.id || '');
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleNotificationClick = (notification: Notification) => {
    handleMarkAsRead(notification.id);
    setIsOpen(false);
    if (notification.link) {
      window.location.href = notification.link;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'feedback_received':
        return '✅';
      case 'candidate_advanced':
        return '📈';
      case 'interview_scheduled':
        return '📅';
      case 'new_candidate_added':
        return '➕';
      case 'report_ready':
        return '📊';
      default:
        return '🔔';
    }
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5 text-text-secondary" />
        {unreadCount > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs flex items-center justify-center p-0"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-bg-tertiary rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-bg-tertiary">
            <h3 className="font-semibold text-text-primary">Notifications</h3>
            {notifications.length > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-accent hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-10 h-10 text-text-muted mx-auto mb-3" />
                <p className="text-text-muted">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-bg-tertiary">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 cursor-pointer hover:bg-bg-secondary transition-colors ${
                      notification.read ? 'opacity-60' : 'bg-accent/5'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg">{getTypeIcon(notification.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-text-primary text-sm">
                          {notification.title}
                        </p>
                        <p className="text-xs text-text-muted mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="w-3 h-3 text-text-muted" />
                          <span className="text-xs text-text-muted">
                            {formatDate(notification.created_at)}
                          </span>
                        </div>
                      </div>
                      {notification.link && (
                        <ExternalLink className="w-4 h-4 text-text-muted flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-bg-tertiary bg-bg-secondary">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full text-sm text-text-muted hover:text-text-primary"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
