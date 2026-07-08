import React, { useState, useMemo } from 'react';
import { Users, Star } from 'lucide-react';
import { MOCK_SERVICES } from '@/mocks/advancedFeatures';

interface Provider {
  name: string;
  title: string;
  rating: number;
  avatarColor: string;
  specialties: string[];
  serviceCount: number;
  services: typeof MOCK_SERVICES;
}

export default function ProviderDirectory() {
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('All');
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);

  const providers = useMemo(() => {
    const map = new Map<string, Provider>();
    for (const s of MOCK_SERVICES) {
      const existing = map.get(s.provider.name);
      if (existing) {
        existing.services.push(s);
        existing.serviceCount += 1;
        if (!existing.specialties.includes(s.category)) {
          existing.specialties.push(s.category);
        }
      } else {
        map.set(s.provider.name, {
          name: s.provider.name,
          title: s.provider.title,
          rating: s.provider.rating,
          avatarColor: s.provider.avatarColor,
          specialties: [s.category],
          serviceCount: 1,
          services: [s],
        });
      }
    }
    return Array.from(map.values());
  }, []);

  const allSpecialties = useMemo(() => {
    const set = new Set<string>();
    providers.forEach((p) => p.specialties.forEach((s) => set.add(s)));
    return ['All', ...Array.from(set).sort()];
  }, [providers]);

  const filtered = useMemo(() => {
    if (selectedSpecialty === 'All') return providers;
    return providers.filter((p) => p.specialties.includes(selectedSpecialty));
  }, [providers, selectedSpecialty]);

  return (
    <div className="space-y-5">
      {/* Specialty filter */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        <Users className="w-4 h-4 text-text-muted mr-1 flex-shrink-0" />
        {allSpecialties.map((spec) => (
          <button
            key={spec}
            onClick={() => setSelectedSpecialty(spec)}
            className={`px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
              selectedSpecialty === spec
                ? 'bg-[#C108AB] text-white'
                : 'bg-bg-secondary text-text-muted hover:text-text-primary hover:bg-bg-tertiary'
            }`}
            style={{ borderRadius: 0 }}
          >
            {spec}
          </button>
        ))}
      </div>

      {/* Provider cards */}
      <div className="space-y-3">
        {filtered.map((provider) => {
          const isExpanded = expandedProvider === provider.name;
          return (
            <div
              key={provider.name}
              className="bg-bg-primary border border-bg-tertiary"
              style={{ borderRadius: 0 }}
            >
              <button
                onClick={() =>
                  setExpandedProvider(isExpanded ? null : provider.name)
                }
                className="w-full p-4 flex items-center gap-4 text-left"
              >
                <span
                  className="w-10 h-10 flex-shrink-0 flex items-center justify-center text-sm font-bold text-white"
                  style={{ borderRadius: 0, backgroundColor: provider.avatarColor }}
                >
                  {provider.name.charAt(0)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-semibold text-base text-text-primary">
                      {provider.name}
                    </h3>
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-sm text-text-secondary">{provider.rating}</span>
                    </div>
                  </div>
                  <p className="text-sm text-text-muted">{provider.title}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <span>{provider.serviceCount} service{provider.serviceCount > 1 ? 's' : ''}</span>
                  <span className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    ▾
                  </span>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-bg-tertiary p-4 space-y-3">
                  <div className="flex flex-wrap gap-1">
                    {provider.specialties.map((spec) => (
                      <span
                        key={spec}
                        className="px-2 py-0.5 text-xs font-medium bg-accent-10 text-accent"
                        style={{ borderRadius: 0 }}
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {provider.services.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-3 bg-bg-secondary"
                        style={{ borderRadius: 0 }}
                      >
                        <div>
                          <p className="text-sm font-medium text-text-primary">{s.name}</p>
                          <p className="text-xs text-text-muted">{s.duration}</p>
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <span className="font-semibold text-text-primary">{s.priceCredits}</span>
                          <span className="text-text-muted text-xs">credits</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
