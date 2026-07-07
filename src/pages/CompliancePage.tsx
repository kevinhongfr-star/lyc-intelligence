import React from 'react';
import { ComplianceDashboard } from '@/components/internal/ComplianceDashboard';
import { DataAuditLog } from '@/components/internal/DataAuditLog';
import { ConsentManagement } from '@/components/internal/ConsentManagement';
import { RetentionPolicy } from '@/components/internal/RetentionPolicy';

export function CompliancePage() {
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold text-text-primary">COMPLIANCE</h1>
      <ComplianceDashboard />
      <DataAuditLog />
      <ConsentManagement />
      <RetentionPolicy />
    </div>
  );
}
