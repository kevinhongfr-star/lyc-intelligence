import React from 'react';
import { SystemHealthDashboard } from '@/components/internal/SystemHealthDashboard';
import { ExecutionLogViewer } from '@/components/internal/ExecutionLogViewer';
import { RuleAuditTrail } from '@/components/internal/RuleAuditTrail';

export function AdvancedOpsPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold text-text-primary">ADVANCED OPERATIONS</h1>
      <SystemHealthDashboard />
      <ExecutionLogViewer />
      <RuleAuditTrail />
    </div>
  );
}
