/**
 * Public Homepage — LYC Intelligence marketing site
 * Spec 18: Public Site & Activation Flows
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, Target, BarChart3, Shield, Zap, CheckCircle } from 'lucide-react';
import { Button, Card, Badge } from '@/components/ui';

const FEATURES = [
  {
    icon: <Users className="w-6 h-6" />,
    title: 'Executive Network',
    description: 'Connect with verified C-suite executives across industries. Peer introductions, not cold outreach.',
  },
  {
    icon: <Target className="w-6 h-6" />,
    title: 'Intelligence Platform',
    description: 'Real-time market signals, company health scores, and AI-powered insights for strategic decisions.',
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: 'Leadership Analytics',
    description: 'Track your executive career trajectory with SHIFT assessments and personalized development paths.',
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Confidential & Secure',
    description: 'Chatham House Rule discussions. Your data stays yours. Enterprise-grade security.',
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'AI Assistant',
    description: 'DEX AI helps you navigate opportunities, prepare for interviews, and negotiate offers.',
  },
];

const TESTIMONIALS = [
  {
    quote: "LYC Intelligence gave me access to opportunities I never would have found through traditional channels. The peer network alone is worth it.",
    author: 'Sarah Chen',
    title: 'Former CFO, Tech Unicorn → CEO, Series B Startup',
  },
  {
    quote: "The intelligence layer helped me time my exit perfectly. Market signals I wouldn't have caught otherwise.",
    author: 'Michael Torres',
    title: 'VP Engineering → CTO, Fortune 500',
  },
  {
    quote: "SHIFT showed me my leadership blind spots. The coaching recommendations were spot-on.",
    author: 'Priya Sharma',
    title: 'SVP Operations → COO, Growth Stage Company',
  },
];

const LOGOS = [
  'TechCorp', 'FinanceHub', 'GrowthCo', 'DataScale', 'CloudFirst', 'InnovateLabs',
];

export function PublicHomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#E5E5E5]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#C108AB]" style={{ borderRadius: 0 }} />
            <span className="font-serif font-bold text-lg text-[#171717]">LYC Intelligence</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/features" className="text-sm text-[#737373] hover:text-[#171717] transition-colors">
              Features
            </Link>
            <Link to="/pricing" className="text-sm text-[#737373] hover:text-[#171717] transition-colors">
              Pricing
            </Link>
            <Link to="/council" className="text-sm text-[#737373] hover:text-[#171717] transition-colors">
              Council
            </Link>
            <Link to="/faq" className="text-sm text-[#737373] hover:text-[#171717] transition-colors">
              FAQ
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <Badge className="mb-4 bg-[#C108AB]/10 text-[#C108AB]">Executive Intelligence Platform</Badge>
            <h1 className="font-serif font-bold text-5xl md:text-6xl text-[#171717] leading-tight mb-6">
              The AI-Native Platform for{' '}
              <span className="text-[#C108AB]">Executive Intelligence</span>
            </h1>
            <p className="text-xl text-[#737373] mb-8 max-w-2xl">
              Connect with top executives, access market intelligence, and make data-driven leadership decisions.
              Your next career move, powered by AI and human expertise.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/signup">
                <Button size="lg">
                  Start for Executive Introduction
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/book-demo">
                <Button variant="outline" size="lg">Book a Demo</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-[#FAFAFA]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif font-bold text-3xl text-[#171717] mb-4">
              Built for Executive Leaders
            </h2>
            <p className="text-[#737373] max-w-xl mx-auto">
              Every feature designed for the unique needs of C-suite and senior executives.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <Card key={i} className="p-6" interactive>
                <div className="w-12 h-12 bg-[#C108AB]/10 flex items-center justify-center mb-4" style={{ borderRadius: 0 }}>
                  <div className="text-[#C108AB]">{feature.icon}</div>
                </div>
                <h3 className="font-semibold text-[#171717] mb-2">{feature.title}</h3>
                <p className="text-sm text-[#737373]">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif font-bold text-3xl text-[#171717] mb-4">
              Trusted by Industry Leaders
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((testimonial, i) => (
              <Card key={i} className="p-6">
                <p className="text-[#171717] mb-4 text-sm leading-relaxed">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold text-[#171717] text-sm">{testimonial.author}</p>
                  <p className="text-xs text-[#737373]">{testimonial.title}</p>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-[#E5E5E5]">
            <p className="text-center text-xs text-[#A3A3A3] mb-4">Trusted by executives from</p>
            <div className="flex flex-wrap justify-center gap-8">
              {LOGOS.map((logo, i) => (
                <span key={i} className="text-sm font-medium text-[#D4D4D4]">{logo}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-[#171717]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif font-bold text-3xl text-white mb-4">
            Ready to Elevate Your Executive Career?
          </h2>
          <p className="text-[#A3A3A3] mb-8">
            Join the network of 2,500+ verified executives. Your first introduction is free.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/signup">
              <Button size="lg">
                Get Started Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-[#E5E5E5]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-[#C108AB]" style={{ borderRadius: 0 }} />
                <span className="font-serif font-bold text-[#171717]">LYC Intelligence</span>
              </div>
              <p className="text-xs text-[#737373]">
                Executive intelligence platform by LYC Partners.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-[#171717] text-sm mb-3">Product</h4>
              <div className="space-y-2">
                <Link to="/features" className="block text-xs text-[#737373] hover:text-[#171717]">Features</Link>
                <Link to="/pricing" className="block text-xs text-[#737373] hover:text-[#171717]">Pricing</Link>
                <Link to="/council" className="block text-xs text-[#737373] hover:text-[#171717]">Council</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-[#171717] text-sm mb-3">Company</h4>
              <div className="space-y-2">
                <Link to="/about" className="block text-xs text-[#737373] hover:text-[#171717]">About</Link>
                <Link to="/careers" className="block text-xs text-[#737373] hover:text-[#171717]">Careers</Link>
                <Link to="/contact" className="block text-xs text-[#737373] hover:text-[#171717]">Contact</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-[#171717] text-sm mb-3">Legal</h4>
              <div className="space-y-2">
                <Link to="/privacy" className="block text-xs text-[#737373] hover:text-[#171717]">Privacy</Link>
                <Link to="/terms" className="block text-xs text-[#737373] hover:text-[#171717]">Terms</Link>
                <Link to="/cookies" className="block text-xs text-[#737373] hover:text-[#171717]">Cookies</Link>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-[#E5E5E5] text-center">
            <p className="text-xs text-[#A3A3A3]">© 2026 LYC Partners. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default PublicHomePage;