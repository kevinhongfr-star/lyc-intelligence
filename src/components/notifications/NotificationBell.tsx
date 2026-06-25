// Phase 7.3: Notification Bell Component
// In-app bell icon with dropdown

'use client';

import React, { useState, useEffect } from 'react';
import { authFetch } from '@/utils/authFetch';
import {
  Bell,
  BellDot,
  Clock,
  ChevronRight,
  Check,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

interface NotificationBellProps {
  userId: string;
  /**
   * Callback when notification is clicked
   */
  onNotificationClick?: (notification: Notification) => void;
  /**
   * Callback to navigate to notifications page
   */
  onViewAll?: () => void;
}

const NOTIFICATION_TYPE_COLORS: Record<string, string> = {
  feedback_received: 'bg-green-100 text-green-700',
  candidate_advanced: 'bg-blue-100 text-blue-700',
  interview_scheduled: 'bg-purple-100 text-purple-700',
  new_candidate_added: 'bg-teal-100 text-teal-700',
  report_ready: 'bg-orange-100 text-orange-700',
  reference_submitted: 'bg-pink-100 text-pink-700',
  offer_status_changed: 'bg-red-100 text-red-700',
  milestone_at_risk: 'bg-amber-100 text-amber-700',
  message_received: 'bg-indigo-100 text-indigo-700',
};

const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  feedback_received: 'Feedback',
  candidate_advanced: 'Candidate',
  interview_scheduled: 'Interview',
  new_candidate_added: 'New Candidate',
  report_ready: 'Report',
  reference_submitted: 'Reference',
  offer_status_changed: 'Offer',
  milestone_at_risk: 'Milestone',
  message_received: 'Message',
};

export function NotificationBell({ userId, onNotificationClick, onViewAll }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch notifications
  useEffect(() => {
    async function fetchNotifications() {
      if (!isOpen || !userId) return;

      setIsLoading(true);

      try {
        const response = await authFetch(`/api/data/notifications?user_id=${userId}&limit=10`);
        const result = await response.json();

        if (result.success) {
          setNotifications(result.data);
          setUnreadCount(result.data.filter((n: Notification) => !n.read).length);
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchNotifications();
  }, [isOpen, userId]);

  // Mark as read handler
  const handleMarkAsRead = async (notificationId: string) => {
    await authFetch(`/api/data/notifications/${notificationId}/read`, {
      method: 'POST',
    });

    setNotifications(notifications.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    ));
    setUnreadCount(Math.max(0, unreadCount - 1));
  };

  // Handle notification click
  const handleClick = (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    onNotificationClick?.(notification);
    setIsOpen(false);
  };

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get type config
  const getTypeConfig = (type: string) => ({
    color: NOTIFICATION_TYPE_COLORS[type] || 'bg-gray-100 text-gray-700',
    label: NOTIFICATION_TYPE_LABELS[type] || type.replace('_', ' '),
  });

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-bg-alt rounded-full transition-colors"
      >
        {unreadCount > 0 ? (
          <BellDot className="w-5 h-5 text-text-muted" />
        ) : (
          <Bell className="w-5 h-5 text-text-muted" />
        )}
        {unreadCount > 0 && (
          <Badge
            variant="default"
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] text-xs flex items-center justify-center p-0"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Content */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="font-medium text-text-primary">Notifications</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-bg-alt rounded transition-colors"
              >
                <X className="w-4 h-4 text-text-muted" />
              </button>
            </div>

            {/* Content */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Clock className="w-5 h-5 text-text-muted animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="w-10 h-10 text-text-muted mx-auto" />
                  <p className="text-text-muted mt-2">No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map(notification => {
                    const typeConfig = getTypeConfig(notification.type);

                    return (
                      <button
                        key={notification.id}
                        onClick={() => handleClick(notification)}
                        className={`w-full px-4 py-3 text-left hover:bg-bg-alt transition-colors ${
                          !notification.read ? 'bg-primary/5' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Type indicator */}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeConfig.color} flex-shrink-0 mt-0.5`}>
                            {typeConfig.label}
                          </span>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${
                              notification.read ? 'text-text-secondary' : 'text-text-primary'
                            }`}>
                              {notification.title}
                            </p>
                            {notification.message && (
                              <p className="text-xs text-text-muted mt-0.5 line-clamp-2">
                                {notification.message}
                              </p>
                            )}
                            <p className="text-xs text-text-muted mt-1">
                              {formatTime(notification.createdAt)}
                            </p>
                          </div>

                          {/* Chevron + Read indicator */}
                          <div className="flex items-center gap-1">
                            {!notification.read && (
                              <div className="w-2 h-2 rounded-full bg-primary" />
                            )}
                            <ChevronRight className="w-4 h-4 text-text-muted" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-3 border-t border-border">
                <button
                  onClick={() => {
                    onViewAll?.();
                    setIsOpen(false);
                  }}
                  className="w-full text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  View All Notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default NotificationBell;