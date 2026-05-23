import React, { useState } from 'react';
import { Bell, AlertTriangle, CheckCircle2, Clock, Loader2, Zap } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui';
import { useNotifications } from '@/hooks/useSupabaseData';

const ACTION_ICONS: Record<string, React.ReactNode> = {
  alert: <AlertTriangle className="w-4 h-4 text-amber-400" />,
  reminder: <Clock className="w-4 h-4 text-indigo-400" />,
  update: <CheckCircle2 className="w-4 h-4 text-green-400" />,
  action: <Zap className="w-4 h-4 text-accent" />,
};

export function NotificationsPage() {
  const { data: notifications, loading } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;

  const items = filter === 'all' ? notifications : notifications.slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-text-primary">Notifications</h1>
          <p className="text-text-secondary">Action items and pipeline alerts</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setFilter('all')} className={`px-3 py-2 text-sm rounded-lg min-h-[44px] ${filter === 'all' ? 'bg-accent text-white' : 'bg-bg-tertiary text-text-muted'}`}>All</button>
          <button onClick={() => setFilter('unread')} className={`px-3 py-2 text-sm rounded-lg min-h-[44px] ${filter === 'unread' ? 'bg-accent text-white' : 'bg-bg-tertiary text-text-muted'}`}>Recent</button>
        </div>
      </div>

      {items.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-text-muted">
          <Bell className="w-8 h-8 mx-auto mb-3 opacity-50" />
          No notifications yet. Pipeline events and actions will appear here.
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {items.map((n, i) => {
            const actionType = n.action_type ?? n.type ?? 'action';
            return (
              <Card key={n.id ?? i}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-bg-tertiary flex items-center justify-center flex-shrink-0 mt-0.5">
                      {ACTION_ICONS[actionType] ?? <Bell className="w-4 h-4 text-text-muted" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary">{n.title ?? n.action ?? 'Notification'}</p>
                      <p className="text-xs text-text-muted mt-0.5">{n.description ?? n.details ?? ''}</p>
                      <p className="text-xs text-text-muted mt-1">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                    {n.status && <Badge variant={n.status === 'completed' ? 'success' : n.status === 'pending' ? 'warning' : 'default'}>{n.status}</Badge>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
