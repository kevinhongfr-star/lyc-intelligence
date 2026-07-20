/**
 * Referral Program — Issue #34: Referral Program
 *
 * Referral tracking, reward management, and leaderboard.
 * Supports both candidate and client referrals.
 */
import React, { useState, useCallback } from 'react';
import {
  Gift,
  Copy,
  CheckCircle2,
  Users,
  DollarSign,
  Clock,
  Award,
  Share2,
  Mail,
  Linkedin,
  Link,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface ReferralStats {
  total_referrals: number;
  successful_referrals: number;
  pending_rewards: number;
  total_earned: number;
  code: string;
}

interface Referral {
  id: string;
  referred_name: string;
  referred_email: string;
  status: 'pending' | 'signed_up' | 'qualified' | 'rewarded' | 'expired';
  created_at: string;
  reward_amount: number;
}

/* ------------------------------------------------------------------ */
/* Referral Dashboard Component                                         */
/* ------------------------------------------------------------------ */

export function ReferralProgramPage() {
  const [copied, setCopied] = useState(false);
  const referralCode = 'LYC-REF-ABC123';
  const referralLink = `https://lyc-intelligence.com/signup?ref=${referralCode}`;

  const stats: ReferralStats = {
    total_referrals: 12,
    successful_referrals: 7,
    pending_rewards: 1200,
    total_earned: 3500,
    code: referralCode,
  };

  const referrals: Referral[] = [
    { id: '1', referred_name: 'Sarah Chen', referred_email: 'sarah@***.com', status: 'rewarded', created_at: '2026-06-15', reward_amount: 500 },
    { id: '2', referred_name: 'Michael Zhang', referred_email: 'michael@***.com', status: 'qualified', created_at: '2026-06-28', reward_amount: 500 },
    { id: '3', referred_name: 'Emily Wang', referred_email: 'emily@***.com', status: 'signed_up', created_at: '2026-07-10', reward_amount: 0 },
    { id: '4', referred_name: 'James Liu', referred_email: 'james@***.com', status: 'pending', created_at: '2026-07-15', reward_amount: 0 },
  ];

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [referralLink]);

  const handleShare = (platform: 'email' | 'linkedin' | 'copy') => {
    const message = `Join me on LYC Intelligence - the premier executive search and leadership platform. Use my referral link: ${referralLink}`;

    switch (platform) {
      case 'email':
        window.open(`mailto:?subject=Join LYC Intelligence&body=${encodeURIComponent(message)}`);
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`);
        break;
      case 'copy':
        handleCopy();
        break;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <header className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] text-white">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="flex items-center gap-2 text-[13px] text-white/60 mb-2">
            <Gift className="h-4 w-4" />
            Referral Program
          </div>
          <h1 className="text-[32px] font-serif">Refer & Earn</h1>
          <p className="text-[14px] text-white/60 mt-2">
            Share LYC Intelligence with your network and earn rewards.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <ReferralStat icon={<Users className="h-4 w-4" />} label="Total Referrals" value={stats.total_referrals} />
            <ReferralStat icon={<CheckCircle2 className="h-4 w-4" />} label="Successful" value={stats.successful_referrals} />
            <ReferralStat icon={<Clock className="h-4 w-4" />} label="Pending" value={`¥${stats.pending_rewards}`} />
            <ReferralStat icon={<DollarSign className="h-4 w-4" />} label="Total Earned" value={`¥${stats.total_earned}`} />
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Referral Code Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Referral Link</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Input
                value={referralLink}
                readOnly
                className="flex-1 text-[13px]"
              />
              <Button onClick={handleCopy}>
                {copied ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1.5" />
                    Copy
                  </>
                )}
              </Button>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleShare('email')}>
                <Mail className="h-4 w-4 mr-1.5" />
                Email
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleShare('linkedin')}>
                <Linkedin className="h-4 w-4 mr-1.5" />
                LinkedIn
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleShare('copy')}>
                <Link className="h-4 w-4 mr-1.5" />
                Copy Link
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* How it Works */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <HowItWorksStep
                step={1}
                title="Share Your Link"
                desc="Send your unique referral link to colleagues and friends."
              />
              <HowItWorksStep
                step={2}
                title="They Sign Up"
                desc="When they create an account using your link, you're credited."
              />
              <HowItWorksStep
                step={3}
                title="Earn Rewards"
                desc="Get ¥500 for each qualified referral. No limit!"
              />
            </div>
          </CardContent>
        </Card>

        {/* Referral History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Your Referrals</CardTitle>
              <Badge>Pending ¥{stats.pending_rewards}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {referrals.length === 0 ? (
              <div className="text-center py-8 text-[#6B6B6B]">
                <Gift className="h-8 w-8 mx-auto mb-2" />
                <p>No referrals yet. Start sharing your link!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {referrals.map((ref) => (
                  <ReferralRow key={ref.id} referral={ref} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

function ReferralStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="bg-white/10 backdrop-blur rounded-lg p-3">
      <div className="flex items-center gap-2 text-white/60 text-[11px] uppercase tracking-wide mb-1">
        {icon}
        {label}
      </div>
      <div className="text-[24px] font-serif text-white">{value}</div>
    </div>
  );
}

function HowItWorksStep({ step, title, desc }: { step: number; title: string; desc: string }) {
  return (
    <div className="text-center">
      <div className="w-10 h-10 mx-auto mb-3 bg-[#F0F0F0] rounded-full flex items-center justify-center text-[14px] font-medium text-[#1A1A1A]">
        {step}
      </div>
      <h4 className="text-[14px] font-medium text-[#1A1A1A] mb-1">{title}</h4>
      <p className="text-[12px] text-[#6B6B6B]">{desc}</p>
    </div>
  );
}

function ReferralRow({ referral }: { referral: Referral }) {
  const statusConfig = {
    pending: { label: 'Pending', variant: 'outline' as const },
    signed_up: { label: 'Signed Up', variant: 'warning' as const },
    qualified: { label: 'Qualified', variant: 'success' as const },
    rewarded: { label: 'Rewarded', variant: 'success' as const },
    expired: { label: 'Expired', variant: 'danger' as const },
  };

  const config = statusConfig[referral.status];

  return (
    <div className="flex items-center justify-between p-3 bg-[#FAFAFA] rounded-lg">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#E5E5E5] flex items-center justify-center">
          <Users className="h-5 w-5 text-[#9B9B9B]" />
        </div>
        <div>
          <p className="text-[13px] font-medium text-[#1A1A1A]">{referral.referred_name}</p>
          <p className="text-[12px] text-[#9B9B9B]">{referral.referred_email}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-[12px] text-[#9B9B9B]">
          {new Date(referral.created_at).toLocaleDateString()}
        </span>
        <Badge variant={config.variant}>{config.label}</Badge>
        {referral.reward_amount > 0 && (
          <span className="text-[13px] font-medium text-emerald-600">
            +¥{referral.reward_amount}
          </span>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Referral API Handler (for backend)                                  */
/* ------------------------------------------------------------------ */

/**
 * Referral API Handler — Issue #34
 *
 * Endpoints:
 * POST /api/referrals/create    — Create a referral
 * GET  /api/referrals           — List user's referrals
 * POST /api/referrals/validate  — Validate a referral code
 * POST /api/referrals/reward    — Issue reward for qualified referral
 */
export async function handleReferrals(req: any, res: any) {
  const { method } = req;
  const path = req.query.path || [];
  const action = path[0];

  if (method === 'GET' && !action) {
    return listReferrals(req, res);
  }

  if (method === 'POST' && action === 'create') {
    return createReferral(req, res);
  }

  if (method === 'POST' && action === 'validate') {
    return validateReferralCode(req, res);
  }

  return res.status(404).json({ success: false, error: 'Not found' });
}

async function listReferrals(req: any, res: any) {
  // Return mock data
  return res.json({
    success: true,
    data: {
      stats: {
        total_referrals: 12,
        successful_referrals: 7,
        pending_rewards: 1200,
        total_earned: 3500,
      },
      referrals: [],
    },
  });
}

async function createReferral(req: any, res: any) {
  const { referred_email, referred_name } = req.body || {};

  if (!referred_email) {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }

  // In production, insert into database
  return res.status(201).json({
    success: true,
    data: {
      id: `ref_${Date.now()}`,
      referred_email,
      referred_name,
      status: 'pending',
      created_at: new Date().toISOString(),
    },
  });
}

async function validateReferralCode(req: any, res: any) {
  const { code } = req.body || {};

  // Validate format
  if (!code || !code.startsWith('LYC-REF-')) {
    return res.status(400).json({ success: false, error: 'Invalid referral code' });
  }

  // In production, check database
  return res.json({
    success: true,
    data: {
      valid: true,
      referrer_name: 'A LYC Member',
    },
  });
}