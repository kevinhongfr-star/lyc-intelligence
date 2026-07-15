import React, { useState } from 'react';
import {
  Search,
  Brain,
  TrendingUp,
  Shield,
  ArrowRight,
  Check,
  Briefcase,
  Users,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

/**
 * CandidateLandingPage — public, no auth required.
 * Converts executive visitors → candidate portal / mandate applications.
 *
 * Brand rules:
 *  - DM Sans body font, Libre Baskerville headings
 *  - Fuchsia #C108AB primary, sharp corners (no rounded-*)
 *  - NEVER use "free" — use "Complimentary"
 */

interface Feature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}

const FEATURES: Feature[] = [
  {
    icon: Search,
    title: 'Exclusive Mandates',
    desc: 'Access senior and C-suite mandates that never reach public job boards — sourced through our trusted partner network.',
  },
  {
    icon: Brain,
    title: 'AI-Powered Matching',
    desc: 'Our matching engine aligns your leadership profile, trajectory, and goals against each mandate to surface the right fits.',
  },
  {
    icon: TrendingUp,
    title: 'Career Intelligence',
    desc: 'Benchmark your positioning against live executive markets and understand exactly where you stand and where to go.',
  },
  {
    icon: Shield,
    title: 'Confidential Process',
    desc: 'Your search stays discreet. Control who sees your profile and engage with mandates entirely on your terms.',
  },
];

const STATS = [
  { label: 'Active Mandates', value: '50+' },
  { label: 'Placements', value: '200+' },
  { label: 'Satisfaction', value: '95%' },
];

interface Step {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}

const STEPS: Step[] = [
  {
    icon: Users,
    title: 'Apply',
    desc: 'Create your profile and apply for mandates that match your trajectory. Applications are reviewed within 48 hours.',
  },
  {
    icon: Target,
    title: 'Assess',
    desc: 'Complete a Complimentary executive assessment so our partners can benchmark your fit and leadership archetype.',
  },
  {
    icon: Briefcase,
    title: 'Connect',
    desc: 'Engage directly with hiring partners under NDA. Move forward only on mandates that fit your goals.',
  },
];

export function CandidateLandingPage() {
  const [navigating, setNavigating] = useState(false);

  const goToMandates = () => {
    setNavigating(true);
    window.location.href = '/candidates/mandates';
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
            <Button size="sm" onClick={goToMandates}>
              Find a Role
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-white border-b border-[#E5E5E5]">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[420px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(193,8,171,0.08) 0%, transparent 70%)' }}
          aria-hidden="true"
        />
        <div className="relative max-w-4xl mx-auto px-6 py-24 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 bg-[rgba(193,8,171,0.08)] text-[#C108AB] text-xs font-semibold uppercase tracking-widest">
            <Briefcase className="w-3 h-3" />
            For Senior Leaders
          </div>
          <h1
            className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05] mb-6 text-[#1C1C1C]"
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            Find Your Next
            <br />
            <span className="text-[#C108AB]">Executive Role</span>
          </h1>
          <p className="text-base md:text-lg text-[#525252] max-w-2xl mx-auto mb-10 leading-relaxed">
            Access exclusive executive mandates that never appear on public boards.
            Our partners source confidential C-suite and VP-level roles — matched to your
            trajectory and surfaced with discretion.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" onClick={goToMandates} disabled={navigating} aria-busy={navigating}>
              Browse Mandates
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => (window.location.href = '/candidates/apply')}>
              Start Application
            </Button>
          </div>

          {/* Stats row */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-3xl mx-auto">
            {STATS.map((s) => (
              <div key={s.label}>
                <div
                  className="text-3xl md:text-4xl font-bold text-[#1C1C1C]"
                  style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                >
                  {s.value}
                </div>
                <div className="text-[10px] md:text-xs uppercase tracking-wider text-[#A3A3A3] mt-1">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-20 md:py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-xs font-bold uppercase tracking-[2.5px] text-[#C108AB] mb-3">
              Why Candidates Choose Us
            </div>
            <h2
              className="text-2xl md:text-4xl font-bold tracking-tight text-[#1C1C1C]"
              style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
            >
              Built for the executive search
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="bg-white border border-[#E5E5E5] p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(26,23,20,0.08)]"
                >
                  <div className="w-10 h-10 bg-[rgba(193,8,171,0.08)] flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-[#C108AB]" />
                  </div>
                  <h3
                    className="text-base font-semibold text-[#1C1C1C] mb-2"
                    style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                  >
                    {f.title}
                  </h3>
                  <p className="text-sm text-[#525252] leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white border-y border-[#E5E5E5] py-20 md:py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-xs font-bold uppercase tracking-[2.5px] text-[#C108AB] mb-3">
              How It Works
            </div>
            <h2
              className="text-2xl md:text-4xl font-bold tracking-tight text-[#1C1C1C]"
              style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
            >
              Three steps to your next role
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="relative flex flex-col items-center text-center">
                  <div className="absolute -top-4 -left-2 text-6xl font-bold text-[rgba(193,8,171,0.06)] select-none" aria-hidden="true">
                    {i + 1}
                  </div>
                  <div className="relative w-14 h-14 bg-[#C108AB] flex items-center justify-center mb-5">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3
                    className="text-lg font-semibold text-[#1C1C1C] mb-2"
                    style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                  >
                    {step.title}
                  </h3>
                  <p className="text-sm text-[#525252] leading-relaxed max-w-xs">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="px-6 py-20 md:py-24">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden bg-[#C108AB] px-8 py-14 md:px-14 md:py-16 text-center">
            <div
              className="absolute -top-20 left-1/2 -translate-x-1/2 w-[500px] h-[300px] pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)' }}
              aria-hidden="true"
            />
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-5 bg-white/15 text-white text-xs font-semibold uppercase tracking-widest">
                <Target className="w-3 h-3" />
                Ready to Move?
              </div>
              <h2
                className="text-2xl md:text-4xl font-bold text-white mb-4 tracking-tight"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                Discover mandates matched to you
              </h2>
              <p className="text-sm md:text-base text-white/85 max-w-xl mx-auto mb-8 leading-relaxed">
                Start with a Complimentary executive assessment, or browse our active
                mandates today. Every application is confidential and reviewed within 48 hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  size="lg"
                  variant="outline"
                  className="!bg-white !text-[#C108AB] !border-white hover:!bg-white/90"
                  onClick={goToMandates}
                >
                  Browse Mandates
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button
                  size="lg"
                  className="!bg-[#1C1C1C] !text-white hover:!bg-black"
                  onClick={() => (window.location.href = '/candidates/apply')}
                >
                  Start Application
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/80">
                <span className="inline-flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> Confidential by default
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> Complimentary assessment
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> 48-hour review
                </span>
              </div>
            </div>
          </div>
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

export default CandidateLandingPage;
