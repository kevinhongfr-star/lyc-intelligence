import React from 'react';
import { useAuthStore } from '@/stores/authStore';
import {
  Briefcase,
  Award,
  TrendingUp,
  Calendar,
  ChevronRight,
  Sparkles,
  Target,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Link } from 'react-router-dom';

export function CandidateDashboard() {
  const { profile } = useAuthStore();

  const activeApplications = 2;
  const completedAssessments = 1;
  const archetype = 'The Architect';
  const overallScore = 87;

  const applications = [
    { id: '1', company: 'TechCorp', role: 'VP Engineering', status: 'interview', date: 'Jun 15, 2024' },
    { id: '2', company: 'ScaleUp Inc', role: 'Director of Product', status: 'submitted', date: 'Jun 20, 2024' },
  ];

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'screened':
        return 'Under Review';
      case 'submitted':
        return 'Submitted to Client';
      case 'interview':
        return 'Interview Stage';
      case 'offer':
        return 'Offer Stage';
      case 'accepted':
        return 'Placed';
      case 'rejected':
        return 'Not Selected';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'screened':
        return 'bg-blue-100 text-blue-700';
      case 'submitted':
        return 'bg-purple-100 text-purple-700';
      case 'interview':
        return 'bg-amber-100 text-amber-700';
      case 'offer':
        return 'bg-green-100 text-green-700';
      case 'accepted':
        return 'bg-emerald-100 text-emerald-700';
      case 'rejected':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const strengths = [
    'Strategic Thinking',
    'Team Leadership',
    'Product Vision',
    'Operational Excellence',
  ];

  const nextSteps = [
    { id: '1', title: 'Complete your profile', description: 'Add your experience and preferences', icon: Target, link: '/candidate/profile' },
    { id: '2', title: 'Prepare for TechCorp interview', description: 'Review company insights and common questions', icon: Sparkles, link: '/candidate/applications/1' },
    { id: '3', title: 'View career insights', description: 'See market trends matching your profile', icon: TrendingUp, link: '/candidate/insights' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-text-primary">
          Welcome back, {profile?.first_name || 'Candidate'}
        </h1>
        <p className="text-text-muted">Here's what's happening with your career journey</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Active Applications</p>
                <p className="text-3xl font-bold text-text-primary mt-1">{activeApplications}</p>
              </div>
              <div className="p-3 bg-accent/10 rounded-lg">
                <Briefcase className="w-6 h-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Leadership Score</p>
                <p className="text-3xl font-bold text-text-primary mt-1">{overallScore}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Award className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Your Archetype</p>
                <p className="text-xl font-bold text-text-primary mt-1">{archetype}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Active Applications</CardTitle>
              <Link to="/candidate/applications" className="text-sm text-accent hover:underline">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {applications.map((app) => (
              <div key={app.id} className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
                <div>
                  <p className="font-medium text-text-primary">{app.role}</p>
                  <p className="text-sm text-text-muted">{app.company}</p>
                </div>
                <div className="text-right">
                  <Badge variant="secondary" className={getStatusColor(app.status)}>
                    {getStatusLabel(app.status)}
                  </Badge>
                  <p className="text-xs text-text-muted mt-1">{app.date}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Strengths</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {strengths.map((strength) => (
                <Badge key={strength} variant="secondary" className="bg-accent/10 text-accent">
                  {strength}
                </Badge>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <Link to="/candidate/assessments" className="text-sm text-accent hover:underline flex items-center gap-1">
                View full assessment results
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Next Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {nextSteps.map((step) => {
            const Icon = step.icon;
            return (
              <Link key={step.id} to={step.link}>
                <div className="flex items-center gap-4 p-3 bg-bg-tertiary rounded-lg hover:bg-bg-secondary transition-colors">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Icon className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-text-primary">{step.title}</p>
                    <p className="text-sm text-text-muted">{step.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-text-muted" />
                </div>
              </Link>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
