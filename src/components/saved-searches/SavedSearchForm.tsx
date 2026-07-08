// Phase 2.7: Saved Search Form Component
'use client';

import React, { useState } from 'react';
import { Save, Clock, Share2, X } from 'lucide-react';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { Textarea } from '@/components/ui';
import { Select } from '@/components/ui';
import { Checkbox } from '@/components/ui';
import type { SearchFilters } from '@/lib/saved-searches/engine';

interface SavedSearchFormProps {
  currentFilters: SearchFilters;
  onSave: (search: { name: string; description: string; filters: SearchFilters; frequency: string; isShared: boolean }) => void;
  onCancel: () => void;
}

const FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'realtime', label: 'Realtime' },
  { value: 'off', label: 'Off' },
];

export function SavedSearchForm({ currentFilters, onSave, onCancel }: SavedSearchFormProps) {
  const [searchName, setSearchName] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [isShared, setIsShared] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchName.trim()) return;

    onSave({
      name: searchName.trim(),
      description: description.trim(),
      filters: currentFilters,
      frequency,
      isShared,
    });
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Save className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-text-primary">Save Search</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-text-muted">Search Name *</label>
          <Input
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="Enter search name"
            className="mt-1"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-text-muted">Description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description of this search"
            rows={2}
            className="mt-1"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-text-muted flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Alert Frequency
          </label>
          <Select
            value={frequency}
            onValueChange={(value) => setFrequency(value)}
            className="mt-1"
          >
            {FREQUENCIES.map(freq => (
              <option key={freq.value} value={freq.value}>{freq.label}</option>
            ))}
          </Select>
        </div>

        <div className="flex items-center gap-3">
          <Checkbox
            id="share-search"
            checked={isShared}
            onCheckedChange={(checked) => setIsShared(checked === true)}
          />
          <label htmlFor="share-search" className="flex items-center gap-2 text-sm text-text-primary">
            <Share2 className="w-4 h-4" />
            Share with team
          </label>
        </div>

        <div className="p-3 bg-bg-alt rounded-none">
          <label className="text-sm font-medium text-text-muted">Current Filters</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {currentFilters.title && (
              <span className="px-2 py-1 bg-bg-base rounded text-xs">Title: {currentFilters.title}</span>
            )}
            {currentFilters.location && (
              <span className="px-2 py-1 bg-bg-base rounded text-xs">Location: {currentFilters.location}</span>
            )}
            {currentFilters.industry && (
              <span className="px-2 py-1 bg-bg-base rounded text-xs">Industry: {currentFilters.industry}</span>
            )}
            {currentFilters.skills && currentFilters.skills.length > 0 && (
              <span className="px-2 py-1 bg-bg-base rounded text-xs">Skills: {currentFilters.skills.length}</span>
            )}
            {currentFilters.experience_years && (
              <span className="px-2 py-1 bg-bg-base rounded text-xs">
                Experience: {currentFilters.experience_years.min}-{currentFilters.experience_years.max}
              </span>
            )}
            {!Object.keys(currentFilters).length && (
              <span className="px-2 py-1 bg-bg-base rounded text-xs text-text-muted">No filters</span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={!searchName} className="flex-1 gap-2">
            <Save className="w-4 h-4" />
            Save Search
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default SavedSearchForm;