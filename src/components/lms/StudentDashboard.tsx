import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Clock,
  Award,
  ChevronRight,
  TrendingUp,
  Calendar,
  Loader2,
  Star,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface EnrolledCourse {
  id: string;
  title: string;
  slug: string;
  cover_image_url: string | null;
  enrollment_id: string;
  progress_percent: number;
  enrolled_at: string;
  last_accessed_at: string | null;
  completed: boolean;
}

interface StudentDashboardProps {
  onCourseClick?: (course: EnrolledCourse) => void;
  onCertificateClick?: (course: EnrolledCourse) => void;
}

export function StudentDashboard({ onCourseClick, onCertificateClick }: StudentDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'in-progress' | 'completed'>('all');
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    inProgress: 0,
    completed: 0,
    certificates: 0,
    totalHours: 0,
  });

  useEffect(() => {
    loadEnrollments();
  }, []);

  const loadEnrollments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: enrollments, error } = await supabase
        .from('lms_enrollments')
        .select(`
          id,
          progress_percent,
          enrolled_at,
          last_accessed_at,
          completed,
          course:lms_courses (
            id,
            title,
            slug,
            cover_image_url,
            estimated_hours
          )
        `)
        .eq('user_id', user.id)
        .order('enrolled_at', { ascending: false });

      if (error) throw error;

      const mapped = (enrollments || []).map((e: any) => ({
        id: e.course.id,
        title: e.course.title,
        slug: e.course.slug,
        cover_image_url: e.course.cover_image_url,
        enrollment_id: e.id,
        progress_percent: e.progress_percent || 0,
        enrolled_at: e.enrolled_at,
        last_accessed_at: e.last_accessed_at,
        completed: e.completed,
        estimated_hours: e.course.estimated_hours,
      }));

      setCourses(mapped);
      setStats({
        totalCourses: mapped.length,
        inProgress: mapped.filter(c => !c.completed).length,
        completed: mapped.filter(c => c.completed).length,
        certificates: mapped.filter(c => c.completed).length,
        totalHours: Math.round(mapped.reduce((sum: number, c: any) => sum + (c.estimated_hours || 0), 0)),
      });
    } catch (e) {
      console.error('Failed to load enrollments:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(c => {
    if (activeTab === 'in-progress') return !c.completed;
    if (activeTab === 'completed') return c.completed;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="ml-3 text-text-muted">Loading your courses...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="bg-white border-b border-[#E5E5E5]">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <h1 className="text-2xl font-bold text-[#171717] mb-1">My Learning</h1>
          <p className="text-[#737373]">Track your progress and continue your journey</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={BookOpen}
            label="Total Courses"
            value={stats.totalCourses}
            color="blue"
          />
          <StatCard
            icon={TrendingUp}
            label="In Progress"
            value={stats.inProgress}
            color="amber"
          />
          <StatCard
            icon={Award}
            label="Certificates"
            value={stats.certificates}
            color="green"
          />
          <StatCard
            icon={Clock}
            label="Hours Learning"
            value={stats.totalHours}
            suffix="h"
            color="purple"
          />
        </div>

        <div className="flex items-center gap-1 mb-6 border-b border-[#E5E5E5]">
          {(['all', 'in-progress', 'completed'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium capitalize border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-[#2563EB] text-[#2563EB]'
                  : 'border-transparent text-[#737373] hover:text-[#404040]'
              }`}
            >
              {tab === 'all' ? 'All Courses' : tab === 'in-progress' ? 'In Progress' : 'Completed'}
            </button>
          ))}
        </div>

        {filteredCourses.length === 0 ? (
          <div className="text-center py-16 bg-white border border-[#E5E5E5]">
            <BookOpen className="w-12 h-12 text-[#D4D4D4] mx-auto mb-3" />
            <p className="text-[#737373] mb-4">
              {activeTab === 'completed'
                ? 'No completed courses yet. Keep learning!'
                : activeTab === 'in-progress'
                ? 'No courses in progress. Browse the catalog to get started.'
                : 'No courses enrolled yet. Browse the catalog to start learning.'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map(course => (
              <EnrolledCourseCard
                key={course.id}
                course={course}
                onClick={() => onCourseClick?.(course)}
                onCertificateClick={() => onCertificateClick?.(course)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, suffix = '', color }: {
  icon: any;
  label: string;
  value: number;
  suffix?: string;
  color: 'blue' | 'amber' | 'green' | 'purple';
}) {
  const colors = {
    blue: 'bg-[#EFF6FF] text-[#1D4ED8]',
    amber: 'bg-[#FFFBEB] text-[#D97706]',
    green: 'bg-[#F0FDF4] text-[#15803D]',
    purple: 'bg-[#FAF5FF] text-[#7C3AED]',
  };

  return (
    <div className="bg-white border border-[#E5E5E5] p-5">
      <div className={`w-10 h-10 ${colors[color]} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-2xl font-bold text-[#171717]">
        {value}{suffix}
      </div>
      <div className="text-sm text-[#737373]">{label}</div>
    </div>
  );
}

function EnrolledCourseCard({ course, onClick, onCertificateClick }: {
  course: EnrolledCourse;
  onClick: () => void;
  onCertificateClick: () => void;
}) {
  const progress = course.progress_percent || 0;

  return (
    <div className="bg-white border border-[#E5E5E5] overflow-hidden hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all">
      <div
        onClick={onClick}
        className="aspect-video bg-gradient-to-br from-[#1e3a5f] to-[#2563EB] flex items-center justify-center cursor-pointer"
      >
        <BookOpen className="w-10 h-10 text-white/30" />
      </div>

      <div className="p-5">
        <h3
          onClick={onClick}
          className="font-semibold text-[#171717] mb-2 hover:text-[#2563EB] cursor-pointer transition-colors"
        >
          {course.title}
        </h3>

        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-[#737373] mb-1.5">
            <span>{Math.round(progress)}% complete</span>
            {course.completed && (
              <span className="text-[#15803D] font-medium">Completed</span>
            )}
          </div>
          <div className="h-2 bg-[#F0F0F0] overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                course.completed ? 'bg-[#16A34A]' : 'bg-[#2563EB]'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#A3A3A3] mb-4">
          <Calendar className="w-3 h-3" />
          Enrolled {new Date(course.enrolled_at).toLocaleDateString()}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClick}
            className="flex-1 py-2 bg-[#171717] text-white text-sm font-medium hover:bg-[#404040] transition-colors flex items-center justify-center gap-1"
          >
            {course.completed ? 'Review' : 'Continue'}
            <ChevronRight className="w-4 h-4" />
          </button>
          {course.completed && (
            <button
              onClick={onCertificateClick}
              className="px-3 py-2 bg-[#F0FDF4] text-[#15803D] text-sm font-medium hover:bg-[#DCFCE7] border border-[#BBF7D0] transition-colors"
              title="View Certificate"
            >
              <Award className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
