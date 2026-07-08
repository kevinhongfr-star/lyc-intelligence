import React, { useState } from 'react';
import { MapPin, TrendingUp } from 'lucide-react';

interface LocationData {
  location: string;
  density: 'High' | 'Medium' | 'Low';
  topRoles: string[];
  avgSalary: string;
}

const MOCK_LOCATIONS: LocationData[] = [
  { location: 'Singapore', density: 'High', topRoles: ['CTO', 'VP Product', 'Head of Data'], avgSalary: 'SGD 450k' },
  { location: 'Hong Kong', density: 'High', topRoles: ['MD', 'CFO', 'COO'], avgSalary: 'USD 520k' },
  { location: 'Sydney', density: 'Medium', topRoles: ['GM', 'VP Engineering', 'CPO'], avgSalary: 'AUD 380k' },
  { location: 'Tokyo', density: 'Low', topRoles: ['Country Manager', 'CTO', 'VP Sales'], avgSalary: 'USD 400k' },
  { location: 'Mumbai', density: 'Medium', topRoles: ['VP Operations', 'Head of HR', 'CFO'], avgSalary: 'USD 180k' },
];

const densityColors: Record<string, { bar: string; text: string; width: string }> = {
  High: { bar: 'bg-[#C108AB]', text: 'text-[#C108AB]', width: '90%' },
  Medium: { bar: 'bg-amber-500', text: 'text-amber-600', width: '60%' },
  Low: { bar: 'bg-gray-400', text: 'text-gray-500', width: '30%' },
};

export default function TalentDensityExplorer() {
  const [roleFilter, setRoleFilter] = useState('all');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');

  const filtered = locationFilter === 'all'
    ? MOCK_LOCATIONS
    : MOCK_LOCATIONS.filter(l => l.location === locationFilter);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="border border-bg-tertiary bg-bg-primary text-text-primary text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#C108AB]/40"
          style={{ borderRadius: 0 }}
        >
          <option value="all">All Roles</option>
          <option value="cto">CTO</option>
          <option value="cfo">CFO</option>
          <option value="md">MD</option>
        </select>
        <select
          value={industryFilter}
          onChange={e => setIndustryFilter(e.target.value)}
          className="border border-bg-tertiary bg-bg-primary text-text-primary text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#C108AB]/40"
          style={{ borderRadius: 0 }}
        >
          <option value="all">All Industries</option>
          <option value="tech">Technology</option>
          <option value="finance">Financial Services</option>
          <option value="healthcare">Healthcare</option>
        </select>
        <select
          value={locationFilter}
          onChange={e => setLocationFilter(e.target.value)}
          className="border border-bg-tertiary bg-bg-primary text-text-primary text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#C108AB]/40"
          style={{ borderRadius: 0 }}
        >
          <option value="all">All Locations</option>
          <option value="Singapore">Singapore</option>
          <option value="Hong Kong">Hong Kong</option>
          <option value="Sydney">Sydney</option>
          <option value="Tokyo">Tokyo</option>
          <option value="Mumbai">Mumbai</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(loc => {
          const cfg = densityColors[loc.density];
          return (
            <div
              key={loc.location}
              className="border border-bg-tertiary bg-bg-primary p-4"
              style={{ borderRadius: 0 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-[#C108AB]" />
                <span className="font-medium text-text-primary">{loc.location}</span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted">Talent Density</span>
                  <span className={`font-medium ${cfg.text}`}>{loc.density}</span>
                </div>
                <div className="h-2 bg-bg-tertiary" style={{ borderRadius: 0 }}>
                  <div className={`h-full ${cfg.bar} transition-all`} style={{ width: cfg.width, borderRadius: 0 }} />
                </div>
              </div>

              <div className="mb-3">
                <span className="text-xs text-text-muted block mb-1">Top Roles</span>
                <div className="flex flex-wrap gap-1">
                  {loc.topRoles.map(role => (
                    <span key={role} className="inline-flex items-center px-2 py-0.5 bg-bg-secondary text-xs text-text-secondary">
                      {role}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-text-muted">
                <TrendingUp className="w-3 h-3" />
                <span>Avg Salary: {loc.avgSalary}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
