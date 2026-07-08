import React, { useState, useEffect } from 'react';
import { 
  Briefcase, Search, Filter, ArrowRight, Calendar, Users,
  Building2, Star, Award, Clock, Target, ChevronDown
} from 'lucide-react';
import { Badge, Button, Card, Input } from '@/components/ui';

export function ClientMandatesPage() {
  const [mandates, setMandates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadMandates();
  }, []);

  async function loadMandates() {
    try {
      const res = await fetch('/api/client/mandates');
      const data = await res.json();
      if (data.success) {
        setMandates(data.mandates);
      }
    } catch (err) {
      console.error('Load mandates error:', err);
    } finally {
      setLoading(false);
    }
  }

  const mockMandates = [
    { id: 'm1', title: 'VP of Engineering', status: 'Active', days_since_kickoff: 15, candidates_count: 4, progress: 65, lead_consultant: 'Emily Zhang' },
    { id: 'm2', title: 'Director of Product', status: 'On Hold', days_since_kickoff: 30, candidates_count: 2, progress: 30, lead_consultant: 'Michael Chen' },
    { id: 'm3', title: 'Senior Data Scientist', status: 'Active', days_since_kickoff: 8, candidates_count: 6, progress: 45, lead_consultant: 'Sarah Kim' },
    { id: 'm4', title: 'Head of Marketing', status: 'Active', days_since_kickoff: 22, candidates_count: 3, progress: 80, lead_consultant: 'David Liu' },
    { id: 'm5', title: 'CTO', status: 'Closed', days_since_kickoff: 45, candidates_count: 5, progress: 100, lead_consultant: 'Emily Zhang' },
    { id: 'm6', title: 'VP of Sales', status: 'Active', days_since_kickoff: 5, candidates_count: 2, progress: 20, lead_consultant: 'James Wang' },
  ];

  const filteredMandates = (mandates.length > 0 ? mandates : mockMandates).filter(mandate => {
    const matchesSearch = mandate.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || mandate.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
          <h1 className="text-2xl font-serif text-text-primary">My Mandates</h1>
          <p className="text-text-muted mt-1">Manage and track all your active search mandates.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            placeholder="Search mandates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent"
          >
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="On Hold">On Hold</option>
            <option value="Closed">Closed</option>
          </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMandates.map((mandate) => (
          <Card key={mandate.id} className="p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Target className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-text-primary">{mandate.title}</h3>
                    <Badge className={mandate.status === 'Active' ? 'bg-green-100 text-green-700' : mandate.status === 'On Hold' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}>
                      {mandate.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-text-muted">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {mandate.candidates_count} candidates
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Day {mandate.days_since_kickoff}
                    </span>
                    <span className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      {mandate.lead_consultant}
                    </span>
                  </div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-text-muted" />
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-text-muted">Pipeline Progress</span>
                <span className="font-medium text-text-primary">{mandate.progress}%</span>
              </div>
              <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent transition-all duration-300"
                  style={{ width: `${mandate.progress}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-bg-tertiary">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm">
                  <Calendar className="w-4 h-4 mr-1" />
                  Timeline
                </Button>
                <Button variant="ghost" size="sm">
                  <FileText className="w-4 h-4 mr-1" />
                  Documents
                </Button>
              </div>
              <Button size="sm">
                View Details
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {filteredMandates.length === 0 && (
        <div className="text-center py-12">
          <Briefcase className="w-16 h-16 mx-auto text-text-muted mb-4" />
          <h3 className="text-lg font-medium text-text-primary">No mandates found</h3>
          <p className="text-text-muted mt-2">Try adjusting your filters or search criteria.</p>
        </div>
      )}
    </div>
  );
}

export default ClientMandatesPage;