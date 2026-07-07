import React from 'react';
import { ServiceCatalog } from '@/components/b2c/ServiceCatalog';
import { BookingCalendar } from '@/components/b2c/BookingCalendar';
import { ServiceProviderProfile } from '@/components/b2c/ServiceProviderProfile';
import { ServiceHistory } from '@/components/b2c/ServiceHistory';

export function B2CCareerServicesPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl font-bold text-text-primary">CAREER SERVICES</h1>
        <p className="text-text-muted mt-1">
          Browse and book executive coaching, resume refinement, interview prep, and negotiation support.
        </p>
      </header>

      <ServiceCatalog />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BookingCalendar />
        <ServiceProviderProfile />
      </div>

      <ServiceHistory />
    </div>
  );
}
