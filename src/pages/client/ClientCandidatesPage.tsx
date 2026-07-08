/**
 * ClientCandidatesPage — B2B Client Portal candidate list
 * Renders inside AppShell → Outlet.
 */
import React, { useState, useEffect } from 'react';
import { Search, Star, Mail, Briefcase, MapPin } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Input } from '@/components/ui';

interface ClientCandidate {
  id: string;
  name: string;
  title: string;
  company: string;
  location: string;
  tier: 'S' | 'A' | 'B' | 'C';
  status: 'New' | 'Screening' | 'Shortlisted' | 'Interview' | 'Offer' | 'Placed';
  score: number;
  mandateId: string;
  mandateTitle: string;
}

const MOCK_CANDIDATES: ClientCandidate[] = [
  { id: 'c1', name: 'Sarah Chen', title: 'VP Engineering', company: 'Meta', location: 'San Francisco', tier: 'S', status: 'Interview', score: 92, mandateId: 'm1', mandateTitle: 'VP Engineering — TechCorp' },
  { id: 'c2', name: 'Michael Wong', title: 'CFO', company: 'Stripe', location: 'New York', tier: 'S', status: 'Shortlisted', score: 89, mandateId: 'm2', mandateTitle: 'CFO — FinScale' },
  { id: 'c3', name: 'Emily Rodriguez', title: 'Head of Product', company: 'Airbnb', location: 'Remote', tier: 'A', status: 'Screening', score: 78, mandateId: 'm1', mandateTitle: 'VP Engineering — TechCorp' },
  { id: 'c4', name: 'David Kim', title: 'CTO', company: 'Shopify', location: 'Seattle', tier: 'S', status: 'Offer', score: 95, mandateId: 'm4', mandateTitle: 'CTO — CloudPeak' },
  { id: 'c5', name: 'Jessica Liu', title: 'VP Sales', company: 'HubSpot', location: 'Boston', tier: 'A', status: 'New', score: 72, mandateId: 'm4', mandateTitle: 'CTO — CloudPeak' },
  { id: 'c6', name: 'Robert Taylor', title: 'VP Engineering', company: 'Google', location: 'San Francisco', tier: 'A', status: 'Shortlisted', score: 81, mandateId: 'm1', mandateTitle: 'VP Engineering — TechCorp' },
];

const tierColors: Record<string, string> = {
  S: 'bg-fuchsia text-white',
  A: 'bg-blue text-white',
  B: 'bg-amber text-white',
  C: 'bg-text-muted text-white',
};

const statusColors: Record<string, string> = {
  'New': 'bg-blue/10 text-blue',
  'Screening': 'bg-amber/10 text-amber',
  'Shortlisted': 'bg-fuchsia/10 text-fuchsia',
  'Interview': 'bg-lens/10 text-lens',
  'Offer': 'bg-green/10 text-green',
  'Placed': 'bg-green/10 text-green',
};

export function ClientCandidatesPage() {
  const [candidates, setCandidates] = useState<ClientCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('all');

  useEffect(() => {
    const timer = setTimeout(() => {
      setCandidates(MOCK_CANDIDATES);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const filteredCandidates = candidates.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = tierFilter === 'all' || c.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif font-bold text-2xl text-text-primary">Candidates</h1>
        <p className="text-text-secondary text-sm mt-1">View and track candidates across all mandates.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            placeholder="Search candidates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="px-4 py-2 bg-white border border-border text-sm text-text-primary focus:outline-none focus:border-fuchsia"
        >
          <option value="all">All Tiers</option>
          <option value="S">Tier S</option>
          <option value="A">Tier A</option>
          <option value="B">Tier B</option>
          <option value="C">Tier C</option>
        </select>
      </div>

      {/* Candidate list */}
      {loading ? (
        <div className="py-12 text-center text-text-muted text-sm">Loading candidates...</div>
      ) : filteredCandidates.length === 0 ? (
        <div className="py-12 text-center text-text-muted text-sm">No candidates found.</div>
      ) : (
        <div className="space-y-3">
          {filteredCandidates.map((candidate) => (
            <Card key={candidate.id} className="p-4 hover:shadow-card-hover transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  {/* Tier badge */}
                  <div className={`w-10 h-10 rounded-lg ${tierColors[candidate.tier]} flex items-center justify-center font-bold text-sm`}>
                    {candidate.tier}
                  </div>

                  {/* Candidate info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text-primary text-sm">{candidate.name}</span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${statusColors[candidate.status]}`}>
                        {candidate.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3 h-3" />
                        {candidate.title} at {candidate.company}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {candidate.location}
                      </span>
                    </div>
                    <div className="text-xs text-fuchsia mt-1">{candidate.mandateTitle}</div>
                  </div>
                </div>

                {/* Score */}
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber" />
                  <span className="font-bold text-text-primary">{candidate.score}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default ClientCandidatesPage;
