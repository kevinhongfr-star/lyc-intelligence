// Phase 2.7: Search Filters Component
'use client';

import React, { useState } from 'react';
import {
  Search,
  MapPin,
  Briefcase,
  GraduationCap,
  Clock,
  Tag,
  Plus,
  X,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { Select } from '@/components/ui';

interface SearchFiltersProps {
  filters: Record<string, unknown>;
  onFiltersChange: (filters: Record<string, unknown>) => void;
  onClear: () => void;
}

const SENIORITY_OPTIONS = ['Junior', 'Mid-level', 'Senior', 'Manager', 'Director', 'VP', 'C-level'];
const INDUSTRY_OPTIONS = [
  'Technology', 'Finance', 'Healthcare', 'Manufacturing', 'Retail', 'Education',
  'Real Estate', 'Energy', 'Media', 'Non-profit',
];

export function SearchFilters({ filters, onFiltersChange, onClear }: SearchFiltersProps) {
  const [localFilters, setLocalFilters] = useState(filters);
  const [newSkill, setNewSkill] = useState('');
  const [newKeyword, setNewKeyword] = useState('');

  const updateFilter = (key: string, value: unknown) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const addSkill = () => {
    if (!newSkill.trim()) return;
    const skills = (localFilters.skills as string[]) || [];
    if (!skills.includes(newSkill.trim())) {
      const newSkills = [...skills, newSkill.trim()];
      updateFilter('skills', newSkills);
    }
    setNewSkill('');
  };

  const removeSkill = (skillToRemove: string) => {
    const skills = (localFilters.skills as string[]) || [];
    const newSkills = skills.filter(s => s !== skillToRemove);
    updateFilter('skills', newSkills.length > 0 ? newSkills : undefined);
  };

  const addKeyword = () => {
    if (!newKeyword.trim()) return;
    const keywords = (localFilters.keywords as string[]) || [];
    if (!keywords.includes(newKeyword.trim())) {
      const newKeywords = [...keywords, newKeyword.trim()];
      updateFilter('keywords', newKeywords);
    }
    setNewKeyword('');
  };

  const removeKeyword = (keywordToRemove: string) => {
    const keywords = (localFilters.keywords as string[]) || [];
    const newKeywords = keywords.filter(k => k !== keywordToRemove);
    updateFilter('keywords', newKeywords.length > 0 ? newKeywords : undefined);
  };

  const hasActiveFilters = Object.keys(localFilters).some(
    key => {
      const value = localFilters[key];
      if (Array.isArray(value)) return value.length > 0;
      return value !== undefined && value !== '' && value !== null;
    }
  );

  return (
    <div className="space-y-4">
      {/* Quick Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
        <Input
          placeholder="Search candidates..."
          value={localFilters.keywords?.[0] || ''}
          onChange={(e) => updateFilter('keywords', e.target.value ? [e.target.value] : undefined)}
          className="pl-10"
        />
      </div>

      {/* Filter Groups */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Title */}
        <div>
          <label className="text-sm font-medium text-text-muted flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Job Title
          </label>
          <Input
            value={localFilters.title as string || ''}
            onChange={(e) => updateFilter('title', e.target.value || undefined)}
            placeholder="e.g., Software Engineer"
            className="mt-1"
          />
        </div>

        {/* Location */}
        <div>
          <label className="text-sm font-medium text-text-muted flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Location
          </label>
          <Input
            value={localFilters.location as string || ''}
            onChange={(e) => updateFilter('location', e.target.value || undefined)}
            placeholder="e.g., San Francisco"
            className="mt-1"
          />
        </div>

        {/* Industry */}
        <div>
          <label className="text-sm font-medium text-text-muted flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Industry
          </label>
          <Select
            value={localFilters.industry as string || ''}
            onValueChange={(value) => updateFilter('industry', value || undefined)}
            className="mt-1"
          >
            <option value="">Select industry</option>
            {INDUSTRY_OPTIONS.map(industry => (
              <option key={industry} value={industry}>{industry}</option>
            ))}
          </Select>
        </div>

        {/* Experience */}
        <div>
          <label className="text-sm font-medium text-text-muted flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Experience (years)
          </label>
          <div className="flex gap-2 mt-1">
            <Input
              type="number"
              placeholder="Min"
              value={localFilters.experience_years?.min as string || ''}
              onChange={(e) => {
                const years = localFilters.experience_years as Record<string, number> || {};
                updateFilter('experience_years', {
                  ...years,
                  min: e.target.value ? parseInt(e.target.value) : undefined,
                });
              }}
              className="flex-1"
            />
            <Input
              type="number"
              placeholder="Max"
              value={localFilters.experience_years?.max as string || ''}
              onChange={(e) => {
                const years = localFilters.experience_years as Record<string, number> || {};
                updateFilter('experience_years', {
                  ...years,
                  max: e.target.value ? parseInt(e.target.value) : undefined,
                });
              }}
              className="flex-1"
            />
          </div>
        </div>

        {/* Seniority */}
        <div>
          <label className="text-sm font-medium text-text-muted flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            Seniority
          </label>
          <Select
            value={localFilters.seniority?.[0] as string || ''}
            onValueChange={(value) => updateFilter('seniority', value ? [value] : undefined)}
            className="mt-1"
          >
            <option value="">Select seniority</option>
            {SENIORITY_OPTIONS.map(seniority => (
              <option key={seniority} value={seniority}>{seniority}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* Skills */}
      <div>
        <label className="text-sm font-medium text-text-muted">Skills</label>
        <div className="flex gap-2 mt-1">
          <Input
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addSkill()}
            placeholder="Add skill..."
          />
          <Button variant="outline" onClick={addSkill} className="gap-1">
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>
        {localFilters.skills && (localFilters.skills as string[]).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {(localFilters.skills as string[]).map(skill => (
              <span
                key={skill}
                className="flex items-center gap-1 px-3 py-1 bg-bg-alt rounded-full text-sm"
              >
                {skill}
                <button
                  onClick={() => removeSkill(skill)}
                  className="hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Keywords */}
      <div>
        <label className="text-sm font-medium text-text-muted">Keywords</label>
        <div className="flex gap-2 mt-1">
          <Input
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
            placeholder="Add keyword..."
          />
          <Button variant="outline" onClick={addKeyword} className="gap-1">
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>
        {localFilters.keywords && (localFilters.keywords as string[]).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {(localFilters.keywords as string[]).map(keyword => (
              <span
                key={keyword}
                className="flex items-center gap-1 px-3 py-1 bg-bg-alt rounded-full text-sm"
              >
                {keyword}
                <button
                  onClick={() => removeKeyword(keyword)}
                  className="hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Clear Button */}
      {hasActiveFilters && (
        <Button variant="outline" className="gap-2" onClick={onClear}>
          <Trash2 className="w-4 h-4" />
          Clear All Filters
        </Button>
      )}
    </div>
  );
}

export default SearchFilters;