import React, { useState, useEffect } from 'react';

interface ServiceHealth {
  name: string;
  status: 'operational' | 'degraded' | 'down' | 'maintenance';
  latency_ms: number;
  uptime_percentage: number;
  last_checked: string;
}

export function HealthCheck() {
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/monitoring/services')
      .then(r => r.json())
      .then(data => {
        setServices(data.services || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-gray-500">Loading health data...</div>;

  const statusColors: Record<string, string> = {
    operational: '#16a34a',
    degraded: '#d97706',
    down: '#dc2626',
    maintenance: '#2563eb',
  };

  const avgLatency = services.length ? Math.round(services.reduce((s, sv) => s + sv.latency_ms, 0) / services.length) : 0;
  const avgUptime = services.length ? (services.reduce((s, sv) => s + sv.uptime_percentage, 0) / services.length).toFixed(2) : '0';

  return (
    <div className="p-6">
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-white border border-gray-300">
          <div className="text-sm text-gray-500">Services</div>
          <div className="text-2xl font-bold">{services.length}</div>
        </div>
        <div className="p-4 bg-white border border-gray-300">
          <div className="text-sm text-gray-500">Avg Latency</div>
          <div className="text-2xl font-bold">{avgLatency}ms</div>
        </div>
        <div className="p-4 bg-white border border-gray-300">
          <div className="text-sm text-gray-500">Avg Uptime</div>
          <div className="text-2xl font-bold">{avgUptime}%</div>
        </div>
      </div>

      <h3 className="font-semibold mb-2">Service Health</h3>
      <div className="space-y-2">
        {services.map(svc => (
          <div
            key={svc.name}
            className={`p-4 border cursor-pointer transition ${selectedService === svc.name ? 'border-2' : 'border-gray-300'}`}
            style={selectedService === svc.name ? { borderColor: '#C108AB' } : {}}
            data-testid={`health-${svc.name}`}
            onClick={() => setSelectedService(selectedService === svc.name ? null : svc.name)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className="w-3 h-3"
                  style={{ backgroundColor: statusColors[svc.status], display: 'inline-block' }}
                />
                <span className="font-medium">{svc.name}</span>
                <span className="text-sm text-gray-500">{svc.status}</span>
              </div>
              <div className="text-sm text-gray-500">
                {svc.latency_ms}ms · {svc.uptime_percentage}% uptime
              </div>
            </div>
            {selectedService === svc.name && (
              <div className="mt-3 pt-3 border-t border-gray-200 text-sm text-gray-600">
                Last checked: {new Date(svc.last_checked).toLocaleString()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}