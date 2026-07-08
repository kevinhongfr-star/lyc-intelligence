// Phase 6.3: Consultant Home View
// Mobile PWA - Role-specific consultant dashboard

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Users,
  TrendingUp,
  Clock,
  Bell,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Target,
} from 'lucide-react';
import { Card, PageContainer, ListItem, StatCard } from '../pwa/ResponsiveLayout';

interface DashboardStats {
  activeMandates: number;
  candidatesInPipeline: number;
  placementsThisMonth: number;
  avgTimeToFill: number;
}

interface AtRiskMandate {
  id: string;
  title: string;
  clientName: string;
  daysAtRisk: number;
  issue: string;
}

interface UpcomingTask {
  id: string;
  title: string;
  type: 'interview' | 'follow_up' | 'approval' | 'scoring';
  dueDate: string;
  mandateTitle: string;
}

interface RecentActivity {
  id: string;
  action: string;
  candidateName: string;
  mandateTitle: string;
  timestamp: string;
}

export function ConsultantHome() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [atRiskMandates, setAtRiskMandates] = useState<AtRiskMandate[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<UpcomingTask[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  // Mock data - would come from API
  useEffect(() => {
    const mockStats: DashboardStats = {
      activeMandates: 8,
      candidatesInPipeline: 47,
      placementsThisMonth: 3,
      avgTimeToFill: 42,
    };

    const mockAtRisk: AtRiskMandate[] = [
      {
        id: '1',
        title: 'Chief Revenue Officer',
        clientName: 'TechCorp Inc.',
        daysAtRisk: 3,
        issue: 'Longlist overdue',
      },
      {
        id: '2',
        title: 'VP of Engineering',
        clientName: 'StartupXYZ',
        daysAtRisk: 5,
        issue: 'Client feedback delayed',
      },
    ];

    const mockTasks: UpcomingTask[] = [
      {
        id: '1',
        title: 'Submit scorecard',
        type: 'interview',
        dueDate: 'Today',
        mandateTitle: 'CTO - TechCorp',
      },
      {
        id: '2',
        title: 'Send 1-month follow-up',
        type: 'follow_up',
        dueDate: 'Tomorrow',
        mandateTitle: 'CFO - Acme Corp',
      },
      {
        id: '3',
        title: 'Approve success profile',
        type: 'approval',
        dueDate: 'Jun 25',
        mandateTitle: 'CMO - BrandCo',
      },
    ];

    const mockActivity: RecentActivity[] = [
      {
        id: '1',
        action: 'moved to Interview 2',
        candidateName: 'John Smith',
        mandateTitle: 'CTO - TechCorp',
        timestamp: '2 hours ago',
      },
      {
        id: '2',
        action: 'submitted scorecard for',
        candidateName: 'Emily Davis',
        mandateTitle: 'VP Eng - StartupXYZ',
        timestamp: '4 hours ago',
      },
      {
        id: '3',
        action: 'placed',
        candidateName: 'Michael Brown',
        mandateTitle: 'CFO - Acme Corp',
        timestamp: '1 day ago',
      },
    ];

    setTimeout(() => {
      setStats(mockStats);
      setAtRiskMandates(mockAtRisk);
      setUpcomingTasks(mockTasks);
      setRecentActivity(mockActivity);
      setIsLoading(false);
    }, 500);
  }, []);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="animate-pulse space-y-4">
          <div className="h-16 bg-bg-alt rounded-none" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-20 bg-bg-alt rounded-none" />
            <div className="h-20 bg-bg-alt rounded-none" />
          </div>
          <div className="h-32 bg-bg-alt rounded-none" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-text-muted">Welcome back</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="relative p-2 rounded-full hover:bg-bg-alt transition-colors">
            <Bell className="w-6 h-6 text-text-muted" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <Link
            href="/settings"
            className="p-2 rounded-full hover:bg-bg-alt transition-colors"
          >
            <span className="text-text-muted">Settings</span>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Active Mandates"
          value={stats?.activeMandates || 0}
          icon={<Briefcase className="w-5 h-5" />}
          trend="neutral"
        />
        <StatCard
          label="In Pipeline"
          value={stats?.candidatesInPipeline || 0}
          icon={<Users className="w-5 h-5" />}
          trend="up"
          trendValue="12%"
        />
        <StatCard
          label="Placements (Mo)"
          value={stats?.placementsThisMonth || 0}
          icon={<CheckCircle2 className="w-5 h-5" />}
          trend="up"
          trendValue="+2"
        />
        <StatCard
          label="Avg Time to Fill"
          value={`${stats?.avgTimeToFill || 0}d`}
          icon={<Clock className="w-5 h-5" />}
          trend="down"
          trendValue="5d"
        />
      </div>

      {/* At-Risk Mandates */}
      {atRiskMandates.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-semibold text-text-primary">At Risk</h2>
            </div>
            <Link
              href="/mandates?filter=at_risk"
              className="text-sm text-primary font-medium flex items-center gap-1"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {atRiskMandates.map((mandate) => (
              <Card key={mandate.id} className="border-l-4 border-l-red-500">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary truncate">
                      {mandate.title}
                    </p>
                    <p className="text-sm text-text-muted truncate">
                      {mandate.clientName}
                    </p>
                    <p className="text-xs text-red-600 mt-1">{mandate.issue}</p>
                  </div>
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                    {mandate.daysAtRisk}d overdue
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Tasks */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-text-primary">Upcoming Tasks</h2>
          <Link
            href="/tasks"
            className="text-sm text-primary font-medium flex items-center gap-1"
          >
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="space-y-3">
          {upcomingTasks.map((task) => (
            <ListItem
              key={task.id}
              title={task.title}
              subtitle={task.mandateTitle}
              leftIcon={
                task.type === 'interview' ? (
                  <Calendar className="w-5 h-5 text-blue-500" />
                ) : task.type === 'follow_up' ? (
                  <Clock className="w-5 h-5 text-green-500" />
                ) : (
                  <Target className="w-5 h-5 text-purple-500" />
                )
              }
              rightContent={
                <span className="text-xs text-text-muted">{task.dueDate}</span>
              }
              onClick={() => {}}
            />
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-lg font-semibold text-text-primary mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/pipeline"
            className="flex items-center gap-3 p-4 bg-card border border-card-border rounded-none hover:bg-bg-alt transition-colors"
          >
            <div className="w-10 h-10 rounded-none bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-text-primary">Pipeline</p>
              <p className="text-xs text-text-muted">View candidates</p>
            </div>
          </Link>
          <Link
            href="/scoring"
            className="flex items-center gap-3 p-4 bg-card border border-card-border rounded-none hover:bg-bg-alt transition-colors"
          >
            <div className="w-10 h-10 rounded-none bg-green-100 flex items-center justify-center">
              <Target className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-text-primary">Score Candidates</p>
              <p className="text-xs text-text-muted">Match scoring</p>
            </div>
          </Link>
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-text-primary">Recent Activity</h2>
          <Link
            href="/activity"
            className="text-sm text-primary font-medium flex items-center gap-1"
          >
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="space-y-3">
          {recentActivity.map((activity) => (
            <ListItem
              key={activity.id}
              title={`${activity.candidateName} ${activity.action}`}
              subtitle={activity.mandateTitle}
              leftIcon={
                activity.action.includes('placed') ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <Users className="w-5 h-5 text-blue-500" />
                )
              }
              rightContent={
                <span className="text-xs text-text-muted whitespace-nowrap">
                  {activity.timestamp}
                </span>
              }
              onClick={() => {}}
            />
          ))}
        </div>
      </section>
    </PageContainer>
  );
}

export default ConsultantHome;
