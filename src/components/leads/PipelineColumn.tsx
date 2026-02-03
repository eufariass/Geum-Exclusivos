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

  // Estilos por nome da etapa: Branco -> Amarelo -> Verde
  const getStageStyles = () => {
    const stageName = stage.name.toLowerCase();

    if (stageName.includes('novo')) {
      // Novo Lead - Branco/Neutro
      return {
        header: 'bg-white/90 border-slate-200 shadow-sm',
        text: 'text-slate-700',
        badge: 'bg-slate-100 text-slate-600 border-slate-200',
        accent: 'bg-slate-400',
      };
    }

    if (stageName.includes('atendimento') || stageName.includes('qualifica')) {
      // Em atendimento - Amarelo
      return {
        header: 'bg-gradient-to-r from-yellow-400/90 to-amber-400/80 border-yellow-500/30 shadow-sm',
        text: 'text-yellow-900',
        badge: 'bg-yellow-100 text-yellow-700 border-yellow-300',
        accent: 'bg-yellow-500',
      };
    }

    if (stageName.includes('concluido') || stageName.includes('encerrado') || stage.is_final) {
      // Concluido - Verde
      return {
        header: 'bg-gradient-to-r from-green-500/90 to-emerald-500/80 border-green-500/30 shadow-sm',
        text: 'text-white',
        badge: 'bg-white/90 text-green-700 border-green-200',
        accent: 'bg-green-600',
      };
    }

    // Fallback
    return {
      header: 'bg-muted/50 border-border/50',
      text: 'text-muted-foreground',
      badge: 'bg-muted text-muted-foreground border-border',
      accent: 'bg-muted-foreground',
    };
  };

  const styles = getStageStyles();

  return (
    <div className="flex flex-col min-w-[340px] max-w-[340px] h-full">
      {/* Header */}
      <div className={`relative overflow-hidden flex items-center justify-between p-4 mb-4 rounded-2xl border backdrop-blur-sm ${styles.header}`}>
        {/* Accent bar */}
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${styles.accent}`} />

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
