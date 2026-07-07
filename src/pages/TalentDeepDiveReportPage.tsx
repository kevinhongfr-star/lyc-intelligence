import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { TalentDeepDive } from '@/components/reports/TalentDeepDive';

export function TalentDeepDiveReportPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <Link
        to="/reports"
        className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-accent"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Reports
      </Link>

      <h1 className="font-serif text-3xl font-bold text-text-primary">
        Talent Deep-Dive Report
      </h1>

      <TalentDeepDive />
    </div>
  );
}
