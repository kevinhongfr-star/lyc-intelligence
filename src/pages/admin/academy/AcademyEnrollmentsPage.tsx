/**
 * AcademyEnrollmentsPage — Enrollment management
 * Issue #17: Academy Admin
 *
 * Lists enrollments across all courses with filters (course, status, type).
 * Supports manual enrollment, status updates, progress inspection.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  ChevronDown,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { Progress } from '@/components/ui/Progress';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type EnrollmentStatus = 'active' | 'completed' | 'cancelled' | 'expired';
type EnrollmentType = 'individual' | 'team';

interface Enrollment {
  id: string;
  course_id: string;
  contact_id: string;
  user_id: string | null;
  enrollment_type: EnrollmentType;
  team_id: string | null;
  status: EnrollmentStatus;
  enrolled_at: string;
  completed_at: string | null;
  progress_percent: number;
  certificate_id: string | null;
  last_lesson_id: string | null;
  course: { id: string; title: string; slug: string } | null;
  contact: { id: string; name: string; email: string } | null;
}

interface CourseOption {
  id: string;
  title: string;
}

const STATUS_META: Record<
  EnrollmentStatus,
  { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'fuchsia' }
> = {
  active: { label: 'Active', variant: 'success' },
  completed: { label: 'Completed', variant: 'fuchsia' },
  cancelled: { label: 'Cancelled', variant: 'danger' },
  expired: { label: 'Expired', variant: 'warning' },
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function AcademyEnrollmentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [progressDetail, setProgressDetail] = useState<Record<string, any>>({});
  const [showEnrollForm, setShowEnrollForm] = useState(false);

  const courseId = searchParams.get('course_id') || '';
  const status = searchParams.get('status') || '';
  const search = searchParams.get('search') || '';

  const loadCourses = useCallback(async () => {
    try {
      const res = await fetch('/api/academy/courses?limit=200', { credentials: 'include' });
      if (res.ok) {
        const { data } = await res.json();
        setCourses(data || []);
      }
    } catch {
      // ignore — filter just won't have course options
    }
  }, []);

  const loadEnrollments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (courseId) params.set('course_id', courseId);
      if (status) params.set('status', status);
      params.set('limit', '200');
      const res = await fetch(`/api/academy/enrollments?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load enrollments');
      const { data } = await res.json();
      setEnrollments(data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [courseId, status]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    loadEnrollments();
  }, [loadEnrollments]);

  const filtered = useMemo(() => {
    if (!search) return enrollments;
    const q = search.toLowerCase();
    return enrollments.filter(
      (e) =>
        e.contact?.name?.toLowerCase().includes(q) ||
        e.contact?.email?.toLowerCase().includes(q) ||
        e.course?.title?.toLowerCase().includes(q),
    );
  }, [enrollments, search]);

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  const toggleExpand = async (enrollmentId: string) => {
    const next = new Set(expanded);
    if (next.has(enrollmentId)) {
      next.delete(enrollmentId);
    } else {
      next.add(enrollmentId);
      if (!progressDetail[enrollmentId]) {
        try {
          const res = await fetch(`/api/academy/enrollments/${enrollmentId}`, {
            credentials: 'include',
          });
          if (res.ok) {
            const { data } = await res.json();
            setProgressDetail((prev) => ({ ...prev, [enrollmentId]: data }));
          }
        } catch {
          // ignore
        }
      }
    }
    setExpanded(next);
  };

  const handleStatusChange = async (enrollmentId: string, newStatus: EnrollmentStatus) => {
    try {
      const res = await fetch(`/api/academy/enrollments/${enrollmentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Status update failed');
      setEnrollments((prev) =>
        prev.map((e) =>
          e.id === enrollmentId
            ? {
                ...e,
                status: newStatus,
                completed_at: newStatus === 'completed' ? new Date().toISOString() : e.completed_at,
                progress_percent: newStatus === 'completed' ? 100 : e.progress_percent,
              }
            : e,
        ),
      );
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleCancel = async (enrollmentId: string) => {
    if (!confirm('Cancel this enrollment?')) return;
    try {
      const res = await fetch(`/api/academy/enrollments/${enrollmentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Cancel failed');
      setEnrollments((prev) =>
        prev.map((e) => (e.id === enrollmentId ? { ...e, status: 'cancelled' } : e)),
      );
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleEnrollCreated = (enrollment: Enrollment) => {
    setEnrollments((prev) => [enrollment, ...prev]);
    setShowEnrollForm(false);
  };

  /* ---------------------------------------------------------------- */
  /* Stats                                                             */
  /* ---------------------------------------------------------------- */

  const stats = useMemo(() => {
    const total = enrollments.length;
    const active = enrollments.filter((e) => e.status === 'active').length;
    const completed = enrollments.filter((e) => e.status === 'completed').length;
    const avgProgress =
      total > 0
        ? Math.round(enrollments.reduce((sum, e) => sum + Number(e.progress_percent || 0), 0) / total)
        : 0;
    return { total, active, completed, avgProgress };
  }, [enrollments]);

  /* ---------------------------------------------------------------- */
  /* Render                                                            */
  /* ---------------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-6 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-serif text-[#1A1A1A] tracking-tight">Enrollments</h1>
            <p className="text-[14px] text-[#6B6B6B] mt-1">
              Manage learner enrollments across all academy courses.
            </p>
          </div>
          <Button onClick={() => setShowEnrollForm(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Enrollment
          </Button>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={<Users className="h-4 w-4" />} label="Total" value={stats.total} />
          <StatCard
            icon={<Clock className="h-4 w-4" />}
            label="Active"
            value={stats.active}
          />
          <StatCard
            icon={<CheckCircle2 className="h-4 w-4" />}
            label="Completed"
            value={stats.completed}
          />
          <StatCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="Avg Progress"
            value={`${stats.avgProgress}%`}
          />
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9B9B9B]" />
                <Input
                  placeholder="Search by name, email, or course..."
                  value={search}
                  onChange={(e: any) => updateFilter('search', e.target.value)}
                  className="pl-9"
                />
              </div>
              <select
                value={courseId}
                onChange={(e) => updateFilter('course_id', e.target.value)}
                className="rounded-md border border-[#E5E5E5] px-3 py-2 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10"
              >
                <option value="">All Courses</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
              <select
                value={status}
                onChange={(e) => updateFilter('status', e.target.value)}
                className="rounded-md border border-[#E5E5E5] px-3 py-2 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[#6B6B6B]" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-6 text-center text-[#C0392B] flex items-center justify-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title="No enrollments"
            description="Adjust filters or create a new enrollment."
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-[#E5E5E5]">
                {filtered.map((enrollment) => (
                  <EnrollmentRow
                    key={enrollment.id}
                    enrollment={enrollment}
                    expanded={expanded.has(enrollment.id)}
                    progressDetail={progressDetail[enrollment.id]}
                    onToggle={() => toggleExpand(enrollment.id)}
                    onStatusChange={(s) => handleStatusChange(enrollment.id, s)}
                    onCancel={() => handleCancel(enrollment.id)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {showEnrollForm && (
        <EnrollModal
          courses={courses}
          onClose={() => setShowEnrollForm(false)}
          onCreated={handleEnrollCreated}
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
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-[#6B6B6B]">
          {icon}
          <span className="text-[12px] font-medium uppercase tracking-wide">{label}</span>
        </div>
        <div className="text-[24px] font-serif text-[#1A1A1A] mt-1">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* EnrollmentRow                                                       */
