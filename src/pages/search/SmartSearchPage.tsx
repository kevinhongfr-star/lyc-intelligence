/**
 * SmartSearchPage.tsx — Issue #42
 * Advanced search with faceted filters, full-text, saved searches
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Search,
  Filter,
  Bookmark,
  X,
  ChevronDown,
  User,
  Briefcase,
  Building2,
  Star,
  Clock,
} from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'candidate' | 'mandate' | 'company';
  title: string;
  subtitle: string;
  metadata: Record<string, any>;
  score: number;
  matchedFields: string[];
}

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: Record<string, any>;
}

const typeIcons: Record<string, React.ReactNode> = {
  candidate: <User className="w-4 h-4" />,
  mandate: <Briefcase className="w-4 h-4" />,
  company: <Building2 className="w-4 h-4" />,
};

const typeColors: Record<string, string> = {
  candidate: 'bg-blue-50 text-blue-700 border-blue-200',
  mandate: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  company: 'bg-purple-50 text-purple-700 border-purple-200',
};

export function SmartSearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [facets, setFacets] = useState<any>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [filterOptions, setFilterOptions] = useState<Record<string, string[]>>({});

  useEffect(() => {
    fetchFilters();
    fetchSavedSearches();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (query.length >= 2) fetchSuggestions();
      else setSuggestions([]);
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  async function fetchFilters() {
    const res = await fetch('/api/search/filters');
    const data = await res.json();
    if (data.success) setFilterOptions(data.filters);
  }

  async function fetchSavedSearches() {
    const res = await fetch('/api/search/saved');
    const data = await res.json();
    if (data.success) setSavedSearches(data.savedSearches || []);
  }

  async function fetchSuggestions() {
    const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (data.success) setSuggestions(data.suggestions || []);
  }

  const executeSearch = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });

    const res = await fetch(`/api/search?${params.toString()}`);
    const data = await res.json();
    if (data.success) {
      setResults(data.results || []);
      setTotal(data.total || 0);
      setFacets(data.facets || null);
    }
    setLoading(false);
  }, [query, filters]);

  useEffect(() => {
    executeSearch();
  }, [executeSearch]);

  function applySavedSearch(saved: SavedSearch) {
    setQuery(saved.query);
    setFilters(saved.filters || {});
  }

  async function saveCurrentSearch() {
    const res = await fetch('/api/search/saved', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: saveName,
        query,
        filters,
        entityType: filters.type || 'candidate',
      }),
    });
    if (res.ok) {
      setShowSaveModal(false);
      setSaveName('');
      fetchSavedSearches();
    }
  }

  function clearFilters() {
    setFilters({});
  }

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Smart Search</h1>
          <p className="text-sm text-gray-500 mt-1">Advanced search across candidates, mandates, and companies</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search candidates, mandates, companies..."
            className="w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {suggestions.length > 0 && !loading && (
            <div className="absolute z-10 w-full bg-white border rounded-xl mt-1 shadow-lg">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setQuery(s); setSuggestions([]); }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl"
                >
                  <Search className="w-3 h-3 inline mr-2 text-gray-400" />
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge className="bg-blue-100 text-blue-700 ml-1">{activeFilterCount}</Badge>
            )}
            <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </Button>

          {savedSearches.length > 0 && savedSearches.map(ss => (
            <button
              key={ss.id}
              onClick={() => applySavedSearch(ss)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-50 hover:bg-gray-100 rounded-full border"
            >
              <Bookmark className="w-3 h-3" />
              {ss.name}
            </button>
          ))}

          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="text-xs text-gray-500 hover:text-gray-700 underline">
              Clear all
            </button>
          )}

          <div className="flex-1" />
          <Button variant="outline" onClick={() => setShowSaveModal(true)} className="gap-2">
            <Bookmark className="w-4 h-4" />
            Save Search
          </Button>
        </div>

        {showFilters && (
          <Card className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(filterOptions).map(([key, options]) => (
                <div key={key}>
                  <label className="text-xs font-medium text-gray-600 capitalize mb-1 block">{key}</label>
                  <select
                    value={filters[key] || ''}
                    onChange={e => setFilters({ ...filters, [key]: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">All {key}s</option>
                    {options.map(o => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {loading ? 'Searching...' : `${total} results${query ? ` for "${query}"` : ''}`}
        </div>
        {facets && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {Object.entries(facets.type || {}).map(([type, count]: [string, any]) => (
              <span key={type} className="capitalize">{type}: {count}</span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        {results.map(r => (
          <Card key={r.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${typeColors[r.type] || 'bg-gray-50'}`}>
                  {typeIcons[r.type]}
                </div>
                <div>
                  <div className="font-medium text-sm">{r.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{r.subtitle}</div>
                  <div className="flex items-center gap-1 mt-1.5">
                    {r.matchedFields.map(f => (
                      <Badge key={f} variant="outline" className="text-[10px] px-1.5 py-0">
                        {f}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span className="text-xs font-medium">{(r.score * 100).toFixed(0)}%</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Save Search</h3>
              <button onClick={() => setShowSaveModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <input
              type="text"
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              placeholder="Search name..."
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSaveModal(false)}>Cancel</Button>
              <Button onClick={saveCurrentSearch}>Save</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
