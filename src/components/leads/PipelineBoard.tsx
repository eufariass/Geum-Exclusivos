import { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners } from '@dnd-kit/core';
import type { Lead } from '@/types';
import { pipelineService, type LeadsByStage } from '@/services/pipeline.service';
import { PipelineColumn } from './PipelineColumn';
import { PipelineLeadCard } from './PipelineLeadCard';
import { LeadDetailModal } from './LeadDetailModal';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PipelineBoardProps {
  onRefresh?: () => void;
}

export const PipelineBoard = ({ onRefresh }: PipelineBoardProps) => {
  const [leadsByStage, setLeadsByStage] = useState<LeadsByStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const data = await pipelineService.getLeadsByStage();
      setLeadsByStage(data);
    } catch (error) {
      console.error('Error loading leads:', error);
      toast.error('Erro ao carregar leads');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const leadId = active.id as string;
    const targetStageId = over.id as string;

    // Encontrar lead e stage
    let lead: Lead | null = null;
    let fromStageId: string | null = null;

    for (const group of leadsByStage) {
      const foundLead = group.leads.find((l) => l.id === leadId);
      if (foundLead) {
        lead = foundLead;
        fromStageId = group.stage.id;
        break;
      }
    }

    if (!lead || fromStageId === targetStageId) return;

    // Mover para nova etapa
    try {
      await pipelineService.moveLeadToStage(leadId, targetStageId);
      toast.success('Lead movido com sucesso!');
      await loadLeads();
      onRefresh?.();
    } catch (error) {
      console.error('Error moving lead:', error);
      toast.error('Erro ao mover lead');
    }
  };

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setShowDetailModal(true);
  };

  const handleLeadUpdated = () => {
    loadLeads();
    onRefresh?.();
  };

  // Encontrar lead ativo para overlay
  const activeLead = leadsByStage
    .flatMap((g) => g.leads)
    .find((l) => l.id === activeId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <DndContext
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {leadsByStage.map((group) => (
            <PipelineColumn
              key={group.stage.id}
              stage={group.stage}
              leads={group.leads}
              onLeadClick={handleLeadClick}
            />
          ))}
        </div>

        <DragOverlay>
          {activeLead ? <PipelineLeadCard lead={activeLead} isDragging /> : null}
        </DragOverlay>
      </DndContext>

      {showDetailModal && selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedLead(null);
          }}
          onLeadUpdated={handleLeadUpdated}
        />
      )}
    </>
  );
};
