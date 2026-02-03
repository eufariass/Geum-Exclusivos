import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Lead, PipelineStage } from '@/types';
import { SortableLeadCard } from './SortableLeadCard';
import { Badge } from '@/components/ui/badge';
import { Inbox } from 'lucide-react';

interface PipelineColumnProps {
  stage: PipelineStage;
  leads: Lead[];
  onLeadClick?: (lead: Lead) => void;
}

export const PipelineColumn = ({ stage, leads, onLeadClick }: PipelineColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  // Estilos por etapa com cores vibrantes
  const getStageStyles = (name: string) => {
    switch (name) {
      case 'Novo Lead':
        return {
          header: 'bg-gradient-to-r from-blue-500/20 to-blue-600/10 border-blue-500/30',
          text: 'text-blue-400',
          badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
          accent: 'bg-blue-500',
        };
      case 'Em andamento':
        return {
          header: 'bg-gradient-to-r from-amber-500/20 to-orange-500/10 border-amber-500/30',
          text: 'text-amber-400',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          accent: 'bg-amber-500',
        };
      case 'Concluido':
        return {
          header: 'bg-gradient-to-r from-emerald-500/20 to-green-500/10 border-emerald-500/30',
          text: 'text-emerald-400',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          accent: 'bg-emerald-500',
        };
      default:
        return {
          header: 'bg-muted/50 border-border/50',
          text: 'text-muted-foreground',
          badge: 'bg-muted text-muted-foreground border-border',
          accent: 'bg-muted-foreground',
        };
    }
  };

  const styles = getStageStyles(stage.name);

  return (
    <div className="flex flex-col min-w-[340px] max-w-[340px] h-full">
      {/* Header */}
      <div className={`relative overflow-hidden flex items-center justify-between p-4 mb-4 rounded-2xl border backdrop-blur-sm ${styles.header}`}>
        {/* Accent bar */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${styles.accent}`} />

        <h3 className={`font-bold text-sm tracking-tight pl-3 ${styles.text}`}>
          {stage.name}
        </h3>
        <Badge
          variant="outline"
          className={`text-xs font-mono tabular-nums px-2.5 py-0.5 ${styles.badge}`}
        >
          {leads.length}
        </Badge>
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className={`
          flex-1 p-3 space-y-3 rounded-2xl transition-all duration-300 border-2 border-dashed min-h-[200px]
          ${isOver
            ? 'bg-primary/10 border-primary/40 ring-2 ring-primary/20 scale-[1.02]'
            : 'bg-muted/5 border-muted/20 hover:border-muted/40'
          }
        `}
      >
        <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <SortableLeadCard key={lead.id} lead={lead} onClick={onLeadClick} />
          ))}
        </SortableContext>

        {leads.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground/30">
            <Inbox className="h-10 w-10 mb-2" />
            <p className="text-sm font-medium">Nenhum lead</p>
            <p className="text-xs">Arraste leads para cá</p>
          </div>
        )}
      </div>
    </div>
  );
};
