/**
 * GlobalSearch — Cmd+K command palette
 * Searches across Candidates, Mandates, Companies in real-time
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Briefcase, Building2, Loader2, ArrowRight, X } from 'lucide-react';
import { searchContacts, getMandates, getCompanies } from '@/services/supabaseApi';
import type { Contact, Mandate, Company } from '@/services/supabaseApi';

interface SearchResult {
  type: 'candidate' | 'mandate' | 'company';
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      const allResults: SearchResult[] = [];
      try {
        const { data: contacts } = await searchContacts({ query, limit: 5 });
        contacts.forEach((c: Contact) => {
          allResults.push({
            type: 'candidate', id: c.id,
            title: c.name || 'Unnamed',
            subtitle: [c.current_title, c.location].filter(Boolean).join(' · ') || 'No details',
            href: `/app/candidates`,
          });
        });
        const { data: mandates } = await getMandates({ limit: 100 });
        const q = query.toLowerCase();
        mandates.filter(m => m.title?.toLowerCase().includes(q) || m.status?.toLowerCase().includes(q))
          .slice(0, 5).forEach((m: Mandate) => {
            allResults.push({
              type: 'mandate', id: m.id,
              title: m.title || 'Untitled Mandate',
              subtitle: `${m.status?.replace('_', ' ')} · ${m.total_candidates || 0} candidates`,
              href: `/app/mandates/${m.id}`,
            });
          });
        const { data: companies } = await getCompanies({ query, limit: 5 });
        companies.forEach((c: Company) => {
          allResults.push({
            type: 'company', id: c.id,
            title: c.name || 'Unnamed Company',
            subtitle: [c.industry, c.country].filter(Boolean).join(' · ') || 'No details',
            href: `/app/companies`,
          });
        });
      } catch (err) { console.error('[GlobalSearch] Error:', err); }
      setResults(allResults);
      setLoading(false);
      setSelectedIndex(0);
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && results[selectedIndex]) { e.preventDefault(); navigate(results[selectedIndex].href); onClose(); }
    else if (e.key === 'Escape') { onClose(); }
  }, [results, selectedIndex, navigate, onClose]);

  if (!isOpen) return null;

  const ICONS = { candidate: Users, mandate: Briefcase, company: Building2 };
  const COLORS = { candidate: '#00897B', mandate: '#C108AB', company: '#2C5282' };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white border border-[#E5E5E5] shadow-2xl overflow-hidden" onKeyDown={handleKeyDown}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E5E5E5]">
          <Search className="w-5 h-5 text-[#A3A3A3] flex-shrink-0" />
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search candidates, mandates, companies..."
            className="flex-1 text-sm text-[#171717] placeholder:text-[#A3A3A3] bg-transparent outline-none" />
          {query && <button onClick={() => setQuery('')} className="text-[#A3A3A3] hover:text-[#171717]"><X className="w-4 h-4" /></button>}
          <kbd className="text-[10px] text-[#A3A3A3] border border-[#E5E5E5] px-1.5 py-0.5">ESC</kbd>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {loading && <div className="flex items-center gap-2 px-4 py-8 justify-center text-[#737373]"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">Searching...</span></div>}
          {!loading && query.length >= 2 && results.length === 0 && <div className="px-4 py-8 text-center text-sm text-[#737373]">No results for "{query}"</div>}
          {!loading && results.map((result, index) => {
            const Icon = ICONS[result.type]; const color = COLORS[result.type]; const isSelected = index === selectedIndex;
            return (
              <button key={`${result.type}-${result.id}`} onClick={() => { navigate(result.href); onClose(); }} onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isSelected ? 'bg-[#F5F5F5]' : 'bg-white hover:bg-[#FAFAFA]'}`}>
                <div className="w-8 h-8 flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}10` }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[#171717] truncate">{result.title}</div>
                  <div className="text-xs text-[#737373] truncate">{result.subtitle}</div>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-[#A3A3A3] flex-shrink-0">{result.type}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#A3A3A3] flex-shrink-0" />
              </button>
            );
          })}
          {!loading && query.length < 2 && (
            <div className="px-4 py-6">
              <div className="text-xs text-[#A3A3A3] uppercase tracking-wider mb-3">Quick navigation</div>
              {[
                { label: 'Dashboard', href: '/app/dashboard', icon: '📊' },
                { label: 'Candidates', href: '/app/candidates', icon: '👤' },
                { label: 'Mandates', href: '/app/mandates', icon: '💼' },
                { label: 'Pipeline', href: '/app/pipeline', icon: '🔄' },
                { label: 'Companies', href: '/app/companies', icon: '🏢' },
              ].map(item => (
                <button key={item.href} onClick={() => { navigate(item.href); onClose(); }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#171717] hover:bg-[#F5F5F5] transition-colors">
                  <span>{item.icon}</span>{item.label}
                </button>
              ))}
            </div>
          )}
        </div>
        {results.length > 0 && (
          <div className="flex items-center gap-4 px-4 py-2 border-t border-[#E5E5E5] bg-[#FAFAFA]">
            <span className="text-[10px] text-[#A3A3A3]"><kbd className="border border-[#E5E5E5] px-1 py-0.5">↑↓</kbd> Navigate</span>
            <span className="text-[10px] text-[#A3A3A3]"><kbd className="border border-[#E5E5E5] px-1 py-0.5">↵</kbd> Open</span>
            <span className="text-[10px] text-[#A3A3A3]"><kbd className="border border-[#E5E5E5] px-1 py-0.5">esc</kbd> Close</span>
          </div>
        )}
      </div>
    </div>
  );
}
