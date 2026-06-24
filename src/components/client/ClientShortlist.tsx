import React from 'react';
import { useParams } from 'react-router-dom';
import { useMandateDetail } from '@/hooks/useSupabaseData';
import {
  Users,
  Briefcase,
  Award,
  FileText,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Loader2 } from 'lucide-react';

export function ClientShortlist() {
  const { id } = useParams<{ id: string }>();
  const { mandate, pipeline, loading } = useMandateDetail(id || '');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const shortlistedCandidates = pipeline.filter((p) => p.stage === 'GRID' || p.stage === 'client_approved');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-text-primary">
          {mandate.title} - Shortlist
        </h1>
        <p className="text-text-muted">{shortlistedCandidates.length} candidates shortlisted</p>
      </div>

      {/* Shortlist Cards */}
      <div className="grid grid-cols-2 gap-4">
        {shortlistedCandidates.length === 0 ? (
          <Card className="col-span-2">
            <CardContent className="p-12 text-center">
              <Users className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-muted">No candidates have been shortlisted yet</p>
            </CardContent>
          </Card>
        ) : (
          shortlistedCandidates.map((candidate) => (
            <Card key={candidate.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-bold text-white">
                      {candidate.contact?.name?.[0] || '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-text-primary text-lg">
                        {candidate.contact?.name || 'Unknown'}
                      </h3>
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        Shortlisted
                      </Badge>
                    </div>
                    <p className="text-text-muted mt-1">
                      {candidate.contact?.current_title}
                    </p>
                    <p className="text-text-muted text-sm">
                      {candidate.contact?.company?.name}
                    </p>

                    {/* Key Highlights */}
                    <div className="mt-4 space-y-2">
                      {candidate.summary && (
                        <div className="flex items-start gap-2">
                          <FileText className="w-4 h-4 text-text-muted flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-text-secondary line-clamp-3">
                            {candidate.summary}
                          </p>
                        </div>
                      )}
                      {candidate.trident_d1 !== null && (
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-amber-500" />
                          <span className="text-sm">
                            Experience: <span className="font-medium">{candidate.trident_d1}%</span>
                          </span>
                        </div>
                      )}
                      {candidate.trident_d2 !== null && (
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-blue-500" />
                          <span className="text-sm">
                            Skills: <span className="font-medium">{candidate.trident_d2}%</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
