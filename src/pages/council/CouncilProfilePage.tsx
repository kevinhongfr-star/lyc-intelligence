import React, { useState } from 'react';
import {
  Crown,
  Coins,
  Upload,
  Check,
  Loader2,
  User,
  Briefcase,
  FileText,
  Award,
  Lock,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';

/**
 * Council Member Profile Editor (M6) — auth required.
 *
 * Editable member profile: name, title, company, bio, location, avatar.
 * Tier badge is read-only. Includes badges/achievements section.
 *
 * Brand rules:
 *  - NEVER use "free" — use "Executive Introduction" or "Complimentary"
 *  - Sharp corners only — no rounded-* classes
 */

interface Achievement {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  unlocked: boolean;
}

const INITIAL_PROFILE = {
  name: 'Sarah Chen',
  title: 'VP Strategy',
  company: 'Fortune 500 Tech',
  location: 'Shanghai, China',
  bio: 'Strategy executive focused on growth-stage market entry and corporate development across APAC. Board observer at two portfolio companies. Council member since 2026.',
  tier: 'Founding' as const,
};

const ACHIEVEMENTS: Achievement[] = [
  { id: 'a1', label: 'Founding Member', description: 'One of the first 20 Council members', icon: Crown, unlocked: true },
  { id: 'a2', label: 'Coaching Milestone', description: 'Completed 5 coaching sessions', icon: Award, unlocked: true },
  { id: 'a3', label: 'Community Voice', description: 'Posted 10+ insights to the feed', icon: Sparkles, unlocked: true },
  { id: 'a4', label: 'Connector', description: 'Connected with 25+ members', icon: User, unlocked: true },
  { id: 'a5', label: 'Event Regular', description: 'Attended 10 Council events', icon: Briefcase, unlocked: false },
  { id: 'a6', label: 'Mentor', description: 'Hosted a member roundtable', icon: Award, unlocked: false },
];

export function CouncilProfilePage() {
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleField = (field: keyof typeof profile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
    }, 700);
  };

  const handleAvatarUpload = () => {
    setUploadingAvatar(true);
    setTimeout(() => setUploadingAvatar(false), 900);
  };

  return (
    <div
      className="min-h-screen bg-[#F7F7F7] text-[#1C1C1C]"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      {/* Member nav */}
      <nav className="bg-white border-b border-[#E5E5E5] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a
            href="/council/dashboard"
            className="font-bold text-base tracking-tight text-[#1C1C1C] no-underline"
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            The Council
          </a>
          <div className="hidden md:flex items-center gap-6">
            <a href="/council/dashboard" className="text-sm text-[#525252] hover:text-[#C108AB] transition-colors no-underline">Dashboard</a>
            <a href="/council/coaching" className="text-sm text-[#525252] hover:text-[#C108AB] transition-colors no-underline">Coaching</a>
            <a href="/council/community" className="text-sm text-[#525252] hover:text-[#C108AB] transition-colors no-underline">Community</a>
            <a href="/council/directory" className="text-sm text-[#525252] hover:text-[#C108AB] transition-colors no-underline">Directory</a>
            <a href="/council/benefits" className="text-sm text-[#525252] hover:text-[#C108AB] transition-colors no-underline">Benefits</a>
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[rgba(193,8,171,0.08)] text-[#C108AB] text-xs font-semibold">
              <Coins className="w-3.5 h-3.5" />
              9 credits
            </div>
            <Button size="sm" variant="outline" onClick={() => (window.location.href = '/council/profile')}>
              <Crown className="w-3.5 h-3.5" />
              Sarah
            </Button>
          </div>
        </div>
      </nav>

      {/* Header */}
      <header className="bg-white border-b border-[#E5E5E5]">
        <div className="max-w-4xl mx-auto px-6 py-10 md:py-12">
          <div className="text-xs font-bold uppercase tracking-[2.5px] text-[#C108AB] mb-3">
            My Profile
          </div>
          <h1
            className="text-2xl md:text-4xl font-bold tracking-tight text-[#1C1C1C]"
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            Edit your member profile
          </h1>
          <p className="text-sm text-[#525252] mt-2 max-w-xl leading-relaxed">
            This is how you appear in the member directory. Your tier is set by your membership and cannot be edited here.
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Avatar + tier */}
        <Card className="border border-[#E5E5E5] bg-white p-6 !shadow-none">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            {/* Avatar upload area */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative w-24 h-24 bg-[#C108AB] flex items-center justify-center">
                <span
                  className="text-2xl font-bold text-white"
                  style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
                >
                  {profile.name.split(' ').map((n) => n[0]).join('')}
                </span>
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
              </div>
              <Button size="xs" variant="outline" onClick={handleAvatarUpload} disabled={uploadingAvatar} aria-busy={uploadingAvatar}>
                <Upload className="w-3.5 h-3.5" />
                {uploadingAvatar ? 'Uploading…' : 'Upload photo'}
              </Button>
            </div>

            <div className="flex-1 min-w-0">
              <h2
                className="text-lg font-bold text-[#1C1C1C]"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                {profile.name}
              </h2>
              <p className="text-sm text-[#525252] mt-0.5">{profile.title}, {profile.company}</p>

              {/* Read-only tier badge */}
              <div className="mt-4 flex items-center gap-2">
                <div className="inline-flex items-center gap-1.5 bg-[rgba(193,8,171,0.08)] text-[#C108AB] text-[11px] font-semibold uppercase tracking-widest px-3 py-1.5">
                  <Crown className="w-3.5 h-3.5" />
                  {profile.tier} Member
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] text-[#A3A3A3]">
                  <Lock className="w-3 h-3" />
                  Set by membership
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Editable fields */}
        <Card className="border border-[#E5E5E5] bg-white !shadow-none">
          <div className="px-6 py-5 border-b border-[#E5E5E5]">
            <h2
              className="text-base font-bold text-[#1C1C1C]"
              style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
            >
              Profile details
            </h2>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="profile-name" className="block text-xs font-semibold uppercase tracking-wide text-[#525252] mb-2">
                  Full name
                </label>
                <Input
                  id="profile-name"
                  value={profile.name}
                  onChange={(e) => handleField('name', e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="profile-title" className="block text-xs font-semibold uppercase tracking-wide text-[#525252] mb-2">
                  Title
                </label>
                <Input
                  id="profile-title"
                  value={profile.title}
                  onChange={(e) => handleField('title', e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="profile-company" className="block text-xs font-semibold uppercase tracking-wide text-[#525252] mb-2">
                  Company
                </label>
                <Input
                  id="profile-company"
                  value={profile.company}
                  onChange={(e) => handleField('company', e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="profile-location" className="block text-xs font-semibold uppercase tracking-wide text-[#525252] mb-2">
                  Location
                </label>
                <Input
                  id="profile-location"
                  value={profile.location}
                  onChange={(e) => handleField('location', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="profile-bio" className="block text-xs font-semibold uppercase tracking-wide text-[#525252] mb-2">
                Bio
              </label>
              <textarea
                id="profile-bio"
                value={profile.bio}
                onChange={(e) => handleField('bio', e.target.value)}
                rows={4}
                className="w-full px-4 py-2.5 bg-[#FFFFFF] border border-[#E5E5E5] text-sm text-[#1C1C1C] placeholder:text-[#A3A3A3] focus:outline-none focus:border-[#C108AB]/40 focus:shadow-[0_0_0_3px_rgba(193,8,171,0.06)] transition-all duration-200 resize-none"
              />
              <p className="text-[11px] text-[#A3A3A3] mt-1.5">Visible to other members in the directory.</p>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-[#E5E5E5] bg-[#FAFAFA] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-[#525252]">
              {saved ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                  <span className="text-[#16A34A] font-medium">All changes saved</span>
                </>
              ) : (
                <FileText className="w-3.5 h-3.5 text-[#A3A3A3]" />
              )}
            </div>
            <Button onClick={handleSave} disabled={saving || saved} aria-busy={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving…
                </>
              ) : saved ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved
                </>
              ) : (
                'Save changes'
              )}
            </Button>
          </div>
        </Card>

        {/* Badges / achievements */}
        <Card className="border border-[#E5E5E5] bg-white !shadow-none">
          <div className="px-6 py-5 border-b border-[#E5E5E5] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#C108AB]" />
              <h2
                className="text-base font-bold text-[#1C1C1C]"
                style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
              >
                Badges & achievements
              </h2>
            </div>
            <Badge variant="fuchsia">
              {ACHIEVEMENTS.filter((a) => a.unlocked).length} / {ACHIEVEMENTS.length} unlocked
            </Badge>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ACHIEVEMENTS.map((ach) => {
              const Icon = ach.icon;
              return (
                <div
                  key={ach.id}
                  className={`flex items-start gap-3 p-4 border ${
                    ach.unlocked
                      ? 'border-[#E5E5E5] bg-white'
                      : 'border-dashed border-[#E5E5E5] bg-[#FAFAFA] opacity-70'
                  }`}
                >
                  <div
                    className={`w-9 h-9 flex items-center justify-center flex-shrink-0 ${
                      ach.unlocked ? 'bg-[rgba(193,8,171,0.08)]' : 'bg-[#F0F0F0]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${ach.unlocked ? 'text-[#C108AB]' : 'text-[#A3A3A3]'}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${ach.unlocked ? 'text-[#1C1C1C]' : 'text-[#525252]'}`}>
                        {ach.label}
                      </span>
                      {ach.unlocked ? (
                        <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-[#A3A3A3]" />
                      )}
                    </div>
                    <p className="text-xs text-[#525252] mt-0.5 leading-relaxed">{ach.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-[#0d0a14] text-white mt-8">
        <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm font-bold" style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}>
            The Council — Profile
          </div>
          <nav className="flex gap-6 text-xs text-white/60">
            <a href="/council/dashboard" className="hover:text-white transition-colors no-underline">Dashboard</a>
            <a href="/council/directory" className="hover:text-white transition-colors no-underline">Directory</a>
            <a href="/council/benefits" className="hover:text-white transition-colors no-underline">Benefits</a>
          </nav>
          <div className="text-[11px] text-white/40">© 2026 LYC Partners</div>
        </div>
      </footer>
    </div>
  );
}
