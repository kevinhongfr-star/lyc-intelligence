import React, { useState, useCallback } from 'react';
import { Search, ExternalLink, Clock, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  published_at?: string;
  rank_score?: number;
}

interface WebSearchPanelProps {
  onSearch?: (query: string) => Promise<SearchResult[]>;
}

const MOCK_RESULTS: SearchResult[] = [
  { title: 'TechCrunch - Latest Technology News', url: 'https://techcrunch.com', snippet: 'The latest in technology news, covering startups, AI, and digital transformation.', source: 'techcrunch.com', published_at: new Date(Date.now() - 86400000).toISOString(), rank_score: 25 },
  { title: 'Hacker News', url: 'https://news.ycombinator.com', snippet: 'Community-driven tech news aggregator with discussions on programming, startups, and more.', source: 'news.ycombinator.com', published_at: new Date(Date.now() - 172800000).toISOString(), rank_score: 22 },
  { title: 'The Verge', url: 'https://theverge.com', snippet: 'Breaking technology news and analysis on the future of tech, science, and art.', source: 'theverge.com', published_at: new Date(Date.now() - 259200000).toISOString(), rank_score: 20 },
  { title: 'GitHub Blog', url: 'https://github.blog', snippet: 'Product updates, engineering blog posts, and community stories from the GitHub team.', source: 'github.blog', published_at: new Date(Date.now() - 432000000).toISOString(), rank_score: 18 },
  { title: 'Dev.to - Where software developers build careers', url: 'https://dev.to', snippet: 'A community of software developers sharing articles, discussions, and career advice.', source: 'dev.to', published_at: new Date(Date.now() - 604800000).toISOString(), rank_score: 15 },
];

export function WebSearchPanel({ onSearch }: WebSearchPanelProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);

    try {
      if (onSearch) {
        const customResults = await onSearch(query);
        setResults(customResults);
      } else {
        await new Promise(resolve => setTimeout(resolve, 800));
        const shuffled = [...MOCK_RESULTS].sort(() => Math.random() - 0.5);
        setResults(shuffled);
      }
      setHistory(prev => [query, ...prev.filter(q => q !== query)].slice(0, 10));
    } catch (e: any) {
      setError(e?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [query, onSearch]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5 text-accent" />
          Web Search
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && performSearch()}
            placeholder="Search the web..."
            className="flex-1 px-3 py-2 border border-border bg-bg text-text-primary text-sm focus:outline-none focus:border-accent rounded-none"
          />
          <Button onClick={performSearch} loading={loading}>
            <Search className="w-4 h-4" />
            Search
          </Button>
        </div>

        {history.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-text-muted mb-2 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Recent searches
            </p>
            <div className="flex flex-wrap gap-1">
              {history.map((h, i) => (
                <button
                  key={`${h}-${i}`}
                  onClick={() => setQuery(h)}
                  className="px-2 py-1 text-xs bg-bg-tertiary text-text-secondary hover:bg-bg-hover transition-colors"
                >
                  {h}
                </button>
              ))}
              <button
                onClick={() => setHistory([])}
                className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-3 p-2 bg-red-50 text-red-700 text-sm">{error}</div>
        )}

        <div className="space-y-3 max-h-[400px] overflow-auto">
          {loading && (
            <div className="text-center py-8 text-text-muted text-sm">Searching...</div>
          )}
          {!loading && results.map((result, i) => (
            <div key={`${result.url}-${i}`} className="border-b border-border pb-3 last:border-b-0">
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline font-medium text-sm flex items-center gap-1"
              >
                {result.title}
                <ExternalLink className="w-3 h-3" />
              </a>
              <p className="text-xs text-text-secondary mt-1 line-clamp-2">{result.snippet}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
                <span>{result.source}</span>
                {result.published_at && (
                  <span>· {new Date(result.published_at).toLocaleDateString()}</span>
                )}
                {result.rank_score !== undefined && (
                  <span>· Relevance: {result.rank_score}</span>
                )}
              </div>
            </div>
          ))}
          {!loading && results.length === 0 && !error && (
            <div className="text-center py-8 text-text-muted text-sm">
              Enter a query to see results
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}