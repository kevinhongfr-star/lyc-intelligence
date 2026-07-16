import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Clock,
  Users,
  BookOpen,
  Play,
  FileText,
  CheckCircle2,
  Lock,
  Star,
  Award,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import ReactMarkdown from 'react-markdown';

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  long_description: string | null;
  status: string;
  price_cny: number;
  price_usd: number | null;
  team_price_cny: number | null;
  team_max_seats: number;
  duration_weeks: number | null;
  estimated_hours: number | null;
  companion_diagnostic: string | null;
  diagnostic_discount_pct: number;
  cover_image_url: string | null;
  avg_rating: number | null;
  review_count: number;
  published_at: string | null;
}

interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  sort_order: number;
  duration_minutes: number | null;
  status: string;
  has_video: boolean;
  has_reading: boolean;
  has_exercise: boolean;
  has_quiz: boolean;
}

interface CourseDetailPageProps {
  course: Course;
  onBack?: () => void;
  onEnroll?: (type: 'individual' | 'team') => void;
  onLessonClick?: (lesson: Lesson) => void;
  isEnrolled?: boolean;
}

export function CourseDetailPage({
  course,
  onBack,
  onEnroll,
  onLessonClick,
  isEnrolled = false,
}: CourseDetailPageProps) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollType, setEnrollType] = useState<'individual' | 'team'>('individual');
  const [teamEmails, setTeamEmails] = useState<string[]>(['', '', '', '', '']);
  const [discountCode, setDiscountCode] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadLessons();
    if (isEnrolled) loadProgress();
  }, [course.id, isEnrolled]);

  const loadLessons = async () => {
    try {
      const { data, error } = await supabase
        .from('lms_lessons')
        .select('*')
        .eq('course_id', course.id)
        .eq('status', 'published')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      
      const enriched = (data || []).map(l => ({
        ...l,
        has_video: !!l.video_url,
        has_reading: !!l.reading_content,
        has_exercise: !!l.exercise_content,
        has_quiz: !!l.quiz_id,
      }));
      setLessons(enriched);
    } catch (e) {
      console.error('Failed to load lessons:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: enrollments } = await supabase
        .from('lms_enrollments')
        .select('id, progress_percent')
        .eq('course_id', course.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (enrollments) {
        setProgress(enrollments.progress_percent || 0);
      }
    } catch (e) {
      console.error('Failed to load progress:', e);
    }
  };

  const totalMinutes = lessons.reduce((sum, l) => sum + (l.duration_minutes || 0), 0);
  const totalHours = Math.round(totalMinutes / 60);

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-[#E5E5E5]">
        <div className="max-w-5xl mx-auto px-6 py-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-[#737373] hover:text-[#171717] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Catalog
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <div className="mb-6">
              {course.companion_diagnostic && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F0F9FF] text-[#0369A1] text-xs font-medium mb-3">
                  <Award className="w-3.5 h-3.5" />
                  Includes {course.diagnostic_discount_pct}% off {course.companion_diagnostic} Diagnostic
                </span>
              )}
              <h1 className="text-3xl font-bold text-[#171717] mb-3">{course.title}</h1>
              <p className="text-[#737373] leading-relaxed">
                {course.description}
              </p>
            </div>

            <div className="flex items-center gap-6 text-sm text-[#737373] mb-8 pb-8 border-b border-[#E5E5E5]">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {course.duration_weeks ? `${course.duration_weeks} weeks` : 'Self-paced'}
              </div>
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                {lessons.length} lessons
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                {totalHours ? `${totalHours}h content` : 'Flexible'}
              </div>
              {course.avg_rating && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
                  <span className="font-medium text-[#171717]">{course.avg_rating}</span>
                  <span>({course.review_count} reviews)</span>
                </div>
              )}
            </div>

            {isEnrolled && progress > 0 && (
              <div className="mb-8 p-4 bg-[#F0FDF4] border border-[#BBF7D0]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[#166534]">Your Progress</span>
                  <span className="text-sm font-bold text-[#166534]">{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-[#BBF7D0] overflow-hidden">
                  <div
                    className="h-full bg-[#16A34A] transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="mb-8">
              <h2 className="text-lg font-bold text-[#171717] mb-4">Curriculum</h2>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-[#A3A3A3] animate-spin" />
                </div>
              ) : (
                <div className="space-y-2">
                  {lessons.map((lesson, idx) => {
                    const isLocked = !isEnrolled && idx > 0;
                    return (
                      <div
                        key={lesson.id}
                        onClick={() => !isLocked && onLessonClick?.(lesson)}
                        className={`flex items-center gap-4 p-4 border border-[#E5E5E5] ${
                          isLocked ? 'opacity-60' : 'cursor-pointer hover:border-[#D4D4D4] hover:bg-[#FAFAFA]'
                        } transition-colors`}
                      >
                        <div className="w-8 h-8 flex items-center justify-center bg-[#F5F5F5] text-sm font-bold text-[#737373] flex-shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-[#171717] truncate">{lesson.title}</h3>
                          <div className="flex items-center gap-3 mt-1 text-xs text-[#737373]">
                            {lesson.has_video && (
                              <span className="flex items-center gap-1">
                                <Play className="w-3 h-3" />
                                Video
                              </span>
                            )}
                            {lesson.has_reading && (
                              <span className="flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                Reading
                              </span>
                            )}
                            {lesson.has_quiz && (
                              <span className="flex items-center gap-1">
                                <Award className="w-3 h-3" />
                                Quiz
                              </span>
                            )}
                            {lesson.duration_minutes && (
                              <span>{lesson.duration_minutes} min</span>
                            )}
                          </div>
                        </div>
                        {isLocked ? (
                          <Lock className="w-4 h-4 text-[#A3A3A3] flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-[#A3A3A3] flex-shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {course.long_description && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-[#171717] mb-4">About This Course</h2>
                <div className="prose prose-sm max-w-none text-[#404040]">
                  <ReactMarkdown>{course.long_description}</ReactMarkdown>
                </div>
              </div>
            )}

            <div className="mb-8">
              <h2 className="text-lg font-bold text-[#171717] mb-4">Completion Outcomes</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <OutcomeItem text="Course completion certificate" />
                <OutcomeItem text={`${course.diagnostic_discount_pct}% off ${course.companion_diagnostic || 'companion'} diagnostic`} />
                <OutcomeItem text="Practical exercises & worksheets" />
                <OutcomeItem text="Lifetime access to course materials" />
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <div className="border border-[#E5E5E5] bg-white">
                <div className="p-6 border-b border-[#E5E5E5]">
                  <div className="text-xs text-[#737373] mb-1">Price</div>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-3xl font-bold text-[#171717]">¥{course.price_cny}</span>
                    <span className="text-sm text-[#737373]">individual</span>
                  </div>

                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setEnrollType('individual')}
                      className={`flex-1 py-2 text-sm font-medium border transition-colors ${
                        enrollType === 'individual'
                          ? 'bg-[#171717] text-white border-[#171717]'
                          : 'bg-white text-[#404040] border-[#E5E5E5] hover:border-[#D4D4D4]'
                      }`}
                    >
                      Individual
                    </button>
                    <button
                      onClick={() => setEnrollType('team')}
                      className={`flex-1 py-2 text-sm font-medium border transition-colors ${
                        enrollType === 'team'
                          ? 'bg-[#171717] text-white border-[#171717]'
                          : 'bg-white text-[#404040] border-[#E5E5E5] hover:border-[#D4D4D4]'
                      }`}
                    >
                      Team ({course.team_max_seats})
                    </button>
                  </div>

                  {enrollType === 'team' && course.team_price_cny && (
                    <div className="mb-4 p-3 bg-[#F5F5F5]">
                      <div className="text-sm font-bold text-[#171717] mb-2">
                        Team Price: ¥{course.team_price_cny}
                      </div>
                      <div className="space-y-2">
                        {teamEmails.map((email, i) => (
                          <input
                            key={i}
                            type="email"
                            placeholder={`Member ${i + 1} email`}
                            value={email}
                            onChange={e => {
                              const next = [...teamEmails];
                              next[i] = e.target.value;
                              setTeamEmails(next);
                            }}
                            className="w-full px-3 py-2 text-sm border border-[#E5E5E5] focus:outline-none focus:border-[#2563EB]"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="block text-xs text-[#737373] mb-1">Discount code</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter code"
                        value={discountCode}
                        onChange={e => setDiscountCode(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-[#E5E5E5] focus:outline-none focus:border-[#2563EB]"
                      />
                      <button className="px-3 py-2 text-sm text-[#2563EB] hover:bg-[#EFF6FF] border border-[#BFDBFE]">
                        Apply
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => onEnroll?.(enrollType)}
                    className="w-full py-3 bg-[#16A34A] text-white font-semibold hover:bg-[#15803D] transition-colors"
                  >
                    {isEnrolled ? 'Continue Learning' : enrollType === 'team' ? 'Enroll Team' : 'Enroll Now'}
                  </button>
                </div>

                <div className="p-4 text-xs text-[#737373] space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                    30-day money-back guarantee
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                    Lifetime access
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                    Certificate of completion
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OutcomeItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-[#FAFAFA]">
      <CheckCircle2 className="w-5 h-5 text-[#16A34A] flex-shrink-0 mt-0.5" />
      <span className="text-sm text-[#404040]">{text}</span>
    </div>
  );
}
