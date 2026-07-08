/**
 * CandidateApplicationsPage — Candidate Portal application tracker
 * Renders inside AppShell → Outlet. Lists active applications with status tracking.
 */
import React, { useState, useEffect } from 'react';
import { Search, Briefcase, Users, Award, CheckCircle2, Building2, Calendar, MapPin, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Input } from '@/components/ui';

type ApplicationStatus =
  | 'Under Review'
  | 'Submitted to Client'
  | 'Interview Stage'
  | 'Offer Stage'
  | 'Placed'
  | 'Not Selected';

interface CandidateApplication {
  id: string;
  company: string;
  role: string;
  seniority: string;
  location: string;
  status: ApplicationStatus;
  progress: number;
  submittedAt: string;
  updatedAt: string;
  nextStep: string;
}

const MOCK_APPLICATIONS: CandidateApplication[] = [
  { id: 'a1', company: 'TechCorp', role: 'VP Engineering', seniority: 'VP', location: 'San Francisco', status: 'Interview Stage', progress: 60, submittedAt: '2025-01-05', updatedAt: '2025-01-15', nextStep: 'Final round interview on Jan 22' },
  { id: 'a2', company: 'FinScale', role: 'Chief Financial Officer', seniority: 'C-Level', location: 'New York', status: 'Submitted to Client', progress: 40, submittedAt: '2025-01-02', updatedAt: '2025-01-14', nextStep: 'Awaiting client feedback' },
  { id: 'a3', company: 'DataMesh', role: 'Head of Product', seniority: 'Director', location: 'Remote', status: 'Under Review', progress: 20, submittedAt: '2025-01-09', updatedAt: '2025-01-10', nextStep: 'Initial screening in progress' },
  { id: 'a4', company: 'CloudPeak', role: 'CTO', seniority: 'C-Level', location: 'Seattle', status: 'Offer Stage', progress: 85, submittedAt: '2024-12-10', updatedAt: '2025-01-16', nextStep: 'Offer under review' },
  { id: 'a5', company: 'GrowthLab', role: 'VP Sales', seniority: 'VP', location: 'Boston', status: 'Not Selected', progress: 100, submittedAt: '2024-11-01', updatedAt: '2024-12-20', nextStep: 'Closed — role filled' },
];

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  'Under Review': 'bg-amber/10 text-amber',
  'Submitted to Client': 'bg-blue/10 text-blue',
  'Interview Stage': 'bg-fuchsia-light text-fuchsia',
  'Offer Stage': 'bg-green/10 text-green',
  'Placed': 'bg-green/10 text-green',
  'Not Selected': 'bg-text-muted/10 text-text-muted',
};

const STATUS_OPTIONS: { value: 'all' | ApplicationStatus; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'Under Review', label: 'Under Review' },
  { value: 'Submitted to Client', label: 'Submitted to Client' },
  { value: 'Interview Stage', label: 'Interview Stage' },
  { value: 'Offer Stage', label: 'Offer Stage' },
  { value: 'Not Selected', label: 'Not Selected' },
];

export function CandidateApplicationsPage() {
  const [applications, setApplications] = useState<CandidateApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ApplicationStatus>('all');

  useEffect(() => {
    // TODO: Replace with real API call to /api/candidate/applications
    const timer = setTimeout(() => {
      setApplications(MOCK_APPLICATIONS);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const filtered = applications.filter((a) => {
    const matchesSearch =
      a.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCount = applications.filter((a) => !['Placed', 'Not Selected'].includes(a.status)).length;
  const interviewCount = applications.filter((a) => a.status === 'Interview Stage').length;
  const offerCount = applications.filter((a) => a.status === 'Offer Stage').length;
  const totalCount = applications.length;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-serif font-bold text-2xl text-text-primary">Applications</h1>
        <p className="text-text-secondary text-sm mt-1">Track the roles you've been submitted to and their status.</p>
      </div>

      {/* Summary metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-fuchsia" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{loading ? '—' : activeCount}</div>
              <div className="text-xs text-text-muted">Active</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center">
              <Users className="w-5 h-5 text-fuchsia" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{loading ? '—' : interviewCount}</div>
              <div className="text-xs text-text-muted">In Interviews</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center">
              <Award className="w-5 h-5 text-fuchsia" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{loading ? '—' : offerCount}</div>
              <div className="text-xs text-text-muted">Offers</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-fuchsia" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{loading ? '—' : totalCount}</div>
              <div className="text-xs text-text-muted">Total</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            placeholder="Search by role or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | ApplicationStatus)}
          className="px-4 py-2 bg-white border border-border text-sm text-text-primary focus:outline-none focus:border-fuchsia"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Application list */}
      {loading ? (
        <div className="py-12 text-center text-text-muted text-sm">Loading applications...</div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-text-muted text-sm">No applications found.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((app) => (
            <Card key={app.id} className="p-5 hover:shadow-card-hover transition-shadow cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-fuchsia" />
                  </div>
                  <div>
                    <h3 className="font-serif font-semibold text-text-primary">{app.role}</h3>
                    <p className="text-xs text-text-muted">{app.company} · {app.seniority} · {app.location}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded ${STATUS_COLORS[app.status]}`}>
                  {app.status}
                </span>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-2 bg-bg-warm rounded-full overflow-hidden">
                  <div className="h-full bg-fuchsia rounded-full transition-all" style={{ width: `${app.progress}%` }} />
                </div>
                <span className="text-xs font-medium text-text-secondary">{app.progress}%</span>
              </div>

              <div className="flex items-start gap-2 text-xs text-text-secondary mb-3">
                <ArrowRight className="w-3 h-3 mt-0.5 text-fuchsia flex-shrink-0" />
                <span>{app.nextStep}</span>
              </div>

              <div className="flex items-center gap-2 text-xs text-text-muted">
                <Calendar className="w-3 h-3" />
                Submitted {app.submittedAt} · Updated {app.updatedAt}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default CandidateApplicationsPage;
