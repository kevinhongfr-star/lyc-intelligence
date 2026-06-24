import React, { useState } from 'react';
import {
  Briefcase,
  Filter,
  ChevronRight,
  Building2,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Link } from 'react-router-dom';

export function CandidateApplications() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const applications = [
    { id: '1', company: 'TechCorp', role: 'VP Engineering', status: 'interview', submitted: 'Jun 15, 2024', lastUpdate: '2 days ago', location: 'Shanghai' },
    { id: '2', company: 'ScaleUp Inc', role: 'Director of Product', status: 'submitted', submitted: 'Jun 20, 2024', lastUpdate: 'Today', location: 'Singapore' },
    { id: '3', company: 'FinanceCo', role: 'Head of Technology', status: 'screened', submitted: 'Jun 10, 2024', lastUpdate: '1 week ago', location: 'Hong Kong' },
    { id: '4', company: 'Retail Group', role: 'Chief Digital Officer', status: 'rejected', submitted: 'May 20, 2024', lastUpdate: '3 weeks ago', location: 'Shanghai' },
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

  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      app.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCount = applications.filter((a) => a.status !== 'rejected' && a.status !== 'accepted').length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-text-primary">Applications</h1>
        <p className="text-text-muted">Track your search engagements with LYC</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Briefcase className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">{activeCount}</p>
                <p className="text-sm text-text-muted">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Calendar className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">1</p>
                <p className="text-sm text-text-muted">In Interview</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Building2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">{applications.length}</p>
                <p className="text-sm text-text-muted">Total Submitted</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            placeholder="Search applications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm"
        >
          <option value="all">All Status</option>
          <option value="screened">Under Review</option>
          <option value="submitted">Submitted</option>
          <option value="interview">Interview</option>
          <option value="offer">Offer</option>
          <option value="rejected">Not Selected</option>
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Applications</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredApps.length === 0 ? (
            <div className="p-12 text-center">
              <Briefcase className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-muted">No applications found matching your criteria</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredApps.map((app) => (
                <Link key={app.id} to={`/candidate/applications/${app.id}`}>
                  <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg hover:bg-bg-secondary transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-medium text-text-primary">{app.role}</h3>
                        <p className="text-sm text-text-muted">{app.company} · {app.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right hidden md:block">
                        <p className="text-sm text-text-muted">Submitted</p>
                        <p className="text-sm font-medium text-text-primary">{app.submitted}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className={getStatusColor(app.status)}>
                          {getStatusLabel(app.status)}
                        </Badge>
                        <p className="text-xs text-text-muted mt-1">Updated {app.lastUpdate}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-text-muted" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
