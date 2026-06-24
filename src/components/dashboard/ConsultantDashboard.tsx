import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Users,
  Briefcase,
  TrendingUp,
  Zap,
  Activity,
  Sparkles,
  Plus,
  Upload,
  MessageSquare,
  Calendar,
  CreditCard,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { useDashboard } from '@/hooks/useSupabaseData';
import { TodayFocus } from './TodayFocus';
import { MyMandateCards } from './MyMandateCards';
import { RecentActivity } from './RecentActivity';
import { ConsultantOnboarding } from './ConsultantOnboarding';

export function ConsultantDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { data, loading } = useDashboard();

  const stats = data?.stats;
  const mandates = data?.mandates || [];
  const activity = data?.recentActivity || [];

  const activeMandatesCount =
    (stats?.mandatesByStatus?.['1_search'] ?? 0) +
    (stats?.mandatesByStatus?.['2_call'] ?? 0) +
    (stats?.mandatesByStatus?.['3_deliver'] ?? 0);

  const firstName = profile?.first_name || profile?.name?.split(' ')[0] || 'there';

  const quickActions = [
    { icon: Plus, label: 'New Match Analysis', action: () => navigate('/platform/batch-scoring'), color: 'bg-accent/10 text-accent' },
    { icon: Upload, label: 'Import LinkedIn', action: () => navigate('/platform/candidates'), color: 'bg-blue-500/10 text-blue-600' },
    { icon: MessageSquare, label: 'Nexus AI Session', action: () => navigate('/platform/chat'), color: 'bg-purple-500/10 text-purple-600' },
    { icon: Calendar, label: 'Schedule Interview', action: () => navigate('/platform/scheduler'), color: 'bg-green-500/10 text-green-600' },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-text-primary">
            {getGreeting()}, {firstName} 👋
          </h1>
          <p className="text-text-secondary mt-1">
            Here's your command center for today
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-accent/10 text-accent px-3 py-1.5">
            <CreditCard className="w-4 h-4 mr-1" />
            {stats?.creditsRemaining ?? '1,250'} credits
          </Badge>
          <Button onClick={() => navigate('/platform/mandates/new')}>
            <Plus className="w-4 h-4 mr-2" />
            New Mandate
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">
                  {loading ? '—' : activeMandatesCount}
                </p>
                <p className="text-xs text-text-muted">Active Mandates</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">
                  {loading ? '—' : (stats?.totalContacts?.toLocaleString() ?? '0')}
                </p>
                <p className="text-xs text-text-muted">Pipeline Candidates</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">
                  {loading ? '—' : (stats?.weeklyScored ?? 47)}
                </p>
                <p className="text-xs text-text-muted">Scored This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">
                  {loading ? '—' : (stats?.closeRate ?? '32%')}
                </p>
                <p className="text-xs text-text-muted">Close Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main content: 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Today's Focus + My Mandates */}
        <div className="lg:col-span-2 space-y-6">
          <TodayFocus loading={loading} />
          <MyMandateCards mandates={mandates.slice(0, 4)} loading={loading} />
        </div>

        {/* Right column: Quick Actions + Recent Activity */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-accent" />
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={action.action}
                    className="flex flex-col items-center gap-2 p-3 bg-bg-tertiary rounded-lg hover:bg-bg-secondary transition-colors text-center"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${action.color}`}>
                      <action.icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs text-text-secondary">{action.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <RecentActivity items={activity} loading={loading} limit={6} />

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-accent to-purple-500 rounded-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-text-primary">Try Nexus AI</h3>
                  <p className="text-xs text-text-muted">
                    Get market insights, candidate positioning, and interview prep
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3"
                onClick={() => navigate('/platform/chat')}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Start Chat
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
