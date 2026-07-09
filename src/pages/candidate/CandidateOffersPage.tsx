/**
 * CandidateOffersPage — Candidate Portal offers & decisions
 * Renders inside AppShell → Outlet. Shows active offers, decision tools,
 * and negotiation resources.
 */
import React, { useState, useEffect } from 'react';
import { Briefcase, DollarSign, Calendar, CheckCircle2, Clock, FileText, TrendingUp, ArrowRight, User, Star } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Progress } from '@/components/ui';
import { useTenantContext } from '@/hooks/useTenantContext';

interface Offer {
  id: string;
  company: string;
  role: string;
  baseSalary: number;
  bonus: number;
  equity: string;
  benefits: string;
  status: 'Active' | 'Pending' | 'Expired';
  deadline: string;
  receivedAt: string;
}

interface NegotiationTip {
  id: string;
  title: string;
  description: string;
  category: string;
}

const MOCK_OFFERS: Offer[] = [
  {
    id: 'o1',
    company: 'TechCorp',
    role: 'VP Engineering',
    baseSalary: 285000,
    bonus: 50000,
    equity: '0.75% over 4 years',
    benefits: 'Full health, 25 PTO, $5K learning budget',
    status: 'Active',
    deadline: 'Jan 30, 2025',
    receivedAt: 'Jan 15, 2025',
  },
  {
    id: 'o2',
    company: 'CloudPeak',
    role: 'CTO',
    baseSalary: 320000,
    bonus: 75000,
    equity: '1.2% over 4 years',
    benefits: 'Premium health, 30 PTO, executive coaching',
    status: 'Pending',
    deadline: 'Feb 5, 2025',
    receivedAt: 'Jan 18, 2025',
  },
];

const MOCK_TIPS: NegotiationTip[] = [
  { id: 't1', title: 'Counter with Market Data', description: 'Use levels.fyi and Pave data to justify your counter', category: 'Research' },
  { id: 't2', title: 'Negotiate Equity Refreshers', description: 'Request annual equity refresh for top performers', category: 'Equity' },
  { id: 't3', title: 'Signing Bonus Strategy', description: 'Convert some equity to signing bonus for immediate value', category: 'Cash' },
  { id: 't4', title: 'Remote Work Flexibility', description: 'Negotiate 2-3 days remote work week', category: 'Lifestyle' },
];

const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-green/10 text-green',
  Pending: 'bg-amber/10 text-amber',
  Expired: 'bg-text-muted/10 text-text-muted',
};

export function CandidateOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [tips, setTips] = useState<NegotiationTip[]>([]);
  const [loading, setLoading] = useState(true);
  const { candidateProfile, profile } = useTenantContext();

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffers(MOCK_OFFERS);
      setTips(MOCK_TIPS);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const displayName = candidateProfile?.name || profile?.name || 'Candidate';
  const currentTitle = candidateProfile?.current_title || 'Professional';

  const activeOffers = offers.filter(o => o.status === 'Active').length;
  const totalValue = offers.reduce((sum, o) => sum + o.baseSalary + o.bonus, 0);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="font-serif font-bold text-2xl text-text-primary">Offers & Decisions</h1>
            <p className="text-text-secondary text-sm mt-1">Review active offers, compare options, and make confident decisions.</p>
          </div>
          <div className="flex items-center gap-3 bg-bg-warm px-4 py-2 rounded-lg">
            <div className="w-9 h-9 rounded-full bg-fuchsia-light flex items-center justify-center">
              <User className="w-4 h-4 text-fuchsia" />
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-text-primary">{displayName}</div>
              <div className="text-xs text-text-muted">{currentTitle}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-fuchsia" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{loading ? '—' : activeOffers}</div>
              <div className="text-xs text-text-muted">Active Offers</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">${loading ? '—' : (totalValue / 1000).toFixed(0)}K</div>
              <div className="text-xs text-text-muted">Total Value</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">12d</div>
              <div className="text-xs text-text-muted">Next Deadline</div>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Offers</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-text-muted text-sm">Loading offers...</div>
          ) : offers.length === 0 ? (
            <div className="py-8 text-center text-text-muted text-sm">No active offers yet.</div>
          ) : (
            <div className="space-y-4">
              {offers.map((offer) => (
                <div key={offer.id} className="p-5 border border-border rounded-lg hover:shadow-card-hover transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-serif font-bold text-lg text-text-primary">{offer.role}</h3>
                      <p className="text-sm text-text-muted">{offer.company}</p>
                    </div>
                    <Badge className={STATUS_COLORS[offer.status]}>{offer.status}</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="text-xs text-text-muted">Base Salary</div>
                      <div className="font-bold text-text-primary">${(offer.baseSalary / 1000).toFixed(0)}K</div>
                    </div>
                    <div>
                      <div className="text-xs text-text-muted">Bonus</div>
                      <div className="font-bold text-text-primary">${(offer.bonus / 1000).toFixed(0)}K</div>
                    </div>
                    <div>
                      <div className="text-xs text-text-muted">Equity</div>
                      <div className="font-bold text-text-primary text-sm">{offer.equity}</div>
                    </div>
                    <div>
                      <div className="text-xs text-text-muted">Deadline</div>
                      <div className="font-bold text-text-primary text-sm">{offer.deadline}</div>
                    </div>
                  </div>
                  <div className="text-xs text-text-muted mb-4">
                    <strong>Benefits:</strong> {offer.benefits}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Accept
                    </Button>
                    <Button variant="outline" size="sm">
                      Counter Offer
                    </Button>
                    <Button variant="ghost" size="sm">
                      Decline
                    </Button>
                    <span className="ml-auto text-xs text-text-muted">Received {offer.receivedAt}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-fuchsia" />
              <CardTitle>Negotiation Tips</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tips.map((tip) => (
                <div key={tip.id} className="p-3 bg-bg-warm rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-text-primary text-sm">{tip.title}</span>
                    <Badge variant="outline" className="text-xs">{tip.category}</Badge>
                  </div>
                  <div className="text-xs text-text-muted">{tip.description}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-fuchsia" />
              <CardTitle>Decision Framework</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: 'Compensation', weight: 30, score: 85 },
                { label: 'Role & Impact', weight: 25, score: 90 },
                { label: 'Company Culture', weight: 20, score: 75 },
                { label: 'Growth Opportunity', weight: 15, score: 88 },
                { label: 'Work-Life Balance', weight: 10, score: 70 },
              ].map((factor) => (
                <div key={factor.label}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-text-secondary">{factor.label} ({factor.weight}%)</span>
                    <span className="font-bold text-text-primary">{factor.score}</span>
                  </div>
                  <Progress value={factor.score} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default CandidateOffersPage;
