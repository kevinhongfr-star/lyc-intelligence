import React, { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useMandates } from '@/hooks/useSupabaseData';
import {
  FileDown,
  Briefcase,
  Calendar,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader2 } from 'lucide-react';

export function ClientReports() {
  const { profile } = useAuthStore();
  const { data: mandates, loading } = useMandates({
    organizationId: profile?.organization_id || '',
    limit: 50,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const reports = [
    { id: '1', mandateId: mandates[0]?.id, mandateTitle: mandates[0]?.title || 'VP Engineering', type: 'market', name: 'Market Map Report', date: 'June 20, 2024' },
    { id: '2', mandateId: mandates[0]?.id, mandateTitle: mandates[0]?.title || 'VP Engineering', type: 'shortlist', name: 'Shortlist Summary', date: 'June 18, 2024' },
    { id: '3', mandateId: mandates[1]?.id, mandateTitle: mandates[1]?.title || 'Director of Operations', type: 'shortlist', name: 'Candidate Profiles', date: 'June 15, 2024' },
    { id: '4', mandateId: mandates[1]?.id, mandateTitle: mandates[1]?.title || 'Director of Operations', type: 'debrief', name: 'Interview Debrief', date: 'June 12, 2024' },
    { id: '5', mandateId: mandates[2]?.id, mandateTitle: mandates[2]?.title || 'Head of Product', type: 'summary', name: 'Search Summary', date: 'June 10, 2024' },
  ];

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'market':
        return 'Market Map';
      case 'shortlist':
        return 'Shortlist';
      case 'debrief':
        return 'Interview Debrief';
      case 'summary':
        return 'Search Summary';
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'market':
        return 'bg-blue-100 text-blue-700';
      case 'shortlist':
        return 'bg-green-100 text-green-700';
      case 'debrief':
        return 'bg-purple-100 text-purple-700';
      case 'summary':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.mandateTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || r.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-text-primary">Reports</h1>
        <p className="text-text-muted">Download reports for your search engagements</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm"
        >
          <option value="all">All Types</option>
          <option value="market">Market Map</option>
          <option value="shortlist">Shortlist</option>
          <option value="debrief">Interview Debrief</option>
          <option value="summary">Search Summary</option>
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredReports.length === 0 ? (
            <div className="p-12 text-center">
              <FileDown className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-muted">No reports found matching your criteria</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-accent/10 rounded-lg">
                      <FileDown className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-medium text-text-primary">{report.name}</h3>
                      <div className="flex items-center gap-3 text-sm text-text-muted">
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          {report.mandateTitle}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {report.date}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className={getTypeColor(report.type)}>
                      {getTypeLabel(report.type)}
                    </Badge>
                    <Button variant="ghost" size="sm" className="text-accent">
                      <FileDown className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
