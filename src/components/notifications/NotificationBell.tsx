import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  BellDot,
  Clock,
  ChevronRight,
  Check,
  X,
  Settings,
  ChevronDown,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui';
import {
  Notification,
  NotificationType,
  NOTIFICATION_TYPES,
  NOTIFICATION_CATEGORIES,
  formatRelativeTime,
  getNotificationTypeConfig,
} from '@/services/notifications/notificationService';

interface NotificationBellProps {
  userId: string;
  onNotificationClick?: (notification: Notification) => void;
  onViewAll?: () => void;
  onSettingsClick?: () => void;
  notifications?: Notification[];
  unreadCount?: number;
  onMarkAsRead?: (id: string) => void;
  onMarkAllRead?: () => void;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  candidate: 'bg-green-100 text-green-700',
  pipeline: 'bg-blue-100 text-blue-700',
  interview: 'bg-purple-100 text-purple-700',
  reports: 'bg-orange-100 text-orange-700',
  offer: 'bg-emerald-100 text-emerald-700',
  sla: 'bg-red-100 text-red-700',
  communication: 'bg-indigo-100 text-indigo-700',
  social: 'bg-pink-100 text-pink-700',
  workflow: 'bg-amber-100 text-amber-700',
  system: 'bg-gray-100 text-gray-700',
  billing: 'bg-rose-100 text-rose-700',
  events: 'bg-violet-100 text-violet-700',
  coaching: 'bg-teal-100 text-teal-700',
  intelligence: 'bg-cyan-100 text-cyan-700',
  ai: 'bg-fuchsia-100 text-fuchsia-700',
};

export function NotificationBell({
  userId,
  onNotificationClick,
  onViewAll,
  onSettingsClick,
  notifications: externalNotifications,
  unreadCount: externalUnreadCount,
  onMarkAsRead,
  onMarkAllRead,
  onDelete,
  isLoading = false,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const notifications = externalNotifications || [];
  const unreadCount = externalUnreadCount ?? notifications.filter(n => !n.read).length;

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'unread' && n.read) return false;
    if (activeCategory) {
      const config = getNotificationTypeConfig(n.type);
      if (config?.category !== activeCategory) return false;
    }
    return true;
  });

  const handleMarkAsRead = useCallback((id: string) => {
    onMarkAsRead?.(id);
  }, [onMarkAsRead]);

  const handleMarkAllRead = useCallback(() => {
    onMarkAllRead?.();
  }, [onMarkAllRead]);

  const handleClick = (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    onNotificationClick?.(notification);
    setIsOpen(false);
  };

  const getTypeColor = (type: NotificationType) => {
    const config = getNotificationTypeConfig(type);
    return TYPE_COLORS[config?.category || 'system'] || 'bg-gray-100 text-gray-700';
  };

  const getTypeLabel = (type: NotificationType) => {
    const config = getNotificationTypeConfig(type);
    return config?.label || type;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-bg-alt rounded-full transition-colors"
        aria-label="Notifications"
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

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 top-full mt-2 w-96 bg-card border border-border rounded-none shadow-xl z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="font-medium text-text-primary">Notifications</h3>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="p-1.5 hover:bg-bg-alt rounded transition-colors text-text-muted hover:text-text-primary"
                    title="Mark all as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                {onSettingsClick && (
                  <button
                    onClick={() => {
                      onSettingsClick();
                      setIsOpen(false);
                    }}
                    className="p-1.5 hover:bg-bg-alt rounded transition-colors text-text-muted hover:text-text-primary"
                    title="Notification settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-bg-alt rounded transition-colors text-text-muted hover:text-text-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 border-b border-border overflow-x-auto">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  activeFilter === 'all'
                    ? 'bg-primary text-white'
                    : 'bg-bg-alt text-text-secondary hover:bg-bg-alt/80'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveFilter('unread')}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  activeFilter === 'unread'
                    ? 'bg-primary text-white'
                    : 'bg-bg-alt text-text-secondary hover:bg-bg-alt/80'
                }`}
              >
                Unread
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors flex items-center gap-1 ${
                  activeCategory
                    ? 'bg-primary text-white'
                    : 'bg-bg-alt text-text-secondary hover:bg-bg-alt/80'
                }`}
              >
                Filter
                <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {showFilters && (
              <div className="px-4 py-2 border-b border-border bg-bg-alt/30">
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setActiveCategory(null)}
                    className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                      activeCategory === null
                        ? 'bg-primary text-white'
                        : 'bg-white text-text-secondary hover:bg-bg-alt border border-border'
                    }`}
                  >
                    All types
                  </button>
                  {NOTIFICATION_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                        activeCategory === cat.id
                          ? 'bg-primary text-white'
                          : 'bg-white text-text-secondary hover:bg-bg-alt border border-border'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Clock className="w-5 h-5 text-text-muted animate-spin" />
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="w-10 h-10 text-text-muted mx-auto mb-2" />
                  <p className="text-text-muted text-sm">
                    {activeFilter === 'unread'
                      ? 'No unread notifications'
                      : activeCategory
                      ? `No ${NOTIFICATION_CATEGORIES.find(c => c.id === activeCategory)?.label.toLowerCase()} notifications`
                      : 'No notifications yet'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredNotifications.slice(0, 20).map(notification => (
                    <div
                      key={notification.id}
                      className={`group px-4 py-3 hover:bg-bg-alt transition-colors cursor-pointer ${
                        !notification.read ? 'bg-primary/5' : ''
                      }`}
                      onClick={() => handleClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${getTypeColor(notification.type)} flex-shrink-0 mt-0.5`}>
                          {getTypeLabel(notification.type)}
                        </span>

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
                          <p className="text-[11px] text-text-muted mt-1">
                            {formatRelativeTime(notification.createdAt)}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notification.read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification.id);
                              }}
                              className="p-1 hover:bg-white rounded text-text-muted hover:text-text-primary"
                              title="Mark as read"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(notification.id);
                              }}
                              className="p-1 hover:bg-white rounded text-text-muted hover:text-error"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="px-4 py-3 border-t border-border flex items-center justify-between">
                <button
                  onClick={() => {
                    onViewAll?.();
                    setIsOpen(false);
                  }}
                  className="text-sm text-primary hover:text-primary/80 font-medium"
                >
                  View All Notifications
                </button>
                <ChevronRight className="w-4 h-4 text-text-muted" />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default NotificationBell;
