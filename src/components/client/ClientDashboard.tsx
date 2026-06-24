import React from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useMandates } from '@/hooks/useSupabaseData';
import {
  Briefcase,
  Clock,
  FileText,
  ArrowRight,
  TrendingUp,
  Users,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { STAGE_LABEL } from '@/types/pipelineStages';

export function ClientDashboard() {
  const { profile } = useAuthStore();
  const { data: mandates, loading } = useMandates({
    organizationId: profile?.organization_id || '',
    limit: 50,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const activeMandates = mandates.filter(m => ['1_search', '2_call', '3_deliver'].includes(m.status));
  const completedMandates = mandates.filter(m => m.status === 'completed' || m.status === 'won');

  const recentActivity = [
    { type: 'shortlist', title: 'New shortlist shared', mandate: 'VP Engineering, Shanghai', time: '2 hours ago' },
    { type: 'interview', title: 'Interview scheduled', mandate: 'Director of Operations', time: '1 day ago' },
    { type: 'report', title: 'Market report delivered', mandate: 'Head of Product', time: '3 days ago' },
  ];

  const upcomingInterviews = [
    { candidate: 'John Smith', role: 'VP Engineering', date: 'June 25, 2024', time: '10:00 AM' },
    { candidate: 'Sarah Chen', role: 'Director of Operations', date: 'June 26, 2024', time: '2:00 PM' },
  ];

  const getPhaseLabel = (status: string) => {
    switch (status) {
      case '1_search':
        return 'Sourcing';
      case '2_call':
        return 'Client Review';
      case '3_deliver':
        return 'Interview';
      case 'won':
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  const getPhaseColor = (status: string) => {
    switch (status) {
      case '1_search':
        return 'bg-blue-100 text-blue-700';
      case '2_call':
        return 'bg-purple-100 text-purple-700';
      case '3_deliver':
        return 'bg-amber-100 text-amber-700';
      case 'won':
      case 'completed':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-text-primary">Client Dashboard</h1>
          <p className="text-text-muted">Welcome back. Here's your latest engagement overview.</p>
        </div>
        <Button>
          <FileText className="w-4 h-4 mr-2" />
          Request Report
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Active Mandates</p>
                <p className="text-2xl font-bold text-text-primary">{activeMandates.length}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Completed</p>
                <p className="text-2xl font-bold text-text-primary">{completedMandates.length}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Shortlisted Candidates</p>
                <p className="text-2xl font-bold text-text-primary">
                  {mandates.reduce((sum, m) => sum + (m.shortlisted_count || 0), 0)}
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Upcoming Interviews</p>
                <p className="text-2xl font-bold text-text-primary">{upcomingInterviews.length}</p>
              </div>
              <div className="p-2 bg-amber-100 rounded-lg">
                <Calendar className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Active Mandates */}
        <Card className="col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Active Mandates</CardTitle>
            <Link to="/client/mandates" className="text-sm text-accent hover:underline flex items-center">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeMandates.slice(0, 5).map((mandate) => (
                <div key={mandate.id} className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-text-primary">{mandate.title}</h3>
                    <p className="text-sm text-text-muted">{mandate.company?.name}</p>
                  </div>
                  <Badge variant="secondary" className={getPhaseColor(mandate.status)}>
                    {getPhaseLabel(mandate.status)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="p-1.5 bg-accent/10 rounded-full">
                    {activity.type === 'shortlist' && <Users className="w-3.5 h-3.5 text-accent" />}
                    {activity.type === 'interview' && <Calendar className="w-3.5 h-3.5 text-accent" />}
                    {activity.type === 'report' && <FileText className="w-3.5 h-3.5 text-accent" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">{activity.title}</p>
                    <p className="text-xs text-text-muted truncate">{activity.mandate}</p>
                    <p className="text-xs text-text-muted mt-0.5 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Interviews */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upcoming Interviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcomingInterviews.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-medium text-text-primary">{item.candidate}</h4>
                    <p className="text-sm text-text-muted">{item.role}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-text-primary">{item.date}</p>
                  <p className="text-xs text-text-muted">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
