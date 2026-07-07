import React from 'react';
import { FileText, MapPin, CalendarClock, TrendingUp, Percent } from 'lucide-react';

export interface Offer {
  id: string;
  company: string;
  role: string;
  base: number;
  bonusPct: number;
  equity: string;
  location: string;
  startDate: string;
  deadline: string;
  totalY1: number;
}

export const MOCK_OFFERS: Offer[] = [
  {
    id: 'A',
    company: 'NeoBank',
    role: 'CTO',
    base: 320000,
    bonusPct: 30,
    equity: '0.5%',
    location: 'Singapore',
    startDate: 'Aug 1',
    deadline: 'Jul 15',
    totalY1: 512000,
  },
  {
    id: 'B',
    company: 'TechCorp',
    role: 'VP Engineering',
    base: 280000,
    bonusPct: 25,
    equity: '0.2% RSU',
    location: 'Shanghai',
    startDate: 'Sep 1',
    deadline: 'Jul 20',
    totalY1: 405000,
  },
];

interface OfferListProps {
  offers?: Offer[];
}

function formatCurrencyK(value: number): string {
  return `$${Math.round(value / 1000)}K`;
}

export function OfferList({ offers = MOCK_OFFERS }: OfferListProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-4 h-4 text-accent" />
        <h2 className="font-serif text-lg font-bold text-text-primary">ACTIVE OFFERS</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {offers.map((offer) => (
          <div
            key={offer.id}
            className="bg-bg-primary border border-bg-tertiary p-5 border-l-4 border-l-accent"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-text-primary">
                  {offer.company}
                </h3>
                <p className="text-sm text-text-secondary">{offer.role}</p>
              </div>
              <span className="px-2 py-1 text-xs font-medium bg-accent-10 text-accent">
                Offer {offer.id}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-text-muted">
                  <TrendingUp className="w-4 h-4" />
                  Base
                </span>
                <span className="font-medium text-text-primary">
                  {formatCurrencyK(offer.base)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-text-muted">
                  <Percent className="w-4 h-4" />
                  Bonus
                </span>
                <span className="font-medium text-text-primary">{offer.bonusPct}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-text-muted">
                  <FileText className="w-4 h-4" />
                  Equity
                </span>
                <span className="font-medium text-text-primary">{offer.equity}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-text-muted">
                  <MapPin className="w-4 h-4" />
                  Location
                </span>
                <span className="font-medium text-text-primary">{offer.location}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-text-muted">
                  <CalendarClock className="w-4 h-4" />
                  Deadline
                </span>
                <span className="font-medium text-accent">{offer.deadline}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-bg-tertiary flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-text-muted">
                Total Year 1
              </span>
              <span className="font-serif text-xl font-bold text-accent">
                {formatCurrencyK(offer.totalY1)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
