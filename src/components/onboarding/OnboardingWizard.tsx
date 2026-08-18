/**
 * OnboardingWizard — First-time user onboarding (S4-T07)
 *
 * Shown as a modal overlay when an authenticated user has not yet completed
 * onboarding (profile.onboarded_at is null). Steps:
 *   1. Welcome + role selection (Candidate / Client / Council Member / Consultant)
 *   2. Profile completion (name, company, title)
 *   3. Guided tour of key features (3 highlights)
 *   4. CTA to the primary action for the chosen role
 *
 * Skip and completion both persist `onboarded_at` so returning users are not
 * re-prompted. The wizard is intentionally lightweight — no separate table;
 * it reuses the `profiles` row via `updateProfile`.
 */
import React, { useState } from 'react';
import {
  X, ArrowRight, ArrowLeft, Check, User, Building2, Users, Briefcase,
  Sparkles, LayoutDashboard, Search, MessageSquare,
} from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';

type RoleChoice = 'candidate' | 'client' | 'council' | 'consultant';

interface RoleOption {
  id: RoleChoice;
  label: string;
  icon: React.ReactNode;
  blurb: string;
  cta: { label: string; href: string };
}

const ROLES: RoleOption[] = [
  {
    id: 'candidate',
    label: 'Candidate',
    icon: <User className="w-5 h-5" />,
    blurb: 'Track applications, view your pipeline ranking, and prep for interviews.',
    cta: { label: 'Go to my dashboard', href: '/candidate/dashboard' },
  },
  {
    id: 'client',
    label: 'Client / Hiring Company',
    icon: <Building2 className="w-5 h-5" />,
    blurb: 'View your mandates, ranked candidate shortlists, and pipeline status.',
    cta: { label: 'View client overview', href: '/client/overview' },
  },
  {
    id: 'council',
    label: 'Council Member',
    icon: <Users className="w-5 h-5" />,
    blurb: 'Access DEX AI advisory, peer connections, and exclusive events.',
    cta: { label: 'Start with DEX AI', href: '/dex-ai' },
  },
  {
    id: 'consultant',
    label: 'Consultant / Internal',
    icon: <Briefcase className="w-5 h-5" />,
    blurb: 'Manage mandates, pipeline, and candidate intelligence.',
    cta: { label: 'Open consultant dashboard', href: '/app/dashboard' },
  },
];

const TOUR_HIGHLIGHTS = [
  {
    icon: <LayoutDashboard className="w-5 h-5 text-fuchsia" />,
    title: 'Your dashboard',
    body: 'See your active items, pipeline status, and next actions at a glance.',
  },
  {
    icon: <Search className="w-5 h-5 text-fuchsia" />,
    title: 'Browse mandates',
    body: 'Explore open mandates and track where you stand with tiered rankings.',
  },
  {
    icon: <MessageSquare className="w-5 h-5 text-fuchsia" />,
    title: 'DEX AI advisory',
    body: 'Ask career and market questions — your first 5 messages are complimentary.',
  },
];

const TOTAL_STEPS = 4;

