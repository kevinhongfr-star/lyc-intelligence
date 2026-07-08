'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  X,
  AlertTriangle,
  CheckCircle,
  Info,
  AlertCircle,
} from 'lucide-react';

interface ToastNotification {
  id: string;
  title: string;
  content?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  type?: string;
  resource_type?: string;
  resource_id?: string;
  onClick?: () => void;
}

interface NotificationToastProps {
  notifications: ToastNotification[];
  onDismiss: (id: string) => void;
}

const PRIORITY_CONFIG = {
  low: {
    border: 'border-l-4 border-l-gray-400',
    icon: Info,
    iconColor: 'text-gray-500',
    bg: 'bg-card',
  },
  normal: {
    border: 'border-l-4 border-l-blue-500',
    icon: Bell,
    iconColor: 'text-blue-500',
    bg: 'bg-card',
  },
  high: {
    border: 'border-l-4 border-l-amber-500',
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
    bg: 'bg-card',
  },
  urgent: {
    border: 'border-l-4 border-l-red-500',
    icon: AlertCircle,
    iconColor: 'text-red-500',
    bg: 'bg-red-50 dark:bg-red-900/20',
  },
};

export function NotificationToast({ notifications, onDismiss }: NotificationToastProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {notifications.map(notification => (
        <ToastItem
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}

function ToastItem({ notification, onDismiss }: {
  notification: ToastNotification;
  onDismiss: (id: string) => void;
}) {
  const [isVisible, setIsVisible] = useState(true);
  const config = PRIORITY_CONFIG[notification.priority];
  const Icon = config.icon;

  useEffect(() => {
    if (notification.priority === 'high' || notification.priority === 'urgent') {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onDismiss(notification.id), 300);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification.id, notification.priority, onDismiss]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss(notification.id), 300);
  };

  const handleClick = () => {
    if (notification.onClick) {
      notification.onClick();
      handleClose();
    }
  };

  return (
    <div
      className={`${config.bg} ${config.border} border border-border rounded-none shadow-lg overflow-hidden transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-text-primary text-sm">{notification.title}</p>
            {notification.content && (
              <p className="text-sm text-text-muted mt-1 line-clamp-2">{notification.content}</p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-bg-alt rounded transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-text-muted" />
          </button>
        </div>
        {notification.onClick && (
          <button
            onClick={handleClick}
            className="text-xs text-primary hover:text-primary/80 mt-2 font-medium"
          >
            View details →
          </button>
        )}
      </div>
    </div>
  );
}

export function useNotificationToast() {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const showToast = useCallback((notification: Omit<ToastNotification, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts(prev => [...prev, { ...notification, id }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, showToast, dismissToast };
}

export default NotificationToast;
