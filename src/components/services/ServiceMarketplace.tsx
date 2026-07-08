import React, { useState, useMemo } from 'react';
import { ShoppingBag } from 'lucide-react';
import { MOCK_SERVICES, type Service } from '@/mocks/advancedFeatures';
import ServiceCard from './ServiceCard';
import BookingFlow from './BookingFlow';

const CATEGORIES = ['All', 'Resume', 'Interview', 'Coaching', 'Negotiation', 'Workshop'] as const;

export default function ServiceMarketplace() {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [bookingService, setBookingService] = useState<Service | null>(null);

  const filtered = useMemo(() => {
    const list = activeCategory === 'All'
      ? MOCK_SERVICES
      : MOCK_SERVICES.filter((s) => s.category === activeCategory);
    return [...list].sort((a, b) => b.rating - a.rating);
  }, [activeCategory]);

  if (bookingService) {
    return <BookingFlow service={bookingService} onClose={() => setBookingService(null)} />;
  }

  return (
    <div className="space-y-5">
      {/* Category tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        <ShoppingBag className="w-4 h-4 text-text-muted mr-1 flex-shrink-0" />
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat
                ? 'bg-[#C108AB] text-white'
                : 'bg-bg-secondary text-text-muted hover:text-text-primary hover:bg-bg-tertiary'
            }`}
            style={{ borderRadius: 0 }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            onBook={setBookingService}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-text-muted">
          No services found in this category.
        </div>
      )}
    </div>
  );
}
