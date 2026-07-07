import React from 'react';
import { Plug, CheckCircle2, XCircle } from 'lucide-react';

interface Integration {
  name: string;
  description: string;
  connected: boolean;
}

const INTEGRATIONS: Integration[] = [
  { name: 'Supabase', description: 'Database & auth', connected: true },
  { name: 'DeepSeek AI', description: 'LLM for Nexus', connected: true },
  { name: 'SendGrid', description: 'Email delivery', connected: true },
  { name: 'Slack', description: 'Notifications', connected: false },
];

export function IntegrationSettings() {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-5">
        <Plug className="w-5 h-5 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">INTEGRATIONS</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {INTEGRATIONS.map((int) => (
          <div key={int.name} className="border border-bg-tertiary p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium text-text-primary">{int.name}</p>
              <div className="flex items-center gap-1">
                {int.connected ? (
                  <CheckCircle2 className="w-4 h-4 text-teal" />
                ) : (
                  <XCircle className="w-4 h-4 text-error" />
                )}
                <span
                  className={`text-xs ${int.connected ? 'text-teal' : 'text-error'}`}
                >
                  {int.connected ? 'Connected' : 'Not connected'}
                </span>
              </div>
            </div>
            <p className="text-sm text-text-muted mb-3">{int.description}</p>
            <button className="text-accent text-sm">Configure</button>
          </div>
        ))}
      </div>
    </div>
  );
}
