import React from 'react';
import { Bell } from 'lucide-react';

export type NotificationType = 'urgent' | 'info' | 'neutral';

export interface Notification {
  id: string;
  type: NotificationType;
  text: string;
  date: string;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', type: 'urgent', text: 'New interview scheduled — VP Eng TechCorp', date: 'Today' },
  { id: '2', type: 'urgent', text: 'Assessment reminder — Technical Review Jul 10', date: 'Today' },
  { id: '3', type: 'info', text: 'New opportunity — NeoBank CTO 92% fit', date: 'Yesterday' },
  { id: '4', type: 'neutral', text: 'Application update — Head Platform Shortlisted', date: 'Jul 3' },
];

const DOT_COLOR: Record<NotificationType, string> = {
  urgent: 'bg-error',
  info: 'bg-teal',
  neutral: 'bg-text-muted',
};

interface NotificationCenterProps {
  notifications?: Notification[];
}

export function NotificationCenter({ notifications = MOCK_NOTIFICATIONS }: NotificationCenterProps) {
  return (
    <div className="bg-bg-secondary border border-bg-tertiary p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-lg font-bold text-text-primary">Notifications</h2>
        <span className="flex items-center gap-2 text-xs text-text-muted">
          <Bell className="w-4 h-4" />
          {notifications.filter(n => n.type === 'urgent').length} urgent
        </span>
      </div>

      <div className="divide-y divide-bg-tertiary">
        {notifications.map((n) => (
          <div key={n.id} className="flex items-start gap-3 py-3">
            <div className={`mt-1.5 w-2 h-2 shrink-0 ${DOT_COLOR[n.type]}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary">{n.text}</p>
              <p className="text-xs text-text-muted mt-0.5">{n.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
