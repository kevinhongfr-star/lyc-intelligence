import React, { useState } from 'react';
import {
  MapPin,
  DollarSign,
  Building2,
  Check,
  ArrowRight,
  Clock,
  FileText,
  Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

/**
 * MandateDetailPublicPage — public, no auth required.
 * Renders a single anonymized executive mandate and a similar-mandates sidebar.
 *
 * Brand rules:
 *  - DM Sans body font, Libre Baskerville headings
 *  - Fuchsia #C108AB primary, sharp corners (no rounded-*)
 *  - NEVER use "free" — use "Complimentary"
 *  - Company is anonymized as "Confidential Client"
 *  - Apply CTA links to /candidates/apply/:id
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
  description: string;
  requirements: string[];
  responsibilities: string[];
}

interface SimilarMandate {
  id: string;
  title: string;
  company: string;
  location: string;
  salaryMin: number;
  salaryMax: number;
}

const MANDATE: Mandate = {
  id: 'm-1001',
  title: 'Chief Financial Officer',
  company: 'Confidential Client',
  industry: 'Financial Services',
  location: 'Shanghai',
  seniority: 'C-Level',
  func: 'Finance',
  salaryMin: 280,
  salaryMax: 340,
  postedDaysAgo: 3,
  description:
    'A high-growth FinTech platform backed by tier-one investors is seeking a Chief Financial Officer to lead its capital strategy, scale finance operations, and prepare the business for its next funding round. Reporting directly to the CEO and Board, the CFO will own financial planning, treasury, controllership, and investor relations — partnering closely with the executive team to drive disciplined growth across the APAC region. This is a confidential search; the client name is disclosed only after mutual interest is established under NDA.',
  requirements: [
    '15+ years of progressive finance experience, with at least 5 years in a CFO or VP Finance role',
    'Prior experience scaling a high-growth technology or financial services business',
    'Deep expertise in capital markets, fund-raising, and investor relations',
    'Strong command of APAC regulatory and tax frameworks',
    'Track record of building and leading high-performing finance teams',
    'Bilingual fluency in English and Mandarin preferred',
  ],
  responsibilities: [
    'Own the company financial strategy, planning, and forecasting end-to-end',
    'Lead the next funding round and manage relationships with current and prospective investors',
    'Establish robust controllership, treasury, and compliance operations',
    'Partner with the CEO on corporate development, M&A, and strategic partnerships',
    'Drive financial discipline and unit-economics optimization across business units',
    'Present financial performance and outlook to the Board on a regular cadence',
  ],
};

const SIMILAR: SimilarMandate[] = [
  {
    id: 'm-1008',
    title: 'VP, Corporate Development',
    company: 'Confidential Client',
    location: 'Hong Kong',
    salaryMin: 240,
    salaryMax: 300,
  },
  {
    id: 'm-1004',
    title: 'SVP, Operations',
    company: 'Confidential Client',
    location: 'Beijing',
    salaryMin: 200,
    salaryMax: 260,
  },
  {
    id: 'm-1005',
    title: 'General Manager, APAC',
    company: 'Confidential Client',
    location: 'Hong Kong',
    salaryMin: 300,
    salaryMax: 380,
  },
];

function formatPosted(daysAgo: number): string {
  if (daysAgo <= 0) return 'Today';
  if (daysAgo === 1) return '1 day ago';
  if (daysAgo < 30) return `${daysAgo} days ago`;
  const months = Math.round(daysAgo / 30);
  return months === 1 ? '1 month ago' : `${months} months ago`;
}

export function MandateDetailPublicPage() {
  const [applying, setApplying] = useState(false);

  const handleApply = () => {
    setApplying(true);
    window.location.href = `/candidates/apply/${MANDATE.id}`;
  };

  const goToMandate = (id: string) => {
    window.location.href = `/candidates/mandates/${id}`;
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
              href="/candidates/mandates"
              className="text-sm text-[#525252] hover:text-[#C108AB] transition-colors no-underline hidden sm:inline"
            >
              Browse Mandates
            </a>
            <Button size="sm" onClick={handleApply}>
              Apply Now
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Mandate header */}
      <section className="bg-white border-b border-[#E5E5E5]">
        <div className="max-w-6xl mx-auto px-6 py-12 md:py-16">
          <a
            href="/candidates/mandates"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#525252] hover:text-[#C108AB] transition-colors no-underline mb-6"
          >
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            Back to all mandates
          </a>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-[rgba(193,8,171,0.08)] flex items-center justify-center flex-shrink-0">
                <Building2 className="w-7 h-7 text-[#C108AB]" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#C108AB] bg-[rgba(193,8,171,0.08)]">
                    {MANDATE.seniority}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-[#A3A3A3]">
                    <Clock className="w-3 h-3" />
                    Posted {formatPosted(MANDATE.postedDaysAgo)}
                  </span>
                </div>
                <h1
                  className="text-2xl md:text-4xl font-bold tracking-tight text-[#1C1C1C] leading-tight"
                  style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                >
                  {MANDATE.title}
                </h1>
                <p className="text-sm text-[#525252] mt-2 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[#A3A3A3]" />
                  {MANDATE.company}
                </p>
              </div>
            </div>
          </div>

          {/* Key facts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            <div className="bg-[#F7F7F7] border border-[#E5E5E5] p-4 flex items-center gap-3">
              <MapPin className="w-5 h-5 text-[#C108AB] flex-shrink-0" />
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#A3A3A3]">Location</div>
                <div className="text-sm font-semibold text-[#1C1C1C]">{MANDATE.location}</div>
              </div>
            </div>
            <div className="bg-[#F7F7F7] border border-[#E5E5E5] p-4 flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-[#C108AB] flex-shrink-0" />
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#A3A3A3]">Salary Range</div>
                <div className="text-sm font-semibold text-[#1C1C1C]">
                  ${MANDATE.salaryMin}K – ${MANDATE.salaryMax}K
                </div>
              </div>
            </div>
            <div className="bg-[#F7F7F7] border border-[#E5E5E5] p-4 flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-[#C108AB] flex-shrink-0" />
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#A3A3A3]">Function</div>
                <div className="text-sm font-semibold text-[#1C1C1C]">
                  {MANDATE.func} · {MANDATE.industry}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Body + sidebar */}
      <section className="px-6 py-12 md:py-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-10">
            {/* Job description */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-[#C108AB]" />
                <h2
                  className="text-xl font-bold text-[#1C1C1C]"
                  style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                >
                  Job Description
                </h2>
              </div>
              <div className="bg-white border border-[#E5E5E5] p-6">
                <p className="text-sm text-[#525252] leading-relaxed">{MANDATE.description}</p>
              </div>
            </div>

            {/* Requirements */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Check className="w-4 h-4 text-[#C108AB]" />
                <h2
                  className="text-xl font-bold text-[#1C1C1C]"
                  style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                >
                  Requirements
                </h2>
              </div>
              <div className="bg-white border border-[#E5E5E5] p-6">
                <ul className="flex flex-col gap-3">
                  {MANDATE.requirements.map((r, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-[#525252] leading-relaxed">
                      <Check className="w-4 h-4 text-[#16A34A] flex-shrink-0 mt-0.5" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Responsibilities */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <ArrowRight className="w-4 h-4 text-[#C108AB]" />
                <h2
                  className="text-xl font-bold text-[#1C1C1C]"
                  style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                >
                  Responsibilities
                </h2>
              </div>
              <div className="bg-white border border-[#E5E5E5] p-6">
                <ul className="flex flex-col gap-3">
                  {MANDATE.responsibilities.map((r, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-[#525252] leading-relaxed">
                      <ArrowRight className="w-4 h-4 text-[#C108AB] flex-shrink-0 mt-0.5" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Apply CTA */}
            <div className="relative overflow-hidden bg-[#C108AB] p-8 md:p-10">
              <div
                className="absolute -top-16 left-1/2 -translate-x-1/2 w-[400px] h-[240px] pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)' }}
                aria-hidden="true"
              />
              <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div>
                  <h3
                    className="text-xl md:text-2xl font-bold text-white tracking-tight mb-2"
                    style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                  >
                    Ready to apply?
                  </h3>
                  <p className="text-sm text-white/85 leading-relaxed max-w-md">
                    Applications are confidential and reviewed within 48 hours. A Complimentary
                    executive assessment is included with your application.
                  </p>
                </div>
                <Button
                  size="lg"
                  variant="outline"
                  className="!bg-white !text-[#C108AB] !border-white hover:!bg-white/90 flex-shrink-0"
                  onClick={handleApply}
                  disabled={applying}
                  aria-busy={applying}
                >
                  Apply Now
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-[#E5E5E5] p-6 sticky top-24">
              <h3
                className="text-base font-bold text-[#1C1C1C] mb-1"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                Similar Mandates
              </h3>
              <p className="text-xs text-[#A3A3A3] mb-5">Curated roles matching this mandate</p>
              <div className="flex flex-col gap-3">
                {SIMILAR.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => goToMandate(s.id)}
                    className="text-left bg-[#F7F7F7] border border-[#E5E5E5] p-4 transition-all duration-200 hover:border-[#C108AB] hover:shadow-[0_4px_12px_rgba(193,8,171,0.08)] cursor-pointer"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 bg-[rgba(193,8,171,0.08)] flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-4 h-4 text-[#C108AB]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4
                          className="text-sm font-semibold text-[#1C1C1C] leading-tight"
                          style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                        >
                          {s.title}
                        </h4>
                        <p className="text-[11px] text-[#A3A3A3] mt-0.5">{s.company}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-[#525252]">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#A3A3A3]" />
                            {s.location}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <DollarSign className="w-3 h-3 text-[#A3A3A3]" />
                            ${s.salaryMin}K – ${s.salaryMax}K
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-[#A3A3A3] flex-shrink-0 mt-1" />
                    </div>
                  </button>
                ))}
              </div>
              <a
                href="/candidates/mandates"
                className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-[#C108AB] hover:text-[#A50798] transition-colors no-underline"
              >
                View all mandates
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </aside>
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

export default MandateDetailPublicPage;
