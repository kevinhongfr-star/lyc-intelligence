/**
 * DexLandingPage — Public B2C landing page for DEX AI (S2-T01)
 *
 * Value proposition: AI-powered executive advisory for China-APAC leaders.
 * "Executive Introduction" = 5 complimentary messages (NEVER use the word "free").
 */
import React from 'react';
import { Sparkles, ArrowRight, Brain, LineChart, Compass, Shield } from 'lucide-react';
import { Button } from '@/components/ui';

export function DexLandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-white text-gray-900">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 text-teal-600 text-xs font-semibold uppercase tracking-wide mb-5">
              <Sparkles className="w-3 h-3" />
              Executive Introduction · 5 Complimentary Messages
            </div>
            <h1
              className="text-4xl md:text-5xl font-bold leading-tight mb-4"
              style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
            >
              AI-powered executive advisory for China-APAC leaders
            </h1>
            <p className="text-base md:text-lg text-gray-600 leading-relaxed mb-8 max-w-2xl">
              DEX AI is your always-on advisor for career strategy, compensation benchmarking, and
              cross-border transitions — trained on LYC Partners' placement intelligence across 7,400+
              executive mandates.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="/dex/chat">
                <Button size="lg">
                  Start Your Executive Introduction <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
              <a href="/dex/assess">
                <Button size="lg" variant="outline" className="border-gray-300 text-gray-900 hover:bg-gray-100">
                  Take the Assessment
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2
            className="text-3xl md:text-4xl font-bold text-[#1A1A2E] mb-3"
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            What DEX AI can do for you
          </h2>
          <p className="text-sm text-gray-600">
            Four pillars of executive intelligence, available the moment you need them.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Brain, title: 'Career Strategy', desc: 'Map your next move with placement data from 7,400+ mandates.' },
            { icon: LineChart, title: 'Compensation Benchmarking', desc: 'Know your market worth across China and APAC roles.' },
            { icon: Compass, title: 'Cross-Border Transitions', desc: 'Navigate moves between Shanghai, Singapore, and Hong Kong.' },
            { icon: Shield, title: 'Confidential Advisory', desc: 'Private, judgment-free guidance from a trusted partner.' },
          ].map(f => (
            <div key={f.title} className="p-6 border border-gray-100 hover:border-fuchsia/30 transition-colors">
              <div className="w-10 h-10 bg-fuchsia/10 text-fuchsia flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-[#1A1A2E] mb-2">{f.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing preview */}
      <section className="bg-[#F8F8FB]">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-16 md:py-20">
          <div className="text-center mb-10">
            <h2
              className="text-3xl md:text-4xl font-bold text-[#1A1A2E] mb-3"
              style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
            >
              Simple, credit-based access
            </h2>
            <p className="text-sm text-gray-600">
              Begin with your Executive Introduction — 5 complimentary messages. No card required.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { name: 'Executive Introduction', price: 'Complimentary', detail: '5 messages to experience DEX AI', cta: 'Start Now', href: '/dex/chat' },
              { name: 'Credit Pack', price: 'Pay as you go', detail: '1 credit per message — buy what you need', cta: 'Get Credits', href: '/dex/credits' },
              { name: 'Monthly Pro', price: 'Subscription', detail: '100 credits/month + priority responses', cta: 'View Plans', href: '/dex/credits' },
            ].map(p => (
              <div key={p.name} className="bg-white p-6 border border-gray-100 flex flex-col">
                <h3 className="font-semibold text-[#1A1A2E] mb-1">{p.name}</h3>
                <div className="text-fuchsia font-bold text-lg mb-2">{p.price}</div>
                <p className="text-sm text-gray-600 mb-5 flex-1">{p.detail}</p>
                <a href={p.href}>
                  <Button variant="outline" className="w-full">{p.cta}</Button>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coaching CTA */}
      <section className="max-w-4xl mx-auto px-4 md:px-6 py-16 md:py-20 text-center">
        <h2
          className="text-3xl md:text-4xl font-bold text-[#1A1A2E] mb-4"
          style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
        >
          Ready for 1:1 guidance?
        </h2>
        <p className="text-sm text-gray-600 mb-8 max-w-xl mx-auto">
          Book a confidential coaching session with a senior LYC Partners consultant. One credit per session.
        </p>
        <a href="/dex/book">
          <Button size="lg">Book a Coaching Session <ArrowRight className="w-4 h-4" /></Button>
        </a>
      </section>
    </div>
  );
}

export default DexLandingPage;
