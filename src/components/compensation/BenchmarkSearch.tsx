// Phase 3.8: Compensation Benchmark Search Component
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Building2, UserCheck, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { BenchmarkInput, CompLevel } from '@/types/compensation';

interface BenchmarkSearchProps {
  orgId: string;
  onSearch: (input: BenchmarkInput) => void;
  initialQuery?: BenchmarkInput;
  loading?: boolean;
}

export function BenchmarkSearch({ orgId, onSearch, initialQuery, loading }: BenchmarkSearchProps) {
  const [jobTitle, setJobTitle] = useState(initialQuery?.jobTitle || '');
  const [industry, setIndustry] = useState(initialQuery?.industry || '');
  const [city, setCity] = useState(initialQuery?.city || '');
  const [country, setCountry] = useState(initialQuery?.country || 'CN');
  const [level, setLevel] = useState<string>(initialQuery?.level || '');

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounced suggestions
  useEffect(() => {
    if (jobTitle.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const response = await fetch(
          `/api/x/compensation/suggestions?org_id=${orgId}&q=${encodeURIComponent(jobTitle)}&type=job_title`
        );
        const result = await response.json();
        if (result.success) {
          setSuggestions(result.suggestions || []);
        }
      } catch (err) {
        console.error('Failed to fetch suggestions:', err);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [jobTitle, orgId]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim()) return;

    setShowSuggestions(false);
    onSearch({
      jobTitle: jobTitle.trim(),
      industry: industry || undefined,
      city: city || undefined,
      country: country || undefined,
      level: (level as CompLevel) || undefined,
    });
  };

  const handleSuggestionClick = (suggestion: string) => {
    setJobTitle(suggestion);
    setShowSuggestions(false);
  };

  return (
    <Card className="p-6">
      <h3 className="font-serif font-semibold text-lg text-text-primary mb-4 flex items-center gap-2">
        <Search className="w-5 h-5 text-accent" />
        Compensation Benchmark Lookup
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Job Title */}
        <div ref={searchRef} className="relative">
          <label className="text-sm font-medium text-text-muted">Job Title *</label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <Input
              value={jobTitle}
              onChange={(e) => {
                setJobTitle(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="e.g., VP Sales, General Manager"
              className="pl-9"
            />
            {suggestionsLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted animate-spin" />
            )}
          </div>

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-bg-base border border-bg-hover rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-bg-secondary transition-colors first:rounded-t-lg last:rounded-b-lg"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Industry & City */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-text-muted flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              Industry
            </label>
            <Input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g., Technology"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-text-muted flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              City
            </label>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g., Shanghai"
              className="mt-1"
            />
          </div>
        </div>

        {/* Country & Level */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-text-muted">Country</label>
            <Input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="CN"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-text-muted flex items-center gap-1">
              <UserCheck className="w-3 h-3" />
              Level
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-bg-tertiary border border-bg-hover rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent"
            >
              <option value="">Any level</option>
              <option value="junior">Junior</option>
              <option value="mid">Mid</option>
              <option value="senior">Senior</option>
              <option value="executive">Executive</option>
            </select>
          </div>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full"
          disabled={!jobTitle.trim() || loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Calculating...
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Get Benchmark
            </>
          )}
        </Button>
      </form>
    </Card>
  );
}

export default BenchmarkSearch;
