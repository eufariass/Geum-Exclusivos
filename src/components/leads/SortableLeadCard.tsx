import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Lead } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Home, Calendar, GripVertical, Building2 } from 'lucide-react';
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
  };

  const isVenda = lead.tipo_interesse === 'Venda';

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className={`
          group relative overflow-hidden
          bg-gradient-to-br from-background/95 to-background/80 
          backdrop-blur-sm border-border/50
          hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5
          transition-all duration-300 cursor-pointer
          ${isDragging
            ? 'opacity-50 scale-105 shadow-2xl ring-2 ring-primary z-50'
            : 'hover:-translate-y-0.5'
          }
        `}
        onClick={() => onClick?.(lead)}
      >
        {/* Barra lateral colorida */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${isVenda ? 'bg-gradient-to-b from-pink-500 to-rose-600' : 'bg-gradient-to-b from-blue-500 to-cyan-600'}`} />

        <div className="p-4 pl-5">
          {/* Header: Nome e Badge */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* Drag Handle */}
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing flex-shrink-0 p-1 -ml-1 rounded hover:bg-muted/50 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
              </div>
              <h4 className="font-semibold text-sm text-foreground truncate">
                {lead.nome}
              </h4>
            </div>
            <Badge
              variant="outline"
              className={`text-[10px] font-medium px-2 py-0.5 border-0 ${isVenda
                  ? 'bg-pink-500/15 text-pink-400'
                  : 'bg-blue-500/15 text-blue-400'
                }`}
            >
              {lead.tipo_interesse}
            </Badge>
          </div>

          {/* Informações de Contato */}
          <div className="space-y-2 mb-3">
            {lead.telefone && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground group/item">
                <Phone className="h-3.5 w-3.5 flex-shrink-0 opacity-50" />
                <span className="truncate">{lead.telefone}</span>
              </div>
            )}
            {lead.email && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground group/item">
                <Mail className="h-3.5 w-3.5 flex-shrink-0 opacity-50" />
                <span className="truncate">{lead.email}</span>
              </div>
            )}
          </div>

          {/* Imóvel vinculado */}
          {(lead as any).imovel && (
            <div className="flex items-center gap-2 text-xs p-2.5 bg-muted/30 rounded-lg mb-3 border border-border/30">
              <Building2 className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="font-mono font-medium text-foreground truncate">
                  {(lead as any).imovel.codigo}
                </p>
                {(lead as any).imovel.endereco && (
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                    {(lead as any).imovel.endereco}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Footer: Data */}
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground/70 pt-2 border-t border-border/30">
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
        </div>
      </Card>
    </div>
  );
};
