import React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  Briefcase,
  Check,
  Clock,
  Sparkles,
  FileText,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export function CandidateApplicationDetail() {
  const { id } = useParams();

  const application = {
    id,
    company: 'TechCorp',
    role: 'VP Engineering',
    location: 'Shanghai, China',
    status: 'interview',
    submitted: 'Jun 15, 2024',
    anonymized: true,
    description: 'Leading the engineering organization for a high-growth SaaS company. Responsible for all product engineering, platform engineering, and SRE teams.',
    requirements: [
      '10+ years of engineering experience with 5+ years in VP/Director roles',
      'Experience scaling teams from 50 to 200+ engineers',
      'Strong background in SaaS/cloud technologies',
      'Proven track record of building high-performing teams',
    ],
    timeline: [
      { step: 'Submitted', date: 'Jun 15, 2024', status: 'complete' },
      { step: 'Under Review', date: 'Jun 18, 2024', status: 'complete' },
      { step: 'Client Interview', date: 'Jun 25, 2024', status: 'current' },
      { step: 'Final Round', date: 'TBD', status: 'upcoming' },
      { step: 'Offer', date: 'TBD', status: 'upcoming' },
    ],
    interviewPrep: [
      { title: 'Company Overview', description: 'Key facts, recent news, and culture insights' },
      { title: 'Common Interview Questions', description: 'Top questions asked in VP Engineering interviews' },
      { title: 'Leadership Framework', description: 'How to structure your leadership narrative' },
    ],
  };

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
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/candidate/applications">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Applications
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-accent/10 rounded-xl flex items-center justify-center">
            <Building2 className="w-8 h-8 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold text-text-primary">{application.role}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-text-muted flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                {application.company}
              </span>
              <span className="text-text-muted flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {application.location}
              </span>
            </div>
          </div>
        </div>
        <Badge variant="secondary" className={getStatusColor(application.status)}>
          {getStatusLabel(application.status)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-accent" />
                Role Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-text-secondary">{application.description}</p>
              <div>
                <h4 className="font-medium text-text-primary mb-2">Key Requirements</h4>
                <ul className="space-y-2">
                  {application.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2 text-text-secondary">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-accent" />
                Process Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {application.timeline.map((step, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      step.status === 'complete' ? 'bg-green-100' :
                      step.status === 'current' ? 'bg-amber-100' :
                      'bg-gray-100'
                    }`}>
                      {step.status === 'complete' ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : step.status === 'current' ? (
                        <Clock className="w-4 h-4 text-amber-600" />
                      ) : (
                        <span className="w-2 h-2 bg-gray-400 rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 pb-4 border-b border-border last:border-0">
                      <div className="flex items-center justify-between">
                        <p className={`font-medium ${
                          step.status === 'complete' || step.status === 'current'
                            ? 'text-text-primary'
                            : 'text-text-muted'
                        }`}>
                          {step.step}
                        </p>
                        <span className="text-sm text-text-muted">{step.date}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                Interview Preparation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {application.interviewPrep.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
                  <div>
                    <p className="font-medium text-text-primary">{item.title}</p>
                    <p className="text-sm text-text-muted">{item.description}</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <FileText className="w-4 h-4 mr-2" />
                    View
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Consultant</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="font-medium text-text-primary">Kevin Chen</p>
                  <p className="text-sm text-text-muted">Managing Partner</p>
                </div>
              </div>
              <Button variant="ghost" className="w-full mt-4">
                <Sparkles className="w-4 h-4 mr-2" />
                Message Consultant
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Application Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Submitted Date</span>
                <span className="font-medium text-text-primary">{application.submitted}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Confidential</span>
                <span className="font-medium text-text-primary">Yes</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
