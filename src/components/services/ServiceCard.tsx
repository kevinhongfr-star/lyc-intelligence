import React from 'react';
import { Star, Clock, CreditCard } from 'lucide-react';
import type { Service } from '@/mocks/advancedFeatures';

interface ServiceCardProps {
  service: Service;
  onBook: (service: Service) => void;
}

export default function ServiceCard({ service, onBook }: ServiceCardProps) {
  const fullStars = Math.floor(service.rating);
  const hasHalf = service.rating - fullStars >= 0.5;

  return (
    <div
      className="bg-bg-primary border border-bg-tertiary p-5 flex flex-col gap-3"
      style={{ borderRadius: 0 }}
    >
      {/* Header: category badge + name */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <span className="inline-block px-2 py-0.5 text-xs font-medium bg-accent-10 text-accent mb-2" style={{ borderRadius: 0 }}>
            {service.category}
          </span>
          <h3 className="font-serif font-semibold text-base text-text-primary leading-snug">
            {service.name}
          </h3>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-text-muted line-clamp-2">{service.description}</p>

      {/* Provider */}
      <div className="flex items-center gap-2">
        <span
          className="w-6 h-6 flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
          style={{ borderRadius: 0, backgroundColor: service.provider.avatarColor }}
        >
          {service.provider.name.charAt(0)}
        </span>
        <span className="text-sm text-text-secondary truncate">{service.provider.name}</span>
      </div>

      {/* Meta row: duration + rating */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1 text-text-muted">
          <Clock className="w-3.5 h-3.5" />
          <span>{service.duration}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex items-center">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${
                  i < fullStars
                    ? 'fill-amber-400 text-amber-400'
                    : i === fullStars && hasHalf
                      ? 'fill-amber-400/50 text-amber-400'
                      : 'fill-transparent text-bg-tertiary'
                }`}
              />
            ))}
          </div>
          <span className="text-text-muted">({service.reviews})</span>
        </div>
      </div>

      {/* Footer: price + CTA */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-bg-tertiary">
        <div className="flex items-center gap-1">
          <CreditCard className="w-4 h-4 text-accent" />
          <span className="font-semibold text-text-primary">{service.priceCredits}</span>
          <span className="text-xs text-text-muted">credits</span>
        </div>
        <button
          onClick={() => onBook(service)}
          className="px-4 py-2 text-sm font-medium text-white bg-[#C108AB] hover:bg-[#A00790] transition-colors"
          style={{ borderRadius: 0 }}
        >
          Book Now
        </button>
      </div>
    </div>
  );
}
