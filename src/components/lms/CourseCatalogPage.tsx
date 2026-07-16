import React, { useState, useEffect } from 'react';
import {
  Clock,
  Users,
  BookOpen,
  Star,
  ChevronRight,
  Search,
  Loader2,
  Award,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
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

interface CourseCatalogPageProps {
  onCourseClick?: (course: Course) => void;
}

const CATEGORY_FILTERS = ['All', 'Governance', 'Cross-Border', 'Career', 'AI Leadership'];

export function CourseCatalogPage({ onCourseClick }: CourseCatalogPageProps) {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState('popular');

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('lms_courses')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (e) {
      console.error('Failed to load courses:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    if (searchQuery && !course.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (categoryFilter !== 'All') {
      if (!course.title.toLowerCase().includes(categoryFilter.toLowerCase())) {
        return false;
      }
    }
    return true;
  });

  const sortedCourses = [...filteredCourses].sort((a, b) => {
    switch (sortBy) {
      case 'price-low': return (a.price_cny || 0) - (b.price_cny || 0);
      case 'price-high': return (b.price_cny || 0) - (a.price_cny || 0);
      case 'rating': return (b.avg_rating || 0) - (a.avg_rating || 0);
      default: return (b.review_count || 0) - (a.review_count || 0);
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="ml-3 text-text-muted">Loading courses...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="bg-white border-b border-[#E5E5E5]">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#171717] mb-3">
              LYC B2C Academy
            </h1>
            <p className="text-[#737373] max-w-xl mx-auto">
              Where Leadership Intelligence Meets Results. Build your governance,
              cross-border, and AI leadership capabilities with our expert-led courses.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A3A3A3]" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 text-sm border border-[#E5E5E5] focus:outline-none focus:border-[#2563EB] bg-white"
              />
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-1 flex-wrap">
                {CATEGORY_FILTERS.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 text-sm transition-colors ${
                      categoryFilter === cat
                        ? 'bg-[#171717] text-white'
                        : 'text-[#737373] hover:bg-[#F5F5F5]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="px-3 py-1.5 text-sm border border-[#E5E5E5] bg-white focus:outline-none"
              >
                <option value="popular">Most Popular</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {sortedCourses.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 text-[#D4D4D4] mx-auto mb-3" />
            <p className="text-[#737373]">No courses match your search</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedCourses.map(course => (
              <CourseCard key={course.id} course={course} onClick={onCourseClick} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CourseCard({ course, onClick }: { course: Course; onClick?: (c: Course) => void }) {
  return (
    <div
      onClick={() => onClick?.(course)}
      className="bg-white border border-[#E5E5E5] overflow-hidden cursor-pointer hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:border-[#D4D4D4] transition-all group"
    >
      <div className="aspect-video bg-gradient-to-br from-[#1e3a5f] to-[#2563EB] flex items-center justify-center relative">
        <BookOpen className="w-12 h-12 text-white/30" />
        {course.companion_diagnostic && (
          <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 text-[11px] font-semibold text-[#171717]">
            + {course.diagnostic_discount_pct}% off {course.companion_diagnostic}
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-center gap-2 mb-2 text-xs text-[#737373]">
          {course.duration_weeks && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {course.duration_weeks} wks
            </span>
          )}
          {course.estimated_hours && (
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {course.estimated_hours}h total
            </span>
          )}
        </div>

        <h3 className="font-semibold text-[#171717] mb-2 group-hover:text-[#2563EB] transition-colors">
          {course.title}
        </h3>

        <p className="text-sm text-[#737373] line-clamp-2 mb-4">
          {course.description || 'Build essential leadership capabilities with this comprehensive course.'}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-[#F0F0F0]">
          <div className="flex items-center gap-1">
            {course.avg_rating ? (
              <>
                <Star className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
                <span className="text-sm font-medium text-[#171717]">{course.avg_rating}</span>
                <span className="text-xs text-[#737373]">({course.review_count})</span>
              </>
            ) : (
              <span className="text-xs text-[#A3A3A3]">New course</span>
            )}
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-[#171717]">¥{course.price_cny}</p>
            {course.team_price_cny && (
              <p className="text-xs text-[#737373]">Team: ¥{course.team_price_cny}</p>
            )}
          </div>
        </div>

        <button className="mt-4 w-full py-2 bg-[#171717] text-white text-sm font-medium hover:bg-[#404040] transition-colors flex items-center justify-center gap-1">
          Learn More <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
