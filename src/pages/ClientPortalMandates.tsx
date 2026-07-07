import React, { useState } from 'react';
import { ClientMandateList } from '@/components/client/ClientMandateList';
import { ClientPipelineKanban } from '@/components/client/ClientPipelineKanban';

const MOCK_MANDATES = [
  { id: 'M-031', title: 'VP Risk', department: 'Risk Management', status: 'ACTIVE', slaDays: 25 },
  { id: 'M-028', title: 'CTO', department: 'Technology', status: 'ACTIVE', slaDays: 12 },
  { id: 'M-025', title: 'Head Digital', department: 'Digital', status: 'COMPLETED', slaDays: 0 },
];

const MOCK_KANBAN_DATA = {
  SWEEP: ['Alice Wang', 'Bob Chen', 'Carol Liu'],
  CANVA: ['David Tan', 'Sophie Lau'],
  GRID: ['Michael Chen'],
  LENS: ['Emma Zhang'],
  PLACED: ['James Lee'],
};

export function ClientPortalMandates() {
  const [selectedMandate, setSelectedMandate] = useState(MOCK_MANDATES[0]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl font-bold text-text-primary">Mandates & Pipeline</h1>
        <p className="text-text-muted mt-1">View and manage your active mandates</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ClientMandateList
            mandates={MOCK_MANDATES}
            selectedMandate={selectedMandate}
            onSelect={setSelectedMandate}
          />
        </div>
        <div className="lg:col-span-2">
          <ClientPipelineKanban data={MOCK_KANBAN_DATA} mandate={selectedMandate} />
        </div>
      </div>
    </div>
  );
}