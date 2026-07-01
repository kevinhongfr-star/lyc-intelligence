import React, { useState, useEffect } from 'react';
import {
  Building2, Clock, Users, AlertCircle, CheckCircle,
  ChevronRight, TrendingUp, Bell, LogOut
} from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui';

interface ClientMandateListProps {
  onMandateClick?: (mandateId: string) => void;
}

export function ClientMandateList({ onMandateClick }: ClientMandateListProps) {
  const [mandates, setMandates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadMandates();
    loadNotifications();
  }, []);

  async function loadMandates() {
    try {
      const res = await fetch('/api/client/mandates');
      const data = await res.json();
      if (data.success) {
        setMandates(data.mandates);
      }
    } catch (err) {
      console.error('Load mandates error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadNotifications() {
    try {
      const res = await fetch('/api/client/notifications');
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unread_count);
      }
    } catch (err) {
      console.error('Load notifications error:', err);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-700';
      case 'On Hold': return 'bg-yellow-100 text-yellow-700';
      case 'Completed': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active': return <span className="w-2 h-2 rounded-full bg-green-500"></span>;
      case 'On Hold': return <span className="w-2 h-2 rounded-full bg-yellow-500"></span>;
      case 'Completed': return <span className="w-2 h-2 rounded-full bg-gray-400"></span>;
      default: return <span className="w-2 h-2 rounded-full bg-gray-400"></span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-800">LYC Intelligence</h1>
              <p className="text-sm text-gray-500">Client Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>
            <Button variant="ghost" size="sm">
              <LogOut className="w-4 h-4 mr-1" />
              Log Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">My Mandates</h2>
          <Button variant="outline" onClick={loadMandates}>
            <Clock className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>

        {mandates.length === 0 ? (
          <Card className="p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-800">No mandates yet</h3>
            <p className="text-gray-500 mt-1">Your consultant will add mandates as they become available</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {mandates.map((mandate) => (
              <Card
                key={mandate.mandate_id}
                className="p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onMandateClick?.(mandate.mandate_id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {getStatusBadge(mandate.status)}
                      <h3 className="text-xl font-semibold text-gray-800">{mandate.title}</h3>
                      <Badge className={getStatusColor(mandate.status)}>{mandate.status}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span><Users className="w-4 h-4 inline mr-1" />{mandate.lead_consultant_name}</span>
                      <span><Clock className="w-4 h-4 inline mr-1" />Day {mandate.days_since_kickoff}</span>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <TrendingUp className="w-4 h-4" />
                        <span>Pipeline Progress</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 flex items-center gap-1">
                          <div className="flex-1 h-2 bg-blue-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600"
                              style={{ width: `${(mandate.pipeline_summary.sourced / 50) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">S:{mandate.pipeline_summary.sourced}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                        <div className="flex-1 flex items-center gap-1">
                          <div className="flex-1 h-2 bg-green-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-600"
                              style={{ width: `${(mandate.pipeline_summary.screened / mandate.pipeline_summary.sourced) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">SC:{mandate.pipeline_summary.screened}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                        <div className="flex-1 flex items-center gap-1">
                          <div className="flex-1 h-2 bg-amber-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-600"
                              style={{ width: `${(mandate.pipeline_summary.shortlisted / mandate.pipeline_summary.screened) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">SH:{mandate.pipeline_summary.shortlisted}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                        <div className="flex-1 flex items-center gap-1">
                          <div className="flex-1 h-2 bg-purple-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-600"
                              style={{ width: `${(mandate.pipeline_summary.interview / mandate.pipeline_summary.shortlisted) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">I:{mandate.pipeline_summary.interview}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-right ml-8">
                    <div className="text-sm text-gray-500">Last Activity</div>
                    <div className="text-sm font-medium text-gray-800">
                      {new Date(mandate.last_activity_at).toLocaleDateString()}
                    </div>
                    {mandate.open_feedback_count > 0 && (
                      <Badge variant="warning" className="mt-2">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {mandate.open_feedback_count} awaiting feedback
                      </Badge>
                    )}
                    <ChevronRight className="w-5 h-5 text-gray-400 mt-4" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
