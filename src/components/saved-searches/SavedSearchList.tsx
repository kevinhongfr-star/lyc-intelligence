// Phase 2.7: Saved Search List Component
'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Clock,
  Share2,
  Edit3,
  Trash2,
  Play,
  Pause,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui';
import type { SavedSearch } from '@/lib/saved-searches/engine';

interface SavedSearchListProps {
  orgId: string;
  userId: string;
  onSelectSearch: (search: SavedSearch) => void;
  onEditSearch: (search: SavedSearch) => void;
}

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  realtime: 'Realtime',
  off: 'Off',
};

export function SavedSearchList({ orgId, userId, onSelectSearch, onEditSearch }: SavedSearchListProps) {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSearches();
  }, [orgId, userId]);

  const fetchSearches = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/saved-searches?org_id=${orgId}&user_id=${userId}`);
      const result = await response.json();

      if (result.success) {
        setSearches(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch saved searches:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (search: SavedSearch) => {
    try {
      await fetch(`/api/saved-searches/${search.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !search.is_active }),
      });
      fetchSearches();
    } catch (err) {
      console.error('Failed to update search:', err);
    }
  };

  const handleDelete = async (searchId: string) => {
    if (!confirm('Are you sure you want to delete this saved search?')) return;

    try {
      await fetch(`/api/saved-searches/${searchId}`, {
        method: 'DELETE',
      });
      fetchSearches();
    } catch (err) {
      console.error('Failed to delete search:', err);
    }
  };

  const filteredSearches = searches.filter(search =>
    search.search_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      {/* Search Box */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
        <input
          type="text"
          placeholder="Search saved searches..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-none border border-border bg-bg-base text-sm"
        />
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : filteredSearches.length === 0 ? (
        <Card className="p-8 text-center">
          <Search className="w-12 h-12 text-text-muted mx-auto" />
          <p className="text-text-muted mt-4">No saved searches</p>
          <p className="text-sm text-text-muted mt-2">Save your first search to get started</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredSearches.map(search => (
            <Card
              key={search.id}
              className={`p-4 hover:bg-bg-alt transition-colors ${!search.is_active ? 'opacity-60' : ''}`}
            >
              <div className="flex items-center gap-4">
                {/* Status Indicator */}
                <button
                  onClick={() => handleToggleActive(search)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    search.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {search.is_active ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </button>

                {/* Search Info */}
                <div className="flex-1 cursor-pointer" onClick={() => onSelectSearch(search)}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text-primary">{search.search_name}</span>
                    {search.is_shared && (
                      <Share2 className="w-4 h-4 text-text-muted" />
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-text-muted">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {FREQUENCY_LABELS[search.alert_frequency]}
                    </span>
                    <span>Last run: {formatDate(search.last_executed_at)}</span>
                    <span>{search.last_match_count} matches</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEditSearch(search)}
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(search.id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <ChevronRight className="w-5 h-5 text-text-muted" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default SavedSearchList;