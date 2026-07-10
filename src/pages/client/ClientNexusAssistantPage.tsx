/**
 * ClientNexusAssistantPage — B2B Client Portal NEXUS AI assistant
 * Now uses the real NexusChat component with actual API calls.
 */
import React from 'react';
import { NexusChat } from '@/components/nexus/NexusChat';

export function ClientNexusAssistantPage() {
  return (
    <div className="space-y-6">
      <NexusChat
        showHeader={true}
        initialPrompts={[
          'Show me active mandates and pipeline status',
          'Generate a candidate shortlist for VP Engineering',
          'What is the market salary benchmark for CFO roles in APAC?',
          'Analyze my pipeline conversion rate this quarter',
        ]}
      />
    </div>
  );
}

export default ClientNexusAssistantPage;
