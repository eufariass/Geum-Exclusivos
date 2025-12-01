import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Lead, PipelineStage } from '@/types';
import { SortableLeadCard } from './SortableLeadCard';
import { Badge } from '@/components/ui/badge';

interface PipelineColumnProps {
  stage: PipelineStage;
  leads: Lead[];
  onLeadClick?: (lead: Lead) => void;
}

export const PipelineColumn = ({ stage, leads, onLeadClick }: PipelineColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  return (
    <div className="flex flex-col min-w-[300px] max-w-[300px]">
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 rounded-t-lg"
        style={{ backgroundColor: stage.color + '20', borderLeft: `4px solid ${stage.color}` }}
      >
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">{stage.name}</h3>
          {stage.is_final && (
            <Badge variant={stage.is_won ? 'default' : 'secondary'} className="text-xs">
              {stage.is_won ? '✓ Ganho' : '✗ Perdido'}
            </Badge>
          )}
        </div>
        <Badge variant="outline" className="text-xs">
          {leads.length}
        </Badge>
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className={`
          flex-1 p-3 space-y-2 bg-muted/30 rounded-b-lg min-h-[400px] transition-colors
          ${isOver ? 'bg-primary/10 ring-2 ring-primary' : ''}
        `}
      >
        <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <SortableLeadCard key={lead.id} lead={lead} onClick={onLeadClick} />
          ))}
        </SortableContext>

        {leads.length === 0 && (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            Nenhum lead nesta etapa
          </div>
        )}
      </div>
    </div>
  );
};
