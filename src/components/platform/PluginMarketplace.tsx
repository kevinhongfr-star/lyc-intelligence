import React, { useState } from 'react';
import { Puzzle, ExternalLink, CheckCircle, Download, Star, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  source: 'official' | 'community' | 'custom';
  installed: boolean;
  active: boolean;
  hooks: string[];
  icon?: string;
}

const MOCK_PLUGINS: Plugin[] = [
  { id: 'p1', name: 'LinkedIn Importer', description: 'Import candidate profiles from LinkedIn with auto-parsing', version: '2.1.0', author: 'Official', source: 'official', installed: true, active: true, hooks: ['candidate.import', 'profile.parse'] },
  { id: 'p2', name: 'Email Sync', description: 'Two-way email sync with Gmail/Outlook for candidate communications', version: '1.5.2', author: 'Official', source: 'official', installed: true, active: false, hooks: ['email.receive', 'email.send'] },
  { id: 'p3', name: 'Slack Notifier', description: 'Send candidate alerts and daily digests to Slack channels', version: '1.2.0', author: 'Community', source: 'community', installed: false, active: false, hooks: ['notification.send'] },
  { id: 'p4', name: 'Calendar Sync', description: 'Bi-directional calendar sync with Google Calendar and Outlook', version: '3.0.1', author: 'Official', source: 'official', installed: true, active: true, hooks: ['calendar.sync', 'meeting.schedule'] },
  { id: 'p5', name: 'AI Interview Scheduler', description: 'AI-powered smart scheduling based on interviewer availability', version: '0.9.0', author: 'Community', source: 'community', installed: false, active: false, hooks: ['interview.schedule'] },
  { id: 'p6', name: 'Custom Webhook', description: 'Send custom webhooks on pipeline stage changes', version: '1.0.0', author: 'Custom', source: 'custom', installed: false, active: false, hooks: ['pipeline.change'] },
];

export function PluginMarketplace() {
  const [plugins, setPlugins] = useState<Plugin[]>(MOCK_PLUGINS);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'official' | 'community' | 'installed'>('all');

  const filtered = plugins.filter(p => {
    if (filter === 'installed' && !p.installed) return false;
    if (filter !== 'all' && filter !== 'installed' && p.source !== filter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleInstall = (id: string) => {
    setPlugins(prev => prev.map(p => p.id === id ? { ...p, installed: true } : p));
  };

  const handleToggleActive = (id: string) => {
    setPlugins(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
  };

  const handleUninstall = (id: string) => {
    setPlugins(prev => prev.map(p => p.id === id ? { ...p, installed: false, active: false } : p));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Puzzle className="w-5 h-5 text-accent" />
          Plugin Marketplace
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search plugins..."
              className="w-full pl-8 pr-3 py-2 border border-border bg-bg text-sm focus:outline-none focus:border-accent rounded-none"
            />
          </div>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value as any)}
            className="px-3 py-2 border border-border bg-bg text-sm focus:outline-none focus:border-accent rounded-none"
          >
            <option value="all">All</option>
            <option value="official">Official</option>
            <option value="community">Community</option>
            <option value="installed">Installed</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(plugin => (
            <div key={plugin.id} className="border border-border p-4 hover:border-accent/30 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-text-primary text-sm">{plugin.name}</span>
                    <span className="text-xs px-1.5 py-0.5 bg-bg-tertiary text-text-muted">{plugin.version}</span>
                    {plugin.source === 'official' && (
                      <span className="text-xs px-1.5 py-0.5 bg-accent/10 text-accent flex items-center gap-0.5">
                        <Star className="w-3 h-3" /> Official
                      </span>
                    )}
                    {plugin.active && (
                      <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 flex items-center gap-0.5">
                        <CheckCircle className="w-3 h-3" /> Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary mb-2">{plugin.description}</p>
                  <p className="text-xs text-text-muted mb-2">by {plugin.author}</p>
                  <div className="flex flex-wrap gap-1">
                    {plugin.hooks.map(h => (
                      <span key={h} className="text-xs px-1.5 py-0.5 bg-bg-tertiary text-text-muted">{h}</span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {!plugin.installed ? (
                    <Button variant="outline" size="sm" onClick={() => handleInstall(plugin.id)}>
                      <Download className="w-4 h-4" /> Install
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant={plugin.active ? 'ghost' : 'default'}
                        size="sm"
                        onClick={() => handleToggleActive(plugin.id)}
                      >
                        {plugin.active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleUninstall(plugin.id)}>
                        Uninstall
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-8 text-text-muted text-sm">
            No plugins match your search
          </div>
        )}
      </CardContent>
    </Card>
  );
}