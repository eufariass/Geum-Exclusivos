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

  // Map stage names to specific gradients/colors effectively if needed, or use the database color
  const getHeaderColor = (name: string) => {
    switch (name) {
      case 'Novo Lead': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Em andamento': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'Concluido': return 'bg-green-500/10 text-green-500 border-green-500/20';
      default: return 'bg-muted/50 text-muted-foreground border-border/50';
    }
  };

  const headerStyle = getHeaderColor(stage.name);

  return (
    <div className="flex flex-col min-w-[320px] max-w-[320px] h-full">
      {/* Header */}
      <div className={`flex items-center justify-between p-4 mb-3 rounded-2xl border backdrop-blur-sm ${headerStyle}`}>
        <h3 className="font-bold text-sm tracking-tight">{stage.name}</h3>
        <Badge variant="secondary" className="bg-background/50 hover:bg-background/80 text-foreground text-xs font-mono">
          {leads.length}
        </Badge>
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className={`
          flex-1 p-2 space-y-3 rounded-2xl transition-all duration-200 border border-transparent
          ${isOver ? 'bg-primary/5 border-primary/20 ring-1 ring-primary/20' : 'bg-muted/10'}
        `}
      >
        <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <SortableLeadCard key={lead.id} lead={lead} onClick={onLeadClick} />
          ))}
        </SortableContext>

        {leads.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground/40 text-sm border-2 border-dashed border-muted/20 rounded-xl">
            <p>Vazio</p>
          </div>
        )}
      </div>
    </div>
  );
};
