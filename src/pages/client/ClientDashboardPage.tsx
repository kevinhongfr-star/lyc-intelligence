import React, { useState, useEffect } from 'react';
import { 
  Briefcase, Users, TrendingUp, FileText, Calendar, ArrowRight,
  Building2, Star, Award, Activity, Clock, Target
} from 'lucide-react';
import { Badge, Button, Card, Progress } from '@/components/ui';

export function ClientDashboardPage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const res = await fetch('/api/client/dashboard');
      const data = await res.json();
      if (data.success) {
        setDashboardData(data);
      }
    } catch (err) {
      console.error('Load dashboard error:', err);
    } finally {
      setLoading(false);
    }
  }

  const mockData = {
    total_mandates: 5,
    active_mandates: 3,
    candidates_presented: 12,
    candidates_hired: 4,
    avg_days_to_fill: 28,
    mandates: [
      { id: 'm1', title: 'VP of Engineering', status: 'Active', days_since_kickoff: 15, candidates_count: 4, progress: 65 },
      { id: 'm2', title: 'Director of Product', status: 'On Hold', days_since_kickoff: 30, candidates_count: 2, progress: 30 },
      { id: 'm3', title: 'Senior Data Scientist', status: 'Active', days_since_kickoff: 8, candidates_count: 6, progress: 45 },
      { id: 'm4', title: 'Head of Marketing', status: 'Active', days_since_kickoff: 22, candidates_count: 3, progress: 80 },
      { id: 'm5', title: 'CTO', status: 'Closed', days_since_kickoff: 45, candidates_count: 5, progress: 100 },
    ],
    recent_activity: [
      { id: 1, type: 'presentation', message: '3 candidates presented for VP of Engineering', time: '2 hours ago' },
      { id: 2, type: 'interview', message: 'Interview scheduled with Sarah Chen for Director of Product', time: '5 hours ago' },
      { id: 3, type: 'offer', message: 'Offer accepted for Senior Data Scientist role', time: '1 day ago' },
      { id: 4, type: 'update', message: 'Market intelligence report updated for Head of Marketing', time: '2 days ago' },
    ],
    metrics: {
      fill_rate: 85,
      quality_score: 92,
      client_satisfaction: 95,
      response_time: 2,
    }
  };

  const data = dashboardData || mockData;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif text-text-primary">Client Dashboard</h1>
          <p className="text-text-muted mt-1">Welcome back. Here's your overview of active mandates and talent pipeline.</p>
        </div>
        <Button>
          <Calendar className="w-4 h-4 mr-2" />
          Schedule Review
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-muted text-sm">Active Mandates</p>
              <p className="text-2xl font-bold text-text-primary mt-1">{data.active_mandates}</p>
              <p className="text-text-muted text-xs mt-1">of {data.total_mandates} total</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-accent" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-muted text-sm">Candidates Presented</p>
              <p className="text-2xl font-bold text-text-primary mt-1">{data.candidates_presented}</p>
              <p className="text-text-muted text-xs mt-1">this quarter</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-muted text-sm">Avg Days to Fill</p>
              <p className="text-2xl font-bold text-text-primary mt-1">{data.avg_days_to_fill}</p>
              <p className="text-text-muted text-xs mt-1">industry avg: 42</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-muted text-sm">Hires This Quarter</p>
              <p className="text-2xl font-bold text-text-primary mt-1">{data.candidates_hired}</p>
              <p className="text-text-muted text-xs mt-1">on track for 6</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center">
              <Award className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-text-primary flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Active Mandates
              </h3>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
            <div className="space-y-4">
              {data.mandates.slice(0, 4).map((mandate: any) => (
                <div key={mandate.id} className="flex items-center justify-between p-4 bg-bg-tertiary/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Target className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">{mandate.title}</p>
                      <p className="text-sm text-text-muted">
                        Day {mandate.days_since_kickoff} | {mandate.candidates_count} candidates
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-text-muted">Progress</p>
                      <p className="font-bold text-text-primary">{mandate.progress}%</p>
                    </div>
                    <Badge className={mandate.status === 'Active' ? 'bg-green-100 text-green-700' : mandate.status === 'On Hold' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}>
                      {mandate.status}
                    </Badge>
                    <ArrowRight className="w-4 h-4 text-text-muted" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Activity
            </h3>
            <div className="space-y-4">
              {data.recent_activity.map((activity: any) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Star className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-text-primary">{activity.message}</p>
                    <p className="text-xs text-text-muted mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Performance Metrics
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-text-muted">Fill Rate</span>
                  <span className="font-medium text-text-primary">{data.metrics.fill_rate}%</span>
                </div>
                <Progress value={data.metrics.fill_rate} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-text-muted">Quality Score</span>
                  <span className="font-medium text-text-primary">{data.metrics.quality_score}%</span>
                </div>
                <Progress value={data.metrics.quality_score} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-text-muted">Client Satisfaction</span>
                  <span className="font-medium text-text-primary">{data.metrics.client_satisfaction}%</span>
                </div>
                <Progress value={data.metrics.client_satisfaction} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-text-muted">Avg Response Time</span>
                  <span className="font-medium text-text-primary">{data.metrics.response_time}h</span>
                </div>
                <Progress value={(48 - data.metrics.response_time) / 48 * 100} className="h-2" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ClientDashboardPage;