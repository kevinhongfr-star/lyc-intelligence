
import { supabase } from '../lib/supabase';

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  long_description: string | null;
  status: string;
  price_cny: number;
  price_usd: number | null;
  team_price_cny: number | null;
  team_price_usd: number | null;
  team_max_seats: number;
  duration_weeks: number | null;
  estimated_hours: number | null;
  companion_diagnostic: string | null;
  diagnostic_discount_pct: number;
  prerequisite_course_id: string | null;
  cover_image_url: string | null;
  notion_page_id: string | null;
  instructor_notes: string | null;
  avg_rating: number | null;
  review_count: number;
  published_at: string | null;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  sort_order: number;
  duration_minutes: number | null;
  status: string;
  video_url: string | null;
  video_duration_seconds: number | null;
  reading_content: string | null;
  reading_word_count: number | null;
  exercise_content: string | null;
  quiz_id: string | null;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrollment_type: 'individual' | 'team';
  status: string;
  progress_percent: number;
  enrolled_at: string;
  completed_at: string | null;
  last_accessed_at: string | null;
}

export interface LessonProgress {
  id: string;
  enrollment_id: string;
  lesson_id: string;
  video_watched: boolean;
  reading_viewed: boolean;
  exercise_completed: boolean;
  quiz_attempted: boolean;
  quiz_score: number | null;
  completed: boolean;
  completed_at: string | null;
}

export async function getPublishedCourses(): Promise<Course[]> {
  const { data, error } = await supabase
    .from('lms_courses')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  const { data, error } = await supabase
    .from('lms_courses')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getCourseLessons(courseId: string): Promise<Lesson[]> {
  const { data, error } = await supabase
    .from('lms_lessons')
    .select('*')
    .eq('course_id', courseId)
    .eq('status', 'published')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getUserEnrollments(): Promise<Enrollment[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('lms_enrollments')
    .select('*')
    .eq('user_id', user.id)
    .order('enrolled_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getEnrollment(courseId: string): Promise<Enrollment | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('lms_enrollments')
    .select('*')
    .eq('course_id', courseId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getLessonProgress(enrollmentId: string, lessonId: string): Promise<LessonProgress | null> {
  const { data, error } = await supabase
    .from('lms_lesson_progress')
    .select('*')
    .eq('enrollment_id', enrollmentId)
    .eq('lesson_id', lessonId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getAllLessonProgress(enrollmentId: string): Promise<LessonProgress[]> {
  const { data, error } = await supabase
    .from('lms_lesson_progress')
    .select('*')
    .eq('enrollment_id', enrollmentId);

  if (error) throw error;
  return data || [];
}

export async function updateLessonProgress(
  enrollmentId: string,
  lessonId: string,
  updates: Partial<LessonProgress>
): Promise<LessonProgress> {
  const { data, error } = await supabase
    .from('lms_lesson_progress')
    .upsert(
      { enrollment_id: enrollmentId, lesson_id: lessonId, ...updates },
      { onConflict: 'enrollment_id, lesson_id' }
    )
    .select()
    .single();

  if (error) throw error;

  await supabase.rpc('update_course_progress', { p_enrollment_id: enrollmentId });

  return data;
}

export interface CourseCheckoutInput {
  courseId: string;
  enrollmentType: 'individual' | 'team';
  teamEmails?: string[];
  discountCode?: string;
  successUrl: string;
  cancelUrl: string;
}

export async function createCourseCheckout(input: CourseCheckoutInput): Promise<{ checkoutUrl: string } | null> {
  try {
    const res = await fetch('/api/stripe/checkout-course', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error('Error creating course checkout:', e);
    return null;
  }
}

export async function getCertificate(enrollmentId: string): Promise<any | null> {
  const { data, error } = await supabase
    .from('lms_certificates')
    .select('*')
    .eq('enrollment_id', enrollmentId)
    .maybeSingle();

  if (error) throw error;
  return data;
}
