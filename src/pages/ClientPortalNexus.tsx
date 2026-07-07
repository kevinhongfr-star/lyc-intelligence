import React from 'react';
import { NexusChat } from '@/components/nexus/NexusChat';
import { ClientSuggestions } from '@/components/client/ClientSuggestions';

const CLIENT_SUGGESTIONS = [
  "What's the status of M-028?",
  "Compare David Tan vs Sophie Lau",
  "Show me candidates for VP Risk",
  "What's our pipeline health?",
];

export function ClientPortalNexus() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl font-bold text-text-primary">NEXUS Assistant</h1>
        <p className="text-text-muted mt-1">Ask NEXUS about your mandates, candidates, and organization</p>
      </header>

      <ClientSuggestions suggestions={CLIENT_SUGGESTIONS} />

      <div className="bg-bg-secondary border border-bg-tertiary">
        <NexusChat showHeader={false} initialPrompts={CLIENT_SUGGESTIONS} />
      </div>
    </div>
  );
}