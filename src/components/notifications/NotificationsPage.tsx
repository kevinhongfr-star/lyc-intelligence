// Phase 7.3: Notifications Page Component
// Full page listing of all notifications

'use client';

import React, { useState, useEffect } from 'react';
import { authFetch } from '@/utils/authFetch';
import {
  Check,
  Clock,
  Filter,
  RefreshCw,
  ChevronRight,
  MarkRead,
  Loader2,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  read: boolean;
  emailSent: boolean;
  createdAt: string;
}

interface NotificationsPageProps {
  userId: string;
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
  feedback_received: 'Feedback Received',
  candidate_advanced: 'Candidate Advanced',
  interview_scheduled: 'Interview Scheduled',
  new_candidate_added: 'New Candidate',
  report_ready: 'Report Ready',
  reference_submitted: 'Reference Submitted',
  offer_status_changed: 'Offer Status Changed',
  milestone_at_risk: 'Milestone at Risk',
  message_received: 'Message Received',
};

type FilterType = 'all' | 'unread' | string;

export function NotificationsPage({ userId }: NotificationsPageProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications
  useEffect(() => {
    async function fetchNotifications() {
      setIsLoading(true);

      try {
        const params = new URLSearchParams();
        params.set('user_id', userId);
        params.set('limit', '100');
        if (filter !== 'all') {
          params.set('filter', filter);
        }

        const response = await authFetch(`/api/data/notifications?${params}`);
        const result = await response.json();

        if (result.success) {
          setNotifications(result.data);
          setUnreadCount(result.data.filter((n: Notification) => !n.read).length);
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }

    fetchNotifications();
  }, [userId, filter]);

  // Mark notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    await authFetch(`/api/data/notifications/${notificationId}/read`, {
      method: 'POST',
    });

    setNotifications(notifications.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    ));
    setUnreadCount(Math.max(0, unreadCount - 1));
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    await authFetch(`/api/data/notifications/${userId}/read-all`, {
      method: 'POST',
    });

    setNotifications(notifications.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }

    if (notification.link) {
      window.location.href = notification.link;
    }
  };

  // Format time
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get type config
  const getTypeConfig = (type: string) => ({
    color: NOTIFICATION_TYPE_COLORS[type] || 'bg-gray-100 text-gray-700',
    label: NOTIFICATION_TYPE_LABELS[type] || type.replace('_', ' '),
  });

  // Loading state
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <span className="ml-2 text-text-muted">Loading notifications...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Notifications</h1>
          <p className="text-sm text-text-muted mt-1">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            className="gap-2"
          >
            <MarkRead className="w-4 h-4" />
            Mark All as Read
          </Button>
          <button
            onClick={() => {
              setIsRefreshing(true);
              setFilter('all');
            }}
            className="p-2 hover:bg-bg-alt rounded-lg transition-colors"
          >
            <RefreshCw className={`w-5 h-5 text-text-muted ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-text-muted" />
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary text-white'
                : 'bg-bg-alt text-text-muted hover:bg-bg-base'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-primary text-white'
                : 'bg-bg-alt text-text-muted hover:bg-bg-base'
            }`}
          >
            Unread
          </button>
          <div className="relative">
            <select
              value={filter === 'all' || filter === 'unread' ? '' : filter}
              onChange={(e) => setFilter(e.target.value || 'all')}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-bg-alt text-text-muted border-none focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Filter by type...</option>
              {Object.entries(NOTIFICATION_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <Card className="p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-bg-alt flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8 text-text-muted" />
          </div>
          <h3 className="font-medium text-text-primary mt-4">No Notifications</h3>
          <p className="text-sm text-text-muted mt-1">
            {filter !== 'all' ? 'Try adjusting your filters' : 'You have no notifications'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map(notification => {
            const typeConfig = getTypeConfig(notification.type);

            return (
              <Card
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 hover:bg-bg-alt transition-colors cursor-pointer ${
                  !notification.read ? 'border-l-4 border-l-primary' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Status indicator */}
                  <div className="flex flex-col items-center gap-2">
                    {!notification.read ? (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    ) : (
                      <Check className="w-4 h-4 text-green-500" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeConfig.color}`}>
                        {typeConfig.label}
                      </span>
                      {notification.emailSent && (
                        <Badge variant="outline" className="text-xs">
                          Email Sent
                        </Badge>
                      )}
                    </div>

                    <h3 className={`font-medium mt-2 ${
                      notification.read ? 'text-text-secondary' : 'text-text-primary'
                    }`}>
                      {notification.title}
                    </h3>

                    {notification.message && (
                      <p className="text-sm text-text-muted mt-1">
                        {notification.message}
                      </p>
                    )}

                    <p className="text-xs text-text-muted mt-2">
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="w-5 h-5 text-text-muted flex-shrink-0" />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;