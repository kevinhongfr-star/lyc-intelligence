import React, { useState, useEffect } from 'react';
import { X, MessageSquare, FileText, TrendingUp, Clock, Loader2, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui';
import { getMetrixTranscripts } from '@/services/supabaseApi';

interface MetrixTranscript {
  id: string;
  content: string;
  relevance_score: number;
  created_at: string;
}

interface MetrixIntelProps {
  candidateName: string;
  company?: string;
  onClose: () => void;
}

export function MetrixIntelView({ candidateName, company, onClose }: MetrixIntelProps) {
  const [transcripts, setTranscripts] = useState<MetrixTranscript[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTranscript, setSelectedTranscript] = useState<MetrixTranscript | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTranscripts();
  }, [candidateName, company]);

  const loadTranscripts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getMetrixTranscripts(candidateName, company);
      setTranscripts(data);
      if (data.length > 0) {
        setSelectedTranscript(data[0]);
      }
    } catch (err) {
      console.error('Error loading METRIX transcripts:', err);
      setError('Failed to load transcripts');
    } finally {
      setLoading(false);
    }
  };

  const getRelevanceColor = (score: number): string => {
    if (score >= 80) return '#22C55E';
    if (score >= 60) return '#EAB308';
    return '#EF4444';
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-none p-8">
          <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto" />
          <p className="text-text-muted mt-4">Loading METRIX Intel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-none p-8 max-w-md">
          <p className="text-red-500 mb-4">{error}</p>
          <button onClick={onClose} className="px-4 py-2 bg-accent text-white rounded-none">
            Close
          </button>
        </div>
      </div>
    );
  }

  if (transcripts.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-none p-8 max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">No METRIX Intel Found</h3>
          <p className="text-text-muted mb-6">
            No interview transcripts found for {candidateName}
            {company && ` at ${company}`}.
          </p>
          <button onClick={onClose} className="px-4 py-2 bg-accent text-white rounded-none">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-bg-tertiary flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">METRIX Intel</h2>
              <p className="text-sm text-text-muted">
                {transcripts.length} transcript{transcripts.length !== 1 ? 's' : ''} for {candidateName}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-bg-tertiary rounded-none">
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Transcript List */}
          <div className="w-80 border-r border-bg-tertiary overflow-y-auto">
            <div className="p-4 space-y-3">
              {transcripts.map((transcript, index) => (
                <button
                  key={transcript.id}
                  onClick={() => setSelectedTranscript(transcript)}
                  className={`w-full text-left p-3 rounded-none border transition-all ${
                    selectedTranscript?.id === transcript.id
                      ? 'border-accent bg-accent/5'
                      : 'border-bg-tertiary hover:border-accent/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-text-primary">
                      Transcript {index + 1}
                    </span>
                    <div 
                      className="px-2 py-0.5 rounded text-xs font-bold text-white"
                      style={{ backgroundColor: getRelevanceColor(transcript.relevance_score) }}
                    >
                      {transcript.relevance_score}%
                    </div>
                  </div>
                  <p className="text-xs text-text-muted line-clamp-2">
                    {truncateText(transcript.content, 100)}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-text-muted">
                    <Clock className="w-3 h-3" />
                    {formatDate(transcript.created_at)}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Transcript Content */}
          <div className="flex-1 overflow-y-auto">
            {selectedTranscript && (
              <div className="p-6">
                {/* Relevance Score */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-text-primary">Relevance Score</span>
                    <span 
                      className="text-2xl font-bold"
                      style={{ color: getRelevanceColor(selectedTranscript.relevance_score) }}
                    >
                      {selectedTranscript.relevance_score}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-bg-tertiary rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ 
                        width: `${selectedTranscript.relevance_score}%`,
                        backgroundColor: getRelevanceColor(selectedTranscript.relevance_score)
                      }}
                    />
                  </div>
                </div>

                {/* Transcript */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-text-muted" />
                    <h3 className="text-sm font-semibold text-text-primary">Transcript</h3>
                  </div>
                  <div className="bg-bg-secondary rounded-none p-4">
                    <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
                      {selectedTranscript.content}
                    </p>
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex items-center gap-4 text-xs text-text-muted">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(selectedTranscript.created_at)}
                  </div>
                  <Badge variant="default">
                    METRIX Interview
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-bg-tertiary bg-bg-secondary flex items-center justify-between">
          <span className="text-xs text-text-muted">
            Showing {transcripts.length} transcript{transcripts.length !== 1 ? 's' : ''}
          </span>
          <a 
            href="/platform/metrix"
            className="text-xs text-accent hover:underline flex items-center gap-1"
          >
            View in METRIX
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}

// METRIX Badge Component for Pipeline Cards
interface MetrixBadgeProps {
  hasTranscript: boolean;
  onClick?: () => void;
}

export function MetrixBadge({ hasTranscript, onClick }: MetrixBadgeProps) {
  if (!hasTranscript) return null;

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium hover:bg-purple-200 transition-colors"
    >
      <MessageSquare className="w-3 h-3" />
      <span>METRIX</span>
    </button>
  );
}

export default MetrixIntelView;