/* ------------------------------------------------------------------ */

function EnrollmentRow({
  enrollment,
  expanded,
  progressDetail,
  onToggle,
  onStatusChange,
  onCancel,
}: {
  enrollment: Enrollment;
  expanded: boolean;
  progressDetail: any;
  onToggle: () => void;
  onStatusChange: (status: EnrollmentStatus) => void;
  onCancel: () => void;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 hover:bg-[#FAFAFA] text-left"
      >
        <div className="flex-shrink-0">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-[#9B9B9B]" />
          ) : (
            <ChevronRight className="h-4 w-4 text-[#9B9B9B]" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[14px] font-medium text-[#1A1A1A]">
              {enrollment.contact?.name || 'Unknown'}
            </span>
            <Badge variant={STATUS_META[enrollment.status].variant}>
              {STATUS_META[enrollment.status].label}
            </Badge>
            {enrollment.enrollment_type === 'team' && (
              <Badge variant="default">Team</Badge>
            )}
          </div>
          <div className="text-[12px] text-[#6B6B6B] mt-0.5">
            {enrollment.contact?.email && <span>{enrollment.contact.email} · </span>}
            <span>{enrollment.course?.title || 'Unknown course'}</span>
            <span> · enrolled {new Date(enrollment.enrolled_at).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="w-32 hidden md:block">
          <div className="text-[11px] text-[#9B9B9B] mb-1 flex justify-between">
            <span>Progress</span>
            <span>{Number(enrollment.progress_percent).toFixed(0)}%</span>
          </div>
          <Progress value={Number(enrollment.progress_percent)} className="h-1.5" />
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-1 bg-[#FAFAFA] border-t border-[#E5E5E5]">
          <div className="grid md:grid-cols-3 gap-4 mt-3">
            <div>
              <h4 className="text-[11px] font-medium text-[#6B6B6B] uppercase tracking-wide mb-2">
                Enrollment Details
              </h4>
              <div className="space-y-1 text-[13px]">
                <DetailRow label="Enrolled" value={new Date(enrollment.enrolled_at).toLocaleString()} />
                {enrollment.completed_at && (
                  <DetailRow
                    label="Completed"
                    value={new Date(enrollment.completed_at).toLocaleString()}
                  />
                )}
                <DetailRow label="Type" value={enrollment.enrollment_type} />
                {enrollment.certificate_id && (
                  <DetailRow label="Certificate" value={enrollment.certificate_id} />
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <h4 className="text-[11px] font-medium text-[#6B6B6B] uppercase tracking-wide mb-2">
                Lesson Progress ({progressDetail?.progress_entries?.length || 0})
              </h4>
              {!progressDetail ? (
                <div className="text-[13px] text-[#9B9B9B]">Loading...</div>
              ) : progressDetail.progress_entries?.length === 0 ? (
                <div className="text-[13px] text-[#9B9B9B]">No lessons started yet.</div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {progressDetail.progress_entries?.map((p: any) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between text-[12px] py-1 border-b border-[#E5E5E5] last:border-0"
                    >
                      <span className="font-mono text-[#6B6B6B]">
                        Lesson: {p.lesson_id?.slice(0, 8)}...
                      </span>
                      <div className="flex items-center gap-2">
                        {p.video_watched && <Badge variant="default">Video</Badge>}
                        {p.reading_viewed && <Badge variant="default">Reading</Badge>}
                        {p.exercise_completed && <Badge variant="default">Exercise</Badge>}
                        {p.quiz_attempted && (
                          <Badge variant={p.quiz_score >= 70 ? 'success' : 'warning'}>
                            Quiz {Number(p.quiz_score).toFixed(0)}%
                          </Badge>
                        )}
                        {p.completed_at && (
                          <Badge variant="success">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Done
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-[#E5E5E5]">
            <span className="text-[12px] text-[#6B6B6B] mr-2">Change status:</span>
            <select
              value={enrollment.status}
              onChange={(e) => onStatusChange(e.target.value as EnrollmentStatus)}
              className="rounded-md border border-[#E5E5E5] px-2 py-1 text-[12px] bg-white focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10"
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="expired">Expired</option>
            </select>
            {enrollment.status !== 'cancelled' && (
              <Button variant="ghost" size="sm" onClick={onCancel}>
                <XCircle className="h-3.5 w-3.5 mr-1 text-[#C0392B]" />
                Cancel Enrollment
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* DetailRow                                                           */
/* ------------------------------------------------------------------ */

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-[#9B9B9B]">{label}</span>
      <span className="text-[#1A1A1A]">{value}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* EnrollModal                                                         */
/* ------------------------------------------------------------------ */

function EnrollModal({
  courses,
  onClose,
  onCreated,
}: {
  courses: CourseOption[];
  onClose: () => void;
  onCreated: (enrollment: Enrollment) => void;
}) {
  const [courseId, setCourseId] = useState('');
  const [contactId, setContactId] = useState('');
  const [enrollmentType, setEnrollmentType] = useState<'individual' | 'team'>('individual');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!courseId || !contactId.trim()) {
      setError('Course and contact ID are required');
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/academy/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          course_id: courseId,
          contact_id: contactId.trim(),
          enrollment_type: enrollmentType,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Create failed');
      }
      const { data } = await res.json();
      // Hydrate course + contact locally
      const course = courses.find((c) => c.id === courseId) || null;
      onCreated({
        ...data,
        course: course ? { id: course.id, title: course.title, slug: '' } : null,
        contact: { id: contactId.trim(), name: 'Loading...', email: '' },
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-[#E5E5E5]">
          <h2 className="text-[18px] font-serif text-[#1A1A1A]">New Enrollment</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-[12px] font-medium text-[#6B6B6B] uppercase tracking-wide">
              Course *
            </label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="mt-1 w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10"
            >
              <option value="">Select a course...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[12px] font-medium text-[#6B6B6B] uppercase tracking-wide">
              Contact ID *
            </label>
            <Input
              value={contactId}
              onChange={(e: any) => setContactId(e.target.value)}
              placeholder="UUID of contact"
              className="mt-1 font-mono text-[13px]"
            />
            <p className="text-[11px] text-[#9B9B9B] mt-1">
              Find contact IDs via the candidates page.
            </p>
          </div>
          <div>
            <label className="text-[12px] font-medium text-[#6B6B6B] uppercase tracking-wide">
              Enrollment Type
            </label>
            <select
              value={enrollmentType}
              onChange={(e) => setEnrollmentType(e.target.value as any)}
              className="mt-1 w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10"
            >
              <option value="individual">Individual</option>
              <option value="team">Team</option>
            </select>
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
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Enrolling...
              </>
            ) : (
              'Enroll'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
