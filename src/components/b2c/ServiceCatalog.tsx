import React from 'react';
import { Briefcase, Clock, DollarSign } from 'lucide-react';

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  category: string;
}

const SERVICES: Service[] = [
  {
    id: 'cv-review',
    name: 'CV/Resume Review',
    description: 'Professional review by executive coach',
    price: 299,
    duration: '1 week',
    category: 'Review',
  },
  {
    id: 'mock-interview',
    name: 'Mock Interview (90 min)',
    description: 'AI + human panel simulation',
    price: 499,
    duration: '90 min',
    category: 'Interview',
  },
  {
    id: 'executive-coaching',
    name: 'Executive Coaching (60 min)',
    description: '1-on-1 with certified coach',
    price: 399,
    duration: '60 min',
    category: 'Coaching',
  },
  {
    id: 'personal-branding',
    name: 'Personal Branding Package',
    description: 'LinkedIn + executive bio + headshot',
    price: 799,
    duration: '2 weeks',
    category: 'Branding',
  },
  {
    id: 'salary-negotiation',
    name: 'Salary Negotiation Advisory',
    description: 'Strategy session + script preparation',
    price: 599,
    duration: '60 min',
    category: 'Negotiation',
  },
];

export function ServiceCatalog() {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-3 mb-4">
        <Briefcase className="w-5 h-5 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">SERVICE CATALOG</h3>
      </div>

      <div className="divide-y divide-bg-tertiary">
        {SERVICES.map((service) => (
          <div key={service.id} className="flex justify-between items-center p-4 first:pt-0 last:pb-0">
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-serif font-medium text-text-primary">{service.name}</h4>
                <span className="bg-accent-10 text-accent text-xs px-2 py-0.5">
                  {service.category}
                </span>
              </div>
              <p className="text-sm text-text-muted mb-2">{service.description}</p>
              <div className="flex items-center gap-1 text-xs text-text-muted">
                <Clock className="w-3.5 h-3.5" />
                <span>{service.duration}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-text-primary" />
                <span className="font-serif text-xl font-bold text-text-primary">
                  {service.price}
                </span>
              </div>
              <button className="bg-accent text-white px-4 py-2 text-sm hover:bg-accent-hover transition-colors">
                Book Session
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
