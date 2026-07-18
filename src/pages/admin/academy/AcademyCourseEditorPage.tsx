/**
 * AcademyCourseEditorPage — Course editor with lesson builder
 * Issue #17: Academy Admin
 *
 * Two-pane layout: course settings + lesson management.
 * Supports inline lesson edit, reorder, quiz editor, status changes.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  GripVertical,
  Save,
  Loader2,
  AlertCircle,
  Clock,
  FileText,
  Video,
  HelpCircle,
  CheckCircle2,
  X,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type LessonStatus = 'draft' | 'published' | 'archived';

interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  sort_order: number;
  duration_minutes: number | null;
  video_url: string | null;
  video_duration_seconds: number | null;
  reading_content: string | null;
  reading_word_count: number | null;
  exercise_content: string | null;
  quiz_id: string | null;
  status: LessonStatus;
  instructor_notes: string | null;
}

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  long_description: string | null;
  status: 'draft' | 'published' | 'archived';
  price_cny: number;
  price_usd: number;
  duration_weeks: number | null;
  estimated_hours: number | null;
  cover_image_url: string | null;
  companion_diagnostic: string | null;
  instructor_notes: string | null;
  published_at: string | null;
}

interface Quiz {
  id?: string;
  lesson_id?: string;
  title: string;
  passing_score: number;
  max_attempts: number;
  questions: any[];
  answer_key: Record<string, any>;
}

interface EnrollmentStats {
  total: number;
  active: number;
  completed: number;
  cancelled: number;
  avg_progress: number;
}

const LESSON_STATUS_META: Record<
  LessonStatus,
  { label: string; variant: 'default' | 'success' | 'danger' }
> = {
  draft: { label: 'Draft', variant: 'default' },
  published: { label: 'Published', variant: 'success' },
  archived: { label: 'Archived', variant: 'danger' },
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function AcademyCourseEditorPage() {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [enrollmentStats, setEnrollmentStats] = useState<EnrollmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [savingCourse, setSavingCourse] = useState(false);
  const [courseForm, setCourseForm] = useState<Partial<Course>>({});

  const loadCourse = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/academy/courses/${courseId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load course');
      const { data } = await res.json();
      setCourse(data);
      setCourseForm(data);
      setLessons(data.lessons || []);
      setEnrollmentStats(data.enrollment_stats || null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  const handleSaveCourse = async () => {
    if (!courseId) return;
    setSavingCourse(true);
    try {
      const res = await fetch(`/api/academy/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(courseForm),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Save failed');
      }
      const { data } = await res.json();
      setCourse(data);
      setCourseForm(data);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSavingCourse(false);
    }
  };

  const handleCreateLesson = () => {
    setEditingLesson(null);
    setShowLessonForm(true);
  };

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setShowLessonForm(true);
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Delete this lesson? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/academy/lessons/${lessonId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Delete failed');
      setLessons((prev) => prev.filter((l) => l.id !== lessonId));
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleReorder = async (lessonId: string, direction: 'up' | 'down') => {
    const idx = lessons.findIndex((l) => l.id === lessonId);
    if (idx < 0) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= lessons.length) return;
    const newOrder = [...lessons];
    [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];
    setLessons(newOrder);
    try {
      await fetch(`/api/academy/lessons/${lessonId}/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sort_order: newOrder[idx].sort_order }),
      });
      await fetch(`/api/academy/lessons/${newOrder[swapIdx].id}/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sort_order: newOrder[swapIdx].sort_order }),
      });
    } catch (e) {
      // Revert on failure
      loadCourse();
    }
  };

  const handleToggleLessonStatus = async (lesson: Lesson) => {
    const next = lesson.status === 'published' ? 'draft' : 'published';
    try {
      const res = await fetch(`/api/academy/lessons/${lesson.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error('Status update failed');
      setLessons((prev) =>
        prev.map((l) => (l.id === lesson.id ? { ...l, status: next } : l)),
      );
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#6B6B6B]" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] p-6">
        <div className="max-w-3xl mx-auto text-center text-[#C0392B] flex items-center justify-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error || 'Course not found'}
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Render                                                            */
  /* ---------------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E5E5]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/academy')}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div>
              <h1 className="text-[20px] font-serif text-[#1A1A1A]">{course.title}</h1>
              <div className="flex items-center gap-2 mt-0.5 text-[12px] text-[#9B9B9B]">
                <span>/{course.slug}</span>
                <span>·</span>
                <Badge variant={course.status === 'published' ? 'success' : 'default'}>
                  {course.status}
                </Badge>
              </div>
            </div>
          </div>
          <Button onClick={handleSaveCourse} disabled={savingCourse}>
            {savingCourse ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1.5" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 lg:p-8">
        <Tabs defaultValue="settings">
          <TabsList>
            <TabsTrigger value="settings">Course Settings</TabsTrigger>
            <TabsTrigger value="lessons">Lessons ({lessons.length})</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* ── Settings tab ── */}
          <TabsContent value="settings">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-[12px] font-medium text-[#6B6B6B] uppercase tracking-wide">
                        Title
                      </label>
                      <Input
                        value={courseForm.title || ''}
                        onChange={(e: any) => setCourseForm({ ...courseForm, title: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[12px] font-medium text-[#6B6B6B] uppercase tracking-wide">
                        Short Description
                      </label>
                      <Input
                        value={courseForm.description || ''}
                        onChange={(e: any) =>
                          setCourseForm({ ...courseForm, description: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[12px] font-medium text-[#6B6B6B] uppercase tracking-wide">
                        Long Description
                      </label>
                      <textarea
                        value={courseForm.long_description || ''}
                        onChange={(e) =>
                          setCourseForm({ ...courseForm, long_description: e.target.value })
                        }
                        rows={5}
                        className="mt-1 w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10"
                      />
                    </div>
                    <div>
                      <label className="text-[12px] font-medium text-[#6B6B6B] uppercase tracking-wide">
                        Cover Image URL
                      </label>
                      <Input
                        value={courseForm.cover_image_url || ''}
                        onChange={(e: any) =>
                          setCourseForm({ ...courseForm, cover_image_url: e.target.value })
                        }
                        className="mt-1"
                        placeholder="https://..."
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Pricing & Duration</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[12px] font-medium text-[#6B6B6B] uppercase tracking-wide">
                        Price (CNY)
                      </label>
                      <Input
                        type="number"
                        value={courseForm.price_cny ?? 0}
                        onChange={(e: any) =>
                          setCourseForm({ ...courseForm, price_cny: parseFloat(e.target.value) })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[12px] font-medium text-[#6B6B6B] uppercase tracking-wide">
                        Price (USD)
                      </label>
                      <Input
                        type="number"
                        value={courseForm.price_usd ?? 0}
                        onChange={(e: any) =>
                          setCourseForm({ ...courseForm, price_usd: parseFloat(e.target.value) })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[12px] font-medium text-[#6B6B6B] uppercase tracking-wide">
                        Duration (weeks)
                      </label>
                      <Input
                        type="number"
                        value={courseForm.duration_weeks ?? ''}
                        onChange={(e: any) =>
                          setCourseForm({
                            ...courseForm,
                            duration_weeks: e.target.value ? parseInt(e.target.value) : null,
                          })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[12px] font-medium text-[#6B6B6B] uppercase tracking-wide">
                        Estimated Hours
                      </label>
                      <Input
                        type="number"
                        value={courseForm.estimated_hours ?? ''}
                        onChange={(e: any) =>
                          setCourseForm({
                            ...courseForm,
                            estimated_hours: e.target.value ? parseFloat(e.target.value) : null,
                          })
                        }
                        className="mt-1"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Instructor Notes (Private)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <textarea
                      value={courseForm.instructor_notes || ''}
                      onChange={(e) =>
                        setCourseForm({ ...courseForm, instructor_notes: e.target.value })
                      }
                      rows={4}
                      placeholder="Internal notes for instructors..."
                      className="w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10"
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={course.status === 'published' ? 'success' : 'default'}>
                        {course.status}
                      </Badge>
                      {course.published_at && (
                        <span className="text-[12px] text-[#9B9B9B]">
                          Published {new Date(course.published_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={async () => {
                        const next = course.status === 'published' ? 'draft' : 'published';
                        const res = await fetch(`/api/academy/courses/${course.id}/status`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          credentials: 'include',
                          body: JSON.stringify({ status: next }),
                        });
                        if (res.ok) {
                          const { data } = await res.json();
                          setCourse(data);
                        }
                      }}
                    >
                      {course.status === 'published' ? 'Unpublish Course' : 'Publish Course'}
                    </Button>
                  </CardContent>
                </Card>

                {enrollmentStats && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Enrollments</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <StatRow label="Total" value={enrollmentStats.total} />
                      <StatRow label="Active" value={enrollmentStats.active} />
                      <StatRow label="Completed" value={enrollmentStats.completed} />
                      <StatRow label="Cancelled" value={enrollmentStats.cancelled} />
                      <StatRow
                        label="Avg Progress"
                        value={`${enrollmentStats.avg_progress}%`}
                      />
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ── Lessons tab ── */}
          <TabsContent value="lessons">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Lessons ({lessons.length})</CardTitle>
                  <Button size="sm" onClick={handleCreateLesson}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Lesson
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {lessons.length === 0 ? (
                  <div className="text-center py-12 text-[#9B9B9B]">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-[14px]">No lessons yet. Add your first lesson to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {lessons
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map((lesson, idx) => (
                        <LessonRow
                          key={lesson.id}
                          lesson={lesson}
                          index={idx}
                          total={lessons.length}
                          onEdit={() => handleEditLesson(lesson)}
                          onDelete={() => handleDeleteLesson(lesson.id)}
                          onReorder={(dir) => handleReorder(lesson.id, dir)}
                          onToggleStatus={() => handleToggleLessonStatus(lesson)}
                        />
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Analytics tab ── */}
          <TabsContent value="analytics">
            <CourseAnalyticsTab courseId={course.id} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Lesson form modal */}
      {showLessonForm && (
        <LessonFormModal
          courseId={course.id}
          lesson={editingLesson}
          onClose={() => {
            setShowLessonForm(false);
            setEditingLesson(null);
          }}
          onSaved={(savedLesson, isNew) => {
            if (isNew) {
              setLessons((prev) => [...prev, savedLesson]);
            } else {
              setLessons((prev) => prev.map((l) => (l.id === savedLesson.id ? savedLesson : l)));
            }
            setShowLessonForm(false);
            setEditingLesson(null);
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* StatRow                                                             */
/* ------------------------------------------------------------------ */

function StatRow({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <span className="text-[#6B6B6B]">{label}</span>
      <span className="font-medium text-[#1A1A1A]">{value}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* LessonRow                                                           */
/* ------------------------------------------------------------------ */

function LessonRow({
  lesson,
  index,
  total,
  onEdit,
  onDelete,
  onReorder,
  onToggleStatus,
}: {
  lesson: Lesson;
  index: number;
  total: number;
  onEdit: () => void;
  onDelete: () => void;
  onReorder: (dir: 'up' | 'down') => void;
  onToggleStatus: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-md border border-[#E5E5E5] bg-white hover:border-[#1A1A1A]/20 transition-colors">
      <div className="flex flex-col">
        <button
          onClick={() => onReorder('up')}
          disabled={index === 0}
          className="text-[#9B9B9B] hover:text-[#1A1A1A] disabled:opacity-30"
        >
          <GripVertical className="h-3 w-3 rotate-180" />
        </button>
        <button
          onClick={() => onReorder('down')}
          disabled={index === total - 1}
          className="text-[#9B9B9B] hover:text-[#1A1A1A] disabled:opacity-30"
        >
          <GripVertical className="h-3 w-3" />
        </button>
      </div>

      <div className="text-[13px] text-[#9B9B9B] w-6 text-center">{index + 1}</div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={onEdit} className="text-[14px] font-medium text-[#1A1A1A] hover:underline text-left">
            {lesson.title}
          </button>
          <Badge variant={LESSON_STATUS_META[lesson.status].variant}>
            {LESSON_STATUS_META[lesson.status].label}
          </Badge>
        </div>
        <div className="flex items-center gap-3 mt-1 text-[12px] text-[#9B9B9B]">
          {lesson.duration_minutes && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {lesson.duration_minutes}m
            </span>
          )}
          {lesson.video_url && (
            <span className="flex items-center gap-1">
              <Video className="h-3 w-3" />
              Video
            </span>
          )}
          {lesson.reading_content && (
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {lesson.reading_word_count || 0} words
            </span>
          )}
          {lesson.quiz_id && (
            <span className="flex items-center gap-1">
              <HelpCircle className="h-3 w-3" />
              Quiz
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={onToggleStatus} title="Toggle publish">
          {lesson.status === 'published' ? 'Unpublish' : 'Publish'}
        </Button>
        <Button variant="ghost" size="sm" onClick={onEdit} title="Edit">
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete} title="Delete">
          <Trash2 className="h-4 w-4 text-[#C0392B]" />
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* LessonFormModal                                                     */
/* ------------------------------------------------------------------ */

function LessonFormModal({
  courseId,
  lesson,
  onClose,
  onSaved,
}: {
  courseId: string;
  lesson: Lesson | null;
  onClose: () => void;
  onSaved: (lesson: Lesson, isNew: boolean) => void;
}) {
  const [form, setForm] = useState({
    title: lesson?.title || '',
    description: lesson?.description || '',
    duration_minutes: lesson?.duration_minutes?.toString() || '',
    video_url: lesson?.video_url || '',
    reading_content: lesson?.reading_content || '',
    exercise_content: lesson?.exercise_content || '',
    instructor_notes: lesson?.instructor_notes || '',
    status: lesson?.status || 'draft',
  });
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'quiz'>('content');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lesson?.id) {
      fetch(`/api/academy/lessons/${lesson.id}/quiz`, { credentials: 'include' })
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => {
          if (j?.data) {
            setQuiz(j.data);
          } else {
            setQuiz({
              title: 'Lesson Quiz',
              passing_score: 70,
              max_attempts: 3,
              questions: [],
              answer_key: {},
            });
          }
        })
        .catch(() =>
          setQuiz({
            title: 'Lesson Quiz',
            passing_score: 70,
            max_attempts: 3,
            questions: [],
            answer_key: {},
          }),
        );
    } else {
      setQuiz({
        title: 'Lesson Quiz',
        passing_score: 70,
        max_attempts: 3,
        questions: [],
        answer_key: {},
      });
    }
  }, [lesson?.id]);

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
        video_url: form.video_url.trim() || null,
        reading_content: form.reading_content || null,
        exercise_content: form.exercise_content || null,
        instructor_notes: form.instructor_notes || null,
        status: form.status,
      };

      let savedLesson: Lesson;
      if (lesson) {
        const res = await fetch(`/api/academy/lessons/${lesson.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Save failed');
        }
        const { data } = await res.json();
        savedLesson = data;
      } else {
        const res = await fetch(`/api/academy/courses/${courseId}/lessons`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Create failed');
        }
        const { data } = await res.json();
        savedLesson = data;
      }

      // Save quiz if present and has questions
      if (quiz && quiz.questions.length > 0) {
        await fetch(`/api/academy/lessons/${savedLesson.id}/quiz`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            title: quiz.title,
            passing_score: quiz.passing_score,
            max_attempts: quiz.max_attempts,
            questions: quiz.questions,
            answer_key: quiz.answer_key,
          }),
        });
      }

      onSaved(savedLesson, !lesson);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-[#E5E5E5] flex items-center justify-between">
          <h2 className="text-[18px] font-serif text-[#1A1A1A]">
            {lesson ? 'Edit Lesson' : 'New Lesson'}
          </h2>
          <button onClick={onClose} className="text-[#9B9B9B] hover:text-[#1A1A1A]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 pt-4 border-b border-[#E5E5E5]">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('content')}
              className={`pb-2 text-[14px] font-medium border-b-2 ${
                activeTab === 'content'
                  ? 'border-[#1A1A1A] text-[#1A1A1A]'
                  : 'border-transparent text-[#6B6B6B]'
              }`}
            >
              Content
            </button>
            <button
              onClick={() => setActiveTab('quiz')}
              className={`pb-2 text-[14px] font-medium border-b-2 ${
                activeTab === 'quiz'
                  ? 'border-[#1A1A1A] text-[#1A1A1A]'
                  : 'border-transparent text-[#6B6B6B]'
              }`}
            >
              Quiz ({quiz?.questions.length || 0})
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {activeTab === 'content' ? (
            <div className="space-y-4">
              <div>
                <label className="text-[12px] font-medium text-[#6B6B6B] uppercase tracking-wide">
                  Title *
                </label>
                <Input
                  value={form.title}
                  onChange={(e: any) => setForm({ ...form, title: e.target.value })}
                  className="mt-1"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-[12px] font-medium text-[#6B6B6B] uppercase tracking-wide">
                  Description
                </label>
                <Input
                  value={form.description}
                  onChange={(e: any) => setForm({ ...form, description: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[12px] font-medium text-[#6B6B6B] uppercase tracking-wide">
                    Duration (minutes)
                  </label>
                  <Input
                    type="number"
                    value={form.duration_minutes}
                    onChange={(e: any) =>
                      setForm({ ...form, duration_minutes: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-[#6B6B6B] uppercase tracking-wide">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                    className="mt-1 w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[12px] font-medium text-[#6B6B6B] uppercase tracking-wide">
                  Video URL
                </label>
                <Input
                  value={form.video_url}
                  onChange={(e: any) => setForm({ ...form, video_url: e.target.value })}
                  className="mt-1"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="text-[12px] font-medium text-[#6B6B6B] uppercase tracking-wide">
                  Reading Content (Markdown)
                </label>
                <textarea
                  value={form.reading_content}
                  onChange={(e) => setForm({ ...form, reading_content: e.target.value })}
                  rows={6}
                  className="mt-1 w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-[14px] font-mono focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10"
                />
              </div>
              <div>
                <label className="text-[12px] font-medium text-[#6B6B6B] uppercase tracking-wide">
                  Exercise Content
                </label>
                <textarea
                  value={form.exercise_content}
                  onChange={(e) => setForm({ ...form, exercise_content: e.target.value })}
                  rows={4}
                  className="mt-1 w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-[14px] font-mono focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10"
                />
              </div>
              <div>
                <label className="text-[12px] font-medium text-[#6B6B6B] uppercase tracking-wide">
                  Instructor Notes
                </label>
                <textarea
                  value={form.instructor_notes}
                  onChange={(e) => setForm({ ...form, instructor_notes: e.target.value })}
                  rows={3}
                  className="mt-1 w-full rounded-md border border-[#E5E5E5] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]/10"
                />
              </div>
            </div>
          ) : (
            <QuizEditor quiz={quiz} setQuiz={setQuiz} />
          )}
        </div>

        <div className="px-6 py-4 border-t border-[#E5E5E5] flex justify-between items-center">
          {error && (
            <div className="flex items-center gap-2 text-[13px] text-[#C0392B]">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1.5" />
                  Save Lesson
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* QuizEditor                                                          */
/* ------------------------------------------------------------------ */

function QuizEditor({ quiz, setQuiz }: { quiz: Quiz | null; setQuiz: (q: Quiz) => void }) {
  if (!quiz) return <div className="text-center text-[#9B9B9B] py-8">Loading quiz...</div>;

  const addQuestion = () => {
    setQuiz({
      ...quiz,
      questions: [
        ...quiz.questions,
        {
          id: crypto.randomUUID(),
          type: 'multiple_choice',
          question: '',
          options: ['', '', '', ''],
          correct_index: 0,
          explanation: '',
        },
      ],
    });
  };

  const updateQuestion = (idx: number, updates: any) => {
    const newQuestions = [...quiz.questions];
    newQuestions[idx] = { ...newQuestions[idx], ...updates };
    setQuiz({ ...quiz, questions: newQuestions });
  };

  const removeQuestion = (idx: number) => {
    setQuiz({
      ...quiz,
      questions: quiz.questions.filter((_, i) => i !== idx),
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-[12px] font-medium text-[#6B6B6B] uppercase tracking-wide">
            Quiz Title
          </label>
          <Input
            value={quiz.title}
            onChange={(e: any) => setQuiz({ ...quiz, title: e.target.value })}
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-[12px] font-medium text-[#6B6B6B] uppercase tracking-wide">
            Passing Score (%)
          </label>
          <Input
            type="number"
            value={quiz.passing_score}
            onChange={(e: any) =>
              setQuiz({ ...quiz, passing_score: parseFloat(e.target.value) || 0 })
            }
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-[12px] font-medium text-[#6B6B6B] uppercase tracking-wide">
            Max Attempts
          </label>
          <Input
            type="number"
            value={quiz.max_attempts}
            onChange={(e: any) =>
              setQuiz({ ...quiz, max_attempts: parseInt(e.target.value) || 1 })
            }
            className="mt-1"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <h3 className="text-[14px] font-medium text-[#1A1A1A]">Questions</h3>
        <Button size="sm" variant="outline" onClick={addQuestion}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add Question
        </Button>
      </div>

      {quiz.questions.length === 0 ? (
        <div className="text-center py-8 text-[#9B9B9B] text-[13px] border border-dashed border-[#E5E5E5] rounded-md">
          No questions yet. Add one to test learner comprehension.
        </div>
      ) : (
        <div className="space-y-3">
          {quiz.questions.map((q: any, idx: number) => (
            <div key={idx} className="rounded-md border border-[#E5E5E5] p-3 space-y-2 bg-[#FAFAFA]">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-[#6B6B6B]">Q{idx + 1}</span>
                <button
                  onClick={() => removeQuestion(idx)}
                  className="text-[#C0392B] hover:text-[#A02816]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <Input
                value={q.question}
                onChange={(e: any) => updateQuestion(idx, { question: e.target.value })}
                placeholder="Question text..."
                className="text-[14px]"
              />
              <div className="space-y-1.5">
                {q.options?.map((opt: string, optIdx: number) => (
                  <div key={optIdx} className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuestion(idx, { correct_index: optIdx })}
                      className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                        q.correct_index === optIdx
                          ? 'bg-[#1A7D42] border-[#1A7D42]'
                          : 'border-[#D0D0D0] hover:border-[#1A1A1A]'
                      }`}
                      title="Mark as correct"
                    >
                      {q.correct_index === optIdx && (
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      )}
                    </button>
                    <Input
                      value={opt}
                      onChange={(e: any) => {
                        const newOpts = [...q.options];
                        newOpts[optIdx] = e.target.value;
                        updateQuestion(idx, { options: newOpts });
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                      className="text-[13px] py-1"
                    />
                  </div>
                ))}
              </div>
              <Input
                value={q.explanation || ''}
                onChange={(e: any) => updateQuestion(idx, { explanation: e.target.value })}
                placeholder="Explanation (optional)"
                className="text-[13px] py-1"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* CourseAnalyticsTab                                                  */
/* ------------------------------------------------------------------ */

function CourseAnalyticsTab({ courseId }: { courseId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/academy/analytics/course/${courseId}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setData(j?.data || null))
      .finally(() => setLoading(false));
  }, [courseId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-[#6B6B6B]" />
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-12 text-[#9B9B9B]">No analytics available.</div>;
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Enrollment Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <StatRow label="Total Enrollments" value={data.enrollments_total} />
          <StatRow label="Active" value={data.enrollments_active} />
          <StatRow label="Completed" value={data.enrollments_completed} />
          <StatRow label="Cancelled" value={data.enrollments_cancelled} />
          <StatRow label="Avg Progress" value={`${data.avg_progress}%`} />
          <StatRow label="Completion Rate" value={`${data.completion_rate}%`} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Progress Distribution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {Object.entries(data.progress_distribution || {}).map(([bucket, count]: any) => (
            <div key={bucket} className="flex items-center gap-3">
              <span className="text-[12px] text-[#6B6B6B] w-16">{bucket}</span>
              <div className="flex-1 h-2 bg-[#F0F0F0] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1A1A1A]"
                  style={{
                    width: `${
                      data.enrollments_total > 0 ? (count / data.enrollments_total) * 100 : 0
                    }%`,
                  }}
                />
              </div>
              <span className="text-[12px] font-medium text-[#1A1A1A] w-8 text-right">{count}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lessons</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <StatRow label="Total Lessons" value={data.lessons_total} />
          <StatRow label="Published" value={data.lessons_published} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reviews</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <StatRow label="Total Reviews" value={data.reviews_total} />
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className="flex items-center gap-2 text-[12px]">
              <span className="text-[#6B6B6B] w-8">{star}★</span>
              <div className="flex-1 h-1.5 bg-[#F0F0F0] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#B8860B]"
                  style={{
                    width: `${
                      data.reviews_total > 0
                        ? (data.rating_distribution[star] / data.reviews_total) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <span className="text-[#1A1A1A] w-6 text-right">
                {data.rating_distribution[star]}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
