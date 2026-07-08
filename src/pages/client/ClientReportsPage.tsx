import React, { useState, useEffect } from 'react';
import { 
  FileText, Download, Calendar, TrendingUp, Building2,
  ArrowRight, Search, Filter, ChevronDown, RefreshCw
} from 'lucide-react';
import { Badge, Button, Card, Input } from '@/components/ui';

export function ClientReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    try {
      const res = await fetch('/api/client/reports');
      const data = await res.json();
      if (data.success) {
        setReports(data.reports);
      }
    } catch (err) {
      console.error('Load reports error:', err);
    } finally {
      setLoading(false);
    }
  }

  const mockReports = [
    { id: 'r1', title: 'VP of Engineering - Talent Report', type: 'Talent Deep-Dive', mandate: 'VP of Engineering', generated_at: '2024-01-15', status: 'available', file_size: '2.4 MB' },
    { id: 'r2', title: 'Quarterly Talent Pipeline Review', type: 'Pipeline Analysis', mandate: 'All Active', generated_at: '2024-01-10', status: 'available', file_size: '1.8 MB' },
    { id: 'r3', title: 'Director of Product - GRID Report', type: 'GRID Report', mandate: 'Director of Product', generated_at: '2024-01-08', status: 'available', file_size: '3.2 MB' },
    { id: 'r4', title: 'Market Intelligence Summary', type: 'Market Intelligence', mandate: 'All Active', generated_at: '2024-01-05', status: 'available', file_size: '1.2 MB' },
    { id: 'r5', title: 'Senior Data Scientist - Candidate Assessment', type: 'Candidate Assessment', mandate: 'Senior Data Scientist', generated_at: '2024-01-03', status: 'available', file_size: '856 KB' },
    { id: 'r6', title: 'Year-End Talent Review', type: 'Strategic Review', mandate: 'All', generated_at: '2023-12-20', status: 'available', file_size: '5.1 MB' },
  ];

  const filteredReports = (reports.length > 0 ? reports : mockReports).filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || report.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Talent Deep-Dive': return 'bg-blue-100 text-blue-700';
      case 'GRID Report': return 'bg-purple-100 text-purple-700';
      case 'Market Intelligence': return 'bg-green-100 text-green-700';
      case 'Candidate Assessment': return 'bg-amber-100 text-amber-700';
      case 'Pipeline Analysis': return 'bg-indigo-100 text-indigo-700';
      case 'Strategic Review': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif text-text-primary">Reports</h1>
          <p className="text-text-muted mt-1">Access all talent reports and analytics.</p>
        </div>
        <Button onClick={loadReports}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent"
          >
            <option value="all">All Types</option>
            <option value="Talent Deep-Dive">Talent Deep-Dive</option>
            <option value="GRID Report">GRID Report</option>
            <option value="Market Intelligence">Market Intelligence</option>
            <option value="Candidate Assessment">Candidate Assessment</option>
            <option value="Pipeline Analysis">Pipeline Analysis</option>
          </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredReports.map((report) => (
          <Card key={report.id} className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-text-primary">{report.title}</h3>
                    <Badge className={getTypeColor(report.type)}>
                      {report.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-text-muted">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      {report.mandate}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {report.generated_at}
                    </span>
                    <span>{report.file_size}</span>
                  </div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-text-muted" />
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-bg-tertiary">
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-700">
                  Available for download
                </Badge>
              </div>
              <Button size="sm">
                <Download className="w-4 h-4 mr-1" />
                Download PDF
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {filteredReports.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 mx-auto text-text-muted mb-4" />
          <h3 className="text-lg font-medium text-text-primary">No reports found</h3>
          <p className="text-text-muted mt-2">Try adjusting your filters or search criteria.</p>
        </div>
      )}
    </div>
  );
}

export default ClientReportsPage;