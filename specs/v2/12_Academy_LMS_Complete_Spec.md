# 12 — Academy / LMS Complete Spec

**Version:** 1.0 | **Phase:** 4 | **Author:** NEXUS | **Status:** Ready for Implementation  
**Depends on:** Phase 1 (Foundation), Phase 2.5 (SHIFT diagnostics)

---

## 1. Overview

Complete Academy/LMS system: course content management, student enrollment, progress tracking, community forum, and certification. Code already partially exists (Course Catalog, Course Detail, Lesson Player, Student Dashboard pages).

---

## 2. Database Schema

### 2.1 v2_courses
```sql
CREATE TABLE v2_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    title_zh VARCHAR(200),
    slug VARCHAR(200) UNIQUE NOT NULL,
    description TEXT,
    description_zh TEXT,
    course_type VARCHAR(30) NOT NULL,  -- self_paced, cohort_based, hybrid
    difficulty VARCHAR(20) DEFAULT 'intermediate',  -- beginner, intermediate, advanced
    thumbnail_url TEXT,
    trailer_url TEXT,
    duration_hours DECIMAL(5,1),
    is_published BOOLEAN DEFAULT false,
    requires_enrollment BOOLEAN DEFAULT true,
    credits_value DECIMAL(3,1) DEFAULT 0,  -- CPD credits
    organization_id UUID REFERENCES v2_organizations(id),
    created_by UUID REFERENCES v2_user_profiles(id),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.2 v2_course_modules
```sql
CREATE TABLE v2_course_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES v2_courses(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    display_order INTEGER NOT NULL,
    is_free_preview BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.3 v2_lessons
```sql
CREATE TABLE v2_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID REFERENCES v2_course_modules(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    lesson_type VARCHAR(20) NOT NULL,  -- video, text, quiz, assignment, discussion
    content TEXT,  -- Markdown or JSON for structured content
    video_url TEXT,
    video_duration_seconds INTEGER,
    display_order INTEGER NOT NULL,
    is_required BOOLEAN DEFAULT true,
    points_value INTEGER DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.4 v2_enrollments
```sql
CREATE TABLE v2_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES v2_user_profiles(id),
    course_id UUID REFERENCES v2_courses(id),
    status VARCHAR(20) DEFAULT 'active',  -- active, completed, dropped, expired
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    progress_percent DECIMAL(5,2) DEFAULT 0,
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    certificate_id VARCHAR(50),
    UNIQUE(user_id, course_id)
);
```

### 2.5 v2_lesson_progress
```sql
CREATE TABLE v2_lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID REFERENCES v2_enrollments(id),
    lesson_id UUID REFERENCES v2_lessons(id),
    status VARCHAR(20) DEFAULT 'not_started',  -- not_started, in_progress, completed
    time_spent_seconds INTEGER DEFAULT 0,
    video_position_seconds INTEGER,
    score DECIMAL(5,2),  -- For quizzes/assignments
    completed_at TIMESTAMPTZ,
    UNIQUE(enrollment_id, lesson_id)
);
```

### 2.6 v2_certificates
```sql
CREATE TABLE v2_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_id VARCHAR(50) UNIQUE NOT NULL,
    enrollment_id UUID REFERENCES v2_enrollments(id),
    user_id UUID REFERENCES v2_user_profiles(id),
    course_id UUID REFERENCES v2_courses(id),
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    pdf_url TEXT,
    verification_url TEXT
);
```

### 2.7 v2_community_threads
```sql
CREATE TABLE v2_community_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES v2_courses(id),
    author_id UUID REFERENCES v2_user_profiles(id),
    title VARCHAR(300) NOT NULL,
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    reply_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.8 v2_community_replies
```sql
CREATE TABLE v2_community_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID REFERENCES v2_community_threads(id) ON DELETE CASCADE,
    author_id UUID REFERENCES v2_user_profiles(id),
    content TEXT NOT NULL,
    parent_reply_id UUID REFERENCES v2_community_replies(id),  -- For nested replies
    is_edited BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.9 v2_development_plans
```sql
CREATE TABLE v2_development_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES v2_user_profiles(id),
    title VARCHAR(200) NOT NULL,
    shift_assessment_id UUID REFERENCES v2_shift_assessments(id),
    goals JSONB NOT NULL,  -- [{area, target_score, deadline, status}]
    recommended_courses JSONB,  -- [course_ids based on SHIFT results]
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. Admin Course Management

### 3.1 Course Creator
- Rich text editor for lesson content
- Video upload (or URL embed — YouTube, Vimeo, Supabase Storage)
- Module ordering (drag & drop)
- Quiz builder: multiple choice, true/false, short answer
- Course settings: visibility, enrollment requirements, pricing (free/credits/paid)

### 3.2 Course Dashboard (Admin)
- Enrollment count, completion rate, average progress
- Student activity feed
- Revenue/attribution (if paid)
- Export student list

---

## 4. Student Experience

### 4.1 Student Dashboard (6 Sections)
1. **Welcome:** Personalized greeting, learning streak, next lesson
2. **Diagnostics:** SHIFT assessment status, latest scores, development areas
3. **Courses:** Enrolled courses with progress bars, recommended courses
4. **Development Plan:** Goals from SHIFT assessment, linked courses
5. **Community:** Recent threads, unread notifications
6. **Recommendations:** AI-curated based on SHIFT data + learning history

### 4.2 Lesson Player
- Video player with progress tracking (resume from last position)
- Text content with markdown rendering
- Quiz interface with instant feedback
- Assignment upload
- "Mark as complete" button
- Previous/Next navigation

### 4.3 Progress Tracking
- Per-lesson: not_started → in_progress → completed
- Per-module: % of lessons completed
- Per-course: overall progress %, estimated time remaining
- Certificate auto-issued on 100% completion

---

## 5. Community Forum

### 5.1 Thread Types
- Course-specific discussion (linked to course)
- General discussion (platform-wide)
- Q&A (with upvoting)

### 5.2 Moderation
- Admin/consultant can pin, lock, delete threads
- Report inappropriate content
- Basic profanity filter

---

## 6. Certification

### 6.1 Auto-Certificate
- Generated when course progress reaches 100%
- PDF with: student name, course title, completion date, certificate ID, verification URL
- Stored in v2_certificates
- Displayable on student profile

### 6.2 CPD Credits
- Courses can assign credit values
- Total credits shown on student dashboard
- Exportable transcript

---

## 7. Integration Points

- **SHIFT Data → Development Plan:** Assessment results auto-populate recommended courses
- **Intelligence Layer:** Course content tagged with competency areas that map to SHIFT dimensions
- **Council Portal:** Members get access to premium courses

---

## 8. Exit Criteria
- [ ] Admin can create/manage courses with modules and lessons
- [ ] Students can enroll, progress through lessons, complete courses
- [ ] Student dashboard shows all 6 sections with data
- [ ] Community forum: create threads, reply, moderate
- [ ] Certificate auto-issued on completion
- [ ] Development plan linked to SHIFT assessment data
