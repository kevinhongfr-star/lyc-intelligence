/**
 * CandidateAdvancedAssessmentsPage — Candidate Portal advanced assessments
 * Renders inside AppShell → Outlet. Shows specialized assessments,
 * deep-dive evaluations, and certification prep.
 */
import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Brain, Target, Award, Clock, Star, ArrowRight, BarChart3, User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Progress, EmptyState } from '@/components/ui';
import { useTenantContext } from '@/hooks/useTenantContext';
import { getAssessmentCatalog, getAssessmentInvitations, type AssessmentInvitation } from '@/services/supabaseApi';

type AssessmentCategory = 'Cognitive' | 'Personality' | 'Skills' | 'Executive';

interface Assessment {
  id: string;
  title: string;
  description: string;
  category: AssessmentCategory;
  duration: number;
  questions: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  status: 'Available' | 'In Progress' | 'Completed';
  score?: number;
  icon: React.ReactNode;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: 'bg-green/10 text-green',
  Intermediate: 'bg-blue/10 text-blue',
  Advanced: 'bg-amber/10 text-amber',
  Expert: 'bg-fuchsia/10 text-fuchsia',
};

const CATEGORY_COLORS: Record<string, string> = {
  Cognitive: 'bg-blue/10 text-blue',
  Personality: 'bg-amber/10 text-amber',
  Skills: 'bg-green/10 text-green',
  Executive: 'bg-fuchsia/10 text-fuchsia',
};

const STATUS_COLORS: Record<string, string> = {
  Available: 'bg-blue/10 text-blue',
  'In Progress': 'bg-amber/10 text-amber',
  Completed: 'bg-green/10 text-green',
};

// Map an arbitrary catalog type string to one of the UI categories
function categorizeType(type: string | null | undefined): AssessmentCategory {
  const t = (type || '').toLowerCase();
  if (!t) return 'Skills';
  if (t.includes('exec') || t.includes('leader') || t.includes('prism')) return 'Executive';
  if (t.includes('cognit') || t.includes('brain') || t.includes('forge') || t.includes('strategic')) return 'Cognitive';
  if (t.includes('person') || t.includes('eq') || t.includes('mosaic') || t.includes('emotion')) return 'Personality';
  return 'Skills';
}

function iconForCategory(category: AssessmentCategory): React.ReactNode {
  switch (category) {
    case 'Executive': return <Award className="w-5 h-5" />;
    case 'Cognitive': return <Brain className="w-5 h-5" />;
    case 'Personality': return <BarChart3 className="w-5 h-5" />;
    default: return <Target className="w-5 h-5" />;
  }
}

