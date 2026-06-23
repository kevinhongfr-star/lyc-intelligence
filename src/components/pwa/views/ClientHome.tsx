// Phase 6.3: Client Home View
// Mobile PWA - Role-specific client dashboard

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  ChevronRight,
  Bell,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { Card, PageContainer, ListItem, StatCard } from '../pwa/ResponsiveLayout';

interface ClientStats {
  activeMandates: number;
  candidatesPresented: number;
  offersExtended: number;
  placementsActive: number;
}

interface MandateStatus {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  status: 'in_progress' | 'on_track' | 'at_risk' | 'completed';
  candidatesCount: number;
  stageLabel: string;
}

interface PendingFeedback {
  id: string;
  candidateName: string;
  candidateTitle: string;
  mandateTitle: string;
  actionType: 'approve' | 'reject' | 'feedback';
  dueDate: string;
}

export function ClientHome() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [mandates, setMandates] = useState<MandateStatus[]>([]);
  const [pendingFeedback, setPendingFeedback] = useState<PendingFeedback[]>([]);

  // Mock data - would come from API
  useEffect(() => {
    const mockStats: ClientStats = {
      activeMandates: 3,
      candidatesPresented: 12,
      offersExtended: 2,
      placementsActive: 1,
    };

    const mockMandates: MandateStatus[] = [
      {
        id: '1',
        title: 'Chief Technology Officer',
        priority: 'high',
        status: 'in_progress',
        candidatesCount: 5,
        stageLabel: 'Final Interviews',
      },
      {
        id: '2',
        title: 'VP of Engineering',
        priority: 'high',
        status: 'at_risk',
        candidatesCount: 3,
        stageLabel: 'Client Presentation',
      },
      {
        id: '3',
        title: 'Chief Marketing Officer',
        priority: 'medium',
        status: 'on_track',
        candidatesCount: 8,
        stageLabel: 'Shortlist Review',
      },
    ];

    const mockFeedback: PendingFeedback[] = [
      {
        id: '1',
        candidateName: 'John Smith',
        candidateTitle: 'Former CTO at TechCorp',
        mandateTitle: 'CTO',
        actionType: 'feedback',
        dueDate: 'Today',
      },
      {
        id: '2',
        candidateName: 'Emily Davis',
        candidateTitle: 'SVP Engineering at BigTech',
        mandateTitle: 'VP Engineering',
        actionType: 'approve',
        dueDate: 'Tomorrow',
      },
    ];

    setTimeout(() => {
      setStats(mockStats);
      setMandates(mockMandates);
      setPendingFeedback(mockFeedback);
      setIsLoading(false);
    }, 500);
  }, []);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="animate-pulse space-y-4">
          <div className="h-16 bg-bg-alt rounded-xl" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-20 bg-bg-alt rounded-xl" />
            <div className="h-20 bg-bg-alt rounded-xl" />
          </div>
          <div className="h-32 bg-bg-alt rounded-xl" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Welcome</h1>
          <p className="text-text-muted">Your search dashboard</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="relative p-2 rounded-full hover:bg-bg-alt transition-colors">
            <Bell className="w-6 h-6 text-text-muted" />
            {pendingFeedback.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>
          <Link
            href="/client/profile"
            className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"
          >
            <span className="text-primary font-semibold">C</span>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Active Searches"
          value={stats?.activeMandates || 0}
          icon={<Briefcase className="w-5 h-5" />}
          trend="neutral"
        />
        <StatCard
          label="Candidates"
          value={stats?.candidatesPresented || 0}
          icon={<Users className="w-5 h-5" />}
          trend="up"
          trendValue="+4"
        />
        <StatCard
          label="Offers Extended"
          value={stats?.offersExtended || 0}
          icon={<CheckCircle2 className="w-5 h-5" />}
          trend="neutral"
        />
        <StatCard
          label="Active Placements"
          value={stats?.placementsActive || 0}
          icon={<Clock className="w-5 h-5" />}
          trend="neutral"
        />
      </div>

      {/* Pending Feedback */}
      {pendingFeedback.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-text-primary">
                Action Required
              </h2>
            </div>
            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
              {pendingFeedback.length} pending
            </span>
          </div>
          <div className="space-y-3">
            {pendingFeedback.map((item) => (
              <Card key={item.id} className="border-l-4 border-l-amber-500">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary truncate">
                      {item.candidateName}
                    </p>
                    <p className="text-sm text-text-muted truncate">
                      {item.candidateTitle}
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      {item.mandateTitle}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        item.actionType === 'approve'
                          ? 'bg-green-100 text-green-700'
                          : item.actionType === 'reject'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {item.actionType === 'approve'
                        ? 'Approve/Reject'
                        : item.actionType === 'reject'
                        ? 'Reject'
                        : 'Feedback'}
                    </span>
                    <span className="text-xs text-text-muted">{item.dueDate}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                    <ThumbsUp className="w-4 h-4" />
                    Approve
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                    <ThumbsDown className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Active Mandates */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-text-primary">
            Your Searches
          </h2>
          <Link
            href="/client/mandates"
            className="text-sm text-primary font-medium flex items-center gap-1"
          >
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="space-y-3">
          {mandates.map((mandate) => (
            <ListItem
              key={mandate.id}
              title={mandate.title}
              subtitle={`${mandate.candidatesCount} candidates • ${mandate.stageLabel}`}
              leftIcon={<Briefcase className="w-5 h-5" />}
              rightContent={
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded ${
                      mandate.status === 'at_risk'
                        ? 'bg-red-100 text-red-700'
                        : mandate.status === 'on_track'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {mandate.status === 'at_risk'
                      ? 'At Risk'
                      : mandate.status === 'on_track'
                      ? 'On Track'
                      : 'In Progress'}
                  </span>
                  {mandate.priority === 'high' && (
                    <span className="text-xs text-red-600 font-medium">High Priority</span>
                  )}
                </div>
              }
              onClick={() => {}}
            />
          ))}
        </div>
      </section>

      {/* Quick Links */}
      <section>
        <h2 className="text-lg font-semibold text-text-primary mb-3">Quick Links</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/client/pipeline"
            className="flex items-center gap-3 p-4 bg-card border border-card-border rounded-xl hover:bg-bg-alt transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-text-primary">View Pipeline</p>
              <p className="text-xs text-text-muted">All candidates</p>
            </div>
          </Link>
          <Link
            href="/client/feedback"
            className="flex items-center gap-3 p-4 bg-card border border-card-border rounded-xl hover:bg-bg-alt transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <ThumbsUp className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-text-primary">Give Feedback</p>
              <p className="text-xs text-text-muted">Review candidates</p>
            </div>
          </Link>
        </div>
      </section>

      {/* Recent Updates */}
      <section>
        <h2 className="text-lg font-semibold text-text-primary mb-3">Recent Updates</h2>
        <Card>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-text-primary">
                  <span className="font-medium">Emily Davis</span> moved to Final Interview
                </p>
                <p className="text-xs text-text-muted">VP Engineering • 2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-text-primary">
                  Final interview scheduled with <span className="font-medium">John Smith</span>
                </p>
                <p className="text-xs text-text-muted">CTO • Tomorrow at 2:00 PM</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-text-primary">
                  <span className="font-medium">3 new candidates</span> presented for CMO
                </p>
                <p className="text-xs text-text-muted">Shortlist Ready • 1 day ago</p>
              </div>
            </div>
          </div>
        </Card>
      </section>
    </PageContainer>
  );
}

export default ClientHome;