export function OnboardingWizard() {
  const { profile, updateProfile } = useAuthStore();
  const [open, setOpen] = useState(true);
  const [step, setStep] = useState(0); // 0=role, 1=profile, 2=tour, 3=cta
  const [role, setRole] = useState<RoleChoice | null>(null);
  const [name, setName] = useState(profile?.name ?? '');
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  // Only show for authenticated users who haven't completed onboarding.
  if (!profile || profile.onboarded_at || !open) return null;

  const finish = async (skip: boolean) => {
    setSaving(true);
    const updates: Record<string, unknown> = { onboarded_at: new Date().toISOString() };
    if (!skip) {
      if (name.trim()) updates.name = name.trim();
      if (company.trim()) updates.icp = company.trim();
      if (role) updates.active_surface = role;
    }
    await updateProfile(updates);
    setSaving(false);
    setOpen(false);
  };

  const next = () => setStep(s => Math.min(s + 1, TOTAL_STEPS - 1));
  const back = () => setStep(s => Math.max(s - 1, 0));

  const selectedRole = ROLES.find(r => r.id === role) ?? null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg bg-white shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-fuchsia/10 text-fuchsia flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-serif font-bold text-[#1A1A2E]">Welcome to LYC Intelligence</span>
          </div>
          <button
            type="button"
            onClick={() => finish(true)}
            disabled={saving}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label="Skip onboarding"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 pt-3">
          <div className="flex gap-1.5">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 ${i <= step ? 'bg-fuchsia' : 'bg-gray-200'}`}
              />
            ))}
          </div>
          <div className="text-xs text-gray-400 mt-1.5">Step {step + 1} of {TOTAL_STEPS}</div>
        </div>

        {/* Body */}
        <div className="px-6 py-6 min-h-[280px]">
          {step === 0 && (
            <div>
              <h2 className="text-lg font-semibold text-[#1A1A2E] mb-1">How will you use LYC Intelligence?</h2>
              <p className="text-sm text-gray-500 mb-4">Pick the option that fits you best — you can change this later.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ROLES.map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    className={`text-left p-4 border transition-colors ${
                      role === r.id
                        ? 'border-fuchsia bg-fuchsia/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-fuchsia">{r.icon}</span>
                      <span className="font-medium text-sm text-[#1A1A2E]">{r.label}</span>
                      {role === r.id && <Check className="w-4 h-4 text-fuchsia ml-auto" />}
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{r.blurb}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-lg font-semibold text-[#1A1A2E] mb-1">Complete your profile</h2>
              <p className="text-sm text-gray-500 mb-4">A few details so we can personalize your experience.</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Full name</label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Company / Organization</label>
                  <Input value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. LYC Partners" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Title / Role</label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Head of Talent" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-lg font-semibold text-[#1A1A2E] mb-1">Quick tour</h2>
              <p className="text-sm text-gray-500 mb-4">Here are the three things you'll use most.</p>
              <div className="space-y-3">
                {TOUR_HIGHLIGHTS.map((h, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 border border-gray-100 bg-gray-50">
                    <span className="flex-shrink-0 mt-0.5">{h.icon}</span>
                    <div>
                      <div className="font-medium text-sm text-[#1A1A2E]">{h.title}</div>
                      <div className="text-xs text-gray-500 leading-relaxed">{h.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && selectedRole && (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-fuchsia/10 text-fuchsia flex items-center justify-center mx-auto mb-4">
                {selectedRole.icon}
              </div>
              <h2 className="text-lg font-semibold text-[#1A1A2E] mb-1">You're all set!</h2>
              <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                Welcome aboard{role === 'candidate' ? ', candidate' : ''}. Head to your starting point —
                you can explore everything else from the navigation.
              </p>
              <a href={selectedRole.cta.href}>
                <Button>
                  {selectedRole.cta.label} <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
            </div>
          )}

          {step === 3 && !selectedRole && (
            <div className="text-center py-8">
              <h2 className="text-lg font-semibold text-[#1A1A2E] mb-1">You're all set!</h2>
              <p className="text-sm text-gray-500 mb-4">Pick a starting point from the navigation to begin.</p>
              <a href="/dashboard"><Button>Go to dashboard <ArrowRight className="w-4 h-4" /></Button></a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            type="button"
            onClick={() => finish(true)}
            disabled={saving}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Skip for now
          </button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button variant="outline" size="sm" onClick={back} disabled={saving}>
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </Button>
            )}
            {step < TOTAL_STEPS - 1 ? (
              <Button size="sm" onClick={next} disabled={step === 0 && !role}>
                Continue <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <Button size="sm" onClick={() => finish(false)} disabled={saving}>
                <Check className="w-3.5 h-3.5" /> {saving ? 'Saving…' : 'Finish'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OnboardingWizard;
