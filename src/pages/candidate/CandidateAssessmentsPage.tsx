/**
 * CandidateAssessmentsPage — Candidate Portal assessment catalog
 * Renders inside AppShell → Outlet. Shows available assessments to take and
 * completed results, switchable via tabs.
 */
import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Clock, HelpCircle, BarChart2, Star, Download, Play, ArrowRight, User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Progress } from '@/components/ui';
import { useTenantContext } from '@/hooks/useTenantContext';

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

const MOCK_AVAILABLE: AvailableAssessment[] = [
  { id: 'av1', name: 'Leadership Archetype Assessment', description: 'Discover your core leadership archetype and operating style.', duration: '25 min', questions: 40, category: 'Leadership' },
  { id: 'av2', name: 'Executive Reasoning Test', description: 'Measure strategic reasoning and complex problem-solving.', duration: '35 min', questions: 30, category: 'Cognitive' },
  { id: 'av3', name: 'Cross-Border Readiness Index', description: 'Assess readiness for international and cross-cultural roles.', duration: '20 min', questions: 28, category: 'Career' },
  { id: 'av4', name: 'Influence & Communication Profile', description: 'Map your influence style and stakeholder communication patterns.', duration: '18 min', questions: 24, category: 'Soft Skills' },
];

const MOCK_COMPLETED: CompletedAssessment[] = [
  {
    id: 'c1',
    name: 'Leadership Archetype Assessment',
    archetype: 'The Architect',
    score: 87,
    takenAt: '2025-01-08',
    dimensions: [
      { name: 'Strategic Vision', score: 92 },
      { name: 'Execution', score: 84 },
      { name: 'Influence', score: 78 },
      { name: 'Resilience', score: 88 },
    ],
  },
  {
    id: 'c2',
    name: 'Influence & Communication Profile',
    archetype: 'The Diplomat',
    score: 79,
    takenAt: '2024-12-15',
    dimensions: [
      { name: 'Persuasion', score: 82 },
      { name: 'Active Listening', score: 88 },
      { name: 'Conflict Resolution', score: 74 },
    ],
  },
];

export function CandidateAssessmentsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('available');
  const [available, setAvailable] = useState<AvailableAssessment[]>([]);
  const [completed, setCompleted] = useState<CompletedAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const { candidateProfile, profile } = useTenantContext();

  useEffect(() => {
    // TODO: Replace with real API call to /api/candidate/assessments
    const timer = setTimeout(() => {
      setAvailable(MOCK_AVAILABLE);
      setCompleted(MOCK_COMPLETED);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

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
      ) : activeTab === 'available' ? (
        /* Available assessments */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {available.map((a) => (
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
                <span className="inline-flex items-center gap-1"><HelpCircle className="w-3 h-3" /> {a.questions} questions</span>
              </div>
              <Button size="sm" className="w-full sm:w-auto">
                <Play className="w-3 h-3" /> Start Assessment
              </Button>
            </Card>
          ))}
        </div>
      ) : (
        /* Completed assessments */
        <div className="space-y-4">
          {completed.length === 0 ? (
            <div className="py-12 text-center text-text-muted text-sm">No completed assessments yet.</div>
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
