// Phase 2.8: BD Pipeline Kanban Component
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  KanbanSquare,
  Plus,
  Building2,
  User,
  DollarSign,
  Clock,
  Users,
  ChevronRight,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { STAGE_LABELS, STAGE_ORDER } from '@/types/bd';
import type { BDOpportunity, BDStage } from '@/types/bd';
import { getDaysInStage } from '@/services/bdStageTransition';
import { cn } from '@/lib/utils';

interface PipelineKanbanProps {
  orgId: string;
  onSelectOpportunity?: (opp: BDOpportunity) => void;
  onCreateOpportunity?: () => void;
}

interface KanbanData {
  columns: Record<string, BDOpportunity[]>;
  stage_order: BDStage[];
  total_pipeline_value: number;
  total_opportunities: number;
}

const STAGE_COLORS: Record<string, string> = {
  prospect: 'border-gray-400',
  qualified: 'border-blue-400',
  proposal_sent: 'border-amber-400',
  pitch_delivered: 'border-purple-400',
  negotiate: 'border-pink-400',
  signed: 'border-tier-1',
  lost: 'border-red-400',
  deferred: 'border-gray-300',
};

const STAGE_HEADER_COLORS: Record<string, string> = {
  prospect: 'bg-gray-100 text-gray-700',
  qualified: 'bg-blue-100 text-blue-700',
  proposal_sent: 'bg-amber-100 text-amber-700',
  pitch_delivered: 'bg-purple-100 text-purple-700',
  negotiate: 'bg-pink-100 text-pink-700',
  signed: 'bg-tier-1/10 text-tier-1',
  lost: 'bg-red-100 text-red-700',
  deferred: 'bg-gray-100 text-gray-500',
};

export function PipelineKanban({ orgId, onSelectOpportunity, onCreateOpportunity }: PipelineKanbanProps) {
  const [kanbanData, setKanbanData] = useState<KanbanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState<BDOpportunity | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const fetchPipeline = useCallback(async () => {
    try {
      const response = await fetch(`/api/x/bd/pipeline?org_id=${orgId}`);
      const result = await response.json();
      if (result.success) {
        setKanbanData(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch pipeline:', err);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchPipeline();
  }, [fetchPipeline]);

  const handleDragStart = (opp: BDOpportunity) => {
    setDraggedItem(opp);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    setDragOverStage(stage);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStage: BDStage) => {
    e.preventDefault();
    setDragOverStage(null);

    if (!draggedItem || draggedItem.stage === targetStage) {
      setDraggedItem(null);
      return;
    }

    try {
      const response = await fetch(`/api/x/bd/opportunities/${draggedItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'transition_stage',
          org_id: orgId,
          user_id: draggedItem.owner_id,
          new_stage: targetStage,
        }),
      });

      const result = await response.json();
      if (result.success) {
        fetchPipeline();
      } else {
        console.error('Stage transition failed:', result.error);
      }
    } catch (err) {
      console.error('Failed to transition stage:', err);
    } finally {
      setDraggedItem(null);
    }
  };

  const formatCurrency = (value: number | null): string => {
    if (!value) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'CNY',
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-text-muted">Loading pipeline...</div>
      </Card>
    );
  }

  if (!kanbanData) return null;

  const displayStages = STAGE_ORDER;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <KanbanSquare className="w-6 h-6 text-accent" />
          <div>
            <h2 className="font-serif font-semibold text-lg text-text-primary">BD Pipeline</h2>
            <p className="text-sm text-text-muted">
              {kanbanData.total_opportunities} opportunities •{' '}
              {formatCurrency(kanbanData.total_pipeline_value)} pipeline value
            </p>
          </div>
        </div>
        {onCreateOpportunity && (
          <Button onClick={onCreateOpportunity}>
            <Plus className="w-4 h-4 mr-2" />
            New Opportunity
          </Button>
        )}
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
        {displayStages.map((stage) => {
          const opportunities = kanbanData.columns[stage] || [];
          const isDragOver = dragOverStage === stage;

          return (
            <div
              key={stage}
              className={cn(
                'flex-shrink-0 w-72 flex flex-col',
                'rounded-lg',
                isDragOver && 'ring-2 ring-accent ring-offset-2'
              )}
              onDragOver={(e) => handleDragOver(e, stage)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage)}
            >
              {/* Column Header */}
              <div
                className={cn(
                  'px-3 py-2 rounded-t-lg font-medium text-sm flex items-center justify-between',
                  STAGE_HEADER_COLORS[stage] || 'bg-bg-secondary text-text-primary'
                )}
              >
                <span>{STAGE_LABELS[stage]}</span>
                <Badge variant="default" className="text-xs">
                  {opportunities.length}
                </Badge>
              </div>

              {/* Column Body */}
              <div
                className={cn(
                  'flex-1 min-h-[200px] bg-bg-secondary rounded-b-lg p-2 space-y-2',
                  `border-l-2 border-r-2 border-b-2`,
                  STAGE_COLORS[stage] || 'border-bg-hover'
                )}
              >
                {opportunities.length === 0 ? (
                  <div className="text-center text-text-muted text-xs py-4">
                    No opportunities
                  </div>
                ) : (
                  opportunities.map((opp) => {
                    const daysInStage = getDaysInStage(opp);
                    const isDragging = draggedItem?.id === opp.id;

                    return (
                      <div
                        key={opp.id}
                        draggable
                        onDragStart={() => handleDragStart(opp)}
                        onDragEnd={handleDragEnd}
                        onClick={() => onSelectOpportunity?.(opp)}
                        className={cn(
                          'p-3 bg-bg-base rounded-lg cursor-pointer',
                          'hover:bg-bg-hover transition-colors',
                          'border border-bg-hover',
                          isDragging && 'opacity-50'
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm text-text-primary line-clamp-1">
                            {opp.company_name}
                          </h4>
                          <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0 ml-1" />
                        </div>

                        <div className="space-y-1 text-xs text-text-muted">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span className="truncate">{opp.primary_contact_name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{opp.estimated_roles} role{opp.estimated_roles !== 1 ? 's' : ''}</span>
                          </div>
                          {opp.estimated_fee_total && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              <span>{formatCurrency(Number(opp.estimated_fee_total))}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{daysInStage} day{daysInStage !== 1 ? 's' : ''} in stage</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Drop zone indicator */}
                {isDragOver && draggedItem && draggedItem.stage !== stage && (
                  <div className="border-2 border-dashed border-accent rounded-lg p-4 text-center text-xs text-accent">
                    Drop to move here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PipelineKanban;