export function CandidateAdvancedAssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'All' | AssessmentCategory>('All');
  const { candidateProfile, profile } = useTenantContext();

  useEffect(() => {
    let cancelled = false;
    const fetchAssessments = async () => {
      try {
        setError(null);
        const [catalog, invitations] = await Promise.all([
          getAssessmentCatalog(),
          candidateProfile?.id ? getAssessmentInvitations(candidateProfile.id) : Promise.resolve<AssessmentInvitation[]>([]),
        ]);
        if (cancelled) return;

        // Build a lookup of invitation status by assessment_id (and assessment_type as fallback)
        const invByAssessmentId = new Map<string, AssessmentInvitation>();
        const invByType = new Map<string, AssessmentInvitation>();
        for (const inv of invitations) {
          if (inv.assessment_id) invByAssessmentId.set(inv.assessment_id, inv);
          if (inv.assessment_type) invByType.set(inv.assessment_type.toLowerCase(), inv);
        }

        const mapped: Assessment[] = (catalog || []).map((c: any) => {
          const category = categorizeType(c.type);
          const inv = (c.id && invByAssessmentId.get(c.id)) || (c.type && invByType.get(String(c.type).toLowerCase())) || null;
          let status: Assessment['status'] = 'Available';
          if (inv) {
            if (inv.status === 'completed') status = 'Completed';
            else if (inv.status === 'viewed' || inv.status === 'sent' || inv.status === 'pending') status = 'In Progress';
          }
          return {
            id: c.id ?? '',
            title: c.title ?? 'Untitled Assessment',
            description: c.description ?? '',
            category,
            duration: c.estimated_minutes ?? 0,
            questions: 0,
            difficulty: 'Advanced',
            status,
            icon: iconForCategory(category),
          };
        });

        setAssessments(mapped);
      } catch (e) {
        console.error('[CandidateAdvancedAssessmentsPage] Error:', e);
        if (!cancelled) setError('Failed to load assessments');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchAssessments();
    return () => { cancelled = true; };
  }, [candidateProfile?.id]);

  const displayName = candidateProfile?.name || profile?.name || 'Candidate';
  const currentTitle = candidateProfile?.current_title || 'Professional';

  const filtered = filter === 'All' ? assessments : assessments.filter(a => a.category === filter);

  const completed = assessments.filter(a => a.status === 'Completed').length;
  const inProgress = assessments.filter(a => a.status === 'In Progress').length;
  const scored = assessments.filter(a => a.score !== undefined);
  const avgScore = scored.length
    ? scored.reduce((sum, a) => sum + (a.score || 0), 0) / scored.length
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="font-serif font-bold text-2xl text-text-primary">Advanced Assessments</h1>
            <p className="text-text-secondary text-sm mt-1">Deep-dive evaluations and specialized assessments for executive roles.</p>
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-fuchsia" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{loading ? '—' : assessments.length}</div>
              <div className="text-xs text-text-muted">Total Available</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{loading ? '—' : inProgress}</div>
              <div className="text-xs text-text-muted">In Progress</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green/10 flex items-center justify-center">
              <Award className="w-5 h-5 text-green" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{loading ? '—' : completed}</div>
              <div className="text-xs text-text-muted">Completed</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue/10 flex items-center justify-center">
              <Star className="w-5 h-5 text-blue" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{loading ? '—' : Math.round(avgScore)}</div>
              <div className="text-xs text-text-muted">Avg Score</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['All', 'Cognitive', 'Personality', 'Skills', 'Executive'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === cat
                ? 'bg-fuchsia text-white'
                : 'bg-bg-warm text-text-secondary hover:bg-fuchsia-light hover:text-fuchsia'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-8 text-center text-text-muted text-sm">Loading assessments...</div>
        ) : error ? (
          <div className="col-span-full">
            <EmptyState title="Failed to load assessments" description={error} />
          </div>
        ) : assessments.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              title="No assessments available"
              description="There are no assessments in the catalog right now. Check back later."
            />
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              title="No assessments in this category"
              description="Try selecting a different category filter."
            />
          </div>
        ) : (
          filtered.map((assessment) => (
            <Card key={assessment.id} className="p-5 hover:shadow-card-hover transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center text-fuchsia">
                  {assessment.icon}
                </div>
                <Badge className={STATUS_COLORS[assessment.status]}>{assessment.status}</Badge>
              </div>
              <h3 className="font-serif font-bold text-lg text-text-primary mb-1">{assessment.title}</h3>
              <p className="text-xs text-text-muted mb-3">{assessment.description}</p>
              <div className="flex items-center gap-2 mb-3">
                <Badge className={CATEGORY_COLORS[assessment.category]}>{assessment.category}</Badge>
                <Badge className={DIFFICULTY_COLORS[assessment.difficulty]}>{assessment.difficulty}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-text-muted mb-4">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {assessment.duration ? `${assessment.duration} min` : '—'}
                </div>
                <div className="flex items-center gap-1">
                  <ClipboardCheck className="w-3 h-3" /> {assessment.questions ? `${assessment.questions} questions` : '—'}
                </div>
              </div>
              {assessment.score !== undefined && (
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-text-secondary">Your Score</span>
                    <span className="font-bold text-fuchsia">{assessment.score}/100</span>
                  </div>
                  <Progress value={assessment.score} className="h-2" />
                </div>
              )}
              <Button className="w-full" size="sm" variant={assessment.status === 'Available' ? 'default' : 'outline'}>
                {assessment.status === 'Completed' ? 'View Results' : assessment.status === 'In Progress' ? 'Continue' : 'Start Assessment'}
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default CandidateAdvancedAssessmentsPage;
