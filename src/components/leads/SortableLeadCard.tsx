import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Lead } from '@/types';
import { PipelineLeadCard } from './PipelineLeadCard';

interface SortableLeadCardProps {
  lead: Lead;
  onClick?: (lead: Lead) => void;
}

export const SortableLeadCard = ({ lead, onClick }: SortableLeadCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      onClick={(e) => {
        // Só abre o modal se não estiver arrastando
        if (!isDragging) {
          e.stopPropagation();
          onClick?.(lead);
        }
      }}
    >
      <PipelineLeadCard lead={lead} isDragging={isDragging} />
    </div>
  );
};
