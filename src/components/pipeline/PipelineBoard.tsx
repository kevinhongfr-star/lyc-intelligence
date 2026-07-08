import React, { useState, useEffect, useCallback, DragEvent } from 'react';
import { Loader2, Clock, CheckSquare, Square, X, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui';
import { 
  PIPELINE_STAGE_ORDER, 
  STAGE_CONFIG, 
  PipelineStageName,
  PipelineStageConfig,
  getScoreColor,
  LIST_STATUS_OPTIONS
} from '@/types/pipelineStages';
import type { CandidatePipeline, Mandate } from '@/services/supabaseApi';
import { getMandateWithPipeline, updatePipelineStage } from '@/services/supabaseApi';

interface PipelineBoardProps {
  mandateId: string;
  onCandidateSelect?: (candidate: CandidatePipeline) => void;
  onOpenScorecard?: (candidateId: string) => void;
  selectedCandidates?: string[];
  onToggleCandidate?: (candidateId: string) => void;
}

interface DragState {
  candidateId: string | null;
  sourceStage: PipelineStageName | null;
}

export function PipelineBoard({ 
  mandateId, 
  onCandidateSelect,
  onOpenScorecard,
  selectedCandidates = [],
  onToggleCandidate
}: PipelineBoardProps) {
  const [mandate, setMandate] = useState<Mandate | null>(null);
  const [pipeline, setPipeline] = useState<Record<string, CandidatePipeline[]>>({});
  const [loading, setLoading] = useState(true);
  const [dragState, setDragState] = useState<DragState>({ candidateId: null, sourceStage: null });
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [showMoveConfirmation, setShowMoveConfirmation] = useState<{ name: string; from: string; to: string } | null>(null);

  // Load pipeline data
  useEffect(() => {
    const loadPipeline = async () => {
      setLoading(true);
      const { mandate: m, pipeline: p } = await getMandateWithPipeline(mandateId);
      setMandate(m);
      
      // Group pipeline by stage
      const grouped: Record<string, CandidatePipeline[]> = {};
      
      // Initialize with all known stages
      PIPELINE_STAGE_ORDER.forEach(stage => {
        grouped[stage] = [];
      });
      
      p.forEach(cp => {
        const stage = cp.stage || 'approach';
        if (!grouped[stage]) {
          grouped[stage] = [];
        }
        grouped[stage].push(cp);
      });
      
      setPipeline(grouped);
      setLoading(false);
    };
    
    loadPipeline();
  }, [mandateId]);

  // Calculate days in stage
  const getDaysInStage = useCallback((candidate: CandidatePipeline): number => {
    const updated = new Date(candidate.updated_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - updated.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, []);

  // Get list status color
  const getListStatusInfo = useCallback((status: string | null) => {
    if (!status) return null;
    return LIST_STATUS_OPTIONS.find(s => s.value === status) || null;
  }, []);

  // Drag handlers
  const handleDragStart = (e: DragEvent, candidateId: string, sourceStage: string) => {
    e.dataTransfer.effectAllowed = 'move';
    setDragState({ candidateId, sourceStage: sourceStage as PipelineStageName });
  };

  const handleDragOver = (e: DragEvent, stage: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stage);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = async (e: DragEvent, targetStage: string) => {
    e.preventDefault();
    setDragOverStage(null);
    
    if (!dragState.candidateId || !dragState.sourceStage) return;
    if (dragState.sourceStage === targetStage) {
      setDragState({ candidateId: null, sourceStage: null });
      return;
    }

    const candidate = pipeline[dragState.sourceStage]?.find(c => c.id === dragState.candidateId);
    if (!candidate) return;

    const stageConfig = STAGE_CONFIG[targetStage as PipelineStageName];
    const sourceConfig = STAGE_CONFIG[dragState.sourceStage as PipelineStageName];

    // Show confirmation
    setShowMoveConfirmation({
      name: candidate.contact?.name || 'Unknown',
      from: sourceConfig?.label || dragState.sourceStage,
      to: stageConfig?.label || targetStage,
    });
  };

  const confirmMove = async () => {
    if (!showMoveConfirmation || !dragState.candidateId) return;

    const targetStage = dragOverStage || Object.keys(pipeline).find(s => 
      pipeline[s]?.some(c => c.id === dragState.candidateId)
    );
    
    if (!targetStage) return;

    const sourceStage = dragState.sourceStage!;
    const candidate = pipeline[sourceStage]?.find(c => c.id === dragState.candidateId);
    if (!candidate) return;

    // Optimistic update
    setPipeline(prev => ({
      ...prev,
      [sourceStage]: (prev[sourceStage] || []).filter(c => c.id !== dragState.candidateId),
      [targetStage]: [...(prev[targetStage] || []), { ...candidate, stage: targetStage }],
    }));

    // API call
    const success = await updatePipelineStage(dragState.candidateId, targetStage);
    
    if (!success) {
      // Revert on failure
      setPipeline(prev => ({
        ...prev,
        [sourceStage]: [...(prev[sourceStage] || []), candidate],
        [targetStage]: (prev[targetStage] || []).filter(c => c.id !== dragState.candidateId),
      }));
    }

    setShowMoveConfirmation(null);
    setDragState({ candidateId: null, sourceStage: null });
  };

  const cancelMove = () => {
    setShowMoveConfirmation(null);
    setDragState({ candidateId: null, sourceStage: null });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const totalCandidates = Object.values(pipeline).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">{mandate?.title}</h2>
          <p className="text-sm text-text-muted">
            {totalCandidates} candidates
          </p>
        </div>
        {onToggleCandidate && selectedCandidates.length > 0 && (
          <button
            onClick={() => {
              /* Open comparison view */
            }}
            className="px-4 py-2 bg-accent text-white rounded-none text-sm font-medium hover:bg-accent/90"
          >
            Compare {selectedCandidates.length} Candidates
          </button>
        )}
      </div>

      {/* Pipeline Board - Horizontal Scroll */}
      <div className="overflow-x-auto pb-4">
        <div 
          className="flex gap-2 min-w-max"
          style={{ minWidth: `${PIPELINE_STAGE_ORDER.length * 180}px` }}
        >
          {PIPELINE_STAGE_ORDER.map(stageName => {
            const stageConfig = STAGE_CONFIG[stageName];
            const candidates = pipeline[stageName] || [];
            const isDragOver = dragOverStage === stageName;
            
            return (
              <div
                key={stageName}
                className={`w-44 flex-shrink-0 rounded-none border-2 transition-all ${
                  isDragOver ? 'border-accent bg-accent/5' : 'border-bg-tertiary'
                }`}
                onDragOver={(e) => handleDragOver(e, stageName)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stageName)}
              >
                {/* Stage Header */}
                <div 
                  className="px-3 py-2 border-b border-bg-tertiary rounded-t-lg"
                  style={{ backgroundColor: stageConfig.bgColor }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: stageConfig.color }}
                      />
                      <span className="text-sm font-medium text-text-primary">
                        {stageConfig.label}
                      </span>
                    </div>
                    <Badge variant="default" className="text-xs">
                      {candidates.length}
                    </Badge>
                  </div>
                </div>

                {/* Candidates */}
                <div className="p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-400px)] overflow-y-auto">
                  {candidates.map(candidate => (
                    <CandidateCard
                      key={candidate.id}
                      candidate={candidate}
                      stageConfig={stageConfig}
                      isDragging={dragState.candidateId === candidate.id}
                      onDragStart={() => handleDragStart({} as DragEvent, candidate.id, stageName)}
                      onSelect={() => onCandidateSelect?.(candidate)}
                      onOpenScorecard={() => onOpenScorecard?.(candidate.id)}
                      isSelected={selectedCandidates.includes(candidate.id)}
                      onToggleSelect={() => onToggleCandidate?.(candidate.id)}
                      daysInStage={getDaysInStage(candidate)}
                      listStatus={getListStatusInfo(candidate.sweep_tier)}
                    />
                  ))}
                  
                  {candidates.length === 0 && (
                    <div className="text-center py-8 text-text-muted text-xs">
                      Drop candidates here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Move Confirmation Modal */}
      {showMoveConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-none p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Confirm Move</h3>
            <p className="text-text-secondary mb-6">
              Move <strong>{showMoveConfirmation.name}</strong> from{' '}
              <span className="text-text-primary">{showMoveConfirmation.from}</span> to{' '}
              <span className="text-accent">{showMoveConfirmation.to}</span>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelMove}
                className="flex-1 px-4 py-2 border border-bg-tertiary rounded-none text-text-secondary hover:bg-bg-tertiary"
              >
                Cancel
              </button>
              <button
                onClick={confirmMove}
                className="flex-1 px-4 py-2 bg-accent text-white rounded-none hover:bg-accent/90"
              >
                Move
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Candidate Card Component
interface CandidateCardProps {
  candidate: CandidatePipeline;
  stageConfig: PipelineStageConfig;
  isDragging: boolean;
  onDragStart: () => void;
  onSelect: () => void;
  onOpenScorecard: () => void;
  isSelected: boolean;
  onToggleSelect: () => void;
  daysInStage: number;
  listStatus: { value: string; label: string; color: string } | null;
}

function CandidateCard({
  candidate,
  stageConfig,
  isDragging,
  onDragStart,
  onSelect,
  onOpenScorecard,
  isSelected,
  onToggleSelect,
  daysInStage,
  listStatus,
}: CandidateCardProps) {
  const score = candidate.trident_composite || candidate.match_score || 0;
  const scoreColor = getScoreColor(score);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onSelect}
      className={`bg-bg-primary border border-bg-tertiary rounded-none p-3 cursor-pointer transition-all hover:shadow-md group ${
        isDragging ? 'opacity-50 scale-95' : ''
      } ${isSelected ? 'ring-2 ring-accent' : ''}`}
      style={{ borderLeftColor: stageConfig.color, borderLeftWidth: '3px' }}
    >
      {/* Header Row */}
      <div className="flex items-start gap-2 mb-2">
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
          style={{ backgroundColor: stageConfig.color }}
        >
          {candidate.contact?.name?.[0] ?? '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">
            {candidate.contact?.name ?? 'Unknown'}
          </p>
          <p className="text-xs text-text-muted truncate">
            {candidate.contact?.current_title || 'No title'}
          </p>
        </div>
        {onToggleSelect && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {isSelected ? (
              <CheckSquare className="w-4 h-4 text-accent" />
            ) : (
              <Square className="w-4 h-4 text-text-muted" />
            )}
          </button>
        )}
      </div>

      {/* Meta Row */}
      <div className="flex items-center gap-2 mb-2">
        {score > 0 && (
          <span 
            className="px-2 py-0.5 rounded text-xs font-bold text-white"
            style={{ backgroundColor: scoreColor }}
          >
            {score}
          </span>
        )}
        {listStatus && (
          <span 
            className="px-2 py-0.5 rounded text-xs text-white"
            style={{ backgroundColor: listStatus.color }}
          >
            {listStatus.label}
          </span>
        )}
      </div>

      {/* Footer Row */}
      <div className="flex items-center justify-between text-xs text-text-muted">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{daysInStage}d</span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onOpenScorecard(); }}
          className="text-accent hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
        >
          Scorecard
        </button>
      </div>

      {/* METRIX Badge (if transcript exists) */}
      {candidate.contact?.notion_id && (
        <div className="mt-2 flex items-center gap-1 text-xs text-purple-600">
          <MessageSquare className="w-3 h-3" />
          <span>METRIX Intel</span>
        </div>
      )}
    </div>
  );
}

export default PipelineBoard;
