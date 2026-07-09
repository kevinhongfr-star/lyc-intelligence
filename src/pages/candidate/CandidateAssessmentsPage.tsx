/**
 * CandidateAssessmentsPage — Candidate Portal assessment catalog
 * Renders inside AppShell → Outlet. Shows available assessments to take and
 * completed results, switchable via tabs.
 */
import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Clock, HelpCircle, BarChart2, Star, Download, Play, ArrowRight, User, Search } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Progress, EmptyState, Input } from '@/components/ui';
import { useTenantContext } from '@/hooks/useTenantContext';
import { getAssessmentCatalog, getAssessmentInvitations } from '@/services/supabaseApi';

type Tab = 'available' | 'completed';

interface AvailableAssessment {
  id: string;
  name: string;
  description: string;
  duration: string;
  questions: number;
  category: string;
}

interface CompletedAssessment {
  id: string;
  name: string;
  archetype: string;
  score: number;
  takenAt: string;
  dimensions: { name: string; score: number }[];
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'available', label: 'Available' },
  { id: 'completed', label: 'Completed' },
];

const CATEGORY_OPTIONS = ['All Categories', 'Leadership', 'Cognitive', 'Career', 'Soft Skills'];

export function CandidateAssessmentsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('available');
  const [available, setAvailable] = useState<AvailableAssessment[]>([]);
  const [completed, setCompleted] = useState<CompletedAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const { candidateProfile, profile } = useTenantContext();

  useEffect(() => {
    async function loadAssessments() {
      try {
        const catalog = await getAssessmentCatalog();
        const mappedAvailable: AvailableAssessment[] = catalog.map((a: any) => ({
          id: a.id,
          name: a.title || 'Assessment',
          description: a.description || '',
          duration: a.estimated_minutes ? `${a.estimated_minutes} min` : '—',
          questions: 0,
          category: a.type || 'General',
        }));
        setAvailable(mappedAvailable);

        if (candidateProfile?.id) {
          try {
            const invitations = await getAssessmentInvitations(candidateProfile.id);
            const completedInvitations = invitations.filter((i: any) => i.status === 'completed');
            const mappedCompleted: CompletedAssessment[] = completedInvitations.map((i: any) => ({
              id: i.id,
              name: i.assessment_title || 'Assessment',
              archetype: 'Completed',
              score: 0,
              takenAt: i.invited_at?.split('T')[0] || '',
              dimensions: [],
            }));
            setCompleted(mappedCompleted);
          } catch (e) {
            console.error('[CandidateAssessmentsPage] Invitations error:', e);
          }
        }
      } catch (e) {
        console.error('[CandidateAssessmentsPage] Error:', e);
        setError('Failed to load assessments');
      } finally {
        setLoading(false);
      }
    }
    loadAssessments();
  }, [candidateProfile?.id]);

  const filteredAvailable = available.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All Categories' || a.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const displayName = candidateProfile?.name || profile?.name || 'Candidate';
  const currentTitle = candidateProfile?.current_title || 'Professional';

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="font-serif font-bold text-2xl text-text-primary">Assessments</h1>
            <p className="text-text-secondary text-sm mt-1">Discover, take, and review your professional assessments.</p>
          </div>
          <div className="flex items-center gap-3 bg-bg-warm px-4 py-2 rounded-lg">
            <div className="w-9 h-9 rounded-full bg-fuchsia-light flex items-center justify-center">
              <User className="w-4 h-4 text-fuchsia" />
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-text-primary">{displayName}</div>
              <div className="text-xs text-text-muted">{currentTitle}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-0 border-b border-border">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors"
              style={{
                borderRadius: 0,
                borderBottom: isActive ? '2px solid #C108AB' : '2px solid transparent',
                color: isActive ? '#C108AB' : '#999999',
                background: 'none',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="py-12 text-center text-text-muted text-sm">Loading assessments...</div>
      ) : error ? (
        <EmptyState title="Failed to load" description="Could not load assessments. Please try again later." />
      ) : activeTab === 'available' ? (
        /* Available assessments */
        <>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <Input
                placeholder="Search assessments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 bg-white border border-border text-sm text-text-primary focus:outline-none focus:border-fuchsia"
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          {filteredAvailable.length === 0 ? (
            <EmptyState
              title={available.length === 0 ? 'No assessments available' : 'No matching assessments'}
              description={available.length === 0 ? 'Check back soon for new assessments.' : 'Try adjusting your search or category filter.'}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredAvailable.map((a) => (
                <Card key={a.id} className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center flex-shrink-0">
                      <ClipboardCheck className="w-5 h-5 text-fuchsia" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-serif font-semibold text-text-primary">{a.name}</h3>
                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-fuchsia-light text-fuchsia">{a.category}</span>
                      </div>
                      <p className="text-sm text-text-secondary mt-1">{a.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-text-muted mb-4">
                    <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {a.duration}</span>
                    {a.questions > 0 && (
                      <span className="inline-flex items-center gap-1"><HelpCircle className="w-3 h-3" /> {a.questions} questions</span>
                    )}
                  </div>
                  <Button size="sm" className="w-full sm:w-auto">
                    <Play className="w-3 h-3" /> Start Assessment
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Completed assessments */
        <div className="space-y-4">
          {completed.length === 0 ? (
            <EmptyState title="No completed assessments" description="You haven't completed any assessments yet." />
          ) : (
            completed.map((c) => (
              <Card key={c.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{c.name}</CardTitle>
                      <p className="text-xs text-text-muted mt-1">Completed on {c.takenAt}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs text-text-muted">Overall Score</div>
                        <div className="text-lg font-bold text-fuchsia">{c.score}/100</div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="w-3 h-3" /> Report
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="flex flex-col items-center justify-center text-center bg-fuchsia-light rounded-lg p-6">
                      <Star className="w-8 h-8 text-fuchsia mb-2" />
                      <div className="text-xs text-text-muted uppercase tracking-wide">Archetype</div>
                      <div className="font-serif font-bold text-xl text-text-primary mt-1">{c.archetype}</div>
                      <button className="text-sm text-fuchsia hover:underline flex items-center gap-1 mt-3">
                        View details <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="lg:col-span-2 space-y-3">
                      {c.dimensions.map((dim) => (
                        <div key={dim.name}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-text-primary flex items-center gap-2">
                              <BarChart2 className="w-3 h-3 text-fuchsia" />
                              {dim.name}
                            </span>
                            <span className="text-text-secondary font-medium">{dim.score}</span>
                          </div>
                          <Progress value={dim.score} />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default CandidateAssessmentsPage;
