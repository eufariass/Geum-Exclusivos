import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Lead } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Home, Calendar, GripVertical } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
    <div ref={setNodeRef} style={style}>
      <Card
        className={`
          p-3 hover:shadow-md transition-shadow cursor-pointer
          ${isDragging ? 'shadow-xl ring-2 ring-primary' : ''}
        `}
        onClick={() => onClick?.(lead)}
      >
        {/* Nome e Tipo de Interesse */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Drag Handle - APENAS este ícone arrasta */}
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            <h4 className="font-semibold text-sm truncate">{lead.nome}</h4>
          </div>
          <Badge variant={lead.tipo_interesse === 'Venda' ? 'default' : 'secondary'} className="text-xs flex-shrink-0">
            {lead.tipo_interesse}
          </Badge>
        </div>

        {/* Informações de Contato */}
        <div className="space-y-1.5 mb-3">
          {lead.telefone && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{lead.telefone}</span>
            </div>
          )}
          {lead.email && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{lead.email}</span>
            </div>
          )}
        </div>

        {/* Imóvel (se tiver imovel vinculado) */}
        {(lead as any).imovel && (
          <div className="flex items-start gap-2 text-xs text-muted-foreground mb-2 p-2 bg-muted/50 rounded">
            <Home className="h-3 w-3 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{(lead as any).imovel.codigo}</p>
              <p className="truncate text-[10px]">{(lead as any).imovel.endereco}</p>
            </div>
          </div>
        )}

        {/* Data de Criação */}
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-2 border-t">
          <Calendar className="h-3 w-3" />
          <span>
            {lead.created_at
              ? formatDistanceToNow(new Date(lead.created_at), {
                  addSuffix: true,
                  locale: ptBR,
                })
              : 'Data desconhecida'}
          </span>
        </div>
      </Card>
    </div>
  );
};
