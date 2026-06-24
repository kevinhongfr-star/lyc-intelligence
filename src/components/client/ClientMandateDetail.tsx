import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useMandateDetail } from '@/hooks/useSupabaseData';
import {
  Briefcase,
  MapPin,
  Clock,
  FileText,
  Users,
  Calendar,
  ArrowRight,
  Download,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Loader2 } from 'lucide-react';

export function ClientMandateDetail() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuthStore();
  const { mandate, pipeline, loading } = useMandateDetail(id || '');
  const [activeTab, setActiveTab] = useState<'overview' | 'shortlist' | 'documents'>('overview');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

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
        return '#6366F1';
      case '2_call':
        return '#EC4899';
      case '3_deliver':
        return '#F59E0B';
      case 'won':
      case 'completed':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const phases = [
    { id: 'sourcing', label: 'Sourcing', status: mandate.status === '1_search' },
    { id: 'client', label: 'Client Review', status: mandate.status === '2_call' },
    { id: 'interview', label: 'Interview', status: mandate.status === '3_deliver' },
    { id: 'offer', label: 'Offer', status: false },
    { id: 'placed', label: 'Placed', status: mandate.status === 'won' },
  ];

  const shortlistedCandidates = pipeline.filter((p) => p.stage === 'GRID' || p.stage === 'client_approved');

  const upcomingInterviews = [
    { candidate: 'John Smith', date: 'June 25, 2024', time: '10:00 AM', status: 'confirmed' },
    { candidate: 'Sarah Chen', date: 'June 26, 2024', time: '2:00 PM', status: 'pending' },
  ];

  const documents = [
    { name: 'Market Map Report', type: 'PDF', date: 'June 20, 2024' },
    { name: 'Shortlist Summary', type: 'PDF', date: 'June 18, 2024' },
    { name: 'Candidate Profiles', type: 'PDF', date: 'June 15, 2024' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link to="/client/mandates" className="text-text-muted hover:text-text-primary">
              <ArrowRight className="w-5 h-5 rotate-180" />
            </Link>
            <div>
              <h1 className="text-2xl font-serif font-bold text-text-primary">{mandate.title}</h1>
              <p className="text-text-muted">{mandate.company?.name}</p>
            </div>
          </div>
        </div>
        <Badge
          variant="secondary"
          className="px-3 py-1"
          style={{ backgroundColor: `${getPhaseColor(mandate.status)}20`, color: getPhaseColor(mandate.status) }}
        >
          {getPhaseLabel(mandate.status)}
        </Badge>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-text-muted">Location</p>
                <p className="font-medium text-text-primary">{mandate.location || 'Not specified'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-text-muted">Created</p>
                <p className="font-medium text-text-primary">
                  {new Date(mandate.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-text-muted">Shortlisted</p>
                <p className="font-medium text-text-primary">{shortlistedCandidates.length} candidates</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            {phases.map((phase, index) => (
              <div key={phase.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      phase.status
                        ? 'bg-accent text-white'
                        : 'bg-bg-tertiary text-text-muted'
                    }`}
                  >
                    {phase.status ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </div>
                  <p className="text-xs mt-2 text-center max-w-[80px]">{phase.label}</p>
                </div>
                {index < phases.length - 1 && (
                  <div
                    className={`w-20 h-1 mx-2 rounded-full ${
                      phases[index + 1].status || phase.status ? 'bg-accent' : 'bg-bg-tertiary'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('shortlist')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'shortlist'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          Shortlist ({shortlistedCandidates.length})
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'documents'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          Documents
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-medium text-text-primary mb-4">Interview Schedule</h3>
            <div className="space-y-3">
              {upcomingInterviews.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h4 className="font-medium text-text-primary">{item.candidate}</h4>
                      <div className="flex items-center gap-2 text-sm text-text-muted">
                        <Calendar className="w-3 h-3" />
                        {item.date} at {item.time}
                      </div>
                    </div>
                  </div>
                  <Badge variant={item.status === 'confirmed' ? 'default' : 'outline'}>
                    {item.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'shortlist' && (
        <div className="space-y-4">
          {shortlistedCandidates.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <p className="text-text-muted">No candidates have been shortlisted yet</p>
              </CardContent>
            </Card>
          ) : (
            shortlistedCandidates.map((candidate) => (
              <Card key={candidate.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                      <span className="font-bold text-accent">
                        {candidate.contact?.name?.[0] || '?'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-text-primary">
                        {candidate.contact?.name || 'Unknown'}
                      </h3>
                      <p className="text-text-muted">{candidate.contact?.current_title}</p>
                      {candidate.summary && (
                        <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                          {candidate.summary}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary">Shortlisted</Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'documents' && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              {documents.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-text-primary">{doc.name}</h4>
                      <p className="text-sm text-text-muted">{doc.type} · {doc.date}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-accent">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
