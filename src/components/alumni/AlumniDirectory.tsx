// Phase 4.6: Alumni Directory Component
'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Building2,
  Briefcase,
  Calendar,
  ChevronRight,
  Tag,
  X,
} from 'lucide-react';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';

interface Alumni {
  id: string;
  candidate_id: string;
  company_name: string;
  job_title: string;
  placement_date: string;
  guarantee_end_date: string;
  guarantee_status: string;
  alumni_status: string;
  tags: string[];
  engagement_count: number;
  last_engagement_date: string | null;
}

interface AlumniDirectoryProps {
  orgId: string;
  onSelectAlumni?: (alumni: Alumni) => void;
}

const STATUS_CONFIG = {
  active: { label: 'Active', color: 'bg-green-100 text-green-700' },
  inactive: { label: 'Inactive', color: 'bg-gray-100 text-gray-700' },
  unresponsive: { label: 'Unresponsive', color: 'bg-amber-100 text-amber-700' },
};

export function AlumniDirectory({ orgId, onSelectAlumni }: AlumniDirectoryProps) {
  const [alumniList, setAlumniList] = useState<Alumni[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const allTags = [...new Set(alumniList.flatMap(a => a.tags))];

  useEffect(() => {
    fetchAlumni();
  }, [orgId, searchQuery, selectedTags, statusFilter]);

  const fetchAlumni = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ org_id: orgId });
      if (searchQuery) params.set('q', searchQuery);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      selectedTags.forEach(tag => params.append('tag', tag));

      const response = await fetch(`/api/alumni?${params}`);
      const result = await response.json();

      if (result.success) {
        setAlumniList(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch alumni:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <Input
            placeholder="Search by company, title, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-none border border-border bg-bg-base text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="unresponsive">Unresponsive</option>
          </select>
          <Button variant="outline" onClick={() => {
            setSelectedTags([]);
            setStatusFilter('all');
            setSearchQuery('');
          }}>
            Reset Filters
          </Button>
        </div>
      </div>

      {/* Tag Filters */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" className="text-text-muted">
            <Filter className="w-4 h-4 mr-1" />
            Tags:
          </Button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 transition-colors ${
                selectedTags.includes(tag)
                  ? 'bg-primary text-white'
                  : 'bg-bg-alt text-text-muted hover:bg-bg-base'
              }`}
            >
              <Tag className="w-3 h-3" />
              {tag}
              {selectedTags.includes(tag) && <X className="w-3 h-3" />}
            </button>
          ))}
        </div>
      )}

      {/* Alumni List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : alumniList.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-text-muted mx-auto" />
          <p className="text-text-muted mt-4">No alumni found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {alumniList.map(alumni => (
            <Card
              key={alumni.id}
              className="p-4 hover:bg-bg-alt transition-colors cursor-pointer"
              onClick={() => onSelectAlumni?.(alumni)}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold">
                  {alumni.company_name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text-primary">{alumni.company_name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_CONFIG[alumni.alumni_status]?.color || 'bg-gray-100 text-gray-700'}`}>
                      {STATUS_CONFIG[alumni.alumni_status]?.label || alumni.alumni_status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-text-muted">
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      {alumni.job_title}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(alumni.placement_date)}
                    </span>
                  </div>
                  {alumni.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {alumni.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-bg-alt rounded text-xs text-text-muted"
                        >
                          {tag}
                        </span>
                      ))}
                      {alumni.tags.length > 3 && (
                        <span className="px-2 py-0.5 bg-bg-alt rounded text-xs text-text-muted">
                          +{alumni.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm text-text-muted">Engagements</div>
                  <div className="font-semibold text-text-primary">{alumni.engagement_count}</div>
                </div>
                <ChevronRight className="w-5 h-5 text-text-muted" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default AlumniDirectory;