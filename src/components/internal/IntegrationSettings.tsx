import React, { useState } from 'react';
import { Link2, Unlink } from 'lucide-react';
import { MOCK_INTEGRATIONS } from '@/mocks/internalPortal';

interface IntegrationState {
  [key: string]: string;
}

export default function IntegrationSettings() {
  const [integrations, setIntegrations] = useState<IntegrationState>(() =>
    Object.fromEntries(MOCK_INTEGRATIONS.map(i => [i.id, i.status]))
  );

  const toggleConnection = (id: string) => {
    setIntegrations(prev => ({
      ...prev,
      [id]: prev[id] === 'connected' ? 'disconnected' : 'connected',
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Link2 className="w-5 h-5 text-accent" />
        <h2 className="font-serif font-semibold text-lg text-text-primary">Integrations</h2>
      </div>

      <div className="space-y-3">
        {MOCK_INTEGRATIONS.map(integration => {
          const currentStatus = integrations[integration.id];
          const isConnected = currentStatus === 'connected';
          return (
            <div
              key={integration.id}
              className="bg-bg-primary border border-bg-tertiary p-4"
              style={{ borderRadius: 0 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-text-primary">{integration.name}</span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium ${
                        isConnected
                          ? 'bg-tier-1Bg text-tier-1'
                          : 'bg-bg-tertiary text-text-muted'
                      }`}
                      style={{ borderRadius: 0 }}
                    >
                      {currentStatus}
                    </span>
                  </div>
                  {integration.lastSync && (
                    <p className="text-sm text-text-muted mt-1">
                      Last synced: {integration.lastSync}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => toggleConnection(integration.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border transition-colors ${
                    isConnected
                      ? 'border-red-300 text-red-600 hover:bg-red-50'
                      : 'border-tier-1 text-tier-1 hover:bg-tier-1Bg'
                  }`}
                  style={{ borderRadius: 0 }}
                >
                  {isConnected ? (
                    <>
                      <Unlink className="w-3 h-3" />
                      Disconnect
                    </>
                  ) : (
                    <>
                      <Link2 className="w-3 h-3" />
                      Connect
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
