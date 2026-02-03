import type { Lead } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, Building2, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PipelineLeadCardProps {
  lead: Lead;
  isDragging?: boolean;
}

export const PipelineLeadCard = ({ lead, isDragging }: PipelineLeadCardProps) => {
  const isVenda = lead.tipo_interesse === 'Venda';

  return (
    <Card
      className={`
        relative overflow-hidden
        bg-gradient-to-br from-background/95 to-background/80 
        backdrop-blur-sm border-border/50
        transition-all duration-200
        ${isDragging
          ? 'shadow-2xl scale-105 rotate-2 ring-2 ring-primary opacity-95'
          : 'shadow-md'
        }
      `}
    >
      {/* Barra lateral colorida */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${isVenda ? 'bg-gradient-to-b from-pink-500 to-rose-600' : 'bg-gradient-to-b from-blue-500 to-cyan-600'}`} />

      <div className="p-4 pl-5 space-y-3">
        {/* Header */}
        <div className="flex justify-between items-start gap-2">
          <h4 className="font-semibold text-sm text-foreground leading-tight line-clamp-2">
            {lead.nome}
          </h4>
          <Badge
            variant="outline"
            className={`text-[10px] font-medium px-2 py-0.5 border-0 flex-shrink-0 ${isVenda
                ? 'bg-pink-500/15 text-pink-400'
                : 'bg-blue-500/15 text-blue-400'
              }`}
          >
            {lead.tipo_interesse}
          </Badge>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-2">
          {(lead as any).imovel && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg border border-border/30">
              <Building2 className="h-3.5 w-3.5 opacity-70" />
              <span className="truncate font-mono font-medium">{(lead as any).imovel.codigo}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-[10px] text-muted-foreground/70">
            {lead.telefone && (
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3 opacity-50" />
                <span className="truncate max-w-[100px]">{lead.telefone}</span>
              </div>
            )}
            <div className="flex items-center gap-1 ml-auto">
              <Calendar className="h-3 w-3 opacity-50" />
              <span>
                {lead.created_at
                  ? formatDistanceToNow(new Date(lead.created_at), {
                    addSuffix: true,
                    locale: ptBR,
                  }).replace('há ', '')
                  : ''}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
