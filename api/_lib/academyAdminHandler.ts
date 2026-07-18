/**
 * Academy Admin handler — Course CMS, lesson builder, enrollment management
 * Issue #17: Academy Admin (uses lms_* tables from 20260717_lms_schema.sql)
 *
 * Routes:
 *   ── Courses ──
 *   GET    /api/academy/courses                    — List courses (filterable, paginated)
 *   POST   /api/academy/courses                    — Create course
 *   GET    /api/academy/courses/:id                — Get course with lessons + enrollment stats
 *   PUT    /api/academy/courses/:id                — Update course
 *   DELETE /api/academy/courses/:id                — Delete course (soft archive)
 *   PATCH  /api/academy/courses/:id/status         — Change status (draft/published/archived)
 *
 *   ── Lessons ──
 *   GET    /api/academy/courses/:id/lessons        — List lessons for course
 *   POST   /api/academy/courses/:id/lessons        — Create lesson
 *   PUT    /api/academy/lessons/:id                — Update lesson
 *   DELETE /api/academy/lessons/:id                — Delete lesson
 *   PATCH  /api/academy/lessons/:id/reorder        — Reorder lesson (sort_order)
 *   PATCH  /api/academy/lessons/:id/status         — Change lesson status
 *
 *   ── Quizzes ──
 *   GET    /api/academy/lessons/:id/quiz           — Get quiz for lesson
 *   PUT    /api/academy/lessons/:id/quiz           — Upsert quiz
 *
 *   ── Enrollments ──
 *   GET    /api/academy/enrollments                — List enrollments (filter by course/status/user)
 *   POST   /api/academy/enrollments                — Create enrollment
 *   GET    /api/academy/enrollments/:id            — Get enrollment with progress
 *   PATCH  /api/academy/enrollments/:id/status     — Update enrollment status
 *   DELETE /api/academy/enrollments/:id            — Cancel enrollment
 *
 *   ── Analytics ──
 *   GET    /api/academy/analytics/overview         — Course count, enrollment count, completion rate
 *   GET    /api/academy/analytics/course/:id       — Per-course analytics
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  selectOne,
  selectMany,
  insert,
  update,
  deleteRows,
  isSupabaseConfigured,
  handleError,
} from './supabaseRest.js';
import { getUserFromRequest } from './adminAuth.js';

export const maxDuration = 60;

const VALID_COURSE_STATUSES = ['draft', 'published', 'archived'];
const VALID_LESSON_STATUSES = ['draft', 'published', 'archived'];
const VALID_ENROLLMENT_STATUSES = ['active', 'completed', 'cancelled', 'expired'];
const VALID_ENROLLMENT_TYPES = ['individual', 'team'];

export const handler = handleAcademyAdmin;

async function handleAcademyAdmin(req: VercelRequest, res: VercelResponse) {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    const { user, error: authError } = await getUserFromRequest(req);
    if (authError || !user) {
      return res.status(401).json({ success: false, error: authError || 'Unauthorized' });
    }

    // Admin role check
    if (user.role && !['super_admin', 'admin', 'academy_admin', 'content_admin'].includes(user.role)) {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const path = (req.query as any).path || [];
    const resource = path[0];
    const id = path[1];
    const subResource = path[2];
    const subId = path[3];

    // ── Analytics routes (top-level) ──
    if (resource === 'analytics') {
      if (subResource === 'overview' && req.method === 'GET') return handleAnalyticsOverview(req, res);
      if (subResource === 'course' && subId && req.method === 'GET') return handleCourseAnalytics(req, res, subId);
      return res.status(404).json({ success: false, error: 'Unknown analytics route' });
    }

    // ── Enrollments (top-level) ──
    if (resource === 'enrollments') {
      if (!id && req.method === 'GET') return handleListEnrollments(req, res);
      if (!id && req.method === 'POST') return handleCreateEnrollment(req, res, user);
      if (id && !subResource && req.method === 'GET') return handleGetEnrollment(req, res, id);
      if (id && subResource === 'status' && req.method === 'PATCH') return handleUpdateEnrollmentStatus(req, res, id);
      if (id && !subResource && req.method === 'DELETE') return handleCancelEnrollment(req, res, id);
      return res.status(404).json({ success: false, error: 'Unknown enrollment route' });
    }

    // ── Lessons (top-level — for update/delete after creation) ──
    if (resource === 'lessons' && id) {
      if (req.method === 'PUT') return handleUpdateLesson(req, res, id);
      if (req.method === 'DELETE') return handleDeleteLesson(req, res, id);
      if (subResource === 'reorder' && req.method === 'PATCH') return handleReorderLesson(req, res, id);
      if (subResource === 'status' && req.method === 'PATCH') return handleLessonStatus(req, res, id);
      if (subResource === 'quiz' && req.method === 'GET') return handleGetQuiz(req, res, id);
      if (subResource === 'quiz' && req.method === 'PUT') return handleUpsertQuiz(req, res, id);
      return res.status(404).json({ success: false, error: 'Unknown lesson route' });
    }

    // ── Courses ──
    if (resource === 'courses') {
      if (!id && req.method === 'GET') return handleListCourses(req, res);
      if (!id && req.method === 'POST') return handleCreateCourse(req, res, user);
      if (id && !subResource && req.method === 'GET') return handleGetCourse(req, res, id);
      if (id && !subResource && req.method === 'PUT') return handleUpdateCourse(req, res, id);
      if (id && !subResource && req.method === 'DELETE') return handleDeleteCourse(req, res, id);
      if (id && subResource === 'status' && req.method === 'PATCH') return handleCourseStatus(req, res, id);
      if (id && subResource === 'lessons' && req.method === 'GET') return handleListLessons(req, res, id);
      if (id && subResource === 'lessons' && req.method === 'POST') return handleCreateLesson(req, res, id, user);
      return res.status(404).json({ success: false, error: 'Unknown course route' });
    }

    return res.status(404).json({ success: false, error: 'Unknown academy route' });
  } catch (err) {
    return handleError(res, 'academy', err);
  }
}

// ── Helpers ────────────────────────────────────────────────────────────

function parseBody(req: VercelRequest): any {
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return req.body || {};
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ── Courses ────────────────────────────────────────────────────────────

async function handleListCourses(req: VercelRequest, res: VercelResponse) {
  const { searchParams } = new URL(req.url || '', 'http://localhost');
  const status = searchParams.get('status');
  const search = searchParams.get('search');
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 200);
  const offset = parseInt(searchParams.get('offset') || '0');

  const where: any[] = [];
  if (status && VALID_COURSE_STATUSES.includes(status)) {
    where.push({ column: 'status', value: status });
  }
  if (search) {
    where.push({ column: 'title', value: `%${search}%`, op: 'ilike' });
  }

  const courses = await selectMany(
    'lms_courses',
    {
      select: 'id,title,slug,description,status,price_cny,price_usd,duration_weeks,estimated_hours,avg_rating,review_count,published_at,cover_image_url,created_at,updated_at',
      where: where.length > 0 ? where : undefined,
    },
    ['created_at DESC'],
    limit,
    offset,
    '*',
  );

  // Get enrollment counts per course in parallel-ish
  const courseIds = (courses || []).map((c: any) => c.id);
  let enrollmentCounts: Record<string, number> = {};
  if (courseIds.length > 0) {
    const enrollments = await selectMany(
      'lms_enrollments',
      {
        select: 'course_id',
        where: [{ column: 'course_id', value: `(${courseIds.join(',')})`, op: 'in' }],
      },
      [],
      10000,
      0,
      '*',
    );
    for (const e of enrollments || []) {
      enrollmentCounts[e.course_id] = (enrollmentCounts[e.course_id] || 0) + 1;
    }
  }

  const data = (courses || []).map((c: any) => ({
    ...c,
    enrollment_count: enrollmentCounts[c.id] || 0,
  }));

  return res.status(200).json({ success: true, data, total: data.length });
}

async function handleCreateCourse(req: VercelRequest, res: VercelResponse, user: any) {
  const body = parseBody(req);
  const {
    title, description, long_description, price_cny, price_usd,
    duration_weeks, estimated_hours, cover_image_url, status,
    companion_diagnostic, diagnostic_discount_pct, instructor_notes,
  } = body;

  if (!title) {
    return res.status(400).json({ success: false, error: 'title is required' });
  }

  // Generate unique slug
  const baseSlug = body.slug ? slugify(body.slug) : slugify(title);
  const slug = `${baseSlug}-${Date.now().toString(36)}`;

  const course = await insert('lms_courses', {
    title,
    slug,
    description: description || null,
    long_description: long_description || null,
    status: status && VALID_COURSE_STATUSES.includes(status) ? status : 'draft',
    price_cny: price_cny ?? 0,
    price_usd: price_usd ?? 0,
    duration_weeks: duration_weeks || null,
    estimated_hours: estimated_hours || null,
    cover_image_url: cover_image_url || null,
    companion_diagnostic: companion_diagnostic || null,
    diagnostic_discount_pct: diagnostic_discount_pct || 0,
    instructor_notes: instructor_notes || null,
    published_at: status === 'published' ? new Date().toISOString() : null,
  });

  return res.status(201).json({ success: true, data: course });
}

async function handleGetCourse(req: VercelRequest, res: VercelResponse, courseId: string) {
  const course = await selectOne('lms_courses', {
    select: '*',
    column: 'id',
    value: courseId,
  });

  if (!course) {
    return res.status(404).json({ success: false, error: 'Course not found' });
  }

  // Get lessons
  const lessons = await selectMany(
    'lms_lessons',
    {
      select: 'id,title,description,sort_order,duration_minutes,video_url,video_duration_seconds,reading_word_count,status,quiz_id,notion_page_id,instructor_notes,created_at,updated_at',
      where: [{ column: 'course_id', value: courseId }],
    },
    ['sort_order ASC'],
    200,
    0,
    '*',
  );

  // Get enrollment stats
  const enrollments = await selectMany(
    'lms_enrollments',
    {
      select: 'id,status,progress_percent,enrolled_at,completed_at',
      where: [{ column: 'course_id', value: courseId }],
    },
    [],
    10000,
    0,
    '*',
  );

  const enrollmentStats = {
    total: enrollments?.length || 0,
    active: (enrollments || []).filter((e: any) => e.status === 'active').length,
    completed: (enrollments || []).filter((e: any) => e.status === 'completed').length,
    cancelled: (enrollments || []).filter((e: any) => e.status === 'cancelled').length,
    avg_progress: enrollments?.length
      ? Math.round(
          enrollments.reduce((sum: number, e: any) => sum + Number(e.progress_percent || 0), 0) /
            enrollments.length,
        )
      : 0,
  };

  return res.status(200).json({
    success: true,
    data: {
      ...course,
      lessons: lessons || [],
      enrollment_stats: enrollmentStats,
    },
  });
}

async function handleUpdateCourse(req: VercelRequest, res: VercelResponse, courseId: string) {
  const existing = await selectOne('lms_courses', {
    select: 'id,status',
    column: 'id',
    value: courseId,
  });
  if (!existing) {
    return res.status(404).json({ success: false, error: 'Course not found' });
  }

  const body = parseBody(req);
  const updates: Record<string, any> = {};

  const allowedFields = [
    'title', 'description', 'long_description', 'price_cny', 'price_usd',
    'team_price_cny', 'team_price_usd', 'team_max_seats', 'duration_weeks',
    'estimated_hours', 'companion_diagnostic', 'diagnostic_discount_pct',
    'prerequisite_course_id', 'cover_image_url', 'notion_page_id', 'cd_reference',
    'instructor_notes',
  ];

  for (const field of allowedFields) {
    if (body[field] !== undefined) updates[field] = body[field];
  }

  // Handle status change with published_at
  if (body.status !== undefined) {
    if (!VALID_COURSE_STATUSES.includes(body.status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }
    updates.status = body.status;
    if (body.status === 'published' && !existing.published_at) {
      updates.published_at = new Date().toISOString();
    }
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ success: false, error: 'No valid fields to update' });
  }

  const updated = await update('lms_courses', courseId, updates);
  return res.status(200).json({ success: true, data: updated });
}

async function handleDeleteCourse(req: VercelRequest, res: VercelResponse, courseId: string) {
  // Soft-delete: archive the course
  const existing = await selectOne('lms_courses', {
    select: 'id',
    column: 'id',
    value: courseId,
  });
  if (!existing) {
    return res.status(404).json({ success: false, error: 'Course not found' });
  }

  await update('lms_courses', courseId, { status: 'archived' });
  return res.status(200).json({ success: true, message: 'Course archived' });
}

async function handleCourseStatus(req: VercelRequest, res: VercelResponse, courseId: string) {
  const body = parseBody(req);
  const { status } = body;
  if (!status || !VALID_COURSE_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status' });
  }

  const updates: Record<string, any> = { status };
  if (status === 'published') {
    const existing = await selectOne('lms_courses', {
      select: 'published_at',
      column: 'id',
      value: courseId,
    });
    if (existing && !existing.published_at) {
      updates.published_at = new Date().toISOString();
    }
  }

  const updated = await update('lms_courses', courseId, updates);
  return res.status(200).json({ success: true, data: updated });
}

// ── Lessons ────────────────────────────────────────────────────────────

async function handleListLessons(req: VercelRequest, res: VercelResponse, courseId: string) {
  const lessons = await selectMany(
    'lms_lessons',
    {
      select: '*',
      where: [{ column: 'course_id', value: courseId }],
    },
    ['sort_order ASC'],
    200,
    0,
    '*',
  );
  return res.status(200).json({ success: true, data: lessons || [] });
}

async function handleCreateLesson(
  req: VercelRequest,
  res: VercelResponse,
  courseId: string,
  user: any,
) {
  const body = parseBody(req);
  const {
    title, description, duration_minutes, video_url, video_duration_seconds,
    reading_content, exercise_content, status, instructor_notes, notion_page_id,
  } = body;

  if (!title) {
    return res.status(400).json({ success: false, error: 'title is required' });
  }

  // Determine next sort_order
  const existingLessons = await selectMany(
    'lms_lessons',
    {
      select: 'sort_order',
      where: [{ column: 'course_id', value: courseId }],
    },
    ['sort_order DESC'],
    1,
    0,
    '*',
  );
  const nextOrder = existingLessons?.length ? (existingLessons[0].sort_order || 0) + 10 : 0;

  const reading_word_count = reading_content
    ? reading_content.trim().split(/\s+/).length
    : null;

  const lesson = await insert('lms_lessons', {
    course_id: courseId,
    title,
    description: description || null,
    sort_order: body.sort_order ?? nextOrder,
    duration_minutes: duration_minutes || null,
    video_url: video_url || null,
    video_duration_seconds: video_duration_seconds || null,
    reading_content: reading_content || null,
    reading_word_count,
    exercise_content: exercise_content || null,
    status: status && VALID_LESSON_STATUSES.includes(status) ? status : 'draft',
    instructor_notes: instructor_notes || null,
    notion_page_id: notion_page_id || null,
  });

  return res.status(201).json({ success: true, data: lesson });
}

async function handleUpdateLesson(req: VercelRequest, res: VercelResponse, lessonId: string) {
  const existing = await selectOne('lms_lessons', {
    select: 'id,reading_content',
    column: 'id',
    value: lessonId,
  });
  if (!existing) {
    return res.status(404).json({ success: false, error: 'Lesson not found' });
  }

  const body = parseBody(req);
  const updates: Record<string, any> = {};

  const allowedFields = [
    'title', 'description', 'sort_order', 'duration_minutes', 'video_url',
    'video_duration_seconds', 'reading_content', 'exercise_content',
    'quiz_id', 'instructor_notes', 'notion_page_id',
  ];

  for (const field of allowedFields) {
    if (body[field] !== undefined) updates[field] = body[field];
  }

  if (body.reading_content !== undefined) {
    updates.reading_word_count = body.reading_content
      ? body.reading_content.trim().split(/\s+/).length
      : null;
  }

  if (body.status !== undefined) {
    if (!VALID_LESSON_STATUSES.includes(body.status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }
    updates.status = body.status;
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ success: false, error: 'No valid fields to update' });
  }

  const updated = await update('lms_lessons', lessonId, updates);
  return res.status(200).json({ success: true, data: updated });
}

async function handleDeleteLesson(req: VercelRequest, res: VercelResponse, lessonId: string) {
  const existing = await selectOne('lms_lessons', {
    select: 'id',
    column: 'id',
    value: lessonId,
  });
  if (!existing) {
    return res.status(404).json({ success: false, error: 'Lesson not found' });
  }

  await deleteRows('lms_lessons', lessonId);
  return res.status(200).json({ success: true, message: 'Lesson deleted' });
}

async function handleReorderLesson(req: VercelRequest, res: VercelResponse, lessonId: string) {
  const body = parseBody(req);
  const { sort_order } = body;
  if (typeof sort_order !== 'number') {
    return res.status(400).json({ success: false, error: 'sort_order (number) required' });
  }

  const updated = await update('lms_lessons', lessonId, { sort_order });
  return res.status(200).json({ success: true, data: updated });
}

async function handleLessonStatus(req: VercelRequest, res: VercelResponse, lessonId: string) {
  const body = parseBody(req);
  const { status } = body;
  if (!status || !VALID_LESSON_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status' });
  }

  const updated = await update('lms_lessons', lessonId, { status });
  return res.status(200).json({ success: true, data: updated });
}

// ── Quizzes ────────────────────────────────────────────────────────────

async function handleGetQuiz(req: VercelRequest, res: VercelResponse, lessonId: string) {
  const quiz = await selectOne('lms_quizzes', {
    select: '*',
    column: 'lesson_id',
    value: lessonId,
  });
  return res.status(200).json({ success: true, data: quiz || null });
}

async function handleUpsertQuiz(req: VercelRequest, res: VercelResponse, lessonId: string) {
  const body = parseBody(req);
  const { title, passing_score, max_attempts, questions, answer_key } = body;

  if (!Array.isArray(questions)) {
    return res.status(400).json({ success: false, error: 'questions array required' });
  }

  const existing = await selectOne('lms_quizzes', {
    select: 'id',
    column: 'lesson_id',
    value: lessonId,
  });

  if (existing) {
    const updated = await update('lms_quizzes', existing.id, {
      title: title || existing.title,
      passing_score: passing_score ?? existing.passing_score,
      max_attempts: max_attempts ?? existing.max_attempts,
      questions,
      answer_key: answer_key || {},
    });
    return res.status(200).json({ success: true, data: updated });
  }

  const created = await insert('lms_quizzes', {
    lesson_id: lessonId,
    title: title || 'Lesson Quiz',
    passing_score: passing_score ?? 70,
    max_attempts: max_attempts ?? 3,
    questions,
    answer_key: answer_key || {},
  });

  // Link quiz to lesson
  await update('lms_lessons', lessonId, { quiz_id: created.id });

  return res.status(201).json({ success: true, data: created });
}

// ── Enrollments ────────────────────────────────────────────────────────

async function handleListEnrollments(req: VercelRequest, res: VercelResponse) {
  const { searchParams } = new URL(req.url || '', 'http://localhost');
  const course_id = searchParams.get('course_id');
  const status = searchParams.get('status');
  const user_id = searchParams.get('user_id');
  const enrollment_type = searchParams.get('enrollment_type');
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 200);
  const offset = parseInt(searchParams.get('offset') || '0');

  const where: any[] = [];
  if (course_id) where.push({ column: 'course_id', value: course_id });
  if (status && VALID_ENROLLMENT_STATUSES.includes(status)) {
    where.push({ column: 'status', value: status });
  }
  if (user_id) where.push({ column: 'user_id', value: user_id });
  if (enrollment_type && VALID_ENROLLMENT_TYPES.includes(enrollment_type)) {
    where.push({ column: 'enrollment_type', value: enrollment_type });
  }

  const enrollments = await selectMany(
    'lms_enrollments',
    {
      select: 'id,course_id,contact_id,user_id,enrollment_type,team_id,status,enrolled_at,completed_at,progress_percent,certificate_id,last_lesson_id,created_at,updated_at',
      where: where.length > 0 ? where : undefined,
    },
    ['enrolled_at DESC'],
    limit,
    offset,
    '*',
  );

  // Hydrate course + contact names
  const courseIds = [...new Set((enrollments || []).map((e: any) => e.course_id).filter(Boolean))];
  const contactIds = [...new Set((enrollments || []).map((e: any) => e.contact_id).filter(Boolean))];

  const [courses, contacts] = await Promise.all([
    courseIds.length
      ? selectMany('lms_courses', {
          select: 'id,title,slug',
          where: [{ column: 'id', value: `(${courseIds.join(',')})`, op: 'in' }],
        }, [], 500, 0, '*')
      : Promise.resolve([]),
    contactIds.length
      ? selectMany('contacts', {
          select: 'id,name,email',
          where: [{ column: 'id', value: `(${contactIds.join(',')})`, op: 'in' }],
        }, [], 1000, 0, '*')
      : Promise.resolve([]),
  ]);

  const courseMap = new Map((courses || []).map((c: any) => [c.id, c]));
  const contactMap = new Map((contacts || []).map((c: any) => [c.id, c]));

  const data = (enrollments || []).map((e: any) => ({
    ...e,
    course: courseMap.get(e.course_id) || null,
    contact: contactMap.get(e.contact_id) || null,
  }));

  return res.status(200).json({ success: true, data, total: data.length });
}

async function handleCreateEnrollment(req: VercelRequest, res: VercelResponse, user: any) {
  const body = parseBody(req);
  const { course_id, contact_id, user_id, enrollment_type, team_id, discount_code_id, payment_id } = body;

  if (!course_id || !contact_id) {
    return res.status(400).json({ success: false, error: 'course_id and contact_id required' });
  }

  // Verify course exists
  const course = await selectOne('lms_courses', {
    select: 'id',
    column: 'id',
    value: course_id,
  });
  if (!course) {
    return res.status(404).json({ success: false, error: 'Course not found' });
  }

  // Check for existing active enrollment
  const existing = await selectOne('lms_enrollments', {
    select: 'id,status',
    column: 'course_id',
    value: course_id,
    where: [
      { column: 'contact_id', value: contact_id },
      { column: 'status', value: 'active' },
    ],
  });
  if (existing) {
    return res.status(409).json({ success: false, error: 'Active enrollment already exists' });
  }

  const enrollment = await insert('lms_enrollments', {
    course_id,
    contact_id,
    user_id: user_id || null,
    enrollment_type: enrollment_type && VALID_ENROLLMENT_TYPES.includes(enrollment_type)
      ? enrollment_type
      : 'individual',
    team_id: team_id || null,
    status: 'active',
    discount_code_id: discount_code_id || null,
    payment_id: payment_id || null,
    progress_percent: 0,
  });

  return res.status(201).json({ success: true, data: enrollment });
}

async function handleGetEnrollment(req: VercelRequest, res: VercelResponse, enrollmentId: string) {
  const enrollment = await selectOne('lms_enrollments', {
    select: '*',
    column: 'id',
    value: enrollmentId,
  });
  if (!enrollment) {
    return res.status(404).json({ success: false, error: 'Enrollment not found' });
  }

  const progress = await selectMany(
    'lms_lesson_progress',
    {
      select: 'id,lesson_id,video_watched,video_last_position_seconds,reading_viewed,exercise_completed,quiz_attempted,quiz_score,quiz_attempts,completed_at,updated_at',
      where: [{ column: 'enrollment_id', value: enrollmentId }],
    },
    ['updated_at DESC'],
    200,
    0,
    '*',
  );

  return res.status(200).json({
    success: true,
    data: { ...enrollment, progress_entries: progress || [] },
  });
}

async function handleUpdateEnrollmentStatus(
  req: VercelRequest,
  res: VercelResponse,
  enrollmentId: string,
) {
  const body = parseBody(req);
  const { status } = body;
  if (!status || !VALID_ENROLLMENT_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status' });
  }

  const updates: Record<string, any> = { status };
  if (status === 'completed') {
    updates.completed_at = new Date().toISOString();
    updates.progress_percent = 100;
  }

  const updated = await update('lms_enrollments', enrollmentId, updates);
  return res.status(200).json({ success: true, data: updated });
}

async function handleCancelEnrollment(req: VercelRequest, res: VercelResponse, enrollmentId: string) {
  const existing = await selectOne('lms_enrollments', {
    select: 'id,status',
    column: 'id',
    value: enrollmentId,
  });
  if (!existing) {
    return res.status(404).json({ success: false, error: 'Enrollment not found' });
  }

  const updated = await update('lms_enrollments', enrollmentId, {
    status: 'cancelled',
  });
  return res.status(200).json({ success: true, data: updated });
}

// ── Analytics ──────────────────────────────────────────────────────────

async function handleAnalyticsOverview(req: VercelRequest, res: VercelResponse) {
  const [courses, enrollments, completed] = await Promise.all([
    selectMany('lms_courses', {
      select: 'id,status',
    }, [], 10000, 0, '*'),
    selectMany('lms_enrollments', {
      select: 'id,status,enrolled_at',
    }, [], 10000, 0, '*'),
    selectMany('lms_enrollments', {
      select: 'id',
      where: [{ column: 'status', value: 'completed' }],
    }, [], 10000, 0, '*'),
  ]);

  // Last 30 day enrollments
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentEnrollments = (enrollments || []).filter(
    (e: any) => new Date(e.enrolled_at) >= thirtyDaysAgo,
  ).length;

  return res.status(200).json({
    success: true,
    data: {
      total_courses: courses?.length || 0,
      published_courses: (courses || []).filter((c: any) => c.status === 'published').length,
      draft_courses: (courses || []).filter((c: any) => c.status === 'draft').length,
      archived_courses: (courses || []).filter((c: any) => c.status === 'archived').length,
      total_enrollments: enrollments?.length || 0,
      active_enrollments: (enrollments || []).filter((e: any) => e.status === 'active').length,
      completed_enrollments: completed?.length || 0,
      recent_enrollments_30d: recentEnrollments,
      completion_rate:
        enrollments?.length > 0
          ? Math.round(((completed?.length || 0) / enrollments.length) * 100)
          : 0,
    },
  });
}

async function handleCourseAnalytics(req: VercelRequest, res: VercelResponse, courseId: string) {
  const course = await selectOne('lms_courses', {
    select: 'id,title,avg_rating,review_count,published_at',
    column: 'id',
    value: courseId,
  });
  if (!course) {
    return res.status(404).json({ success: false, error: 'Course not found' });
  }

  const [lessons, enrollments, reviews] = await Promise.all([
    selectMany('lms_lessons', {
      select: 'id,status,sort_order',
      where: [{ column: 'course_id', value: courseId }],
    }, ['sort_order ASC'], 200, 0, '*'),
    selectMany('lms_enrollments', {
      select: 'id,status,progress_percent,enrolled_at,completed_at',
      where: [{ column: 'course_id', value: courseId }],
    }, [], 10000, 0, '*'),
    selectMany('lms_reviews', {
      select: 'id,rating,review_text,created_at',
      where: [{ column: 'course_id', value: courseId }],
    }, ['created_at DESC'], 100, 0, '*'),
  ]);

  const enrollmentList = enrollments || [];
  const completedCount = enrollmentList.filter((e: any) => e.status === 'completed').length;
  const activeCount = enrollmentList.filter((e: any) => e.status === 'active').length;
  const avgProgress = enrollmentList.length
    ? Math.round(
        enrollmentList.reduce((sum: number, e: any) => sum + Number(e.progress_percent || 0), 0) /
          enrollmentList.length,
      )
    : 0;

  // Progress distribution buckets
  const buckets = { '0-25%': 0, '26-50%': 0, '51-75%': 0, '76-99%': 0, '100%': 0 };
  for (const e of enrollmentList) {
    const p = Number(e.progress_percent || 0);
    if (p >= 100) buckets['100%']++;
    else if (p >= 76) buckets['76-99%']++;
    else if (p >= 51) buckets['51-75%']++;
    else if (p >= 26) buckets['26-50%']++;
    else buckets['0-25%']++;
  }

  // Rating distribution
  const ratingDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of reviews || []) {
    if (r.rating >= 1 && r.rating <= 5) ratingDist[r.rating as 1 | 2 | 3 | 4 | 5]++;
  }

  return res.status(200).json({
    success: true,
    data: {
      course,
      lessons_total: lessons?.length || 0,
      lessons_published: (lessons || []).filter((l: any) => l.status === 'published').length,
      enrollments_total: enrollmentList.length,
      enrollments_active: activeCount,
      enrollments_completed: completedCount,
      enrollments_cancelled: enrollmentList.filter((e: any) => e.status === 'cancelled').length,
      avg_progress: avgProgress,
      completion_rate:
        enrollmentList.length > 0
          ? Math.round((completedCount / enrollmentList.length) * 100)
          : 0,
      progress_distribution: buckets,
      reviews_total: reviews?.length || 0,
      rating_distribution: ratingDist,
    },
  });
}
