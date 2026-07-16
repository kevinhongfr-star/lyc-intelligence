import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Play,
  Pause,
  FileText,
  Edit3,
  HelpCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
}

interface LessonSidebarItem {
  id: string;
  title: string;
  sort_order: number;
  completed: boolean;
}

interface LessonPlayerPageProps {
  courseTitle: string;
  lesson: Lesson;
  allLessons: LessonSidebarItem[];
  currentIndex: number;
  onBack: () => void;
  onLessonChange: (idx: number) => void;
  onComplete?: () => void;
}

type TabType = 'video' | 'reading' | 'exercise' | 'quiz';

export function LessonPlayerPage({
  courseTitle,
  lesson,
  allLessons,
  currentIndex,
  onBack,
  onLessonChange,
  onComplete,
}: LessonPlayerPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>('video');
  const [videoWatched, setVideoWatched] = useState(false);
  const [readingViewed, setReadingViewed] = useState(false);
  const [exerciseCompleted, setExerciseCompleted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [exerciseAnswers, setExerciseAnswers] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const readingRef = useRef<HTMLDivElement>(null);
  const autoSaveTimer = useRef<number | null>(null);

  const tabs: { key: TabType; label: string; icon: any; available: boolean }[] = [
    { key: 'video', label: 'Video', icon: Play, available: !!lesson.video_url },
    { key: 'reading', label: 'Reading', icon: FileText, available: !!lesson.reading_content },
    { key: 'exercise', label: 'Exercise', icon: Edit3, available: !!lesson.exercise_content },
    { key: 'quiz', label: 'Quiz', icon: HelpCircle, available: !!lesson.quiz_id },
  ];

  const availableTabs = tabs.filter(t => t.available);

  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.find(t => t.key === activeTab)) {
      setActiveTab(availableTabs[0].key);
    }
  }, [lesson.id]);

  useEffect(() => {
    loadProgress();
  }, [lesson.id]);

  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearInterval(autoSaveTimer.current);
    };
  }, []);

  const loadProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: enrollment } = await supabase
        .from('lms_enrollments')
        .select('id')
        .eq('course_id', lesson.course_id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!enrollment) return;

      const { data: progress } = await supabase
        .from('lms_lesson_progress')
        .select('*')
        .eq('enrollment_id', enrollment.id)
        .eq('lesson_id', lesson.id)
        .maybeSingle();

      if (progress) {
        setVideoWatched(progress.video_watched || false);
        setReadingViewed(progress.reading_viewed || false);
        setExerciseCompleted(progress.exercise_completed || false);
        setQuizCompleted(progress.quiz_attempted || false);
        setQuizScore(progress.quiz_score);
        if (progress.exercise_submission) {
          try {
            setExerciseAnswers(JSON.parse(progress.exercise_submission));
          } catch {}
        }
      }
    } catch (e) {
      console.error('Failed to load progress:', e);
    }
  };

  const saveProgress = useCallback(async (updates: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: enrollment } = await supabase
        .from('lms_enrollments')
        .select('id')
        .eq('course_id', lesson.course_id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!enrollment) return;

      await supabase
        .from('lms_lesson_progress')
        .upsert({
          enrollment_id: enrollment.id,
          lesson_id: lesson.id,
          ...updates,
        }, { onConflict: 'enrollment_id, lesson_id' });

      await supabase.rpc('update_course_progress', { p_enrollment_id: enrollment.id });
    } catch (e) {
      console.error('Failed to save progress:', e);
    }
  }, [lesson.course_id, lesson.id]);

  const handleVideoTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const percent = (video.currentTime / video.duration) * 100;
    if (percent >= 90 && !videoWatched) {
      setVideoWatched(true);
      saveProgress({ video_watched: true });
    }
  };

  const handleReadingScroll = () => {
    const el = readingRef.current;
    if (!el) return;
    const bottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 50;
    if (bottom && !readingViewed) {
      setReadingViewed(true);
      saveProgress({ reading_viewed: true });
    }
  };

  const handleExerciseChange = (fieldId: string, value: any) => {
    setExerciseAnswers(prev => {
      const next = { ...prev, [fieldId]: value };
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = window.setTimeout(() => {
        saveProgress({ exercise_submission: JSON.stringify(next) });
      }, 30000);
      return next;
    });
  };

  const markExerciseComplete = () => {
    setExerciseCompleted(true);
    saveProgress({
      exercise_completed: true,
      exercise_submission: JSON.stringify(exerciseAnswers),
    });
    checkLessonComplete();
  };

  const handleQuizSubmit = (score: number) => {
    setQuizScore(score);
    setQuizCompleted(true);
    saveProgress({
      quiz_attempted: true,
      quiz_score: score,
      quiz_attempts: 1,
    });
    checkLessonComplete();
  };

  const checkLessonComplete = () => {
    const videoDone = !lesson.video_url || videoWatched;
    const readingDone = !lesson.reading_content || readingViewed;
    const exerciseDone = !lesson.exercise_content || exerciseCompleted;
    const quizDone = !lesson.quiz_id || quizCompleted;

    if (videoDone && readingDone && exerciseDone && quizDone) {
      saveProgress({ completed_at: new Date().toISOString() });
      onComplete?.();
    }
  };

  const overallComplete = allLessons.filter(l => l.completed).length;
  const overallPercent = Math.round((overallComplete / allLessons.length) * 100);

  const exerciseData = lesson.exercise_content ? parseExerciseContent(lesson.exercise_content) : null;

  return (
    <div className="h-screen flex flex-col bg-[#FAFAFA]">
      <div className="bg-white border-b border-[#E5E5E5] px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-[#737373] hover:text-[#171717]"
          >
            <ArrowLeft className="w-4 h-4" />
            {courseTitle}
          </button>
        </div>
        <div className="text-sm text-[#737373]">
          Lesson {currentIndex + 1} of {allLessons.length}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-72 bg-white border-r border-[#E5E5E5] flex flex-col flex-shrink-0 overflow-hidden">
          <div className="p-4 border-b border-[#E5E5E5]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#737373] uppercase tracking-wide">
                Your Progress
              </span>
              <span className="text-sm font-bold text-[#171717]">{overallPercent}%</span>
            </div>
            <div className="h-1.5 bg-[#F0F0F0] overflow-hidden">
              <div
                className="h-full bg-[#16A34A] transition-all duration-500"
                style={{ width: `${overallPercent}%` }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {allLessons.map((l, idx) => (
              <div
                key={l.id}
                onClick={() => onLessonChange(idx)}
                className={`flex items-start gap-3 px-4 py-3 cursor-pointer border-b border-[#F5F5F5] transition-colors ${
                  idx === currentIndex
                    ? 'bg-[#EFF6FF] border-l-2 border-l-[#2563EB]'
                    : 'hover:bg-[#FAFAFA]'
                }`}
              >
                <div className={`w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  l.completed ? 'text-[#16A34A]' : 'text-[#D4D4D4]'
                }`}>
                  {l.completed ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <span className="text-xs font-medium">{idx + 1}</span>
                  )}
                </div>
                <span className={`text-sm ${idx === currentIndex ? 'font-medium text-[#171717]' : 'text-[#404040]'}`}>
                  {l.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {availableTabs.length > 1 && (
            <div className="bg-white border-b border-[#E5E5E5] px-6 flex-shrink-0">
              <div className="flex gap-6">
                {availableTabs.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.key;
                  const isDone =
                    (tab.key === 'video' && videoWatched) ||
                    (tab.key === 'reading' && readingViewed) ||
                    (tab.key === 'exercise' && exerciseCompleted) ||
                    (tab.key === 'quiz' && quizCompleted);
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
                        isActive
                          ? 'border-[#2563EB] text-[#2563EB]'
                          : 'border-transparent text-[#737373] hover:text-[#404040]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                      {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {activeTab === 'video' && lesson.video_url && (
              <div className="max-w-4xl mx-auto p-8">
                <div className="bg-black aspect-video flex items-center justify-center mb-6">
                  <video
                    ref={videoRef}
                    src={lesson.video_url}
                    controls
                    className="w-full h-full"
                    onTimeUpdate={handleVideoTimeUpdate}
                  />
                </div>
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-xl font-bold text-[#171717]">{lesson.title}</h1>
                  {lesson.duration_minutes && (
                    <span className="flex items-center gap-1 text-sm text-[#737373]">
                      <Clock className="w-4 h-4" />
                      {lesson.duration_minutes} min
                    </span>
                  )}
                </div>
                {!videoWatched && (
                  <button
                    onClick={() => {
                      setVideoWatched(true);
                      saveProgress({ video_watched: true });
                      checkLessonComplete();
                    }}
                    className="px-4 py-2 bg-[#171717] text-white text-sm hover:bg-[#404040]"
                  >
                    Mark as Watched
                  </button>
                )}
                {lesson.description && (
                  <p className="text-[#737373] mt-4">{lesson.description}</p>
                )}
              </div>
            )}

            {activeTab === 'reading' && lesson.reading_content && (
              <div
                ref={readingRef}
                onScroll={handleReadingScroll}
                className="max-w-3xl mx-auto p-8 overflow-y-auto h-full"
              >
                <h1 className="text-2xl font-bold text-[#171717] mb-6">{lesson.title}</h1>
                <div className="prose prose-lg max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {lesson.reading_content}
                  </ReactMarkdown>
                </div>
                <div className="mt-8 pt-6 border-t border-[#E5E5E5] flex justify-end">
                  <button
                    onClick={() => {
                      setReadingViewed(true);
                      saveProgress({ reading_viewed: true });
                      checkLessonComplete();
                    }}
                    className={`px-4 py-2 text-sm ${
                      readingViewed
                        ? 'bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]'
                        : 'bg-[#171717] text-white hover:bg-[#404040]'
                    }`}
                  >
                    {readingViewed ? '✓ Marked as Read' : 'Mark as Read'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'exercise' && exerciseData && (
              <div className="max-w-3xl mx-auto p-8">
                <h1 className="text-xl font-bold text-[#171717] mb-2">{lesson.title}</h1>
                <p className="text-[#737373] mb-6">
                  Complete the exercises below. Your answers are auto-saved every 30 seconds.
                </p>

                <div className="space-y-8">
                  {exerciseData.sections.map((section: any, sIdx: number) => (
                    <div key={sIdx} className="bg-white border border-[#E5E5E5] p-6">
                      <h3 className="font-semibold text-[#171717] mb-1">{section.title}</h3>
                      <p className="text-sm text-[#737373] mb-4">{section.instructions}</p>
                      <div className="space-y-5">
                        {section.fields.map((field: any) => (
                          <ExerciseField
                            key={field.id}
                            field={field}
                            value={exerciseAnswers[field.id]}
                            onChange={(v: any) => handleExerciseChange(field.id, v)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={markExerciseComplete}
                    disabled={exerciseCompleted}
                    className={`px-6 py-2.5 text-sm font-medium ${
                      exerciseCompleted
                        ? 'bg-[#F0FDF4] text-[#166534] cursor-default'
                        : 'bg-[#16A34A] text-white hover:bg-[#15803D]'
                    }`}
                  >
                    {exerciseCompleted ? '✓ Exercise Completed' : 'Mark Exercise Complete'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'quiz' && lesson.quiz_id && (
              <QuizTab
                quizId={lesson.quiz_id}
                completed={quizCompleted}
                score={quizScore}
                onSubmit={handleQuizSubmit}
              />
            )}
          </div>

          <div className="bg-white border-t border-[#E5E5E5] px-6 py-3 flex items-center justify-between flex-shrink-0">
            <button
              onClick={() => onLessonChange(currentIndex - 1)}
              disabled={currentIndex === 0}
              className={`flex items-center gap-2 px-4 py-2 text-sm ${
                currentIndex === 0
                  ? 'text-[#D4D4D4] cursor-not-allowed'
                  : 'text-[#404040] hover:bg-[#F5F5F5]'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <button
              onClick={() => onLessonChange(currentIndex + 1)}
              disabled={currentIndex === allLessons.length - 1}
              className={`flex items-center gap-2 px-4 py-2 text-sm ${
                currentIndex === allLessons.length - 1
                  ? 'text-[#D4D4D4] cursor-not-allowed'
                  : 'bg-[#171717] text-white hover:bg-[#404040]'
              }`}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExerciseField({ field, value, onChange }: any) {
  switch (field.type) {
    case 'text':
      return (
        <div>
          <label className="block text-sm font-medium text-[#404040] mb-1.5">{field.label}</label>
          <input
            type="text"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-[#E5E5E5] focus:outline-none focus:border-[#2563EB]"
            placeholder="Enter your answer..."
          />
        </div>
      );
    case 'textarea':
      return (
        <div>
          <label className="block text-sm font-medium text-[#404040] mb-1.5">{field.label}</label>
          <textarea
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 text-sm border border-[#E5E5E5] focus:outline-none focus:border-[#2563EB] resize-y"
            placeholder="Write your response..."
          />
        </div>
      );
    case 'rating':
      return (
        <div>
          <label className="block text-sm font-medium text-[#404040] mb-1.5">{field.label}</label>
          <div className="flex items-center gap-2">
            {Array.from({ length: (field.max || 5) - (field.min || 1) + 1 }, (_, i) => i + (field.min || 1)).map(n => (
              <button
                key={n}
                onClick={() => onChange(n)}
                className={`w-8 h-8 text-sm font-medium border transition-colors ${
                  value === n
                    ? 'bg-[#2563EB] text-white border-[#2563EB]'
                    : 'bg-white text-[#737373] border-[#E5E5E5] hover:border-[#D4D4D4]'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      );
    case 'checkbox':
      return (
        <div>
          <label className="block text-sm font-medium text-[#404040] mb-1.5">{field.label}</label>
          <div className="space-y-2">
            {(field.options || []).map((opt: string, i: number) => {
              const checked = Array.isArray(value) && value.includes(opt);
              return (
                <label key={i} className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={e => {
                      const arr = Array.isArray(value) ? [...value] : [];
                      if (e.target.checked) arr.push(opt);
                      else arr.splice(arr.indexOf(opt), 1);
                      onChange(arr);
                    }}
                    className="mt-1"
                  />
                  <span className="text-sm text-[#404040]">{opt}</span>
                </label>
              );
            })}
          </div>
        </div>
      );
    case 'radio':
      return (
        <div>
          <label className="block text-sm font-medium text-[#404040] mb-1.5">{field.label}</label>
          <div className="space-y-2">
            {(field.options || []).map((opt: string, i: number) => (
              <label key={i} className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={value === opt}
                  onChange={() => onChange(opt)}
                  className="mt-1"
                />
                <span className="text-sm text-[#404040]">{opt}</span>
              </label>
            ))}
          </div>
        </div>
      );
    case 'number':
      return (
        <div>
          <label className="block text-sm font-medium text-[#404040] mb-1.5">{field.label}</label>
          <input
            type="number"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            className="w-32 px-3 py-2 text-sm border border-[#E5E5E5] focus:outline-none focus:border-[#2563EB]"
          />
        </div>
      );
    default:
      return null;
  }
}

function parseExerciseContent(content: string) {
  try {
    return JSON.parse(content);
  } catch {
    return { sections: [] };
  }
}

function QuizTab({ quizId, completed, score, onSubmit }: {
  quizId: string;
  completed: boolean;
  score: number | null;
  onSubmit: (score: number) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [showResults, setShowResults] = useState(completed);

  useEffect(() => {
    loadQuiz();
  }, [quizId]);

  const loadQuiz = async () => {
    try {
      const { data, error } = await supabase
        .from('lms_quizzes')
        .select('questions')
        .eq('id', quizId)
        .maybeSingle();

      if (error) throw error;
      setQuestions(data?.questions || []);
    } catch (e) {
      console.error('Failed to load quiz:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    let correct = 0;
    questions.forEach(q => {
      if (q.type === 'multiple_choice' || q.type === 'true_false') {
        if (answers[q.id] === q.correct) correct++;
      } else if (q.type === 'multi_select') {
        const userAns = Array.isArray(answers[q.id]) ? [...answers[q.id]].sort().join(',') : '';
        const correctAns = Array.isArray(q.correct) ? [...q.correct].sort().join(',') : '';
        if (userAns === correctAns) correct++;
      }
    });
    const pct = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
    setShowResults(true);
    onSubmit(pct);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-[#A3A3A3] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-xl font-bold text-[#171717] mb-2">Lesson Quiz</h1>
      <p className="text-[#737373] mb-6">
        Test your understanding with this short quiz. {showResults && score !== null && `Your score: ${score}%`}
      </p>

      <div className="space-y-6">
        {questions.map((q, idx) => (
          <div key={q.id} className="bg-white border border-[#E5E5E5] p-6">
            <p className="font-medium text-[#171717] mb-4">
              {idx + 1}. {q.question}
            </p>
            {(q.type === 'multiple_choice' || q.type === 'true_false') && (
              <div className="space-y-2">
                {(q.options || []).map((opt: string, i: number) => {
                  const isSelected = answers[q.id] === i;
                  const isCorrect = showResults && i === q.correct;
                  const isWrong = showResults && isSelected && i !== q.correct;
                  return (
                    <label
                      key={i}
                      className={`flex items-start gap-3 p-3 border cursor-pointer transition-colors ${
                        isCorrect ? 'bg-[#F0FDF4] border-[#BBF7D0]' :
                        isWrong ? 'bg-[#FEF2F2] border-[#FECACA]' :
                        isSelected ? 'bg-[#EFF6FF] border-[#BFDBFE]' :
                        'bg-white border-[#E5E5E5] hover:border-[#D4D4D4]'
                      }`}
                    >
                      <input
                        type="radio"
                        checked={isSelected}
                        onChange={() => !showResults && setAnswers(prev => ({ ...prev, [q.id]: i }))}
                        disabled={showResults}
                        className="mt-0.5"
                      />
                      <span className="text-sm text-[#404040]">{opt}</span>
                    </label>
                  );
                })}
              </div>
            )}
            {q.type === 'multi_select' && (
              <div className="space-y-2">
                {(q.options || []).map((opt: string, i: number) => {
                  const selected = Array.isArray(answers[q.id]) && answers[q.id].includes(i);
                  return (
                    <label key={i} className="flex items-start gap-3 p-3 border border-[#E5E5E5] hover:border-[#D4D4D4] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => {
                          const arr = Array.isArray(answers[q.id]) ? [...answers[q.id]] : [];
                          if (selected) arr.splice(arr.indexOf(i), 1);
                          else arr.push(i);
                          setAnswers(prev => ({ ...prev, [q.id]: arr }));
                        }}
                        disabled={showResults}
                        className="mt-0.5"
                      />
                      <span className="text-sm text-[#404040]">{opt}</span>
                    </label>
                  );
                })}
              </div>
            )}
            {showResults && q.explanation && (
              <div className="mt-3 p-3 bg-[#F5F5F5] text-sm text-[#404040]">
                <span className="font-medium">Explanation:</span> {q.explanation}
              </div>
            )}
          </div>
        ))}
      </div>

      {!showResults && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSubmit}
            className="px-6 py-2.5 bg-[#16A34A] text-white text-sm font-medium hover:bg-[#15803D]"
          >
            Submit Quiz
          </button>
        </div>
      )}
    </div>
  );
}
