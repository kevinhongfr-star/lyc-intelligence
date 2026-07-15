import React, { useState } from 'react';
import {
  Search,
  MapPin,
  DollarSign,
  Briefcase,
  Filter,
  Building2,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

/**
 * BrowseMandatesPage — public, no auth required.
 * Lets visitors browse anonymized executive mandates and apply.
 *
 * Brand rules:
 *  - DM Sans body font, Libre Baskerville headings
 *  - Fuchsia #C108AB primary, sharp corners (no rounded-*)
 *  - NEVER use "free" — use "Complimentary"
 *  - Company names are anonymized
 */

interface Mandate {
  id: string;
  title: string;
  company: string; // anonymized
  industry: string;
  location: string;
  seniority: string;
  func: string;
  salaryMin: number; // in $K
  salaryMax: number; // in $K
  postedDaysAgo: number;
}

const INDUSTRIES = ['All Industries', 'Technology', 'Financial Services', 'Healthcare', 'Consumer', 'Industrial'];
const LOCATIONS = ['All Locations', 'Shanghai', 'Beijing', 'Hong Kong', 'Singapore', 'Remote'];
const SENIORITY = ['All Levels', 'VP', 'SVP', 'C-Level', 'Board'];
const FUNCTIONS = ['All Functions', 'General Management', 'Finance', 'Sales & Marketing', 'Operations', 'Technology'];

const MANDATES: Mandate[] = [
  {
    id: 'm-1001',
    title: 'Chief Financial Officer',
    company: 'Confidential FinTech Client',
    industry: 'Financial Services',
    location: 'Shanghai',
    seniority: 'C-Level',
    func: 'Finance',
    salaryMin: 280,
    salaryMax: 340,
    postedDaysAgo: 3,
  },
  {
    id: 'm-1002',
    title: 'VP of Engineering',
    company: 'Confidential SaaS Client',
    industry: 'Technology',
    location: 'Remote',
    seniority: 'VP',
    func: 'Technology',
    salaryMin: 220,
    salaryMax: 280,
    postedDaysAgo: 7,
  },
  {
    id: 'm-1003',
    title: 'Chief Marketing Officer',
    company: 'Confidential Consumer Client',
    industry: 'Consumer',
    location: 'Shanghai',
    seniority: 'C-Level',
    func: 'Sales & Marketing',
    salaryMin: 260,
    salaryMax: 320,
    postedDaysAgo: 12,
  },
  {
    id: 'm-1004',
    title: 'SVP, Operations',
    company: 'Confidential Industrial Client',
    industry: 'Industrial',
    location: 'Beijing',
    seniority: 'SVP',
    func: 'Operations',
    salaryMin: 200,
    salaryMax: 260,
    postedDaysAgo: 5,
  },
  {
    id: 'm-1005',
    title: 'General Manager, APAC',
    company: 'Confidential Healthcare Client',
    industry: 'Healthcare',
    location: 'Hong Kong',
    seniority: 'C-Level',
    func: 'General Management',
    salaryMin: 300,
    salaryMax: 380,
    postedDaysAgo: 1,
  },
  {
    id: 'm-1006',
    title: 'VP of Sales',
    company: 'Confidential Technology Client',
    industry: 'Technology',
    location: 'Singapore',
    seniority: 'VP',
    func: 'Sales & Marketing',
    salaryMin: 180,
    salaryMax: 240,
    postedDaysAgo: 18,
  },
  {
    id: 'm-1007',
    title: 'Chief Operating Officer',
    company: 'Confidential Consumer Client',
    industry: 'Consumer',
    location: 'Shanghai',
    seniority: 'C-Level',
    func: 'Operations',
    salaryMin: 290,
    salaryMax: 360,
    postedDaysAgo: 9,
  },
  {
    id: 'm-1008',
    title: 'VP, Corporate Development',
    company: 'Confidential Financial Services Client',
    industry: 'Financial Services',
    location: 'Hong Kong',
    seniority: 'VP',
    func: 'Finance',
    salaryMin: 240,
    salaryMax: 300,
    postedDaysAgo: 21,
  },
];

function formatPosted(daysAgo: number): string {
  if (daysAgo <= 0) return 'Today';
  if (daysAgo === 1) return '1 day ago';
  if (daysAgo < 30) return `${daysAgo} days ago`;
  const months = Math.round(daysAgo / 30);
  return months === 1 ? '1 month ago' : `${months} months ago`;
}

function selectClass() {
  return 'px-4 py-2.5 bg-white border border-[#E5E5E5] text-sm text-[#1C1C1C] focus:outline-none focus:border-[#C108AB] min-h-[44px] appearance-none cursor-pointer';
}

export function BrowseMandatesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [industry, setIndustry] = useState(INDUSTRIES[0]);
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [seniority, setSeniority] = useState(SENIORITY[0]);
  const [func, setFunc] = useState(FUNCTIONS[0]);

  const filtered = MANDATES.filter((m) => {
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !q ||
      m.title.toLowerCase().includes(q) ||
      m.company.toLowerCase().includes(q) ||
      m.industry.toLowerCase().includes(q);
    const matchesIndustry = industry === INDUSTRIES[0] || m.industry === industry;
    const matchesLocation = location === LOCATIONS[0] || m.location === location;
    const matchesSeniority = seniority === SENIORITY[0] || m.seniority === seniority;
    const matchesFunc = func === FUNCTIONS[0] || m.func === func;
    return matchesSearch && matchesIndustry && matchesLocation && matchesSeniority && matchesFunc;
  });

  const hasActiveFilters =
    industry !== INDUSTRIES[0] ||
    location !== LOCATIONS[0] ||
    seniority !== SENIORITY[0] ||
    func !== FUNCTIONS[0] ||
    searchTerm.trim() !== '';

  const clearFilters = () => {
    setSearchTerm('');
    setIndustry(INDUSTRIES[0]);
    setLocation(LOCATIONS[0]);
    setSeniority(SENIORITY[0]);
    setFunc(FUNCTIONS[0]);
  };

  const goToDetail = (id: string) => {
    window.location.href = `/candidates/mandates/${id}`;
  };

  const applyNow = (id: string) => {
    window.location.href = `/candidates/apply/${id}`;
  };

  return (
    <div
      className="min-h-screen bg-[#F7F7F7] text-[#1C1C1C]"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      {/* Nav */}
      <nav className="bg-white border-b border-[#E5E5E5] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a
            href="/candidates"
            className="font-bold text-base tracking-tight text-[#1C1C1C] no-underline"
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            Candidate Portal
          </a>
          <div className="flex items-center gap-3">
            <a
              href="/candidates"
              className="text-sm text-[#525252] hover:text-[#C108AB] transition-colors no-underline hidden sm:inline"
            >
              Home
            </a>
            <Button size="sm" onClick={() => (window.location.href = '/candidates/apply')}>
              Start Application
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="bg-white border-b border-[#E5E5E5]">
        <div className="max-w-6xl mx-auto px-6 py-12 md:py-16">
          <div className="text-xs font-bold uppercase tracking-[2.5px] text-[#C108AB] mb-3">
            Active Mandates
          </div>
          <h1
            className="text-3xl md:text-4xl font-bold tracking-tight text-[#1C1C1C]"
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            Browse Executive Mandates
          </h1>
          <p className="text-sm md:text-base text-[#525252] mt-3 max-w-2xl leading-relaxed">
            Explore confidential C-suite and VP-level mandates sourced through our partner
            network. Company names are anonymized until you engage.
          </p>
        </div>
      </section>

      {/* Search + Filters */}
      <section className="px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white border border-[#E5E5E5] p-5 md:p-6">
            {/* Search bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A3A3A3] pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by role, company, or industry..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#F7F7F7] border border-[#E5E5E5] text-sm text-[#1C1C1C] placeholder:text-[#A3A3A3] focus:outline-none focus:border-[#C108AB] min-h-[44px]"
              />
            </div>
            {/* Filters */}
            <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-[#A3A3A3]">
              <Filter className="w-3.5 h-3.5" />
              Filter by
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label htmlFor="filter-industry" className="block text-[11px] font-medium text-[#525252] mb-1.5">
                  Industry
                </label>
                <select
                  id="filter-industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className={selectClass()}
                >
                  {INDUSTRIES.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="filter-location" className="block text-[11px] font-medium text-[#525252] mb-1.5">
                  Location
                </label>
                <select
                  id="filter-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className={selectClass()}
                >
                  {LOCATIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="filter-seniority" className="block text-[11px] font-medium text-[#525252] mb-1.5">
                  Seniority
                </label>
                <select
                  id="filter-seniority"
                  value={seniority}
                  onChange={(e) => setSeniority(e.target.value)}
                  className={selectClass()}
                >
                  {SENIORITY.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="filter-function" className="block text-[11px] font-medium text-[#525252] mb-1.5">
                  Function
                </label>
                <select
                  id="filter-function"
                  value={func}
                  onChange={(e) => setFunc(e.target.value)}
                  className={selectClass()}
                >
                  {FUNCTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
            </div>
            {hasActiveFilters && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="text-xs font-medium text-[#C108AB] hover:text-[#A50798] transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Results count + grid */}
      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-[#525252]">
              <span className="font-semibold text-[#1C1C1C]">{filtered.length}</span>{' '}
              {filtered.length === 1 ? 'mandate' : 'mandates'} found
            </p>
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white border border-[#E5E5E5] p-12 text-center">
              <Briefcase className="w-8 h-8 text-[#A3A3A3] mx-auto mb-3" />
              <h3
                className="text-lg font-semibold text-[#1C1C1C] mb-1"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                No mandates match your filters
              </h3>
              <p className="text-sm text-[#525252] mb-5">
                Try adjusting your search or clearing filters to see more results.
              </p>
              {hasActiveFilters && (
                <Button variant="outline" size="default" onClick={clearFilters}>
                  Clear all filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filtered.map((m) => (
                <div
                  key={m.id}
                  className="bg-white border border-[#E5E5E5] p-6 flex flex-col transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(26,23,20,0.08)]"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-[rgba(193,8,171,0.08)] flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-[#C108AB]" />
                      </div>
                      <div>
                        <h3
                          className="text-base font-semibold text-[#1C1C1C] leading-tight"
                          style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                        >
                          {m.title}
                        </h3>
                        <p className="text-xs text-[#A3A3A3] mt-1">{m.company}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#C108AB] bg-[rgba(193,8,171,0.08)] whitespace-nowrap">
                      {m.seniority}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                    <div className="flex items-center gap-1.5 text-[#525252]">
                      <MapPin className="w-3.5 h-3.5 text-[#A3A3A3]" />
                      {m.location}
                    </div>
                    <div className="flex items-center gap-1.5 text-[#525252]">
                      <DollarSign className="w-3.5 h-3.5 text-[#A3A3A3]" />
                      ${m.salaryMin}K – ${m.salaryMax}K
                    </div>
                    <div className="flex items-center gap-1.5 text-[#525252]">
                      <Briefcase className="w-3.5 h-3.5 text-[#A3A3A3]" />
                      {m.func}
                    </div>
                    <div className="flex items-center gap-1.5 text-[#525252]">
                      <Calendar className="w-3.5 h-3.5 text-[#A3A3A3]" />
                      {formatPosted(m.postedDaysAgo)}
                    </div>
                  </div>

                  <div className="mt-auto flex items-center gap-2 pt-4 border-t border-[#E5E5E5]">
                    <Button size="sm" onClick={() => applyNow(m.id)}>
                      Apply Now
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => goToDetail(m.id)}>
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0d0a14] text-white">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div
            className="text-sm font-bold"
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            Candidate Portal — by LYC Intelligence
          </div>
          <nav className="flex gap-6 text-xs text-white/60">
            <a href="/candidates" className="hover:text-white transition-colors no-underline">Home</a>
            <a href="/candidates/mandates" className="hover:text-white transition-colors no-underline">Mandates</a>
            <a href="/candidates/apply" className="hover:text-white transition-colors no-underline">Apply</a>
          </nav>
          <div className="text-[11px] text-white/40">© 2026 LYC Partners</div>
        </div>
      </footer>
    </div>
  );
}

export default BrowseMandatesPage;
