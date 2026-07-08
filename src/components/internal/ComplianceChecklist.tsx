import React from 'react';
import { CheckCircle, Loader2, Circle } from 'lucide-react';
import { MOCK_COMPLIANCE_CHECKLIST } from '@/mocks/internalPortal';

export default function ComplianceChecklist() {
  const completed = MOCK_COMPLIANCE_CHECKLIST.filter((c) => c.status === 'complete').length;
  const total = MOCK_COMPLIANCE_CHECKLIST.length;
  const pct = Math.round((completed / total) * 100);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in_progress':
        return <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'complete': return 'Complete';
      case 'in_progress': return 'In Progress';
      default: return 'Pending';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'bg-green-600';
      case 'in_progress': return 'bg-amber-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="bg-bg-primary border border-bg-tertiary" style={{ borderRadius: 0 }}>
      <div className="p-4 border-b border-bg-tertiary bg-bg-secondary">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-text-primary">Compliance Progress</span>
          <span className="text-sm font-bold text-text-primary">{pct}%</span>
        </div>
        <div className="w-full h-2 bg-bg-tertiary" style={{ borderRadius: 0 }}>
          <div
            className="h-full"
            style={{ width: `${pct}%`, backgroundColor: '#C108AB', borderRadius: 0 }}
          />
        </div>
        <p className="text-xs text-text-muted mt-1">{completed} of {total} items complete</p>
      </div>

      <div className="divide-y divide-bg-tertiary">
        {MOCK_COMPLIANCE_CHECKLIST.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 px-4 py-3 hover:bg-bg-secondary transition-colors"
          >
            {getStatusIcon(item.status)}
            <span className="text-sm text-text-primary flex-1">{item.item}</span>
            <span
              className="inline-block px-2 py-0.5 text-xs font-medium text-white"
              style={{ borderRadius: 0, backgroundColor: getStatusColor(item.status) === 'bg-green-600' ? '#16a34a' : getStatusColor(item.status) === 'bg-amber-500' ? '#f59e0b' : '#9ca3af' }}
            >
              {getStatusLabel(item.status)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
