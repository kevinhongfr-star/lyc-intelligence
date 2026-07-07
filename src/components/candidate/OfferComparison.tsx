import React from 'react';
import { Scale } from 'lucide-react';
import type { Offer } from './OfferList';

interface OfferComparisonProps {
  offers: Offer[];
}

interface AttributeRow {
  label: string;
  render: (offer: Offer) => React.ReactNode;
  highlightMax?: boolean;
}

function formatCurrencyK(value: number): string {
  return `$${Math.round(value / 1000)}K`;
}

const ATTRIBUTE_ROWS: AttributeRow[] = [
  {
    label: 'Base',
    render: (o) => formatCurrencyK(o.base),
  },
  {
    label: 'Bonus',
    render: (o) => `${o.bonusPct}%`,
  },
  {
    label: 'Equity',
    render: (o) => o.equity,
  },
  {
    label: 'Total Y1',
    render: (o) => formatCurrencyK(o.totalY1),
    highlightMax: true,
  },
  {
    label: 'Location',
    render: (o) => o.location,
  },
  {
    label: 'Start',
    render: (o) => o.startDate,
  },
  {
    label: 'Deadline',
    render: (o) => o.deadline,
  },
];

export function OfferComparison({ offers }: OfferComparisonProps) {
  const totalMax = Math.max(...offers.map((o) => o.totalY1));

  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-4">
        <Scale className="w-4 h-4 text-accent" />
        <h2 className="font-serif text-lg font-bold text-text-primary">
          OFFER COMPARISON
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-bg-tertiary">
              <th className="text-left p-3 text-text-muted font-medium uppercase tracking-wider text-xs">
                Attribute
              </th>
              {offers.map((offer) => (
                <th
                  key={offer.id}
                  className="text-left p-3 font-serif text-base font-bold text-text-primary"
                >
                  Offer {offer.id}: {offer.company} {offer.role.split(' ')[0]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ATTRIBUTE_ROWS.map((row) => {
              return (
                <tr
                  key={row.label}
                  className="border-b border-bg-tertiary last:border-b-0"
                >
                  <td className="p-3 text-text-muted font-medium">{row.label}</td>
                  {offers.map((offer) => {
                    const isMax =
                      row.highlightMax && offer.totalY1 === totalMax;
                    return (
                      <td
                        key={offer.id}
                        className={`p-3 font-medium ${
                          isMax ? 'bg-accent-10 text-accent' : 'text-text-primary'
                        }`}
                      >
                        {row.render(offer)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-text-muted mt-3">
        Higher Total Year 1 highlighted in fuchsia.
      </p>
    </div>
  );
}
