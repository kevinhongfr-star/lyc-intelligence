import React, { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useMandates } from '@/hooks/useSupabaseData';
import {
  Briefcase,
  Clock,
  Users,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export function ClientMandates() {
  const { profile } = useAuthStore();
  const { data: mandates, loading } = useMandates({
    organizationId: profile?.organization_id || '',
    limit: 100,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [phaseFilter, setPhaseFilter] = useState<string>('all');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const getPhaseLabel = (status: string) => {
    switch (status) {
      case '1_search':
        return 'Sourcing';
      case '2_call':
        return 'Client Review';
      case '3_deliver':
        return 'Interview';
      case 'won':
      case 'completed':
        return 'Completed';
      case 'on_hold':
        return 'On Hold';
      case 'lost':
        return 'Closed';
      default:
        return status;
    }
  };

  const getPhaseColor = (status: string) => {
    switch (status) {
      case '1_search':
        return 'bg-blue-100 text-blue-700';
      case '2_call':
        return 'bg-purple-100 text-purple-700';
      case '3_deliver':
        return 'bg-amber-100 text-amber-700';
      case 'won':
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-700';
      case 'lost':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case '1_search':
      case '2_call':
      case '3_deliver':
        return 'Active';
      case 'won':
      case 'completed':
        return 'Completed';
      case 'on_hold':
        return 'On Hold';
      case 'lost':
        return 'Closed';
      default:
        return status;
    }
  };

  const filteredMandates = mandates.filter((m) => {
    const matchesSearch =
      m.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.company?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || getStatusLabel(m.status) === statusFilter;
    const matchesPhase =
      phaseFilter === 'all' || getPhaseLabel(m.status) === phaseFilter;
    return matchesSearch && matchesStatus && matchesPhase;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff} days ago`;
    if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
    return `${Math.floor(diff / 30)} months ago`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-text-primary">My Mandates</h1>
          <p className="text-text-muted">All search engagements for your organization</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            placeholder="Search mandates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm"
        >
          <option value="all">All Status</option>
          <option value="Active">Active</option>
          <option value="Completed">Completed</option>
          <option value="On Hold">On Hold</option>
          <option value="Closed">Closed</option>
        </select>
        <select
          value={phaseFilter}
          onChange={(e) => setPhaseFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm"
        >
          <option value="all">All Phases</option>
          <option value="Sourcing">Sourcing</option>
          <option value="Client Review">Client Review</option>
          <option value="Interview">Interview</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      <div className="space-y-3">
        {filteredMandates.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Briefcase className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-muted">No mandates found matching your criteria</p>
            </CardContent>
          </Card>
        ) : (
          filteredMandates.map((mandate) => (
            <Card key={mandate.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-text-primary text-lg">{mandate.title}</h3>
                      <Badge variant="secondary" className={getPhaseColor(mandate.status)}>
                        {getPhaseLabel(mandate.status)}
                      </Badge>
                    </div>
                    <p className="text-text-muted mt-1">{mandate.company?.name}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-text-muted">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {mandate.shortlisted_count || 0} shortlisted
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Updated {getDaysAgo(mandate.updated_at || mandate.created_at)}
                      </span>
                    </div>
                  </div>
                  <Link
                    to={`/client/mandates/${mandate.id}`}
                    className="flex items-center gap-2 text-accent hover:text-accent/80 transition-colors"
                  >
                    View Details
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
