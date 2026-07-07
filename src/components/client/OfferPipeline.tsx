import React from 'react';

interface Offer {
  candidate: string;
  role: string;
  comp: string;
  status: string;
}

interface OfferPipelineProps {
  offers: Offer[];
}

const STATUS_COLORS: Record<string, string> = {
  NEGOTIATING: 'bg-accent/10 text-accent',
  PENDING: 'bg-warning/10 text-warning',
  ACCEPTED: 'bg-teal/10 text-teal',
  REJECTED: 'bg-error/10 text-error',
};

export function OfferPipeline({ offers }: OfferPipelineProps) {
  return (
    <div className="bg-bg-secondary border border-bg-tertiary p-6">
      <h2 className="font-serif text-lg font-bold text-text-primary mb-4">Offer Pipeline</h2>
      
      <div className="space-y-3">
        {offers.map((offer) => (
          <div
            key={offer.candidate}
            className="flex items-center justify-between p-4 bg-bg-primary border border-bg-tertiary"
          >
            <div>
              <p className="font-medium text-text-primary">{offer.candidate}</p>
              <p className="text-sm text-text-muted">{offer.role}</p>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-sm font-medium text-text-primary">{offer.comp}</span>
              <span className={`px-3 py-1 text-xs font-medium ${STATUS_COLORS[offer.status] || 'bg-bg-tertiary text-text-muted'}`}>
                {offer.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}