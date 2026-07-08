import React, { useState } from 'react';
import { UserCheck, Building2, Briefcase } from 'lucide-react';
import { Button, Badge } from '@/components/ui';

interface Referral {
  id: string;
  name: string;
  company: string;
  position: string;
  status: 'available' | 'requested' | 'connected';
}

const MOCK_REFERRALS: Referral[] = [
  { id: 'r1', name: 'Angela Wu', company: 'Shopee', position: 'VP Product', status: 'available' },
  { id: 'r2', name: 'Raj Patel', company: 'Grab', position: 'CTO (Former)', status: 'requested' },
  { id: 'r3', name: 'Sarah Kim', company: 'McKinsey & Co', position: 'Managing Director', status: 'connected' },
];

const STATUS_CONFIG: Record<Referral['status'], { label: string; variant: 'default' | 'warning' | 'success' }> = {
  available: { label: 'Available', variant: 'default' },
  requested: { label: 'Requested', variant: 'warning' },
  connected: { label: 'Connected', variant: 'success' },
};

export default function CandidateReferralNetwork() {
  const [referrals, setReferrals] = useState<Referral[]>(MOCK_REFERRALS);

  const handleRequestReferral = (id: string) => {
    setReferrals((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'requested' as const } : r))
    );
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-muted">
        Connect with professionals who can refer you to opportunities at their companies.
      </p>

      {referrals.map((referral) => {
        const statusConfig = STATUS_CONFIG[referral.status];
        return (
          <div
            key={referral.id}
            className="bg-bg-primary border border-bg-tertiary p-5"
            style={{ borderRadius: 0 }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 bg-accent/10 flex items-center justify-center text-accent font-semibold"
                  style={{ borderRadius: 0 }}
                >
                  {referral.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary">{referral.name}</h4>
                  <div className="flex items-center gap-2 text-sm text-text-muted mt-1">
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3 h-3" />
                      {referral.position}
                    </span>
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {referral.company}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                {referral.status === 'available' && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleRequestReferral(referral.id)}
                    style={{ borderRadius: 0 }}
                    className="flex items-center gap-1"
                  >
                    <UserCheck className="w-4 h-4" />
                    Request Referral
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
