import React, { useState, useMemo } from 'react';
import {
  Briefcase, MapPin, Calendar, ChevronRight, ChevronDown, Filter,
  X, Clock, CheckCircle2, AlertCircle, MessageSquare, Loader2,
  Download, ExternalLink
} from 'lucide-react';
import { Badge, Button, Input } from '@/components/ui';
import type { CandidateApplication } from '@/services/supabaseApi';

interface ApplicationTrackerProps {
  applications: CandidateApplication[];
}

type ViewMode = 'list' | 'detail';

const STAGE_ORDER = [
  'applied',
  'screening',
  'assessment',
  'interview',
  'second_interview',
  'final_round',
  'offer',
  'placed',
];

const STAGE_LABELS: Record<string, string> = {
  applied: 'Applied',
  screening: 'Screening',
  assessment: 'Assessment',
  interview: 'Interview',
  second_interview: 'Second Interview',
  final_round: 'Final Round',
  offer: 'Offer',
  placed: 'Placed',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

export function ApplicationTracker({ applications }: ApplicationTrackerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedApp, setSelectedApp] = useState<CandidateApplication | null>(null);
  const [filters, setFilters] = useState({
    stage: '',
    search: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Filter applications
  const filteredApps = useMemo(() => {
    return applications.filter(app => {
      if (filters.stage && app.stage.toLowerCase() !== filters.stage.toLowerCase()) {
        return false;
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        const title = app.mandate?.title?.toLowerCase() || '';
        const company = app.mandate?.company?.name?.toLowerCase() || '';
        if (!title.includes(search) && !company.includes(search)) {
          return false;
        }
      }
      return true;
    });
  }, [applications, filters]);

  // Group by stage
  const appsByStage = useMemo(() => {
    const groups: Record<string, CandidateApplication[]> = {};
    filteredApps.forEach(app => {
      const stage = app.stage.toLowerCase();
      if (!groups[stage]) groups[stage] = [];
      groups[stage].push(app);
    });
    return groups;
  }, [filteredApps]);

  // Get stage progress percentage
  const getStageProgress = (stage: string): number => {
    const idx = STAGE_ORDER.indexOf(stage.toLowerCase());
    if (idx === -1) return 0;
    return Math.round(((idx + 1) / STAGE_ORDER.length) * 100);
  };

  // Get stage variant
  const getStageVariant = (stage: string): 'success' | 'warning' | 'default' | 'danger' => {
    const s = stage.toLowerCase();
    if (['placed', 'offer'].includes(s)) return 'success';
    if (['interview', 'second_interview', 'final_round'].includes(s)) return 'warning';
    if (['rejected', 'withdrawn'].includes(s)) return 'danger';
    return 'default';
  };

  // Open application detail
  const openApplication = (app: CandidateApplication) => {
    setSelectedApp(app);
    setViewMode('detail');
  };

  // Back to list
  const backToList = () => {
    setSelectedApp(null);
    setViewMode('list');
  };

  // Format date
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Render timeline
  const renderTimeline = () => {
    if (!selectedApp) return null;

    const timeline = [
      { stage: 'Applied', date: selectedApp.created_at, completed: true },
      { stage: 'Screening', date: selectedApp.stage === 'screening' ? selectedApp.updated_at : undefined, completed: ['screening', 'assessment', 'interview', 'second_interview', 'final_round', 'offer', 'placed'].includes(selectedApp.stage.toLowerCase()) },
      { stage: 'Assessment', date: selectedApp.stage === 'assessment' ? selectedApp.updated_at : undefined, completed: ['assessment', 'interview', 'second_interview', 'final_round', 'offer', 'placed'].includes(selectedApp.stage.toLowerCase()) },
      { stage: 'Interview', date: selectedApp.stage === 'interview' ? selectedApp.updated_at : undefined, completed: ['interview', 'second_interview', 'final_round', 'offer', 'placed'].includes(selectedApp.stage.toLowerCase()) },
      { stage: 'Final Round', date: selectedApp.stage === 'final_round' ? selectedApp.updated_at : undefined, completed: ['final_round', 'offer', 'placed'].includes(selectedApp.stage.toLowerCase()) },
      { stage: 'Offer', date: selectedApp.stage === 'offer' ? selectedApp.updated_at : undefined, completed: ['offer', 'placed'].includes(selectedApp.stage.toLowerCase()) },
    ];

    return (
      <div className="mb-6">
        <h4 className="font-medium text-text-primary mb-4">Application Timeline</h4>
        <div className="relative">
          {/* Progress line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
          
          {/* Timeline items */}
          <div className="space-y-4">
            {timeline.map((item, i) => (
              <div key={i} className="flex items-start gap-4 relative">
                <div className={`z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                  item.completed 
                    ? 'bg-green-500 text-white' 
                    : item.date 
                      ? 'bg-yellow-500 text-white' 
                      : 'bg-bg-alt border-2 border-border text-text-muted'
                }`}>
                  {item.completed ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : item.date ? (
                    <Clock className="w-4 h-4" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-border" />
                  )}
                </div>
                <div className="flex-1 pt-1">
                  <div className="font-medium text-text-primary">{item.stage}</div>
                  <div className="text-sm text-text-muted">
                    {item.date ? formatDate(item.date) : 'Pending'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render list view
  const renderListView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Your Applications</h2>
          <p className="text-sm text-text-muted">{filteredApps.length} total applications</p>
        </div>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-card rounded-none border border-card-border p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Search</label>
              <Input
                placeholder="Search by title or company..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Stage</label>
              <select
                value={filters.stage}
                onChange={(e) => setFilters(prev => ({ ...prev, stage: e.target.value }))}
                className="w-full px-3 py-2 bg-bg border border-border rounded-none text-text-primary"
              >
                <option value="">All Stages</option>
                {Object.entries(STAGE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          {(filters.stage || filters.search) && (
            <button
              onClick={() => setFilters({ stage: '', search: '' })}
              className="mt-3 text-sm text-accent hover:text-accent-hover flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Application cards */}
      {filteredApps.length === 0 ? (
        <div className="bg-card rounded-none border border-card-border p-8 text-center">
          <Briefcase className="w-12 h-12 mx-auto text-text-muted opacity-50 mb-3" />
          <p className="text-text-muted">No applications found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredApps.map(app => (
            <div
              key={app.id}
              onClick={() => openApplication(app)}
              className="bg-card rounded-none border border-card-border p-5 hover:border-accent/50 cursor-pointer transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-text-primary">
                      {app.mandate?.title || 'Application'}
                    </h3>
                    <Badge variant={getStageVariant(app.stage)}>
                      {STAGE_LABELS[app.stage.toLowerCase()] || app.stage}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-text-muted">
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      {app.mandate?.company?.name || 'Company'}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {app.mandate?.location || 'Location TBD'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Applied {formatDate(app.created_at)}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-text-muted" />
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                  <span>Progress</span>
                  <span>{getStageProgress(app.stage)}%</span>
                </div>
                <div className="h-2 bg-bg-alt rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      ['placed', 'offer'].includes(app.stage.toLowerCase()) 
                        ? 'bg-green-500' 
                        : app.stage.toLowerCase() === 'rejected'
                          ? 'bg-red-500'
                          : 'bg-accent'
                    }`}
                    style={{ width: `${getStageProgress(app.stage)}%` }}
                  />
                </div>
              </div>

              {/* Next steps */}
              {app.next_steps && (
                <div className="mt-4 p-3 bg-bg-alt rounded-none">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-accent mt-0.5" />
                    <span className="text-sm text-text-muted">{app.next_steps}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Render detail view
  const renderDetailView = () => {
    if (!selectedApp) return null;

    return (
      <div className="space-y-6">
        {/* Back button */}
        <button
          onClick={backToList}
          className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Back to Applications
        </button>

        {/* Header */}
        <div className="bg-card rounded-none border border-card-border p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-text-primary">
                {selectedApp.mandate?.title || 'Application'}
              </h2>
              <p className="text-text-muted mt-1">
                {selectedApp.mandate?.company?.name || 'Company'}
              </p>
            </div>
            <Badge variant={getStageVariant(selectedApp.stage)} className="text-base px-4 py-1">
              {STAGE_LABELS[selectedApp.stage.toLowerCase()] || selectedApp.stage}
            </Badge>
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-text-muted mb-2">
              <span>Application Progress</span>
              <span>{getStageProgress(selectedApp.stage)}%</span>
            </div>
            <div className="h-3 bg-bg-alt rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  ['placed', 'offer'].includes(selectedApp.stage.toLowerCase()) 
                    ? 'bg-green-500' 
                    : 'bg-accent'
                }`}
                style={{ width: `${getStageProgress(selectedApp.stage)}%` }}
              />
            </div>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-text-muted">Applied</div>
              <div className="font-medium text-text-primary">{formatDate(selectedApp.created_at)}</div>
            </div>
            <div>
              <div className="text-text-muted">Last Updated</div>
              <div className="font-medium text-text-primary">{formatDate(selectedApp.updated_at)}</div>
            </div>
            {selectedApp.match_score && (
              <div>
                <div className="text-text-muted">Match Score</div>
                <div className="font-medium text-text-primary">{selectedApp.match_score}/100</div>
              </div>
            )}
            {selectedApp.trident_composite && (
              <div>
                <div className="text-text-muted">TRIDENT Score</div>
                <div className="font-medium text-text-primary">{selectedApp.trident_composite}</div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timeline */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-none border border-card-border p-5">
              {renderTimeline()}
            </div>
          </div>

          {/* Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mandate Overview */}
            {selectedApp.mandate && (
              <div className="bg-card rounded-none border border-card-border p-5">
                <h4 className="font-semibold text-text-primary mb-4">Mandate Overview</h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="text-text-muted">Client</div>
                    <div className="text-text-primary">{selectedApp.mandate.company?.name || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-text-muted">Industry</div>
                    <div className="text-text-primary">{selectedApp.mandate.company?.industry || 'N/A'}</div>
                  </div>
                  {selectedApp.mandate.jd_description && (
                    <div>
                      <div className="text-text-muted">Description</div>
                      <div className="text-text-primary whitespace-pre-wrap">
                        {selectedApp.mandate.jd_description.substring(0, 500)}
                        {selectedApp.mandate.jd_description.length > 500 && '...'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Next Steps */}
            {selectedApp.next_steps && (
              <div className="bg-card rounded-none border border-card-border p-5">
                <h4 className="font-semibold text-text-primary mb-4">Next Steps</h4>
                <div className="p-4 bg-accent/5 border border-accent/20 rounded-none">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-accent mt-0.5" />
                    <p className="text-text-primary">{selectedApp.next_steps}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Client Feedback */}
            {selectedApp.client_feedback && (
              <div className="bg-card rounded-none border border-card-border p-5">
                <h4 className="font-semibold text-text-primary mb-4">Client Feedback</h4>
                <div className="p-4 bg-bg-alt rounded-none">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant={
                      selectedApp.client_feedback.decision === 'approved' ? 'success' :
                      selectedApp.client_feedback.decision === 'hold' ? 'warning' : 'danger'
                    }>
                      {selectedApp.client_feedback.decision.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-text-muted">
                      {formatDate(selectedApp.client_feedback.decided_at)}
                    </span>
                  </div>
                  <p className="text-text-primary whitespace-pre-wrap">
                    {selectedApp.client_feedback.comment}
                  </p>
                </div>
              </div>
            )}

            {/* Match Details */}
            {selectedApp.match_reasons && selectedApp.match_reasons.length > 0 && (
              <div className="bg-card rounded-none border border-card-border p-5">
                <h4 className="font-semibold text-text-primary mb-4">Why You're a Match</h4>
                <ul className="space-y-2">
                  {selectedApp.match_reasons.map((reason: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                      <span className="text-text-primary">{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return viewMode === 'detail' ? renderDetailView() : renderListView();
}