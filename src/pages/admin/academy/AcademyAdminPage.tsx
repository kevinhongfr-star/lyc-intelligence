/**
 * AcademyAdminPage — Course CMS landing
 * Issue #17: Academy Admin
 *
 * Lists all LMS courses with status, enrollment counts, ratings.
 * Provides create/edit/archive actions and overview analytics.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Edit,
  Archive,
  Trash2,
  Users,
  Star,
  Clock,
  BookOpen,
  TrendingUp,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type CourseStatus = 'draft' | 'published' | 'archived';

interface CourseRow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  status: CourseStatus;
  price_cny: number;
  price_usd: number;
  duration_weeks: number | null;
  estimated_hours: number | null;
  avg_rating: number | null;
  review_count: number;
  published_at: string | null;
  cover_image_url: string | null;
  enrollment_count: number;
  created_at: string;
}

interface OverviewStats {
  total_courses: number;
  published_courses: number;
  draft_courses: number;
  archived_courses: number;
  total_enrollments: number;
  active_enrollments: number;
  completed_enrollments: number;
  recent_enrollments_30d: number;
  completion_rate: number;
}

const STATUS_META: Record<
  CourseStatus,
  { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'fuchsia' }
> = {
  draft: { label: 'Draft', variant: 'default' },
  published: { label: 'Published', variant: 'success' },
  archived: { label: 'Archived', variant: 'danger' },
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function AcademyAdminPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<CourseStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ title: '', description: '', price_cny: '0' });

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [courseRes, overviewRes] = await Promise.all([
        fetch('/api/academy/courses?limit=200', { credentials: 'include' }),
        fetch('/api/academy/analytics/overview', { credentials: 'include' }),
      ]);
      if (!courseRes.ok) throw new Error('Failed to load courses');
      const courseJson = await courseRes.json();
      const overviewJson = overviewRes.ok ? await overviewRes.json() : null;
      setCourses(courseJson.data || []);
      if (overviewJson?.data) setOverview(overviewJson.data);
    } catch (e: any) {
      setError(e.message || 'Load failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [courses, statusFilter, search]);

  const handleCreate = async () => {
    if (!draft.title.trim()) {
      setCreateError('Title is required');
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch('/api/academy/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: draft.title.trim(),
          description: draft.description.trim() || null,
          price_cny: parseFloat(draft.price_cny) || 0,
          status: 'draft',
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Create failed');
      }
      const { data } = await res.json();
      setShowCreateForm(false);
      setDraft({ title: '', description: '', price_cny: '0' });
      navigate(`/admin/academy/courses/${data.id}`);
    } catch (e: any) {
      setCreateError(e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleArchive = async (courseId: string) => {
    if (!confirm('Archive this course? It will be hidden from learners.')) return;
    try {
      const res = await fetch(`/api/academy/courses/${courseId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Archive failed');
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleTogglePublish = async (course: CourseRow) => {
    const next = course.status === 'published' ? 'draft' : 'published';
    try {
      const res = await fetch(`/api/academy/courses/${course.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error('Status change failed');
      setCourses((prev) =>
        prev.map((c) => (c.id === course.id ? { ...c, status: next } : c)),
      );
    } catch (e: any) {
      alert(e.message);
    }
  };

  /* ---------------------------------------------------------------- */
  /* Render                                                            */
  /* ---------------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-6 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-serif text-[#1A1A1A] tracking-tight">Academy Admin</h1>
            <p className="text-[14px] text-[#6B6B6B] mt-1">
              Course CMS, lesson builder, and enrollment management.
            </p>
          </div>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Course
          </Button>
        </header>

        {/* Overview stats */}
        {overview && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatCard
              icon={<BookOpen className="h-4 w-4" />}
              label="Total Courses"
              value={overview.total_courses}
              sub={`${overview.published_courses} published`}
            />
            <StatCard
              icon={<Users className="h-4 w-4" />}
              label="Total Enrollments"
              value={overview.total_enrollments}
              sub={`${overview.active_enrollments} active`}
            />
            <StatCard
              icon={<CheckCircle2 className="h-4 w-4" />}
              label="Completed"
              value={overview.completed_enrollments}
              sub={`${overview.completion_rate}% rate`}
            />
            <StatCard
              icon={<TrendingUp className="h-4 w-4" />}
              label="Enrollments (30d)"
              value={overview.recent_enrollments_30d}
              sub="Last 30 days"
            />
            <StatCard
              icon={<Clock className="h-4 w-4" />}
              label="Draft Courses"
              value={overview.draft_courses}
              sub="Awaiting publish"
            />
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9B9B9B]" />
                <Input
                  placeholder="Search courses by title..."
                  value={search}
                  onChange={(e: any) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-1.5">
                {(['all', 'draft', 'published', 'archived'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
                      statusFilter === s
                        ? 'bg-[#1A1A1A] text-white'
                        : 'bg-white text-[#6B6B6B] hover:bg-[#F0F0F0]'
                    }`}
                  >
                    {s === 'all' ? 'All' : STATUS_META[s].label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Course list */}
        {loading ? (
          <LoadingSkeleton variant="list" count={4} />
        ) : error ? (
          <Card>
            <CardContent className="p-6 text-center text-[#C0392B] flex items-center justify-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-6 w-6" />}
            title="No courses yet"
            description="Create your first course to get started."
            actionLabel="New Course"
            onAction={() => setShowCreateForm(true)}
          />
        ) : (
          <div className="grid gap-3">
            {filtered.map((course) => (
              <CourseRowCard
                key={course.id}
                course={course}
                onEdit={() => navigate(`/admin/academy/courses/${course.id}`)}
                onArchive={() => handleArchive(course.id)}
                onTogglePublish={() => handleTogglePublish(course)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreateForm && (
        <CreateCourseModal
          draft={draft}
          setDraft={setDraft}
          creating={creating}
          error={createError}
          onClose={() => {
            setShowCreateForm(false);
            setCreateError(null);
          }}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* StatCard                                                            */
/* ------------------------------------------------------------------ */

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-[#6B6B6B]">
          {icon}
          <span className="text-[12px] font-medium uppercase tracking-wide">{label}</span>
        </div>
        <div className="text-[26px] font-serif text-[#1A1A1A] mt-1.5">{value.toLocaleString()}</div>
        <div className="text-[12px] text-[#9B9B9B] mt-0.5">{sub}</div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* CourseRowCard                                                       */
/* ------------------------------------------------------------------ */

function CourseRowCard({
  course,
  onEdit,
  onArchive,
  onTogglePublish,
}: {
  course: CourseRow;
  onEdit: () => void;
  onArchive: () => void;
  onTogglePublish: () => void;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={onEdit}
                className="text-[16px] font-medium text-[#1A1A1A] hover:underline text-left"
              >
                {course.title}
              </button>
              <Badge variant={STATUS_META[course.status].variant}>
                {STATUS_META[course.status].label}
              </Badge>
            </div>
            {course.description && (
              <p className="text-[13px] text-[#6B6B6B] mt-1 line-clamp-2">{course.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-[12px] text-[#9B9B9B]">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {course.enrollment_count} enrolled
              </span>
              {course.avg_rating && (
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-[#B8860B] text-[#B8860B]" />
                  {Number(course.avg_rating).toFixed(1)} ({course.review_count})
                </span>
              )}
              {course.duration_weeks && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {course.duration_weeks}w
                </span>
              )}
              <span className="text-[#6B6B6B]">¥{Number(course.price_cny).toLocaleString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onTogglePublish}
              title={course.status === 'published' ? 'Unpublish' : 'Publish'}
            >
              {course.status === 'published' ? 'Unpublish' : 'Publish'}
            </Button>
            <Button variant="ghost" size="sm" onClick={onArchive} title="Archive">
              <Archive className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* CreateCourseModal                                                   */
/* ------------------------------------------------------------------ */

function CreateCourseModal({
  draft,
  setDraft,
  creating,
  error,
  onClose,
  onCreate,
}: {
  draft: { title: string; description: string; price_cny: string };
  setDraft: (d: any) => void;
  creating: boolean;
  error: string | null;
  onClose: () => void;
  onCreate: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-[#E5E5E5]">
          <h2 className="text-[18px] font-serif text-[#1A1A1A]">New Course</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-[12px] font-medium text-[#6B6B6B] uppercase tracking-wide">
              Title *
            </label>
            <Input
              value={draft.title}
              onChange={(e: any) => setDraft({ ...draft, title: e.target.value })}
              placeholder="e.g. Executive Leadership Assessment"
              className="mt-1"
              autoFocus
            />
          </div>
          <div>
            <label className="text-[12px] font-medium text-[#6B6B6B] uppercase tracking-wide">
              Description
            </label>
            <textarea
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              placeholder="Short course summary"
              rows={3}
              className="mt-1 w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10"
            />
          </div>
          <div>
            <label className="text-[12px] font-medium text-[#6B6B6B] uppercase tracking-wide">
              Price (CNY)
            </label>
            <Input
              type="number"
              value={draft.price_cny}
              onChange={(e: any) => setDraft({ ...draft, price_cny: e.target.value })}
              className="mt-1"
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-[13px] text-[#C0392B]">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-[#E5E5E5] flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onCreate} disabled={creating}>
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Course'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
