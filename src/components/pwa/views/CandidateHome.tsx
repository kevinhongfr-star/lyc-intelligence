// Phase 6.3: Candidate Home View
// Mobile PWA - Role-specific candidate dashboard

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Users,
  ChevronRight,
  Bell,
  Settings,
} from 'lucide-react';
import { Card, PageContainer, ListItem, StatCard } from '../pwa/ResponsiveLayout';

interface CandidateApplication {
  id: string;
  mandateTitle: string;
  companyName: string;
  stage: string;
  appliedDate: string;
  statusLabel: string;
  statusColor: string;
}

interface UpcomingInterview {
  id: string;
  mandateTitle: string;
  date: string;
  time: string;
  type: string;
}

interface Assessment {
  id: string;
  title: string;
  mandateTitle: string;
  dueDate: string;
  status: 'pending' | 'completed';
}

interface CandidateProfile {
  name: string;
  email: string;
  title: string;
  avatar?: string;
}

export function CandidateHome() {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [applications, setApplications] = useState<CandidateApplication[]>([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState<UpcomingInterview[]>([]);
  const [pendingAssessments, setPendingAssessments] = useState<Assessment[]>([]);

  // Mock data - would come from API
  useEffect(() => {
    const mockProfile: CandidateProfile = {
      name: 'Sarah Chen',
      email: 'sarah.chen@email.com',
      title: 'VP of Engineering',
      avatar: undefined,
    };

    const mockApplications: CandidateApplication[] = [
      {
        id: '1',
        mandateTitle: 'Chief Technology Officer',
        companyName: 'TechCorp Inc.',
        stage: 'interview_2',
        appliedDate: '2026-06-10',
        statusLabel: 'In Interview Process',
        statusColor: 'bg-blue-100 text-blue-800',
      },
      {
        id: '2',
        mandateTitle: 'VP of Engineering',
        companyName: 'StartupXYZ',
        stage: 'offer_pending',
        appliedDate: '2026-05-28',
        statusLabel: 'Offer Pending',
        statusColor: 'bg-yellow-100 text-yellow-800',
      },
    ];

    const mockInterviews: UpcomingInterview[] = [
      {
        id: '1',
        mandateTitle: 'Chief Technology Officer - TechCorp',
        date: '2026-06-25',
        time: '10:00 AM',
        type: 'Final Interview',
      },
    ];

    const mockAssessments: Assessment[] = [
      {
        id: '1',
        title: 'Leadership Assessment',
        mandateTitle: 'CTO - TechCorp',
        dueDate: '2026-06-24',
        status: 'pending',
      },
    ];

    // Simulate loading
    setTimeout(() => {
      setProfile(mockProfile);
      setApplications(mockApplications);
      setUpcomingInterviews(mockInterviews);
      setPendingAssessments(mockAssessments);
      setIsLoading(false);
    }, 500);
  }, []);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-bg-alt rounded-none" />
          <div className="h-16 bg-bg-alt rounded-none" />
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
          <h1 className="text-2xl font-bold text-text-primary">
            Hello, {profile?.name?.split(' ')[0]}
          </h1>
          <p className="text-text-muted">{profile?.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="relative p-2 rounded-full hover:bg-bg-alt transition-colors">
            <Bell className="w-6 h-6 text-text-muted" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <Link
            href="/candidate/profile"
            className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"
          >
            <span className="text-primary font-semibold">
              {profile?.name?.charAt(0)}
            </span>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center py-3">
          <p className="text-2xl font-bold text-primary">{applications.length}</p>
          <p className="text-xs text-text-muted">Applications</p>
        </Card>
        <Card className="text-center py-3">
          <p className="text-2xl font-bold text-orange-600">
            {upcomingInterviews.length}
          </p>
          <p className="text-xs text-text-muted">Interviews</p>
        </Card>
        <Card className="text-center py-3">
          <p className="text-2xl font-bold text-purple-600">
            {pendingAssessments.length}
          </p>
          <p className="text-xs text-text-muted">Assessments</p>
        </Card>
      </div>

      {/* Upcoming Interviews */}
      {upcomingInterviews.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-text-primary">
              Upcoming Interviews
            </h2>
            <Link
              href="/candidate/interviews"
              className="text-sm text-primary font-medium flex items-center gap-1"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingInterviews.map((interview) => (
              <Card key={interview.id} className="border-l-4 border-l-primary">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary truncate">
                      {interview.mandateTitle}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-sm text-text-muted">
                      <Calendar className="w-4 h-4" />
                      <span>{interview.date}</span>
                      <Clock className="w-4 h-4 ml-2" />
                      <span>{interview.time}</span>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
                    {interview.type}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Pending Assessments */}
      {pendingAssessments.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-text-primary">
              Pending Assessments
            </h2>
            <Link
              href="/candidate/assessments"
              className="text-sm text-primary font-medium flex items-center gap-1"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {pendingAssessments.map((assessment) => (
              <ListItem
                key={assessment.id}
                title={assessment.title}
                subtitle={`${assessment.mandateTitle} • Due ${assessment.dueDate}`}
                leftIcon={<FileText className="w-5 h-5" />}
                rightContent={
                  <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded">
                    Due Soon
                  </span>
                }
                onClick={() => {}}
              />
            ))}
          </div>
        </section>
      )}

      {/* Active Applications */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-text-primary">
            Active Applications
          </h2>
          <Link
            href="/candidate/applications"
            className="text-sm text-primary font-medium flex items-center gap-1"
          >
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="space-y-3">
          {applications.map((application) => (
            <ListItem
              key={application.id}
              title={application.mandateTitle}
              subtitle={`${application.companyName} • Applied ${application.appliedDate}`}
              leftIcon={<Briefcase className="w-5 h-5" />}
              rightContent={
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${application.statusColor}`}
                >
                  {application.statusLabel}
                </span>
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
            href="/candidate/mandates"
            className="flex items-center gap-3 p-4 bg-card border border-card-border rounded-none hover:bg-bg-alt transition-colors"
          >
            <div className="w-10 h-10 rounded-none bg-primary/10 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-text-primary">Browse Jobs</p>
              <p className="text-xs text-text-muted">View open positions</p>
            </div>
          </Link>
          <Link
            href="/candidate/profile"
            className="flex items-center gap-3 p-4 bg-card border border-card-border rounded-none hover:bg-bg-alt transition-colors"
          >
            <div className="w-10 h-10 rounded-none bg-purple-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-text-primary">Update Profile</p>
              <p className="text-xs text-text-muted">Edit your info</p>
            </div>
          </Link>
        </div>
      </section>
    </PageContainer>
  );
}

export default CandidateHome;
