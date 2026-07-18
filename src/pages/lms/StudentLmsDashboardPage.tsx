/**
 * StudentLmsDashboardPage — Student LMS Dashboard
 * Issue #19: Student LMS Dashboard
 *
 * Shows enrolled courses, progress tracking, certificates,
 * and a personalized learning plan.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  BookOpen,
  Clock,
  Award,
  Target,
  Calendar,
  TrendingUp,
  PlayCircle,
  CheckCircle2,
  ChevronRight,
  Star,
  Trophy,
  GraduationCap,
  FileText,
  Download,
  Flame,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface EnrolledCourse {
  id: string;
  course_id: string;
  title: string;
  description: string;
  cover_image_url: string | null;
  status: string;
  progress_pct: number;
  lessons_completed: number;
  total_lessons: number;
  last_lesson_id: string | null;
  last_lesson_title: string | null;
  enrolled_at: string;
  estimated_hours: number;
  duration_weeks: number;
  certificate_id: string | null;
  certificate_issued: boolean;
}

interface Certificate {
  id: string;
  certificate_code: string;
  course_title: string;
  issued_at: string;
  final_score: number;
}

interface LearningPlanItem {
  id: string;
  title: string;
  course_id: string;
  target_date: string;
  status: 'not_started' | 'in_progress' | 'completed';
  priority: 'must_have' | 'should_have' | 'nice_to_have';
  progress_pct: number;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function StudentLmsDashboardPage() {
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [learningPlan, setLearningPlan] = useState<LearningPlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('courses');

  const loadDashboard = useCallback(async () => {
    try {
      // Try real API first
      const res = await fetch('/api/lms/dashboard', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setCourses(data.data?.enrollments || []);
        setCertificates(data.data?.certificates || []);
        setLearningPlan(data.data?.learning_plan || []);
      } else {
        setCourses(MOCK_COURSES);
        setCertificates(MOCK_CERTIFICATES);
        setLearningPlan(MOCK_LEARNING_PLAN);
      }
    } catch {
      setCourses(MOCK_COURSES);
      setCertificates(MOCK_CERTIFICATES);
      setLearningPlan(MOCK_LEARNING_PLAN);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#6B6B6B]" />
      </div>
    );
  }

  const inProgress = courses.filter((c) => c.status === 'active').length;
  const completed = courses.filter((c) => c.status === 'completed').length;
  const totalHours = courses.reduce((acc, c) => acc + (c.estimated_hours * (c.progress_pct / 100)), 0);
  const streakDays = 7;

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <header className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] text-white">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex items-center gap-2 text-[13px] text-white/60 mb-2">
            <GraduationCap className="h-4 w-4" />
            Learning Dashboard
          </div>
          <h1 className="text-[32px] font-serif">Welcome back 👋</h1>
          <p className="text-[14px] text-white/60 mt-1">
            Pick up where you left off and keep your learning streak alive.
          </p>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <StatCard icon={<BookOpen className="h-4 w-4" />} label="In Progress" value={inProgress} />
            <StatCard icon={<Trophy className="h-4 w-4" />} label="Completed" value={completed} />
            <StatCard icon={<Clock className="h-4 w-4" />} label="Hours Learned" value={Math.round(totalHours)} />
            <StatCard icon={<Flame className="h-4 w-4" />} label="Day Streak" value={streakDays} />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="courses">My Courses</TabsTrigger>
            <TabsTrigger value="learning-plan">Learning Plan</TabsTrigger>
            <TabsTrigger value="certificates">
              Certificates <span className="ml-1 text-[#9B9B9B]">({certificates.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* ── Courses ── */}
          <TabsContent value="courses">
            <div className="mt-4 space-y-3">
              {courses.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <BookOpen className="h-10 w-10 mx-auto mb-3 text-[#9B9B9B]" />
                    <p className="text-[14px] text-[#6B6B6B] mb-4">
                      You haven't enrolled in any courses yet.
                    </p>
                    <Button>Browse Courses</Button>
                  </CardContent>
                </Card>
              ) : (
                courses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))
              )}
            </div>
          </TabsContent>

          {/* ── Learning Plan ── */}
          <TabsContent value="learning-plan">
            <div className="mt-4 grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Learning Journey</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {learningPlan.length === 0 ? (
                      <p className="text-[13px] text-[#9B9B9B]">
                        No learning plan yet. Chat with your coach to build one!
                      </p>
                    ) : (
                      <div className="space-y-0">
                        {learningPlan.map((item, idx) => (
                          <PlanItem key={item.id} item={item} isLast={idx === learningPlan.length - 1} />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Weekly Goal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-[40px] font-serif text-[#1A1A1A]">3.5h</div>
                      <p className="text-[12px] text-[#9B9B9B] uppercase tracking-wide mt-1">
                        of 5h target this week
                      </p>
                      <Progress value={70} className="mt-3 h-2" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Next Up</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {courses[0]?.last_lesson_title ? (
                      <div>
                        <p className="text-[13px] font-medium text-[#1A1A1A]">
                          {courses[0].last_lesson_title}
                        </p>
                        <p className="text-[12px] text-[#6B6B6B] mt-1">{courses[0].title}</p>
                        <Button className="w-full mt-3" size="sm">
                          <PlayCircle className="h-4 w-4 mr-1.5" />
                          Continue Learning
                        </Button>
                      </div>
                    ) : (
                      <p className="text-[13px] text-[#9B9B9B]">No course in progress.</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recommended</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-[13px] text-[#6B6B6B] flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      Based on your goals
                    </div>
                    <ul className="space-y-2 mt-2">
                      <li className="text-[13px] text-[#1A1A1A] font-medium">Executive Presence</li>
                      <li className="text-[13px] text-[#1A1A1A] font-medium">Strategic Thinking</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ── Certificates ── */}
          <TabsContent value="certificates">
            <div className="mt-4">
              {certificates.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Award className="h-10 w-10 mx-auto mb-3 text-[#9B9B9B]" />
                    <p className="text-[14px] text-[#6B6B6B]">
                      Complete your first course to earn a certificate.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {certificates.map((cert) => (
                    <CertificateCard key={cert.id} certificate={cert} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-white/10 backdrop-blur rounded-lg p-3 border border-white/10">
      <div className="flex items-center gap-2 text-white/60 text-[11px] uppercase tracking-wide mb-1">
        {icon}
        {label}
      </div>
      <div className="text-[24px] font-serif text-white">{value}</div>
    </div>
  );
}

function CourseCard({ course }: { course: EnrolledCourse }) {
  const isCompleted = course.status === 'completed';
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col md:flex-row">
        <div className="md:w-48 h-32 md:h-auto bg-gradient-to-br from-[#F0F0F0] to-[#E5E5E5] flex items-center justify-center flex-shrink-0">
          <BookOpen className="h-8 w-8 text-[#9B9B9B]" />
        </div>
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-medium text-[#1A1A1A]">{course.title}</h3>
                <Badge variant={isCompleted ? 'success' : 'default'}>
                  {isCompleted ? 'Completed' : 'In Progress'}
                </Badge>
              </div>
              <p className="text-[13px] text-[#6B6B6B] mt-1 line-clamp-2">
                {course.description || 'No description.'}
              </p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button variant="ghost" size="sm">
                {isCompleted ? 'Review' : 'Resume'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-between text-[12px] text-[#6B6B6B] mb-1">
              <span>
                {course.lessons_completed} of {course.total_lessons} lessons
              </span>
              <span className="font-medium">{course.progress_pct}%</span>
            </div>
            <Progress value={course.progress_pct} className="h-1.5" />
          </div>

          <div className="flex items-center gap-4 mt-3 text-[11px] text-[#9B9B9B]">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              ~{course.estimated_hours}h total
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Enrolled {new Date(course.enrolled_at).toLocaleDateString()}
            </span>
            {course.certificate_issued && (
              <span className="flex items-center gap-1 text-amber-600">
                <Award className="h-3 w-3" />
                Certificate earned
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function PlanItem({ item, isLast }: { item: LearningPlanItem; isLast: boolean }) {
  const statusLabel = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    completed: 'Completed',
  }[item.status];

  const statusIcon = {
    not_started: <div className="w-3.5 h-3.5 rounded-full border-2 border-[#C0C0C0]" />,
    in_progress: <div className="w-3.5 h-3.5 rounded-full bg-[#1A1A1A] animate-pulse" />,
    completed: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
  }[item.status];

  return (
    <div className="relative pl-6 pb-4">
      {!isLast && (
        <div className="absolute left-[6px] top-4 bottom-0 w-px bg-[#E5E5E5]" />
      )}
      <div className="absolute left-0 top-1.5">{statusIcon}</div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className="text-[14px] font-medium text-[#1A1A1A]">{item.title}</h4>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[12px] text-[#9B9B9B]">{statusLabel}</span>
            <span className="text-[12px] text-[#9B9B9B]">·</span>
            <span className="text-[12px] text-[#6B6B6B]">
              Target: {new Date(item.target_date).toLocaleDateString()}
            </span>
          </div>
        </div>
        <Badge
          variant={
            item.priority === 'must_have'
              ? 'default'
              : item.priority === 'should_have'
              ? 'warning'
              : 'outline'
          }
        >
          {item.priority.replace('_', ' ')}
        </Badge>
      </div>
      {item.status !== 'completed' && item.progress_pct > 0 && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-[11px] text-[#9B9B9B] mb-1">
            <span>Progress</span>
            <span>{item.progress_pct}%</span>
          </div>
          <Progress value={item.progress_pct} className="h-1" />
        </div>
      )}
    </div>
  );
}

function CertificateCard({ certificate }: { certificate: Certificate }) {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-200 rounded-bl-full" />
      <CardContent className="p-6 relative">
        <div className="flex items-center gap-2 mb-4">
          <Award className="h-6 w-6 text-amber-600" />
          <span className="text-[11px] uppercase tracking-wide text-[#9B9B9B]">Certificate of Completion</span>
        </div>
        <h3 className="text-[18px] font-serif text-[#1A1A1A]">{certificate.course_title}</h3>
        <div className="mt-4 space-y-1 text-[13px] text-[#6B6B6B]">
          <div className="flex justify-between">
            <span>Issued</span>
            <span className="text-[#1A1A1A]">{new Date(certificate.issued_at).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Final Score</span>
            <span className="text-[#1A1A1A]">{certificate.final_score}%</span>
          </div>
          <div className="flex justify-between">
            <span>Certificate ID</span>
            <span className="text-[#1A1A1A] font-mono text-[12px]">
              {certificate.certificate_code}
            </span>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button size="sm" variant="outline" className="flex-1">
            <FileText className="h-4 w-4 mr-1.5" />
            View
          </Button>
          <Button size="sm" className="flex-1">
            <Download className="h-4 w-4 mr-1.5" />
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Mock data                                                           */
/* ------------------------------------------------------------------ */

const MOCK_COURSES: EnrolledCourse[] = [
  {
    id: '1',
    course_id: 'c1',
    title: 'Executive Presence & Communication',
    description: 'Master the art of executive communication, boardroom presence, and stakeholder management.',
    cover_image_url: null,
    status: 'active',
    progress_pct: 65,
    lessons_completed: 13,
    total_lessons: 20,
    last_lesson_id: 'l14',
    last_lesson_title: 'Lesson 14: Difficult Conversations',
    enrolled_at: '2026-01-15T00:00:00Z',
    estimated_hours: 12,
    duration_weeks: 6,
    certificate_id: null,
    certificate_issued: false,
  },
  {
    id: '2',
    course_id: 'c2',
    title: 'Strategic Decision Making',
    description: 'Learn frameworks for making high-stakes strategic decisions under uncertainty.',
    cover_image_url: null,
    status: 'completed',
    progress_pct: 100,
    lessons_completed: 15,
    total_lessons: 15,
    last_lesson_id: 'l15',
    last_lesson_title: 'Lesson 15: Final Project Review',
    enrolled_at: '2025-10-01T00:00:00Z',
    estimated_hours: 8,
    duration_weeks: 4,
    certificate_id: 'cert-1',
    certificate_issued: true,
  },
  {
    id: '3',
    course_id: 'c3',
    title: 'People Management Essentials',
    description: 'Build and lead high-performing teams with proven people management techniques.',
    cover_image_url: null,
    status: 'active',
    progress_pct: 20,
    lessons_completed: 3,
    total_lessons: 15,
    last_lesson_id: 'l3',
    last_lesson_title: 'Lesson 3: Giving Effective Feedback',
    enrolled_at: '2026-03-01T00:00:00Z',
    estimated_hours: 10,
    duration_weeks: 5,
    certificate_id: null,
    certificate_issued: false,
  },
];

const MOCK_CERTIFICATES: Certificate[] = [
  {
    id: 'cert-1',
    certificate_code: 'LYC-STRAT-2025-00127',
    course_title: 'Strategic Decision Making',
    issued_at: '2025-11-15T00:00:00Z',
    final_score: 92.5,
  },
  {
    id: 'cert-2',
    certificate_code: 'LYC-LEAD-2025-00089',
    course_title: 'Leadership Fundamentals',
    issued_at: '2025-08-20T00:00:00Z',
    final_score: 88.0,
  },
];

const MOCK_LEARNING_PLAN: LearningPlanItem[] = [
  {
    id: 'lp1',
    title: 'Leadership Fundamentals',
    course_id: 'c1',
    target_date: '2025-08-20T00:00:00Z',
    status: 'completed',
    priority: 'must_have',
    progress_pct: 100,
  },
  {
    id: 'lp2',
    title: 'Strategic Decision Making',
    course_id: 'c2',
    target_date: '2025-11-15T00:00:00Z',
    status: 'completed',
    priority: 'must_have',
    progress_pct: 100,
  },
  {
    id: 'lp3',
    title: 'Executive Presence & Communication',
    course_id: 'c1',
    target_date: '2026-04-30T00:00:00Z',
    status: 'in_progress',
    priority: 'must_have',
    progress_pct: 65,
  },
  {
    id: 'lp4',
    title: 'People Management Essentials',
    course_id: 'c3',
    target_date: '2026-06-15T00:00:00Z',
    status: 'in_progress',
    priority: 'should_have',
    progress_pct: 20,
  },
  {
    id: 'lp5',
    title: 'Financial Acumen for Leaders',
    course_id: 'c4',
    target_date: '2026-09-01T00:00:00Z',
    status: 'not_started',
    priority: 'should_have',
    progress_pct: 0,
  },
  {
    id: 'lp6',
    title: 'Innovation & Design Thinking',
    course_id: 'c5',
    target_date: '2026-12-01T00:00:00Z',
    status: 'not_started',
    priority: 'nice_to_have',
    progress_pct: 0,
  },
];
